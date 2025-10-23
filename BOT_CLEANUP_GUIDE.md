# 🧹 Bot Cleanup Guide

**Date:** October 23, 2025  
**Action:** Cleaned up all running bots

---

## ✅ What Was Cleaned

### 1. Docker Containers
- Stopped all running bot containers
- Removed container instances
- Freed up system resources

### 2. Database Records
- Deleted all bot records from PostgreSQL
- Cleaned up meeting associations
- Reset bot counter

---

## 🔧 Cleanup Commands Used

### Stop All Bot Containers:
```bash
docker ps -a --filter "name=bot-" -q | xargs docker rm -f
```

### Delete All Bot Records:
```bash
# Via API
for bot_id in $(curl -s http://localhost:18056/bots -H "X-API-Key: token" | jq '.[].id'); do
  curl -X DELETE http://localhost:18056/bots/$bot_id -H "X-API-Key: token"
done
```

---

## 🎯 When to Clean Up Bots

### Reasons to Clean Up:
1. **Dashboard Not Syncing** - Old bots created before dashboard
2. **Testing Complete** - Remove test bots
3. **Stuck Bots** - Bots in waiting/failed state
4. **Fresh Start** - Clean slate for new deployment
5. **Resource Management** - Free up Docker resources

---

## 🚀 How to Clean Up Bots (Manual)

### Option 1: Via Dashboard (Recommended)
1. Open http://localhost:8501
2. Go to "📋 Bots" tab
3. Click "🗑️ Stop" on each bot
4. Dashboard auto-refreshes

### Option 2: Via API
```bash
# List all bots
curl http://localhost:18056/bots -H "X-API-Key: token"

# Delete specific bot
curl -X DELETE http://localhost:18056/bots/107 -H "X-API-Key: token"
```

### Option 3: Via Docker (Nuclear Option)
```bash
# Stop all bot containers
docker stop $(docker ps --filter "name=bot-" -q)

# Remove all bot containers
docker rm $(docker ps -a --filter "name=bot-" -q)
```

### Option 4: Database Direct (Last Resort)
```bash
# Connect to PostgreSQL
docker exec -it vexa_dev-postgres-1 psql -U postgres -d vexa

# Delete all bots
DELETE FROM bots;
```

---

## 🔍 Verification Commands

### Check Running Bots:
```bash
# Docker containers
docker ps --filter "name=bot-"

# Database records
curl http://localhost:18056/bots -H "X-API-Key: token" | jq 'length'

# Dashboard view
# Open http://localhost:8501 and check "Bots" tab
```

---

## ⚠️ Important Notes

### Before Cleanup:
- ✅ Save any important transcripts
- ✅ Note down bot IDs if needed
- ✅ Check if any bots are in active meetings
- ✅ Warn users if bots are being used

### After Cleanup:
- ✅ Verify dashboard shows 0 bots
- ✅ Check Docker for orphaned containers
- ✅ Test creating new bot
- ✅ Confirm API is responding

---

## 🎨 Cleanup Script

Create a reusable cleanup script:

```bash
#!/bin/bash
# cleanup-bots.sh

echo "🧹 Cleaning up all Vexa bots..."

# Stop containers
echo "🐳 Stopping Docker containers..."
docker ps -a --filter "name=bot-" -q | xargs -r docker rm -f

# Delete API records
echo "🗄️ Deleting database records..."
for id in $(curl -s http://localhost:18056/bots -H "X-API-Key: token" | jq -r '.[].id'); do
  curl -s -X DELETE http://localhost:18056/bots/$id -H "X-API-Key: token"
done

echo "✅ Cleanup complete!"
echo "🔗 Check dashboard: http://localhost:8501"
```

**Usage:**
```bash
chmod +x cleanup-bots.sh
./cleanup-bots.sh
```

---

## 🎯 Best Practices

### Regular Cleanup:
1. **Daily:** Clean up completed bots (older than 24h)
2. **Weekly:** Full cleanup of all old records
3. **Monthly:** Database vacuum and optimization

### Automated Cleanup:
```bash
# Cron job - daily at 2 AM
0 2 * * * /path/to/cleanup-bots.sh

# Or use bot-manager's built-in cleanup (if available)
```

### Monitoring:
- Set alerts for >10 bots running
- Monitor Docker resource usage
- Track database size growth

---

## 🐛 Troubleshooting

### Bot Won't Stop:
```bash
# Force kill container
docker kill bot-XXXXX

# Force remove
docker rm -f bot-XXXXX
```

### Database Record Won't Delete:
```bash
# Check for foreign key constraints
# Direct database access may be needed
```

### Orphaned Containers:
```bash
# List all stopped bot containers
docker ps -a --filter "name=bot-" --filter "status=exited"

# Remove all stopped
docker container prune -f
```

---

## 📊 Current Status (After Cleanup)

**Timestamp:** October 23, 2025, 13:22 UTC

**Before Cleanup:**
- Docker Containers: Multiple running
- Database Records: Old bots from pre-dashboard era
- Dashboard: Not showing bots correctly

**After Cleanup:**
- ✅ Docker Containers: 0 bot containers
- ✅ Database Records: 0 bots
- ✅ Dashboard: Clean slate, ready for new bots
- ✅ Resources: Freed up

---

## 🚀 Next Steps

1. ✅ Refresh dashboard: http://localhost:8501
2. ✅ Verify "Total Bots: 0" in sidebar
3. ✅ Deploy test bot via dashboard
4. ✅ Verify new bot appears correctly
5. ✅ Test transcript viewing

---

**Cleanup Complete!** 🎉  
**Dashboard:** http://localhost:8501  
**Status:** Ready for fresh bots
