import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
describe('MCP Server Basic Structure for Git Branch List', () => {
    let mockTransport;
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
    it('should create a server with git_branch_list tool', () => {
        const server = new McpServer({
            name: 'git-branch-list-server',
            version: '1.0.0',
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        expect(server).toBeDefined();
        expect(server).toBeInstanceOf(McpServer);
    });
    it('should register git_branch_list tool with correct schema', () => {
        const server = new McpServer({
            name: 'git-branch-list-server',
            version: '1.0.0',
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        const toolSpy = vi.spyOn(server, 'tool');
        server.tool('git_branch_list', 'Get the list of branches in a git repository', {
            repoPath: {
                type: 'string',
                description: 'Path to the git repository',
            },
            includeRemote: {
                type: 'boolean',
                description: 'Include remote branches in the list',
                default: false,
            },
        }, vi.fn());
        expect(toolSpy).toHaveBeenCalledWith('git_branch_list', 'Get the list of branches in a git repository', expect.objectContaining({
            repoPath: expect.any(Object),
            includeRemote: expect.any(Object),
        }), expect.any(Function));
    });
});
