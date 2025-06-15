import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBranchList } from '../lib.js';
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn()),
}));
vi.mock('simple-git', () => ({
    simpleGit: vi.fn(() => ({
        branch: vi.fn(),
        branchLocal: vi.fn(),
    })),
}));
vi.mock('fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
}));
describe('Git Branch List Library', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { existsSync } = await import('fs');
        vi.mocked(existsSync).mockReturnValue(true);
    });
    describe('getBranchList', () => {
        it('should return local branches with current branch', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                branchLocal: vi.fn().mockResolvedValue({
                    current: 'main',
                    all: ['main', 'feature-1', 'develop'],
                    branches: {
                        main: { current: true },
                        'feature-1': { current: false },
                        develop: { current: false },
                    },
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await getBranchList('/test/repo', false);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.current).toBe('main');
                expect(result.value.local).toEqual(['main', 'feature-1', 'develop']);
                expect(result.value.remote).toBeUndefined();
            }
        });
        it('should include remote branches when requested', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                branchLocal: vi.fn().mockResolvedValue({
                    current: 'main',
                    all: ['main', 'feature-1'],
                    branches: {
                        main: { current: true },
                        'feature-1': { current: false },
                    },
                }),
                branch: vi.fn().mockResolvedValue({
                    current: 'main',
                    all: ['main', 'feature-1', 'remotes/origin/main', 'remotes/origin/feature-1'],
                    branches: {
                        main: { current: true },
                        'feature-1': { current: false },
                        'remotes/origin/main': { current: false, remote: true },
                        'remotes/origin/feature-1': { current: false, remote: true },
                    },
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await getBranchList('/test/repo', true);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.current).toBe('main');
                expect(result.value.local).toEqual(['main', 'feature-1']);
                expect(result.value.remote).toEqual(['remotes/origin/main', 'remotes/origin/feature-1']);
            }
        });
        it('should handle detached HEAD state', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                branchLocal: vi.fn().mockResolvedValue({
                    current: '',
                    detached: true,
                    all: ['main', 'develop'],
                    branches: {
                        main: { current: false },
                        develop: { current: false },
                    },
                }),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await getBranchList('/test/repo', false);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.current).toBe('HEAD (detached)');
                expect(result.value.local).toEqual(['main', 'develop']);
            }
        });
        it('should return error when repoPath is empty', async () => {
            const result = await getBranchList('', false);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repository does not exist', async () => {
            const { existsSync } = await import('fs');
            vi.mocked(existsSync).mockReturnValue(false);
            const result = await getBranchList('/non/existent/repo', false);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path does not exist: /non/existent/repo');
            }
        });
        it('should handle git command errors', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                branchLocal: vi.fn().mockRejectedValue(new Error('Not a git repository')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await getBranchList('/test/repo', false);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Failed to get branch list');
                expect(result.error.message).toContain('Not a git repository');
            }
        });
    });
});
