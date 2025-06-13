import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBranch } from '../lib.js';
import { err } from 'neverthrow';

vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => ({
    branchLocal: vi.fn(),
    checkoutBranch: vi.fn(),
    checkout: vi.fn(),
  })),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

describe('Git Branch Create Error Handling', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { existsSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValue(true);
  });

  describe('Input Validation Errors', () => {
    it('should return error for empty repository path', async () => {
      const result = await createBranch('', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path cannot be empty');
      }
    });

    it('should return error for whitespace-only repository path', async () => {
      const result = await createBranch('   ', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Repository path cannot be empty');
      }
    });

    it('should return error for empty branch name', async () => {
      const result = await createBranch('/test/repo', '');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Branch name cannot be empty');
      }
    });

    it('should return error for whitespace-only branch name', async () => {
      const result = await createBranch('/test/repo', '   ');
      
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
  });

  describe('Branch Name Validation Errors', () => {
    it('should reject branch names starting with dot', async () => {
      const result = await createBranch('/test/repo', '.hidden-branch');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid branch name: '.hidden-branch'");
      }
    });

    it('should reject branch names containing double dots', async () => {
      const result = await createBranch('/test/repo', 'feature..new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid branch name: 'feature..new'");
      }
    });

    it('should reject branch names ending with slash', async () => {
      const result = await createBranch('/test/repo', 'feature/');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid branch name: 'feature/'");
      }
    });

    it('should reject branch names ending with .lock', async () => {
      const result = await createBranch('/test/repo', 'feature.lock');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid branch name: 'feature.lock'");
      }
    });

    it('should reject branch names containing spaces', async () => {
      const result = await createBranch('/test/repo', 'feature new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid branch name: 'feature new'");
      }
    });

    it('should reject branch names containing special characters', async () => {
      const invalidNames = ['feature~new', 'feature^new', 'feature:new', 'feature?new', 'feature*new', 'feature[new'];
      
      for (const name of invalidNames) {
        const result = await createBranch('/test/repo', name);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe(`Invalid branch name: '${name}'`);
        }
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

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to create branch');
        expect(result.error.message).toContain('fatal: not a git repository');
      }
    });

    it('should handle git checkoutBranch command failure', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
        checkoutBranch: vi.fn().mockRejectedValue(new Error('Permission denied')),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to create branch');
        expect(result.error.message).toContain('Permission denied');
      }
    });

    it('should handle git checkout command failure', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockResolvedValue({
          current: 'main',
          all: ['main'],
          branches: { main: { current: true } },
        }),
        checkoutBranch: vi.fn().mockResolvedValue(undefined),
        checkout: vi.fn().mockRejectedValue(new Error('Checkout failed')),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new', undefined, true);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to create branch');
        expect(result.error.message).toContain('Checkout failed');
      }
    });

    it('should handle branch already exists error', async () => {
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

    it('should handle base branch does not exist error', async () => {
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
  });

  describe('Unexpected Errors', () => {
    it('should handle non-Error exceptions', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockRejectedValue('string error'),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to create branch: Unknown error');
      }
    });

    it('should handle null/undefined errors gracefully', async () => {
      const simpleGitModule = await import('simple-git');
      const mockGit = {
        branchLocal: vi.fn().mockRejectedValue(null),
      };
      vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

      const result = await createBranch('/test/repo', 'feature-new');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to create branch: Unknown error');
      }
    });
  });
});