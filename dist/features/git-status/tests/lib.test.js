import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performGitStatus } from '../lib.js';
import * as simpleGitModule from 'simple-git';
vi.mock('simple-git');
describe('Git Status Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('performGitStatus', () => {
        it('should successfully get repository status', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    staged: ['file1.txt'],
                    modified: ['file2.txt', 'file3.txt'],
                    not_added: ['file4.txt'],
                    ahead: 2,
                    behind: 1,
                    files: [],
                }),
                branch: vi.fn().mockResolvedValue({
                    current: 'main',
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitStatus('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const text = result.value.content[0].text;
                expect(text).toContain('Repository Status for: /test/repo');
                expect(text).toContain('Current branch: main');
                expect(text).toContain('Staged files:\n  - file1.txt');
                expect(text).toContain('Modified files:\n  - file2.txt\n  - file3.txt');
                expect(text).toContain('Untracked files:\n  - file4.txt');
                expect(text).toContain('Branch is 2 commits ahead, 1 commits behind');
            }
        });
        it('should handle clean repository', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    staged: [],
                    modified: [],
                    not_added: [],
                    ahead: 0,
                    behind: 0,
                    files: [],
                }),
                branch: vi.fn().mockResolvedValue({
                    current: 'develop',
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitStatus('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const text = result.value.content[0].text;
                expect(text).toContain('Repository Status for: /test/repo');
                expect(text).toContain('Current branch: develop');
                expect(text).toContain('No staged files');
                expect(text).toContain('No modified files');
                expect(text).toContain('No untracked files');
                expect(text).toContain('Branch is up to date with remote');
            }
        });
        it('should return error when repoPath is empty', async () => {
            const result = await performGitStatus('');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repoPath is whitespace-only', async () => {
            const result = await performGitStatus('   ');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repoPath is null', async () => {
            const result = await performGitStatus(null);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path is required and must be a string');
            }
        });
        it('should return error when repoPath is undefined', async () => {
            const result = await performGitStatus(undefined);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path is required and must be a string');
            }
        });
        it('should return error when path is not a git repository', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(false),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitStatus('/test/repo');
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
            const result = await performGitStatus('/test/repo');
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
            const result = await performGitStatus('/test/repo');
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
            const result = await performGitStatus('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to get status');
            }
        });
        it('should handle branch check failure', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    staged: [],
                    modified: [],
                    not_added: [],
                    ahead: 0,
                    behind: 0,
                    files: [],
                }),
                branch: vi.fn().mockRejectedValue(new Error('Failed to get branch')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitStatus('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to get branch');
            }
        });
        it('should handle repository with only staged files', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    staged: ['staged1.txt', 'staged2.txt'],
                    modified: [],
                    not_added: [],
                    ahead: 0,
                    behind: 0,
                    files: [],
                }),
                branch: vi.fn().mockResolvedValue({
                    current: 'feature',
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitStatus('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const text = result.value.content[0].text;
                expect(text).toContain('Staged files:\n  - staged1.txt\n  - staged2.txt');
                expect(text).toContain('No modified files');
                expect(text).toContain('No untracked files');
            }
        });
        it('should handle repository ahead of remote', async () => {
            const mockGit = {
                checkIsRepo: vi.fn().mockResolvedValue(true),
                status: vi.fn().mockResolvedValue({
                    staged: [],
                    modified: [],
                    not_added: [],
                    ahead: 5,
                    behind: 0,
                    files: [],
                }),
                branch: vi.fn().mockResolvedValue({
                    current: 'main',
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitStatus('/test/repo');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const text = result.value.content[0].text;
                expect(text).toContain('Branch is 5 commits ahead, 0 commits behind');
            }
        });
    });
});
