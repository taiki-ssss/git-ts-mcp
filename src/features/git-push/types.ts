export interface GitPushInput {
  repoPath: string;
  remote?: string;
  branch?: string;
  tags?: boolean;
  force?: boolean;
  setUpstream?: boolean;
  deleteRemote?: boolean;
}

export interface GitPushOutput {
  success: boolean;
  remote: string;
  branch: string;
  commits: {
    pushed: number;
    hash: string;
    message: string;
  };
  tags?: string[];
  message: string;
  warnings?: string[];
}