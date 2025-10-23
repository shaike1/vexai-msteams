# 🎨 Vexa Bot Manager Dashboard - Deployment Guide

## 📋 Overview

The Vexa Bot Manager Dashboard is a professional Streamlit-based web UI that provides real-time monitoring, management, and control of your Vexa meeting bots.

**Dashboard URL:** http://localhost:8501

---

## 🚀 Quick Start

### Option 1: Deploy with Full Stack (Recommended)

```bash
cd /root/vexa
make all TARGET=gpu
```

The dashboard will automatically start as part of the stack on **port 8501**.

### Option 2: Deploy Dashboard Only

```bash
cd /root/vexa
docker-compose up -d streamlit-dashboard
```

### Option 3: Rebuild and Restart Dashboard

```bash
cd /root/vexa
docker-compose up -d --build streamlit-dashboard
```

---

## 🔧 Configuration

The dashboard is configured via environment variables in `docker-compose.yml`:

```yaml
streamlit-dashboard:
  build:
    context: ./services/streamlit-ui
    dockerfile: Dockerfile
  ports:
    - "8501:8501"
  environment:
    - API_URL=http://api-gateway:8000
    - API_KEY=${ADMIN_API_TOKEN:-token}
  depends_on:
    - api-gateway
  networks:
    - vexa_default
  restart: unless-stopped
```

### Environment Variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://api-gateway:8000` | Internal API Gateway URL |
| `API_KEY` | `${ADMIN_API_TOKEN}` | API authentication token |

---

## 📊 Features

### ✅ **Real-Time Bot Monitoring**
- Live bot status (active, joining, failed, etc.)
- Platform indicators (Teams, Zoom, Google Meet)
- Uptime tracking
- Container health monitoring

### ✅ **Bot Management**
- **Deploy New Bots:** Paste meeting URL and deploy instantly
- **Stop Bots:** Terminate running bots with one click
- **Auto-Extract Meeting IDs:** Smart URL parsing for Teams/Zoom/Meet

### ✅ **Live Transcriptions**
- View real-time transcriptions from any active bot
- Download transcripts as text files
- Filter by bot/meeting

### ✅ **System Statistics**
- Total bots count
- Active/inactive breakdown
- API connection status
- Health indicators

---

## 🎯 Dashboard Tabs

### 1️⃣ **📋 Bots Tab**
Monitor all running bots with detailed information:
- Bot ID and platform
- Meeting ID
- Current status with emoji indicators
- Uptime/duration
- Quick actions (View Transcript, Stop)

### 2️⃣ **📝 Transcripts Tab**
Access real-time transcriptions:
- Select from dropdown of active bots
- Live transcript display
- Download button for saving
- Auto-refresh every 10 seconds

### 3️⃣ **➕ Deploy Tab**
Launch new bots quickly:
- Paste meeting URL (Teams/Zoom/Google Meet)
- Auto-extracts meeting ID and passcode
- Optional bot name
- One-click deployment
- Status feedback

---

## 🔍 API Endpoints Used

The dashboard connects to the API Gateway on port 18056 (internal: 8000):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bots/status` | GET | List all running bots |
| `/bots` | POST | Deploy new bot |
| `/bots/{bot_id}` | DELETE | Stop bot |
| `/meetings/{meeting_id}/transcriptions` | GET | Get transcripts |

---

## 🐛 Troubleshooting

### Dashboard Not Loading

```bash
# Check if container is running
docker ps | grep streamlit

# View logs
docker logs vexa_dev-streamlit-dashboard-1

# Restart dashboard
docker-compose restart streamlit-dashboard
```

### "Connection Failed" in Dashboard

```bash
# Verify API Gateway is running
docker ps | grep api-gateway

# Check network connectivity
docker exec vexa_dev-streamlit-dashboard-1 ping api-gateway

