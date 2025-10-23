# 🎨 Vexa Streamlit Dashboard

Professional web UI for managing Vexa meeting bots.

## 🚀 Quick Start

### With Docker Compose (Recommended)

```bash
cd /root/vexa
docker-compose up -d streamlit-dashboard
```

Access: http://localhost:8501

### Standalone

```bash
cd /root/vexa/services/streamlit-ui

# Build
docker build -t vexa-streamlit:latest .

# Run
docker run -d \
  --name vexa-streamlit \
  --network vexa_dev_vexa_default \
  -p 8501:8501 \
  -e API_URL=http://api-gateway:8000 \
  -e API_KEY=token \
  vexa-streamlit:latest
```

## 📁 Files

- `dashboard.py` - Main Streamlit application
- `Dockerfile` - Container image definition
- `requirements.txt` - Python dependencies
- `.streamlit/config.toml` - Streamlit configuration

## 🔧 Configuration

Set via environment variables:

- `API_URL` - API Gateway URL (default: http://localhost:18056)
- `API_KEY` - Authentication token (default: token)

## ✨ Features

- ✅ Real-time bot monitoring
- ✅ Deploy new bots from meeting URLs
- ✅ View live transcriptions
- ✅ Stop/manage running bots
- ✅ System statistics

## 🔄 Development

```bash
# Install dependencies locally
pip install -r requirements.txt

# Run locally (set environment variables first)
export API_URL=http://localhost:18056
export API_KEY=token
streamlit run dashboard.py
```

## 📝 Recent Changes

### 2025-10-23: Fixed Bot Listing
- Changed from `/bots` to `/bots/status` endpoint
- Added data transformation for bot list
- Now properly displays all running bots

## 📚 Documentation

See `/root/vexa/DASHBOARD_DEPLOYMENT.md` for complete deployment guide.
