import { config } from "../config.js";
import packageJson from "../../package.json" assert { type: "json" };

export const customFetch = async (url: string, options?: RequestInit) => {
  const headers: HeadersInit = {
    "X-Redmine-API-Key": config.redmineApiKey,
    "Accept": "application/json",
    "User-Agent": `Redmine-MCP-Server/${packageJson.version}`,
    ...options?.headers,
  };

  const fullUrl = new URL(url, config.redmineUrl).toString();

  console.error(`Fetching URL: ${fullUrl}`);

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  console.error(`Response status: ${res.status}`);

  return res;
};
