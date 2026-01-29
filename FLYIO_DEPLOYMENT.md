# Fly.io Deployment Guide

This guide walks through deploying the vigil-mcp HTTP bridge on Fly.io.

## Prerequisites

1. **Fly.io account** - Sign up at https://fly.io
2. **Fly CLI installed** - `curl -L https://fly.io/install.sh | sh`
3. **Fly CLI authenticated** - `fly auth login`
4. **Built MCP server** - Run `npm run build` locally first

## Step-by-Step Deployment

### 1. Prepare Secrets

Generate secure API keys:

```bash
# Generate a secure API key
openssl rand -hex 32
```

Store them as Fly.io secrets:

```bash
# Set one or more API keys (comma-separated)
fly secrets set API_KEYS="abc123...,def456..."
```

### 2. Configure Application (Optional)

The `fly.toml` is pre-configured, but you may want to customize:

```toml
# Change app name (must be unique on Fly.io)
app = 'your-app-name'

# Change region (see: fly platform regions)
primary_region = 'ams'  # Amsterdam

# Adjust memory if needed
[[vm]]
  memory_mb = 512  # or 1024 for larger workloads
```

### 3. Deploy

```bash
# Deploy the application
fly deploy
```

This will:
1. Build the Docker image using the Dockerfile
2. Push it to Fly.io's registry
3. Create or update the application
4. Start the HTTP bridge server

### 4. Verify Deployment

Check health:

```bash
# Get app URL
fly status

# Test health endpoint
curl https://your-app-name.fly.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T...",
  "mcp_server_available": true,
  "dependencies": {
    "vigil-scan": false,  # May be false if vigil-scan not installed
    "python3": true,
    "vigil-cryptographicsign": true
  }
}
```

### 5. Test API Endpoints

```bash
# Test scan endpoint
curl -X POST https://your-app-name.fly.dev/scan \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "host",
    "dry_run": true
  }'
```

## Installing vigil-scan Binary

The Dockerfile has a commented-out section for installing vigil-scan. To enable:

### Option 1: Uncomment Dockerfile Line

Edit `Dockerfile` and uncomment:

```dockerfile
RUN curl -fsSL https://releases.vigil.ai/vigil-scan-linux -o /usr/local/bin/vigil-scan && \
    chmod +x /usr/local/bin/vigil-scan
```

**Note:** Replace the URL with the actual vigil-scan release URL.

### Option 2: Add to Dockerfile

If the binary is available elsewhere:

```dockerfile
RUN curl -fsSL https://your-cdn.com/vigil-scan -o /usr/local/bin/vigil-scan && \
    chmod +x /usr/local/bin/vigil-scan
```

### Option 3: Use Fly.io Volumes

Mount vigil-scan from a persistent volume:

```bash
# Create volume
fly volumes create vigil_data --size 1

# Update fly.toml
[[mounts]]
  source = "vigil_data"
  destination = "/data"

# Copy binary to volume after deployment
```

## Monitoring and Logs

### View Logs

```bash
# Real-time logs
fly logs

# Last 100 lines
fly logs --lines 100
```

### Check Status

```bash
# App status
fly status

# Detailed info
fly info
```

### Metrics

Access metrics via Fly.io dashboard:
- https://fly.io/dashboard/personal/apps/your-app-name

## Scaling

### Vertical Scaling (More Resources)

Edit `fly.toml`:

```toml
[[vm]]
  memory_mb = 1024  # Increase memory
  cpus = 2          # Increase CPUs
```

Deploy:
```bash
fly deploy
```

### Horizontal Scaling (More Instances)

```bash
# Scale to 2 instances
fly scale count 2

# Scale to specific regions
fly scale count 2 --region ams,syd
```

### Auto-scaling

Edit `fly.toml`:

```toml
[http_service]
  min_machines_running = 0   # Scale to zero when idle
  auto_stop_machines = 'stop'
  auto_start_machines = true
```

## Security Best Practices

### 1. Rotate API Keys Regularly

```bash
# Generate new key
NEW_KEY=$(openssl rand -hex 32)

# Update secrets (keeps both old and new for transition)
fly secrets set API_KEYS="old-key,new-key"

# Later, remove old key
fly secrets set API_KEYS="new-key"
```

### 2. Use HTTPS Only

The `fly.toml` enforces HTTPS:

```toml
[http_service]
  force_https = true
```

### 3. Monitor Access Logs

```bash
# Watch for suspicious activity
fly logs | grep "401\|429"
```

### 4. Set Up Alerts

Configure alerts in Fly.io dashboard for:
- High error rates (500s)
- Memory exhaustion
- CPU spikes
- Health check failures

## Troubleshooting

### Health Check Failing

