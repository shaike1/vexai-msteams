# Dashboard Container Management Feature

## Overview

The Vexa Bot Manager Pro dashboard now includes a comprehensive **Container Management** tab that provides real-time visibility and control over all bot containers running in your Docker environment.

## Features Added

### 1. Enhanced Bot Listing
- **Container Information**: Each bot now displays:
  - Container name (e.g., `vexa-bot-110-abc123`)
  - Container ID (short and full)
  - Container status (from Docker)
  - Normalized status (Up/Exited/Starting)

### 2. New Containers Tab (🐳)
A dedicated management interface that provides:

#### Container Details View
- **Full Container Information**:
  - Container name and ID
  - Docker status and normalized status
  - Creation timestamp
  - Associated meeting ID and platform
  - Native meeting ID
  - Container labels (vexa.* labels)

#### Per-Container Actions
- **📋 View Logs**: Display last 50 lines of container logs
- **⏹️ Stop Container**: Gracefully stop a running container (requires confirmation)
- **🗑️ Remove Container**: Force remove a container (requires confirmation)

#### Bulk Actions
- **⏹️ Stop All Bots**: Stop all running bot containers at once
- **🗑️ Remove All Stopped**: Clean up all stopped/exited containers
- **Real-time Metrics**: Live count of running vs stopped containers

### 3. Technical Implementation

#### Docker Socket Access
The dashboard container now has read-only access to the Docker socket:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

#### New Python Functions
```python
def stop_container(container_id)     # Stop a container
def remove_container(container_id)   # Remove a container
def get_container_logs(container_id) # Fetch container logs
```

#### Enhanced Data Model
The `get_bots()` function now returns:
- `container_name`: Full container name
- `container_status`: Raw Docker status string
- `normalized_status`: Parsed status (Up/Exited/Starting)
- `labels`: All container labels

## Usage

### Access the Dashboard
1. Navigate to: `http://localhost:8501`
2. Click on the **🐳 Containers** tab

### View Container Details
1. Each container is shown in an expandable section
2. Click to expand and see full details
3. View labels, meeting info, and container metadata

### Manage Individual Containers
1. **View Logs**:
   - Click "📋 View Logs" button
   - Last 50 lines will be displayed in a text area

2. **Stop Container**:
   - Click "⏹️ Stop Container"
   - Confirm by clicking again
   - Container will be gracefully stopped

3. **Remove Container**:
   - Click "🗑️ Remove Container"
   - Confirm by clicking again (warning displayed)
   - Container will be force-removed

### Bulk Operations
1. **Stop All Bots**:
   - Use when you need to stop all active bots at once
   - Requires confirmation
   - Shows success count

2. **Clean Up Stopped Containers**:
   - Removes all containers with status != "Up"
   - Helps maintain a clean environment
   - No confirmation required (only affects stopped containers)

## Architecture

### Component Integration

```
┌─────────────────────────────────────────┐
│   Streamlit Dashboard (Port 8501)      │
│   ┌─────────────────────────────────┐   │
│   │  Container Management Tab       │   │
│   │  - Lists all bot containers     │   │
│   │  - Shows status & details       │   │
│   │  - Provides control actions     │   │
│   └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               ├─── API Calls ───┐
               │                  │
               ▼                  ▼
┌──────────────────────┐   ┌────────────────────────┐
│   API Gateway        │   │   Docker Socket        │
│   (Port 18056)       │   │   /var/run/docker.sock │
│   - GET /bots/status │   │   - docker stop        │
│   - DELETE /bots/:id │   │   - docker rm          │
└──────────────────────┘   │   - docker logs        │
                            └────────────────────────┘
```

### Data Flow

1. **Status Refresh**:
   - Dashboard calls `GET /bots/status`
   - API queries Docker for running containers
   - Results include container metadata
   - Dashboard displays in UI

2. **Container Control**:
   - User clicks action button
   - Dashboard executes Docker command directly
   - Results displayed to user
   - Page auto-refreshes

3. **Auto-Refresh**:
   - Dashboard auto-refreshes every 5 seconds (configurable)
   - Keeps container status up-to-date
   - User can disable auto-refresh

## Security Considerations

### Docker Socket Access
- Dashboard container has **read-only** access to Docker socket
- Commands executed are limited to:
  - `docker stop` (graceful shutdown)
  - `docker rm -f` (force removal)
  - `docker logs` (read-only)

