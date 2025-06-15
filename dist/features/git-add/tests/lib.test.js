import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performGitAdd } from '../lib.js';
import * as simpleGitModule from 'simple-git';
import { existsSync } from 'fs';
vi.mock('simple-git');
vi.mock('fs', () => ({
    existsSync: vi.fn(),
}));
describe('Git Add Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(existsSync).mockReturnValue(true);
    });
    describe('performGitAdd', () => {
        it('should add all files when no files are specified', async () => {
            const mockStatus = {
                files: [
                    { path: 'file1.txt', index: 'M', working_dir: ' ' },
                    { path: 'file2.txt', index: 'A', working_dir: ' ' },
                    { path: 'file3.txt', index: '?', working_dir: '?' }, // Untracked, should be excluded
                ],
            };
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue(mockStatus),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual({
                    addedFiles: ['file1.txt', 'file2.txt'],
                    fileCount: 2,
                });
            }
            expect(mockGit.add).toHaveBeenCalledWith('.');
            expect(mockGit.add).toHaveBeenCalledTimes(1);
        });
        it('should add specific files when files are provided', async () => {
            const mockStatus = {
                files: [
                    { path: 'file1.txt', index: 'A', working_dir: ' ' },
                ],
            };
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue(mockStatus),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo', ['file1.txt']);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual({
                    addedFiles: ['file1.txt'],
                    fileCount: 1,
                });
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
        it('should return error when repoPath is whitespace-only', async () => {
            const result = await performGitAdd('   ');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repoPath does not exist', async () => {
            vi.mocked(existsSync).mockReturnValue(false);
            const result = await performGitAdd('/non/existent/path');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path does not exist: /non/existent/path');
            }
        });
        it('should handle git add errors', async () => {
            const mockGit = {
                add: vi.fn().mockRejectedValue(new Error('Git add failed')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to add files: Git add failed');
            }
        });
        it('should handle non-Error exceptions', async () => {
            const mockGit = {
                add: vi.fn().mockRejectedValue('String error'),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to add files: Unknown error');
            }
        });
        it('should handle empty staged files correctly', async () => {
            const mockStatus = {
                files: [
                    { path: 'file1.txt', index: '?', working_dir: '?' }, // All untracked
                    { path: 'file2.txt', index: ' ', working_dir: 'M' }, // Modified but not staged
                ],
            };
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue(mockStatus),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual({
                    addedFiles: [],
                    fileCount: 0,
                });
            }
        });
        it('should filter files correctly based on index status', async () => {
            const mockStatus = {
                files: [
                    { path: 'staged.txt', index: 'M', working_dir: ' ' }, // Staged modification
                    { path: 'added.txt', index: 'A', working_dir: ' ' }, // Staged addition
                    { path: 'deleted.txt', index: 'D', working_dir: ' ' }, // Staged deletion
                    { path: 'renamed.txt', index: 'R', working_dir: ' ' }, // Staged rename
                    { path: 'untracked.txt', index: '?', working_dir: '?' }, // Untracked
                    { path: 'unmodified.txt', index: ' ', working_dir: ' ' }, // Unmodified
                ],
            };
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockResolvedValue(mockStatus),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual({
                    addedFiles: ['staged.txt', 'added.txt', 'deleted.txt', 'renamed.txt'],
                    fileCount: 4,
                });
            }
        });
        it('should handle status command failure', async () => {
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockRejectedValue(new Error('Git status failed')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to add files: Git status failed');
            }
        });
    });
});
