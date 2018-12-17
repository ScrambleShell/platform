package mock

import (
	"context"
	"io"
)

// WriteService writes data read from the reader.
type WriteService struct {
	WriteF func(context.Context, io.Reader) error
}

// Write calls the mocked WriteF function with arguments.
func (s *WriteService) Write(ctx context.Context, r io.Reader) error {
	return s.WriteF(ctx, r)
}
