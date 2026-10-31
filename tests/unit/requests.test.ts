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
  redmine.respond(() => ({ status: 200, body: {} }));
});

const json = (body: Buffer) => JSON.parse(body.toString("utf8"));

describe("requests sent to Redmine", () => {
  it("sends GET with query parameters and the API key", async () => {
    await server.callTool("getIssue", {
      pathParams: { format: "json", issueId: 123 },
      queryParams: { include: ["journals", "attachments"] },
    });

    const [req] = redmine.requests;
    expect(req.method).toBe("GET");
    // Arrays are sent as one comma-separated value, which Redmine accepts
    expect(req.url).toBe("/issues/123.json?include=journals%2Cattachments");
    expect(req.headers["x-redmine-api-key"]).toBe("dummy-key");
  });

  it("sends POST with a JSON body", async () => {
    const issue = { project_id: 1, subject: "Test subject", description: "Body" };
    redmine.respond(() => ({ status: 201, body: { issue: { id: 10 } } }));

    await server.callTool("createIssue", { pathParams: { format: "json" }, bodyParams: { issue } });

    const [req] = redmine.requests;
    expect(req.method).toBe("POST");
    expect(req.url).toBe("/issues.json");
    expect(req.headers["content-type"]).toBe("application/json");
    expect(json(req.body)).toEqual({ issue });
  });

  it("sends updateWikiPage with parent_title and uploads", async () => {
    const wiki_page = {
      text: "本文",
      parent_title: "親ページ",
      uploads: [{ token: "1.abc", filename: "a.txt", content_type: "text/plain" }],
    };

    await server.callTool("updateWikiPage", {
      pathParams: { format: "json", projectId: 1, wikiPageTitle: "子ページ" },
      bodyParams: { wiki_page },
    });

    const [req] = redmine.requests;
    expect(req.method).toBe("PUT");
    expect(decodeURIComponent(req.url)).toBe("/projects/1/wiki/子ページ.json");
    expect(json(req.body)).toEqual({ wiki_page });
  });

  it("sends an empty parent_title as is to remove the parent", async () => {
    await server.callTool("updateWikiPage", {
      pathParams: { format: "json", projectId: 1, wikiPageTitle: "Page" },
      bodyParams: { wiki_page: { text: "body", parent_title: "" } },
    });

    expect(json(redmine.requests[0].body)).toEqual({ wiki_page: { text: "body", parent_title: "" } });
  });

  it("rejects invalid arguments without contacting Redmine", async () => {
    await expect(
      server.callTool("updateWikiPage", {
        pathParams: { format: "json", projectId: 1, wikiPageTitle: "Page" },
        bodyParams: { wiki_page: { comments: "text is missing" } },
      })
    ).rejects.toThrow(/text/);
    expect(redmine.requests).toHaveLength(0);
  });

  it("uploads Base64 content as octet-stream and returns the token", async () => {
    redmine.respond(() => ({ status: 201, body: { upload: { id: 5, token: "5.token" } } }));

    const result = await server.callTool("uploadAttachmentFromBase64Content", {
      pathParams: { content: Buffer.from("hello").toString("base64"), filename: "hello.txt" },
    });

    const [req] = redmine.requests;
    expect(req.method).toBe("POST");
    expect(req.url).toBe("/uploads.json?filename=hello.txt");
    expect(req.headers["content-type"]).toBe("application/octet-stream");
    expect(req.body.toString("utf8")).toBe("hello");
    expect(result.json).toMatchObject({ success: true, token: "5.token", id: 5 });
  });
});

describe("Redmine deployed under a subpath", () => {
  it("prefixes the subpath, with or without a trailing slash", async () => {
    const sub = await startMockRedmine("/redmine/");
    const s = await startServer({ REDMINE_URL: sub.url, REDMINE_API_KEY: "dummy-key" });
    try {
      await s.callTool("getIssue", { pathParams: { format: "json", issueId: 1 }, queryParams: {} });
      expect(sub.requests[0].url).toBe("/redmine/issues/1.json");
    } finally {
      await s.close();
      await sub.close();
    }
  });
});
