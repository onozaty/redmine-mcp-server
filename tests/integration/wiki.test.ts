import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { McpServer } from "../helpers/mcp";
import {
  createTestProject,
  deleteTestProject,
  expectStatus,
  startIntegrationServer,
  uploadText,
} from "../helpers/integration";

let server: McpServer;
let projectId: number;

beforeAll(async () => {
  server = await startIntegrationServer();
  projectId = await createTestProject(server, ["wiki"]);
});

afterAll(async () => {
  if (projectId) await deleteTestProject(server, projectId);
  await server?.close();
});

const putPage = async (title: string, wikiPage: Record<string, unknown>) =>
  expectStatus(
    await server.callTool("updateWikiPage", {
      pathParams: { format: "json", projectId, wikiPageTitle: title },
      bodyParams: { wiki_page: wikiPage },
    }),
    201,
    204
  );

const getPage = async (title: string) =>
  expectStatus(
    await server.callTool("getWikiPage", {
      pathParams: { format: "json", projectId, wikiPageTitle: title },
      queryParams: { include: "attachments" },
    }),
    200
  ).wiki_page;

describe("Wiki pages", () => {
  it("creates a page with a Japanese title and reads it back", async () => {
    await putPage("日本語ページ", { text: "本文です", comments: "作成" });

    const page = await getPage("日本語ページ");
    expect(page.title).toBe("日本語ページ");
    expect(page.text).toBe("本文です");
    expect(page.comments).toBe("作成");
  });

  describe("parent_title", () => {
    beforeAll(async () => {
      await putPage("ParentA", { text: "parent A" });
      await putPage("親ページB", { text: "parent B" });
    });

    it("sets the parent when creating a page", async () => {
      await putPage("Child", { text: "child", parent_title: "ParentA" });

      expect((await getPage("Child")).parent).toEqual({ title: "ParentA" });
    });

    it("changes the parent of an existing page", async () => {
      await putPage("Child", { text: "child", parent_title: "親ページB" });

      expect((await getPage("Child")).parent).toEqual({ title: "親ページB" });
    });

    it("keeps the parent when parent_title is omitted", async () => {
      await putPage("Child", { text: "child updated" });

      expect((await getPage("Child")).parent).toEqual({ title: "親ページB" });
    });

    it("removes the parent with an empty parent_title", async () => {
      await putPage("Child", { text: "child", parent_title: "" });

      expect((await getPage("Child")).parent).toBeUndefined();
    });

    it("rejects a parent that does not exist", async () => {
      const result = await server.callTool("updateWikiPage", {
        pathParams: { format: "json", projectId, wikiPageTitle: "Orphan" },
        bodyParams: { wiki_page: { text: "orphan", parent_title: "NoSuchPage" } },
      });

      expect(result.json.status).toBe(422);
    });
  });

  describe("uploads", () => {
    const attachmentNames = async (title: string) =>
      (await getPage(title)).attachments.map((a: { filename: string }) => a.filename);

    it("attaches files when creating a page", async () => {
      const token = await uploadText(server, "create.txt", "on create");
      await putPage("WithFiles", {
        text: "files",
        uploads: [{ token, filename: "create.txt", description: "on create", content_type: "text/plain" }],
      });

      const [attachment] = (await getPage("WithFiles")).attachments;
      expect(attachment).toMatchObject({ filename: "create.txt", description: "on create", filesize: 9 });
    });

    it("adds files when updating a page", async () => {
      const token = await uploadText(server, "update.txt", "on update");
      await putPage("WithFiles", { text: "files updated", uploads: [{ token, filename: "update.txt" }] });

      expect(await attachmentNames("WithFiles")).toEqual(["create.txt", "update.txt"]);
    });

    it("keeps existing files when uploads is omitted", async () => {
      await putPage("WithFiles", { text: "files updated again" });

      expect(await attachmentNames("WithFiles")).toEqual(["create.txt", "update.txt"]);
    });
  });
});
