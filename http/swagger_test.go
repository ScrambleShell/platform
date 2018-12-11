package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"mime"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/influxdata/platform"
	"github.com/influxdata/platform/inmem"
	"github.com/influxdata/platform/kit/prom"
	"github.com/influxdata/platform/mock"
	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest"
)

func TestValidSwagger(t *testing.T) {
	data, err := ioutil.ReadFile("./swagger.yml")
	if err != nil {
		t.Fatalf("unable to read swagger specification: %v", err)
	}
	swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromYAMLData(data)
	if err != nil {
		t.Fatalf("unable to load swagger specification: %v", err)
	}
	if err := swagger.Validate(context.Background()); err != nil {
		t.Errorf("invalid swagger specification: %v", err)
	}
}

func TestValidCurSwagger(t *testing.T) {
	data, err := ioutil.ReadFile("./cur_swagger.yml")
	if err != nil {
		t.Fatalf("unable to read swagger specification: %v", err)
	}
	swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromYAMLData(data)
	if err != nil {
		t.Fatalf("unable to load swagger specification: %v", err)
	}
	if err := swagger.Validate(context.Background()); err != nil {
		t.Errorf("invalid swagger specification: %v", err)
	}
}

// LOGIC:
// Perhaps the swagger test will look up each
// route of the swagger doc in an initialization function.
// Then, initialization is run
// Then test is run against the entire server.
// then fill in the parameters using examples
// that'll setup the basis of an HTTP request
// fill in the request body if it exists
// make request
// get response and compare response to example response related to status
// Perhaps allow a custom response checker (useful for date/times)

// types of tests
// 1. if it is a resource then it should hae the standard CRUD operations
// 2. Everything has a description
// 3. Check consistency of status messages
// 4. everything should have a 404 if not found
// 5. every endpoint in the router has a route in swagger
// 6. resource endpoints should be plural named

// skipList looks up path/verbs and returns issues.
// if there is an issue the test is skipped
func skipList(path, verb string) string {
	switch {
	case strings.HasPrefix(path, "/api/v2/sign"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/orgs/{orgID}/"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/buckets/{bucketID}/"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/dashboards"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/sources"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/macros"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/query/"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/tasks/"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/telegrafs/{telegrafID}/"):
		return "TODO(goller): ignore until core functionality is tested"
	case strings.HasPrefix(path, "/api/v2/views/{viewID}/"):
		return "TODO(goller): ignore until core functionality is tested"
	case path == "/api/v2/query" && verb == "POST":
		return "https://github.com/influxdata/platform/issues/2106"
	case path == "/health" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/2021"
	case path == "/api/v2/macros/{macroID}" && verb == "DELETE":
		return "https://github.com/influxdata/platform/issues/1846"
	case path == "/api/v2/authorizations" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1861"
	case path == "/api/v2/authorizations" && verb == "POST":
		return "https://github.com/influxdata/platform/issues/1881"
	case path == "/api/v2/authorizations/{authID}" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1881"
	case path == "/api/v2/authorizations/{authID}" && verb == "PATCH":
		return "https://github.com/influxdata/platform/issues/1881"
	case path == "/api/v2/buckets" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1881"
	case path == "/api/v2/telegrafs" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1947"
	case path == "/api/v2/telegrafs" && verb == "POST":
		return "https://github.com/influxdata/platform/issues/1947"
	case path == "/api/v2" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1873"
	case path == "/api/v2/dashboards" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1902"
	case path == "/api/v2/dashboards" && verb == "POST":
		return "https://github.com/influxdata/platform/issues/1902"
	case path == "/api/v2/sources" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1897"
	case path == "/api/v2/orgs" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1913"
	case path == "/api/v2/query" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1918"
	case path == "/api/v2/sources/{sourceID}/health" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1920"
	case path == "/api/v2/telegrafs/{telegrafID}/members" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/1921"
	case path == "/api/v2/telegrafs/{telegrafID}/members" && verb == "POST":
		return "https://github.com/influxdata/platform/issues/1921"
	case path == "/api/v2/ready" && verb == "GET":
		return "https://github.com/influxdata/platform/issues/200000000"
	case path == "/api/v2/tasks" && verb == "GET":
		return "skipping because tasks doesn't have an inmem impl"
	case path == "/api/v2/tasks" && verb == "POST":
		return "skipping because tasks doesn't have an inmem impl"
	default:
		return ""
	}
}

