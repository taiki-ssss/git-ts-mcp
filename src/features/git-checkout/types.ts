export interface GitCheckoutInput {
  repoPath: string;
  target: string;
  force?: boolean;
  files?: string[];
}

export interface GitCheckoutResult {
  success: boolean;
  previousBranch: string;
  currentBranch: string;
  message: string;
  modifiedFiles?: string[];
}