"use server";

import { updateSelectedModels } from "@/db/agent-config";
import * as agentConfig from "@/db/agent-config";
import { SelectedModels } from "@/types/agent";
import { getUserId } from "../auth/utils";

export async function getSelectedModels(userId?: string): Promise<SelectedModels | null> {
  try {
    if (!userId) {
      userId = await getUserId();
      if (!userId) {
        throw new Error("No user!");
      }
    }
    return await agentConfig.getSelectedModels(userId);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateUserConfiguration(
  selectedModels: SelectedModels
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const userId = await getUserId();
    const result = await updateSelectedModels(userId, selectedModels);

    return { success: result.success };
  } catch (error) {
    console.error("Failed to update user configuration:", error);
    return {
      success: false,
      errors: ["Failed to update configuration. Please try again."],
    };
  }
}

export async function validateCurrentApiKeys() {
  const userId = await getUserId();

  try {
    return agentConfig.validateCurrentApiKeys(userId);
  } catch (error) {
    throw error;
  }
}
