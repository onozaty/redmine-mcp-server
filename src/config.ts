/**
 * Configuration management for Redmine MCP Server
 */

/**
 * Feature flags to enable/disable tool groups
 * Default: All features enabled unless explicitly disabled
 *
 * Environment Variables:
 * - REDMINE_MCP_DISABLE_RELATIONS=true      - Disable issue relations tools
 * - REDMINE_MCP_DISABLE_TIME_ENTRIES=true   - Disable time entry tools
 * - REDMINE_MCP_DISABLE_VERSIONS=true       - Disable version tools
 * - REDMINE_MCP_DISABLE_WATCHERS=true       - Disable watcher tools
 * - REDMINE_MCP_DISABLE_WIKI=true           - Disable wiki tools
 * - REDMINE_MCP_DISABLE_NEWS=true           - Disable news tools
 * - REDMINE_MCP_DISABLE_USERS=true          - Disable user management tools
 * - REDMINE_MCP_DISABLE_GROUPS=true         - Disable group management tools
 * - REDMINE_MCP_DISABLE_MEMBERSHIPS=true    - Disable membership tools
 * - REDMINE_MCP_DISABLE_ATTACHMENTS=true    - Disable attachment tools
 * - REDMINE_MCP_DISABLE_FILES=true          - Disable file tools
 * - REDMINE_MCP_DISABLE_PROJECTS=true       - Disable project tools
 */
export interface FeatureFlags {
  relations: boolean;
  timeEntries: boolean;
  versions: boolean;
  watchers: boolean;
  wiki: boolean;
  news: boolean;
  users: boolean;
  groups: boolean;
  memberships: boolean;
  attachments: boolean;
  files: boolean;
  projects: boolean;
}

export interface ServerConfig {
  readOnlyMode: boolean;
  redmineUrl: string;
  redmineApiKey: string;
  features: FeatureFlags;
}

/**
 * Load feature flags from environment variables
 * Default: All features enabled unless explicitly disabled
 */
const loadFeatureFlags = (): FeatureFlags => {
  return {
    relations: process.env.REDMINE_MCP_DISABLE_RELATIONS !== "true",
    timeEntries: process.env.REDMINE_MCP_DISABLE_TIME_ENTRIES !== "true",
    versions: process.env.REDMINE_MCP_DISABLE_VERSIONS !== "true",
    watchers: process.env.REDMINE_MCP_DISABLE_WATCHERS !== "true",
    wiki: process.env.REDMINE_MCP_DISABLE_WIKI !== "true",
    news: process.env.REDMINE_MCP_DISABLE_NEWS !== "true",
    users: process.env.REDMINE_MCP_DISABLE_USERS !== "true",
    groups: process.env.REDMINE_MCP_DISABLE_GROUPS !== "true",
    memberships: process.env.REDMINE_MCP_DISABLE_MEMBERSHIPS !== "true",
    attachments: process.env.REDMINE_MCP_DISABLE_ATTACHMENTS !== "true",
    files: process.env.REDMINE_MCP_DISABLE_FILES !== "true",
    projects: process.env.REDMINE_MCP_DISABLE_PROJECTS !== "true",
  };
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

  return {
    readOnlyMode,
    redmineUrl,
    redmineApiKey,
    features: loadFeatureFlags(),
  };
};

/**
 * Get current configuration
 */
export const config = loadConfig();