var (
	// This mock id and token are always returned for _all_ ids and tokens.
	mockID     = int64(100)
	mockTime   = time.Unix(499155720, 0)
	setupToken = "secret"
)

const (
	// PreconditionExt is used to search for operations
	// that must run as preconditons for an operation.
	PreconditionExt = "x-precondition-operations"
)

func TestHowdy(t *testing.T) {
	swagger := initSwagger(t)
	pathItems := swaggerPathItems(t, swagger)

	for _, item := range pathItems {
		t.Run(item.Path+" "+item.Verb, func(t *testing.T) {
			if msg := skipList(item.Path, item.Verb); msg != "" {
				t.Skip(msg)
				return
			}
			ts := initServer(t)
			defer ts.Close()

			conds := findPreconditions(item, pathItems)
			for _, cond := range conds {
				if cond.Path == "" || cond.Verb == "" {
					t.Errorf("unknown precondition for path %s and verb %s", item.Path, item.Verb)
					return
				}

				res, err := doRequest(t, ts, setupToken, cond)
				if err != nil {
					t.Errorf("failed to request precondition: %v", err)
					return
				}

				if res.StatusCode >= 400 {
					t.Errorf("precondition failed: %s %s", cond.Path, cond.Verb)
					for _, cond := range conds {
						t.Errorf("preconditions: %s %s", cond.Path, cond.Verb)
					}
					t.Logf("Status: %d", res.StatusCode)
					t.Logf("Headers %v", res.Header)
					body, err := ioutil.ReadAll(res.Body)
					if err == nil {
						t.Logf("Body %s", body)
						res.Body.Close()
					}
					return
				}
			}
			res, err := doRequest(t, ts, setupToken, item)
			if err != nil {
				t.Errorf("unable to retrieve http response: %v", err)
				return
			}
			body, err := ioutil.ReadAll(res.Body)
			res.Body.Close()
			if err != nil {
				t.Logf("Status: %d", res.StatusCode)
				t.Logf("Headers %v", res.Header)
				t.Errorf("unable to read body: %v", err)
				return
			}

			mediaType := res.Header.Get("Content-Type")
			example := item.responseBody(t, res.StatusCode, mediaType)
			if len(example) == 0 && len(body) == 0 {
				t.Logf("Status: %d", res.StatusCode)
				t.Logf("Headers %v", res.Header)
				t.Logf("no example and no body: %s", t.Name())
				return
			}
			got := strings.TrimSpace(string(body))
			want := string(example)
			if eq, _ := jsonEqual(got, want); !eq {
				t.Logf("Status: %d", res.StatusCode)
				t.Logf("Headers %v", res.Header)
				t.Errorf("\n***%s***\n,\nwant\n***%s***", got, want)
			}

			if err := item.validExample(t, res.StatusCode, mediaType); err != nil {
				t.Errorf("example does not follow schema: %v", err)
			}

			var value interface{}
			if err := json.Unmarshal(body, &value); err != nil {
				t.Logf("invalid body: %s", got)
				t.Errorf("unable to unmarshal body: %v", err)
				return
			}
			if err := item.validResponse(t, res.StatusCode, mediaType, value); err != nil {
				t.Errorf("response does not follow schema: %v", err)
			}
		})
	}
}

// swaggerID returns auto-incremented ids used for testing.
type swaggerID struct {
	id int64
}

func (s *swaggerID) ID() platform.ID {
	s.id++
	return platform.ID(s.id)
}

