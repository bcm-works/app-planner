import type { Task } from "@/api/types.ts";
import Layout from "@/app/components/Layout.tsx";

interface Props {
  tasks: Task[];
}

export default function TasksPage({ tasks }: Props) {
  return (
    <Layout>
      <h1>Tasks</h1>
      {tasks.length === 0 ? <p>No tasks yet.</p> : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span> <span class="status">({task.status})</span>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
