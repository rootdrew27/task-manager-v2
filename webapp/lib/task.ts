export function build_task_obj({
  name,
  is_complete,
  deadline,
  description,
}: {
  name: string;
  is_complete?: boolean;
  deadline?: string | null;
  description?: string | null;
}): TaskInfo {
  return {
    name: name,
    is_complete: is_complete !== null && is_complete !== undefined ? is_complete : false,
    deadline: deadline ?? null,
    description: description ?? null,
  };
}
