# Vexa Dashboard Deployment Guide

## Quick Start

### Access the Dashboard
Once deployed, the dashboard is accessible at:
```
http://localhost:8501
```

Or from external network (if configured):
```
http://<your-server-ip>:8501
```

## Deployment Instructions

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/shaike1/vexai-msteams.git
cd vexai-msteams

# Set environment variables
export ADMIN_API_TOKEN="your_secure_token_here"

# Deploy the entire stack
docker compose up -d
```

### Dashboard Only Update
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart dashboard
docker compose up -d --build streamlit-dashboard

# Verify deployment
docker ps | grep streamlit
docker logs -f vexa_dev-streamlit-dashboard-1
```

### Verify Installation
```bash
# Check if dashboard is running
curl -I http://localhost:8501

# Check if dashboard can access Docker
docker exec vexa_dev-streamlit-dashboard-1 docker ps

# View logs
docker logs vexa_dev-streamlit-dashboard-1 --tail 50
```

## Configuration

### Environment Variables
The dashboard uses these environment variables (configured in `docker-compose.yml`):

```yaml
environment:
  - API_URL=http://api-gateway:8000      # Backend API endpoint
  - API_KEY=${ADMIN_API_TOKEN:-token}    # Authentication token
```

### Docker Socket Access
The dashboard requires access to the Docker socket for container management:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Security Note**: The socket is mounted as read-only (`:ro`), but the dashboard can still execute stop/remove commands through the Docker CLI.

## Features Available

### 1. Bots Tab (📋)
- View all running bots
- See container names and IDs
- Filter by status
- Stop individual bots
- View transcription status

### 2. Deploy Tab (➕)
- Quick deployment via meeting URL
- Auto-detection of platform (Teams/Meet/Zoom)
- Manual entry form
- Bot name customization
- Passcode support

### 3. Transcripts Tab (📝)
- Live transcript viewing
- Download transcripts as TXT
- Real-time updates
- Language detection
- Segment timestamps

### 4. Analytics Tab (📊)
- Total bot count
- Platform distribution
- Status distribution
- Recent bots table
- Historical data

### 5. Containers Tab (🐳) **NEW!**
- Real-time container status
- Container details (name, ID, labels)
- View container logs
- Stop containers
- Remove containers
- Bulk operations (stop all, remove stopped)

## Container Management

### Individual Actions
1. **View Logs**: Display last 50 lines of container output
2. **Stop Container**: Gracefully stop a running bot (requires confirmation)
3. **Remove Container**: Force remove a container (requires double confirmation)

### Bulk Actions
1. **Stop All Bots**: Stop all running bot containers simultaneously
2. **Remove All Stopped**: Clean up containers that have exited

### Safety Features
- **Confirmation Dialogs**: Destructive actions require confirmation
- **Visual Feedback**: Success/error messages for all actions
- **Status Updates**: Real-time container status display
- **Auto-Refresh**: Dashboard updates every 5 seconds (configurable)

## Troubleshooting

### Dashboard Not Accessible
```bash
# Check if container is running
docker ps | grep streamlit

# Check logs for errors
docker logs vexa_dev-streamlit-dashboard-1

# Restart dashboard
docker compose restart streamlit-dashboard
```

### API Connection Failed
```bash
# Verify API gateway is running
docker ps | grep api-gateway

# Check API connectivity
curl http://localhost:18056/bots/status -H "X-API-Key: token"

# Verify network
docker network inspect vexa_dev_vexa_default
```

### Container Actions Not Working
```bash
# Verify Docker socket is mounted
docker inspect vexa_dev-streamlit-dashboard-1 | grep docker.sock

# Test Docker CLI access
docker exec vexa_dev-streamlit-dashboard-1 docker ps

# Check permissions
ls -la /var/run/docker.sock
```

### Dashboard Shows "Offline"
1. Check API gateway status: `docker ps | grep api-gateway`
2. Verify API_URL environment variable: `docker inspect vexa_dev-streamlit-dashboard-1`
3. Check network connectivity: `docker exec vexa_dev-streamlit-dashboard-1 ping api-gateway`

## Monitoring

