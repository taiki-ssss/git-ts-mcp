import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGitServer } from "../features/git/index.js";
// Create Git MCP server with multiple tools
const server = createGitServer();
async function startStdioServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Git MCP Server running on stdio");
}
startStdioServer().catch((error) => {
    console.error("Fatal error in startStdioServer():", error);
    process.exit(1);
});
