package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestMain(m *testing.M) {
	db, err := openDB(":memory:")
	if err != nil {
		panic("failed to open test db: " + err.Error())
	}
	store = &TaskStore{db: db}
	os.Exit(m.Run())
}

func setupRouter() *chi.Mux {
	r := chi.NewRouter()
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "route not found")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	})
	r.Get("/api/health", ApiHealth)
	r.Get("/api/tasks", listTasks)
	r.Post("/api/tasks", createTask)
	r.Get("/api/tasks/{id}", getTask)
	r.Patch("/api/tasks/{id}", patchTask)
	r.Delete("/api/tasks/{id}", deleteTask)
	return r
}

func resetStore() {
	store.db.Exec("DELETE FROM tasks")
}

func TestHealth(t *testing.T) {
	r := setupRouter()
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var body map[string]string
	json.NewDecoder(rec.Body).Decode(&body)
	if body["status"] != "ok" {
		t.Fatalf("expected status=ok, got %v", body)
	}
}

func TestCreateAndGetTask(t *testing.T) {
	resetStore()
	r := setupRouter()

	body := `{"title":"Test task","end_date":"2026-09-01"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var task Task
	json.NewDecoder(rec.Body).Decode(&task)
	if task.ID == "" || task.Title != "Test task" || task.Status != TaskStatusPending {
		t.Fatalf("unexpected task: %+v", task)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/tasks/"+task.ID, nil)
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec2.Code)
	}
}

func TestListTasks_FilterAndDeleted(t *testing.T) {
	resetStore()
	r := setupRouter()

	// Create two tasks
	for _, title := range []string{"Task A", "Task B"} {
		body := `{"title":"` + title + `"}`
		req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(httptest.NewRecorder(), req)
	}

	// List
	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	var tasks []Task
	json.NewDecoder(rec.Body).Decode(&tasks)
	if len(tasks) != 2 {
		t.Fatalf("expected 2 tasks, got %d", len(tasks))
	}

	// Delete one
	id := tasks[0].ID
	req2 := httptest.NewRequest(http.MethodDelete, "/api/tasks/"+id, nil)
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected 200 on delete, got %d", rec2.Code)
	}

	// List without deleted
	req3 := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	rec3 := httptest.NewRecorder()
	r.ServeHTTP(rec3, req3)
	var tasks3 []Task
	json.NewDecoder(rec3.Body).Decode(&tasks3)
	if len(tasks3) != 1 {
		t.Fatalf("expected 1 active task, got %d", len(tasks3))
	}

	// List with include_deleted=true
	req4 := httptest.NewRequest(http.MethodGet, "/api/tasks?include_deleted=true", nil)
	rec4 := httptest.NewRecorder()
	r.ServeHTTP(rec4, req4)
	var tasks4 []Task
	json.NewDecoder(rec4.Body).Decode(&tasks4)
	if len(tasks4) != 2 {
		t.Fatalf("expected 2 tasks with include_deleted, got %d", len(tasks4))
	}
}

func TestPatchTask(t *testing.T) {
	resetStore()
	r := setupRouter()

	body := `{"title":"Original"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	var task Task
	json.NewDecoder(rec.Body).Decode(&task)

	patch := `{"title":"Updated","status":"in_progress","project_id":null}`
	req2 := httptest.NewRequest(http.MethodPatch, "/api/tasks/"+task.ID, bytes.NewBufferString(patch))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec2.Code, rec2.Body.String())
	}
	var updated Task
	json.NewDecoder(rec2.Body).Decode(&updated)
	if updated.Title != "Updated" || updated.Status != TaskStatusInProgress {
		t.Fatalf("unexpected updated task: %+v", updated)
	}
}

func TestNotFoundAndMethodNotAllowed(t *testing.T) {
	r := setupRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/unknown", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}

	req2 := httptest.NewRequest(http.MethodPut, "/api/tasks", nil)
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rec2.Code)
	}
}

func TestCreateTask_Validation(t *testing.T) {
	resetStore()
	r := setupRouter()

	// Missing title
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing title, got %d", rec.Code)
	}

	// Blank title
	req2 := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(`{"title":"   "}`))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for blank title, got %d", rec2.Code)
	}

	// Invalid JSON
	req3 := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(`not-json`))
	req3.Header.Set("Content-Type", "application/json")
	rec3 := httptest.NewRecorder()
	r.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid JSON, got %d", rec3.Code)
	}
}
