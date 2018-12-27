package transformations

import (
	"errors"
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const AlertFormatKind = "alert.format"
const AlertStateKey = "_state"

var (
	alertFormatReduceElementType = semantic.NewObjectPolyType(
		map[string]semantic.PolyType{
			"state": semantic.String,
			// Same fn definition as in the builtin join function.
			"fn": semantic.NewFunctionPolyType(semantic.FunctionPolySignature{
				Parameters: map[string]semantic.PolyType{
					"r": semantic.Tvar(1),
				},
				Required: semantic.LabelSet{"r"},
				Return:   semantic.Bool,
			}),
		},
		semantic.LabelSet{"state"},
		semantic.LabelSet{"state", "fn"},
	)

	alertFormatReduceArrayType = semantic.NewArrayPolyType(alertFormatReduceElementType)
)

func init() {
	alertFormatSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"reduce": alertFormatReduceArrayType,
		},
		[]string{"reduce"},
	)

	flux.RegisterFunction("alertFormat", createAlertFormatOpSpec, alertFormatSignature)
	flux.RegisterOpSpec(AlertFormatKind, newAlertFormatOpSpec)
	plan.RegisterProcedureSpec(AlertFormatKind, newAlertFormatProcedure, AlertFormatKind)
	execute.RegisterTransformation(AlertFormatKind, createAlertFormatTransformation)
}

type AlertFormatReduceElement struct {
	Name string                       `json:"name"`
	Fn   *semantic.FunctionExpression `json:"fn"`
}

func (e AlertFormatReduceElement) Copy() AlertFormatReduceElement {
	return AlertFormatReduceElement{Name: e.Name, Fn: e.Fn.Copy().(*semantic.FunctionExpression)}
}

type AlertFormatOpSpec struct {
	Reduce []AlertFormatReduceElement `json:"reduce"`
}

func createAlertFormatOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}

	arr, err := args.GetRequiredArray("reduce", alertFormatReduceArrayType.Nature())
	if err != nil {
		return nil, err
	}

	arrLen := arr.Len()
	if arrLen == 0 {
		return nil, errors.New("alert.format: reduce property must have at least one element")
	}
	spec := &AlertFormatOpSpec{Reduce: make([]AlertFormatReduceElement, arrLen)}
	for i := 0; i < arrLen; i++ {
		v := arr.Get(i)
		if !v.PolyType().Equal(alertFormatReduceElementType) {
			return nil, errors.New("alert.format: invalid type in reduce array")
		}
		name, ok := v.Object().Get("name")
		if !ok {
			return nil, fmt.Errorf("alert.format: reduce element at index %d missing required property 'name'", i)
		}

		spec.Reduce[i] = AlertFormatReduceElement{
			Name: name.Str(),
		}

		f, ok := v.Object().Get("fn")
		if !ok {
			if i == arrLen-1 {
				// Last element is allowed to omit fn.
				continue
			}
			return nil, fmt.Errorf("alert.format: reduce element at index %d missing required property 'fn'", i)
		}
		fn, err := interpreter.ResolveFunction(f.Function())
		if err != nil {
			return nil, err
		}

		spec.Reduce[i].Fn = fn
	}

	return spec, nil
}

func (s *AlertFormatOpSpec) Kind() flux.OperationKind {
	return AlertFormatKind
}

func newAlertFormatOpSpec() flux.OperationSpec {
	return new(AlertFormatOpSpec)
}

type AlertFormatProcedureSpec struct {
	plan.DefaultCost
	Reduce []AlertFormatReduceElement
}

func newAlertFormatProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*AlertFormatOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &AlertFormatProcedureSpec{
		Reduce: spec.Reduce,
	}, nil
}

func (s *AlertFormatProcedureSpec) Kind() plan.ProcedureKind {
	return AlertFormatKind
}

