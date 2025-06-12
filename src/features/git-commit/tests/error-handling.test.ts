import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { z } from 'zod';
import { gitCommitHandler } from '../server.js';
import { simpleGit } from 'simple-git';

vi.mock('simple-git');
vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn())
}));

describe('Git Commit Error Handling', () => {
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      status: vi.fn().mockResolvedValue({
        files: [{ path: 'test.ts', index: 'M', working_dir: ' ' }],
      }),
      add: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue({
        commit: 'abc123',
        summary: { changes: 1, insertions: 10, deletions: 5 },
      }),
      log: vi.fn().mockResolvedValue({
        latest: { hash: 'abc123', message: 'test' },
      }),
    };

    (simpleGit as unknown as Mock).mockReturnValue(mockGit);
  });
  it('should handle empty repo path gracefully', async () => {
    const result = await gitCommitHandler({
      repoPath: '',
      message: 'test commit',
    });

    expect(result.content[0].text).toBe('Error: Repository path cannot be empty');
  });

  it('should handle empty message gracefully', async () => {
    const result = await gitCommitHandler({
      repoPath: '/path/to/repo',
      message: '',
    });

    expect(result.content[0].text).toBe('Error: Commit message cannot be empty');
  });

  it('should handle missing repo path parameter', async () => {
    const result = await gitCommitHandler({
      repoPath: undefined as any,
      message: 'test commit',
    });

    expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
  });

  it('should handle missing message parameter', async () => {
    const result = await gitCommitHandler({
      repoPath: '/path/to/repo',
      message: undefined as any,
    });

    expect(result.content[0].text).toBe('Error: Commit message is required and must be a string');
  });

  it('should handle invalid repo path type', async () => {
    const result = await gitCommitHandler({
      repoPath: 123 as any,
      message: 'test commit',
    });

    expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
  });

  it('should handle null repo path parameter', async () => {
    const result = await gitCommitHandler({
      repoPath: null as any,
      message: 'test commit',
    });

    expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
  });

  it('should handle extremely long message', async () => {
    const longMessage = 'a'.repeat(10000);
    const result = await gitCommitHandler({
      repoPath: '/path/to/repo',
      message: longMessage,
    });

    // Long messages are allowed
    expect(result.content[0].text).toContain('Successfully created commit');
  });

  it('should handle whitespace-only repo path', async () => {
    const result = await gitCommitHandler({
      repoPath: '   \t\n   ',
      message: 'test commit',
    });

    expect(result.content[0].text).toBe('Error: Repository path cannot be empty');
  });

  it('should handle repo path with special characters', async () => {
    const result = await gitCommitHandler({
      repoPath: '/path/with spaces/and@special#chars',
      message: 'test commit',
    });

    // Special characters in paths are allowed
    expect(result.content[0].text).toContain('Successfully created commit');
  });
});