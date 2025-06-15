import { z } from 'zod';
import { ok, err } from 'neverthrow';
import debugFactory from 'debug';
import { simpleGit } from 'simple-git';
import { existsSync } from 'fs';
const debug = debugFactory('mcp:git-add');
export const gitAddInputSchema = z.object({
    repoPath: z.string(),
    files: z.array(z.string()).optional(),
});
export function createGitAddHandler() {
    return async (params) => {
        const parsed = gitAddInputSchema.safeParse(params);
        if (!parsed.success) {
            return {
                content: [{
                        type: 'text',
                        text: `Invalid parameters: ${JSON.stringify(parsed.error.errors, null, 2)}`,
                    }],
            };
        }
        const { repoPath, files } = parsed.data;
        const result = await performGitAdd(repoPath, files);
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
export async function performGitAdd(repoPath, files) {
    debug('Starting git add operation', { repoPath, files });
    // Validate input
    if (!repoPath || repoPath.trim() === '') {
        debug('Empty repository path provided');
        return err(new Error('Repository path cannot be empty'));
    }
    // Check if the repository exists
    if (!existsSync(repoPath)) {
        debug('Repository path does not exist', { repoPath });
        return err(new Error(`Repository path does not exist: ${repoPath}`));
    }
    try {
        const git = simpleGit(repoPath);
        // Add files to staging
        if (files && files.length > 0) {
            debug('Adding specific files', { files });
            await git.add(files);
        }
        else {
            debug('Adding all files');
            await git.add('.');
        }
        // Get status to see what was added
        const status = await git.status();
        const addedFiles = status.files
            .filter(file => file.index !== ' ' && file.index !== '?')
            .map(file => file.path);
        const result = {
            addedFiles,
            fileCount: addedFiles.length,
        };
        debug('Git add completed successfully', result);
        return ok(result);
    }
    catch (error) {
        debug('Git add failed', { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return err(new Error(`Failed to add files: ${message}`));
    }
}
