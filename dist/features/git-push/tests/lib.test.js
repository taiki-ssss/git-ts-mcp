import { describe, it, expect, vi, beforeEach } from 'vitest';
import { simpleGit } from 'simple-git';
import { performGitPush } from '../lib.js';
vi.mock('simple-git');
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn())
}));
describe('performGitPush', () => {
    let mockGit;
    beforeEach(() => {
        vi.clearAllMocks();
        mockGit = {
            checkIsRepo: vi.fn().mockResolvedValue(true),
            status: vi.fn().mockResolvedValue({
                current: 'main',
                tracking: 'origin/main',
                ahead: 1,
                behind: 0
            }),
            getRemotes: vi.fn().mockResolvedValue([
                { name: 'origin', refs: { push: 'https://github.com/user/repo.git' } }
            ]),
            push: vi.fn().mockResolvedValue({
                pushed: [{ local: 'refs/heads/main', remote: 'refs/heads/main' }],
                branch: { local: 'main', remote: 'main' },
                ref: { local: 'refs/heads/main' },
                remoteMessages: {
                    all: []
                }
            }),
            log: vi.fn().mockResolvedValue({
                latest: {
                    hash: 'abc123',
                    message: 'Latest commit'
                }
            })
        };
        vi.mocked(simpleGit).mockReturnValue(mockGit);
    });
    describe('basic push operations', () => {
        it('should push current branch to origin by default', async () => {
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.success).toBe(true);
                expect(result.value.remote).toBe('origin');
                expect(result.value.branch).toBe('main');
                expect(result.value.message).toContain('Successfully pushed');
                expect(result.value.commits.pushed).toBe(1);
                expect(result.value.commits.hash).toBe('abc123');
                expect(result.value.commits.message).toBe('Latest commit');
            }
            expect(mockGit.push).toHaveBeenCalledWith(['origin', 'main']);
        });
        it('should push to specified remote and branch', async () => {
            const input = {
                repoPath: '/test/repo',
                remote: 'upstream',
                branch: 'feature-branch'
            };
            mockGit.getRemotes = vi.fn().mockResolvedValue([
                { name: 'origin', refs: { push: 'https://github.com/user/repo.git' } },
                { name: 'upstream', refs: { push: 'https://github.com/upstream/repo.git' } }
            ]);
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.remote).toBe('upstream');
                expect(result.value.branch).toBe('feature-branch');
            }
            expect(mockGit.push).toHaveBeenCalledWith(['upstream', 'feature-branch']);
        });
        it('should push with force option', async () => {
            const input = {
                repoPath: '/test/repo',
                force: true
            };
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.warnings).toContain('Force push was used');
            }
            expect(mockGit.push).toHaveBeenCalledWith(['origin', 'main', '--force']);
        });
        it('should set upstream branch', async () => {
            const input = {
                repoPath: '/test/repo',
                setUpstream: true
            };
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            expect(mockGit.push).toHaveBeenCalledWith(['origin', 'main', '--set-upstream']);
        });
        it('should push tags when specified', async () => {
            const input = {
                repoPath: '/test/repo',
                tags: true
            };
            mockGit.tag = vi.fn().mockResolvedValue('v1.0.0\nv1.0.1');
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.tags).toEqual(['v1.0.0', 'v1.0.1']);
            }
            expect(mockGit.push).toHaveBeenCalledWith(['origin', 'main', '--tags']);
        });
        it('should delete remote branch', async () => {
            const input = {
                repoPath: '/test/repo',
                branch: 'feature-to-delete',
                deleteRemote: true
            };
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.message).toContain('deleted');
            }
            expect(mockGit.push).toHaveBeenCalledWith(['origin', '--delete', 'feature-to-delete']);
        });
    });
    describe('error handling', () => {
        it('should handle non-repository path', async () => {
            mockGit.checkIsRepo = vi.fn().mockResolvedValue(false);
            const input = {
                repoPath: '/not/a/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('not a git repository');
            }
        });
        it('should handle missing remote', async () => {
            mockGit.getRemotes = vi.fn().mockResolvedValue([]);
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('No remote');
            }
        });
        it('should handle specified remote not found', async () => {
            const input = {
                repoPath: '/test/repo',
                remote: 'nonexistent'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Remote "nonexistent" not found');
            }
        });
        it('should handle authentication error', async () => {
            mockGit.push = vi.fn().mockRejectedValue(new Error('Authentication failed'));
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Authentication failed');
            }
        });
        it('should handle network error', async () => {
            mockGit.push = vi.fn().mockRejectedValue(new Error('Could not resolve host'));
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Could not resolve host');
            }
        });
        it('should handle non-fast-forward error', async () => {
            mockGit.push = vi.fn().mockRejectedValue(new Error('! [rejected] main -> main (non-fast-forward)'));
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('non-fast-forward');
            }
        });
        it('should handle generic push error', async () => {
            mockGit.push = vi.fn().mockRejectedValue(new Error('Some unexpected error'));
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Push failed: Some unexpected error');
            }
        });
    });
    describe('edge cases', () => {
        it('should handle push with no commits to push', async () => {
            mockGit.status = vi.fn().mockResolvedValue({
                current: 'main',
                tracking: 'origin/main',
                ahead: 0,
                behind: 0
            });
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.commits.pushed).toBe(0);
                expect(result.value.message).toContain('Already up to date');
            }
        });
        it('should handle detached HEAD state', async () => {
            mockGit.status = vi.fn().mockResolvedValue({
                current: null,
                detached: true,
                tracking: null
            });
            const input = {
                repoPath: '/test/repo'
            };
            const result = await performGitPush(input);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('detached HEAD');
            }
        });
    });
});