### Health Checks
```bash
# Dashboard health
curl http://localhost:8501/_stcore/health

# Container status
docker exec vexa_dev-streamlit-dashboard-1 docker ps --format "{{.Names}}: {{.Status}}"

# Resource usage
docker stats vexa_dev-streamlit-dashboard-1 --no-stream
```

### Logs
```bash
# Follow logs in real-time
docker logs -f vexa_dev-streamlit-dashboard-1

# Last 100 lines
docker logs vexa_dev-streamlit-dashboard-1 --tail 100

# Logs from last hour
docker logs vexa_dev-streamlit-dashboard-1 --since 1h
```

## Security Best Practices

### 1. Network Security
```bash
# Restrict to internal network only (in docker-compose.yml)
ports:
  - "127.0.0.1:8501:8501"  # Only localhost
```

### 2. Authentication
```bash
# Use strong API tokens
export ADMIN_API_TOKEN=$(openssl rand -hex 32)

# Rotate tokens regularly
# Update .env file and restart services
```

### 3. Docker Socket
- Keep socket mount as read-only (`:ro`)
- Monitor dashboard logs for unusual activity
- Use separate user/group for dashboard container
- Consider using Docker socket proxy for additional security

### 4. Firewall Rules
```bash
# Allow only specific IPs (example)
sudo ufw allow from 192.168.1.0/24 to any port 8501
```

## Performance Optimization

### 1. Reduce Auto-Refresh Interval
In dashboard UI:
- Sidebar → Auto-refresh → Disable
- Or increase interval from 5s to 10s+ for lower server load

### 2. Resource Limits
Add to `docker-compose.yml`:
```yaml
streamlit-dashboard:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

### 3. Caching
The dashboard uses Streamlit's caching for:
- API responses (5 second TTL)
- Container lists
- Transcription data

## Backup and Recovery

### Backup Dashboard State
```bash
# Dashboard is stateless, but save configuration
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup
```

### Recovery
```bash
# Restore from backup
cp docker-compose.yml.backup docker-compose.yml
cp .env.backup .env

# Rebuild and restart
docker compose down
docker compose up -d --build streamlit-dashboard
```

## Updating

### Update to Latest Version
```bash
# Pull latest code
git pull origin main

# Rebuild dashboard
docker compose build streamlit-dashboard

# Restart with new image
docker compose up -d streamlit-dashboard

# Verify
docker logs vexa_dev-streamlit-dashboard-1 --tail 20
```

### Rollback
```bash
# Check image history
docker images | grep streamlit-dashboard

# Revert to previous commit
git log --oneline
git checkout <previous-commit-hash>

# Rebuild
docker compose build streamlit-dashboard
docker compose up -d streamlit-dashboard
```

## Advanced Configuration

### Custom Port
```yaml
# In docker-compose.yml
ports:
  - "8502:8501"  # Use port 8502 on host
```

### Multiple Dashboards
```yaml
# Run multiple dashboard instances
streamlit-dashboard-1:
  # ... config ...
  ports:
    - "8501:8501"

streamlit-dashboard-2:
  # ... config ...
  ports:
    - "8502:8501"
```

### Behind Reverse Proxy (Nginx)
```nginx
location /dashboard {
    proxy_pass http://localhost:8501;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Support and Documentation

### Additional Resources
- Main Documentation: `/root/vexa/DASHBOARD_CONTAINER_MANAGEMENT.md`
- API Documentation: Check `/bots/status` endpoint
- GitHub: https://github.com/shaike1/vexai-msteams

### Common Issues
1. **Port 8501 already in use**: Change port in docker-compose.yml
2. **Cannot connect to Docker**: Verify socket mount and permissions
3. **Authentication failed**: Check API_KEY environment variable
4. **Slow performance**: Disable auto-refresh or increase interval

### Getting Help
1. Check logs: `docker logs vexa_dev-streamlit-dashboard-1`
2. Review documentation in repository
3. Verify all services are running: `docker ps`
4. Check network connectivity between containers

---

**Version**: 2.0  
**Last Updated**: 2025-10-23  
**Status**: Production Ready ✅
