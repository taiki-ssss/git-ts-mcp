import { describe, it, expect, vi } from 'vitest';
import { simpleGit, SimpleGit } from 'simple-git';
import { mergeBranch } from '../lib.js';

vi.mock('simple-git');

describe('mergeBranch', () => {
  describe('successful merge scenarios', () => {
    it('should perform a normal merge successfully', async () => {
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
        log: vi.fn().mockResolvedValue({
          latest: { hash: 'abc123' },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({
          success: true,
          mergeType: 'merge',
          targetBranch: 'current-branch',
          sourceBranch: 'source-branch',
          commitHash: 'abc123',
        });
      }

      expect(mockGit.merge).toHaveBeenCalledWith(['source-branch']);
    });

    it('should perform a merge with custom target branch', async () => {
      const mockGit = {
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'target-branch': { current: false },
          },
        }),
        checkout: vi.fn().mockResolvedValue(undefined),
        merge: vi.fn().mockResolvedValue({
          result: 'success',
        }),
        log: vi.fn().mockResolvedValue({
          latest: { hash: 'def456' },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        'target-branch'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.targetBranch).toBe('target-branch');
      }

      expect(mockGit.checkout).toHaveBeenCalledWith('target-branch');
      expect(mockGit.merge).toHaveBeenCalledWith(['source-branch']);
    });

    it('should perform a fast-forward merge when strategy is specified', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockResolvedValue({
          result: 'Fast-forward',
        }),
        log: vi.fn().mockResolvedValue({
          latest: { hash: 'ghi789' },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        undefined,
        'fast-forward'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.mergeType).toBe('fast-forward');
      }

      expect(mockGit.merge).toHaveBeenCalledWith(['source-branch', '--ff-only']);
    });

    it('should perform a squash merge when strategy is specified', async () => {
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
        commit: vi.fn().mockResolvedValue({
          commit: 'jkl012',
        }),
        log: vi.fn().mockResolvedValue({
          latest: { hash: 'jkl012' },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        undefined,
        'squash'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.mergeType).toBe('squash');
      }

      expect(mockGit.merge).toHaveBeenCalledWith(['source-branch', '--squash']);
    });

    it('should use custom merge message when provided', async () => {
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
        log: vi.fn().mockResolvedValue({
          latest: { hash: 'mno345' },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const customMessage = 'Custom merge message';
      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        undefined,
        'merge',
        customMessage
      );

      expect(result.isOk()).toBe(true);
      expect(mockGit.merge).toHaveBeenCalledWith([
        'source-branch',
        '-m',
        customMessage,
      ]);
    });

    it('should perform merge without commit when noCommit is true', async () => {
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
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        undefined,
        'merge',
        undefined,
        true
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.commitHash).toBeUndefined();
      }

      expect(mockGit.merge).toHaveBeenCalledWith(['source-branch', '--no-commit']);
    });
  });

  describe('error scenarios', () => {
    it('should return error when source branch does not exist', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'other-branch': { current: true },
          },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'non-existent-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          'Source branch does not exist: non-existent-branch'
        );
      }
    });

    it('should return error when target branch does not exist', async () => {
      const mockGit = {
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        'non-existent-target'
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          'Target branch does not exist: non-existent-target'
        );
      }
    });

    it('should handle merge conflicts', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockRejectedValue(new Error('CONFLICTS: file1.txt, file2.txt')),
        status: vi.fn().mockResolvedValue({
          conflicted: ['file1.txt', 'file2.txt'],
        }),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch('/repo/path', 'source-branch');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Merge conflict occurred');
      }
    });

    it('should handle fast-forward failure when strategy requires it', async () => {
      const mockGit = {
        revparse: vi.fn().mockResolvedValue('current-branch'),
        branch: vi.fn().mockResolvedValue({
          branches: {
            'source-branch': { current: false },
            'current-branch': { current: true },
          },
        }),
        merge: vi.fn().mockRejectedValue(new Error('Not possible to fast-forward')),
      } as unknown as SimpleGit;

      vi.mocked(simpleGit).mockReturnValue(mockGit);

      const result = await mergeBranch(
        '/repo/path',
        'source-branch',
        undefined,
        'fast-forward'
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to merge branch');
      }
    });
  });
});