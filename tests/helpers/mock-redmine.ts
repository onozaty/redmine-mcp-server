/**
 * Minimal HTTP server standing in for Redmine in unit tests
 */
import http from "http";
import { AddressInfo } from "net";

export interface RecordedRequest {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

export interface MockResponse {
  status: number;
  body?: unknown;
  contentType?: string;
}

export interface MockRedmine {
  url: string;
  requests: RecordedRequest[];
  respond: (handler: (req: RecordedRequest) => MockResponse) => void;
  close: () => Promise<void>;
}

export const startMockRedmine = async (basePath = ""): Promise<MockRedmine> => {
  const requests: RecordedRequest[] = [];
  let handler: (req: RecordedRequest) => MockResponse = () => ({ status: 200, body: {} });

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const recorded: RecordedRequest = {
        method: req.method ?? "",
        url: req.url ?? "",
        headers: req.headers,
        body: Buffer.concat(chunks),
      };
      requests.push(recorded);

      const { status, body, contentType = "application/json" } = handler(recorded);
      if (body === undefined) {
        res.writeHead(status);
        res.end();
        return;
      }
      res.writeHead(status, { "Content-Type": contentType });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}${basePath}`,
    requests,
    respond: (h) => {
      handler = h;
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
};