func (s *AlertFormatProcedureSpec) Copy() plan.ProcedureSpec {
	ns := &AlertFormatProcedureSpec{Reduce: make([]AlertFormatReduceElement, len(s.Reduce))}
	for i, r := range s.Reduce {
		ns.Reduce[i] = r.Copy()
	}
	return ns
}

type alertFormatTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache

	predicates []alertFormatNamedPredicate
}

type alertFormatNamedPredicate struct {
	name string
	pred *execute.RowPredicateFn
}

func createAlertFormatTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*AlertFormatProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t, err := NewAlertFormatTransformation(d, cache, s)
	if err != nil {
		return nil, nil, err
	}
	return t, d, nil
}

func NewAlertFormatTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *AlertFormatProcedureSpec) (*alertFormatTransformation, error) {
	ps := make([]alertFormatNamedPredicate, len(spec.Reduce))
	for i, r := range spec.Reduce {
		ps[i].name = r.Name
		if i == len(spec.Reduce)-1 && r.Fn == nil {
			// Special case: last Reduce element's fn allowed to be nil.
			continue
		}

		var err error
		ps[i].pred, err = execute.NewRowPredicateFn(r.Fn)
		if err != nil {
			return nil, err
		}
	}

	return &alertFormatTransformation{
		d:          d,
		cache:      cache,
		predicates: ps,
	}, nil
}

func (t *alertFormatTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	key := tbl.Key()
	if key.HasCol(AlertStateKey) {
		return errors.New("alert.format: cannot process table already containing column '_state'")
	}

	builder, created := t.cache.TableBuilder(key)
	if created {
		if err := execute.AddTableCols(tbl, builder); err != nil {
			return err
		}
		if _, err := builder.AddCol(flux.ColMeta{Label: AlertStateKey, Type: flux.TString}); err != nil {
			return err
		}
	}

	cols := tbl.Cols()
	for i, p := range t.predicates {
		if i == len(t.predicates)-1 && p.pred == nil {
			// Last predicate may be nil.
			continue
		}
		if err := p.pred.Prepare(cols); err != nil {
			return err
		}
	}

	// TODO: use tbl.DoArrow after flux 0.12.
	stateIdx := execute.ColIdx(AlertStateKey, builder.Cols())
	return tbl.Do(func(cr flux.ColReader) error {
		// First, map cr's columns to the builder indexes.
		builderIndexes := make([]int, len(cr.Cols()))
		for j, col := range cr.Cols() {
			n := execute.ColIdx(col.Label, builder.Cols())
			if n < 0 {
				// Column present in cr but not builder. Add it to builder.
				var err error
				n, err = builder.AddCol(col)
				if err != nil {
					return err
				}
			}
			builderIndexes[j] = n
		}

		// Then for every record in cr, find the first passing reduce predicate,
		// and append the appropriate state name.
		l := cr.Len()
		for i := 0; i < l; i++ {
			for pi, p := range t.predicates {
				var pass bool
				if pi == len(t.predicates)-1 && p.pred == nil {
					// Automatic pass if last element has no predicate.
					pass = true
				} else {
					var err error
					pass, err = p.pred.Eval(i, cr)
					if err != nil {
						return err
					}
				}

				// Matching predicate found.
				// It's possible that we loop through t.predicates without hitting this block,
				// in which case that row will not be appended to builder.
				if pass {
					// Append all the values from cr...
					for cj, bj := range builderIndexes {
						if err := execute.AppendCol(bj, cj, cr, builder); err != nil {
							return err
						}
					}
					// ... and add the predicate state name.
					if err := builder.AppendString(stateIdx, p.name); err != nil {
						return err
					}
					break
				}
			}
		}
		return nil
	})
}

func (t *alertFormatTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}
func (t *alertFormatTransformation) UpdateWatermark(id execute.DatasetID, mark execute.Time) error {
	return t.d.UpdateWatermark(mark)
}
func (t *alertFormatTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *alertFormatTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}
