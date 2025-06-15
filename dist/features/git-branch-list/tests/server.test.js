import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitBranchListHandler } from '../server.js';
import { ok, err } from 'neverthrow';
vi.mock('debug', () => ({
    default: vi.fn(() => vi.fn()),
}));
vi.mock('../lib.js', () => ({
    getBranchList: vi.fn(),
}));
describe('Git Branch List Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('createGitBranchListHandler', () => {
        it('should create a handler function', () => {
            const handler = createGitBranchListHandler();
            expect(handler).toBeInstanceOf(Function);
        });
        it('should handle valid request without includeRemote', async () => {
            const { getBranchList } = await import('../lib.js');
            const mockResult = {
                current: 'main',
                local: ['main', 'develop'],
            };
            vi.mocked(getBranchList).mockResolvedValue(ok(mockResult));
            const handler = createGitBranchListHandler();
            const result = await handler({
                repoPath: '/test/repo',
            });
            expect(getBranchList).toHaveBeenCalledWith('/test/repo', false);
            expect(result.content[0]).toHaveProperty('type', 'text');
            expect(result.content[0]).toHaveProperty('text');
            const text = result.content[0].text;
            const parsed = JSON.parse(text);
            expect(parsed).toEqual(mockResult);
        });
        it('should handle valid request with includeRemote', async () => {
            const { getBranchList } = await import('../lib.js');
            const mockResult = {
                current: 'main',
                local: ['main', 'develop'],
                remote: ['remotes/origin/main', 'remotes/origin/develop'],
            };
            vi.mocked(getBranchList).mockResolvedValue(ok(mockResult));
            const handler = createGitBranchListHandler();
            const result = await handler({
                repoPath: '/test/repo',
                includeRemote: true,
            });
            expect(getBranchList).toHaveBeenCalledWith('/test/repo', true);
            expect(result.content[0]).toHaveProperty('type', 'text');
            const text = result.content[0].text;
            const parsed = JSON.parse(text);
            expect(parsed).toEqual(mockResult);
        });
        it('should handle invalid parameters', async () => {
            const handler = createGitBranchListHandler();
            const result = await handler({
            // Missing required repoPath
            });
            expect(result.content[0]).toHaveProperty('type', 'text');
            const text = result.content[0].text;
            expect(text).toContain('Invalid parameters');
        });
        it('should handle getBranchList errors', async () => {
            const { getBranchList } = await import('../lib.js');
            vi.mocked(getBranchList).mockResolvedValue(err(new Error('Not a git repository')));
            const handler = createGitBranchListHandler();
            const result = await handler({
                repoPath: '/test/repo',
            });
            expect(result.content[0]).toHaveProperty('type', 'text');
            const text = result.content[0].text;
            expect(text).toContain('Error:');
            expect(text).toContain('Not a git repository');
        });
    });
});