func handler(t *testing.T) http.Handler {
	svc := &inmem.Service{
		IDGenerator:    &swaggerID{id: mockID}, // start at mockID
		TokenGenerator: mock.NewTokenGenerator(setupToken, nil),
	}
	svc.WithTime(func() time.Time {
		return mockTime
	})

	logger := zaptest.NewLogger(t)
	handlerConfig := &APIBackend{
		Logger: logger,
		/*
		   NewBucketService:                source.NewBucketService,
		   NewQueryService:                 source.NewQueryService,
		*/
		PointsWriter:         &mock.PointsWriter{},
		AuthorizationService: svc,
		BucketService:        svc,
		//SessionService:                  svc,
		UserService:                svc,
		OrganizationService:        svc,
		UserResourceMappingService: svc,
		DashboardService:           svc,
		//DashboardOperationLogService:    svc,
		//BucketOperationLogService:       svc,
		//UserOperationLogService:         svc,
		//OrganizationOperationLogService: svc,
		ViewService: svc,
		//SourceService:                   svc,
		MacroService:              svc,
		BasicAuthService:          svc,
		OnboardingService:         svc,
		ScraperTargetStoreService: svc,
		TelegrafService:           svc,
		//ProxyQueryService:               storageQueryService,
		//TaskService:                     taskSvc,
		//ChronografService:               chronografSvc,
	}

	reg := prom.NewRegistry()
	reg.MustRegister(prometheus.NewGoCollector())
	reg.WithLogger(logger)
	h := NewHandlerFromRegistry("platform", reg)
	h.Handler = NewPlatformHandler(handlerConfig)
	return h
}

func initServer(t *testing.T) *httptest.Server {
	ts := httptest.NewServer(handler(t))
	ts.Config.ErrorLog, _ = zap.NewStdLogAt(zaptest.NewLogger(t), zapcore.PanicLevel)
	return ts
}

func initSwagger(t *testing.T) *openapi3.Swagger {
	t.Helper()
	data, err := ioutil.ReadFile("./swagger.yml")
	if err != nil {
		t.Fatalf("unable to read swagger specification: %v", err)
	}
	swagger, err := openapi3.NewSwaggerLoader().LoadSwaggerFromYAMLData(data)
	if err != nil {
		t.Fatalf("unable to load swagger specification: %v", err)
	}

	return swagger
}

func doRequest(t *testing.T, ts *httptest.Server, token string, item pathItem) (*http.Response, error) {
	req, err := item.request(t, ts.URL)
	if err != nil {
		t.Errorf("unable to create request: %v", err)
		return nil, err
	}
	SetToken(token, req)
	return ts.Client().Do(req)
}

// swaggerPathItems returns
func swaggerPathItems(t *testing.T, swagger *openapi3.Swagger) []pathItem {
	t.Helper()

	bp := basePath("", &swagger.Servers)
	pathItems := []pathItem{}
	for p, item := range swagger.Paths {
		for verb, op := range item.Operations() {
			pathItems = append(pathItems, pathItem{
				Path: path.Clean(basePath(bp, op.Servers) + p),
				Verb: verb,
				Op:   op,
			})
		}
	}

	sort.Slice(pathItems, func(i, j int) bool {
		if pathItems[i].Path == pathItems[j].Path {
			return pathItems[i].Verb < pathItems[j].Verb
		}
		return pathItems[i].Path < pathItems[j].Path
	})

	return pathItems
}

func basePath(defaultPath string, servers *openapi3.Servers) string {
	if servers == nil {
		return defaultPath
	}
	for _, server := range *servers {
		if server.URL != "" {
			return server.URL
		}
	}
	return defaultPath
}

func findOperations(ids []string, pathItems []pathItem) []pathItem {
	res := make([]pathItem, len(ids))
	for _, p := range pathItems {
		if p.Op.OperationID == "" {
			continue
		}

		for i, id := range ids {
			if p.Op.OperationID == id {
				res[i] = p
			}
		}
	}
	return res
}

func findPreconditions(p pathItem, pathItems []pathItem) []pathItem {
	o, ok := p.Op.Extensions[PreconditionExt]
	if !ok {
		return nil
	}
	ops := []string{}
	err := json.Unmarshal(o.(json.RawMessage), &ops)
	if err != nil {
		return nil
	}

	return findOperations(ops, pathItems)
}

type pathItem struct {
	Path string
	Verb string
	Op   *openapi3.Operation
}

