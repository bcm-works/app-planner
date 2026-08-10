import type { ComponentChildren } from "preact";

interface Props {
  children: ComponentChildren;
}

export default function Layout({ children }: Props) {
  return (
    <div class="layout">
      <header>
        <nav>
          <a href="/">Home</a> <a href="/tasks">Tasks</a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
