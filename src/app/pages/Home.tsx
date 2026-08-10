import Layout from "@/app/components/Layout.tsx";

export default function HomePage() {
  return (
    <Layout>
      <h1>Personal Planner</h1>
      <p>Manage your tasks and projects in one place.</p>
      <a href="/tasks">View Tasks</a>
    </Layout>
  );
}
