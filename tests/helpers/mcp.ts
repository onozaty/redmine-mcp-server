/**
 * Helpers for driving the built MCP server over stdio
 */
import { fileURLToPath } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export const SERVER_PATH = fileURLToPath(new URL("../../dist/server.mjs", import.meta.url));

export interface ToolResult {
  isError: boolean;
  text: string;
  json: any;
}

export interface McpServer {
  client: Client;
  callTool: (name: string, args: Record<string, unknown>) => Promise<ToolResult>;
  close: () => Promise<void>;
}

/**
 * Start the server with only the given environment variables, so the
 * developer's own REDMINE_* settings never leak into a test.
 */
export const startServer = async (env: Record<string, string>): Promise<McpServer> => {
  const client = new Client({ name: "redmine-mcp-server-test", version: "0.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
    env: { PATH: process.env.PATH ?? "", ...env },
    stderr: "ignore",
  });
  await client.connect(transport);

  const callTool = async (name: string, args: Record<string, unknown>): Promise<ToolResult> => {
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as { type: string; text?: string }[];
    const text = content.map((c) => c.text ?? "").join("\n");
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { isError: result.isError === true, text, json };
  };

  return { client, callTool, close: () => client.close() };
};
