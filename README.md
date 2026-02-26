# Redmine MCP Server

Model Context Protocol (MCP) server for Redmine that provides comprehensive access to the Redmine REST API.

## Overview

This project is an MCP server that comprehensively covers Redmine's [REST API](https://www.redmine.org/projects/redmine/wiki/rest_api). It allows you to operate Redmine from MCP clients (such as Claude Desktop).

## Demonstration

Here are example videos showing how to use the Redmine MCP server with Claude Desktop:

### Creating an Issue

https://github.com/user-attachments/assets/075fb079-104c-404d-91f5-755b3882853b

*This demonstration also uses the [Playwright MCP](https://github.com/microsoft/playwright-mcp) for browser automation alongside the Redmine MCP server.*

### Getting Issue Information

https://github.com/user-attachments/assets/8f551082-6982-4513-8fe7-b0f111be982d

## Features

- 📋 **Comprehensive API Coverage**: Supports all functions available in Redmine's REST API
- 🔒 **Read-Only Mode**: Supports safe data reference mode
- 🎛️ **Feature Flags**: Selectively disable tool groups via environment variables

## Prerequisites

### Getting Redmine API Key

1. Log in to Redmine with administrator privileges
2. Go to "Administration" → "Settings" → "API" tab
3. Check "Enable REST web service"
4. Generate "API access key" in personal settings

For details, refer to [Redmine REST API documentation](https://www.redmine.org/projects/redmine/wiki/rest_api#Authentication).

## Configuration

### Environment Variables

The following environment variables are required (specified in MCP client configuration files):

- **REDMINE_URL** (Required): Base URL of the Redmine instance
  - Example: `https://redmine.example.com`
- **REDMINE_API_KEY** (Required): API key generated in Redmine
  - Set the API key obtained in prerequisites
- **REDMINE_MCP_READ_ONLY** (Optional): Enable read-only mode
  - `true`: Read-only mode (disables data modification operations)
  - `false` or unset: Allow all operations (default)

#### Feature Flags (Optional)

You can selectively disable tool groups to reduce the number of tools loaded by the MCP server. By default, all features are **enabled**. Set any of the following to `true` to disable a group:

| Environment Variable | Tools Disabled |
|---|---|
| `REDMINE_MCP_DISABLE_RELATIONS` | Issue relations (list, create, show, delete) |
| `REDMINE_MCP_DISABLE_TIME_ENTRIES` | Time entries & activities (list, create, show, update, delete) |
| `REDMINE_MCP_DISABLE_VERSIONS` | Versions (list, create, show, update, delete) |
| `REDMINE_MCP_DISABLE_WATCHERS` | Watchers (add, remove) |
| `REDMINE_MCP_DISABLE_WIKI` | Wiki pages (list, show, create/update, delete) |
| `REDMINE_MCP_DISABLE_NEWS` | News (list, show, create, update, delete) |
| `REDMINE_MCP_DISABLE_USERS` | User management (list, show, create, update, delete, current user) |
| `REDMINE_MCP_DISABLE_GROUPS` | Group management (list, show, create, update, delete, add/remove user) |
| `REDMINE_MCP_DISABLE_MEMBERSHIPS` | Memberships (list, show, create, update, delete) |
| `REDMINE_MCP_DISABLE_ATTACHMENTS` | Attachments (show, update, delete, upload/download, thumbnails) |
| `REDMINE_MCP_DISABLE_FILES` | Files (list, create) |
| `REDMINE_MCP_DISABLE_PROJECTS` | Project management (list, show, create, update, delete, archive/unarchive, close/reopen) |

#### Full Configuration Example

You can copy and paste this into your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "@onozaty/redmine-mcp-server"],
      "env": {
        "REDMINE_URL": "https://your-redmine.example.com",
        "REDMINE_API_KEY": "your-api-key-here",
        "REDMINE_MCP_READ_ONLY": "false",
        "REDMINE_MCP_DISABLE_RELATIONS": "false",
        "REDMINE_MCP_DISABLE_TIME_ENTRIES": "false",
        "REDMINE_MCP_DISABLE_VERSIONS": "false",
        "REDMINE_MCP_DISABLE_WATCHERS": "false",
        "REDMINE_MCP_DISABLE_WIKI": "false",
        "REDMINE_MCP_DISABLE_NEWS": "false",
        "REDMINE_MCP_DISABLE_USERS": "false",
        "REDMINE_MCP_DISABLE_GROUPS": "false",
        "REDMINE_MCP_DISABLE_MEMBERSHIPS": "false",
        "REDMINE_MCP_DISABLE_ATTACHMENTS": "false",
        "REDMINE_MCP_DISABLE_FILES": "false",
        "REDMINE_MCP_DISABLE_PROJECTS": "false"
      }
    }
  }
}
```

### MCP Client Configuration

#### Using npx (Recommended for quick start)

Add the following as MCP configuration for your AI agent:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "@onozaty/redmine-mcp-server"],
      "env": {
        "REDMINE_URL": "https://your-redmine.example.com",
        "REDMINE_API_KEY": "your-api-key-here",
        "REDMINE_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

#### Using Docker (Alternative)

If you prefer using Docker:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "REDMINE_URL=https://your-redmine.example.com",
        "-e", "REDMINE_API_KEY=your-api-key-here",
        "-e", "REDMINE_MCP_READ_ONLY=true",
        "ghcr.io/onozaty/redmine-mcp-server:latest"
      ]
    }
  }
}
```

