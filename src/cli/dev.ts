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
      description: "The JavaScript or TypeScript script to run",
      valueHint: "server.js or server.ts",
      required: true,
    },
  },
  async run({ args }) {
    const command = args.script.endsWith(".ts") ? `npx tsx ${args.script}` : `node ${args.script}`;
    await $({
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    })`npx @wong2/mcp-cli ${command}`;
  },
});
