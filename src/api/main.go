package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	dbPath := EnvGet("DB_PATH", "../../data/database.sqlite.db")
	db, err := openDB(dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()
	store = &TaskStore{db: db}

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.AllowContentType("application/json", "text/xml"))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost", "https://bcm.works", "https://murty.au", "https://bcm.id.au"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "route not found")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	})

	r.Get("/", ApiHealth)
	r.Get("/api/health", ApiHealth)

	r.Get("/api/tasks", listTasks)
	r.Post("/api/tasks", createTask)
	r.Get("/api/tasks/{id}", getTask)
	r.Patch("/api/tasks/{id}", patchTask)
	r.Delete("/api/tasks/{id}", deleteTask)

	fmt.Println("Server starting at http://localhost:3000")
	http.ListenAndServe(":3000", r)
}
