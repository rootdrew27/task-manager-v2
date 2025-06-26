interface TaskInfo {
  [key: string]: string | boolean | null;
  name: string;
  is_complete: boolean;
  deadline?: string | null;
  description?: string | null;
}
