import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

vi.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('MCP Server Basic Structure for Git Add', () => {
  let mockTransport: any;

  beforeEach(() => {
    mockTransport = {
      onMessage: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
    };
    
    vi.mocked(StdioServerTransport).mockReturnValue(mockTransport);
  });

  it('should create a server with git_add tool', () => {
    const server = new McpServer({
      name: 'git-add-server',
      version: '1.0.0',
      capabilities: {
        resources: {},
        tools: {},
      },
    });

    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(McpServer);
  });

  it('should register git_add tool with correct schema', () => {
    const server = new McpServer({
      name: 'git-add-server',
      version: '1.0.0',
      capabilities: {
        resources: {},
        tools: {},
      },
    });

    const toolSpy = vi.spyOn(server, 'tool');
    
    server.tool(
      'git_add',
      'Add files to the git staging area',
      {
        repoPath: {
          type: 'string',
          description: 'Path to the git repository',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to add (optional, defaults to all)',
        },
      },
      vi.fn()
    );

    expect(toolSpy).toHaveBeenCalledWith(
      'git_add',
      'Add files to the git staging area',
      expect.objectContaining({
        repoPath: expect.any(Object),
        files: expect.any(Object),
      }),
      expect.any(Function)
    );
  });
});