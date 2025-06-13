import { Result, ok, err } from 'neverthrow';
import debugFactory from 'debug';
import type { GitBranchCreateResult } from './types.js';
import { validateAndInitializeGit, validateNonEmptyString } from '../../shared/lib/git-utils.js';

const debug = debugFactory('mcp:git-branch-create');

export async function createBranch(
  repoPath: string,
  branchName: string,
  baseBranch?: string,
  checkout: boolean = false
): Promise<Result<GitBranchCreateResult, Error>> {
  debug('Creating branch', { repoPath, branchName, baseBranch, checkout });

  const branchNameValidation = validateNonEmptyString(branchName, 'Branch name');
  if (branchNameValidation.isErr()) {
    return err(branchNameValidation.error);
  }

  if (!isValidBranchName(branchName)) {
    debug('Invalid branch name', { branchName });
    return err(new Error(`Invalid branch name: '${branchName}'`));
  }

  const gitResult = await validateAndInitializeGit(repoPath);
  if (gitResult.isErr()) {
    return err(gitResult.error);
  }

  const { git } = gitResult.value;

  try {

    debug('Fetching existing branches');
    const branchSummary = await git.branchLocal();
    
    if (branchSummary.all.includes(branchName)) {
      debug('Branch already exists', { branchName });
      return err(new Error(`Branch '${branchName}' already exists`));
    }

    const actualBaseBranch = baseBranch || branchSummary.current;
    
    if (baseBranch && !branchSummary.all.includes(baseBranch)) {
      debug('Base branch does not exist', { baseBranch });
      return err(new Error(`Base branch '${baseBranch}' does not exist`));
    }

    debug('Creating new branch', { branchName, baseBranch: actualBaseBranch });
    await git.checkoutBranch(branchName, actualBaseBranch);

    if (checkout) {
      debug('Checking out new branch', { branchName });
      await git.checkout(branchName);
    }

    const result: GitBranchCreateResult = {
      success: true,
      branchName,
      baseBranch: actualBaseBranch,
      message: checkout 
        ? `Created branch '${branchName}' from '${actualBaseBranch}' and checked out`
        : `Created branch '${branchName}' from '${actualBaseBranch}'`,
      checkedOut: checkout,
    };

    debug('Branch created successfully', result);
    return ok(result);
  } catch (error) {
    debug('Failed to create branch', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(new Error(`Failed to create branch: ${message}`));
  }
}

function isValidBranchName(name: string): boolean {
  // Git branch name rules:
  // - Cannot start with '.'
  // - Cannot contain '..'
  // - Cannot contain ' ', '~', '^', ':', '?', '*', '['
  // - Cannot end with '/'
  // - Cannot end with '.lock'
  
  if (name.startsWith('.')) return false;
  if (name.includes('..')) return false;
  if (name.endsWith('/')) return false;
  if (name.endsWith('.lock')) return false;
  
  const invalidChars = [' ', '~', '^', ':', '?', '*', '['];
  for (const char of invalidChars) {
    if (name.includes(char)) return false;
  }
  
  return true;
}
