package platform

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/ast/edit"
	"github.com/influxdata/flux/parser"
	"github.com/influxdata/flux/values"
	"github.com/influxdata/platform/task/options"
)

const (
	TaskDefaultPageSize = 100
	TaskMaxPageSize     = 500
)

// Task is a task. 🎊
type Task struct {
	ID              ID     `json:"id,omitempty"`
	Organization    ID     `json:"organizationID"`
	Name            string `json:"name"`
	Status          string `json:"status"`
	Owner           User   `json:"owner"`
	Flux            string `json:"flux"`
	Every           string `json:"every,omitempty"`
	Cron            string `json:"cron,omitempty"`
	Offset          string `json:"offset,omitempty"`
	LatestCompleted string `json:"latest_completed,omitempty"`
}

// Run is a record created when a run of a task is scheduled.
type Run struct {
	ID           ID     `json:"id,omitempty"`
	TaskID       ID     `json:"taskID"`
	Status       string `json:"status"`
	ScheduledFor string `json:"scheduledFor"`
	StartedAt    string `json:"startedAt,omitempty"`
	FinishedAt   string `json:"finishedAt,omitempty"`
	RequestedAt  string `json:"requestedAt,omitempty"`
	Log          Log    `json:"log"`
}

// Log represents a link to a log resource
type Log string

// TaskService represents a service for managing one-off and recurring tasks.
type TaskService interface {
	// FindTaskByID returns a single task
	FindTaskByID(ctx context.Context, id ID) (*Task, error)

	// FindTasks returns a list of tasks that match a filter (limit 100) and the total count
	// of matching tasks.
	FindTasks(ctx context.Context, filter TaskFilter) ([]*Task, int, error)

	// CreateTask creates a new task.
	CreateTask(ctx context.Context, t *Task) error

	// UpdateTask updates a single task with changeset.
	UpdateTask(ctx context.Context, id ID, upd TaskUpdate) (*Task, error)

	// DeleteTask removes a task by ID and purges all associated data and scheduled runs.
	DeleteTask(ctx context.Context, id ID) error

	// FindLogs returns logs for a run.
	FindLogs(ctx context.Context, filter LogFilter) ([]*Log, int, error)

	// FindRuns returns a list of runs that match a filter and the total count of returned runs.
	FindRuns(ctx context.Context, filter RunFilter) ([]*Run, int, error)

	// FindRunByID returns a single run.
	FindRunByID(ctx context.Context, taskID, runID ID) (*Run, error)

	// CancelRun cancels a currently running run.
	CancelRun(ctx context.Context, taskID, runID ID) error

	// RetryRun creates and returns a new run (which is a retry of another run).
	RetryRun(ctx context.Context, taskID, runID ID) (*Run, error)

	// ForceRun forces a run to occur with unix timestamp scheduledFor, to be executed as soon as possible.
	// The value of scheduledFor may or may not align with the task's schedule.
	ForceRun(ctx context.Context, taskID ID, scheduledFor int64) (*Run, error)
}

// TaskUpdate represents updates to a task
type TaskUpdate struct {
	Flux   *string `json:"flux,omitempty"`
	Status *string `json:"status,omitempty"`
	options.Options
}

func (t *TaskUpdate) UnmarshalJSON(data []byte) error {
	// this is a type so we can marshal string into durations nicely
	type TempOptions struct {
		Name string `json:"options,omitempty"`

		// Cron is a cron style time schedule that can be used in place of Every.
		Cron string `json:"cron,omitempty"`

		// Every represents a fixed period to repeat execution.
		Every flux.Duration `json:"every,omitempty"`

		// Offset represents a delay before execution.
		Offset flux.Duration `json:"offset,omitempty"`

		Concurrency int64 `json:"concurrency,omitempty"`

		Retry int64 `json:"retry,omitempty"`
	}

	jo := struct {
		Flux   *string `json:"flux,omitempty"`
		Status *string `json:"status,omitempty"`
		TempOptions
	}{}

	if err := json.Unmarshal(data, &jo); err != nil {
		return err
	}
	t.Name = jo.Name
	t.Cron = jo.Cron
	t.Every = time.Duration(jo.Every)
	t.Offset = time.Duration(jo.Offset)
	t.Concurrency = jo.Concurrency
	t.Retry = jo.Retry
	t.Flux = jo.Flux
	t.Status = jo.Status

	return nil
}

func (t TaskUpdate) Validate() error {
	switch {
	case t.Every != 0 && t.Cron != "":
		return errors.New("cannot specify both every and cron")
	case t.Flux == nil && t.Status == nil && t.Options.IsZero():
		return errors.New("cannot update task without content")
	}
	return nil
}

// UpdateFlux updates the TaskUpdate to go from updating options to updating a flux string, that now has those updated options in it
// It zeros the options in the TaskUpdate.
func (t *TaskUpdate) UpdateFlux(oldFlux string) error {
	if t.Flux != nil {
		return nil
	}
	parsedPKG := parser.ParseSource(oldFlux)
	if ast.Check(parsedPKG) > 0 {
		return ast.GetError(parsedPKG)
	}
	parsed := parsedPKG.Files[0] //TODO: remove this line when flux 0.14 is upgraded into platform
	if t.Every != 0 && t.Cron != "" {
		return errors.New("cannot specify both every and cron")
	}
	// so we don't allocate if we are just changing the status
	if t.Name != "" || t.Every != 0 || t.Cron != "" || t.Offset != 0 {
		op := make(map[string]values.Value, 4)

		switch {
		case t.Name != "":
			op["name"] = values.NewString(t.Name)
		case t.Every != 0:
			op["every"] = values.NewDuration(values.Duration(t.Every))
		case t.Cron != "":
			op["cron"] = values.NewString(t.Cron)
		case t.Offset != 0:
			op["offset"] = values.NewDuration(values.Duration(t.Offset))
		}
		ok, err := edit.Option(parsed, "task", edit.OptionObjectFn(op))
		if err != nil {
			return err
		}
		if !ok {
			return errors.New("unable to edit option")
		}
		t.Options.Zero()
		s := ast.Format(parsed)
		t.Flux = &s
		return nil
	}
	return nil
}

// TaskFilter represents a set of filters that restrict the returned results
type TaskFilter struct {
	After        *ID
	Organization *ID
	User         *ID
	Limit        int
}

// RunFilter represents a set of filters that restrict the returned results
type RunFilter struct {
	Org        *ID
	Task       *ID
	After      *ID
	Limit      int
	AfterTime  string
	BeforeTime string
}

// LogFilter represents a set of filters that restrict the returned results
type LogFilter struct {
	Org  *ID
	Task *ID
	Run  *ID
}
