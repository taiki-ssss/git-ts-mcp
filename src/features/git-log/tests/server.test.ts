import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { createGitLogHandler, gitLogInputSchema } from '../server.js';
import * as lib from '../lib.js';
import { ok, err } from 'neverthrow';

vi.mock('../lib');

describe('createGitLogHandler', () => {
  const mockGitLog = vi.mocked(lib.gitLog);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効なパラメータでgitLogを呼び出す', async () => {
      const mockResult = {
        logs: [
          {
            hash: 'abc123',
            date: '2024-01-01T00:00:00Z',
            message: 'Test commit',
            author: 'Test User',
            email: 'test@example.com'
          }
        ]
      };
      mockGitLog.mockResolvedValue(ok(mockResult));

      const handler = createGitLogHandler();
      const result = await handler({
        repoPath: '/test/repo',
        maxCount: 5,
        branch: 'main'
      });

      expect(mockGitLog).toHaveBeenCalledWith({
        repoPath: '/test/repo',
        maxCount: 5,
        branch: 'main'
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

    it('デフォルト値でgitLogを呼び出す', async () => {
      const mockResult = { logs: [] };
      mockGitLog.mockResolvedValue(ok(mockResult));

      const handler = createGitLogHandler();
      const result = await handler({
        repoPath: '/test/repo'
      });

      expect(mockGitLog).toHaveBeenCalledWith({
        repoPath: '/test/repo',
        maxCount: 10
      });
    });
  });

  describe('異常系', () => {
    it('無効なパラメータの場合エラーを返す', async () => {
      const handler = createGitLogHandler();
      const result = await handler({
        repoPath: '',
        maxCount: -1
      });

      expect(result.content[0]).toEqual({
        type: 'text',
        text: expect.stringContaining('Invalid parameters')
      });
      expect(mockGitLog).not.toHaveBeenCalled();
    });

    it('gitLogがエラーを返した場合エラーメッセージを返す', async () => {
      mockGitLog.mockResolvedValue(err(new Error('Repository not found')));

      const handler = createGitLogHandler();
      const result = await handler({
        repoPath: '/test/repo'
      });

      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Error: Repository not found'
      });
    });
  });
});

describe('gitLogInputSchema', () => {
  it('有効な入力を受け入れる', () => {
    const validInput = {
      repoPath: '/test/repo',
      maxCount: 20,
      branch: 'develop'
    };

    const result = gitLogInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it('必須のrepoPathのみでも有効', () => {
    const validInput = {
      repoPath: '/test/repo'
    };

    const result = gitLogInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('空のrepoPathは無効', () => {
    const invalidInput = {
      repoPath: '',
      maxCount: 10
    };

    const result = gitLogInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('負のmaxCountは無効', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      maxCount: -5
    };

    const result = gitLogInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('0のmaxCountは無効', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      maxCount: 0
    };

    const result = gitLogInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('空のbranchは無効', () => {
    const invalidInput = {
      repoPath: '/test/repo',
      branch: ''
    };

    const result = gitLogInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});