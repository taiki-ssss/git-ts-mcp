import { z } from 'zod';
import { getBranchList } from './lib.js';

export const gitBranchListInputSchema = z.object({
  repoPath: z.string(),
  includeRemote: z.boolean().optional().default(false),
});

export type GitBranchListInput = z.infer<typeof gitBranchListInputSchema>;

export function createGitBranchListHandler() {
  return async (params: any) => {
    const parsed = gitBranchListInputSchema.safeParse(params);
    if (!parsed.success) {
      return {
        content: [{
          type: 'text' as const,
          text: `Invalid parameters: ${JSON.stringify(parsed.error.errors, null, 2)}`,
        }],
      };
    }

    const { repoPath, includeRemote } = parsed.data;
    const result = await getBranchList(repoPath, includeRemote);

    if (result.isErr()) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error: ${result.error.message}`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result.value, null, 2),
      }],
    };
  };
}