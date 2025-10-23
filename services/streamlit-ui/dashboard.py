import streamlit as st
import requests
import pandas as pd
from datetime import datetime
import time
import os

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:18056")
API_KEY = os.getenv("API_KEY", "token")

st.set_page_config(page_title="Vexa Bot Manager Pro", page_icon="🤖", layout="wide")

# Custom CSS
st.markdown("""
<style>
.main-header {font-size: 2.5rem; font-weight: bold; color: #0ea5e9; margin-bottom: 0.5rem;}
.subtitle {color: #64748b; font-size: 1.1rem; margin-bottom: 2rem;}
.stat-card {background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 0.5rem; color: white;}
</style>
""", unsafe_allow_html=True)

def check_api_connection():
    try:
        r = requests.get(f"{API_URL}/bots/status", headers={"X-API-Key": API_KEY}, timeout=2)
        return r.status_code == 200
    except: return False

def get_bots():
    try:
        r = requests.get(f"{API_URL}/bots/status", headers={"X-API-Key": API_KEY}, timeout=5)
        if r.status_code == 200:
            data = r.json()
            bots = []
            for bot in data.get('running_bots', []):
                bots.append({
                    'id': int(bot.get('meeting_id_from_name', 0)) if bot.get('meeting_id_from_name') else 0,
                    'platform': bot.get('platform', ''),
                    'native_meeting_id': bot.get('native_meeting_id', ''),
                    'status': 'active' if bot.get('normalized_status') == 'Up' else 'unknown',
                    'container_id': bot.get('container_id', ''),
                    'created_at': bot.get('created_at', ''),
                    'container_name': bot.get('container_name', '')
                })
            return bots
        return []
    except Exception as e:
        st.error(f"⚠️ API Error: {str(e)}")
        return []

def get_transcriptions(meeting_id):
    try:
        r = requests.get(f"{API_URL}/meetings/{meeting_id}/transcriptions", headers={"X-API-Key": API_KEY}, timeout=5)
        return r.json() if r.status_code == 200 else []
    except: return []

def create_bot(platform, meeting_id, passcode, bot_name):
    try:
        payload = {"platform": platform, "native_meeting_id": meeting_id, "bot_name": bot_name}
        if passcode: payload["passcode"] = passcode
        r = requests.post(f"{API_URL}/bots", headers={"X-API-Key": API_KEY, "Content-Type": "application/json"}, json=payload, timeout=10)
        return r.status_code == 200, r.json() if r.status_code == 200 else r.text
    except Exception as e: return False, str(e)

def delete_bot(bot_id):
    try:
        r = requests.delete(f"{API_URL}/bots/{bot_id}", headers={"X-API-Key": API_KEY}, timeout=5)
        return r.status_code in [200, 204]
    except: return False

def get_status_emoji(status):
    return {"requested":"🔵","joining":"🔄","awaiting_admission":"🟡","active":"🟢","completed":"⚫","failed":"🔴"}.get(status,"⚪")

def get_platform_emoji(platform):
    return {"teams":"👥","meet":"📹","zoom":"🎥"}.get(platform,"🤖")

def format_duration(start_time):
    if not start_time: return "0:00"
    try:
        start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        now = datetime.now(start.tzinfo)
        diff = int((now - start).total_seconds())
        h, m, s = diff // 3600, (diff % 3600) // 60, diff % 60
        return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"
    except: return "N/A"

def parse_meeting_url(url):
    import re
    result = {"meeting_id": "", "passcode": "", "platform": "teams"}
    if not url: return result
    if "teams.microsoft.com" in url or "teams.live.com" in url:
        result["platform"] = "teams"
        m = re.search(r'meet/([^/?]+)', url)
        if m: result["meeting_id"] = m.group(1)
        m = re.search(r'[?&]p=([^&]+)', url)
        if m: result["passcode"] = m.group(1)
    elif "meet.google.com" in url:
        result["platform"] = "meet"
        m = re.search(r'meet\.google\.com/([a-z\-]+)', url)
        if m: result["meeting_id"] = m.group(1)
    elif "zoom.us" in url:
        result["platform"] = "zoom"
        m = re.search(r'/j/(\d+)', url)
        if m: result["meeting_id"] = m.group(1)
        m = re.search(r'pwd=([^&]+)', url)
        if m: result["passcode"] = m.group(1)
    return result

