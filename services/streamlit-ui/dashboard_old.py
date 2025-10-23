import streamlit as st
import requests
import pandas as pd
from datetime import datetime
import time

# Configuration
import os
API_URL = os.getenv("API_URL", "http://localhost:18056")
API_KEY = os.getenv("API_KEY", "token")

st.set_page_config(page_title="Vexa Bot Manager", page_icon="🤖", layout="wide")

# Custom CSS
st.markdown("""
<style>
.main-header {font-size: 2.5rem; font-weight: bold; color: #0ea5e9;}
.stat-card {background-color: #f8f9fa; padding: 1.5rem; border-radius: 0.5rem;}
</style>
""", unsafe_allow_html=True)

def get_bots():
    try:
        r = requests.get(f"{API_URL}/bots", headers={"X-API-Key": API_KEY}, timeout=5)
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

def parse_meeting_url(url):
    """Parse meeting URL to extract ID and passcode"""
    import re
    result = {"meeting_id": "", "passcode": "", "platform": "teams"}
    
    if not url:
        return result
    
    # Microsoft Teams
    if "teams.microsoft.com" in url or "teams.live.com" in url:
        result["platform"] = "teams"
        # Extract meeting ID: meet/XXXXXXX
        match = re.search(r'meet/([^/?]+)', url)
        if match:
            result["meeting_id"] = match.group(1)
        # Extract passcode: ?p=XXXXX or &p=XXXXX
        match = re.search(r'[?&]p=([^&]+)', url)
        if match:
            result["passcode"] = match.group(1)
    
    # Google Meet
    elif "meet.google.com" in url:
        result["platform"] = "meet"
        # Extract meeting code: meet.google.com/xxx-yyyy-zzz
        match = re.search(r'meet\.google\.com/([a-z\-]+)', url)
        if match:
            result["meeting_id"] = match.group(1)
    
    # Zoom
    elif "zoom.us" in url:
        result["platform"] = "zoom"
        # Extract meeting ID: /j/XXXXXXXXXX
        match = re.search(r'/j/(\d+)', url)
        if match:
            result["meeting_id"] = match.group(1)
        # Extract passcode: pwd=XXXXX
        match = re.search(r'pwd=([^&]+)', url)
        if match:
            result["passcode"] = match.group(1)
    
    return result

# Main app
st.markdown('<p class="main-header">🤖 Vexa Bot Manager</p>', unsafe_allow_html=True)
st.markdown("Manage and monitor your meeting transcription bots")

# Sidebar
with st.sidebar:
    st.header("⚙️ Settings")
    auto_refresh = st.checkbox("Auto-refresh", value=True)
    refresh_interval = st.slider("Refresh interval (seconds)", 3, 30, 5)
    st.markdown("---")
    bots = get_bots()
    st.metric("Total Bots", len(bots))
    st.metric("Active", len([b for b in bots if b.get('status')=='active']))
    st.metric("Waiting", len([b for b in bots if b.get('status')=='awaiting_admission']))
    if st.button("🔄 Refresh"): st.rerun()

tab1, tab2, tab3 = st.tabs(["📋 Active Bots", "➕ Deploy New Bot", "📊 Analytics"])

with tab1:
    st.subheader("Active Bots")
    bots = get_bots()
    if not bots:
        st.info("No bots running. Deploy your first bot!")
    else:
        for bot in bots:
            col1, col2, col3 = st.columns([3,2,1])
            with col1:
                st.markdown(f"### {get_platform_emoji(bot.get('platform',''))} Bot #{bot.get('id')} {get_status_emoji(bot.get('status',''))}")
                st.write(f"**Meeting:** {bot.get('native_meeting_id','N/A')}")
                st.write(f"**Platform:** {bot.get('platform','N/A').upper()}")
                st.write(f"**Status:** {bot.get('status','N/A').replace('_',' ').title()}")
            with col2:
                st.write(f"**Created:** {bot.get('created_at','N/A')[:19]}")
            with col3:
                if st.button("🗑️ Stop", key=f"del_{bot.get('id')}"):
                    if delete_bot(bot.get('id')):
                        st.success("Bot stopped!")
                        time.sleep(1)
                        st.rerun()
            st.markdown("---")

with tab2:
    st.subheader("Deploy New Bot")
    
    # URL Parser section
    st.markdown("### 🔗 Quick Deploy from URL")
    meeting_url = st.text_input(
        "Paste Meeting URL",
        placeholder="https://teams.microsoft.com/meet/3497739383599?p=E7e29fVOQEF3hOZqWF",
        help="Paste the full meeting URL and we'll extract the details automatically"
    )
    
    # Parse URL if provided
    parsed = parse_meeting_url(meeting_url)
    
    # Show parsed info if URL was provided
    if meeting_url and parsed["meeting_id"]:
        st.success(f"✅ Detected {parsed['platform'].upper()} meeting!")
        col1, col2, col3 = st.columns(3)
        col1.metric("Platform", parsed["platform"].upper())
        col2.metric("Meeting ID", parsed["meeting_id"][:15] + "..." if len(parsed["meeting_id"]) > 15 else parsed["meeting_id"])
        if parsed["passcode"]:
            col3.metric("Passcode", "🔐 Found")
        else:
            col3.metric("Passcode", "None")
    
    st.markdown("---")
    st.markdown("### 📝 Or Enter Details Manually")
    
    with st.form("new_bot"):
        col1, col2 = st.columns(2)
        with col1:
            platform = st.selectbox(
                "Platform", 
                ["teams","meet","zoom"],
                index=["teams","meet","zoom"].index(parsed["platform"]) if parsed["platform"] in ["teams","meet","zoom"] else 0
            )
            meeting_id = st.text_input(
                "Meeting ID", 
                value=parsed["meeting_id"],
                placeholder="3497739383599"
            )
        with col2:
            passcode = st.text_input(
                "Passcode (optional)", 
                value=parsed["passcode"],
                type="password"
            )
            bot_name = st.text_input("Bot Name", value="Vexa Bot")
        
        st.markdown("---")
        submit = st.form_submit_button("🚀 Deploy Bot", type="primary", use_container_width=True)
        
        if submit and meeting_id:
            with st.spinner("Deploying bot..."):
                success, result = create_bot(platform, meeting_id, passcode, bot_name)
                if success:
                    st.success(f"✅ Bot {result.get('id')} deployed successfully!")
                    st.balloons()
                    time.sleep(2)
                    st.rerun()
                else:
                    st.error(f"❌ Failed: {result}")

with tab3:
    st.subheader("📊 Analytics")
    bots = get_bots()
    col1,col2,col3,col4 = st.columns(4)
    col1.metric("Total", len(bots))
    col2.metric("Active", len([b for b in bots if b.get('status')=='active']))
    col3.metric("Completed", len([b for b in bots if b.get('status')=='completed']))
    col4.metric("Failed", len([b for b in bots if b.get('status')=='failed']))
    if bots:
        df = pd.DataFrame([{'ID':b.get('id'),'Platform':b.get('platform','').upper(),'Status':b.get('status','')} for b in bots])
        st.dataframe(df, use_container_width=True)

if auto_refresh:
    time.sleep(refresh_interval)
    st.rerun()
