# 🎨 Vexa Dashboard - Feature Overview

**Version:** 2.1 Enhanced Professional Edition  
**Last Updated:** October 24, 2025  
**Status:** ✅ Production Ready

---

## 🚀 Quick Start

### Access Dashboard
```
URL: http://localhost:8501
```

### Dashboard Tabs
1. **📋 Bots** - Monitor and manage active bots
2. **➕ Deploy** - Create new bot sessions
3. **📝 Transcripts** - View real-time transcriptions
4. **📊 Analytics** - Usage statistics and insights
5. **📜 History** - Complete meeting history
6. **🐳 Containers** - Container management

---

## 📋 Tab 1: Bots - Active Bot Management

### Features
- ✅ Real-time bot status monitoring
- ✅ Platform indicators (Teams, Meet, Zoom)
- ✅ Status emojis (🟢 Active, 🔵 Requested, etc.)
- ✅ Duration tracking (live updates)
- ✅ Container information display
- ✅ Multi-status filtering

### Actions Available
- **📝 View** - Switch to transcripts for selected bot
- **🔍 Details** - Open detailed information modal
- **🗑️ Stop** - Terminate bot session

### Bot Detail Modal
When you click "🔍 Details", you get:
- Complete meeting information
- Container details (ID, status, health)
- Transcription statistics (segments, words, languages)
- Quick actions (view transcripts, export)
- Multi-format export (TXT, CSV, JSON, PDF)

### Filtering
Filter bots by status:
- Active
- Awaiting Admission
- Joining
- Requested
- Completed
- Failed

---

## ➕ Tab 2: Deploy - Create New Bot

### Quick Deploy (Recommended)
1. **Paste Meeting URL** directly
   - Supports: Teams, Meet, Zoom
   - Auto-detects platform and credentials
   - Shows parsed information

2. **Click Deploy**
   - Bot deploys in seconds
   - Success message with bot ID
   - Celebration animation 🎈

### Manual Entry
For custom configurations:
- **Platform:** teams/meet/zoom
- **Meeting ID:** The meeting identifier
- **Passcode:** Optional meeting password
- **Bot Name:** Custom bot name (default: Vexa Bot)

### Supported Platforms

#### Microsoft Teams
```
URL Format: https://teams.microsoft.com/meet/[ID]?p=[passcode]
Example: https://teams.microsoft.com/meet/3497739383599?p=E7e29fVOQEF3hOZqWF
```

#### Google Meet
```
URL Format: https://meet.google.com/[code]
Example: https://meet.google.com/abc-defg-hij
```

#### Zoom
```
URL Format: https://zoom.us/j/[ID]?pwd=[password]
Example: https://zoom.us/j/1234567890?pwd=abcdef
```

---

## 📝 Tab 3: Transcripts - Real-Time Viewer

### Features

#### Live Transcript Feed
- ✅ Chat-style bubbles (professional appearance)
- ✅ Segment numbering
- ✅ Timestamps for each segment
- ✅ Language detection (displayed per segment)
- ✅ Auto-scroll toggle
- ✅ Last 100 segments shown (performance optimized)
- ✅ Real-time updates

#### Search Functionality
- **Full-text search** across all transcripts
- **Case-insensitive** matching
- **Highlighting** of search terms
- **Result count** display
- **Real-time filtering**

#### Bot Selector
- Dropdown showing all active bots
- Format: `Bot #[ID] - [Meeting ID]`
- Quick switching between bots

#### Status Indicators
Shows current bot status:
- 🟢 **Active** - Transcribing
- 🔄 **Joining** - Entering meeting
- 🟡 **Awaiting Admission** - Waiting to be admitted
- ⏳ **Waiting for Audio** - In meeting, no audio yet

### Export Options

Choose from 4 formats:

#### 📄 TXT - Plain Text
```
Vexa Transcript Export
============================================================

Meeting ID: 3497739383599
Platform: TEAMS
Date: 2025-10-23 14:00:00
Duration: 15:30

[1] 2025-10-23 14:05:32
Hello everyone, welcome to the meeting.
Language: en
```

#### 📊 CSV - Structured Data
Perfect for analysis in Excel or data tools:
```csv
Timestamp,Text,Language,Segment
2025-10-23 14:05:32,"Hello everyone...",en,1
```

#### 🔧 JSON - Complete Data
Full data with metadata:
```json
{
  "meeting_info": { ... },
  "transcripts": [ ... ],
  "export_date": "2025-10-24T04:45:00"
}
```

#### 📕 PDF - Professional Document
Beautiful formatted PDF with:
- Meeting metadata
- Formatted segments
- Timestamps
- Page numbers

---

## 📊 Tab 4: Analytics - Usage Statistics

### Overview Metrics
Four key metrics cards:
- **Total** - All bots (active + completed + failed)
- **Active** - Currently running bots
- **Done** - Successfully completed bots
- **Failed** - Failed bot sessions

