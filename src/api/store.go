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
	argN := 1
	if !includeDeleted {
		query += ` AND status != 'deleted'`
	}
	if ownerID != "" {
		query += fmt.Sprintf(` AND owner_id = $%d`, argN)
		args = append(args, ownerID)
		argN++
	}
	if projectID != "" {
		query += fmt.Sprintf(` AND project_id = $%d`, argN)
		args = append(args, projectID)
		argN++
	}
	query += ` ORDER BY created_date DESC`
	_ = argN

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
		`INSERT INTO tasks (`+taskColumns+`) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		task.ID, task.Title, task.Description, task.StartDate, task.EndDate,
		string(task.Status), task.ProjectID, task.OwnerID,
		task.CreatedDate, task.UpdatedDate,
	)
	return err
}

func (s *TaskStore) Get(id string) (*Task, error) {
	row := s.db.QueryRow(`SELECT `+taskColumns+` FROM tasks WHERE id = $1`, id)
	return scanTask(row)
}

func (s *TaskStore) Update(task *Task) error {
	_, err := s.db.Exec(
		`UPDATE tasks SET title=$1, description=$2, start_date=$3, end_date=$4, status=$5, project_id=$6, owner_id=$7, updated_date=$8 WHERE id=$9`,
		task.Title, task.Description, task.StartDate, task.EndDate,
		string(task.Status), task.ProjectID, task.OwnerID,
		task.UpdatedDate, task.ID,
	)
	return err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanTask(s scanner) (*Task, error) {
	var t Task
	var status string
	if err := s.Scan(
		&t.ID, &t.Title, &t.Description,
		&t.StartDate, &t.EndDate,
		&status, &t.ProjectID, &t.OwnerID,
		&t.CreatedDate, &t.UpdatedDate,
	); err != nil {
		return nil, err
	}
	t.Status = TaskStatus(status)
	return &t, nil
}
