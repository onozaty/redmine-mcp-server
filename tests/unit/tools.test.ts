import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";
import { McpServer, startServer } from "../helpers/mcp";
import { MockRedmine, startMockRedmine } from "../helpers/mock-redmine";

let redmine: MockRedmine;
let server: McpServer | undefined;

beforeAll(async () => {
  redmine = await startMockRedmine();
});

afterAll(async () => {
  await redmine.close();
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  redmine.requests.length = 0;
});

const start = async (env: Record<string, string> = {}) => {
  server = await startServer({ REDMINE_URL: redmine.url, REDMINE_API_KEY: "dummy-key", ...env });
  return server;
};

const toolNames = async (s: McpServer) => (await s.client.listTools()).tools.map((t) => t.name);

describe("tools/list", () => {
  it("marks read-only and write tools with readOnlyHint", async () => {
    const s = await start();
    const tools = (await s.client.listTools()).tools;
    const hint = (name: string) => tools.find((t) => t.name === name)?.annotations?.readOnlyHint;

    expect(tools.every((t) => typeof t.annotations?.readOnlyHint === "boolean")).toBe(true);
    expect(hint("getIssue")).toBe(true);
    expect(hint("downloadAttachmentToLocalFile")).toBe(true);
    expect(hint("updateIssue")).toBe(false);
    expect(hint("uploadAttachmentFromBase64Content")).toBe(false);
  });

  it("exposes the updateWikiPage body fields", async () => {
    const s = await start();
    const tool = (await s.client.listTools()).tools.find((t) => t.name === "updateWikiPage");
    const wikiPage = (tool?.inputSchema.properties as any).bodyParams.properties.wiki_page;

    expect(Object.keys(wikiPage.properties)).toEqual(
      expect.arrayContaining(["text", "comments", "version", "parent_title", "uploads"])
    );
    expect(wikiPage.required).toEqual(["text"]);
    expect(wikiPage.properties.parent_title.type).toBe("string");
    expect(wikiPage.properties.uploads.type).toBe("array");
  });
});

describe("tool filtering", () => {
  it("hides write tools in read-only mode", async () => {
    const s = await start({ REDMINE_MCP_READ_ONLY: "true" });
    const tools = (await s.client.listTools()).tools;

    expect(tools.map((t) => t.name)).toContain("getIssue");
    expect(tools.every((t) => t.annotations?.readOnlyHint === true)).toBe(true);
  });

  it("registers only tools matching the allow pattern", async () => {
    const s = await start({ REDMINE_MCP_TOOLS_ALLOW_PATTERN: "^(getIssue|getIssues)$" });

    expect((await toolNames(s)).sort()).toEqual(["getIssue", "getIssues"]);
  });

  it("gives the deny pattern priority over the allow pattern", async () => {
    const s = await start({
      REDMINE_MCP_TOOLS_ALLOW_PATTERN: "^getIssues?$",
      REDMINE_MCP_TOOLS_DENY_PATTERN: "^getIssues$",
    });

    expect(await toolNames(s)).toEqual(["getIssue"]);
  });

  it("does not let the allow pattern bypass read-only mode", async () => {
    const s = await start({
      REDMINE_MCP_READ_ONLY: "true",
      REDMINE_MCP_TOOLS_ALLOW_PATTERN: "^(getIssue|updateIssue)$",
    });

    expect(await toolNames(s)).toEqual(["getIssue"]);
  });

  it("rejects calls to a disabled tool without contacting Redmine", async () => {
    const s = await start({ REDMINE_MCP_READ_ONLY: "true" });

    await expect(
      s.callTool("updateIssue", { pathParams: { format: "json", issueId: 1 }, bodyParams: { issue: {} } })
    ).rejects.toThrow(/updateIssue/);
    expect(redmine.requests).toHaveLength(0);
  });
});
