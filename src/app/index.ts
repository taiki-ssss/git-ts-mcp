import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGitCommitServer } from "../features/git-commit/index.js";

// Create Git Commit MCP server
const server = createGitCommitServer();

async function startStdioServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Git Commit MCP Server running on stdio");
}

startStdioServer().catch((error) => {
  console.error("Fatal error in startStdioServer():", error);
  process.exit(1);
});