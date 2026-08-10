import type { Task } from "@/api/types.ts";
import TaskForm from "@/app/components/TaskForm.tsx";

interface Props {
  task: Task;
}

export default function TaskItem({ task }: Props) {
  return (
    <li>
      <details class="task-item">
        <summary>
          <span class="task-title">{task.title}</span>
          <span class="status">({task.status.replace(/_/g, " ")})</span>
        </summary>
        <div class="task-item-body">
          <TaskForm action={`/tasks/${task.id}`} task={task} submitLabel="Update Task" />
          <form method="post" action={`/tasks/${task.id}/delete`} class="delete-form">
            <button type="submit" class="btn-danger">Delete Task</button>
          </form>
        </div>
      </details>
    </li>
  );
}
