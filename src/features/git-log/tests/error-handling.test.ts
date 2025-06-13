import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitLog } from '../lib.js';
import { existsSync } from 'fs';
import * as simpleGitModule from 'simple-git';

vi.mock('fs');
vi.mock('simple-git');

describe('gitLog error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Gitリポジトリではないディレクトリの場合はエラーを返す', async () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockReturnValue(true);

    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(false)
    };

    vi.mocked(simpleGitModule.simpleGit).mockReturnValue(mockGit as any);

    const result = await gitLog({ repoPath: '/some/path' });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe('The specified path is not a git repository');
    }
  });
});