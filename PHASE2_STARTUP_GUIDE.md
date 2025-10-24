# 🚀 Phase 2 React Dashboard - Startup Guide

**Date:** October 24, 2025  
**Status:** ✅ Ready to Launch  
**Version:** 1.0.0

---

## 🎯 Quick Start (Choose One Method)

### Method 1: Docker (Recommended)

```bash
# Start React dashboard with Docker
cd /root/vexa
docker-compose up -d react-dashboard

# Access at: http://localhost:3000
```

### Method 2: Development Mode

```bash
# Navigate to React dashboard
cd /root/vexa/services/react-dashboard

# Start development server
npm run dev

# Access at: http://localhost:3000
```

### Method 3: Full Stack

```bash
# Start ALL services including React dashboard
cd /root/vexa
docker-compose up -d

# Services available:
# - React Dashboard: http://localhost:3000
# - Streamlit Dashboard: http://localhost:8501
# - API Gateway: http://localhost:18056
```

---

## 🔍 Verify Installation

### 1. Check Services Running

```bash
# Check all containers
docker ps --filter "name=vexa"

# Should see:
# - vexa_dev-react-dashboard-1 (port 3000)
# - vexa_dev-api-gateway-1 (port 18056)
# - vexa_dev-streamlit-dashboard-1 (port 8501)
# - And others...
```

### 2. Test React Dashboard

```bash
# Access the dashboard
open http://localhost:3000

# Or with curl
curl -I http://localhost:3000
```

### 3. Test API Connection

```bash
# Check API health
curl http://localhost:18056/health

# List bots
curl http://localhost:18056/bots
```

---

## 🎨 Dashboard Features

### Current Features (Phase 2A)

✅ **Dashboard Stats**
- Total bots counter
- Active bots (green)
- Waiting bots (yellow)
- Failed bots (red)

✅ **Bot Management**
- View all bots in grid layout
- See bot status with color badges
- Platform and meeting ID display
- Creation timestamp

✅ **Actions**
- Create new bot (button in header)
- View bot details (View button)
- Stop active bots (Stop button)
- Auto-refresh every 5 seconds

✅ **UI/UX**
- Modern, professional design
- Responsive grid layout
- Loading states
- Error handling
- Smooth animations

---

## 🚀 Usage Examples

### Create a New Bot

1. Click **"Create Bot"** button in the header
2. Enter MS Teams meeting URL
3. (Optional) Enter passcode
4. Click **"Create Bot"**
5. Bot appears in the dashboard

### Monitor Bots

- **Dashboard auto-refreshes** every 5 seconds
- **Status colors**:
  - 🟢 Green = Active
  - 🟡 Yellow = Waiting for audio
  - 🔵 Blue = Requested
  - 🔴 Red = Failed
  - ⚫ Gray = Stopped

### Stop a Bot

1. Find active bot in the grid
2. Click **"Stop"** button
3. Status changes to stopped
4. Container is terminated

---

## 🔧 Configuration

### Environment Variables

The dashboard uses these environment variables:

```bash
# .env.local (for development)
NEXT_PUBLIC_API_URL=http://localhost:18056
NEXT_PUBLIC_WS_URL=ws://localhost:18056
```

### Docker Environment

In `docker-compose.yml`:

```yaml
react-dashboard:
  environment:
    - NEXT_PUBLIC_API_URL=http://localhost:18056
    - NEXT_PUBLIC_WS_URL=ws://localhost:18056
```

### Change API URL

To connect to a different API:

```bash
# Edit .env.local
NEXT_PUBLIC_API_URL=http://your-api-server:port
```

---

## 🐛 Troubleshooting

### Dashboard Won't Start

```bash
# Check if port 3000 is available
lsof -i :3000

# Stop conflicting process
kill -9 <PID>

# Restart dashboard
docker-compose restart react-dashboard
```

### Can't Connect to API

```bash
# Check API is running
curl http://localhost:18056/health

# Check API gateway logs
docker logs vexa_dev-api-gateway-1

# Restart API gateway
docker-compose restart api-gateway
```

### Docker Build Fails

```bash
# Clean build
cd /root/vexa/services/react-dashboard
rm -rf .next node_modules
npm install
npm run build

# Rebuild Docker image
docker-compose build react-dashboard
docker-compose up -d react-dashboard
```

### Dashboard Shows "Failed to connect"

1. Verify API is running: `curl http://localhost:18056/health`
2. Check CORS settings in API gateway
3. Verify environment variables are correct
4. Check browser console for errors
5. Restart both services

---

## 📊 Architecture Overview

```
┌─────────────────────────┐
│   Browser (Port 3000)   │
│   React Dashboard       │
└───────────┬─────────────┘
            │
            ↓ HTTP/REST
┌─────────────────────────┐
│   API Gateway (18056)   │
│   FastAPI               │
└───────────┬─────────────┘
            │
       ┌────┴────┬───────────┬──────────┐
       ↓         ↓           ↓          ↓
   ┌────────┐ ┌──────┐  ┌──────┐  ┌─────────┐
   │  Bot   │ │Trans-│  │Redis │  │Postgres │
   │Manager │ │cribe │  │      │  │         │
   └────────┘ └──────┘  └──────┘  └─────────┘
```

---

