import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performGitAdd } from '../server.js';
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
describe('Git Add Error Handling', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { existsSync } = await import('fs');
        vi.mocked(existsSync).mockReturnValue(true);
    });
    describe('Input Validation Errors', () => {
        it('should return error for empty repository path', async () => {
            const result = await performGitAdd('');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error for whitespace-only repository path', async () => {
            const result = await performGitAdd('   ');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path cannot be empty');
            }
        });
        it('should return error when repository does not exist', async () => {
            const { existsSync } = await import('fs');
            vi.mocked(existsSync).mockReturnValue(false);
            const result = await performGitAdd('/non/existent/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Repository path does not exist: /non/existent/repo');
            }
        });
    });
    describe('Git Operation Errors', () => {
        it('should handle git add command failure', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockRejectedValue(new Error('fatal: not a git repository')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Failed to add files');
                expect(result.error.message).toContain('fatal: not a git repository');
            }
        });
        it('should handle git status command failure', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockResolvedValue(undefined),
                status: vi.fn().mockRejectedValue(new Error('git status failed')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Failed to add files');
                expect(result.error.message).toContain('git status failed');
            }
        });
        it('should handle permission denied error', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockRejectedValue(new Error('Permission denied')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo', ['protected-file.txt']);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Failed to add files');
                expect(result.error.message).toContain('Permission denied');
            }
        });
        it('should handle file not found error when adding specific files', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockRejectedValue(new Error('pathspec \'nonexistent.txt\' did not match any files')),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo', ['nonexistent.txt']);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Failed to add files');
                expect(result.error.message).toContain('pathspec');
            }
        });
    });
    describe('Unexpected Errors', () => {
        it('should handle non-Error exceptions', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockRejectedValue('string error'),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to add files: Unknown error');
            }
        });
        it('should handle null/undefined errors gracefully', async () => {
            const simpleGitModule = await import('simple-git');
            const mockGit = {
                add: vi.fn().mockRejectedValue(null),
            };
            vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit);
            const result = await performGitAdd('/test/repo');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Failed to add files: Unknown error');
            }
        });
    });
});
