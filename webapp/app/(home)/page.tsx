import { auth } from "@/auth";
import { getSelectedModelsAndValidatedApiKeys } from "@/db/agent-config";
import { getTasksByUserId } from "@/db/tasks";
import { cookies } from "next/headers";
import { Agent } from "./_components/agent";

export default async function Page() {
  const cookieStore = await cookies();
  const session = await auth();

  let id;
  if (!session) {
    id = cookieStore.get("guest_id")?.value;
    if (!id) {
      throw new Error("Issue with cookies: please refresh page.");
    }
  } else {
    id = session.id;
  }

  const initTasks = await getTasksByUserId(id);
  const result = await getSelectedModelsAndValidatedApiKeys(id);

  const selectedModels = result?.selectedModels ?? null;
  const apiKeyValidity = result?.apiKeyValidity ?? null;

  return (
    <div className="h-full w-full bg-secondary p-6">
      <Agent
        initTasks={initTasks}
        apiKeyValidity={apiKeyValidity}
        selectedModels={selectedModels}
      />
    </div>
  );
}
