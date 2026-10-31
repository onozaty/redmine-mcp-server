/**
 * Helpers for integration tests against a real Redmine
 *
 * The target is given by REDMINE_TEST_URL / REDMINE_TEST_API_KEY rather than
 * REDMINE_URL / REDMINE_API_KEY, so the tests never write to an instance
 * configured for everyday use by accident.
 */
import { McpServer, ToolResult, startServer } from "./mcp";

export const startIntegrationServer = async (): Promise<McpServer> => {
  const url = process.env.REDMINE_TEST_URL;
  const apiKey = process.env.REDMINE_TEST_API_KEY;
  if (!url || !apiKey) {
    throw new Error("Set REDMINE_TEST_URL and REDMINE_TEST_API_KEY to run the integration tests.");
  }
  return startServer({ REDMINE_URL: url, REDMINE_API_KEY: apiKey });
};

/**
 * Return the Redmine response body, failing on tool errors and unexpected statuses
 */
export const expectStatus = (result: ToolResult, ...statuses: number[]) => {
  if (result.isError || !statuses.includes(result.json?.status)) {
    throw new Error(`Expected HTTP ${statuses.join(" or ")}, got: ${result.text}`);
  }
  return result.json.data;
};

export const createTestProject = async (server: McpServer, modules: string[]) => {
  const identifier = `mcp-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const data = expectStatus(
    await server.callTool("createProject", {
      pathParams: { format: "json" },
      bodyParams: { project: { name: identifier, identifier, enabled_module_names: modules } },
    }),
    201
  );
  return data.project.id as number;
};

export const deleteTestProject = async (server: McpServer, projectId: number) => {
  await server.callTool("deleteProject", { pathParams: { format: "json", projectId } });
};

export const uploadText = async (server: McpServer, filename: string, text: string) => {
  const result = await server.callTool("uploadAttachmentFromBase64Content", {
    pathParams: { content: Buffer.from(text).toString("base64"), filename },
  });
  if (result.isError) {
    throw new Error(`Upload failed: ${result.text}`);
  }
  return result.json.token as string;
};
