import { getTasks } from "@/db/tasks";
import { AgentUI } from "./_components/agent-ui";

export default async function Page() {
  const initTasks = await getTasks();

  return (
    <div data-lk-theme="default" className="h-full w-full flex flex-col bg-[var(--lk-bg)] p-6">
      <AgentUI initTasks={initTasks} />
    </div>
  );
}
