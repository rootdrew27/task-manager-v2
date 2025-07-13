export function build_task_obj({ name, is_complete, deadline, description }: TaskInfoFromDB) {
  return {
    name: name,
    is_complete: is_complete,
    deadline: deadline
      ? deadline.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) +
        " at " +
        deadline.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : null,
    description: description ?? null,
  };
}

export function build_task_obj_from_livekit({
  name,
  is_complete,
  deadline,
  description,
}: TaskInfoFromLiveKit) {
  return {
    name: name,
    is_complete: is_complete ?? false,
    deadline: deadline ?? "",
    description: description ?? "",
  };
}
