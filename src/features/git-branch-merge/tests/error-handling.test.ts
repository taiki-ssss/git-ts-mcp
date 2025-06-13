import { describe, it, expect, vi } from 'vitest';
import { simpleGit, SimpleGit } from 'simple-git';
import { mergeBranch } from '../lib.js';
import { createGitBranchMergeHandler } from '../server.js';

vi.mock('simple-git');

describe('Git Branch Merge Error Handling', () => {
  describe('mergeBranch error handling', () => {
    it('should handle git initialization error', async () => {
      vi.mocked(simpleGit).mockImplementation(() => {
        throw new Error('Failed to initialize git');
      });

      const result = await mergeBranch('/invalid/repo', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to initialize git');
      }
    });

    it('should handle revparse error when getting current branch', async () => {
      const mockGit = {
        revparse: vi.fn().mockRejectedValue(new Error('Not a git repository')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Not a git repository');
      }
    });

    it('should handle branch listing error', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockRejectedValue(new Error('Failed to list branches')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to list branches');
      }
    });

    it('should handle checkout error', async () => {
      const mockGit = {
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'target-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        checkout: vi.fn().mockRejectedValue(new Error('Failed to checkout branch')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        'target-branch'
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to checkout branch');
      }
    });

    it('should handle permission denied error', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockRejectedValue(new Error('Permission denied')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Permission denied');
      }
    });

    it('should handle commit error for squash merge', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockResolvedValue({
          result: 'success',
        }),
        commit: vi.fn().mockRejectedValue(new Error('Failed to commit')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        undefined,
        'squash'
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to commit');
      }
    });

    it('should handle log error when getting commit hash', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockResolvedValue({
          result: 'success',
        }),
        log: vi.fn().mockRejectedValue(new Error('Failed to get log')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get log');
      }
    });

    it('should handle conflict with empty conflicted files list', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockRejectedValue(new Error('conflict')),
        status: vi.fn().mockResolvedValue({
          conflicted: [],
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Merge conflict occurred');
      }
    });

    it('should handle status error when checking for conflicts', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockRejectedValue(new Error('CONFLICTS')),
        status: vi.fn().mockRejectedValue(new Error('Failed to get status')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get status');
      }
    });
  });

  describe('handler parameter validation', () => {
    it('should reject empty repoPath', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '',
        sourceBranch: 'feature-branch',
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should reject empty sourceBranch', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: '',
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should reject invalid strategy', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
        strategy: 'invalid-strategy',
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should reject invalid noCommit type', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
        noCommit: 'true', // Should be boolean
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should reject non-string message', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
        message: 123, // Should be string
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should reject non-string targetBranch', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
        targetBranch: true, // Should be string
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should handle null parameters', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler(null);

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should handle undefined parameters', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler(undefined);

      expect(result.content[0].text).toContain('Invalid parameters');
    });
  });
});