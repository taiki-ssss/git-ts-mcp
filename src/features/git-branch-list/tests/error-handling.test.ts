import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBranchList } from '../lib.js';
import { err } from 'neverthrow';

vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => ({
    branchLocal: vi.fn(),
    branch: vi.fn(),
  })),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

describe('Git Branch List Error Handling', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { existsSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValue(true);
  });

  describe('Input Validation Errors', () => {
    it('should return error for empty repository path', async () => {
      const result = await getBranchList('', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path cannot be empty');
      }
    });

    it('should return error for whitespace-only repository path', async () => {
      const result = await getBranchList('   ', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path cannot be empty');
      }
    });

    it('should return error when repository does not exist', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await getBranchList('/non/existent/repo', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path does not exist: /non/existent/repo');
      }
    });
  });

  describe('Git Operation Errors', () => {
    it('should handle git branchLocal command failure', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockRejectedValue(new Error('fatal: not a git repository')),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await getBranchList('/test/repo', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get branch list');
        expect(result.error.message).toContain('fatal: not a git repository');
      }
    });

    it('should handle git branch command failure when fetching remotes', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
        branch: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await getBranchList('/test/repo', true);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get branch list');
        expect(result.error.message).toContain('Network error');
      }
    });

    it('should handle corrupted git repository', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockRejectedValue(new Error('fatal: your current branch \'main\' does not have any commits yet')),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await getBranchList('/test/repo', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get branch list');
        expect(result.error.message).toContain('does not have any commits');
      }
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle non-Error exceptions', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockRejectedValue('string error'),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await getBranchList('/test/repo', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to get branch list: Unknown error');
      }
    });

    it('should handle null/undefined errors gracefully', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockRejectedValue(null),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await getBranchList('/test/repo', false);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to get branch list: Unknown error');
      }
    });
  });
});