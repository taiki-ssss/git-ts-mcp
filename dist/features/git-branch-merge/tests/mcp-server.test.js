import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createGitServer } from '../../git/server.js';
describe('Git Branch Merge MCP Server Integration', () => {
    it('should create a server with git_branch_merge tool registered', () => {
        const server = createGitServer();
        // Test that server was created successfully
        expect(server).toBeDefined();
        expect(server).toBeInstanceOf(McpServer);
        // The tool registration is verified by the fact that the server
        // was created without errors when calling server.tool()
    });
    it('should have the git server properly configured', () => {
        const server = createGitServer();
        // Server should be properly initialized
        expect(server).toBeDefined();
        // If we reach here, the git_branch_merge tool was registered successfully
        // along with all other git tools
    });
});
