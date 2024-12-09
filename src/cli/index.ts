#!/usr/bin/env node

import { defineCommand, runMain } from "citty";
import dev from "./dev.js";

const main = defineCommand({
  meta: {
    name: "litemcp",
  },
  subCommands: {
    dev,
  },
});

runMain(main);
