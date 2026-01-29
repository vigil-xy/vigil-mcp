# API Usage Examples

This document provides practical examples for using the Vigil MCP Bridge API.

## Prerequisites

Set up your environment:

```bash
export API_KEY="your-api-key-here"
export API_URL="https://your-app-name.fly.dev"
# Or for local testing:
# export API_URL="http://localhost:8080"
```

## Health Check

Check service health:

```bash
curl "$API_URL/health"
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T22:41:42.761Z",
  "mcp_server_available": true,
  "dependencies": {
    "vigil-scan": true,
    "python3": true,
    "vigil-cryptographicsign": true
  }
}
```

## Scan Operations

### Basic Host Scan

```bash
curl -X POST "$API_URL/scan" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "host",
    "dry_run": true
  }'
```

### Repository Scan

```bash
curl -X POST "$API_URL/scan" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "repo",
    "repo_url": "https://github.com/example/repo",
    "dry_run": true
  }'
```

### Signed Scan (Tamper-Evident)

```bash
curl -X POST "$API_URL/scan/signed" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "host",
    "dry_run": true
  }'
```

Response:
```json
{
  "scan_result": {
    "timestamp": "2026-01-29T22:41:42.761Z",
    "target": "localhost",
    "findings": {
      "open_ports": [],
      "file_findings": [],
      "system_issues": []
    },
    "summary": {
      "risk_level": "low",
      "total_findings": 0
    },
    "raw_output": "..."
  },
  "cryptographic_proof": {
    "signature": "...",
    "timestamp": "...",
    "algorithm": "...",
    "metadata": {}
  },
  "is_tamper_evident": true
}
```

## Python Examples

### Install Requirements

```bash
pip install requests
```

### Basic Scan

```python
import requests
import json

API_KEY = "your-api-key"
API_URL = "https://your-app-name.fly.dev"

def scan_host(dry_run=True):
    """Run a security scan on localhost."""
    response = requests.post(
        f"{API_URL}/scan",
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "target": "host",
            "dry_run": dry_run
        }
    )
    
    response.raise_for_status()
    return response.json()

# Run scan
result = scan_host()
print(json.dumps(result, indent=2))
```

### Signed Scan with Error Handling

```python
import requests
import json
from typing import Optional

API_KEY = "your-api-key"
API_URL = "https://your-app-name.fly.dev"

class VigilClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        })
    
    def scan_signed(self, target: str, repo_url: Optional[str] = None, dry_run: bool = True):
        """Run a signed security scan."""
        payload = {
            "target": target,
            "dry_run": dry_run
        }
        
        if target == "repo" and repo_url:
            payload["repo_url"] = repo_url
        
        try:
            response = self.session.post(
                f"{self.api_url}/scan/signed",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                print("Rate limit exceeded. Wait and retry.")
            elif e.response.status_code == 401:
                print("Invalid API key.")
            else:
                print(f"Error: {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def health_check(self):
        """Check service health."""
        response = requests.get(f"{self.api_url}/health")
        response.raise_for_status()
        return response.json()

# Usage
client = VigilClient(API_URL, API_KEY)

# Check health
health = client.health_check()
print(f"Service status: {health['status']}")

# Run signed scan
result = client.scan_signed("host", dry_run=True)
print(json.dumps(result, indent=2))

# Verify tamper-evidence
if result.get("is_tamper_evident"):
    print("✓ Results are cryptographically signed and tamper-evident")
```

## JavaScript/Node.js Examples

### Install Requirements

```bash
npm install axios
```

### Basic Usage

```javascript
const axios = require('axios');

const API_KEY = 'your-api-key';
const API_URL = 'https://your-app-name.fly.dev';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

async function scanHost(dryRun = true) {
  try {
    const response = await client.post('/scan', {
      target: 'host',
      dry_run: dryRun
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function scanSigned(target, repoUrl = null, dryRun = true) {
  try {
    const payload = {
      target,
      dry_run: dryRun
    };
    
    if (target === 'repo' && repoUrl) {
      payload.repo_url = repoUrl;
    }
    
    const response = await client.post('/scan/signed', payload);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please wait and retry.');
    } else if (error.response?.status === 401) {
      console.error('Invalid API key.');
    }
    throw error;
  }
}

// Usage
(async () => {
  // Basic scan
  const scanResult = await scanHost();
  console.log('Scan result:', JSON.stringify(scanResult, null, 2));
  
  // Signed scan
  const signedResult = await scanSigned('host');
  console.log('Signed scan result:', JSON.stringify(signedResult, null, 2));
  
  // Verify tamper-evidence
  if (signedResult.is_tamper_evident) {
    console.log('✓ Results are cryptographically signed');
  }
})();
```

## Go Examples

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const (
    APIKey = "your-api-key"
    APIURL = "https://your-app-name.fly.dev"
)

type ScanRequest struct {
    Target  string `json:"target"`
    RepoURL string `json:"repo_url,omitempty"`
    DryRun  bool   `json:"dry_run"`
}

type ScanResult struct {
    Timestamp  string                 `json:"timestamp"`
    Target     string                 `json:"target"`
    Findings   map[string]interface{} `json:"findings"`
    Summary    Summary                `json:"summary"`
    RawOutput  string                 `json:"raw_output"`
}

type Summary struct {
    RiskLevel     string `json:"risk_level"`
    TotalFindings int    `json:"total_findings"`
}

func scan(target string, dryRun bool) (*ScanResult, error) {
    payload := ScanRequest{
        Target: target,
        DryRun: dryRun,
    }
    
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return nil, err
    }
    
    req, err := http.NewRequest("POST", APIURL+"/scan", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("X-API-Key", APIKey)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API error: %s - %s", resp.Status, string(body))
    }
    
    var result ScanResult
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result, nil
}

