import { ok, err } from 'neverthrow';
import { simpleGit } from 'simple-git';
import { existsSync } from 'fs';
import debugFactory from 'debug';
const debug = debugFactory('mcp:git-branch-create');
export async function createBranch(repoPath, branchName, baseBranch, checkout = false) {
    debug('Creating branch', { repoPath, branchName, baseBranch, checkout });
    // Validate input
    if (!repoPath || repoPath.trim() === '') {
        debug('Empty repository path provided');
        return err(new Error('Repository path cannot be empty'));
    }
    if (!branchName || branchName.trim() === '') {
        debug('Empty branch name provided');
        return err(new Error('Branch name cannot be empty'));
    }
    // Validate branch name
    if (!isValidBranchName(branchName)) {
        debug('Invalid branch name', { branchName });
        return err(new Error(`Invalid branch name: '${branchName}'`));
    }
    // Check if the repository exists
    if (!existsSync(repoPath)) {
        debug('Repository path does not exist', { repoPath });
        return err(new Error(`Repository path does not exist: ${repoPath}`));
    }
    try {
        const git = simpleGit(repoPath);
        // Get current branches
        debug('Fetching existing branches');
        const branchSummary = await git.branchLocal();
        // Check if branch already exists
        if (branchSummary.all.includes(branchName)) {
            debug('Branch already exists', { branchName });
            return err(new Error(`Branch '${branchName}' already exists`));
        }
        // Determine base branch
        const actualBaseBranch = baseBranch || branchSummary.current;
        // Check if base branch exists
        if (baseBranch && !branchSummary.all.includes(baseBranch)) {
            debug('Base branch does not exist', { baseBranch });
            return err(new Error(`Base branch '${baseBranch}' does not exist`));
        }
        // Create the branch
        debug('Creating new branch', { branchName, baseBranch: actualBaseBranch });
        await git.checkoutBranch(branchName, actualBaseBranch);
        // Checkout if requested
        if (checkout) {
            debug('Checking out new branch', { branchName });
            await git.checkout(branchName);
        }
        const result = {
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
    }
    catch (error) {
        debug('Failed to create branch', { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return err(new Error(`Failed to create branch: ${message}`));
    }
}
function isValidBranchName(name) {
    // Git branch name rules:
    // - Cannot start with '.'
    // - Cannot contain '..'
    // - Cannot contain ' ', '~', '^', ':', '?', '*', '['
    // - Cannot end with '/'
    // - Cannot end with '.lock'
    if (name.startsWith('.'))
        return false;
    if (name.includes('..'))
        return false;
    if (name.endsWith('/'))
        return false;
    if (name.endsWith('.lock'))
        return false;
    const invalidChars = [' ', '~', '^', ':', '?', '*', '['];
    for (const char of invalidChars) {
        if (name.includes(char))
            return false;
    }
    return true;
}
