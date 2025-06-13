import { Result, ok, err } from 'neverthrow';
import { LogResult, DefaultLogFields } from 'simple-git';
import { GitLogInput, GitLogResult, GitLogEntry } from './types.js';
import createDebug from 'debug';
import { validateAndInitializeGit } from '../../shared/lib/git-utils.js';

const debug = createDebug('mcp:git-log');

export async function gitLog(input: GitLogInput): Promise<Result<GitLogResult, Error>> {
  debug('gitLog called with:', input);

  const { repoPath, maxCount = 10, branch } = input;

  if (maxCount !== undefined && maxCount <= 0) {
    debug('Invalid maxCount:', maxCount);
    return err(new Error('maxCount must be a positive number'));
  }

  const gitResult = await validateAndInitializeGit(repoPath);
  if (gitResult.isErr()) {
    return err(gitResult.error);
  }

  const { git } = gitResult.value;

  try {

    const hasCommits = await git.log({ maxCount: 1 }).catch(() => null);
    if (!hasCommits || hasCommits.total === 0) {
      debug('No commits found in repository');
      return ok({ logs: [] });
    }

    if (branch) {
      const branches = await git.branch();
      const branchExists = branches.all.includes(branch) || 
                          branches.all.includes(`remotes/origin/${branch}`);
      
      if (!branchExists) {
        debug('Branch not found:', branch);
        return err(new Error(`Git log failed: branch not found: ${branch}`));
      }
    }

    const logOptions: any = {
      maxCount
    };

    if (branch) {
      logOptions[branch] = null;
    }

    const logResult: LogResult<DefaultLogFields> = await git.log(logOptions);
    
    const logs: GitLogEntry[] = logResult.all.map((commit: any) => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,
      email: commit.author_email
    }));

    debug('Successfully retrieved git logs:', logs.length);
    return ok({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    debug('Git log operation failed:', message);
    return err(new Error(`Git log failed: ${message}`));
  }
}
