# Vexa Bot Manager - Quick Start Guide

## 🚀 Access the Dashboard

Open your browser and navigate to:
```
http://localhost:8501
```

## 📋 Available Tabs

### 1. Bots Tab
- **View all running bots** with container details
- **Filter by status** (active, waiting, etc.)
- **Stop individual bots** with confirmation
- **Quick access** to transcripts

### 2. Deploy Tab  
- **Paste meeting URL** for instant deployment
- **Auto-detects platform** (Teams/Meet/Zoom)
- **Manual entry** for custom configuration
- **Bot naming** and passcode support

### 3. Transcripts Tab
- **View live transcripts** from active bots
- **Download as TXT** file
- **Real-time updates** every 5 seconds
- **Segment timestamps** and language info

### 4. Analytics Tab
- **Bot statistics** (total, active, completed, failed)
- **Platform distribution** charts
- **Status breakdown** visualization
- **Recent activity** table

### 5. Containers Tab 🐳 **NEW!**
- **Real-time container list** with full details
- **View logs** (last 50 lines per container)
- **Stop containers** individually
- **Remove containers** with confirmation
- **Bulk operations**: Stop all / Remove stopped

## ⚡ Quick Actions

### Deploy a Bot
1. Go to **Deploy** tab
2. Paste meeting URL or enter details manually
3. Click **Deploy Bot**
4. Bot appears in **Bots** tab within seconds

### View Transcripts
1. Go to **Transcripts** tab
2. Select active bot from dropdown
3. View live transcript feed
4. Click **Download** to save as TXT

### Manage Containers
1. Go to **Containers** tab
2. Expand any container to see details
3. Use action buttons:
   - 📋 **View Logs**: See container output
   - ⏹️ **Stop**: Gracefully stop container
   - 🗑️ **Remove**: Force remove container

### Clean Up
1. Go to **Containers** tab
2. Click **Remove All Stopped**
3. Confirm action
4. All exited containers are removed

## 🔧 Common Tasks

### Check Bot Status
```
Bots Tab → View list → Check status indicator
🟢 = Active  🟡 = Waiting  🔴 = Failed  ⚫ = Completed
```

### Stop All Bots
```
Containers Tab → Bulk Actions → Stop All Bots → Confirm
```

### View Container Logs
```
Containers Tab → Expand container → Click "View Logs"
```

### Monitor in Real-Time
```
Enable "Auto-refresh" in sidebar (5 second interval)
```

## 🔐 Authentication

The dashboard uses the `ADMIN_API_TOKEN` from your environment:
```bash
export ADMIN_API_TOKEN="your_secure_token"
```

## 📖 Full Documentation

- **Features**: `DASHBOARD_CONTAINER_MANAGEMENT.md`
- **Deployment**: `DASHBOARD_DEPLOYMENT_GUIDE.md`
- **Implementation**: `CONTAINER_MANAGEMENT_IMPLEMENTATION.md`

## 🆘 Quick Troubleshooting

### Dashboard not accessible?
```bash
docker ps | grep streamlit
docker logs vexa_dev-streamlit-dashboard-1
```

### API connection failed?
```bash
# Check if all services are running
docker ps | grep vexa_dev
```

### Container actions not working?
```bash
# Verify Docker socket access
docker exec vexa_dev-streamlit-dashboard-1 docker ps
```

## 🔄 Update Dashboard

```bash
cd /root/vexa
git pull origin main
docker compose up -d --build streamlit-dashboard
```

## 📊 Dashboard URL

**Local**: http://localhost:8501  
**Network**: http://YOUR_SERVER_IP:8501

---

**Need Help?** Check the full documentation or contact support.
