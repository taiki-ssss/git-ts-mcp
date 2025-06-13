export interface GitLogInput {
  repoPath: string;
  maxCount?: number;
  branch?: string;
}

export interface GitLogEntry {
  hash: string;
  date: string;
  message: string;
  author: string;
  email: string;
}

export interface GitLogResult {
  logs: GitLogEntry[];
}