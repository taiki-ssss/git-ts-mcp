import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performGitCommit } from '../lib.js';
import * as simpleGitModule from 'simple-git';
vi.mock('simple-git');
describe('Git Commit Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('performGitCommit', () => {
        it('should successfully create a commit', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    files: [
                        { path: 'file1.txt', index: 'M', working_dir: ' ' },
                        { path: 'file2.txt', index: 'A', working_dir: ' ' },
                    ],
                }),
                add: vi.fn().mockResolvedValue(undefined),
                commit: vi.fn().mockResolvedValue({
                    commit: 'abc123',
                    summary: {
                        changes: 2,
                        insertions: 10,
                        deletions: 5,
                    },
                }),
                log: vi.fn().mockResolvedValue({
                    latest: { hash: 'abc123' },
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.content[0].text).toContain('Successfully created commit: abc123');
                expect(result.value.content[0].text).toContain('Message: test commit');
                expect(result.value.content[0].text).toContain('Files changed: 2 (10 insertions, 5 deletions)');
            }
            expect(mockGit.add).toHaveBeenCalledWith('.');
            expect(mockGit.commit).toHaveBeenCalledWith('test commit');
        });
        it('should handle repository with no changes', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    files: [],
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.content[0].text).toBe('No changes to commit. Working tree is clean.');
            }
            // add and commit should not be called since there are no changes
        });
        it('should return error when repoPath is empty', async () => {
            const result = await performGitCommit('', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repoPath is whitespace-only', async () => {
            const result = await performGitCommit('   ', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repoPath is null', async () => {
            const result = await performGitCommit(null, 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path is required and must be a string');
            }
        });
        it('should return error when repoPath is undefined', async () => {
            const result = await performGitCommit(undefined, 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path is required and must be a string');
            }
        });
        it('should return error when message is empty', async () => {
            const result = await performGitCommit('/test/repo', '');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Commit message cannot be empty');
            }
        });
        it('should return error when message is whitespace-only', async () => {
            const result = await performGitCommit('/test/repo', '   ');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Commit message cannot be empty');
            }
        });
        it('should return error when message is null', async () => {
            const result = await performGitCommit('/test/repo', null);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Commit message is required and must be a string');
            }
        });
        it('should return error when message is undefined', async () => {
            const result = await performGitCommit('/test/repo', undefined);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Commit message is required and must be a string');
            }
        });
        it('should return error when path is not a git repository', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(false),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe("The path '/test/repo' is not a git repository");
            }
        });
        it('should handle git errors', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockRejectedValue(new Error('Git operation failed')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Git operation failed');
            }
        });
        it('should handle non-Error exceptions', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockRejectedValue('String error'),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('String error');
            }
        });
        it('should handle status check failure', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockRejectedValue(new Error('Failed to get status')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to get status');
            }
        });
        it('should handle add failure', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    files: [{ path: 'file1.txt', index: 'M', working_dir: ' ' }],
                }),
                add: vi.fn().mockRejectedValue(new Error('Failed to add files')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to add files');
            }
        });
        it('should handle commit failure', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    files: [{ path: 'file1.txt', index: 'M', working_dir: ' ' }],
                }),
                add: vi.fn().mockResolvedValue(undefined),
                commit: vi.fn().mockRejectedValue(new Error('Failed to commit')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to commit');
            }
        });
        it('should use commit hash from commit result when log fails', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    files: [{ path: 'file1.txt', index: 'M', working_dir: ' ' }],
                }),
                add: vi.fn().mockResolvedValue(undefined),
                commit: vi.fn().mockResolvedValue({
                    commit: 'def456',
                    summary: {
                        changes: 1,
                        insertions: 5,
                        deletions: 0,
                    },
                }),
                log: vi.fn().mockResolvedValue({
                    latest: null,
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitCommit('/test/repo', 'test commit');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.content[0].text).toContain('Successfully created commit: def456');
            }
        });
    });
});
