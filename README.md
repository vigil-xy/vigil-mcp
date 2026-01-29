# Vigil MCP Server

An MCP (Model Context Protocol) server that exposes Vigil monitoring tools. This server allows AI assistants and other MCP clients to interact with [Vigil](https://github.com/valeriansaliou/vigil), a microservices status page and monitoring system.

## Features

This MCP server provides tools for both Vigil Reporter API and Manager API:

### Reporter API Tools
- **report_replica**: Report a replica's health status (CPU and RAM load) to Vigil
- **flush_replica**: Remove a replica from Vigil monitoring

### Manager API Tools
- **list_announcements**: List all published announcements
- **insert_announcement**: Create a new announcement on the status page
- **retract_announcement**: Remove a published announcement
- **list_prober_alerts**: List all current prober alerts
- **get_alert_ignore_rules**: Get current alert ignore rules
- **update_alert_ignore_rules**: Update alert ignore rules

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

```bash
npm start
```

Or directly:

```bash
node build/index.js
```

### Configuration with MCP Clients

Add this server to your MCP client configuration. For example, with Claude Desktop, add to your config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vigil": {
      "command": "node",
      "args": ["/absolute/path/to/vigil-mcp/build/index.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "vigil": {
      "command": "vigil-mcp"
    }
  }
}
```

## Tool Examples

### Report Replica Health

```json
{
  "vigilUrl": "https://status.example.com",
  "reporterToken": "your-reporter-token",
  "probeId": "web",
  "nodeId": "api-server",
  "replicaId": "192.168.1.100",
  "interval": 30,
  "load": {
    "cpu": 0.30,
    "ram": 0.80
  }
}
```

### Create an Announcement

```json
{
  "vigilUrl": "https://status.example.com",
  "managerToken": "your-manager-token",
  "title": "Scheduled Maintenance",
  "text": "We will be performing system maintenance on Sunday at 2 AM UTC. Expected downtime: 30 minutes."
}
```

### List Alerts

```json
{
  "vigilUrl": "https://status.example.com",
  "managerToken": "your-manager-token"
}
```

## Development

### Build

```bash
npm run build
```

### Project Structure

- `src/index.ts`: Main MCP server implementation
- `build/`: Compiled JavaScript output
- `tsconfig.json`: TypeScript configuration
- `package.json`: Project dependencies and scripts

## Requirements

- Node.js 18 or higher
- A running Vigil server instance
- Valid Vigil reporter and/or manager tokens

## About Vigil

[Vigil](https://github.com/valeriansaliou/vigil) is an open-source microservices status page that monitors your infrastructure via HTTP, TCP, ICMP, and push probes. It provides:

- Real-time service health monitoring
- Public status pages
- Incident management and notifications
- Push-based replica reporting
- Announcement management

## License

MIT