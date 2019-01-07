package gather

import (
	"context"
	"encoding/json"
	"time"

	"github.com/influxdata/platform/tsdb"

	"github.com/influxdata/platform"
	"github.com/influxdata/platform/nats"
	"github.com/influxdata/platform/storage"
	"go.uber.org/zap"
)

// PointWriter will use the storage.PointWriter interface to record metrics.
type PointWriter struct {
	Writer storage.PointsWriter
}

// Record the metrics and write using storage.PointWriter interface.
func (s PointWriter) Record(collected MetricsCollection) error {
	ps, err := collected.MetricsSlice.Points()
	if err != nil {
		return err
	}
	ps, err = tsdb.ExplodePoints(collected.OrgID, collected.BucketID, ps)
	if err != nil {
		return err
	}
	return s.Writer.WritePoints(ps)
}

// PlatformWriter will use the writer interface to record the metrics.
type PlatformWriter struct {
	Writer  platform.WriteService
	Timeout time.Duration
}

// Record the metrics and write using writer interface.
func (s PlatformWriter) Record(collected MetricsCollection) error {
	r, err := collected.MetricsSlice.Reader()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), s.Timeout)
	defer cancel()
	s.Writer.Write(ctx,
		collected.OrgID,
		collected.BucketID,
		r,
	)

	return nil
}

// Recorder record the metrics of a time based.
type Recorder interface {
	//Subscriber nats.Subscriber
	Record(collected MetricsCollection) error
}

// RecorderHandler implements nats.Handler interface.
type RecorderHandler struct {
	Recorder Recorder
	Logger   *zap.Logger
}

// Process consumes job queue, and use recorder to record.
func (h *RecorderHandler) Process(s nats.Subscription, m nats.Message) {
	defer m.Ack()
	collected := new(MetricsCollection)
	err := json.Unmarshal(m.Data(), &collected)
	if err != nil {
		h.Logger.Error("recorder handler error", zap.Error(err))
		return
	}
	err = h.Recorder.Record(*collected)
	if err != nil {
		h.Logger.Error("recorder handler error", zap.Error(err))
	}
}
