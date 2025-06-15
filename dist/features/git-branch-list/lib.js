import { ok, err } from 'neverthrow';
import { simpleGit } from 'simple-git';
import { existsSync } from 'fs';
import debugFactory from 'debug';
const debug = debugFactory('mcp:git-branch-list');
export async function getBranchList(repoPath, includeRemote = false) {
    debug('Getting branch list', { repoPath, includeRemote });
    // Validate input
    if (!repoPath || repoPath.trim() === '') {
        debug('Empty repository path provided');
        return err(new Error('Repository path cannot be empty'));
    }
    // Check if the repository exists
    if (!existsSync(repoPath)) {
        debug('Repository path does not exist', { repoPath });
        return err(new Error(`Repository path does not exist: ${repoPath}`));
    }
    try {
        const git = simpleGit(repoPath);
        // Get local branches
        debug('Fetching local branches');
        const branchSummary = await git.branchLocal();
        const current = branchSummary.detached
            ? 'HEAD (detached)'
            : branchSummary.current;
        const local = branchSummary.all;
        const result = {
            current,
            local,
        };
        // Get remote branches if requested
        if (includeRemote) {
            debug('Fetching remote branches');
            const allBranches = await git.branch();
            const remoteBranches = allBranches.all.filter(branch => branch.startsWith('remotes/'));
            result.remote = remoteBranches;
        }
        debug('Branch list retrieved successfully', result);
        return ok(result);
    }
    catch (error) {
        debug('Failed to get branch list', { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return err(new Error(`Failed to get branch list: ${message}`));
    }
}
