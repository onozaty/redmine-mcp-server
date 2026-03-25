/**
 * Configuration management for Redmine MCP Server
 */

export interface ServerConfig {
  readOnlyMode: boolean;
  redmineUrl: string;
  redmineApiKey: string;
  toolsAllowPattern: RegExp | null;
  toolsDenyPattern: RegExp | null;
}

const compilePattern = (
  value: string | undefined,
  varName: string,
): RegExp | null => {
  if (!value) return null;
  try {
    return new RegExp(value);
  } catch (e) {
    throw new Error(
      `Invalid regex in ${varName}: "${value}" - ${(e as Error).message}`,
    );
  }
};

/**
 * Load configuration from environment variables
 */
const loadConfig = (): ServerConfig => {
  const readOnlyMode = process.env.REDMINE_MCP_READ_ONLY === "true";

  const redmineUrl = process.env.REDMINE_URL;
  if (!redmineUrl) {
    throw new Error("REDMINE_URL environment variable is not set");
  }

  const redmineApiKey = process.env.REDMINE_API_KEY;
  if (!redmineApiKey) {
    throw new Error("REDMINE_API_KEY environment variable is not set");
  }

  const toolsAllowPattern = compilePattern(
    process.env.REDMINE_MCP_TOOLS_ALLOW_PATTERN,
    "REDMINE_MCP_TOOLS_ALLOW_PATTERN",
  );
  const toolsDenyPattern = compilePattern(
    process.env.REDMINE_MCP_TOOLS_DENY_PATTERN,
    "REDMINE_MCP_TOOLS_DENY_PATTERN",
  );

  return {
    readOnlyMode,
    redmineUrl,
    redmineApiKey,
    toolsAllowPattern,
    toolsDenyPattern,
  };
};

/**
 * Get current configuration
 */
export const config = loadConfig();
