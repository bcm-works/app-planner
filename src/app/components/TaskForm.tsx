import type { Task } from "@/app/types.ts";

const STATUSES = ["pending", "in_progress", "completed"] as const;

interface Props {
  action: string;
  task?: Task;
  submitLabel?: string;
}

export default function TaskForm({ action, task, submitLabel = "Save" }: Props) {
  const currentStatus = task?.status ?? "pending";
  return (
    <form method="post" action={action} class="task-form">
      <label>
        Title
        <input name="title" type="text" value={task?.title ?? ""} required />
      </label>
      <label>
        Description
        <textarea name="description">{task?.description ?? ""}</textarea>
      </label>
      <label>
        Status
        <select name="status">
          {STATUSES.map((s) => (
            <option key={s} value={s} selected={s === currentStatus}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <div class="field-row">
        <label>
          Start date
          <input name="start_date" type="date" value={task?.start_date ?? ""} />
        </label>
        <label>
          End date
          <input name="end_date" type="date" value={task?.end_date ?? ""} />
        </label>
      </div>
      <div class="form-actions">
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