# Test API endpoint
docker exec vexa_dev-streamlit-dashboard-1 curl http://api-gateway:8000/bots/status
```

### Dashboard Shows No Bots

```bash
# Verify bots are actually running
docker ps | grep vexa-bot

# Check API response
curl -H "X-API-Key: token" http://localhost:18056/bots/status

# Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
```

### Port 8501 Already in Use

```bash
# Stop existing Streamlit instance
docker stop vexa-streamlit 2>/dev/null
docker rm vexa-streamlit 2>/dev/null

# Or change port in docker-compose.yml
# ports:
#   - "8502:8501"  # Use 8502 instead
```

---

## 📁 File Structure

```
vexa/
├── docker-compose.yml           # ✅ Updated with streamlit-dashboard service
└── services/
    └── streamlit-ui/
        ├── Dockerfile           # Container definition
        ├── dashboard.py         # ✅ Fixed: Uses /bots/status endpoint
        ├── requirements.txt     # Python dependencies
        └── .streamlit/
            └── config.toml      # Streamlit configuration
```

---

## 🔄 Update Process

### When Dashboard Code Changes:

```bash
cd /root/vexa

# Rebuild and restart
docker-compose up -d --build streamlit-dashboard

# Or use make
make restart-dashboard  # If target exists
```

### Manual Rebuild:

```bash
cd /root/vexa/services/streamlit-ui

# Build image
docker build -t vexa-streamlit:latest .

# Stop old container
docker rm -f vexa_dev-streamlit-dashboard-1

# Start with docker-compose
docker-compose up -d streamlit-dashboard
```

---

## 🎨 Customization

### Change Theme Colors

Edit `services/streamlit-ui/.streamlit/config.toml`:

```toml
[theme]
primaryColor = "#0ea5e9"    # Blue
backgroundColor = "#ffffff"  # White
secondaryBackgroundColor = "#f1f5f9"  # Light gray
textColor = "#1e293b"       # Dark gray
```

### Modify Auto-Refresh Rate

Edit `dashboard.py`:

```python
# Line ~200
time.sleep(10)  # Change from 10 to desired seconds
```

---

## 📊 Status Indicators

| Emoji | Status | Meaning |
|-------|--------|---------|
| 🟢 | active | Bot is running and transcribing |
| 🔵 | requested | Bot deployment initiated |
| 🔄 | joining | Bot is joining the meeting |
| 🟡 | awaiting_admission | Waiting for host to admit |
| 🔴 | failed | Bot deployment failed |
| ⚫ | completed | Meeting ended |

---

## 🔐 Security Notes

- Dashboard requires `ADMIN_API_TOKEN` for authentication
- All API calls use `X-API-Key` header
- Dashboard runs on internal Docker network
- Only port 8501 is exposed to host

---

## ✅ Recent Fixes (2025-10-23)

### Fixed: Dashboard Not Showing Bots

**Problem:** Dashboard was calling wrong API endpoint `/bots` (POST only)

**Solution:** 
1. Updated `check_api_connection()` to use `/bots/status`
2. Updated `get_bots()` to use `/bots/status` and transform response
3. Added data mapping from Docker container format to dashboard format
4. Integrated dashboard into `docker-compose.yml`

**Result:** ✅ Dashboard now displays all running bots with full details!

---

## 🎉 Success Criteria

When properly deployed, you should see:

✅ Sidebar shows "🟢 Connected"
✅ Statistics show correct bot counts
✅ Bots tab lists all active bots
✅ Each bot shows platform, meeting ID, status, uptime
✅ View Transcript buttons work
✅ Deploy tab can launch new bots
✅ Stop buttons terminate bots

---

## 📞 Support

For issues:
1. Check logs: `docker logs vexa_dev-streamlit-dashboard-1`
2. Verify API: `curl http://localhost:18056/bots/status -H "X-API-Key: token"`
3. Review this guide's troubleshooting section

---

**🎉 Dashboard Successfully Integrated into Vexa Stack!**
**Access:** http://localhost:8501
