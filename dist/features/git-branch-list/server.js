import { z } from 'zod';
import { getBranchList } from './lib.js';
export const gitBranchListInputSchema = z.object({
    repoPath: z.string(),
    includeRemote: z.boolean().optional().default(false),
});
export function createGitBranchListHandler() {
    return async (params) => {
        const parsed = gitBranchListInputSchema.safeParse(params);
        if (!parsed.success) {
            return {
                content: [{
                        type: 'text',
                        text: `Invalid parameters: ${JSON.stringify(parsed.error.errors, null, 2)}`,
                    }],
            };
        }
        const { repoPath, includeRemote } = parsed.data;
        const result = await getBranchList(repoPath, includeRemote);
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