func main() {
    result, err := scan("host", true)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }
    
    fmt.Printf("Scan completed at: %s\n", result.Timestamp)
    fmt.Printf("Risk level: %s\n", result.Summary.RiskLevel)
    fmt.Printf("Total findings: %d\n", result.Summary.TotalFindings)
}
```

## GPT Actions Configuration

### OpenAPI Spec

Import the OpenAPI spec from `/openapi.json` or `openapi.yaml` into GPT Builder.

### Authentication Configuration

In GPT Builder Actions settings:

1. **Authentication Type**: API Key
2. **API Key Header Name**: `X-API-Key`
3. **API Key Value**: Your API key

### Example GPT Instructions

```
You are a security assistant with access to Vigil scanning tools.

When asked to scan systems:
1. Use the `scan` action for basic scans
2. Use the `scanSigned` action when tamper-evidence is required
3. Always explain the findings in plain language
4. Highlight high-risk issues clearly

IMPORTANT:
- Always use dry_run: true by default unless explicitly told otherwise
- Warn users before running real scans (dry_run: false)
- Never auto-trigger scans without user confirmation
```

### Example GPT Queries

Users can ask:
- "Run a security scan on the host"
- "Perform a signed security scan"
- "Scan the repository at https://github.com/example/repo"
- "Check the health of the vigil service"

## Error Handling Examples

### Rate Limit Handling (Python)

```python
import time
import requests

def scan_with_retry(client, max_retries=3):
    """Scan with automatic retry on rate limit."""
    for attempt in range(max_retries):
        try:
            return client.scan_signed("host")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                wait_time = 60  # Wait 1 minute
                print(f"Rate limited. Waiting {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            else:
                raise
    
    raise Exception("Max retries exceeded")
```

### Timeout Handling (JavaScript)

```javascript
async function scanWithTimeout(client, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await client.post('/scan', {
      target: 'host',
      dry_run: true
    }, {
      signal: controller.signal
    });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Scan timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

## Testing and Validation

### Test Health Endpoint

```bash
#!/bin/bash
# test-health.sh

API_URL="${API_URL:-http://localhost:8080}"

echo "Testing health endpoint..."
RESPONSE=$(curl -s "$API_URL/health")

STATUS=$(echo "$RESPONSE" | jq -r '.status')

if [ "$STATUS" = "healthy" ]; then
    echo "✓ Service is healthy"
    exit 0
else
    echo "✗ Service is unhealthy"
    echo "$RESPONSE" | jq .
    exit 1
fi
```

### Test All Endpoints

```bash
#!/bin/bash
# test-all.sh

set -e

API_KEY="${API_KEY}"
API_URL="${API_URL:-http://localhost:8080}"

echo "1. Testing health endpoint..."
curl -s "$API_URL/health" | jq .

echo -e "\n2. Testing scan endpoint..."
curl -s -X POST "$API_URL/scan" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"target": "host", "dry_run": true}' | jq .

echo -e "\n3. Testing scan/signed endpoint..."
curl -s -X POST "$API_URL/scan/signed" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"target": "host", "dry_run": true}' | jq .

echo -e "\n✓ All tests passed"
```

Make executable:
```bash
chmod +x test-health.sh test-all.sh
```

## Production Monitoring

### Health Check Script

```python
#!/usr/bin/env python3
"""
Health monitoring script for production.
Run as cron job or in monitoring system.
"""

import requests
import sys
from datetime import datetime

API_URL = "https://your-app-name.fly.dev"

def check_health():
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        response.raise_for_status()
        
        data = response.json()
        status = data.get("status")
        
        if status != "healthy":
            print(f"ALERT: Service status is {status}")
            return False
        
        # Check dependencies
        deps = data.get("dependencies", {})
        for dep, available in deps.items():
            if not available:
                print(f"ALERT: Dependency {dep} is unavailable")
                return False
        
        print(f"OK: Service healthy at {datetime.now()}")
        return True
        
    except Exception as e:
        print(f"ALERT: Health check failed: {e}")
        return False

if __name__ == "__main__":
    success = check_health()
    sys.exit(0 if success else 1)
```

## Best Practices

1. **Always use HTTPS in production**
2. **Store API keys securely** (environment variables, secrets manager)
3. **Handle rate limits gracefully** (retry with backoff)
4. **Set reasonable timeouts** (scans can take 30+ seconds)
5. **Validate responses** (check for errors and expected fields)
6. **Log important events** (for audit trail)
7. **Monitor health endpoint** (automated checks every 5-10 minutes)
8. **Use dry_run: true by default** (safer testing)
9. **Cache results when appropriate** (avoid redundant scans)
10. **Implement circuit breakers** (stop retrying if service is down)

## Troubleshooting

### Common Errors

**401 Unauthorized**
```json
{
  "error": "Invalid API key",
  "timestamp": "..."
}
```
Solution: Check your API key is correct and set in the `X-API-Key` header.

**429 Rate Limit Exceeded**
```json
{
  "error": "Rate limit exceeded",
  "timestamp": "..."
}
```
Solution: Wait 60 seconds and retry. Implement exponential backoff.

**504 Gateway Timeout**
```json
{
  "error": "Tool execution timed out after 300 seconds",
  "timestamp": "..."
}
```
Solution: Increase `MAX_SCAN_TIMEOUT` or optimize scan target.

**500 Internal Server Error**
```json
{
  "error": "MCP server error: ...",
  "detail": "...",
  "timestamp": "..."
}
```
Solution: Check server logs with `fly logs`. Ensure dependencies are installed.
