import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { startSSEServer, type SSEServer } from "mcp-proxy";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ServerCapabilities,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Logger } from "./logger.js";
import { Prompt, PromptArgument, Resource, Tool, ToolParameters } from "./types.js";

export class LiteMCP {
  public logger: Logger;
  #tools: Tool[];
  #resources: Resource[];
  #prompts: Prompt[];

  constructor(public name: string, public version: string) {
    this.logger = new Logger();
    this.#tools = [];
    this.#resources = [];
    this.#prompts = [];
  }

  private setupHandlers(server: Server) {
    this.setupErrorHandling(server);
    if (this.#tools.length) {
      this.setupToolHandlers(server);
    }
    if (this.#resources.length) {
      this.setupResourceHandlers(server);
    }
    if (this.#prompts.length) {
      this.setupPromptHandlers(server);
    }
  }

  private setupErrorHandling(server: Server) {
    server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };
    process.on("SIGINT", async () => {
      await server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(server: Server) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.#tools.map((tool) => {
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.parameters ? zodToJsonSchema(tool.parameters) : undefined,
          };
        }),
      };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.#tools.find((tool) => tool.name === request.params.name);
      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
      let args: any = undefined;
      if (tool.parameters) {
        const parsed = tool.parameters.safeParse(request.params.arguments);
        if (!parsed.success) {
          throw new McpError(ErrorCode.InvalidRequest, `Invalid ${request.params.name} arguments`);
        }
        args = parsed.data;
      }
      let result: any;
      try {
        result = await tool.execute(args);
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error}` }],
          isError: true,
        };
      }
      if (typeof result === "string") {
        return {
          content: [{ type: "text", text: result }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    });
  }

  private setupResourceHandlers(server: Server) {
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: this.#resources.map((resource) => {
          return {
            uri: resource.uri,
            name: resource.name,
            mimeType: resource.mimeType,
          };
        }),
      };
    });
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = this.#resources.find((resource) => resource.uri === request.params.uri);
      if (!resource) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown resource: ${request.params.uri}`);
      }
      let result: Awaited<ReturnType<Resource["load"]>>;
      try {
        result = await resource.load();
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Error reading resource: ${error}`, {
          uri: resource.uri,
        });
      }
      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            ...result,
          },
        ],
      };
    });
  }

  private setupPromptHandlers(server: Server) {
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: this.#prompts.map((prompt) => {
          return {
            name: prompt.name,
            description: prompt.description,
            arguments: prompt.arguments,
          };
        }),
      };
    });
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = this.#prompts.find((prompt) => prompt.name === request.params.name);
      if (!prompt) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${request.params.name}`);
      }
      const args = request.params.arguments;
      if (prompt.arguments) {
        for (const arg of prompt.arguments) {
          if (arg.required && !(args && arg.name in args)) {
            throw new McpError(ErrorCode.InvalidRequest, `Missing required argument: ${arg.name}`);
          }
        }
      }
      let result: Awaited<ReturnType<Prompt["load"]>>;
      try {
        result = await prompt.load(args as Record<string, string | undefined>);
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Error loading prompt: ${error}`);
      }
      return {
        description: prompt.description,
        messages: [
          {
            role: "user",
            content: { type: "text", text: result },
          },
        ],
      };
    });
  }

  public addTool<Params extends ToolParameters>(tool: Tool<Params>) {
    this.#tools.push(tool as unknown as Tool);
  }

  public addResource(resource: Resource) {
    this.#resources.push(resource);
  }

  public addPrompt<const Args extends PromptArgument[]>(prompt: Prompt<Args>) {
    this.#prompts.push(prompt);
  }

  public async start(
    opts:
      | { transportType: "stdio" }
      | {
          transportType: "sse";
          sse: { endpoint: `/${string}`; port: number };
        } = {
      transportType: "stdio",
    }
  ) {
    const capabilities: ServerCapabilities = { logging: {} };
    if (this.#tools.length) {
      capabilities.tools = {};
    }
    if (this.#resources.length) {
      capabilities.resources = {};
    }
    if (this.#prompts.length) {
      capabilities.prompts = {};
    }
    const server = new Server({ name: this.name, version: this.version }, { capabilities });
    this.logger.setServer(server);
    this.setupHandlers(server);

    if (opts.transportType === "stdio") {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error(`${this.name} server running on stdio`);
    } else if (opts.transportType === "sse") {
      await startSSEServer({
        endpoint: opts.sse.endpoint as `/${string}`,
        port: opts.sse.port,
        server,
      });
      console.error(`${this.name} server running on SSE`);
    }
  }
}
