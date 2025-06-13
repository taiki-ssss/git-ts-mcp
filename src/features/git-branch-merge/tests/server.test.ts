import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { createGitBranchMergeHandler, gitBranchMergeInputSchema } from '../server.js';
import * as lib from '../lib.js';
import { ok, err } from 'neverthrow';

vi.mock('../lib.js');

describe('createGitBranchMergeHandler', () => {
  describe('successful handler operations', () => {
    it('should merge branches successfully with minimal parameters', async () => {
      const mockResult = {
        success: true,
        mergeType: 'merge' as const,
        targetBranch: 'main',
        sourceBranch: 'feature-branch',
        commitHash: 'abc123',
      };

      vi.mocked(lib.mergeBranch).mockResolvedValue(ok(mockResult));

      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
      });

      expect(lib.mergeBranch).toHaveBeenCalledWith(
        '/test/repo',
        'feature-branch',
        undefined,
        'merge',
        undefined,
        false
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Successfully merged feature-branch into main\nMerge type: merge\nCommit: abc123',
          },
        ],
      });
    });

    it('should merge branches with all parameters specified', async () => {
      const mockResult = {
        success: true,
        mergeType: 'fast-forward' as const,
        targetBranch: 'develop',
        sourceBranch: 'feature-branch',
        commitHash: 'def456',
      };

      vi.mocked(lib.mergeBranch).mockResolvedValue(ok(mockResult));

      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
        targetBranch: 'develop',
        strategy: 'fast-forward',
        message: 'Custom merge message',
        noCommit: false,
      });

      expect(lib.mergeBranch).toHaveBeenCalledWith(
        '/test/repo',
        'feature-branch',
        'develop',
        'fast-forward',
        'Custom merge message',
        false
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Successfully merged feature-branch into develop\nMerge type: fast-forward\nCommit: def456',
          },
        ],
      });
    });

    it('should handle merge without commit', async () => {
      const mockResult = {
        success: true,
        mergeType: 'merge' as const,
        targetBranch: 'main',
        sourceBranch: 'feature-branch',
      };

      vi.mocked(lib.mergeBranch).mockResolvedValue(ok(mockResult));

      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
        noCommit: true,
      });

      expect(result.content[0].text).toContain(
        'Successfully merged feature-branch into main'
      );
      expect(result.content[0].text).not.toContain('Commit:');
    });
  });

  describe('error handling', () => {
    it('should handle invalid parameters', async () => {
      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        // Missing required sourceBranch
      });

      expect(result.content[0].text).toContain('Invalid parameters');
    });

    it('should handle merge conflicts', async () => {
      vi.mocked(lib.mergeBranch).mockResolvedValue(
        err(new Error('Merge conflict occurred. Conflicted files: file1.txt, file2.txt'))
      );

      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'feature-branch',
      });

      expect(result.content[0].text).toBe(
        'Merge conflict occurred. Conflicted files: file1.txt, file2.txt'
      );
    });

    it('should handle other merge errors', async () => {
      vi.mocked(lib.mergeBranch).mockResolvedValue(
        err(new Error('Source branch does not exist'))
      );

      const handler = createGitBranchMergeHandler();
      const result = await handler({
        repoPath: '/test/repo',
        sourceBranch: 'non-existent-branch',
      });

      expect(result.content[0].text).toBe('Source branch does not exist');
    });
  });
});

describe('gitBranchMergeInputSchema', () => {
  it('should validate correct input', () => {
    const validInput = {
      repoPath: '/test/repo',
      sourceBranch: 'feature-branch',
    };

    const result = gitBranchMergeInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate input with all optional fields', () => {
    const validInput = {
      repoPath: '/test/repo',
      sourceBranch: 'feature-branch',
      targetBranch: 'develop',
      strategy: 'fast-forward',
      message: 'Custom message',
      noCommit: true,
    };

    const result = gitBranchMergeInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid strategy', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      sourceBranch: 'feature-branch',
      strategy: 'invalid-strategy',
    };

    const result = gitBranchMergeInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      // Missing sourceBranch
    };

    const result = gitBranchMergeInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});