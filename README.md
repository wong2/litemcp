# LiteMCP

A TypeScript library that simplifies MCP server development

## Features

- Simple tool definition
- Built-in error handling

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

The fastest way to test and debug your server is with the MCP Inspector:

```bash
npx litemcp dev server.js
```

This will launch the MCP Inspector for testing and debugging your MCP server.

## Roadmap

- Add support for Resources
- Add support for Prompts
