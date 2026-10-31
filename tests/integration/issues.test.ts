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
let issueId: number;

beforeAll(async () => {
  server = await startIntegrationServer();
  projectId = await createTestProject(server, ["issue_tracking"]);
});

afterAll(async () => {
  if (projectId) await deleteTestProject(server, projectId);
  await server?.close();
});

const getIssue = async (include: string[] = []) =>
  expectStatus(
    await server.callTool("getIssue", { pathParams: { format: "json", issueId }, queryParams: { include } }),
    200
  ).issue;

describe("Issues", () => {
  it("creates an issue", async () => {
    const data = expectStatus(
      await server.callTool("createIssue", {
        pathParams: { format: "json" },
        bodyParams: { issue: { project_id: projectId, subject: "テストチケット", description: "説明" } },
      }),
      201
    );
    issueId = data.issue.id;

    const issue = await getIssue();
    expect(issue).toMatchObject({ subject: "テストチケット", description: "説明", project: { id: projectId } });
  });

  it("adds a note and an attachment when updating", async () => {
    const token = await uploadText(server, "issue.txt", "attached to issue");
    expectStatus(
      await server.callTool("updateIssue", {
        pathParams: { format: "json", issueId },
        bodyParams: { issue: { notes: "コメント追加", uploads: [{ token, filename: "issue.txt" }] } },
      }),
      204
    );

    const issue = await getIssue(["journals", "attachments"]);
    expect(issue.journals.map((j: { notes: string }) => j.notes)).toContain("コメント追加");
    expect(issue.attachments.map((a: { filename: string }) => a.filename)).toEqual(["issue.txt"]);
  });

  it("returns 422 for an invalid update", async () => {
    const result = await server.callTool("updateIssue", {
      pathParams: { format: "json", issueId },
      bodyParams: { issue: { subject: "" } },
    });

    expect(result.json.status).toBe(422);
    expect(result.json.data.errors.length).toBeGreaterThan(0);
  });

  it("deletes the issue", async () => {
    expectStatus(await server.callTool("deleteIssue", { pathParams: { format: "json", issueId } }), 204);

    const result = await server.callTool("getIssue", {
      pathParams: { format: "json", issueId },
      queryParams: {},
    });
    expect(result.json.status).toBe(404);
  });
});
