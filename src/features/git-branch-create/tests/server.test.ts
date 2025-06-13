import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitBranchCreateHandler } from '../server.js';
import type { GitBranchCreateResult } from '../types.js';
import { Result, ok, err } from 'neverthrow';

vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock('../lib.js', () => ({
  createBranch: vi.fn(),
}));

describe('Git Branch Create Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGitBranchCreateHandler', () => {
    it('should create a handler function', () => {
      const handler = createGitBranchCreateHandler();
      expect(handler).toBeInstanceOf(Function);
    });

    it('should handle valid request with minimal parameters', async () => {
      const { createBranch } = await import('../lib.js');
      const mockResult: GitBranchCreateResult = {
        success: true,
        branchName: 'feature-new',
        baseBranch: 'main',
        message: "Created branch 'feature-new' from 'main'",
        checkedOut: false,
      };
      vi.mocked(createBranch).mockResolvedValue(ok(mockResult));

      const handler = createGitBranchCreateHandler();
      const result = await handler({
        repoPath: '/test/repo',
        branchName: 'feature-new',
      });

      expect(createBranch).toHaveBeenCalledWith('/test/repo', 'feature-new', undefined, false);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
      const text = (result.content[0] as any).text;
      const parsed = JSON.parse(text);
      expect(parsed).toEqual(mockResult);
    });

    it('should handle request with all parameters', async () => {
      const { createBranch } = await import('../lib.js');
      const mockResult: GitBranchCreateResult = {
        success: true,
        branchName: 'feature-new',
        baseBranch: 'develop',
        message: "Created branch 'feature-new' from 'develop' and checked out",
        checkedOut: true,
      };
      vi.mocked(createBranch).mockResolvedValue(ok(mockResult));

      const handler = createGitBranchCreateHandler();
      const result = await handler({
        repoPath: '/test/repo',
        branchName: 'feature-new',
        baseBranch: 'develop',
        checkout: true,
      });

      expect(createBranch).toHaveBeenCalledWith('/test/repo', 'feature-new', 'develop', true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      const text = (result.content[0] as any).text;
      const parsed = JSON.parse(text);
      expect(parsed).toEqual(mockResult);
    });

    it('should handle invalid parameters - missing repoPath', async () => {
      const handler = createGitBranchCreateHandler();
      const result = await handler({
        branchName: 'feature-new',
      });

      expect(result.content[0]).toHaveProperty('type', 'text');
      const text = (result.content[0] as any).text;
      expect(text).toContain('Invalid parameters');
    });

    it('should handle invalid parameters - missing branchName', async () => {
      const handler = createGitBranchCreateHandler();
      const result = await handler({
        repoPath: '/test/repo',
      });

      expect(result.content[0]).toHaveProperty('type', 'text');
      const text = (result.content[0] as any).text;
      expect(text).toContain('Invalid parameters');
    });

    it('should handle createBranch errors', async () => {
      const { createBranch } = await import('../lib.js');
      vi.mocked(createBranch).mockResolvedValue(
        err(new Error('Branch already exists'))
      );

      const handler = createGitBranchCreateHandler();
      const result = await handler({
        repoPath: '/test/repo',
        branchName: 'feature-new',
      });

      expect(result.content[0]).toHaveProperty('type', 'text');
      const text = (result.content[0] as any).text;
      expect(text).toContain('Error:');
      expect(text).toContain('Branch already exists');
    });
  });
});