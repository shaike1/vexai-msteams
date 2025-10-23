# Audio Transcription Fix - 2025-10-23

## Problem Summary
The bot was joining MS Teams meetings and detecting speaker activity, but transcriptions were not being saved to the database. The dashboard showed "waiting for audio" status even though audio was being processed.

## Root Causes Identified

### 1. Wrong Meeting ID Sent to WhisperLive
**File:** `/root/vexa/services/vexa-bot/core/src/platforms/msteams/recording.ts` (Line 57)
- **Issue:** Bot was sending the database `meeting_id` (e.g., 112) instead of the `nativeMeetingId` (e.g., "3497739383599") to WhisperLive
- **Impact:** WhisperLive received the wrong meeting identifier, causing transcription association failures

**Fix Applied:**
```typescript
// BEFORE:
meeting_id: (botConfig as any).meeting_id || "unknown"

// AFTER:
meeting_id: botConfig.nativeMeetingId || "unknown"
```

### 2. Type Mismatch in Transcription Collector
**File:** `/root/vexa/services/transcription-collector/streaming/processors.py` (Line 120-131)
- **Issue:** The `native_meeting_id` from Redis messages was being compared as an integer, but the database field `platform_specific_id` is VARCHAR
- **Impact:** Database queries failed with "operator does not exist: character varying = integer" error

**Fix Applied:**
```python
# Added string conversion after extracting meeting_id
native_meeting_id = stream_data.get('meeting_id')
# ... validation ...
native_meeting_id = str(native_meeting_id)  # Convert to string to match DB VARCHAR type
```

## Services Rebuilt
1. **vexa-meeting-bot** - Rebuilt with correct nativeMeetingId usage
2. **transcription-collector** - Rebuilt with type conversion fix

## Testing Steps
1. Stop all existing bot containers: `docker ps --filter "name=vexa-bot" -q | xargs docker stop`
2. Start a new bot via the dashboard (http://localhost:8501)
3. Verify in bot logs that it sends the correct meeting_id format
4. Verify transcriptions appear in the dashboard

## Expected Behavior
- Bot sends native meeting ID (e.g., "3497739383599") to WhisperLive
- WhisperLive processes transcriptions with correct meeting identifier
- Transcription collector successfully looks up meetings in database
- Transcriptions are saved and displayed in dashboard

## Commands to Verify Fix
```bash
# Check bot is sending correct meeting_id
docker logs <bot-container-id> 2>&1 | grep "Sending config"

# Check transcription collector is processing messages
docker logs vexa_dev-transcription-collector-1 --tail 50

# Check WhisperLive is receiving transcriptions
docker logs vexa_dev-whisperlive-1 --tail 50 | grep transcription
```

## Related Files Modified
- `/root/vexa/services/vexa-bot/core/src/platforms/msteams/recording.ts`
- `/root/vexa/services/transcription-collector/streaming/processors.py`