## 🎯 Next Development Steps

### Phase 2B: Core Features (This Week)

1. **Bot Detail Page**
   ```bash
   # Create: app/bots/[id]/page.tsx
   # Features: Full transcript, container info, metrics
   ```

2. **Real-Time Updates**
   ```bash
   # Add: lib/websocket.ts
   # Features: Live status updates, transcript streaming
   ```

3. **Export Functionality**
   ```bash
   # Add: components/bots/ExportMenu.tsx
   # Features: PDF, CSV, JSON, TXT export
   ```

### Phase 2C: Advanced Features (Next Week)

4. **Analytics Dashboard**
   ```bash
   # Create: app/analytics/page.tsx
   # Features: Charts, history, statistics
   ```

5. **Container Management**
   ```bash
   # Create: app/containers/page.tsx
   # Features: Monitor, control, cleanup containers
   ```

---

## 📝 Development Workflow

### Adding a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
cd /root/vexa/services/react-dashboard
# Edit files...

# 3. Test locally
npm run dev

# 4. Build
npm run build

# 5. Test Docker
docker-compose build react-dashboard
docker-compose up -d react-dashboard

# 6. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

### Hot Reload in Development

```bash
# Start dev server
cd /root/vexa/services/react-dashboard
npm run dev

# Changes auto-reload at http://localhost:3000
# Edit any file in app/ or components/
```

---

## 🎨 Customization

### Change Theme Colors

Edit `app/globals.css`:

```css
:root {
  --primary: 220 90% 56%;     /* Blue */
  --success: 142 76% 36%;     /* Green */
  --warning: 38 92% 50%;      /* Yellow */
  --destructive: 0 84% 60%;   /* Red */
}
```

### Add New Components

```bash
# Use shadcn CLI
cd /root/vexa/services/react-dashboard
npx shadcn@latest add [component-name]

# Example: Add toast notifications
npx shadcn@latest add toast
```

### Modify Auto-Refresh

Edit `app/providers.tsx`:

```typescript
refetchInterval: 5 * 1000, // Change to desired milliseconds
```

---

## 📚 Documentation

### Project Documentation
- `/root/vexa/REACT_DASHBOARD_PHASE2.md` - Complete implementation
- `/root/vexa/PROFESSIONAL_DASHBOARD_ROADMAP.md` - Long-term plan
- `/root/vexa/services/react-dashboard/README.md` - Quick reference

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🎉 Success Checklist

Before considering Phase 2A complete, verify:

- [ ] Dashboard accessible at http://localhost:3000
- [ ] API connection working (no red error banner)
- [ ] All 4 stat cards displaying correctly
- [ ] Bot list showing existing bots
- [ ] Create bot dialog opens and works
- [ ] Stop button works on active bots
- [ ] View button opens (even if page not ready)
- [ ] Auto-refresh working (stats update)
- [ ] Loading states show properly
- [ ] No console errors
- [ ] Docker container running stable
- [ ] All services integrated properly

---

## 🚨 Important Notes

### Port Allocation
- **3000**: React Dashboard (Next.js)
- **8501**: Streamlit Dashboard
- **18056**: API Gateway
- **18057**: Admin API
- **9090**: WhisperLive
- **18123**: Transcription Collector

### Both Dashboards Can Run Together
- Streamlit: Feature-complete, working dashboard
- React: New, modern, professional dashboard
- Both connect to same API
- Use either or both as needed

### Migration Strategy
1. Phase 2A-2C: Build React features
2. Phase 2D: Test and polish
3. Gradual migration: Move users from Streamlit to React
4. Eventually: Deprecate Streamlit (optional)

---

## 💡 Pro Tips

1. **Use Dev Mode** for fast iteration
   ```bash
   npm run dev  # Changes reload instantly
   ```

2. **Check Docker Logs** for debugging
   ```bash
   docker logs -f vexa_dev-react-dashboard-1
   ```

3. **Use React Query DevTools** (in development)
   - Already configured
   - Shows in dev mode
   - Helps debug API calls

4. **TypeScript Autocomplete**
   - All types defined in `lib/api.ts`
   - Full IntelliSense support
   - Catches errors at compile time

---

## 📞 Support

### Common Commands

```bash
# Start dashboard
docker-compose up -d react-dashboard

# Stop dashboard
docker-compose stop react-dashboard

# View logs
docker logs -f vexa_dev-react-dashboard-1

# Rebuild
docker-compose build react-dashboard

# Development mode
cd services/react-dashboard && npm run dev

# Check build
npm run build
```

### Getting Help

1. Check logs: `docker logs vexa_dev-react-dashboard-1`
2. Check API: `curl http://localhost:18056/health`
3. Review documentation in `/root/vexa/`
4. Check browser console for client errors

---

## 🎊 Congratulations!

You now have a professional React dashboard running! 🎉

**Current Status:**
- ✅ Foundation Complete (Phase 2A)
- 📅 Core Features Next (Phase 2B)
- 🚀 Advanced Features Following (Phase 2C)

**Access Your Dashboard:**
- React: http://localhost:3000
- Streamlit: http://localhost:8501
- API: http://localhost:18056

---

**Last Updated:** October 24, 2025  
**Version:** 1.0.0  
**Status:** 🚀 Ready to Use!
