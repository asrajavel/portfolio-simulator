# Chrome DevTools MCP Setup

This document provides instructions for setting up Chrome DevTools MCP (Model Context Protocol) in Cursor.

## Prerequisites

- ✅ Node.js version 22.12.0 or newer (Current: v24.2.0)
- Google Chrome (latest stable version)

## Configuration for Cursor

1. Open **Cursor Settings** → **MCP** → **New MCP Server**

2. Add the following configuration:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

3. Restart Cursor

## Verification

To verify the setup is working, ask the AI assistant:

```
Check the performance of https://developers.chrome.com
```

The assistant should open Chrome and record a performance trace.

## Advanced Configuration Options

You can customize the behavior with additional arguments:

- `--headless`: Run in headless mode (no UI)
- `--isolated`: Create a temporary user data directory
- `--channel`: Specify Chrome channel (`stable`, `canary`, `beta`, `dev`)
- `--executablePath`, `-e`: Path to custom Chrome executable
- `--browserUrl`, `-u`: Connect to a running Chrome instance

### Example with options:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--channel=canary",
        "--headless=true",
        "--isolated=true"
      ]
    }
  }
}
```

## Available Capabilities

Once configured, the AI assistant can:

- Navigate to URLs
- Take screenshots
- Capture performance traces
- Execute JavaScript in the browser context
- Inspect network requests
- Debug page issues
- Test responsive designs
- Monitor console logs

## Help

For more options, run:

```bash
npx chrome-devtools-mcp@latest --help
```

## Resources

- [Chrome DevTools MCP Documentation](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [GitHub Repository](https://github.com/mcp/chromedevtools/chrome-devtools-mcp)





