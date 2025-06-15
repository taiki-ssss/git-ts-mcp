import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitCommitHandler } from '../server.js';
import { simpleGit } from 'simple-git';
vi.mock('simple-git');
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn())
}));
describe('Git Commit Validation', () => {
    let mockGit;
    beforeEach(() => {
        mockGit = {
            checkIsRepo: vi.fn().mockResolvedValue(true),
            status: vi.fn().mockResolvedValue({
                files: [{ path: 'test.ts', index: 'M', working_dir: ' ' }],
            }),
            add: vi.fn().mockResolvedValue(undefined),
            commit: vi.fn().mockResolvedValue({
                commit: 'abc123',
                summary: { changes: 1, insertions: 10, deletions: 5 },
            }),
            log: vi.fn().mockResolvedValue({
                latest: { hash: 'abc123', message: 'test' },
            }),
        };
        simpleGit.mockReturnValue(mockGit);
    });
    it('should handle numeric repo path', async () => {
        const result = await gitCommitHandler({
            repoPath: 123,
            message: 'test commit',
        });
        expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
    });
    it('should handle numeric message', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: 123,
        });
        expect(result.content[0].text).toBe('Error: Commit message is required and must be a string');
    });
    it('should handle boolean message', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: true,
        });
        expect(result.content[0].text).toBe('Error: Commit message is required and must be a string');
    });
    it('should handle object message', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: { text: 'commit' },
        });
        expect(result.content[0].text).toBe('Error: Commit message is required and must be a string');
    });
    it('should handle array message', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: ['commit', 'message'],
        });
        expect(result.content[0].text).toBe('Error: Commit message is required and must be a string');
    });
    it('should handle whitespace-only message', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: '   \t\n   ',
        });
        expect(result.content[0].text).toBe('Error: Commit message cannot be empty');
    });
    it('should accept valid message with leading/trailing spaces', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: '  valid commit message  ',
        });
        expect(result.content[0].text).toContain('Successfully created commit');
    });
});
