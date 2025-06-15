import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitCommitHandler, gitCommitInputSchema } from '../server.js';
import { performGitCommit } from '../lib.js';
import { ok, err } from 'neverthrow';
vi.mock('../lib.js', () => ({
    performGitCommit: vi.fn(),
}));
describe('Git Commit Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('gitCommitInputSchema', () => {
        it('should validate correct input', () => {
            const input = {
                repoPath: '/test/repo',
                message: 'test commit',
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(input);
            }
        });
        it('should reject empty repoPath', () => {
            const input = {
                repoPath: '',
                message: 'test commit',
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject missing repoPath', () => {
            const input = {
                message: 'test commit',
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject empty message', () => {
            const input = {
                repoPath: '/test/repo',
                message: '',
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject missing message', () => {
            const input = {
                repoPath: '/test/repo',
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject non-string repoPath', () => {
            const input = {
                repoPath: 123,
                message: 'test commit',
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject non-string message', () => {
            const input = {
                repoPath: '/test/repo',
                message: 123,
            };
            const result = gitCommitInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });
    describe('createGitCommitHandler', () => {
        it('should return a handler function', () => {
            const handler = createGitCommitHandler();
            expect(typeof handler).toBe('function');
        });
        it('should handle null params', async () => {
            const handler = createGitCommitHandler();
            const response = await handler(null);
            expect(response.content[0].text).toBe('Error: Invalid parameters provided');
        });
        it('should handle undefined params', async () => {
            const handler = createGitCommitHandler();
            const response = await handler(undefined);
            expect(response.content[0].text).toBe('Error: Invalid parameters provided');
        });
        it('should handle string params', async () => {
            const handler = createGitCommitHandler();
            const response = await handler('not an object');
            expect(response.content[0].text).toBe('Error: Invalid parameters provided');
        });
        it('should handle valid request', async () => {
            const mockResult = {
                content: [{
                        type: 'text',
                        text: 'Successfully created commit',
                    }],
            };
            vi.mocked(performGitCommit).mockResolvedValue(ok(mockResult));
            const handler = createGitCommitHandler();
            const params = {
                repoPath: '/test/repo',
                message: 'test commit',
            };
            const response = await handler(params);
            expect(performGitCommit).toHaveBeenCalledWith('/test/repo', 'test commit');
            expect(response).toEqual(mockResult);
        });
        it('should handle invalid parameters', async () => {
            const handler = createGitCommitHandler();
            const params = {
                invalidField: 'test',
            };
            const response = await handler(params);
            expect(performGitCommit).not.toHaveBeenCalled();
            expect(response.content[0].type).toBe('text');
            expect(response.content[0].text).toContain('Error:');
        });
        it('should handle performGitCommit errors', async () => {
            vi.mocked(performGitCommit).mockResolvedValue(err(new Error('Git operation failed')));
            const handler = createGitCommitHandler();
            const params = {
                repoPath: '/test/repo',
                message: 'test commit',
            };
            const response = await handler(params);
            expect(response).toEqual({
                content: [{
                        type: 'text',
                        text: 'Error: Git operation failed',
                    }],
            });
        });
        it('should provide user-friendly error for empty repoPath', async () => {
            const handler = createGitCommitHandler();
            const params = {
                repoPath: '',
                message: 'test commit',
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path cannot be empty');
        });
        it('should provide user-friendly error for empty message', async () => {
            const handler = createGitCommitHandler();
            const params = {
                repoPath: '/test/repo',
                message: '',
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Commit message cannot be empty');
        });
        it('should provide user-friendly error for missing repoPath', async () => {
            const handler = createGitCommitHandler();
            const params = {
                message: 'test commit',
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path is required and must be a string');
        });
        it('should provide user-friendly error for missing message', async () => {
            const handler = createGitCommitHandler();
            const params = {
                repoPath: '/test/repo',
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Commit message is required and must be a string');
        });
        it('should provide user-friendly error for invalid repoPath type', async () => {
            const handler = createGitCommitHandler();
            const params = {
                repoPath: 123,
                message: 'test commit',
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path is required and must be a string');
        });
        it('should provide user-friendly error for invalid message type', async () => {
            const handler = createGitCommitHandler();
            const params = {
                repoPath: '/test/repo',
                message: 123,
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Commit message is required and must be a string');
        });
    });
});
