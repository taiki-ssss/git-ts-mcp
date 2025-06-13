import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBranch } from '../lib.js';
import type { GitBranchCreateResult } from '../types.js';
import { Result, ok, err } from 'neverthrow';

vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => ({
    branchLocal: vi.fn(),
    branch: vi.fn(),
    checkout: vi.fn(),
    checkoutBranch: vi.fn(),
  })),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

describe('Git Branch Create Library', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { existsSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValue(true);
  });

  describe('createBranch', () => {
    it('should create a new branch from current HEAD', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
        checkoutBranch: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.branchName).toBe('feature-new');
        expect(result.value.baseBranch).toBe('main');
        expect(result.value.message).toContain("Created branch 'feature-new' from 'main'");
        expect(result.value.checkedOut).toBe(false);
      }
      expect(mockGit.checkoutBranch).toHaveBeenCalledWith('feature-new', 'main');
    });

    it('should create a new branch from specified base branch', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main', 'develop'],
          branches: { 
            main: { current: true },
            develop: { current: false },
          },
        }),
        checkoutBranch: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new', 'develop', false);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.baseBranch).toBe('develop');
        expect(result.value.message).toContain("Created branch 'feature-new' from 'develop'");
      }
      expect(mockGit.checkoutBranch).toHaveBeenCalledWith('feature-new', 'develop');
    });

    it('should create and checkout new branch when checkout is true', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
        checkoutBranch: vi.fn().mockResolvedValue(undefined),
        checkout: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new', undefined, true);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.checkedOut).toBe(true);
        expect(result.value.message).toContain("Created branch 'feature-new' from 'main' and checked out");
      }
      expect(mockGit.checkout).toHaveBeenCalledWith('feature-new');
    });

    it('should return error when repoPath is empty', async () => {
      const result = await createBranch('', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path cannot be empty');
      }
    });

    it('should return error when branchName is empty', async () => {
      const result = await createBranch('/test/repo', '');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Branch name cannot be empty');
      }
    });

    it('should return error when repository does not exist', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await createBranch('/non/existent/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path does not exist: /non/existent/repo');
      }
    });

    it('should return error when branch already exists', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main', 'feature-new'],
          branches: { 
            main: { current: true },
            'feature-new': { current: false },
          },
        }),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Branch 'feature-new' already exists");
      }
    });

    it('should return error when base branch does not exist', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new', 'nonexistent');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Base branch 'nonexistent' does not exist");
      }
    });

    it('should validate branch name', async () => {
      const result = await createBranch('/test/repo', 'feature..new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid branch name: 'feature..new'");
      }
    });

    it('should handle git command errors', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
        checkoutBranch: vi.fn().mockRejectedValue(new Error('Git error')),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to create branch');
        expect(result.error.message).toContain('Git error');
      }
    });
  });
});