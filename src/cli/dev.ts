import { defineCommand } from "citty";
import { execa } from "execa";

export default defineCommand({
  meta: {
    name: "dev",
    description: "Run server with MCP inspector",
  },
  args: {
    script: {
      type: "positional",
      description: "The js script to run",
      valueHint: "server.js",
      required: true,
    },
  },
  async run({ args }) {
    await execa({
      stdout: "inherit",
      stderr: "inherit",
    })`npx @modelcontextprotocol/inspector node ${args.script}`;
  },
});
