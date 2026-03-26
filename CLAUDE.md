# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Redmine that provides comprehensive access to Redmine's REST API. The server automatically generates TypeScript handlers and schemas from a Redmine OpenAPI specification and extends them with custom attachment file handling capabilities.

## Architecture

### Core Components

- **Generated API Layer**: Located in `src/__generated__/` (auto-generated, don't edit directly)
  - `handlers.ts` - MCP tool handlers for each Redmine API endpoint
  - `http-schemas/` - Zod schemas for API requests/responses
  - `tool-schemas.zod.js` - Tool parameter schemas
  - `http-client.ts` - HTTP client with custom fetch integration

- **Custom Extensions**: Located in `src/attachment/`
  - File upload/download handlers that extend the generated API
  - Thumbnail download functionality
  - Direct file I/O operations with Redmine

- **Configuration**: `src/config.ts`
  - Environment-based configuration loading
  - Read-only mode support via `REDMINE_MCP_READ_ONLY=true`
  - Tool filtering via `REDMINE_MCP_TOOLS_ALLOW_PATTERN` and `REDMINE_MCP_TOOLS_DENY_PATTERN`
  - Requires `REDMINE_URL` and `REDMINE_API_KEY` environment variables

- **Main Server**: `src/server.ts`
  - Registers all tools with read-only/write classification
  - Implements conditional tool registration based on configuration (read-only mode and regex filters)
  - Extensive tool registry covering all Redmine operations

### Code Generation Workflow

1. **OpenAPI Specification**: `redmine-openapi.yaml` defines the Redmine API
2. **Orval Configuration**: `orval.config.ts` configures code generation
3. **Generated Code**: `pnpm gen` creates handlers and schemas in `src/__generated__/`
4. **Post-Processing**: `post-generate.js` adds custom fetch import to generated HTTP client

## Development Commands

```bash
# Generate API code from OpenAPI spec
pnpm gen

# Build the project (includes generation)
pnpm build

# Build for publishing
pnpm prepublishOnly
```

## Key Patterns

### Tool Registration
Tools are registered with a classification system:
- `ToolType.READ_ONLY` - Safe operations that don't modify data
- `ToolType.WRITE` - Operations that create, update, or delete data

The `registerTool` helper function automatically excludes write operations when `config.readOnlyMode` is enabled.

### Environment Configuration
The server requires these environment variables:
- `REDMINE_URL` - Base URL of the Redmine instance
- `REDMINE_API_KEY` - API key for authentication
- `REDMINE_MCP_READ_ONLY` - Optional, set to "true" to enable read-only mode
- `REDMINE_MCP_TOOLS_ALLOW_PATTERN` - Optional, regex to allow only matching tools
- `REDMINE_MCP_TOOLS_DENY_PATTERN` - Optional, regex to disable matching tools (takes priority over allow)

### Custom Fetch Integration
The generated HTTP client uses a custom fetch implementation (`src/api/custom-fetch.ts`) which is automatically injected by the post-generation script.

## File Structure Guidelines

- Never edit files in `src/__generated__/` directly - they are overwritten by code generation
- Custom functionality should be added in dedicated modules (like `src/attachment/`)
- New tool schemas should be added to `src/schemas/` following the attachment pattern
- Configuration changes go in `src/config.ts`

## Testing the Server

The server runs as an MCP server over stdio. Test it by:
1. Building the project: `pnpm build`
2. Running the binary: `./dist/server.mjs`
3. Providing required environment variables