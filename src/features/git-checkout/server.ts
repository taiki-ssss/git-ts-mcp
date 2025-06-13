import { z } from 'zod';
import { gitCheckout } from './lib.js';
import createDebug from 'debug';

const debug = createDebug('mcp:git-checkout');

export const gitCheckoutInputSchema = z.object({
  repoPath: z.string().min(1).describe('Path to the git repository'),
  target: z.string().min(1).describe('Branch name, commit hash, or tag to checkout'),
  force: z.boolean().optional().default(false).describe('Force checkout even with uncommitted changes'),
  files: z.array(z.string().min(1)).optional().describe('Specific files to checkout')
});

export function createGitCheckoutHandler() {
  return async (params: any) => {
    debug('Git checkout handler called with params:', params);

    const parsed = gitCheckoutInputSchema.safeParse(params);
    if (!parsed.success) {
      debug('Invalid parameters:', parsed.error);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Invalid parameters: ${parsed.error.message}`
          }
        ]
      };
    }

    const result = await gitCheckout(parsed.data);

    if (result.isErr()) {
      debug('Git checkout operation failed:', result.error);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${result.error.message}`
          }
        ]
      };
    }

    debug('Git checkout operation successful, returning result');
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result.value, null, 2)
        }
      ]
    };
  };
}