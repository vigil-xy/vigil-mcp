# vigil-mcp

MCP (Model Context Protocol) server for Vigil security scanning and cryptographic proof signing.

## Features

- **vigil.scan**: Run Vigil security scans on local host or remote repositories
- **vigil.proof.sign**: Sign action payloads with cryptographic proofs

## Installation

```bash
npm install
```

## Usage

Run the MCP server:

```bash
npm start
```

Or directly:

```bash
npx tsx src/index.ts
```

The server communicates over stdio and is compatible with MCP clients like Claude Desktop, Cursor, and other MCP-aware agents.

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