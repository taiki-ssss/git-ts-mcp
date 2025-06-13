import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { createGitCheckoutHandler, gitCheckoutInputSchema } from '../server.js';
import * as lib from '../lib.js';
import { ok, err } from 'neverthrow';

vi.mock('../lib.js');

describe('createGitCheckoutHandler', () => {
  const mockGitCheckout = vi.mocked(lib.gitCheckout);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効なパラメータでgitCheckoutを呼び出す', async () => {
      const mockResult = {
        success: true,
        previousBranch: 'main',
        currentBranch: 'feature',
        message: 'Switched to branch \'feature\''
      };
      mockGitCheckout.mockResolvedValue(ok(mockResult));

      const handler = createGitCheckoutHandler();
      const result = await handler({
        repoPath: '/test/repo',
        target: 'feature',
        force: false
      });

      expect(mockGitCheckout).toHaveBeenCalledWith({
        repoPath: '/test/repo',
        target: 'feature',
        force: false
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2)
          }
        ]
      });
    });

    it('ファイル指定でgitCheckoutを呼び出す', async () => {
      const mockResult = {
        success: true,
        previousBranch: 'main',
        currentBranch: 'main',
        message: 'Updated 2 paths from feature',
        modifiedFiles: ['file1.txt', 'file2.txt']
      };
      mockGitCheckout.mockResolvedValue(ok(mockResult));

      const handler = createGitCheckoutHandler();
      const result = await handler({
        repoPath: '/test/repo',
        target: 'feature',
        files: ['file1.txt', 'file2.txt']
      });

      expect(mockGitCheckout).toHaveBeenCalledWith({
        repoPath: '/test/repo',
        target: 'feature',
        force: false,
        files: ['file1.txt', 'file2.txt']
      });
    });

    it('デフォルト値でgitCheckoutを呼び出す', async () => {
      const mockResult = {
        success: true,
        previousBranch: 'main',
        currentBranch: 'develop',
        message: 'Switched to branch \'develop\''
      };
      mockGitCheckout.mockResolvedValue(ok(mockResult));

      const handler = createGitCheckoutHandler();
      await handler({
        repoPath: '/test/repo',
        target: 'develop'
      });

      expect(mockGitCheckout).toHaveBeenCalledWith({
        repoPath: '/test/repo',
        target: 'develop',
        force: false
      });
    });
  });

  describe('異常系', () => {
    it('無効なパラメータの場合エラーを返す', async () => {
      const handler = createGitCheckoutHandler();
      const result = await handler({
        repoPath: '',
        target: 'main'
      });

      expect(result.content[0]).toEqual({
        type: 'text',
        text: expect.stringContaining('Invalid parameters')
      });
      expect(mockGitCheckout).not.toHaveBeenCalled();
    });

    it('gitCheckoutがエラーを返した場合エラーメッセージを返す', async () => {
      mockGitCheckout.mockResolvedValue(err(new Error('Branch not found')));

      const handler = createGitCheckoutHandler();
      const result = await handler({
        repoPath: '/test/repo',
        target: 'non-existent'
      });

      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Error: Branch not found'
      });
    });
  });
});

describe('gitCheckoutInputSchema', () => {
  it('有効な入力を受け入れる', () => {
    const validInput = {
      repoPath: '/test/repo',
      target: 'feature',
      force: true,
      files: ['file1.txt', 'file2.txt']
    };

    const result = gitCheckoutInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it('必須パラメータのみでも有効', () => {
    const validInput = {
      repoPath: '/test/repo',
      target: 'main'
    };

    const result = gitCheckoutInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.force).toBe(false); // デフォルト値
    }
  });

  it('空のrepoPathは無効', () => {
    const invalidInput = {
      repoPath: '',
      target: 'main'
    };

    const result = gitCheckoutInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('空のtargetは無効', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      target: ''
    };

    const result = gitCheckoutInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('空のファイル名は無効', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      target: 'main',
      files: ['file1.txt', '']
    };

    const result = gitCheckoutInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});