interface TaskInfo {
  [key: string]: string | boolean | null;
  name: string;
  is_complete: boolean;
  deadline: string | null;
  description: string | null;
}

interface TaskInfoFromLiveKit {
  [key: string]: string | boolean | null;
  name: string;
  is_complete?: boolean;
  deadline?: string;
  description?: string;
}

interface TaskInfoFromDB {
  [key: string]: string | boolean | null;
  name: string;
  is_complete: boolean;
  deadline: Date | null;
  description: string | null;
}
