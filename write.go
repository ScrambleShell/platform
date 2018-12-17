package platform

import (
	"context"
	"io"
)

// WriteService writes data read from the reader.
type WriteService interface {
	Write(ctx context.Context, r io.Reader) error
}