### Platform Distribution
Bar chart showing usage by platform:
- Teams
- Meet
- Zoom

### Status Distribution
Bar chart showing bot statuses:
- Active
- Completed
- Failed
- Other states

### Recent Bots Table
Shows last 10 bots with:
- Bot ID
- Platform
- Status
- Created timestamp

---

## 📜 Tab 5: History - Complete Meeting Archive

### Features

#### Advanced Filtering
**Platform Filter:**
- Teams
- Meet
- Zoom
- Multi-select enabled

**Status Filter:**
- Active
- Completed
- Failed
- Awaiting Admission
- Joining

**Search:**
- Search by meeting ID
- Real-time filtering

#### History Table
Complete table with columns:
- **ID** - Bot identifier
- **Platform** - With emoji indicator
- **Meeting ID** - Full meeting identifier
- **Status** - With status emoji
- **Container** - Container name (truncated)
- **Created** - Timestamp
- **Duration** - Meeting length

#### Statistics Summary
Four key metrics:
- Total Meetings
- Active Now
- Completed
- Failed

#### Export History
- Download complete history as CSV
- All columns included
- Perfect for analysis

---

## 🐳 Tab 6: Containers - Container Management

### Features

#### Container List
Expandable cards for each container showing:

**Container Details:**
- Container name
- Container ID (short and full)
- Status
- Normalized status (Up/Down)
- Created timestamp

**Meeting Details:**
- Meeting ID
- Platform
- Native meeting ID

**Labels:**
- All Vexa-specific labels
- Metadata tracking

#### Container Actions

**📋 View Logs**
- Fetch last 50 lines of container logs
- Debug issues
- Monitor activity

**⏹️ Stop Container**
- Stop running container
- Requires confirmation
- Graceful shutdown

**🗑️ Remove Container**
- Remove container completely
- Requires confirmation
- Cleanup resources

#### Bulk Operations

**⏹️ Stop All Bots**
- Stop all running containers
- Confirmation required
- Shows success count

**🗑️ Remove All Stopped**
- Cleanup stopped containers
- One-click cleanup
- Shows removed count

#### Container Statistics
- Running containers count
- Stopped containers count
- Real-time updates

---

## 🎨 Sidebar Features

### Connection Status
- 🟢 **Connected** - API accessible
- 🔴 **Offline** - API unavailable

### Auto-Refresh
- Toggle auto-refresh on/off
- Adjustable interval (3-30 seconds)
- Default: 5 seconds

### Quick Stats
Four mini metrics:
- **Total** - All bots count
- **Active** - Active bots with delta
- **Waiting** - Awaiting admission count
- **Failed** - Failed bots with inverse delta

### Manual Refresh
- 🔄 Refresh button
- Force immediate update
- Useful when auto-refresh is off

### Footer Info
- Current time
- API endpoint URL

---

## 💡 Usage Tips

### Best Practices

1. **Deploy Bots**
   - Use URL paste for fastest deployment
   - Verify meeting details before deploying
   - Watch for success confirmation

2. **Monitor Transcripts**
   - Enable auto-scroll for live meetings
   - Use search to find specific content
   - Export early and often

3. **Manage Containers**
   - Check logs if bot isn't working
   - Stop bots when meeting ends
   - Clean up stopped containers regularly

4. **Track History**
   - Use filters to find specific meetings
   - Export history for record keeping
   - Monitor success/failure rates

### Common Workflows

#### Start a New Meeting Bot
```
1. Go to "➕ Deploy" tab
2. Paste meeting URL
3. Verify auto-detected info
4. Click "🚀 Deploy Bot"
5. Wait for success message
6. Go to "📝 Transcripts" to watch
```

#### Export a Transcript
```
1. Go to "📝 Transcripts" tab
2. Select your bot
3. Choose export format (TXT/CSV/JSON/PDF)
4. Click download button
5. File downloads immediately
```

#### Find a Past Meeting
```
1. Go to "📜 History" tab
2. Filter by platform/status
3. Search for meeting ID
4. View results in table
5. Export history if needed
```

#### Troubleshoot a Bot
```
1. Go to "🐳 Containers" tab
2. Find your bot's container
3. Click "📋 View Logs"
4. Check for errors
5. Stop/restart if needed
```

---

## 🔧 Keyboard Shortcuts

### Browser Shortcuts
- **Ctrl+Shift+R** (or **Cmd+Shift+R**) - Hard refresh
- **Ctrl+F** (or **Cmd+F**) - Find in page
- **F5** - Refresh page

### Dashboard Navigation
- Use **Tab** key to navigate between inputs
- **Enter** in forms to submit
- Click tabs to switch views

---

## 🎯 Status Indicators

### Bot Status
- 🟢 **Active** - Bot is transcribing
- 🔵 **Requested** - Bot deployment requested
- 🔄 **Joining** - Bot is joining meeting
- 🟡 **Awaiting Admission** - Waiting to be admitted
- ⚫ **Completed** - Meeting finished
- 🔴 **Failed** - Bot failed to join

