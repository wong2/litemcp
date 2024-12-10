# LiteMCP

A TypeScript library that simplifies MCP server development

## Features

- Simple tool and resource definition
- Built-in error handling
- Built-in CLI for testing and debugging

## Installation

```bash
npm install litemcp zod
```

## Quickstart

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

server.addResource({
  uri: "file:///logs/app.log",
  name: "Application Logs",
  mimeType: "text/plain",
  async read() {
    return {
      text: "Example log content",
    };
  },
});

server.start();
```

You can test the server in terminal with:

```bash
npx litemcp dev server.js
```

## Core Concepts

### Tools

Tools in MCP allow servers to expose executable functions that can be invoked by clients and used by LLMs to perform actions.

```js
server.addTool({
  name: "fetch",
  description: "Fetch the content of a url",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    const content = await fetchWebpageContent(args.url);
    return content;
  },
});
```

### Resources

Resources represent any kind of data that an MCP server wants to make available to clients. This can include:

- File contents
- Screenshots and images
- Log files
- And more

Each resource is identified by a unique URI and can contain either text or binary data.

```js
server.addResource({
  uri: "file:///logs/app.log",
  name: "Application Logs",
  mimeType: "text/plain",
  async read() {
    return {
      text: await readLogFile(),
    };
  },
});
```

You can also return binary contents in `read`:

```js
async read() {
  return {
    blob: 'base64-encoded-data'
  }
}
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

- Add support for Prompts

## Related

- [mcp-cli](https://github.com/wong2/mcp-cli) - A CLI for testing and debugging MCP servers
- [mcpservers.org](https://mcpservers.org) - A curated list of MCP servers
- [FastMCP](https://github.com/jlowin/fastmcp) - A Python library for MCP server development, inspiration for this project
