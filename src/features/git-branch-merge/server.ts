import { z } from 'zod';
import { mergeBranch } from './lib.js';
import type { GitBranchMergeInput } from './types.js';

export const gitBranchMergeInputSchema = z.object({
  repoPath: z.string().min(1),
  sourceBranch: z.string().min(1),
  targetBranch: z.string().optional(),
  strategy: z.enum(['merge', 'fast-forward', 'squash']).optional(),
  message: z.string().optional(),
  noCommit: z.boolean().optional(),
});

export function createGitBranchMergeHandler() {
  return async (params: any) => {
    const parsed = gitBranchMergeInputSchema.safeParse(params);

    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Invalid parameters: ${parsed.error.errors
              .map((e) => `${e.path.join('.')}: ${e.message}`)
              .join(', ')}`,
          },
        ],
      };
    }

    const input = parsed.data as GitBranchMergeInput;

    const result = await mergeBranch(
      input.repoPath,
      input.sourceBranch,
      input.targetBranch,
      input.strategy || 'merge',
      input.message,
      input.noCommit || false
    );

    if (result.isErr()) {
      return {
        content: [
          {
            type: 'text' as const,
            text: result.error.message,
          },
        ],
      };
    }

    const { mergeType, targetBranch, sourceBranch, commitHash } = result.value;
    let message = `Successfully merged ${sourceBranch} into ${targetBranch}\nMerge type: ${mergeType}`;
    
    if (commitHash) {
      message += `\nCommit: ${commitHash}`;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    };
  };
}