import { z } from 'zod';
import type { GitAddResult } from './types.js';
import { Result, ok, err } from 'neverthrow';
import debugFactory from 'debug';
import { validateAndInitializeGit } from '../../shared/lib/git-utils.js';
import { createErrorResult } from '../../shared/types/git-common.js';

const debug = debugFactory('mcp:git-add');

export const gitAddInputSchema = z.object({
  repoPath: z.string(),
  files: z.array(z.string()).optional(),
});

export type GitAddInput = z.infer<typeof gitAddInputSchema>;

export function createGitAddHandler() {
  return async (params: any) => {
    const parsed = gitAddInputSchema.safeParse(params);
    if (!parsed.success) {
      return {
        content: [{
          type: 'text' as const,
          text: `Invalid parameters: ${JSON.stringify(parsed.error.errors, null, 2)}`,
        }],
      };
    }

    const { repoPath, files } = parsed.data;
    const result = await performGitAdd(repoPath, files);

    if (result.isErr()) {
      return createErrorResult(result.error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result.value, null, 2),
      }],
    };
  };
}

export async function performGitAdd(
  repoPath: string,
  files?: string[]
): Promise<Result<GitAddResult, Error>> {
  debug('Starting git add operation', { repoPath, files });

  const gitResult = await validateAndInitializeGit(repoPath);
  if (gitResult.isErr()) {
    return err(gitResult.error);
  }

  const { git } = gitResult.value;

  try {

    if (files && files.length > 0) {
      debug('Adding specific files', { files });
      await git.add(files);
    } else {
      debug('Adding all files');
      await git.add('.');
    }

    const status = await git.status();
    const addedFiles = status.files
      .filter((file: any) => file.index !== ' ' && file.index !== '?')
      .map((file: any) => file.path);

    const result: GitAddResult = {
      addedFiles,
      fileCount: addedFiles.length,
    };

    debug('Git add completed successfully', result);
    return ok(result);
  } catch (error) {
    debug('Git add failed', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(new Error(`Failed to add files: ${message}`));
  }
}
