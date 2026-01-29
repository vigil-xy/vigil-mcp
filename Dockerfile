# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y python3 python3-pip python3-venv curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment for Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install vigil-cryptographicsign Python package in virtual environment
RUN pip3 install vigil-cryptographicsign

# Copy built application
COPY --from=build /app /app

# Install HTTP bridge dependencies
COPY bridge/requirements.txt /app/bridge/requirements.txt
RUN pip3 install -r /app/bridge/requirements.txt

# Install vigil-scan binary (if available from releases)
# Note: This URL is a placeholder - replace with actual release URL
# RUN curl -fsSL https://releases.vigil.ai/vigil-scan-linux -o /usr/local/bin/vigil-scan && \
#     chmod +x /usr/local/bin/vigil-scan

# Expose HTTP port for bridge server
EXPOSE 8080

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV MCP_SERVER_PATH=/app/build/index.js

# Start the HTTP bridge server (spawns MCP server as subprocess)
CMD [ "python3", "-m", "bridge.server" ]
