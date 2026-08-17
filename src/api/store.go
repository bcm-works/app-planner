package main

import (
	"crypto/rand"
	"fmt"
	"sync"
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
	mu    sync.RWMutex
	tasks map[string]*Task
}

var store = &TaskStore{tasks: make(map[string]*Task)}

func newUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
