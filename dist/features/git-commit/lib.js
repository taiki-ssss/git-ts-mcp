import { ok, err } from 'neverthrow';
import { simpleGit } from 'simple-git';
import Debug from 'debug';
const debug = Debug('mcp:git-commit');
export async function performGitCommit(repoPath, message) {
    debug('Starting git commit operation', { repoPath, message });
    // Validate repository path
    if (repoPath === '' || (typeof repoPath === 'string' && repoPath.trim().length === 0)) {
        debug('Empty repository path');
        return err(new Error('Repository path cannot be empty'));
    }
    if (!repoPath || typeof repoPath !== 'string') {
        debug('Invalid repository path', { repoPath });
        return err(new Error('Repository path is required and must be a string'));
    }
    // Validate commit message
    if (message === '' || (typeof message === 'string' && message.trim().length === 0)) {
        debug('Empty commit message');
        return err(new Error('Commit message cannot be empty'));
    }
    if (!message || typeof message !== 'string') {
        debug('Invalid commit message', { message });
        return err(new Error('Commit message is required and must be a string'));
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
        // Get current status to check if there are changes
        debug('Getting repository status');
        const status = await git.status();
        debug('Repository status', { filesCount: status.files.length });
        // Check if there are any changes to commit
        if (status.files.length === 0) {
            debug('No changes to commit');
            return ok({
                content: [
                    {
                        type: 'text',
                        text: 'No changes to commit. Working tree is clean.',
                    },
                ],
            });
        }
        // Add all changes to staging area
        debug('Adding all changes to staging area');
        await git.add('.');
        // Create commit
        debug('Creating commit');
        const commitResult = await git.commit(message);
        debug('Commit created', { commit: commitResult.commit });
        // Get the commit details
        debug('Getting commit details');
        const latestCommit = await git.log({ n: 1 });
        const commitHash = latestCommit.latest?.hash || commitResult.commit;
        debug('Git commit completed successfully', { commitHash });
        return ok({
            content: [
                {
                    type: 'text',
                    text: `Successfully created commit: ${commitHash}\nMessage: ${message}\nFiles changed: ${commitResult.summary.changes} (${commitResult.summary.insertions} insertions, ${commitResult.summary.deletions} deletions)`,
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
