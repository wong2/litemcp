import { defineCommand } from "citty";
import { $ } from "execa";

export default defineCommand({
  meta: {
    name: "dev",
    description: "Run server with mcp-cli",
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
    await $({
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    })`npx @wong2/mcp-cli node ${args.script}`;
  },
});
