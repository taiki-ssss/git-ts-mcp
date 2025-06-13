export interface GitBranchCreateInput {
  repoPath: string;
  branchName: string;
  baseBranch?: string;
  checkout?: boolean;
}

export interface GitBranchCreateResult {
  success: boolean;
  branchName: string;
  baseBranch: string;
  message: string;
  checkedOut: boolean;
}