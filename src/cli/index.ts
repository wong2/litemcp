#!/usr/bin/env node

import { defineCommand, runMain } from "citty";
import dev from "./dev.js";
import inspect from "./inspect.js";

const main = defineCommand({
  meta: {
    name: "litemcp",
  },
  subCommands: {
    dev,
    inspect,
  },
});

runMain(main);