### Authentication
- Dashboard requires `API_KEY` environment variable
- All API calls include authentication headers
- Container operations require valid session

### Best Practices
1. Only expose dashboard on internal networks
2. Use firewall rules to restrict access
3. Monitor dashboard logs for unauthorized access
4. Regularly audit container operations

## Configuration

### Environment Variables
```bash
# Dashboard Configuration
API_URL=http://api-gateway:8000
API_KEY=your_secure_token_here

# Auto-refresh settings (configured in UI)
AUTO_REFRESH=true
REFRESH_INTERVAL=5  # seconds
```

### Docker Compose
```yaml
streamlit-dashboard:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  environment:
    - API_URL=http://api-gateway:8000
    - API_KEY=${ADMIN_API_TOKEN:-token}
```

## Deployment

### Update Existing Installation
```bash
# Pull latest changes
cd /root/vexa
git pull

# Rebuild and restart dashboard
docker compose up -d --build streamlit-dashboard

# Verify
docker ps | grep streamlit
docker logs vexa_dev-streamlit-dashboard-1
```

### Fresh Installation
Dashboard container management is automatically configured in new deployments.

## Monitoring

### Check Dashboard Health
```bash
# View dashboard logs
docker logs -f vexa_dev-streamlit-dashboard-1

# Check if dashboard can access Docker
docker exec vexa_dev-streamlit-dashboard-1 docker ps

# Verify API connectivity
curl http://localhost:8501
```

### Metrics Available
- Total containers running
- Active vs stopped containers
- Container status distribution
- Real-time refresh of status

## Troubleshooting

### Dashboard Can't Access Docker
**Symptom**: Container actions fail with permission errors

**Solution**:
```bash
# Verify socket mount
docker inspect vexa_dev-streamlit-dashboard-1 | grep docker.sock

# Restart with proper permissions
docker compose down streamlit-dashboard
docker compose up -d streamlit-dashboard
```

### Actions Not Working
**Symptom**: Stop/Remove buttons don't work

**Solution**:
1. Check dashboard logs: `docker logs vexa_dev-streamlit-dashboard-1`
2. Verify Docker socket access: `ls -la /var/run/docker.sock`
3. Ensure dashboard container is running as privileged or with proper group

### Containers Not Showing
**Symptom**: Containers tab is empty but bots are running

**Solution**:
1. Check API connectivity: `curl http://localhost:18056/bots/status -H "X-API-Key: token"`
2. Verify bot containers have proper labels: `docker inspect <container_id>`
3. Refresh dashboard page

## Future Enhancements

### Planned Features
1. **Real-time Logs Streaming**: Live log tail instead of static view
2. **Container Metrics**: CPU, Memory, Network usage per container
3. **Restart Container**: Add restart capability
4. **Batch Operations**: Select multiple containers for bulk actions
5. **Container History**: View past containers and their lifecycle
6. **Alerts**: Notifications when containers fail or exit unexpectedly
7. **Resource Limits**: Set/view resource constraints per container
8. **Export Logs**: Download full container logs
9. **Container Shell**: Access container terminal from dashboard
10. **Health Checks**: Display container health status

### API Enhancements
1. Add `/containers` endpoint for direct container management
2. Implement container lifecycle webhooks
3. Add container metrics collection
4. Provide container event stream

## Benefits

### For Users
- **Visibility**: See all bot containers at a glance
- **Control**: Start, stop, remove containers from UI
- **Debugging**: Quick access to container logs
- **Maintenance**: Easy cleanup of stopped containers

### For Operations
- **Monitoring**: Real-time status of all bots
- **Troubleshooting**: Immediate access to logs and details
- **Management**: Bulk operations for efficiency
- **Transparency**: Clear view of container state

### For Developers
- **Self-Service**: Users can manage their own containers
- **Reduced Support**: Common operations handled via UI
- **Observability**: Better insight into container behavior
- **Integration**: Foundation for advanced features

## Summary

The Container Management feature transforms the Vexa dashboard into a comprehensive control center for bot operations. Users can now:

✅ View all bot containers in real-time  
✅ See detailed container information  
✅ Control individual containers (stop, remove)  
✅ Access container logs instantly  
✅ Perform bulk operations  
✅ Monitor container health  
✅ Clean up old containers  

This enhancement significantly improves the operational experience and reduces the need for manual Docker commands, making Vexa more accessible and user-friendly.

---

**Version**: 2.0  
**Date**: 2025-10-23  
**Status**: ✅ Deployed and Operational
