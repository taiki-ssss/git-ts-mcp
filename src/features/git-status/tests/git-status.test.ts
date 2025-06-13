import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { gitStatusHandler } from '../server.js';
import { simpleGit } from 'simple-git';

vi.mock('simple-git');
vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn())
}));

describe('Git Status Functionality', () => {
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      status: vi.fn().mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        ahead: 2,
        behind: 1,
        staged: ['file1.ts', 'file2.ts'],
        modified: ['file3.ts'],
        not_added: ['file4.ts', 'file5.ts'],
        files: [
          { path: 'file1.ts', index: 'A', working_dir: ' ' },
          { path: 'file2.ts', index: 'M', working_dir: ' ' },
          { path: 'file3.ts', index: ' ', working_dir: 'M' },
          { path: 'file4.ts', index: '?', working_dir: '?' },
          { path: 'file5.ts', index: '?', working_dir: '?' },
        ],
      }),
      branch: vi.fn().mockResolvedValue({
        current: 'main',
        all: ['main', 'develop', 'feature/test'],
      }),
    };

    (simpleGit as unknown as Mock).mockReturnValue(mockGit);
  });

  it('should successfully get repository status', async () => {
    const result = await gitStatusHandler({
      repoPath: '/path/to/repo',
    });

    expect(mockGit.checkIsRepo).toHaveBeenCalled();
    expect(mockGit.status).toHaveBeenCalled();
    expect(mockGit.branch).toHaveBeenCalled();
    
    expect(result.content[0].text).toContain('Repository Status for: /path/to/repo');
    expect(result.content[0].text).toContain('Current branch: main');
    expect(result.content[0].text).toContain('Staged files:');
    expect(result.content[0].text).toContain('file1.ts');
    expect(result.content[0].text).toContain('file2.ts');
    expect(result.content[0].text).toContain('Modified files:');
    expect(result.content[0].text).toContain('file3.ts');
    expect(result.content[0].text).toContain('Untracked files:');
    expect(result.content[0].text).toContain('file4.ts');
    expect(result.content[0].text).toContain('file5.ts');
    expect(result.content[0].text).toContain('Branch is 2 commits ahead, 1 commits behind');
  });

  it('should handle clean repository', async () => {
    mockGit.status.mockResolvedValue({
      current: 'main',
      tracking: 'origin/main',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      not_added: [],
      files: [],
    });

    const result = await gitStatusHandler({
      repoPath: '/path/to/repo',
    });

    expect(result.content[0].text).toContain('No staged files');
    expect(result.content[0].text).toContain('No modified files');
    expect(result.content[0].text).toContain('No untracked files');
    expect(result.content[0].text).toContain('Branch is up to date with remote');
  });

  it('should handle invalid repository path', async () => {
    mockGit.checkIsRepo.mockResolvedValue(false);

    const result = await gitStatusHandler({
      repoPath: '/invalid/path',
    });

    expect(mockGit.checkIsRepo).toHaveBeenCalled();
    expect(result.content[0].text).toBe("Error: The path '/invalid/path' is not a git repository");
  });

  it('should handle git errors', async () => {
    mockGit.status.mockRejectedValue(new Error('Failed to get status: permission denied'));

    const result = await gitStatusHandler({
      repoPath: '/path/to/repo',
    });

    expect(result.content[0].text).toBe('Error: Failed to get status: permission denied');
  });
});