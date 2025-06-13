import { Result, ok, err } from 'neverthrow';
import { simpleGit, SimpleGit } from 'simple-git';
import Debug from 'debug';
import { GitPushInput, GitPushOutput } from './types.js';

const debug = Debug('mcp:git-push');

export async function performGitPush(input: GitPushInput): Promise<Result<GitPushOutput, Error>> {
  const { repoPath, remote = 'origin', branch, tags = false, force = false, setUpstream = false, deleteRemote = false } = input;

  debug('Starting push operation', { repoPath, remote, branch, tags, force, setUpstream, deleteRemote });

  try {
    const git: SimpleGit = simpleGit(repoPath);

    // Check if it's a valid git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      debug('Path is not a git repository', { repoPath });
      return err(new Error(`Path "${repoPath}" is not a git repository`));
    }

    // Get current status
    const status = await git.status();
    const currentBranch = status.current;
    debug('Repository status', { currentBranch, ahead: status.ahead, behind: status.behind });

    // Check for detached HEAD
    if (!currentBranch && status.detached) {
      debug('Repository is in detached HEAD state');
      return err(new Error('Cannot push from detached HEAD state. Please checkout a branch first.'));
    }

    // Use current branch if not specified
    const targetBranch = branch || currentBranch || 'main';

    // Check if remote exists
    const remotes = await git.getRemotes(true);
    const remoteExists = remotes.some(r => r.name === remote);

    if (remotes.length === 0) {
      return err(new Error('No remote repository configured'));
    }

    if (!remoteExists) {
      return err(new Error(`Remote "${remote}" not found`));
    }

    // Build push arguments
    const pushArgs: string[] = [remote];

    if (deleteRemote) {
      pushArgs.push('--delete', targetBranch);
    } else {
      pushArgs.push(targetBranch);
      
      if (force) {
        pushArgs.push('--force');
      }
      
      if (setUpstream) {
        pushArgs.push('--set-upstream');
      }
      
      if (tags) {
        pushArgs.push('--tags');
      }
    }

    // Check if there are commits to push (only if not deleting)
    if (!deleteRemote && status.ahead === 0 && !tags) {
      debug('No commits to push, repository is up to date');
      return ok({
        success: true,
        remote,
        branch: targetBranch,
        commits: {
          pushed: 0,
          hash: '',
          message: ''
        },
        message: 'Already up to date',
        warnings: []
      });
    }

    // Perform the push
    debug('Pushing to remote', { args: pushArgs });
    await git.push(pushArgs);

    // Get information about what was pushed
    let pushedCommits = { pushed: 0, hash: '', message: '' };
    let pushedTags: string[] | undefined;
    let message = '';
    const warnings: string[] = [];

    if (deleteRemote) {
      message = `Successfully deleted remote branch "${targetBranch}" from "${remote}"`;
    } else {
      // Get latest commit info
      const log = await git.log({ n: 1 });
      if (log.latest) {
        pushedCommits = {
          pushed: status.ahead || 1,
          hash: log.latest.hash,
          message: log.latest.message
        };
      }

      if (tags) {
        const tagList = await git.tag();
        pushedTags = tagList ? tagList.split('\n').filter(t => t.trim()) : [];
      }

      message = `Successfully pushed ${pushedCommits.pushed} commit(s) to ${remote}/${targetBranch}`;

      if (force) {
        warnings.push('Force push was used');
      }
    }

    debug('Push completed successfully', { remote, branch: targetBranch, commits: pushedCommits.pushed, tags: pushedTags?.length });

    return ok({
      success: true,
      remote,
      branch: targetBranch,
      commits: pushedCommits,
      tags: pushedTags,
      message,
      warnings
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug('Push operation failed', { error: errorMessage });
    
    // Enhance error messages for common scenarios
    if (errorMessage.includes('Authentication failed')) {
      return err(new Error('Authentication failed. Please check your credentials or SSH keys.'));
    }
    
    if (errorMessage.includes('Could not resolve host')) {
      return err(new Error('Network error: Could not resolve host. Please check your internet connection.'));
    }
    
    if (errorMessage.includes('non-fast-forward')) {
      return err(new Error('Push rejected: non-fast-forward update. Pull the latest changes or use force push.'));
    }

    return err(new Error(`Push failed: ${errorMessage}`));
  }
}