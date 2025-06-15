import { Result, ok, err } from 'neverthrow';
import debugFactory from 'debug';
import type { GitBranchListResult } from './types.js';
import { validateAndInitializeGit } from '../../shared/lib/git-utils.js';

const debug = debugFactory('mcp:git-branch-list');

export async function getBranchList(
  repoPath: string,
  includeRemote: boolean = false
): Promise<Result<GitBranchListResult, Error>> {
  debug('Getting branch list', { repoPath, includeRemote });

  const gitResult = await validateAndInitializeGit(repoPath);
  if (gitResult.isErr()) {
    return err(gitResult.error);
  }

  const { git } = gitResult.value;

  try {

    debug('Fetching local branches');
    const branchSummary = await git.branchLocal();
    
    const current = branchSummary.detached 
      ? 'HEAD (detached)' 
      : branchSummary.current;
    
    const local = branchSummary.all;

    const result: GitBranchListResult = {
      current,
      local,
    };

    if (includeRemote) {
      debug('Fetching remote branches');
      const allBranches = await git.branch();
      
      const remoteBranches = allBranches.all.filter((branch: string) => 
        branch.startsWith('remotes/')
      );
      
      result.remote = remoteBranches;
    }

    debug('Branch list retrieved successfully', result);
    return ok(result);
  } catch (error) {
    debug('Failed to get branch list', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(new Error(`Failed to get branch list: ${message}`));
  }
}