```bash
# Check logs for errors
fly logs

# SSH into machine
fly ssh console

# Check MCP server exists
ls -la /app/build/index.js

# Test MCP server manually
node /app/build/index.js
```

### Out of Memory

Increase memory in `fly.toml`:

```toml
[[vm]]
  memory_mb = 1024  # Was 512
```

### Slow Response Times

1. Check scan timeout configuration:
```bash
fly secrets set MAX_SCAN_TIMEOUT=600  # 10 minutes
```

2. Monitor metrics in dashboard

3. Consider scaling horizontally:
```bash
fly scale count 2
```

### Rate Limiting Issues

Adjust rate limits in `bridge/server.py`:

```python
@limiter.limit("20/minute")  # Was 10/minute
async def scan(...):
```

Redeploy:
```bash
fly deploy
```

## Cost Optimization

### Scale to Zero

Enable auto-stop in `fly.toml`:

```toml
[http_service]
  min_machines_running = 0
  auto_stop_machines = 'stop'
  auto_start_machines = true
```

### Use Smaller Instances

```toml
[[vm]]
  memory_mb = 256  # Minimum for Node.js + Python
  cpu_kind = 'shared'
  cpus = 1
```

### Monitor Usage

```bash
# Check current pricing
fly pricing

# View current month usage
fly dashboard
```

## Integration with GPT Actions

### 1. Get Your API Endpoint

```bash
fly status
# Note the URL: https://your-app-name.fly.dev
```

### 2. Download OpenAPI Spec

```bash
curl https://your-app-name.fly.dev/openapi.json > openapi.json
```

Or use the static file:
```bash
cat openapi.yaml
```

### 3. Configure in GPT Builder

1. Go to https://chat.openai.com/gpts/editor
2. Navigate to "Actions" tab
3. Click "Create new action"
4. Paste OpenAPI spec content
5. Configure authentication:
   - Type: API Key
   - Header name: `X-API-Key`
   - Key value: (your API key from earlier)
6. Test the action

### 4. Test from GPT

Ask the GPT:
- "Run a security scan on the host"
- "Perform a signed security scan"
- "Check the health of the vigil service"

## Advanced Configuration

### Custom Domain

```bash
# Add custom domain
fly certs add your-domain.com

# Update DNS
# Add CNAME: your-domain.com -> your-app-name.fly.dev
```

### Environment Variables

```bash
# Set custom timeout
fly secrets set MAX_SCAN_TIMEOUT=600

# Set custom MCP path (if needed)
fly secrets set MCP_SERVER_PATH=/custom/path/index.js
```

### Multiple Regions

Deploy to multiple regions for lower latency:

```bash
# Add region
fly regions add syd  # Sydney

# Remove region
fly regions remove syd
```

## Backup and Recovery

### Export Configuration

```bash
# Backup fly.toml
cp fly.toml fly.toml.backup

# Export secrets (manual process - write them down)
fly secrets list
```

### Disaster Recovery

```bash
# Rebuild from source
npm run build
fly deploy

# Restore secrets
fly secrets set API_KEYS="your-keys"
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Build locally (optional, for testing)
npm run build

# Deploy
fly deploy
```

### Update Dependencies

```bash
# Update Node dependencies
npm update
npm run build

# Update Python dependencies
pip install --upgrade -r bridge/requirements.txt

# Test locally
python3 -m bridge.server

# Deploy
fly deploy
```

### View Recent Deployments

```bash
fly releases
```

### Rollback

```bash
# Rollback to previous version
fly releases rollback
```

## Support

- **Fly.io Documentation**: https://fly.io/docs
- **Fly.io Community**: https://community.fly.io
- **Vigil Documentation**: See README.md and other docs in this repo
- **Issues**: https://github.com/vigil-xy/vigil-mcp/issues

## Checklist

Before deploying to production:

- [ ] Generated secure API keys
- [ ] Set API_KEYS secret in Fly.io
- [ ] Tested health endpoint
- [ ] Tested scan endpoint with valid API key
- [ ] Configured custom domain (optional)
- [ ] Set up monitoring and alerts
- [ ] Documented API keys in secure location
- [ ] Tested rate limiting
- [ ] Verified vigil-scan binary is installed (if needed)
- [ ] Tested GPT Actions integration (if applicable)
- [ ] Set up log aggregation (optional)
- [ ] Configured backup procedures
- [ ] Tested scaling configuration

## Next Steps

After successful deployment:

1. **Monitor**: Watch logs and metrics for first few days
2. **Optimize**: Adjust rate limits and scaling based on usage
3. **Secure**: Rotate API keys regularly
4. **Document**: Keep internal docs updated with endpoints and keys
5. **Test**: Run periodic security audits of the deployment
