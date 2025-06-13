import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitCheckout } from '../lib.js';
import { existsSync } from 'fs';
import * as simpleGitModule from 'simple-git';

vi.mock('fs');
vi.mock('simple-git');

describe('gitCheckout edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Gitリポジトリでないディレクトリの場合はエラーを返す', async () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockReturnValue(true);

    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(false)
    };

    vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

    const result = await gitCheckout({
      repoPath: '/some/path',
      target: 'main'
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe('The specified path is not a git repository');
    }
  });

  it('Git操作でエラーが発生した場合はエラーを返す', async () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockReturnValue(true);

    const mockGit = {
      checkIsRepo: vi.fn().mockRejectedValue(new Error('Git operation failed'))
    };

    vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

    const result = await gitCheckout({
      repoPath: '/some/path',
      target: 'main'
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('Git checkout failed:');
    }
  });
});