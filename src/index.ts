#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration types
const ReplicaLoadSchema = z.object({
  cpu: z.number().min(0).describe("CPU load from 0.00 to 1.00 (can exceed 1.00 if overloaded)"),
  ram: z.number().min(0).max(1).describe("RAM load from 0.00 to 1.00"),
});

const ReportReplicaArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server (e.g., https://status.example.com)"),
  reporterToken: z.string().describe("Reporter token for authentication"),
  probeId: z.string().describe("The parent probe identifier"),
  nodeId: z.string().describe("The parent node identifier"),
  replicaId: z.string().describe("The replica unique identifier (e.g., server LAN IP)"),
  interval: z.number().describe("The push interval in seconds"),
  load: ReplicaLoadSchema,
});

const FlushReplicaArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  reporterToken: z.string().describe("Reporter token for authentication"),
  probeId: z.string().describe("The parent probe identifier"),
  nodeId: z.string().describe("The parent node identifier"),
  replicaId: z.string().describe("The replica unique identifier"),
});

const ListAnnouncementsArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  managerToken: z.string().describe("Manager token for authentication"),
});

const InsertAnnouncementArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  managerToken: z.string().describe("Manager token for authentication"),
  title: z.string().describe("The title for the announcement"),
  text: z.string().describe("The description text for the announcement"),
});

const RetractAnnouncementArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  managerToken: z.string().describe("Manager token for authentication"),
  announcementId: z.string().describe("The announcement identifier to be removed"),
});

const ListProberAlertsArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  managerToken: z.string().describe("Manager token for authentication"),
});

const GetIgnoreRulesArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  managerToken: z.string().describe("Manager token for authentication"),
});

const UpdateIgnoreRulesArgsSchema = z.object({
  vigilUrl: z.string().describe("Base URL of the Vigil server"),
  managerToken: z.string().describe("Manager token for authentication"),
  remindersSeconds: z.number().describe("Seconds during which downtime reminders should be skipped"),
});

