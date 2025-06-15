import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitCommitHandler } from '../server.js';
import { simpleGit } from 'simple-git';
vi.mock('simple-git');
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn())
}));
describe('Git Commit Functionality', () => {
    let mockGit;
    beforeEach(() => {
        mockGit = {
            checkIsRepo: vi.fn().mockResolvedValue(true),
            status: vi.fn().mockResolvedValue({
                files: [
                    { path: 'file1.ts', index: 'M', working_dir: ' ' },
                    { path: 'file2.ts', index: 'A', working_dir: ' ' },
                ],
            }),
            add: vi.fn().mockResolvedValue(undefined),
            commit: vi.fn().mockResolvedValue({
                commit: 'abc123def456',
                summary: {
                    changes: 2,
                    insertions: 50,
                    deletions: 10,
                },
            }),
            log: vi.fn().mockResolvedValue({
                latest: {
                    hash: 'abc123def456',
                    message: 'test commit',
                },
            }),
        };
        simpleGit.mockReturnValue(mockGit);
    });
    it('should successfully create a commit', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: 'feat: add new feature',
        });
        expect(mockGit.checkIsRepo).toHaveBeenCalled();
        expect(mockGit.status).toHaveBeenCalled();
        expect(mockGit.add).toHaveBeenCalledWith('.');
        expect(mockGit.commit).toHaveBeenCalledWith('feat: add new feature');
        expect(result.content[0].text).toContain('Successfully created commit: abc123def456');
        expect(result.content[0].text).toContain('Files changed: 2');
        expect(result.content[0].text).toContain('50 insertions, 10 deletions');
    });
    it('should handle repository with no changes', async () => {
        mockGit.status.mockResolvedValue({ files: [] });
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: 'no changes commit',
        });
        expect(mockGit.checkIsRepo).toHaveBeenCalled();
        expect(mockGit.status).toHaveBeenCalled();
        expect(mockGit.add).not.toHaveBeenCalled();
        expect(mockGit.commit).not.toHaveBeenCalled();
        expect(result.content[0].text).toBe('No changes to commit. Working tree is clean.');
    });
    it('should handle invalid repository path', async () => {
        mockGit.checkIsRepo.mockResolvedValue(false);
        const result = await gitCommitHandler({
            repoPath: '/invalid/path',
            message: 'test commit',
        });
        expect(mockGit.checkIsRepo).toHaveBeenCalled();
        expect(result.content[0].text).toBe("Error: The path '/invalid/path' is not a git repository");
    });
    it('should handle git errors', async () => {
        mockGit.commit.mockRejectedValue(new Error('Failed to commit: no user email configured'));
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: 'test commit',
        });
        expect(result.content[0].text).toBe('Error: Failed to commit: no user email configured');
    });
});
