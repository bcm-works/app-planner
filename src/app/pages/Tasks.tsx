import type { Task } from "@/app/types.ts";
import Layout from "@/app/components/Layout.tsx";
import TaskForm from "@/app/components/TaskForm.tsx";
import TaskItem from "@/app/components/TaskItem.tsx";

interface Props {
  tasks: Task[];
}

export default function TasksPage({ tasks }: Props) {
  return (
    <Layout>
      <h1>Tasks</h1>
      <details class="add-task" open={tasks.length === 0}>
        <summary>Add Task</summary>
        <TaskForm action="/tasks" submitLabel="Create Task" />
      </details>
      {tasks.length === 0 ?
        <p class="empty">No tasks yet. Use the form above to create one.</p> :
        (
          <ul class="task-list">
            {tasks.map((task) => <TaskItem key={task.id} task={task} />)}
          </ul>
        )}
    </Layout>
  );
}
