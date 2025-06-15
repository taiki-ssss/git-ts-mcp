import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitAddHandler, performGitAdd } from './server.js';
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn()),
}));
vi.mock('simple-git', () => ({
    simpleGit: vi.fn(() => ({
        add: vi.fn(),
        status: vi.fn(),
    })),
}));
vi.mock('fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
}));
describe('Git Add Server', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { existsSync } = await import('fs');
        vi.mocked(existsSync).mockReturnValue(true);
    });
    describe('createGitAddHandler', () => {
        it('should create a handler function', () => {
            const handler = createGitAddHandler();
            expect(handler).toBeInstanceOf(Function);
        });
        it('should handle valid request', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue({
                    files: [
                        { path: 'file1.txt', index: 'A', working_dir: ' ' },
                    ],
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const handler = createGitAddHandler();
            const result = await handler({
                method: 'tools/call',
                params: {
                    name: 'git_add',
                    repoPath: '/test/repo',
                    files: ['file1.txt'],
                },
            });
            expect(result.content[0]).toHaveProperty('type', 'text');
            expect(result.content[0]).toHaveProperty('text');
            const text = result.content[0].text;
            const parsed = JSON.parse(text);
            expect(parsed.addedFiles).toEqual(['file1.txt']);
            expect(parsed.fileCount).toBe(1);
        });
        it('should handle invalid parameters', async () => {
            const handler = createGitAddHandler();
            const result = await handler({
                method: 'tools/call',
                params: {
                    name: 'git_add',
                    // Missing required repoPath
                },
            });
            expect(result.content[0]).toHaveProperty('type', 'text');
            const text = result.content[0].text;
            expect(text).toContain('Invalid parameters');
        });
        it('should handle performGitAdd errors', async () => {
            const handler = createGitAddHandler();
            const result = await handler({
                method: 'tools/call',
                params: {
                    name: 'git_add',
                    repoPath: '',
                },
            });
            expect(result.content[0]).toHaveProperty('type', 'text');
            const text = result.content[0].text;
            expect(text).toContain('Error:');
            expect(text).toContain('Repository path cannot be empty');
        });
    });
    describe('performGitAdd', () => {
        it('should add all files when no files are specified', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue({
                    files: [
                        { path: 'file1.txt', index: 'A', working_dir: ' ' },
                        { path: 'file2.txt', index: 'A', working_dir: ' ' },
                    ],
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.addedFiles).toEqual(['file1.txt', 'file2.txt']);
                expect(result.value.fileCount).toBe(2);
            }
            expect(mockGit.add).toHaveBeenCalledWith('.');
        });
        it('should add specific files when files are provided', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue({
                    files: [
                        { path: 'file1.txt', index: 'A', working_dir: ' ' },
                    ],
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo', ['file1.txt']);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.addedFiles).toEqual(['file1.txt']);
                expect(result.value.fileCount).toBe(1);
            }
            expect(mockGit.add).toHaveBeenCalledWith(['file1.txt']);
        });
        it('should return error when repoPath is empty', async () => {
            const result = await performGitAdd('');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repoPath does not exist', async () => {
            const { existsSync } = await import('fs');
            vi.mocked(existsSync).mockReturnValue(false);
            const result = await performGitAdd('/non/existent/path');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path does not exist: /non/existent/path');
            }
        });
        it('should handle git add errors', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockRejectedValue(new Error('Permission denied')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Failed to add files');
            }
        });
    });
});
