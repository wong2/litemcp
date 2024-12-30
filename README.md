# LiteMCP

A TypeScript framework for building MCP (Model Context Protocol) servers elegantly

## Features

- Simple Tool, Resource, Prompt definition
- Full TypeScript support
- Built-in [logging](#logging)
- Built-in error handling
- Built-in CLI for [testing and debugging](#debugging-with-mcp-cli)
- Built-in support for [SSE transport](#sse-transport)

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
  async load() {
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
  async load() {
    return {
      text: await readLogFile(),
    };
  },
});
```

You can also return binary contents in `load`:

```js
async load() {
  return {
    blob: 'base64-encoded-data'
  }
}
```

### Prompts

Prompts enable servers to define reusable prompt templates and workflows that clients can easily surface to users and LLMs. They provide a powerful way to standardize and share common LLM interactions.

```js
server.addPrompt({
  name: "git-commit",
  description: "Generate a Git commit message",
  arguments: [
    {
      name: "changes",
      description: "Git diff or description of changes",
      required: true,
    },
  ],
  load: async (args) => {
    return `Generate a concise but descriptive commit message for these changes:\n\n${args.changes}`;
  },
});
```

### Logging

You can send log messages to the client with `server.logger`

```js
server.addTool({
  name: "download",
  description: "Download a file from a url",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    server.logger.info("Downloading file", { url: args.url });
    // ...
    server.logger.info("Downloaded file", { url: args.url });
    return response;
  },
});
```

The `logger` object has the following methods:

- `debug(message: string, context?: JsonValue)`
- `info(message: string, context?: JsonValue)`
- `warn(message: string, context?: JsonValue)`
- `error(message: string, context?: JsonValue)`

## Running Your Server

### Debugging with `mcp-cli`

The fastest way to test and debug your server is with [`mcp-cli`](https://github.com/wong2/mcp-cli):

```bash
npx litemcp dev server.js
npx litemcp dev server.ts // ts files are also supported
```

This will run your server with `mcp-cli` for testing and debugging your MCP server in the terminal.

### Inspect with `MCP Inspector`

Another way is to use the official [`MCP Inspector`](https://modelcontextprotocol.io/docs/tools/inspector) to inspect your server with a Web UI:

```bash
npx litemcp inspect server.js
```

### SSE Transport

The servers are running with `stdio` transport by default. You can also run the server with SSE mode:

```js
server.start({
  transportType: "sse",
  sse: {
    endpoint: "/sse",
    port: 8080,
  },
});
```

This will start the server and listen for SSE connections on http://localhost:8080/sse.

You can then connect to the server with [SSE transport](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse) in the client.

## Showcase

> If you've developed a server using LiteMCP, please submit a PR to showcase it here!

- https://github.com/wong2/mcp-jina-reader
- https://github.com/nloui/paperless-mcp

## Roadmap

- Add support for Resource Templates

## Related

- [mcp-cli](https://github.com/wong2/mcp-cli) - A CLI for testing and debugging MCP servers
- [mcpservers.org](https://mcpservers.org) - A curated list of MCP servers
- [FastMCP](https://github.com/jlowin/fastmcp) - A Python library for MCP server development, inspiration for this project
