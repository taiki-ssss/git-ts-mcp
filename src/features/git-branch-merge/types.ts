export type MergeStrategy = 'merge' | 'fast-forward' | 'squash';

export interface GitBranchMergeInput {
  repoPath: string;
  sourceBranch: string;
  targetBranch?: string;
  strategy?: MergeStrategy;
  message?: string;
  noCommit?: boolean;
}

export interface GitBranchMergeResult {
  success: boolean;
  mergeType: 'fast-forward' | 'merge' | 'squash';
  targetBranch: string;
  sourceBranch: string;
  commitHash?: string;
  conflicts?: string[];
}