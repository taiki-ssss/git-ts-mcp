import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitStatusHandler, gitStatusInputSchema } from '../server.js';
import { performGitStatus } from '../lib.js';
import { ok, err } from 'neverthrow';
vi.mock('../lib.js', () => ({
    performGitStatus: vi.fn(),
}));
describe('Git Status Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('gitStatusInputSchema', () => {
        it('should validate correct input', () => {
            const input = {
                repoPath: '/test/repo',
            };
            const result = gitStatusInputSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(input);
            }
        });
        it('should reject empty repoPath', () => {
            const input = {
                repoPath: '',
            };
            const result = gitStatusInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject missing repoPath', () => {
            const input = {};
            const result = gitStatusInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject non-string repoPath', () => {
            const input = {
                repoPath: 123,
            };
            const result = gitStatusInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });
    describe('createGitStatusHandler', () => {
        it('should return a handler function', () => {
            const handler = createGitStatusHandler();
            expect(typeof handler).toBe('function');
        });
        it('should handle valid request', async () => {
            const mockResult = {
                content: [{
                        type: 'text',
                        text: 'Repository status',
                    }],
            };
            vi.mocked(performGitStatus).mockResolvedValue(ok(mockResult));
            const handler = createGitStatusHandler();
            const params = {
                repoPath: '/test/repo',
            };
            const response = await handler(params);
            expect(performGitStatus).toHaveBeenCalledWith('/test/repo');
            expect(response).toEqual(mockResult);
        });
        it('should handle invalid parameters', async () => {
            const handler = createGitStatusHandler();
            const params = {
                invalidField: 'test',
            };
            const response = await handler(params);
            expect(performGitStatus).not.toHaveBeenCalled();
            expect(response.content[0].type).toBe('text');
            expect(response.content[0].text).toContain('Error:');
        });
        it('should handle performGitStatus errors', async () => {
            vi.mocked(performGitStatus).mockResolvedValue(err(new Error('Git operation failed')));
            const handler = createGitStatusHandler();
            const params = {
                repoPath: '/test/repo',
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
            const handler = createGitStatusHandler();
            const params = {
                repoPath: '',
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path cannot be empty');
        });
        it('should provide user-friendly error for missing repoPath', async () => {
            const handler = createGitStatusHandler();
            const params = {};
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path cannot be empty');
        });
        it('should provide user-friendly error for invalid repoPath type', async () => {
            const handler = createGitStatusHandler();
            const params = {
                repoPath: 123,
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path is required and must be a string');
        });
        it('should provide user-friendly error for null repoPath', async () => {
            const handler = createGitStatusHandler();
            const params = {
                repoPath: null,
            };
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path cannot be empty');
        });
        it('should handle object as params', async () => {
            const handler = createGitStatusHandler();
            const params = 'not an object';
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path is required and must be a string');
        });
        it('should handle undefined as params', async () => {
            const handler = createGitStatusHandler();
            const params = undefined;
            const response = await handler(params);
            expect(response.content[0].text).toBe('Error: Repository path is required and must be a string');
        });
    });
});
