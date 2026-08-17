package main

import (
	"encoding/json"
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
	includeDeleted := q.Get("include_deleted") == "true"
	filterOwner := q.Get("owner_id")
	filterProject := q.Get("project_id")

	store.mu.RLock()
	defer store.mu.RUnlock()

	result := make([]*Task, 0, len(store.tasks))
	for _, t := range store.tasks {
		if !includeDeleted && t.Status == TaskStatusDeleted {
			continue
		}
		if filterOwner != "" && (t.OwnerID == nil || *t.OwnerID != filterOwner) {
			continue
		}
		if filterProject != "" && (t.ProjectID == nil || *t.ProjectID != filterProject) {
			continue
		}
		result = append(result, t)
	}

	writeJSON(w, http.StatusOK, result)
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

	store.mu.Lock()
	store.tasks[task.ID] = task
	store.mu.Unlock()

	writeJSON(w, http.StatusCreated, task)
}

// GET /api/tasks/{id}
func getTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	store.mu.RLock()
	task, ok := store.tasks[id]
	store.mu.RUnlock()

	if !ok || task.Status == TaskStatusDeleted {
		writeError(w, http.StatusNotFound, "task not found")
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

	store.mu.Lock()
	defer store.mu.Unlock()

	task, ok := store.tasks[id]
	if !ok || task.Status == TaskStatusDeleted {
		writeError(w, http.StatusNotFound, "task not found")
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

	store.mu.Lock()
	defer store.mu.Unlock()

	task, ok := store.tasks[id]
	if !ok || task.Status == TaskStatusDeleted {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}

	task.Status = TaskStatusDeleted
	task.UpdatedDate = time.Now().UTC()

	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}
