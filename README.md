# LiteMCP

A TypeScript library that simplifies MCP server development

## Features

- Simple tool definition
- Built-in error handling
- Built-in CLI for testing and debugging

## Installation

```bash
npm install litemcp zod
```

## Example

```js
import { LiteMCP } from "litemcp";
import { z } from "zod";

const server = new LiteMCP("demo", "1.0.0");

server.addTool({
  name: "add",
  description: "Add two numbers",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async (args) => {
    return args.a + args.b;
  },
});

server.start();
```

## Running Your Server

### Test with `mcp-cli`

The fastest way to test and debug your server is with [`mcp-cli`](https://github.com/wong2/mcp-cli):

```bash
npx litemcp dev server.js
```

This will run your server with `mcp-cli` for testing and debugging your MCP server in the terminal.

### Inspect with `MCP Inspector`

Another way is to use the official [`MCP Inspector`](https://modelcontextprotocol.io/docs/tools/inspector) to inspect your server with a Web UI:

```bash
npx litemcp inspect server.js
```

## Roadmap

- Add support for Resources
- Add support for Prompts

## Related

- [mcp-cli](https://github.com/wong2/mcp-cli) - A CLI for testing and debugging MCP servers
- [mcpservers.org](https://mcpservers.org) - A curated list of MCP servers
- [FastMCP](https://github.com/jlowin/fastmcp) - A Python library for MCP server development, inspiration for this project
