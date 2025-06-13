import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import Debug from 'debug';
import { validateAndInitializeGit, validateNonEmptyString } from '../../shared/lib/git-utils.js';
import { GitOperationResult, formatResultMatch } from '../../shared/types/git-common.js';

const debug = Debug('mcp:git-commit');

async function performGitCommit(repoPath: string, message: string): Promise<Result<GitOperationResult, Error>> {
  debug('Starting git commit operation', { repoPath, message });

  const messageValidation = validateNonEmptyString(message, 'Commit message');
  if (messageValidation.isErr()) {
    return err(messageValidation.error);
  }

  const gitResult = await validateAndInitializeGit(repoPath);
  if (gitResult.isErr()) {
    return err(gitResult.error);
  }

  const { git } = gitResult.value;

  try {

    debug('Getting repository status');
    const status = await git.status();
    debug('Repository status', { filesCount: status.files.length });
    
    if (status.files.length === 0) {
      debug('No changes to commit');
      return ok({
        content: [
          {
            type: 'text' as const,
            text: 'No changes to commit. Working tree is clean.',
          },
        ],
      });
    }

    debug('Adding all changes to staging area');
    await git.add('.');

    debug('Creating commit');
    const commitResult = await git.commit(message);
    debug('Commit created', { commit: commitResult.commit });

    debug('Getting commit details');
    const latestCommit = await git.log({ n: 1 });
    const commitHash = latestCommit.latest?.hash || commitResult.commit;

    debug('Git commit completed successfully', { commitHash });
    return ok({
      content: [
        {
          type: 'text' as const,
          text: `Successfully created commit: ${commitHash}\nMessage: ${message}\nFiles changed: ${commitResult.summary.changes} (${commitResult.summary.insertions} insertions, ${commitResult.summary.deletions} deletions)`,
        },
      ],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug('Git operation failed', { error: errorMessage });
    return err(new Error(errorMessage));
  }
}

export async function gitCommitHandler({ repoPath, message }: { repoPath: string; message: string }) {
  const result = await performGitCommit(repoPath, message);
  return formatResultMatch(result);
}

export function createGitCommitServer(): McpServer {
  const server = new McpServer({
    name: 'git-commit-server',
    version: '1.0.0',
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  server.tool(
    'git_commit',
    'Create a git commit in the specified repository',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      message: z.string().min(1).describe('Commit message'),
    },
    gitCommitHandler
  );

  return server;
}
