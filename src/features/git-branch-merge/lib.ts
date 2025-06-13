import { simpleGit } from 'simple-git';
import { Result, ok, err } from 'neverthrow';
import createDebug from 'debug';
import type { GitBranchMergeResult, MergeStrategy } from './types.js';

const debug = createDebug('mcp:git-branch-merge');

export async function mergeBranch(
  repoPath: string,
  sourceBranch: string,
  targetBranch?: string,
  strategy: MergeStrategy = 'merge',
  message?: string,
  noCommit: boolean = false
): Promise<Result<GitBranchMergeResult, Error>> {
  try {
    debug('Starting merge operation', {
      repoPath,
      sourceBranch,
      targetBranch,
      strategy,
      noCommit,
    });

    const git = simpleGit(repoPath);

    // Get current branch if target branch is not specified
    let currentBranch = targetBranch;
    if (!targetBranch) {
      currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      currentBranch = currentBranch.trim();
      debug('Using current branch as target', { currentBranch });
    }

    // Verify branches exist
    const branches = await git.branch();
    if (!branches.branches[sourceBranch]) {
      return err(new Error(`Source branch does not exist: ${sourceBranch}`));
    }

    if (!currentBranch || !branches.branches[currentBranch]) {
      return err(new Error(`Target branch does not exist: ${currentBranch}`));
    }

    // Checkout target branch if different from current
    if (targetBranch && !branches.branches[targetBranch]?.current) {
      debug('Checking out target branch', { targetBranch });
      await git.checkout(targetBranch);
    }

    // Build merge arguments
    const mergeArgs: string[] = [sourceBranch];

    // Add strategy-specific options
    switch (strategy) {
      case 'fast-forward':
        mergeArgs.push('--ff-only');
        break;
      case 'squash':
        mergeArgs.push('--squash');
        break;
      // 'merge' is the default, no special flags needed
    }

    // Add custom message if provided
    if (message && strategy !== 'squash') {
      mergeArgs.push('-m', message);
    }

    // Add no-commit flag if requested
    if (noCommit) {
      mergeArgs.push('--no-commit');
    }

    // Perform the merge
    try {
      debug('Executing merge command', { mergeArgs });
      const mergeResult = await git.merge(mergeArgs);

      let mergeType: 'fast-forward' | 'merge' | 'squash' = 'merge';
      if (mergeResult.result?.includes('Fast-forward')) {
        mergeType = 'fast-forward';
      } else if (strategy === 'squash') {
        mergeType = 'squash';
        // For squash merge, we need to commit if not using noCommit
        if (!noCommit) {
          const squashMessage = message || `Squashed commit from ${sourceBranch}`;
          await git.commit(squashMessage);
        }
      }

      // Get the commit hash if a commit was made
      let commitHash: string | undefined;
      if (!noCommit) {
        const log = await git.log({ n: 1 });
        commitHash = log.latest?.hash;
      }

      debug('Merge completed successfully', { mergeType, commitHash });

      return ok({
        success: true,
        mergeType,
        targetBranch: currentBranch || '',
        sourceBranch,
        commitHash,
      });
    } catch (mergeError) {
      // Check if it's a conflict
      const errorMessage = mergeError instanceof Error ? mergeError.message : String(mergeError);
      
      if (errorMessage.includes('CONFLICTS') || errorMessage.includes('conflict')) {
        debug('Merge conflict detected');
        const status = await git.status();
        return err(
          new Error(
            `Merge conflict occurred. Conflicted files: ${status.conflicted.join(', ')}`
          )
        );
      }

      // Other merge errors
      debug('Merge failed', { error: errorMessage });
      return err(new Error(`Failed to merge branch: ${errorMessage}`));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug('Operation failed', { error: errorMessage });
    return err(new Error(`Merge operation failed: ${errorMessage}`));
  }
}