### Platform Icons
- 👥 **Teams** - Microsoft Teams
- 📹 **Meet** - Google Meet
- 🎥 **Zoom** - Zoom meetings

### Container Status
- ✅ **Up** - Container running
- ⏹️ **Stopped** - Container stopped
- ❌ **Failed** - Container failed

---

## 📊 Metrics Explained

### Duration Format
- **Minutes:Seconds** (e.g., 15:30)
- **Hours:Minutes:Seconds** for long meetings (e.g., 2:15:30)
- Real-time updates every 5 seconds

### Delta Indicators
- **+N** (green) - Increase is good (active bots)
- **-N** (red) - Increase is bad (failed bots)

### Segment Count
- Number of transcript segments captured
- Each segment is one speech recognition result
- Typical: 10-30 segments per minute

---

## 🚨 Troubleshooting

### Bot Not Joining
**Issue:** Bot status stuck in "Requested" or "Joining"

**Solutions:**
1. Check meeting URL is correct
2. Verify passcode if required
3. Check container logs in Containers tab
4. Ensure meeting hasn't started yet (some platforms)

### No Transcripts Showing
**Issue:** Bot is "Active" but no transcripts

**Solutions:**
1. Wait 10-20 seconds for audio detection
2. Verify someone is speaking in meeting
3. Check bot was admitted to meeting
4. Look for "Awaiting Admission" status

### Export Not Working
**Issue:** Export buttons not downloading

**Solutions:**
1. Check popup blocker
2. Ensure transcripts exist
3. Try different format
4. Refresh browser

### Dashboard Slow
**Issue:** Dashboard responding slowly

**Solutions:**
1. Reduce auto-refresh interval
2. Close unused tabs
3. Limit displayed segments (already limited to 100)
4. Restart dashboard container

---

## 🔒 Security Notes

### API Authentication
- Dashboard uses API key authentication
- Configured via `API_KEY` environment variable
- Default: "token" (change in production)

### Container Permissions
- Dashboard needs Docker socket access
- Required for container management
- Ensure proper Docker permissions

### Data Privacy
- Transcripts stored in PostgreSQL
- No external data sharing
- All processing local

---

## 🎉 Pro Tips

### Efficiency Tips
1. **Use URL paste** - Fastest deployment method
2. **Enable auto-refresh** - Stay updated automatically
3. **Filter by status** - Find bots quickly
4. **Export regularly** - Don't lose transcripts
5. **Use search** - Find content fast

### Power User Features
1. **Bulk operations** - Stop/remove multiple containers
2. **Multiple exports** - Get all formats at once
3. **Filter combinations** - Platform + Status + Search
4. **Container logs** - Debug issues instantly
5. **History export** - Track all meetings

### Hidden Features
1. **Click bot cards** - Quick navigation to transcripts
2. **Toast notifications** - Status feedback
3. **Balloons** - Celebrate successful deployments
4. **Live duration** - Real-time meeting timer
5. **Auto-detect** - Smart URL parsing

---

## 📚 Related Documentation

- [PHASE1_DASHBOARD_COMPLETE.md](./PHASE1_DASHBOARD_COMPLETE.md) - Feature details
- [PHASE1_EXECUTION_SUMMARY.md](./PHASE1_EXECUTION_SUMMARY.md) - Metrics and achievements
- [PROFESSIONAL_DASHBOARD_ROADMAP.md](./PROFESSIONAL_DASHBOARD_ROADMAP.md) - Future plans
- [DASHBOARD_DEPLOYMENT_GUIDE.md](./DASHBOARD_DEPLOYMENT_GUIDE.md) - Setup instructions
- [CONTAINER_MANAGEMENT_IMPLEMENTATION.md](./CONTAINER_MANAGEMENT_IMPLEMENTATION.md) - Container details

---

## 🆘 Get Help

### Quick Links
- **Dashboard:** http://localhost:8501
- **API Docs:** http://localhost:18056/docs
- **GitHub:** https://github.com/shaike1/vexai-msteams

### Common Questions

**Q: How long does it take for transcripts to appear?**  
A: Usually 10-20 seconds after someone starts speaking.

**Q: Can I export transcripts later?**  
A: Yes! Use the History tab to find past meetings.

**Q: What if bot won't join meeting?**  
A: Check container logs in the Containers tab for errors.

**Q: How many bots can I run simultaneously?**  
A: Limited only by system resources. Monitor container performance.

**Q: Can I customize bot name?**  
A: Yes! Enter custom name in the Deploy tab's manual entry form.

---

**Last Updated:** October 24, 2025  
**Version:** 2.1  
**Status:** ✅ Production Ready

---

*Built with ❤️ by the Vexa Team*  
*Powered by Streamlit, FastAPI, Docker, and WhisperLive*
