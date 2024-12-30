import type { Jsonifiable, JsonValue } from "type-fest";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export class Logger {
  #server?: Server;

  private sendLoggingMessage(level: "debug" | "info" | "warning" | "error", data: Jsonifiable) {
    this.#server?.sendLoggingMessage({
      level,
      data,
    });
  }

  public setServer(server: Server) {
    this.#server = server;
  }

  public debug(message: string, context?: JsonValue) {
    this.sendLoggingMessage("debug", { message, context });
  }

  public info(message: string, context?: JsonValue) {
    this.sendLoggingMessage("info", { message, context });
  }

  public warn(message: string, context?: JsonValue) {
    this.sendLoggingMessage("warning", { message, context });
  }

  public error(message: string, context?: JsonValue) {
    this.sendLoggingMessage("error", { message, context });
  }
}
