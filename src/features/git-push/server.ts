import { z } from 'zod';
import { performGitPush } from './lib.js';

export const gitPushInputSchema = z.object({
  repoPath: z.string().min(1).describe('Path to the git repository'),
  remote: z.string().optional().describe('Remote name (default: origin)'),
  branch: z.string().optional().describe('Branch to push (default: current branch)'),
  tags: z.boolean().optional().describe('Push tags'),
  force: z.boolean().optional().describe('Force push'),
  setUpstream: z.boolean().optional().describe('Set upstream branch'),
  deleteRemote: z.boolean().optional().describe('Delete remote branch')
});

export function createGitPushHandler() {
  return async (params: any) => {
    // Validate parameters
    const parsed = gitPushInputSchema.safeParse(params);
    if (!parsed.success) {
      return {
        content: [{
          type: 'text' as const,
          text: `Invalid parameters: ${parsed.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ')}`
        }]
      };
    }

    // Call business logic
    const result = await performGitPush(parsed.data);

    // Handle errors
    if (result.isErr()) {
      return {
        content: [{
          type: 'text' as const,
          text: result.error.message
        }]
      };
    }

    // Format success response
    const value = result.value;
    let text = value.message;

    // Add warnings if any
    if (value.warnings && value.warnings.length > 0) {
      text += '\n\n' + value.warnings.map((w: string) => `Warning: ${w}`).join('\n');
    }

    // Add tag information if any
    if (value.tags && value.tags.length > 0) {
      text += '\n\nTags pushed: ' + value.tags.join(', ');
    }

    return {
      content: [{
        type: 'text' as const,
        text
      }]
    };
  };
}