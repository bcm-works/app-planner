package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// GET /api/tasks
func listTasks(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	tasks, err := store.List(
		q.Get("include_deleted") == "true",
		q.Get("owner_id"),
		q.Get("project_id"),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list tasks")
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}

// POST /api/tasks
func createTask(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Title       *string    `json:"title"`
		Description *string    `json:"description"`
		StartDate   *string    `json:"start_date"`
		EndDate     *string    `json:"end_date"`
		Status      TaskStatus `json:"status"`
		ProjectID   *string    `json:"project_id"`
		OwnerID     *string    `json:"owner_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if body.Title == nil || strings.TrimSpace(*body.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required and must not be blank")
		return
	}

	status := body.Status
	if status == "" {
		status = TaskStatusPending
	} else if status == TaskStatusDeleted || !status.Valid() {
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}

	desc := ""
	if body.Description != nil {
		desc = *body.Description
	}

	now := time.Now().UTC()
	task := &Task{
		ID:          newUUID(),
		Title:       strings.TrimSpace(*body.Title),
		Description: desc,
		StartDate:   body.StartDate,
		EndDate:     body.EndDate,
		Status:      status,
		ProjectID:   body.ProjectID,
		OwnerID:     body.OwnerID,
		CreatedDate: now,
		UpdatedDate: now,
	}

	if err := store.Create(task); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create task")
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

// GET /api/tasks/{id}
func getTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	task, err := store.Get(id)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && task.Status == TaskStatusDeleted) {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get task")
		return
	}

	writeJSON(w, http.StatusOK, task)
}

// PATCH /api/tasks/{id}
func patchTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var raw map[string]json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	task, err := store.Get(id)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && task.Status == TaskStatusDeleted) {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get task")
		return
	}

	if v, ok := raw["title"]; ok {
		var title string
		if err := json.Unmarshal(v, &title); err != nil || strings.TrimSpace(title) == "" {
			writeError(w, http.StatusBadRequest, "title must be non-empty")
			return
		}
		task.Title = strings.TrimSpace(title)
	}

	if v, ok := raw["description"]; ok {
		var desc string
		if err := json.Unmarshal(v, &desc); err != nil {
			writeError(w, http.StatusBadRequest, "invalid description")
			return
		}
		task.Description = desc
	}

	if v, ok := raw["status"]; ok {
		var status TaskStatus
		if err := json.Unmarshal(v, &status); err != nil || status == TaskStatusDeleted || !status.Valid() {
			writeError(w, http.StatusBadRequest, "invalid status")
			return
		}
		task.Status = status
	}

	// Nullable string fields: null clears the field, a string sets it
	for _, field := range []string{"start_date", "end_date", "project_id", "owner_id"} {
		v, ok := raw[field]
		if !ok {
			continue
		}
		if string(v) == "null" {
			setNullableField(task, field, nil)
		} else {
			var s string
			if err := json.Unmarshal(v, &s); err != nil {
				writeError(w, http.StatusBadRequest, "invalid "+field)
				return
			}
			setNullableField(task, field, &s)
		}
	}

	task.UpdatedDate = time.Now().UTC()
	if err := store.Update(task); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update task")
		return
	}

	writeJSON(w, http.StatusOK, task)
}

func setNullableField(t *Task, field string, val *string) {
	switch field {
	case "start_date":
		t.StartDate = val
	case "end_date":
		t.EndDate = val
	case "project_id":
		t.ProjectID = val
	case "owner_id":
		t.OwnerID = val
	}
}

// DELETE /api/tasks/{id}
func deleteTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	task, err := store.Get(id)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && task.Status == TaskStatusDeleted) {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get task")
		return
	}

	task.Status = TaskStatusDeleted
	task.UpdatedDate = time.Now().UTC()
	if err := store.Update(task); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete task")
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}
