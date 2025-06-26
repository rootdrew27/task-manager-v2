import { build_task_obj } from "@/lib/task";
import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "task-management";

export const getTasks = async () => {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const tasks = [];
    for await (const task of db
      .collection("tasks")
      .find<TaskInfo>({}, { projection: { _id: 0 } })) {
      tasks.push(build_task_obj(task));
    }
    return tasks;
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await client.close();
  }
};