**When to use Docker:**
- Enterprise environments requiring container isolation
- Reproducible deployments across different systems
- Environments where Node.js installation is restricted

Below are specific configuration methods for several MCP clients:

#### Claude Desktop

Add the following to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": ["-y", "@onozaty/redmine-mcp-server"],
      "env": {
        "REDMINE_URL": "https://your-redmine.example.com",
        "REDMINE_API_KEY": "your-api-key-here",
        "REDMINE_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

#### Claude Code

In Claude Code, you can add MCP servers using the following commands:

Local configuration:
```bash
claude mcp add redmine -e REDMINE_URL=https://your-redmine.example.com -e REDMINE_API_KEY=your-api-key-here -e REDMINE_MCP_READ_ONLY=true -- npx -y @onozaty/redmine-mcp-server
```

Project configuration:
```bash
claude mcp add -s project redmine -e REDMINE_URL=https://your-redmine.example.com -e REDMINE_API_KEY=your-api-key-here -e REDMINE_MCP_READ_ONLY=true -- npx -y @onozaty/redmine-mcp-server
```

User configuration (global):
```bash
claude mcp add -s user redmine -e REDMINE_URL=https://your-redmine.example.com -e REDMINE_API_KEY=your-api-key-here -e REDMINE_MCP_READ_ONLY=true -- npx -y @onozaty/redmine-mcp-server
```

#### Visual Studio Code

Project configuration (`.vscode/mcp.json`):

```json
{
  "servers": {
    "redmine": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@onozaty/redmine-mcp-server"],
      "env": {
        "REDMINE_URL": "https://your-redmine.example.com",
        "REDMINE_API_KEY": "your-api-key-here",
        "REDMINE_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

User configuration (`settings.json`):

```json
{
  "mcp": {
    "servers": {
      "redmine": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@onozaty/redmine-mcp-server"],
        "env": {
          "REDMINE_URL": "https://your-redmine.example.com",
          "REDMINE_API_KEY": "your-api-key-here",
          "REDMINE_MCP_READ_ONLY": "true"
        }
      }
    }
  }
}
```

## Available Features

This MCP server comprehensively supports the functions provided by [Redmine's REST API](https://www.redmine.org/projects/redmine/wiki/rest_api):

### Main Features

- **Issues**: Create, update, delete, search, and manage related issues
- **Projects**: Create, update, delete, archive, and manage memberships
- **Users**: Create, update, delete, and manage groups
- **Time Entries**: Record, update, and delete time entries
- **Wiki**: Create, update, delete pages, and manage versions
- **News**: Create, update, and delete news
- **Files**: Upload and download files
- **Attachments**: Upload, download files, and get thumbnails
- **Queries**: Execute saved queries
- **Custom Fields**: Get and manage custom fields
- **Roles**: Get and manage roles
- **Trackers**: Get and manage trackers
- **Issue Statuses**: Get and manage issue statuses
- **Search**: Cross-search functionality

### Read-Only Mode

By setting `REDMINE_MCP_READ_ONLY=true`, you can disable data modification operations. This allows safe data reference.

## License

MIT License

## Author

[onozaty](https://github.com/onozaty)

## Acknowledgments

- OpenAPI specification: [d-yoshi/redmine-openapi](https://github.com/d-yoshi/redmine-openapi)
- Code generation: [Orval](https://orval.dev/) - TypeScript client and schema generator from OpenAPI
