import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { gitCommitHandler } from '../git-commit/server.js';
import { gitStatusHandler } from '../git-status/server.js';
import { createGitAddHandler } from '../git-add/server.js';

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

  return server;
}