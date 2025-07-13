import { auth } from "@/auth";
import { getSelectedModelsAndValidateApiKeys } from "@/db/agent-config";
import { getTasksByUserId } from "@/db/tasks";
import { cookies } from "next/headers";
import { AgentUI } from "./_components/agent-ui";

export default async function Page() {
  const cookieStore = await cookies();
  const session = await auth();

  let id;
  if (!session) {
    id = cookieStore.get("guest_id")?.value;
    if (!id) {
      throw new Error("Issue with cookies: please refresh.");
    }
  } else {
    id = session.id;
  }

  const initTasks = await getTasksByUserId(id);
  const selectedModels = await getSelectedModelsAndValidateApiKeys(id);

  return (
    <div data-lk-theme="default" className="h-full w-full flex flex-col bg-[var(--lk-bg)] p-6">
      <AgentUI initTasks={initTasks} selectedModels={selectedModels} />
    </div>
  );
}
