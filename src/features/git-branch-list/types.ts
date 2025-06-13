export interface GitBranchListInput {
  repoPath: string;
  includeRemote?: boolean;
}

export interface GitBranchListResult {
  current: string;
  local: string[];
  remote?: string[];
}