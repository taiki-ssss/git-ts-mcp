import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { gitCommitHandler } from '../git-commit/server.js';
import { gitStatusHandler } from '../git-status/server.js';
import { createGitAddHandler } from '../git-add/server.js';
import { createGitBranchListHandler } from '../git-branch-list/server.js';
import { createGitBranchCreateHandler } from '../git-branch-create/server.js';
import { createGitBranchMergeHandler } from '../git-branch-merge/server.js';
import { createGitLogHandler } from '../git-log/server.js';
import { createGitCheckoutHandler } from '../git-checkout/server.js';
import { createGitPushHandler } from '../git-push/server.js';

export function createGitServer(): McpServer {
  const server = new McpServer({
    name: 'git-server',
    version: '1.0.0',
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register git_commit tool
  server.tool(
    'git_commit',
    'Create a git commit in the specified repository',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      message: z.string().min(1).describe('Commit message'),
    },
    gitCommitHandler
  );

  // Register git_status tool
  server.tool(
    'git_status',
    'Get the status of a git repository',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
    },
    gitStatusHandler
  );

  // Register git_add tool
  server.tool(
    'git_add',
    'Add files to the git staging area',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      files: z.array(z.string()).optional().describe('Files to add (optional, defaults to all)'),
    },
    createGitAddHandler()
  );

  // Register git_branch_list tool
  server.tool(
    'git_branch_list',
    'Get the list of branches in a git repository',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      includeRemote: z.boolean().optional().describe('Include remote branches in the list'),
    },
    createGitBranchListHandler()
  );

  // Register git_branch_create tool
  server.tool(
    'git_branch_create',
    'Create a new git branch',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      branchName: z.string().min(1).describe('Name of the branch to create'),
      baseBranch: z.string().optional().describe('Base branch to create from (optional)'),
      checkout: z.boolean().optional().describe('Checkout the branch after creation'),
    },
    createGitBranchCreateHandler()
  );

  // Register git_branch_merge tool
  server.tool(
    'git_branch_merge',
    'Merge git branches',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      sourceBranch: z.string().min(1).describe('Branch to merge from'),
      targetBranch: z.string().optional().describe('Branch to merge into (optional, defaults to current branch)'),
      strategy: z.enum(['merge', 'fast-forward', 'squash']).optional().describe('Merge strategy'),
      message: z.string().optional().describe('Custom merge commit message'),
      noCommit: z.boolean().optional().describe('Perform merge without committing'),
    },
    createGitBranchMergeHandler()
  );

  // Register git_log tool
  server.tool(
    'git_log',
    'Get commit history from a git repository',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      maxCount: z.number().positive().optional().describe('Maximum number of commits to return'),
      branch: z.string().min(1).optional().describe('Branch name to get logs from'),
    },
    createGitLogHandler()
  );

  // Register git_checkout tool
  server.tool(
    'git_checkout',
    'Switch branches or restore working tree files',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      target: z.string().min(1).describe('Branch name, commit hash, or tag to checkout'),
      force: z.boolean().optional().describe('Force checkout even with uncommitted changes'),
      files: z.array(z.string().min(1)).optional().describe('Specific files to checkout'),
    },
    createGitCheckoutHandler()
  );

  // Register git_push tool
  server.tool(
    'git_push',
    'Push changes to remote repository',
    {
      repoPath: z.string().min(1).describe('Path to the git repository'),
      remote: z.string().optional().describe('Remote name (default: origin)'),
      branch: z.string().optional().describe('Branch to push (default: current branch)'),
      tags: z.boolean().optional().describe('Push tags'),
      force: z.boolean().optional().describe('Force push'),
      setUpstream: z.boolean().optional().describe('Set upstream branch'),
      deleteRemote: z.boolean().optional().describe('Delete remote branch'),
    },
    createGitPushHandler()
  );

  return server;
}