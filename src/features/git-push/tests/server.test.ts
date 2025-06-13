import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { createGitPushHandler, gitPushInputSchema } from '../server.js';
import { performGitPush } from '../lib.js';
import { ok, err } from 'neverthrow';

vi.mock('../lib');

describe('createGitPushHandler', () => {
  const mockPerformGitPush = vi.mocked(performGitPush);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate input parameters', async () => {
    const handler = createGitPushHandler();
    
    const result = await handler({});
    
    expect(result.content[0].text).toContain('Invalid parameters');
    expect(result.content[0].text).toContain('repoPath: Required');
  });

  it('should handle successful push with minimal parameters', async () => {
    mockPerformGitPush.mockResolvedValue(ok({
      success: true,
      remote: 'origin',
      branch: 'main',
      commits: {
        pushed: 1,
        hash: 'abc123',
        message: 'Test commit'
      },
      message: 'Successfully pushed 1 commit(s) to origin/main',
      warnings: []
    }));

    const handler = createGitPushHandler();
    const result = await handler({
      repoPath: '/test/repo'
    });

    expect(mockPerformGitPush).toHaveBeenCalledWith({
      repoPath: '/test/repo'
    });
    expect(result.content[0].text).toContain('Successfully pushed 1 commit(s) to origin/main');
  });

  it('should handle all optional parameters', async () => {
    mockPerformGitPush.mockResolvedValue(ok({
      success: true,
      remote: 'upstream',
      branch: 'feature',
      commits: {
        pushed: 2,
        hash: 'def456',
        message: 'Feature commit'
      },
      tags: ['v1.0.0'],
      message: 'Successfully pushed 2 commit(s) to upstream/feature',
      warnings: ['Force push was used']
    }));

    const handler = createGitPushHandler();
    const result = await handler({
      repoPath: '/test/repo',
      remote: 'upstream',
      branch: 'feature',
      tags: true,
      force: true,
      setUpstream: true,
      deleteRemote: false
    });

    expect(mockPerformGitPush).toHaveBeenCalledWith({
      repoPath: '/test/repo',
      remote: 'upstream',
      branch: 'feature',
      tags: true,
      force: true,
      setUpstream: true,
      deleteRemote: false
    });

    const text = result.content[0].text;
    expect(text).toContain('Successfully pushed 2 commit(s) to upstream/feature');
    expect(text).toContain('Warning: Force push was used');
    expect(text).toContain('Tags pushed: v1.0.0');
  });

  it('should handle push errors', async () => {
    mockPerformGitPush.mockResolvedValue(err(new Error('Authentication failed')));

    const handler = createGitPushHandler();
    const result = await handler({
      repoPath: '/test/repo'
    });

    expect(result.content[0].text).toBe('Authentication failed');
  });

  it('should format delete branch success message', async () => {
    mockPerformGitPush.mockResolvedValue(ok({
      success: true,
      remote: 'origin',
      branch: 'feature-branch',
      commits: {
        pushed: 0,
        hash: '',
        message: ''
      },
      message: 'Successfully deleted remote branch "feature-branch" from "origin"',
      warnings: []
    }));

    const handler = createGitPushHandler();
    const result = await handler({
      repoPath: '/test/repo',
      branch: 'feature-branch',
      deleteRemote: true
    });

    expect(result.content[0].text).toContain('Successfully deleted remote branch "feature-branch" from "origin"');
  });

  it('should format already up to date message', async () => {
    mockPerformGitPush.mockResolvedValue(ok({
      success: true,
      remote: 'origin',
      branch: 'main',
      commits: {
        pushed: 0,
        hash: '',
        message: ''
      },
      message: 'Already up to date',
      warnings: []
    }));

    const handler = createGitPushHandler();
    const result = await handler({
      repoPath: '/test/repo'
    });

    expect(result.content[0].text).toContain('Already up to date');
  });
});

describe('gitPushInputSchema', () => {
  it('should validate required fields', () => {
    const result = gitPushInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['repoPath']);
    }
  });

  it('should validate valid input', () => {
    const result = gitPushInputSchema.safeParse({
      repoPath: '/test/repo',
      remote: 'origin',
      branch: 'main',
      tags: true,
      force: false,
      setUpstream: true,
      deleteRemote: false
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid types', () => {
    const result = gitPushInputSchema.safeParse({
      repoPath: '/test/repo',
      force: 'yes' // Should be boolean
    });
    expect(result.success).toBe(false);
  });
});