import { z } from 'zod';
import { createBranch } from './lib.js';
export const gitBranchCreateInputSchema = z.object({
    repoPath: z.string(),
    branchName: z.string(),
    baseBranch: z.string().optional(),
    checkout: z.boolean().optional().default(false),
});
export function createGitBranchCreateHandler() {
    return async (params) => {
        const parsed = gitBranchCreateInputSchema.safeParse(params);
        if (!parsed.success) {
            return {
                content: [{
                        type: 'text',
                        text: `Invalid parameters: ${JSON.stringify(parsed.error.errors, null, 2)}`,
                    }],
            };
        }
        const { repoPath, branchName, baseBranch, checkout } = parsed.data;
        const result = await createBranch(repoPath, branchName, baseBranch, checkout);
        if (result.isErr()) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${result.error.message}`,
                    }],
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result.value, null, 2),
                }],
        };
    };
}
