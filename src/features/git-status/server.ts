import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import Debug from 'debug';
import { validateAndInitializeGit } from '../../shared/lib/git-utils.js';
import { GitOperationResult, formatResultMatch } from '../../shared/types/git-common.js';

const debug = Debug('mcp:git-status');

async function performGitStatus(repoPath: string): Promise<Result<GitOperationResult, Error>> {
  debug('Starting git status operation', { repoPath });

  const gitResult = await validateAndInitializeGit(repoPath);
  if (gitResult.isErr()) {
    return err(gitResult.error);
  }

  const { git } = gitResult.value;

  try {

    debug('Getting repository status');
    const status = await git.status();
    
    debug('Getting current branch');
    const branch = await git.branch();
    
    const stagedFiles = status.staged.length > 0 
      ? `Staged files:\n${status.staged.map((f: string) => `  - ${f}`).join('\n')}`
      : 'No staged files';
    
    const modifiedFiles = status.modified.length > 0
      ? `Modified files:\n${status.modified.map((f: string) => `  - ${f}`).join('\n')}`
      : 'No modified files';
    
    const untrackedFiles = status.not_added.length > 0
      ? `Untracked files:\n${status.not_added.map((f: string) => `  - ${f}`).join('\n')}`
      : 'No untracked files';
    
    const aheadBehind = status.ahead > 0 || status.behind > 0
      ? `Branch is ${status.ahead} commits ahead, ${status.behind} commits behind`
      : 'Branch is up to date with remote';

    debug('Git status completed successfully');
    return ok({
      content: [
        {
          type: 'text' as const,
          text: `Repository Status for: ${repoPath}\n\nCurrent branch: ${branch.current}\n\n${stagedFiles}\n\n${modifiedFiles}\n\n${untrackedFiles}\n\n${aheadBehind}`,
        },
      ],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug('Git operation failed', { error: errorMessage });
    return err(new Error(errorMessage));
  }
}

export async function gitStatusHandler({ repoPath }: { repoPath: string }) {
  const result = await performGitStatus(repoPath);
  return formatResultMatch(result);
}