func (p pathItem) request(t *testing.T, url string) (*http.Request, error) {
	t.Helper()
	path, err := p.requestPath(t, url)
	if err != nil {
		return nil, err
	}

	body, err := p.requestBody(t)
	if err != nil {
		return nil, err
	}

	return http.NewRequest(p.Verb, path, body)
}

func (p pathItem) requestPath(t *testing.T, basePath string) (path string, err error) {
	path = basePath + p.Path
	if p.Op == nil {
		fmt.Printf("OP %v\n", p)
	}
	for _, param := range p.Op.Parameters {
		switch param.Value.In {
		case openapi3.ParameterInPath:
			path = p.replacePathParam(t, path, param.Value)
		case openapi3.ParameterInQuery:
			path, err = p.addQueryParam(t, path, param.Value)
			if err != nil {
				return
			}
		}
	}
	u, err := url.Parse(path)
	if err != nil {
		return
	}
	return u.String(), err
}

func (p pathItem) replacePathParam(t *testing.T, path string, param *openapi3.Parameter) string {
	if param.Example == nil {
		return path
	}
	example, ok := param.Example.(string)
	if !ok {
		t.Errorf("invalid path parameter type: %t", param.Example)
		return path
	}
	name := "{" + param.Name + "}"
	path = strings.Replace(path, name, example, 1)
	return path
}

func (p pathItem) addQueryParam(t *testing.T, path string, param *openapi3.Parameter) (string, error) {
	if param.Example == nil {
		return path, nil
	}

	u, err := url.Parse(path)
	if err != nil {
		return path, err
	}
	query := u.Query()
	example := fmt.Sprintf("%v", param.Example)
	query.Add(param.Name, example)
	u.RawQuery = query.Encode()
	return u.String(), nil
}

func (p pathItem) requestBody(t *testing.T) (io.Reader, error) {
	var body io.Reader
	if p.Op.RequestBody != nil &&
		p.Op.RequestBody.Value != nil &&
		p.Op.RequestBody.Value.Content != nil &&
		p.Op.RequestBody.Value.Required {
		if len(p.Op.RequestBody.Value.Content) > 1 {
			t.Logf("multiple request value conent types")
		}
		for _, content := range p.Op.RequestBody.Value.Content {
			if content.Example == nil {
				continue
			}
			b, err := json.Marshal(content.Example)
			if err != nil {
				t.Errorf("unable to marshal example response: %v", err)
				return nil, err
			}
			body = bytes.NewBuffer(b)
		}
	}
	return body, nil
}

func (p pathItem) mediaType(t *testing.T, status int, contentType string) *openapi3.MediaType {
	t.Helper()
	if p.Op.Responses == nil {
		return nil
	}

	res, ok := p.Op.Responses[strconv.Itoa(status)]
	if !ok {
		res = p.Op.Responses["default"]
	}

	if res == nil || res.Value == nil || res.Value.Content == nil {
		return nil
	}

	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		t.Errorf("unable to parse contentType '%v': %v", contentType, err)
		return nil
	}

	content, ok := res.Value.Content[mediaType]
	if !ok {
		t.Errorf("unknown mediaType %s", mediaType)
		return nil
	}
	return content
}

func (p pathItem) example(t *testing.T, status int, contentType string) interface{} {
	content := p.mediaType(t, status, contentType)
	if content == nil {
		return nil
	}
	return content.Example
}

func (p pathItem) validExample(t *testing.T, status int, contentType string) error {
	content := p.mediaType(t, status, contentType)
	if content == nil {
		return nil
	}
	return content.Schema.Value.VisitJSON(content.Example)
}

func (p pathItem) validResponse(t *testing.T, status int, contentType string, value interface{}) error {
	content := p.mediaType(t, status, contentType)
	if content == nil {
		return nil
	}
	return content.Schema.Value.VisitJSON(value)
}

func (p pathItem) responseBody(t *testing.T, status int, contentType string) []byte {
	ex := p.example(t, status, contentType)
	if ex == nil {
		return nil
	}

	b, err := json.Marshal(ex)
	if err != nil {
		t.Errorf("unable to marshal example response: %v", err)
		return nil
	}

	return b
}
