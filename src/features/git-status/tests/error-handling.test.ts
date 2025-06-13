import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { gitStatusHandler } from '../server.js';
import { simpleGit } from 'simple-git';

vi.mock('simple-git');
vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn())
}));

describe('Git Status Error Handling', () => {
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      status: vi.fn().mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        not_added: [],
        files: [],
      }),
      branch: vi.fn().mockResolvedValue({
        current: 'main',
        all: ['main'],
      }),
    };

    (simpleGit as unknown as Mock).mockReturnValue(mockGit);
  });

  it('should handle empty repo path gracefully', async () => {
    const result = await gitStatusHandler({
      repoPath: '',
    });

    expect(result.content[0].text).toBe('Error: Repository path cannot be empty');
  });

  it('should handle missing repo path parameter', async () => {
    const result = await gitStatusHandler({
      repoPath: undefined as any,
    });

    expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
  });

  it('should handle null repo path parameter', async () => {
    const result = await gitStatusHandler({
      repoPath: null as any,
    });

    expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
  });

  it('should handle numeric repo path', async () => {
    const result = await gitStatusHandler({
      repoPath: 123 as any,
    });

    expect(result.content[0].text).toBe('Error: Repository path is required and must be a string');
  });

  it('should handle whitespace-only repo path', async () => {
    const result = await gitStatusHandler({
      repoPath: '   \t\n   ',
    });

    expect(result.content[0].text).toBe('Error: Repository path cannot be empty');
  });

  it('should handle repo path with special characters', async () => {
    const result = await gitStatusHandler({
      repoPath: '/path/with spaces/and@special#chars',
    });

    // Special characters in paths are allowed
    expect(result.content[0].text).toContain('Repository Status for: /path/with spaces/and@special#chars');
  });

  it('should handle git status command failure', async () => {
    mockGit.status.mockRejectedValue(new Error('fatal: not a git repository'));

    const result = await gitStatusHandler({
      repoPath: '/path/to/repo',
    });

    expect(result.content[0].text).toBe('Error: fatal: not a git repository');
  });

  it('should handle git branch command failure', async () => {
    mockGit.branch.mockRejectedValue(new Error('fatal: unable to read current branch'));

    const result = await gitStatusHandler({
      repoPath: '/path/to/repo',
    });

    expect(result.content[0].text).toBe('Error: fatal: unable to read current branch');
  });

  it('should handle repository without remote tracking', async () => {
    mockGit.status.mockResolvedValue({
      current: 'feature-branch',
      tracking: null,
      ahead: 0,
      behind: 0,
      staged: ['newfile.ts'],
      modified: [],
      not_added: [],
      files: [
        { path: 'newfile.ts', index: 'A', working_dir: ' ' },
      ],
    });
    
    mockGit.branch.mockResolvedValue({
      current: 'feature-branch',
      all: ['main', 'feature-branch'],
    });

    const result = await gitStatusHandler({
      repoPath: '/path/to/repo',
    });

    expect(result.content[0].text).toContain('Current branch: feature-branch');
    expect(result.content[0].text).toContain('Branch is up to date with remote');
  });
});