import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitAddHandler, gitAddInputSchema } from '../server.js';
import { performGitAdd } from '../lib.js';
import { ok, err } from 'neverthrow';
vi.mock('../lib.js', () => ({
    performGitAdd: vi.fn(),
}));
describe('Git Add Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('gitAddInputSchema', () => {
        it('should validate correct input with files', () => {
            const input = {
                repoPath: '/test/repo',
                files: ['file1.txt', 'file2.txt'],
            };
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(input);
            }
        });
        it('should validate correct input without files', () => {
            const input = {
                repoPath: '/test/repo',
            };
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(input);
            }
        });
        it('should reject empty repoPath', () => {
            const input = {
                repoPath: '',
            };
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject missing repoPath', () => {
            const input = {};
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject non-string repoPath', () => {
            const input = {
                repoPath: 123,
            };
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject non-array files', () => {
            const input = {
                repoPath: '/test/repo',
                files: 'file.txt',
            };
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
        it('should reject non-string array elements in files', () => {
            const input = {
                repoPath: '/test/repo',
                files: ['file1.txt', 123],
            };
            const result = gitAddInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });
    describe('createGitAddHandler', () => {
        it('should return a handler function', () => {
            const handler = createGitAddHandler();
            expect(typeof handler).toBe('function');
        });
        it('should handle valid request without files', async () => {
            const mockResult = {
                addedFiles: ['file1.txt', 'file2.txt'],
                fileCount: 2,
            };
            vi.mocked(performGitAdd).mockResolvedValue(ok(mockResult));
            const handler = createGitAddHandler();
            const params = {
                repoPath: '/test/repo',
            };
            const response = await handler(params);
            expect(performGitAdd).toHaveBeenCalledWith('/test/repo', undefined);
            expect(response).toEqual({
                content: [{
                        type: 'text',
                        text: JSON.stringify(mockResult, null, 2),
                    }],
            });
        });
        it('should handle valid request with files', async () => {
            const mockResult = {
                addedFiles: ['file1.txt'],
                fileCount: 1,
            };
            vi.mocked(performGitAdd).mockResolvedValue(ok(mockResult));
            const handler = createGitAddHandler();
            const params = {
                repoPath: '/test/repo',
                files: ['file1.txt'],
            };
            const response = await handler(params);
            expect(performGitAdd).toHaveBeenCalledWith('/test/repo', ['file1.txt']);
            expect(response).toEqual({
                content: [{
                        type: 'text',
                        text: JSON.stringify(mockResult, null, 2),
                    }],
            });
        });
        it('should handle invalid parameters', async () => {
            const handler = createGitAddHandler();
            const params = {
                invalidField: 'test',
            };
            const response = await handler(params);
            expect(performGitAdd).not.toHaveBeenCalled();
            expect(response.content[0].type).toBe('text');
            expect(response.content[0].text).toContain('Invalid parameters');
        });
        it('should handle performGitAdd errors', async () => {
            vi.mocked(performGitAdd).mockResolvedValue(err(new Error('Git operation failed')));
            const handler = createGitAddHandler();
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
        it('should format successful response with proper JSON indentation', async () => {
            const mockResult = {
                addedFiles: ['file1.txt', 'file2.txt', 'file3.txt'],
                fileCount: 3,
            };
            vi.mocked(performGitAdd).mockResolvedValue(ok(mockResult));
            const handler = createGitAddHandler();
            const params = {
                repoPath: '/test/repo',
            };
            const response = await handler(params);
            const expectedJson = JSON.stringify(mockResult, null, 2);
            expect(response.content[0].text).toBe(expectedJson);
            expect(response.content[0].text).toContain('  '); // Check for indentation
        });
        it('should handle empty added files result', async () => {
            const mockResult = {
                addedFiles: [],
                fileCount: 0,
            };
            vi.mocked(performGitAdd).mockResolvedValue(ok(mockResult));
            const handler = createGitAddHandler();
            const params = {
                repoPath: '/test/repo',
            };
            const response = await handler(params);
            expect(response).toEqual({
                content: [{
                        type: 'text',
                        text: JSON.stringify(mockResult, null, 2),
                    }],
            });
        });
    });
});