// Helper function to make HTTP requests
async function makeRequest(
  url: string,
  method: string,
  token: string,
  body?: any
): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}${responseText ? ` - ${responseText}` : ""}`
    );
  }

  // Try to parse JSON response, or return text if not JSON
  try {
    return responseText ? JSON.parse(responseText) : { success: true };
  } catch {
    return { success: true, response: responseText };
  }
}

// Initialize MCP Server
const server = new Server(
  {
    name: "vigil-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const TOOLS: Tool[] = [
  {
    name: "report_replica",
    description:
      "Report a replica's health status to Vigil. Used for push-based monitoring where your service actively reports its health metrics (CPU and RAM load) to Vigil.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server (e.g., https://status.example.com)",
        },
        reporterToken: {
          type: "string",
          description: "Reporter token for authentication",
        },
        probeId: {
          type: "string",
          description: "The parent probe identifier",
        },
        nodeId: {
          type: "string",
          description: "The parent node identifier",
        },
        replicaId: {
          type: "string",
          description: "The replica unique identifier (e.g., server LAN IP)",
        },
        interval: {
          type: "number",
          description: "The push interval in seconds",
        },
        load: {
          type: "object",
          properties: {
            cpu: {
              type: "number",
              description: "CPU load from 0.00 to 1.00 (can exceed 1.00 if overloaded)",
            },
            ram: {
              type: "number",
              description: "RAM load from 0.00 to 1.00",
            },
          },
          required: ["cpu", "ram"],
        },
      },
      required: [
        "vigilUrl",
        "reporterToken",
        "probeId",
        "nodeId",
        "replicaId",
        "interval",
        "load",
      ],
    },
  },
  {
    name: "flush_replica",
    description:
      "Remove a replica from Vigil monitoring. This should be called when a replica is being decommissioned or should no longer be monitored.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        reporterToken: {
          type: "string",
          description: "Reporter token for authentication",
        },
        probeId: {
          type: "string",
          description: "The parent probe identifier",
        },
        nodeId: {
          type: "string",
          description: "The parent node identifier",
        },
        replicaId: {
          type: "string",
          description: "The replica unique identifier",
        },
      },
      required: ["vigilUrl", "reporterToken", "probeId", "nodeId", "replicaId"],
    },
  },
  {
    name: "list_announcements",
    description:
      "List all published announcements on the Vigil status page. Announcements are used to communicate planned maintenance or ongoing incidents to users.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        managerToken: {
          type: "string",
          description: "Manager token for authentication",
        },
      },
      required: ["vigilUrl", "managerToken"],
    },
  },
  {
    name: "insert_announcement",
    description:
      "Create and publish a new announcement on the Vigil status page. Use this to inform users about planned maintenance, incidents, or important updates.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        managerToken: {
          type: "string",
          description: "Manager token for authentication",
        },
        title: {
          type: "string",
          description: "The title for the announcement",
        },
        text: {
          type: "string",
          description: "The description text for the announcement (can be multi-line)",
        },
      },
      required: ["vigilUrl", "managerToken", "title", "text"],
    },
  },
  {
    name: "retract_announcement",
    description:
      "Remove a published announcement from the Vigil status page. Use this when an announcement is no longer relevant.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        managerToken: {
          type: "string",
          description: "Manager token for authentication",
        },
        announcementId: {
          type: "string",
          description: "The announcement identifier to be removed",
        },
      },
      required: ["vigilUrl", "managerToken", "announcementId"],
    },
  },
  {
    name: "list_prober_alerts",
    description:
      "List all current prober alerts. Alerts are triggered when monitored services fail health checks or become unreachable.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        managerToken: {
          type: "string",
          description: "Manager token for authentication",
        },
      },
      required: ["vigilUrl", "managerToken"],
    },
  },
  {
    name: "get_alert_ignore_rules",
    description:
      "Get the current ignore rules for prober alerts. These rules control when downtime reminder notifications should be suppressed.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        managerToken: {
          type: "string",
          description: "Manager token for authentication",
        },
      },
      required: ["vigilUrl", "managerToken"],
    },
  },
  {
    name: "update_alert_ignore_rules",
    description:
      "Update ignore rules for prober alerts. This configures how long downtime reminder notifications should be suppressed.",
    inputSchema: {
      type: "object",
      properties: {
        vigilUrl: {
          type: "string",
          description: "Base URL of the Vigil server",
        },
        managerToken: {
          type: "string",
          description: "Manager token for authentication",
        },
        remindersSeconds: {
          type: "number",
          description: "Seconds during which downtime reminders should be skipped",
        },
      },
      required: ["vigilUrl", "managerToken", "remindersSeconds"],
    },
  },
];

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "report_replica": {
        const validated = ReportReplicaArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/reporter/${validated.probeId}/${validated.nodeId}/`;
        const body = {
          replica: validated.replicaId,
          interval: validated.interval,
          load: validated.load,
        };
        const result = await makeRequest(url, "POST", validated.reporterToken, body);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Replica reported successfully",
                  result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flush_replica": {
        const validated = FlushReplicaArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/reporter/${validated.probeId}/${validated.nodeId}/${validated.replicaId}/`;
        const result = await makeRequest(url, "DELETE", validated.reporterToken);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Replica flushed successfully",
                  result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_announcements": {
        const validated = ListAnnouncementsArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/manager/announcements/`;
        const result = await makeRequest(url, "GET", validated.managerToken);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "insert_announcement": {
        const validated = InsertAnnouncementArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/manager/announcement/`;
        const body = {
          title: validated.title,
          text: validated.text,
        };
        const result = await makeRequest(url, "POST", validated.managerToken, body);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Announcement created successfully",
                  result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "retract_announcement": {
        const validated = RetractAnnouncementArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/manager/announcement/${validated.announcementId}/`;
        const result = await makeRequest(url, "DELETE", validated.managerToken);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Announcement retracted successfully",
                  result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_prober_alerts": {
        const validated = ListProberAlertsArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/manager/prober/alerts/`;
        const result = await makeRequest(url, "GET", validated.managerToken);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_alert_ignore_rules": {
        const validated = GetIgnoreRulesArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/manager/prober/alerts/ignored/`;
        const result = await makeRequest(url, "GET", validated.managerToken);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_alert_ignore_rules": {
        const validated = UpdateIgnoreRulesArgsSchema.parse(args);
        const url = `${validated.vigilUrl}/manager/prober/alerts/ignored/`;
        const body = {
          reminders_seconds: validated.remindersSeconds,
        };
        const result = await makeRequest(url, "PUT", validated.managerToken, body);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Alert ignore rules updated successfully",
                  result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Vigil MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
