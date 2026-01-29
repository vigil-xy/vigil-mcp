# Vigil MCP — Cryptographic Security & Trust Tools for AI Systems

This MCP server exposes Vigil's security scanning and cryptographic proof tools. It allows AI assistants to scan systems under attacker assumptions and produce tamper-evident, verifiable reports.

## Features

- **vigil.scan**: Run Vigil security scans on local host or remote repositories
- **vigil.proof.sign**: Sign action payloads with cryptographic proofs

## Quick Install

The fastest way to get started:

```bash
curl -fsSL https://lab.vigil.ai/install.sh | sh
```

Or install manually with npm:

```bash
npm install -g vigil-mcp
```

Then run:

```bash
vigil-mcp
```

Or use directly with npx:

```bash
npx vigil-mcp
```

## Usage

### Running the Server

Run the MCP server:

```bash
vigil-mcp
```

Or if installed locally:

```bash
npm start
```

The server communicates over stdio and is compatible with MCP clients like Claude Desktop, Cursor, and other MCP-aware agents.

### Configuration with MCP Clients

Add this server to your MCP client configuration. For example, with Claude Desktop, add to your config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vigil": {
      "command": "vigil-mcp"
    }
  }
}
```

## Available Tools

### vigil.scan

Run a Vigil security scan on a target.

**Parameters:**
- `target` (string, required): Either "host" for local system or "repo" for a repository
- `repo_url` (string, optional): Repository URL (required when target is "repo")
- `dry_run` (boolean, optional): Run in dry-run mode without making changes (default: true)

**Example:**
```json
{
  "target": "host",
  "dry_run": true
}
```

### vigil.proof.sign

Sign an action payload with cryptographic proof.

**Parameters:**
- `payload` (object, required): The payload to sign
- `purpose` (string, required): Purpose of the signature

**Example:**
```json
{
  "payload": {"action": "scan", "result": "..."},
  "purpose": "verification"
}
```

## Requirements

- Node.js v20+
- Python 3 with `vigil_cryptographicsign` module
- `vigil-scan` command-line tool

## Development

The project uses TypeScript with the following structure:

- `src/index.ts`: Main MCP server implementation
- `scripts/sign_proof.py`: Python script for cryptographic signing
- `tsconfig.json`: TypeScript configuration
- `package.json`: Node.js dependencies and scripts

### Building from Source

```bash
npm install
npm run build
```

### Testing Locally

```bash
npm start
```

## License

MIT

