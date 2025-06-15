import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitCommitHandler } from '../server.js';
import { simpleGit } from 'simple-git';
vi.mock('simple-git');
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn())
}));
describe('Git Commit Tool Handler', () => {
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
    it('should execute git commit successfully', async () => {
        const result = await gitCommitHandler({
            repoPath: '/path/to/repo',
            message: 'test commit message',
        });
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('Successfully created commit');
        expect(simpleGit).toHaveBeenCalledWith('/path/to/repo');
    });
    it('should handle different repository paths correctly', async () => {
        const result = await gitCommitHandler({
            repoPath: '/another/repo/path',
            message: 'test commit',
        });
        expect(result.content[0].text).toContain('Successfully created commit');
        expect(simpleGit).toHaveBeenCalledWith('/another/repo/path');
    });
});
