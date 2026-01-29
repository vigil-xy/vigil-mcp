#!/usr/bin/env bash
set -e

echo "🔐 Installing Vigil Lab..."

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Please install Node 20+"
  exit 1
fi

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python3 not found"
  exit 1
fi

# Install vigil-scan
if ! command -v vigil-scan &>/dev/null; then
  echo "Installing vigil-scan..."
  curl -fsSL https://releases.vigil.ai/vigil-scan-$(uname | tr '[:upper:]' '[:lower:]') \
    -o /usr/local/bin/vigil-scan
  chmod +x /usr/local/bin/vigil-scan
fi

# Install Python signer
echo "Installing vigil-cryptographicsign..."
pip3 install vigil-cryptographicsign 2>&1 | grep -v "Requirement already satisfied" || true

# Install MCP server
echo "Installing vigil-mcp..."
npm install -g vigil-mcp 2>&1 | grep -v "up to date" || true

echo ""
echo "✅ Vigil installed."
echo ""
echo "Run:"
echo "  vigil-mcp"
echo ""
echo "Then ask your AI:"
echo "  'Scan my system assuming root is compromised and give me a signed report.'"
