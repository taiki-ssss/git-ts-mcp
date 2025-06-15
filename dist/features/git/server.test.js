import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGitServer } from './server.js';
// Mock the sub-modules
vi.mock('../git-commit/index.js', () => ({
    createGitCommitHandler: vi.fn(() => vi.fn()),
    gitCommitInputSchema: { parse: vi.fn() },
}));
vi.mock('../git-status/index.js', () => ({
    createGitStatusHandler: vi.fn(() => vi.fn()),
    gitStatusInputSchema: { parse: vi.fn() },
}));
vi.mock('../git-add/index.js', () => ({
    createGitAddHandler: vi.fn(() => vi.fn()),
    gitAddInputSchema: { parse: vi.fn() },
}));
// Mock McpServer
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: vi.fn().mockImplementation(() => ({
        tool: vi.fn(),
    })),
}));
describe('Git Server Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should create a server and register all git tools', async () => {
        // Simply test that the server can be created without errors
        const server = createGitServer();
        expect(server).toBeDefined();
        // Check that handlers were created
        const { createGitCommitHandler } = await import('../git-commit/index.js');
        const { createGitStatusHandler } = await import('../git-status/index.js');
        const { createGitAddHandler } = await import('../git-add/index.js');
        expect(createGitCommitHandler).toHaveBeenCalled();
        expect(createGitStatusHandler).toHaveBeenCalled();
        expect(createGitAddHandler).toHaveBeenCalled();
    });
});