# Header
st.markdown('<p class="main-header">🤖 Vexa Bot Manager Pro</p>', unsafe_allow_html=True)
st.markdown('<p class="subtitle">Professional meeting transcription management</p>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("⚙️ Control Panel")
    
    # Connection Status
    st.markdown("### 🔌 Status")
    if check_api_connection():
        st.success("🟢 Connected")
    else:
        st.error("🔴 Offline")
    
    st.markdown("---")
    auto_refresh = st.checkbox("Auto-refresh", value=True)
    refresh_interval = st.slider("Interval (sec)", 3, 30, 5)
    
    st.markdown("---")
    st.markdown("### 📊 Quick Stats")
    bots = get_bots()
    col1, col2 = st.columns(2)
    col1.metric("Total", len(bots))
    col1.metric("Active", len([b for b in bots if b.get('status')=='active']), delta=f"+{len([b for b in bots if b.get('status')=='active'])}" if len([b for b in bots if b.get('status')=='active']) > 0 else None)
    col2.metric("Waiting", len([b for b in bots if b.get('status')=='awaiting_admission']))
    col2.metric("Failed", len([b for b in bots if b.get('status')=='failed']), delta=f"-{len([b for b in bots if b.get('status')=='failed'])}" if len([b for b in bots if b.get('status')=='failed']) > 0 else None, delta_color="inverse")
    
    st.markdown("---")
    if st.button("🔄 Refresh", use_container_width=True):
        st.rerun()
    
    st.markdown("---")
    st.caption(f"⏰ {datetime.now().strftime('%H:%M:%S')}")
    st.caption(f"🔗 {API_URL.split('//')[1]}")

# Tabs
tab1, tab2, tab3, tab4 = st.tabs(["📋 Bots", "➕ Deploy", "📝 Transcripts", "📊 Analytics"])

# Tab 1: Bots
with tab1:
    st.subheader("Active Bots")
    bots = get_bots()
    
    if not bots:
        st.info("💡 No bots yet. Use the 'Deploy' tab to create one!")
    else:
        filter_status = st.multiselect("Filter", ["active","awaiting_admission","joining","requested","completed","failed"], default=["active","awaiting_admission"])
        filtered = [b for b in bots if b.get('status') in filter_status] if filter_status else bots
        
        for bot in filtered:
            with st.container():
                col1, col2, col3 = st.columns([3,2,1])
                status = bot.get('status','unknown')
                
                with col1:
                    st.markdown(f"### {get_platform_emoji(bot.get('platform',''))} Bot #{bot.get('id')} {get_status_emoji(status)}")
                    st.write(f"**Meeting:** {bot.get('native_meeting_id','N/A')}")
                    st.write(f"**Platform:** {bot.get('platform','N/A').upper()}")
                    st.write(f"**Status:** {status.replace('_',' ').title()}")
                    
                    if status == 'active' and bot.get('start_time'):
                        dur = format_duration(bot.get('start_time'))
                        st.progress(min(int(dur.split(':')[0] if ':' in dur else 0) / 60, 1.0))
                        st.caption(f"⏱️ Running: {dur}")
                
                with col2:
                    if bot.get('start_time'):
                        st.write(f"⏱️ **Duration:** {format_duration(bot.get('start_time'))}")
                    st.write(f"📅 **Created:** {bot.get('created_at','N/A')[:16]}")
                    if status == 'active':
                        st.caption("💬 Transcribing...")
                
                with col3:
                    st.write("")
                    if st.button("📝 View", key=f"view_{bot.get('id')}", use_container_width=True):
                        st.session_state['view_bot'] = bot.get('id')
                        st.info("→ Go to Transcripts tab")
                    if st.button("🗑️ Stop", key=f"del_{bot.get('id')}", type="secondary", use_container_width=True):
                        if delete_bot(bot.get('id')):
                            st.success("✅ Stopped!")
                            time.sleep(1)
                            st.rerun()
                st.markdown("---")

# Tab 2: Deploy
with tab2:
    st.subheader("Deploy New Bot")
    st.markdown("### 🔗 Quick Deploy")
    url = st.text_input("Paste Meeting URL", placeholder="https://teams.microsoft.com/meet/123?p=abc", help="Supports Teams, Meet, Zoom")
    parsed = parse_meeting_url(url)
    
    if url and parsed["meeting_id"]:
        st.success(f"✅ Detected {parsed['platform'].upper()}!")
        c1,c2,c3 = st.columns(3)
        c1.metric("Platform", parsed["platform"].upper())
        c2.metric("ID", parsed["meeting_id"][:12]+"...")
        c3.metric("Pass", "🔐 Yes" if parsed["passcode"] else "No")
    
    st.markdown("---")
    st.markdown("### 📝 Manual Entry")
    
    with st.form("deploy"):
        c1,c2 = st.columns(2)
        platform = c1.selectbox("Platform", ["teams","meet","zoom"], index=["teams","meet","zoom"].index(parsed["platform"]) if parsed["platform"] in ["teams","meet","zoom"] else 0)
        meeting_id = c1.text_input("Meeting ID", value=parsed["meeting_id"], placeholder="3497739383599")
        passcode = c2.text_input("Passcode", value=parsed["passcode"], type="password")
        bot_name = c2.text_input("Bot Name", value="Vexa Bot")
        
        if st.form_submit_button("🚀 Deploy Bot", type="primary", use_container_width=True):
            if meeting_id:
                with st.spinner("Deploying..."):
                    ok, res = create_bot(platform, meeting_id, passcode, bot_name)
                    if ok:
                        st.success(f"✅ Bot #{res.get('id')} deployed!")
                        st.balloons()
                        time.sleep(2)
                        st.rerun()
                    else:
                        st.error(f"❌ {res}")

# Tab 3: Transcripts
with tab3:
    st.subheader("📝 Live Transcripts")
    bots = get_bots()
    active = [b for b in bots if b.get('status')=='active']
    
    if not active:
        st.info("No active bots. Deploy one first!")
    else:
        sel = st.selectbox("Select Bot", [b.get('id') for b in active], format_func=lambda x: f"Bot #{x} - {next((b.get('native_meeting_id') for b in active if b.get('id')==x), 'N/A')}")
        
        if sel:
            bot = next((b for b in active if b.get('id')==sel), None)
            if bot:
                c1,c2,c3 = st.columns(3)
                c1.metric("Platform", bot.get('platform','').upper())
                c2.metric("Duration", format_duration(bot.get('start_time')))
                c3.metric("Status", "🟢 Active")
                
                st.markdown("---")
                trans = get_transcriptions(sel)
                
                if trans:
                    st.success(f"📝 {len(trans)} segments")
                    if st.button("⬇️ Download"):
                        txt = "\n\n".join([f"[{t.get('start_time')}] {t.get('text')}" for t in trans])
                        st.download_button("📄 Download TXT", txt, f"transcript_{sel}.txt", "text/plain")
                    
                    st.markdown("---")
                    st.markdown("### 💬 Feed")
                    for i,t in enumerate(reversed(trans[-50:])):
                        with st.chat_message("assistant"):
                            st.markdown(f"**Segment {i+1}**")
                            st.write(t.get('text','N/A'))
                            st.caption(f"{t.get('start_time')} · {t.get('language','en')}")
                else:
                    st.info("Waiting for audio...")

# Tab 4: Analytics
with tab4:
    st.subheader("📊 Analytics")
    bots = get_bots()
    
    if not bots:
        st.info("No data yet")
    else:
        c1,c2,c3,c4 = st.columns(4)
        c1.metric("Total", len(bots))
        c2.metric("Active", len([b for b in bots if b.get('status')=='active']))
        c3.metric("Done", len([b for b in bots if b.get('status')=='completed']))
        c4.metric("Failed", len([b for b in bots if b.get('status')=='failed']))
        
        st.markdown("---")
        platforms = {}
        for b in bots:
            p = b.get('platform','unknown')
            platforms[p] = platforms.get(p,0)+1
        if platforms:
            st.subheader("Platform Distribution")
            st.bar_chart(pd.DataFrame(list(platforms.items()), columns=['Platform','Count']).set_index('Platform'))
        
        statuses = {}
        for b in bots:
            s = b.get('status','unknown')
            statuses[s] = statuses.get(s,0)+1
        if statuses:
            st.subheader("Status Distribution")
            st.bar_chart(pd.DataFrame(list(statuses.items()), columns=['Status','Count']).set_index('Status'))
        
        st.subheader("Recent Bots")
        df = pd.DataFrame([{'ID':b.get('id'),'Platform':b.get('platform','').upper(),'Status':b.get('status',''),'Created':b.get('created_at','')[:16]} for b in bots[-10:]])
        st.dataframe(df, use_container_width=True)

# Footer
st.markdown("---")
st.markdown(f"<div style='text-align:center;color:gray'><p>Vexa Bot Manager Pro v2.0 | {datetime.now().strftime('%Y-%m-%d %H:%M')}</p></div>", unsafe_allow_html=True)

if auto_refresh:
    time.sleep(refresh_interval)
    st.rerun()
