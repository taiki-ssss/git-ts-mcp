import { z } from 'zod';
import { gitLog } from './lib.js';
import createDebug from 'debug';
const debug = createDebug('mcp:git-log');
export const gitLogInputSchema = z.object({
    repoPath: z.string().min(1).describe('Path to the git repository'),
    maxCount: z.number().positive().optional().default(10).describe('Maximum number of commits to return'),
    branch: z.string().min(1).optional().describe('Branch name to get logs from')
});
export function createGitLogHandler() {
    return async (params) => {
        debug('Git log handler called with params:', params);
        const parsed = gitLogInputSchema.safeParse(params);
        if (!parsed.success) {
            debug('Invalid parameters:', parsed.error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Invalid parameters: ${parsed.error.message}`
                    }
                ]
            };
        }
        const result = await gitLog(parsed.data);
        if (result.isErr()) {
            debug('Git log operation failed:', result.error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${result.error.message}`
                    }
                ]
            };
        }
        debug('Git log operation successful, returning result');
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.value, null, 2)
                }
            ]
        };
    };
}
