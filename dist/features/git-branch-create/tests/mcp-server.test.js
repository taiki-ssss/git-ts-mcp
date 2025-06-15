import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
describe('MCP Server Basic Structure for Git Branch Create', () => {
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
    it('should create a server with git_branch_create tool', () => {
        const server = new McpServer({
            name: 'git-branch-create-server',
            version: '1.0.0',
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        expect(server).toBeDefined();
        expect(server).toBeInstanceOf(McpServer);
    });
    it('should register git_branch_create tool with correct schema', () => {
        const server = new McpServer({
            name: 'git-branch-create-server',
            version: '1.0.0',
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        const toolSpy = vi.spyOn(server, 'tool');
        server.tool('git_branch_create', 'Create a new git branch', {
            repoPath: {
                type: 'string',
                description: 'Path to the git repository',
            },
            branchName: {
                type: 'string',
                description: 'Name of the branch to create',
            },
            baseBranch: {
                type: 'string',
                description: 'Base branch to create from (optional)',
            },
            checkout: {
                type: 'boolean',
                description: 'Checkout the branch after creation',
                default: false,
            },
        }, vi.fn());
        expect(toolSpy).toHaveBeenCalledWith('git_branch_create', 'Create a new git branch', expect.objectContaining({
            repoPath: expect.any(Object),
            branchName: expect.any(Object),
            baseBranch: expect.any(Object),
            checkout: expect.any(Object),
        }), expect.any(Function));
    });
});
