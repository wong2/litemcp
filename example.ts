import { z } from "zod";
import { LiteMCP } from "./src/index.js";

const server = new LiteMCP("my-mcp", "1.0.0");

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

server.start();
