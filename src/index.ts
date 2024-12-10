import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ServerCapabilities,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

type Parameters = z.ZodTypeAny;

interface Tool<Params extends Parameters> {
  name: string;
  description?: string;
  parameters?: Params;
  execute: (args: z.infer<Params>) => Promise<any>;
}

interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  read: () => Promise<{ text: string } | { blob: string }>;
}

export class LiteMCP {
  #tools: Tool<Parameters>[];
  #resources: Resource[];

  constructor(public name: string, public version: string) {
    this.#tools = [];
    this.#resources = [];
  }

  private setupHandlers(server: Server) {
    this.setupErrorHandling(server);
    if (this.#tools.length) {
      this.setupToolHandlers(server);
    }
    if (this.#resources.length) {
      this.setupResourceHandlers(server);
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
      let result: Awaited<ReturnType<Resource["read"]>>;
      try {
        result = await resource.read();
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

  public addTool<Params extends Parameters>(tool: Tool<Params>) {
    this.#tools.push(tool as unknown as Tool<Parameters>);
  }

  public addResource(resource: Resource) {
    this.#resources.push(resource);
  }

  public async start(_transportType: "stdio" = "stdio") {
    const capabilities: ServerCapabilities = {};
    if (this.#tools.length) {
      capabilities.tools = {};
    }
    if (this.#resources.length) {
      capabilities.resources = {};
    }
    const server = new Server({ name: this.name, version: this.version }, { capabilities });
    this.setupHandlers(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${this.name} server running on stdio`);
  }
}
