import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const server = new Server(
  {
    name: "vigil-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "vigil.scan",
        description: "Run Vigil security scan on host or repository",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              enum: ["host", "repo"],
              description: "Target to scan: 'host' for local system or 'repo' for a repository",
            },
            repo_url: {
              type: "string",
              description: "Repository URL (required when target is 'repo')",
            },
            dry_run: {
              type: "boolean",
              description: "Run in dry-run mode without making changes",
              default: true,
            },
          },
          required: ["target"],
        },
      },
      {
        name: "vigil.proof.sign",
        description: "Sign action payload with cryptographic proof",
        inputSchema: {
          type: "object",
          properties: {
            payload: {
              type: "object",
              description: "The payload to sign",
            },
            purpose: {
              type: "string",
              description: "Purpose of the signature",
            },
          },
          required: ["payload", "purpose"],
        },
      },
    ],
  };
});

// Handler for calling tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "vigil.scan") {
    const { target, repo_url, dry_run = true } = args as {
      target: "host" | "repo";
      repo_url?: string;
      dry_run?: boolean;
    };

    const cmdArgs: string[] = [];

    if (target === "host") {
      cmdArgs.push("scan");
      if (dry_run) cmdArgs.push("--dry-run");
    }

    if (target === "repo") {
      if (!repo_url) {
        return {
          content: [
            {
              type: "text",
              text: "Error: repo_url is required when target is 'repo'",
            },
          ],
          isError: true,
        };
      }
      cmdArgs.push("scan", "--repo", repo_url);
      if (dry_run) cmdArgs.push("--dry-run");
    }

    try {
      const { stdout, stderr } = await execFileAsync("vigil-scan", cmdArgs);

      return {
        content: [
          {
            type: "text",
            text: stdout,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.stderr
        ? `Error running vigil-scan: ${error.message}\nStderr: ${error.stderr}`
        : `Error running vigil-scan: ${error.message}`;
      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "vigil.proof.sign") {
    const { payload, purpose } = args as {
      payload: any;
      purpose: string;
    };

    try {
      const scriptPath = join(projectRoot, "scripts", "sign_proof.py");
      const { stdout, stderr } = await execFileAsync("python3", [
        scriptPath,
        JSON.stringify({ payload, purpose }),
      ]);

      return {
        content: [
          {
            type: "text",
            text: stdout,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.stderr
        ? `Error signing proof: ${error.message}\nStderr: ${error.stderr}`
        : `Error signing proof: ${error.message}`;
      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${name}`,
      },
    ],
    isError: true,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
