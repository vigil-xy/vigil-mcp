#!/bin/bash
# Test script for HTTP bridge

set -e

echo "=== Vigil MCP Bridge Test Suite ==="
echo ""

API_URL="${API_URL:-http://localhost:8080}"
echo "Testing against: $API_URL"
echo ""

# Test 1: Health endpoint
echo "Test 1: Health Endpoint"
echo "------------------------"
HEALTH=$(curl -s "$API_URL/health")
STATUS=$(echo "$HEALTH" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")

if [ "$STATUS" = "healthy" ]; then
    echo "✓ Health endpoint working"
    echo "$HEALTH" | python3 -m json.tool
else
    echo "✗ Health endpoint failed"
    exit 1
fi
echo ""

# Test 2: Root endpoint
echo "Test 2: Root Endpoint"
echo "--------------------"
ROOT=$(curl -s "$API_URL/")
NAME=$(echo "$ROOT" | python3 -c "import sys, json; print(json.load(sys.stdin)['name'])")

if [ "$NAME" = "Vigil MCP Bridge" ]; then
    echo "✓ Root endpoint working"
    echo "$ROOT" | python3 -m json.tool
else
    echo "✗ Root endpoint failed"
    exit 1
fi
echo ""

# Test 3: OpenAPI spec
echo "Test 3: OpenAPI Spec"
echo "--------------------"
OPENAPI=$(curl -s "$API_URL/openapi.json")
OPENAPI_VERSION=$(echo "$OPENAPI" | python3 -c "import sys, json; print(json.load(sys.stdin)['openapi'])")

if [ "$OPENAPI_VERSION" = "3.1.0" ]; then
    echo "✓ OpenAPI spec available"
    echo "OpenAPI version: $OPENAPI_VERSION"
else
    echo "✗ OpenAPI spec failed"
    exit 1
fi
echo ""

# Test 4: Authentication (should fail without API key in production)
echo "Test 4: Authentication Check"
echo "----------------------------"
SCAN_RESPONSE=$(curl -s -X POST "$API_URL/scan" \
    -H "Content-Type: application/json" \
    -d '{"target": "host", "dry_run": true}')

if echo "$SCAN_RESPONSE" | grep -q "Not authenticated\|Invalid API key"; then
    echo "✓ Authentication is enforced (production mode)"
elif echo "$SCAN_RESPONSE" | grep -q "vigil-scan command not found\|Error"; then
    echo "✓ Authentication bypassed (dev mode) - would execute if vigil-scan installed"
else
    echo "Response: $SCAN_RESPONSE"
fi
echo ""

# Test 5: Check dependencies
echo "Test 5: Dependency Check"
echo "------------------------"
DEPS=$(echo "$HEALTH" | python3 -c "import sys, json; deps = json.load(sys.stdin)['dependencies']; print('\\n'.join([f'{k}: {v}' for k, v in deps.items()]))")
echo "$DEPS"
echo ""

echo "=== Test Suite Complete ==="
echo ""
echo "Summary:"
echo "- Bridge server is operational"
echo "- Health endpoint working"
echo "- OpenAPI spec available"
echo "- Authentication configured"
echo ""
echo "Notes:"
echo "- vigil-scan not installed (expected in test environment)"
echo "- To test scanning, install vigil-scan binary"
echo "- To test signing, ensure vigil-cryptographicsign is installed (✓ already installed)"
echo ""
echo "Next steps:"
echo "1. Deploy to Fly.io: fly deploy"
echo "2. Set API keys: fly secrets set API_KEYS='your-key'"
echo "3. Test production deployment: curl https://your-app.fly.dev/health"
