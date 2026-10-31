import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";
import { McpServer, startServer } from "../helpers/mcp";
import { MockRedmine, startMockRedmine } from "../helpers/mock-redmine";

let redmine: MockRedmine;
let server: McpServer;

beforeAll(async () => {
  redmine = await startMockRedmine();
  server = await startServer({ REDMINE_URL: redmine.url, REDMINE_API_KEY: "dummy-key" });
});

afterAll(async () => {
  await server.close();
  await redmine.close();
});

afterEach(() => {
  redmine.requests.length = 0;
});

const getIssue = () => server.callTool("getIssue", { pathParams: { format: "json", issueId: 1 }, queryParams: {} });
const updateWikiPage = () =>
  server.callTool("updateWikiPage", {
    pathParams: { format: "json", projectId: 1, wikiPageTitle: "Page" },
    bodyParams: { wiki_page: { text: "body" } },
  });

describe("responses from Redmine", () => {
  it("returns the JSON body with the status", async () => {
    redmine.respond(() => ({ status: 200, body: { issue: { id: 1, subject: "Subject" } } }));

    const result = await getIssue();

    expect(result.isError).toBe(false);
    expect(result.json).toMatchObject({ status: 200, data: { issue: { id: 1, subject: "Subject" } } });
  });

  it("returns empty data for 204 No Content", async () => {
    redmine.respond(() => ({ status: 204 }));

    const result = await updateWikiPage();

    expect(result.isError).toBe(false);
    expect(result.json).toMatchObject({ status: 204, data: {} });
  });

  // JSON error responses are passed through rather than reported as tool errors
  it.each([403, 404, 409, 422])("passes through a JSON %i response", async (status) => {
    redmine.respond(() => ({ status, body: { errors: ["Something is wrong"] } }));

    const result = await updateWikiPage();

    expect(result.isError).toBe(false);
    expect(result.json).toMatchObject({ status, data: { errors: ["Something is wrong"] } });
  });

  it("reports an HTML error page as a tool error", async () => {
    redmine.respond(() => ({ status: 500, body: "<html>Internal error</html>", contentType: "text/html" }));

    const result = await getIssue();

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Expected JSON but received HTML (HTTP 500)");
  });

  it("reports a failed upload as a tool error", async () => {
    redmine.respond(() => ({ status: 422, body: { errors: ["File too large"] } }));

    const result = await server.callTool("uploadAttachmentFromBase64Content", {
      pathParams: { content: Buffer.from("x").toString("base64"), filename: "x.txt" },
    });

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Upload failed with status 422");
  });
});
