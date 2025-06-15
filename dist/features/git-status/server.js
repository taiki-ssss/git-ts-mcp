import { simpleGit } from 'simple-git';
import { ok, err } from 'neverthrow';
import Debug from 'debug';
const debug = Debug('mcp:git-status');
async function performGitStatus(repoPath) {
    debug('Starting git status operation', { repoPath });
    // Validate repository path
    if (repoPath === '' || (typeof repoPath === 'string' && repoPath.trim().length === 0)) {
        debug('Empty repository path');
        return err(new Error('Repository path cannot be empty'));
    }
    if (!repoPath || typeof repoPath !== 'string') {
        debug('Invalid repository path', { repoPath });
        return err(new Error('Repository path is required and must be a string'));
    }
    try {
        // Initialize git instance for the specified repository
        debug('Initializing git instance', { repoPath });
        const git = simpleGit(repoPath);
        // Check if the path is a valid git repository
        debug('Checking if path is a git repository');
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            debug('Path is not a git repository', { repoPath });
            return err(new Error(`The path '${repoPath}' is not a git repository`));
        }
        // Get current status
        debug('Getting repository status');
        const status = await git.status();
        // Get current branch
        debug('Getting current branch');
        const branch = await git.branch();
        // Format the status information
        const stagedFiles = status.staged.length > 0
            ? `Staged files:\n${status.staged.map(f => `  - ${f}`).join('\n')}`
            : 'No staged files';
        const modifiedFiles = status.modified.length > 0
            ? `Modified files:\n${status.modified.map(f => `  - ${f}`).join('\n')}`
            : 'No modified files';
        const untrackedFiles = status.not_added.length > 0
            ? `Untracked files:\n${status.not_added.map(f => `  - ${f}`).join('\n')}`
            : 'No untracked files';
        const aheadBehind = status.ahead > 0 || status.behind > 0
            ? `Branch is ${status.ahead} commits ahead, ${status.behind} commits behind`
            : 'Branch is up to date with remote';
        debug('Git status completed successfully');
        return ok({
            content: [
                {
                    type: 'text',
                    text: `Repository Status for: ${repoPath}\n\nCurrent branch: ${branch.current}\n\n${stagedFiles}\n\n${modifiedFiles}\n\n${untrackedFiles}\n\n${aheadBehind}`,
                },
            ],
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debug('Git operation failed', { error: errorMessage });
        return err(new Error(errorMessage));
    }
}
export async function gitStatusHandler({ repoPath }) {
    const result = await performGitStatus(repoPath);
    return result.match((value) => value, (error) => ({
        content: [
            {
                type: 'text',
                text: `Error: ${error.message}`,
            },
        ],
    }));
}
