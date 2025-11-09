import { config } from "../config.js";
import packageJson from "../../package.json" assert { type: "json" };

export const customFetch = async (url: string, options?: RequestInit) => {
  const headers: HeadersInit = {
    "X-Redmine-API-Key": config.redmineApiKey,
    "Accept": "application/json",
    "User-Agent": `Redmine-MCP-Server/${packageJson.version}`,
    ...options?.headers,
  };

  // Ensure redmineUrl ends with a slash for proper URL joining
  const baseUrl = config.redmineUrl.endsWith('/') ? config.redmineUrl : `${config.redmineUrl}/`;
  // Remove leading slash from url to ensure proper joining
  const relativePath = url.startsWith('/') ? url.slice(1) : url;
  const fullUrl = new URL(relativePath, baseUrl).toString();

  console.error(`Fetching URL: ${fullUrl}`);

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  console.error(`Response status: ${res.status}`);

  return res;
};
