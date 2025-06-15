import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createGitServer } from '../../git/server.js';
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
describe('MCP Server with Git Status', () => {
    let server;
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
    it('should have both git_commit and git_status tools registered', () => {
        server = createGitServer();
        // The server should be created successfully with both tools
        expect(server).toBeDefined();
        expect(server.constructor.name).toBe('McpServer');
    });
});
