#!/usr/bin/env node
/**
 * Custom MCP server that extends the generated server with file upload/download capabilities
 */

import {
  McpServer,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import packageJson from "../package.json" assert { type: "json" };

import { config } from "./config.js";

// Tool classification enum
enum ToolType {
  READ_ONLY = "read_only",
  WRITE = "write",
}

// Import generated handlers
import {
  addRelatedIssueHandler,
  addUserToGroupHandler,
  addWatcherHandler,
  archiveProjectHandler,
  closeProjectHandler,
  createFileHandler,
  createGroupHandler,
  createIssueCategoryHandler,
  createIssueHandler,
  createIssueRelationHandler,
  createMembershipHandler,
  createNewsHandler,
  createProjectHandler,
  createTimeEntryHandler,
  createUserHandler,
  createVersionHandler,
  deleteAttachmentHandler,
  deleteGroupHandler,
  deleteIssueCategoryHandler,
  deleteIssueHandler,
  deleteIssueRelationHandler,
  deleteMembershipHandler,
  deleteNewsHandler,
  deleteProjectHandler,
  deleteTimeEntryHandler,
  deleteUserHandler,
  deleteVersionHandler,
  deleteWikiPageHandler,
  getAttachmentHandler,
  getCurrentUserHandler,
  getCustomFieldsHandler,
  getDocumentCategoriesHandler,
  getFilesHandler,
  getGroupHandler,
  getGroupsHandler,
  getIssueCategoriesHandler,
  getIssueCategoryHandler,
  getIssueHandler,
  getIssuePrioritiesHandler,
  getIssueRelationHandler,
  getIssueRelationsHandler,
  getIssuesHandler,
  getIssueStatusesHandler,
  getMembershipHandler,
  getMembershipsHandler,
  getMyAccountHandler,
  getNewsHandler,
  getNewsListByProjectHandler,
  getNewsListHandler,
  getProjectHandler,
  getProjectsHandler,
  getQueriesHandler,
  getRoleHandler,
  getRolesHandler,
  getTimeEntriesHandler,
  getTimeEntryActivitiesHandler,
  getTimeEntryHandler,
  getTrackersHandler,
  getUserHandler,
  getUsersHandler,
  getVersionsByProjectHandler,
  getVersionsHandler,
  getWikiPageByVersionHandler,
  getWikiPageHandler,
  getWikiPagesHandler,
  removeRelatedIssueHandler,
  removeUserFromGroupHandler,
  removeWatcherHandler,
  reopenProjectHandler,
  searchHandler,
  unarchiveProjectHandler,
  updateAttachmentHandler,
  updateGroupHandler,
  updateIssueCategoryHandler,
  updateIssueHandler,
  updateJournalHandler,
  updateMembershipHandler,
  updateMyAccountHandler,
  updateNewsHandler,
  updateProjectHandler,
  updateTimeEntryHandler,
  updateUserHandler,
  updateVersionHandler,
  updateWikiPageHandler,
} from "./__generated__/handlers.js";

// Import generated schemas
import {
  addRelatedIssueBody,
  addRelatedIssueParams,
  addUserToGroupBody,
  addUserToGroupParams,
  addWatcherBody,
  addWatcherParams,
  archiveProjectParams,
  closeProjectParams,
  createFileBody,
  createFileParams,
  createGroupBody,
  createGroupParams,
  createIssueBody,
  createIssueCategoryBody,
  createIssueCategoryParams,
  createIssueParams,
  createIssueRelationBody,
  createIssueRelationParams,
  createMembershipBody,
  createMembershipParams,
  createNewsBody,
  createNewsParams,
  createProjectBody,
  createProjectParams,
  createTimeEntryBody,
  createTimeEntryParams,
  createUserBody,
  createUserParams,
  createVersionBody,
  createVersionParams,
  deleteAttachmentParams,
  deleteGroupParams,
  deleteIssueCategoryParams,
  deleteIssueCategoryQueryParams,
  deleteIssueParams,
  deleteIssueRelationParams,
  deleteMembershipParams,
  deleteNewsParams,
  deleteProjectParams,
  deleteTimeEntryParams,
  deleteUserParams,
  deleteVersionParams,
  deleteWikiPageParams,
  getAttachmentParams,
  getCurrentUserParams,
  getCurrentUserQueryParams,
  getCustomFieldsParams,
  getDocumentCategoriesParams,
  getFilesParams,
  getGroupParams,
  getGroupQueryParams,
  getGroupsParams,
  getIssueCategoriesParams,
  getIssueCategoriesQueryParams,
  getIssueCategoryParams,
  getIssueParams,
  getIssuePrioritiesParams,
  getIssueQueryParams,
  getIssueRelationParams,
  getIssueRelationsParams,
  getIssuesParams,
  getIssuesQueryParams,
  getIssueStatusesParams,
  getMembershipParams,
  getMembershipsParams,
  getMembershipsQueryParams,
  getMyAccountParams,
  getNewsListByProjectParams,
  getNewsListByProjectQueryParams,
  getNewsListParams,
  getNewsListQueryParams,
  getNewsParams,
  getNewsQueryParams,
  getProjectParams,
  getProjectQueryParams,
  getProjectsParams,
  getProjectsQueryParams,
  getQueriesParams,
  getQueriesQueryParams,
  getRoleParams,
  getRolesParams,
  getTimeEntriesParams,
  getTimeEntriesQueryParams,
  getTimeEntryActivitiesParams,
  getTimeEntryParams,
  getTrackersParams,
  getUserParams,
  getUserQueryParams,
  getUsersParams,
  getUsersQueryParams,
  getVersionsByProjectParams,
  getVersionsByProjectQueryParams,
  getVersionsParams,
  getWikiPageByVersionParams,
  getWikiPageByVersionQueryParams,
  getWikiPageParams,
  getWikiPageQueryParams,
  getWikiPagesParams,
  removeRelatedIssueParams,
  removeUserFromGroupParams,
  removeWatcherParams,
  reopenProjectParams,
  searchParams,
  searchQueryParams,
  unarchiveProjectParams,
  updateAttachmentBody,
  updateAttachmentParams,
  updateGroupBody,
  updateGroupParams,
  updateIssueBody,
  updateIssueCategoryBody,
  updateIssueCategoryParams,
  updateIssueParams,
  updateJournalBody,
  updateJournalParams,
  updateMembershipBody,
  updateMembershipParams,
  updateMyAccountBody,
  updateMyAccountParams,
  updateNewsBody,
  updateNewsParams,
  updateProjectBody,
  updateProjectParams,
  updateTimeEntryBody,
  updateTimeEntryParams,
  updateUserBody,
  updateUserParams,
  updateVersionBody,
  updateVersionParams,
  updateWikiPageBody,
  updateWikiPageParams,
} from "./__generated__/tool-schemas.zod.js";

// Import custom attachment functionality
import { ZodRawShape } from "zod";
// Local file based handlers (existing)
import { downloadFileHandler } from "./attachment/download-to-local-file-handler.js";
import { downloadThumbnailHandler } from "./attachment/thumbnail-to-local-file-handler.js";
import { uploadFileHandler } from "./attachment/upload-local-file-handler.js";
// Base64 content based handlers (new)
import { downloadAsBase64ContentHandler } from "./attachment/download-as-base64-content-handler.js";
import { downloadThumbnailAsBase64ContentHandler } from "./attachment/thumbnail-as-base64-content-handler.js";
import { uploadBase64ContentHandler } from "./attachment/upload-base64-content-handler.js";
import {
  // Local file based schemas (existing)
  downloadToLocalFileParams,
  downloadThumbnailToLocalFileParams,
  uploadLocalFileParams,
  // Base64 content based schemas (new)
  downloadAsBase64ContentParams,
  downloadThumbnailAsBase64ContentParams,
  uploadBase64ContentParams,
} from "./schemas/attachment.js";

const server = new McpServer({
  name: "redmineAPIServer",
  version: packageJson.version,
});

// Track registered tools for statistics
const registeredTools = new Map<string, ToolType>();

/**
 * Helper function to conditionally register tools based on read-only mode
 */
const registerTool = <Args extends ZodRawShape>(
  toolName: string,
  description: string,
  toolType: ToolType,
  schemas: Args,
  handler: ToolCallback<Args>
) => {
  // Track tool registration for statistics
  registeredTools.set(toolName, toolType);

  if (config.readOnlyMode && toolType === ToolType.WRITE) {
    // Skip registration of write tools in read-only mode
    return;
  }
  server.tool(toolName, description, schemas, handler);
};

// Log server mode after all tools are registered
const logServerMode = () => {
  const readOnlyCount = Array.from(registeredTools.values()).filter(
    (t) => t === ToolType.READ_ONLY
  ).length;
  const writeCount = Array.from(registeredTools.values()).filter(
    (t) => t === ToolType.WRITE
  ).length;

  if (config.readOnlyMode) {
    console.error("Starting Redmine MCP Server in READ-ONLY mode");
    console.error(`Available tools: ${readOnlyCount} read-only operations`);
    console.error(`Disabled tools: ${writeCount} write operations`);
  } else {
    console.error("Starting Redmine MCP Server in FULL mode");
    console.error(`Available tools: ${readOnlyCount + writeCount} operations`);
  }

  // Log disabled features
  const disabledFeatures = Object.entries(config.features)
    .filter(([, enabled]) => !enabled)
    .map(([name]) => name);
  if (disabledFeatures.length > 0) {
    console.error(`Disabled features: ${disabledFeatures.join(", ")}`);
  }
};

// Register all generated tools
registerTool(
  "getIssues",
  "List issues",
  ToolType.READ_ONLY,
  { pathParams: getIssuesParams, queryParams: getIssuesQueryParams },
  getIssuesHandler
);
registerTool(
  "createIssue",
  "Create issue",
  ToolType.WRITE,
  { pathParams: createIssueParams, bodyParams: createIssueBody },
  createIssueHandler
);
registerTool(
  "getIssue",
  "Show issue",
  ToolType.READ_ONLY,
  { pathParams: getIssueParams, queryParams: getIssueQueryParams },
  getIssueHandler
);
registerTool(
  "updateIssue",
  "Update issue",
  ToolType.WRITE,
  { pathParams: updateIssueParams, bodyParams: updateIssueBody },
  updateIssueHandler
);
registerTool(
  "deleteIssue",
  "Delete issue",
  ToolType.WRITE,
  { pathParams: deleteIssueParams },
  deleteIssueHandler
);
if (config.features.watchers) {
  registerTool(
    "addWatcher",
    "Add watcher",
    ToolType.WRITE,
    { pathParams: addWatcherParams, bodyParams: addWatcherBody },
    addWatcherHandler
  );
  registerTool(
    "removeWatcher",
    "Remove watcher",
    ToolType.WRITE,
    { pathParams: removeWatcherParams },
    removeWatcherHandler
  );
}
if (config.features.projects) {
  registerTool(
    "getProjects",
    "List projects",
    ToolType.READ_ONLY,
    { pathParams: getProjectsParams, queryParams: getProjectsQueryParams },
    getProjectsHandler
  );
}
if (config.features.projects) {
  registerTool(
    "createProject",
    "Create project",
    ToolType.WRITE,
    { pathParams: createProjectParams, bodyParams: createProjectBody },
    createProjectHandler
  );
  registerTool(
    "getProject",
    "Show project",
    ToolType.READ_ONLY,
    { pathParams: getProjectParams, queryParams: getProjectQueryParams },
    getProjectHandler
  );
  registerTool(
    "updateProject",
    "Update project",
    ToolType.WRITE,
    { pathParams: updateProjectParams, bodyParams: updateProjectBody },
    updateProjectHandler
  );
  registerTool(
    "deleteProject",
    "Delete project",
    ToolType.WRITE,
    { pathParams: deleteProjectParams },
    deleteProjectHandler
  );
  registerTool(
    "archiveProject",
    "Archive project",
    ToolType.WRITE,
    { pathParams: archiveProjectParams },
    archiveProjectHandler
  );
  registerTool(
    "unarchiveProject",
    "Unarchive project",
    ToolType.WRITE,
    { pathParams: unarchiveProjectParams },
    unarchiveProjectHandler
  );
}
if (config.features.memberships) {
  registerTool(
    "getMemberships",
    "List memberships",
    ToolType.READ_ONLY,
    { pathParams: getMembershipsParams, queryParams: getMembershipsQueryParams },
    getMembershipsHandler
  );
  registerTool(
    "createMembership",
    "Create membership",
    ToolType.WRITE,
    { pathParams: createMembershipParams, bodyParams: createMembershipBody },
    createMembershipHandler
  );
  registerTool(
    "getMembership",
    "Show membership",
    ToolType.READ_ONLY,
    { pathParams: getMembershipParams },
    getMembershipHandler
  );
  registerTool(
    "updateMembership",
    "Update membership",
    ToolType.WRITE,
    { pathParams: updateMembershipParams, bodyParams: updateMembershipBody },
    updateMembershipHandler
  );
  registerTool(
    "deleteMembership",
    "Delete membership",
    ToolType.WRITE,
    { pathParams: deleteMembershipParams },
    deleteMembershipHandler
  );
}
if (config.features.projects) {
  registerTool(
    "closeProject",
    "Close project",
    ToolType.WRITE,
    { pathParams: closeProjectParams },
    closeProjectHandler
  );
  registerTool(
    "reopenProject",
    "Reopen project",
    ToolType.WRITE,
    { pathParams: reopenProjectParams },
    reopenProjectHandler
  );
}
if (config.features.users) {
  registerTool(
    "getUsers",
    "List users",
    ToolType.READ_ONLY,
    { pathParams: getUsersParams, queryParams: getUsersQueryParams },
    getUsersHandler
  );
  registerTool(
    "createUser",
    "Create user",
    ToolType.WRITE,
    { pathParams: createUserParams, bodyParams: createUserBody },
    createUserHandler
  );
  registerTool(
    "getUser",
    "Show user",
    ToolType.READ_ONLY,
    { pathParams: getUserParams, queryParams: getUserQueryParams },
    getUserHandler
  );
  registerTool(
    "updateUser",
    "Update user",
    ToolType.WRITE,
    { pathParams: updateUserParams, bodyParams: updateUserBody },
    updateUserHandler
  );
  registerTool(
    "deleteUser",
    "Delete user",
    ToolType.WRITE,
    { pathParams: deleteUserParams },
    deleteUserHandler
  );
  registerTool(
    "getCurrentUser",
    "Show current user",
    ToolType.READ_ONLY,
    { pathParams: getCurrentUserParams, queryParams: getCurrentUserQueryParams },
    getCurrentUserHandler
  );
}
if (config.features.timeEntries) {
  registerTool(
    "getTimeEntries",
    "List time entries",
    ToolType.READ_ONLY,
    { pathParams: getTimeEntriesParams, queryParams: getTimeEntriesQueryParams },
    getTimeEntriesHandler
  );
  registerTool(
    "createTimeEntry",
    "Create time entry",
    ToolType.WRITE,
    { pathParams: createTimeEntryParams, bodyParams: createTimeEntryBody },
    createTimeEntryHandler
  );
  registerTool(
    "getTimeEntry",
    "Show time entry",
    ToolType.READ_ONLY,
    { pathParams: getTimeEntryParams },
    getTimeEntryHandler
  );
  registerTool(
    "updateTimeEntry",
    "Update time entry",
    ToolType.WRITE,
    { pathParams: updateTimeEntryParams, bodyParams: updateTimeEntryBody },
    updateTimeEntryHandler
  );
  registerTool(
    "deleteTimeEntry",
    "Delete time entry",
    ToolType.WRITE,
    { pathParams: deleteTimeEntryParams },
    deleteTimeEntryHandler
  );
}
if (config.features.news) {
  registerTool(
    "getNewsList",
    "List news",
    ToolType.READ_ONLY,
    { pathParams: getNewsListParams, queryParams: getNewsListQueryParams },
    getNewsListHandler
  );
  registerTool(
    "getNews",
    "Show news",
    ToolType.READ_ONLY,
    { pathParams: getNewsParams, queryParams: getNewsQueryParams },
    getNewsHandler
  );
  registerTool(
    "updateNews",
    "Update news",
    ToolType.WRITE,
    { pathParams: updateNewsParams, bodyParams: updateNewsBody },
    updateNewsHandler
  );
  registerTool(
    "deleteNews",
    "Delete news",
    ToolType.WRITE,
    { pathParams: deleteNewsParams },
    deleteNewsHandler
  );
  registerTool(
    "getNewsListByProject",
    "List news by project",
    ToolType.READ_ONLY,
    {
      pathParams: getNewsListByProjectParams,
      queryParams: getNewsListByProjectQueryParams,
    },
    getNewsListByProjectHandler
  );
  registerTool(
    "createNews",
    "Create news",
    ToolType.WRITE,
    { pathParams: createNewsParams, bodyParams: createNewsBody },
    createNewsHandler
  );
}
if (config.features.relations) {
  registerTool(
    "getIssueRelations",
    "List issue relations",
    ToolType.READ_ONLY,
    { pathParams: getIssueRelationsParams },
    getIssueRelationsHandler
  );
  registerTool(
    "createIssueRelation",
    "Create issue relation",
    ToolType.WRITE,
    {
      pathParams: createIssueRelationParams,
      bodyParams: createIssueRelationBody,
    },
    createIssueRelationHandler
  );
  registerTool(
    "getIssueRelation",
    "Show issue relation",
    ToolType.READ_ONLY,
    { pathParams: getIssueRelationParams },
    getIssueRelationHandler
  );
  registerTool(
    "deleteIssueRelation",
    "Delete issue relation",
    ToolType.WRITE,
    { pathParams: deleteIssueRelationParams },
    deleteIssueRelationHandler
  );
}
if (config.features.versions) {
  registerTool(
    "getVersionsByProject",
    "List versions by project",
    ToolType.READ_ONLY,
    {
      pathParams: getVersionsByProjectParams,
      queryParams: getVersionsByProjectQueryParams,
    },
    getVersionsByProjectHandler
  );
  registerTool(
    "createVersion",
    "Create version",
    ToolType.WRITE,
    { pathParams: createVersionParams, bodyParams: createVersionBody },
    createVersionHandler
  );
  registerTool(
    "getVersions",
    "Show version",
    ToolType.READ_ONLY,
    { pathParams: getVersionsParams },
    getVersionsHandler
  );
  registerTool(
    "updateVersion",
    "Update version",
    ToolType.WRITE,
    { pathParams: updateVersionParams, bodyParams: updateVersionBody },
    updateVersionHandler
  );
  registerTool(
    "deleteVersion",
    "Delete version",
    ToolType.WRITE,
    { pathParams: deleteVersionParams },
    deleteVersionHandler
  );
}
if (config.features.wiki) {
  registerTool(
    "getWikiPages",
    "List wiki pages",
    ToolType.READ_ONLY,
    { pathParams: getWikiPagesParams },
    getWikiPagesHandler
  );
  registerTool(
    "getWikiPage",
    "Show wiki page",
    ToolType.READ_ONLY,
    { pathParams: getWikiPageParams, queryParams: getWikiPageQueryParams },
    getWikiPageHandler
  );
  registerTool(
    "updateWikiPage",
    "Create or update wiki page",
    ToolType.WRITE,
    { pathParams: updateWikiPageParams, bodyParams: updateWikiPageBody },
    updateWikiPageHandler
  );
  registerTool(
    "deleteWikiPage",
    "Delete wiki page",
    ToolType.WRITE,
    { pathParams: deleteWikiPageParams },
    deleteWikiPageHandler
  );
  registerTool(
    "getWikiPageByVersion",
    "Show wiki page by specific version",
    ToolType.READ_ONLY,
    {
      pathParams: getWikiPageByVersionParams,
      queryParams: getWikiPageByVersionQueryParams,
    },
    getWikiPageByVersionHandler
  );
}
registerTool(
  "getQueries",
  "List queries",
  ToolType.READ_ONLY,
  { pathParams: getQueriesParams, queryParams: getQueriesQueryParams },
  getQueriesHandler
);
if (config.features.attachments) {
  registerTool(
    "getAttachment",
    "Show attachment",
    ToolType.READ_ONLY,
    { pathParams: getAttachmentParams },
    getAttachmentHandler
  );
  registerTool(
    "updateAttachment",
    "Update attachment",
    ToolType.WRITE,
    { pathParams: updateAttachmentParams, bodyParams: updateAttachmentBody },
    updateAttachmentHandler
  );
  registerTool(
    "deleteAttachment",
    "Delete attachment",
    ToolType.WRITE,
    { pathParams: deleteAttachmentParams },
    deleteAttachmentHandler
  );
}
registerTool(
  "getIssueStatuses",
  "List issue statuses",
  ToolType.READ_ONLY,
  { pathParams: getIssueStatusesParams },
  getIssueStatusesHandler
);
registerTool(
  "getTrackers",
  "List trackers",
  ToolType.READ_ONLY,
  { pathParams: getTrackersParams },
  getTrackersHandler
);
registerTool(
  "getIssueCategories",
  "List issue categories",
  ToolType.READ_ONLY,
  {
    pathParams: getIssueCategoriesParams,
    queryParams: getIssueCategoriesQueryParams,
  },
  getIssueCategoriesHandler
);
registerTool(
  "createIssueCategory",
  "Create issue category",
  ToolType.WRITE,
  {
    pathParams: createIssueCategoryParams,
    bodyParams: createIssueCategoryBody,
  },
  createIssueCategoryHandler
);
registerTool(
  "getIssuePriorities",
  "List issue priorities",
  ToolType.READ_ONLY,
  { pathParams: getIssuePrioritiesParams },
  getIssuePrioritiesHandler
);
if (config.features.timeEntries) {
  registerTool(
    "getTimeEntryActivities",
    "List time entry activities",
    ToolType.READ_ONLY,
    { pathParams: getTimeEntryActivitiesParams },
    getTimeEntryActivitiesHandler
  );
}
registerTool(
  "getDocumentCategories",
  "List document categories",
  ToolType.READ_ONLY,
  { pathParams: getDocumentCategoriesParams },
  getDocumentCategoriesHandler
);
registerTool(
  "getIssueCategory",
  "Show issue category",
  ToolType.READ_ONLY,
  { pathParams: getIssueCategoryParams },
  getIssueCategoryHandler
);
registerTool(
  "updateIssueCategory",
  "Update issue category",
  ToolType.WRITE,
  {
    pathParams: updateIssueCategoryParams,
    bodyParams: updateIssueCategoryBody,
  },
  updateIssueCategoryHandler
);
registerTool(
  "deleteIssueCategory",
  "Delete issue category",
  ToolType.WRITE,
  {
    pathParams: deleteIssueCategoryParams,
    queryParams: deleteIssueCategoryQueryParams,
  },
  deleteIssueCategoryHandler
);
registerTool(
  "getRoles",
  "List roles",
  ToolType.READ_ONLY,
  { pathParams: getRolesParams },
  getRolesHandler
);
registerTool(
  "getRole",
  "Show role",
  ToolType.READ_ONLY,
  { pathParams: getRoleParams },
  getRoleHandler
);
if (config.features.groups) {
  registerTool(
    "getGroups",
    "List groups",
    ToolType.READ_ONLY,
    { pathParams: getGroupsParams },
    getGroupsHandler
  );
  registerTool(
    "createGroup",
    "Create group",
    ToolType.WRITE,
    { pathParams: createGroupParams, bodyParams: createGroupBody },
    createGroupHandler
  );
  registerTool(
    "getGroup",
    "Show group",
    ToolType.READ_ONLY,
    { pathParams: getGroupParams, queryParams: getGroupQueryParams },
    getGroupHandler
  );
  registerTool(
    "updateGroup",
    "Update group",
    ToolType.WRITE,
    { pathParams: updateGroupParams, bodyParams: updateGroupBody },
    updateGroupHandler
  );
  registerTool(
    "deleteGroup",
    "Delete group",
    ToolType.WRITE,
    { pathParams: deleteGroupParams },
    deleteGroupHandler
  );
  registerTool(
    "addUserToGroup",
    "Add user to group",
    ToolType.WRITE,
    { pathParams: addUserToGroupParams, bodyParams: addUserToGroupBody },
    addUserToGroupHandler
  );
  registerTool(
    "removeUserFromGroup",
    "Remove user from group",
    ToolType.WRITE,
    { pathParams: removeUserFromGroupParams },
    removeUserFromGroupHandler
  );
}
registerTool(
  "getCustomFields",
  "List custom fields",
  ToolType.READ_ONLY,
  { pathParams: getCustomFieldsParams },
  getCustomFieldsHandler
);
registerTool(
  "search",
  "Search",
  ToolType.READ_ONLY,
  { pathParams: searchParams, queryParams: searchQueryParams },
  searchHandler
);
if (config.features.files) {
  registerTool(
    "getFiles",
    "List files",
    ToolType.READ_ONLY,
    { pathParams: getFilesParams },
    getFilesHandler
  );
  registerTool(
    "createFile",
    "Create file",
    ToolType.WRITE,
    { pathParams: createFileParams, bodyParams: createFileBody },
    createFileHandler
  );
}
registerTool(
  "getMyAccount",
  "Show my account",
  ToolType.READ_ONLY,
  { pathParams: getMyAccountParams },
  getMyAccountHandler
);
registerTool(
  "updateMyAccount",
  "Update my account",
  ToolType.WRITE,
  { pathParams: updateMyAccountParams, bodyParams: updateMyAccountBody },
  updateMyAccountHandler
);
registerTool(
  "updateJournal",
  "Update journal",
  ToolType.WRITE,
  { pathParams: updateJournalParams, bodyParams: updateJournalBody },
  updateJournalHandler
);
registerTool(
  "addRelatedIssue",
  "Add related issue",
  ToolType.WRITE,
  { pathParams: addRelatedIssueParams, bodyParams: addRelatedIssueBody },
  addRelatedIssueHandler
);
registerTool(
  "removeRelatedIssue",
  "Remove related issue",
  ToolType.WRITE,
  { pathParams: removeRelatedIssueParams },
  removeRelatedIssueHandler
);

// Register custom attachment tools - Local file system based
if (config.features.attachments) {
  registerTool(
    "uploadAttachmentFromLocalFile",
    "Upload attachment file from local file system to Redmine and get upload token",
    ToolType.WRITE,
    { pathParams: uploadLocalFileParams },
    uploadFileHandler
  );
  registerTool(
    "downloadAttachmentToLocalFile",
    "Download attachment file from Redmine to local file system",
    ToolType.READ_ONLY,
    { pathParams: downloadToLocalFileParams },
    downloadFileHandler
  );
  registerTool(
    "downloadThumbnailToLocalFile",
    "Download thumbnail from Redmine to local file system",
    ToolType.READ_ONLY,
    { pathParams: downloadThumbnailToLocalFileParams },
    downloadThumbnailHandler
  );

  // Register custom attachment tools - Base64 content based
  registerTool(
    "uploadAttachmentFromBase64Content",
    "Upload attachment file from Base64 encoded content to Redmine and get upload token",
    ToolType.WRITE,
    { pathParams: uploadBase64ContentParams },
    uploadBase64ContentHandler
  );
  registerTool(
    "downloadAttachmentAsBase64Content",
    "Download attachment file from Redmine as Base64 encoded content",
    ToolType.READ_ONLY,
    { pathParams: downloadAsBase64ContentParams },
    downloadAsBase64ContentHandler
  );
  registerTool(
    "downloadThumbnailAsBase64Content",
    "Download thumbnail from Redmine as Base64 encoded content",
    ToolType.READ_ONLY,
    { pathParams: downloadThumbnailAsBase64ContentParams },
    downloadThumbnailAsBase64ContentHandler
  );
}


// Log server mode after all tools are registered
logServerMode();

const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    console.error("MCP server running on stdio");
  })
  .catch(console.error);
