package main

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"time"
)

type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusDeleted    TaskStatus = "deleted"
)

func (s TaskStatus) Valid() bool {
	switch s {
	case TaskStatusPending, TaskStatusInProgress, TaskStatusCompleted, TaskStatusDeleted:
		return true
	}
	return false
}

type Task struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	StartDate   *string    `json:"start_date"`
	EndDate     *string    `json:"end_date"`
	Status      TaskStatus `json:"status"`
	ProjectID   *string    `json:"project_id"`
	OwnerID     *string    `json:"owner_id"`
	CreatedDate time.Time  `json:"created_date"`
	UpdatedDate time.Time  `json:"updated_date"`
}

type TaskStore struct {
	db *sql.DB
}

var store *TaskStore

func newUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

const taskColumns = `id, title, description, start_date, end_date, status, project_id, owner_id, created_date, updated_date`

func (s *TaskStore) List(includeDeleted bool, ownerID, projectID string) ([]*Task, error) {
	query := `SELECT ` + taskColumns + ` FROM tasks WHERE 1=1`
	args := []any{}
	if !includeDeleted {
		query += ` AND status != 'deleted'`
	}
	if ownerID != "" {
		query += ` AND owner_id = ?`
		args = append(args, ownerID)
	}
	if projectID != "" {
		query += ` AND project_id = ?`
		args = append(args, projectID)
	}
	query += ` ORDER BY created_date DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := []*Task{}
	for rows.Next() {
		t, err := scanTask(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (s *TaskStore) Create(task *Task) error {
	_, err := s.db.Exec(
		`INSERT INTO tasks (`+taskColumns+`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		task.ID, task.Title, task.Description, task.StartDate, task.EndDate,
		string(task.Status), task.ProjectID, task.OwnerID,
		task.CreatedDate.Format(time.RFC3339), task.UpdatedDate.Format(time.RFC3339),
	)
	return err
}

func (s *TaskStore) Get(id string) (*Task, error) {
	row := s.db.QueryRow(`SELECT `+taskColumns+` FROM tasks WHERE id = ?`, id)
	return scanTask(row)
}

func (s *TaskStore) Update(task *Task) error {
	_, err := s.db.Exec(
		`UPDATE tasks SET title=?, description=?, start_date=?, end_date=?, status=?, project_id=?, owner_id=?, updated_date=? WHERE id=?`,
		task.Title, task.Description, task.StartDate, task.EndDate,
		string(task.Status), task.ProjectID, task.OwnerID,
		task.UpdatedDate.Format(time.RFC3339), task.ID,
	)
	return err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanTask(s scanner) (*Task, error) {
	var t Task
	var status, createdStr, updatedStr string
	if err := s.Scan(
		&t.ID, &t.Title, &t.Description,
		&t.StartDate, &t.EndDate,
		&status, &t.ProjectID, &t.OwnerID,
		&createdStr, &updatedStr,
	); err != nil {
		return nil, err
	}
	t.Status = TaskStatus(status)
	var err error
	if t.CreatedDate, err = time.Parse(time.RFC3339, createdStr); err != nil {
		return nil, fmt.Errorf("parse created_date: %w", err)
	}
	if t.UpdatedDate, err = time.Parse(time.RFC3339, updatedStr); err != nil {
		return nil, fmt.Errorf("parse updated_date: %w", err)
	}
	return &t, nil
}
