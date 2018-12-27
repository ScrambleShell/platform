package transformations_test

import (
	"testing"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/semantic"
	_ "github.com/influxdata/platform/query/builtin"
	"github.com/influxdata/platform/query/functions/transformations"
)

func TestAlertFormat_Process(t *testing.T) {
	for _, tc := range []struct {
		name string
		spec *transformations.AlertFormatProcedureSpec
		data []flux.Table
		want []*executetest.Table
	}{
		{
			name: "basic",
			spec: &transformations.AlertFormatProcedureSpec{
				Reduce: []transformations.AlertFormatReduceElement{
					{
						Name: "too_cold",
						// (r) => r._value <= 32
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{Key: &semantic.Identifier{Name: "r"}},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.LessThanEqualOperator,
									Left: &semantic.MemberExpression{
										Object:   &semantic.IdentifierExpression{Name: "r"},
										Property: "_value",
									},
									Right: &semantic.FloatLiteral{Value: 32},
								},
							},
						},
					},
					{
						Name: "too_hot",
						// (r) => r._value >= 212
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{Key: &semantic.Identifier{Name: "r"}},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.GreaterThanEqualOperator,
									Left: &semantic.MemberExpression{
										Object:   &semantic.IdentifierExpression{Name: "r"},
										Property: "_value",
									},
									Right: &semantic.FloatLiteral{Value: 212},
								},
							},
						},
					},
					{
						Name: "just_right",
						// fn omitted.
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), -40.0},
					{execute.Time(2), 72.0},
					{execute.Time(3), 256.25},
				},
			}},
			want: []*executetest.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "_state", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), -40.0, "too_cold"},
					{execute.Time(2), 72.0, "just_right"},
					{execute.Time(3), 256.25, "too_hot"},
				},
			}},
		},
		{
			name: "omit when no predicate passes",
			spec: &transformations.AlertFormatProcedureSpec{
				Reduce: []transformations.AlertFormatReduceElement{
					{
						Name: "too_cold",
						// (r) => r._value <= 32
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{Key: &semantic.Identifier{Name: "r"}},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.LessThanEqualOperator,
									Left: &semantic.MemberExpression{
										Object:   &semantic.IdentifierExpression{Name: "r"},
										Property: "_value",
									},
									Right: &semantic.FloatLiteral{Value: 32},
								},
							},
						},
					},
					{
						Name: "too_hot",
						// (r) => r._value >= 212
						Fn: &semantic.FunctionExpression{
							Block: &semantic.FunctionBlock{
								Parameters: &semantic.FunctionParameters{
									List: []*semantic.FunctionParameter{
										{Key: &semantic.Identifier{Name: "r"}},
									},
								},
								Body: &semantic.BinaryExpression{
									Operator: ast.GreaterThanEqualOperator,
									Left: &semantic.MemberExpression{
										Object:   &semantic.IdentifierExpression{Name: "r"},
										Property: "_value",
									},
									Right: &semantic.FloatLiteral{Value: 212},
								},
							},
						},
					},
				},
			},
			data: []flux.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
				},
				Data: [][]interface{}{
					{execute.Time(1), -40.0},
					{execute.Time(2), 72.0},
					{execute.Time(3), 256.25},
				},
			}},
			want: []*executetest.Table{&executetest.Table{
				ColMeta: []flux.ColMeta{
					{Label: "_time", Type: flux.TTime},
					{Label: "_value", Type: flux.TFloat},
					{Label: "_state", Type: flux.TString},
				},
				Data: [][]interface{}{
					{execute.Time(1), -40.0, "too_cold"},
					// just_right omitted
					{execute.Time(3), 256.25, "too_hot"},
				},
			}},
		},
	} {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			executetest.ProcessTestHelper(
				t,
				tc.data,
				tc.want,
				nil,
				func(d execute.Dataset, c execute.TableBuilderCache) execute.Transformation {
					tr, err := transformations.NewAlertFormatTransformation(d, c, tc.spec)
					if err != nil {
						t.Fatal(err)
					}
					return tr
				},
			)
		})
	}
}
