export type TaskStatus = "pending" | "in_progress" | "completed" | "deleted";

export interface Task {
  id: string;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  status: TaskStatus;
  project_id: string | null;
  owner_id: string | null;
  created_date: string;
  updated_date: string;
}

// Fields accepted when creating a task.
export interface CreateTaskBody {
  title: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  // Callers cannot set status=deleted on create.
  status?: Exclude<TaskStatus, "deleted">;
  project_id?: string | null;
  owner_id?: string | null;
}

// All fields are optional on update; omitted fields are left unchanged.
export interface UpdateTaskBody {
  title?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: Exclude<TaskStatus, "deleted">;
  project_id?: string | null;
  owner_id?: string | null;
}
