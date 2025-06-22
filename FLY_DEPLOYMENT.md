# Fly.io Deployment Guide

This guide explains how to deploy the Elasticsearch container to Fly.io.

## Prerequisites

1. **Install Fly CLI**: 
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   fly auth login
   ```

## Quick Deployment

Run the deployment script:
```bash
./deploy-elasticsearch.sh
```

## Manual Deployment

1. **Deploy the application**:
   ```bash
   fly deploy
   ```

2. **Check the status**:
   ```bash
   fly status
   ```

3. **View logs**:
   ```bash
   fly logs
   ```

## Configuration

The deployment uses the following configuration:

- **App Name**: `slobot-elasticsearch`
- **Region**: `iad` (US East)
- **Memory**: 256MB
- **CPU**: 1 shared CPU
- **Port**: 9200 (Elasticsearch default)

## Environment Variables

The following environment variables are configured:
- `PORT`: 9200 (Elasticsearch HTTP port)
- `discovery.type`: single-node
- `xpack.security.enabled`: false
- `ES_JAVA_OPTS`: -Xms64m -Xmx64m (minimal memory usage)

## Accessing Your Elasticsearch Instance

Once deployed, your Elasticsearch instance will be available at:
```
https://slobot-elasticsearch.fly.dev
```

## Health Checks

The deployment includes health checks that verify the Elasticsearch service is running properly.

## Scaling

To scale your application:
```bash
fly scale count 2  # Scale to 2 instances
fly scale memory 512  # Increase memory to 512MB
```

## Monitoring

View metrics and monitoring:
```bash
fly dashboard  # Open web dashboard
fly logs       # View application logs
```

## Troubleshooting

1. **Check app status**:
   ```bash
   fly status
   ```

2. **View recent logs**:
   ```bash
   fly logs
   ```

3. **SSH into the machine**:
   ```bash
   fly ssh console
   ```

4. **Destroy and redeploy**:
   ```bash
   fly destroy
   fly deploy
   ``` 