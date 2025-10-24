import streamlit as st
import requests
import pandas as pd
from datetime import datetime
import time
import os
import json
from io import StringIO, BytesIO
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import inch
    HAS_PDF = True
except:
    HAS_PDF = False

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
                    'container_name': bot.get('container_name', ''),
                    'container_status': bot.get('status', ''),
                    'normalized_status': bot.get('normalized_status', ''),
                    'created_at': bot.get('created_at', ''),
                    'labels': bot.get('labels', {})
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

def get_meeting_history():
    """Get historical meetings from database"""
    try:
        r = requests.get(f"{API_URL}/meetings/history", headers={"X-API-Key": API_KEY}, timeout=5)
        return r.json() if r.status_code == 200 else []
    except: return []

def export_transcript_txt(transcripts, bot_info):
    """Export transcript as TXT"""
    output = StringIO()
    output.write(f"Vexa Transcript Export\n")
    output.write(f"=" * 60 + "\n\n")
    output.write(f"Meeting ID: {bot_info.get('native_meeting_id', 'N/A')}\n")
    output.write(f"Platform: {bot_info.get('platform', 'N/A').upper()}\n")
    output.write(f"Date: {bot_info.get('created_at', 'N/A')}\n")
    output.write(f"Duration: {format_duration(bot_info.get('start_time'))}\n")
    output.write(f"\n" + "=" * 60 + "\n\n")
    
    for i, trans in enumerate(transcripts, 1):
        output.write(f"[{i}] {trans.get('start_time', 'N/A')}\n")
        output.write(f"{trans.get('text', 'N/A')}\n")
        output.write(f"Language: {trans.get('language', 'en')}\n\n")
    
    return output.getvalue()

def export_transcript_csv(transcripts, bot_info):
    """Export transcript as CSV"""
    df = pd.DataFrame([{
        'Timestamp': t.get('start_time', ''),
        'Text': t.get('text', ''),
        'Language': t.get('language', 'en'),
        'Segment': i+1
    } for i, t in enumerate(transcripts)])
    return df.to_csv(index=False)

def export_transcript_json(transcripts, bot_info):
    """Export transcript as JSON"""
    data = {
        'meeting_info': {
            'meeting_id': bot_info.get('native_meeting_id', 'N/A'),
            'platform': bot_info.get('platform', 'N/A'),
            'created_at': bot_info.get('created_at', 'N/A'),
            'duration': format_duration(bot_info.get('start_time'))
        },
        'transcripts': transcripts,
        'export_date': datetime.now().isoformat()
    }
    return json.dumps(data, indent=2)

def export_transcript_pdf(transcripts, bot_info):
    """Export transcript as PDF"""
    if not HAS_PDF:
        return None
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    story.append(Paragraph("Vexa Transcript Export", styles['Title']))
    story.append(Spacer(1, 0.2*inch))
    
    # Meeting info
    story.append(Paragraph(f"<b>Meeting ID:</b> {bot_info.get('native_meeting_id', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"<b>Platform:</b> {bot_info.get('platform', 'N/A').upper()}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {bot_info.get('created_at', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"<b>Duration:</b> {format_duration(bot_info.get('start_time'))}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Transcripts
    for i, trans in enumerate(transcripts, 1):
        story.append(Paragraph(f"<b>[{i}] {trans.get('start_time', 'N/A')}</b>", styles['Normal']))
        story.append(Paragraph(trans.get('text', 'N/A'), styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
    
    doc.build(story)
    return buffer.getvalue()

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

def stop_container(container_id):
    """Stop a container directly via Docker command (requires proper setup)"""
    try:
        import subprocess
        result = subprocess.run(['docker', 'stop', container_id], capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except: return False

def remove_container(container_id):
    """Remove a container directly via Docker command"""
    try:
        import subprocess
        result = subprocess.run(['docker', 'rm', '-f', container_id], capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except: return False

def get_container_logs(container_id, tail=100):
    """Get container logs"""
    try:
        import subprocess
        result = subprocess.run(['docker', 'logs', '--tail', str(tail), container_id], 
                              capture_output=True, text=True, timeout=5)
        return result.stdout if result.returncode == 0 else None
    except: return None

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
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["📋 Bots", "➕ Deploy", "📝 Transcripts", "📊 Analytics", "📜 History", "🐳 Containers"])

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
                    st.caption(f"🐳 Container: `{bot.get('container_name','N/A')}`")
                    st.caption(f"📦 Status: {bot.get('container_status','N/A')}")
                    
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
                    st.caption(f"🔗 ID: `{bot.get('container_id','')[:12]}`")
                
                with col3:
                    st.write("")
                    if st.button("📝 View", key=f"view_{bot.get('id')}", use_container_width=True):
                        st.session_state['view_bot'] = bot.get('id')
                        st.session_state['view_bot_data'] = bot
                        st.switch_page
                        st.toast(f"Viewing Bot #{bot.get('id')}", icon="📝")
                    if st.button("🔍 Details", key=f"detail_{bot.get('id')}", use_container_width=True):
                        st.session_state['detail_bot'] = bot
                    if st.button("🗑️ Stop", key=f"del_{bot.get('id')}", type="secondary", use_container_width=True):
                        with st.spinner("Stopping bot..."):
                            if delete_bot(bot.get('id')):
                                st.toast("✅ Bot stopped successfully!", icon="✅")
                                time.sleep(1)
                                st.rerun()
                            else:
                                st.toast("❌ Failed to stop bot", icon="❌")
                st.markdown("---")
        
        # Bot detail modal
        if 'detail_bot' in st.session_state and st.session_state.get('detail_bot'):
            bot = st.session_state['detail_bot']
            with st.expander(f"🔍 Bot #{bot.get('id')} - Full Details", expanded=True):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("### 📊 Meeting Information")
                    st.write(f"**Bot ID:** #{bot.get('id')}")
                    st.write(f"**Platform:** {get_platform_emoji(bot.get('platform', ''))} {bot.get('platform', 'N/A').upper()}")
                    st.write(f"**Meeting ID:** {bot.get('native_meeting_id', 'N/A')}")
                    st.write(f"**Status:** {get_status_emoji(bot.get('status', ''))} {bot.get('status', 'N/A').title()}")
                    st.write(f"**Created:** {bot.get('created_at', 'N/A')[:19]}")
                    if bot.get('start_time'):
                        st.write(f"**Duration:** {format_duration(bot.get('start_time'))}")
                    
                    st.markdown("### 🐳 Container Information")
                    st.write(f"**Container Name:** `{bot.get('container_name', 'N/A')}`")
                    st.write(f"**Container ID:** `{bot.get('container_id', 'N/A')[:12]}...`")
                    st.write(f"**Status:** {bot.get('container_status', 'N/A')}")
                    st.write(f"**Health:** {bot.get('normalized_status', 'N/A')}")
                
                with col2:
                    st.markdown("### 📝 Transcription Stats")
                    trans = get_transcriptions(bot.get('id'))
                    st.metric("Total Segments", len(trans))
                    if trans:
                        st.metric("Latest Segment", f"{len(trans[-1].get('text', '').split())} words")
                        langs = set([t.get('language', 'en') for t in trans])
                        st.metric("Languages", len(langs))
                        st.caption(f"Languages: {', '.join(langs)}")
                    
                    st.markdown("### 🔗 Quick Actions")
                    if st.button("📝 View Transcripts", key="detail_view_trans", use_container_width=True):
                        st.session_state['view_bot'] = bot.get('id')
                        st.info("→ Switch to Transcripts tab")
                    
                    if st.button("📥 Export All Formats", key="detail_export", use_container_width=True):
                        st.session_state['export_bot'] = bot.get('id')
                        st.success("Ready to export!")
                    
                    if st.button("✖️ Close", key="detail_close", type="secondary", use_container_width=True):
                        del st.session_state['detail_bot']
                        st.rerun()
                
                # Export section in detail view
                if st.session_state.get('export_bot') == bot.get('id'):
                    st.markdown("---")
                    st.markdown("### 📥 Export Options")
                    trans = get_transcriptions(bot.get('id'))
                    if trans:
                        col1, col2, col3, col4 = st.columns(4)
                        
                        with col1:
                            txt_data = export_transcript_txt(trans, bot)
                            st.download_button("📄 TXT", txt_data, f"transcript_{bot.get('id')}.txt", "text/plain", use_container_width=True)
                        
                        with col2:
                            csv_data = export_transcript_csv(trans, bot)
                            st.download_button("📊 CSV", csv_data, f"transcript_{bot.get('id')}.csv", "text/csv", use_container_width=True)
                        
                        with col3:
                            json_data = export_transcript_json(trans, bot)
                            st.download_button("🔧 JSON", json_data, f"transcript_{bot.get('id')}.json", "application/json", use_container_width=True)
                        
                        with col4:
                            if HAS_PDF:
                                pdf_data = export_transcript_pdf(trans, bot)
                                if pdf_data:
                                    st.download_button("📕 PDF", pdf_data, f"transcript_{bot.get('id')}.pdf", "application/pdf", use_container_width=True)
                            else:
                                st.caption("PDF export unavailable")
                    else:
                        st.info("No transcripts available yet")

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
                with st.spinner("🚀 Deploying bot to meeting..."):
                    ok, res = create_bot(platform, meeting_id, passcode, bot_name)
                    if ok:
                        st.balloons()
                        st.success(f"✅ Bot #{res.get('id')} deployed successfully!")
                        st.toast(f"Bot #{res.get('id')} is joining the meeting", icon="🤖")
                        time.sleep(2)
                        st.rerun()
                    else:
                        st.error(f"❌ Failed: {res}")
                        st.toast("Deployment failed", icon="❌")
            else:
                st.warning("⚠️ Please enter a meeting ID")

# Tab 3: Transcripts
with tab3:
    st.subheader("📝 Live Transcripts")
    bots = get_bots()
    active = [b for b in bots if b.get('status') in ['active', 'awaiting_admission', 'joining']]
    
    if not active:
        st.info("💡 No active bots. Deploy one from the 'Deploy' tab!")
    else:
        # Bot selector
        col1, col2 = st.columns([3, 1])
        with col1:
            sel = st.selectbox("Select Bot", [b.get('id') for b in active], 
                             format_func=lambda x: f"Bot #{x} - {next((b.get('native_meeting_id') for b in active if b.get('id')==x), 'N/A')}")
        with col2:
            auto_scroll = st.checkbox("Auto-scroll", value=True)
        
        if sel:
            bot = next((b for b in active if b.get('id')==sel), None)
            if bot:
                # Bot stats
                c1, c2, c3, c4 = st.columns(4)
                c1.metric("Platform", f"{get_platform_emoji(bot.get('platform',''))} {bot.get('platform','').upper()}")
                c2.metric("Duration", format_duration(bot.get('start_time')))
                c3.metric("Status", f"{get_status_emoji(bot.get('status',''))} {bot.get('status','').title()}")
                
                # Get transcripts
                trans = get_transcriptions(sel)
                c4.metric("Segments", len(trans), delta=f"+{len(trans)}" if len(trans) > 0 else None)
                
                st.markdown("---")
                
                # Export buttons
                if trans:
                    st.markdown("### 📥 Export Transcript")
                    col1, col2, col3, col4 = st.columns(4)
                    
                    with col1:
                        txt_data = export_transcript_txt(trans, bot)
                        st.download_button("📄 TXT", txt_data, f"transcript_{sel}.txt", "text/plain", use_container_width=True)
                    
                    with col2:
                        csv_data = export_transcript_csv(trans, bot)
                        st.download_button("📊 CSV", csv_data, f"transcript_{sel}.csv", "text/csv", use_container_width=True)
                    
                    with col3:
                        json_data = export_transcript_json(trans, bot)
                        st.download_button("🔧 JSON", json_data, f"transcript_{sel}.json", "application/json", use_container_width=True)
                    
                    with col4:
                        if HAS_PDF:
                            pdf_data = export_transcript_pdf(trans, bot)
                            if pdf_data:
                                st.download_button("📕 PDF", pdf_data, f"transcript_{sel}.pdf", "application/pdf", use_container_width=True)
                        else:
                            st.button("📕 PDF", disabled=True, use_container_width=True)
                            st.caption("Install reportlab for PDF export")
                    
                    st.markdown("---")
                    
                    # Search in transcripts
                    search = st.text_input("🔍 Search in transcript", placeholder="Type to search...")
                    
                    # Transcript feed
                    st.markdown("### 💬 Transcript Feed")
                    
                    # Filter by search
                    display_trans = trans
                    if search:
                        display_trans = [t for t in trans if search.lower() in t.get('text', '').lower()]
                        st.info(f"Found {len(display_trans)} matches for '{search}'")
                    
                    if display_trans:
                        # Show latest 100 segments
                        for i, t in enumerate(reversed(display_trans[-100:]), 1):
                            with st.chat_message("assistant", avatar="🤖"):
                                st.markdown(f"**Segment {len(display_trans) - i + 1}**")
                                text = t.get('text', 'N/A')
                                
                                # Highlight search term
                                if search and search.lower() in text.lower():
                                    import re
                                    text = re.sub(f'({re.escape(search)})', r'**\1**', text, flags=re.IGNORECASE)
                                
                                st.markdown(text)
                                st.caption(f"🕐 {t.get('start_time', 'N/A')} · 🌍 {t.get('language', 'en').upper()}")
                    else:
                        st.warning(f"No matches found for '{search}'")
                else:
                    st.info("⏳ Waiting for audio... The bot is in the meeting and will start transcribing once audio is detected.")
                    if bot.get('status') == 'awaiting_admission':
                        st.warning("⚠️ Bot is waiting to be admitted to the meeting. Please admit the bot from the meeting interface.")
                    elif bot.get('status') == 'joining':
                        st.info("🔄 Bot is joining the meeting...")

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

# Tab 5: History
with tab5:
    st.subheader("📜 Meeting History")
    st.markdown("Complete history of all meetings and bot sessions")
    
    # Get all bots (active + historical)
    bots = get_bots()
    
    if not bots:
        st.info("No meeting history yet. Deploy your first bot!")
    else:
        # Filters
        col1, col2, col3 = st.columns(3)
        with col1:
            platform_filter = st.multiselect("Platform", ["teams", "meet", "zoom"], default=["teams", "meet", "zoom"])
        with col2:
            status_filter = st.multiselect("Status", ["active", "completed", "failed", "awaiting_admission", "joining"], 
                                          default=["active", "completed", "failed"])
        with col3:
            search_term = st.text_input("Search Meeting ID", placeholder="Type to filter...")
        
        # Filter bots
        filtered_bots = bots
        if platform_filter:
            filtered_bots = [b for b in filtered_bots if b.get('platform') in platform_filter]
        if status_filter:
            filtered_bots = [b for b in filtered_bots if b.get('status') in status_filter]
        if search_term:
            filtered_bots = [b for b in filtered_bots if search_term.lower() in b.get('native_meeting_id', '').lower()]
        
        st.markdown(f"### Found {len(filtered_bots)} meetings")
        st.markdown("---")
        
        # Create DataFrame
        history_data = []
        for bot in filtered_bots:
            history_data.append({
                'ID': bot.get('id'),
                'Platform': f"{get_platform_emoji(bot.get('platform', ''))} {bot.get('platform', '').upper()}",
                'Meeting ID': bot.get('native_meeting_id', 'N/A'),
                'Status': f"{get_status_emoji(bot.get('status', ''))} {bot.get('status', '').title()}",
                'Container': bot.get('container_name', 'N/A')[:20],
                'Created': bot.get('created_at', 'N/A')[:19],
                'Duration': format_duration(bot.get('start_time')) if bot.get('start_time') else '0:00'
            })
        
        if history_data:
            df = pd.DataFrame(history_data)
            
            # Display table with selection
            st.dataframe(df, use_container_width=True, hide_index=True)
            
            st.markdown("---")
            st.markdown("### 📊 Statistics")
            
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Total Meetings", len(filtered_bots))
            col2.metric("Active Now", len([b for b in filtered_bots if b.get('status') == 'active']))
            col3.metric("Completed", len([b for b in filtered_bots if b.get('status') == 'completed']))
            col4.metric("Failed", len([b for b in filtered_bots if b.get('status') == 'failed']))
            
            # Export history
            st.markdown("---")
            st.markdown("### 📥 Export History")
            csv_export = df.to_csv(index=False)
            st.download_button("📊 Export as CSV", csv_export, "meeting_history.csv", "text/csv", use_container_width=True)
        else:
            st.info("No meetings match the current filters")

# Tab 6: Container Management
with tab6:
    st.subheader("🐳 Container Management")
    st.markdown("Real-time container status and control for Vexa bots")
    
    bots = get_bots()
    
    if not bots:
        st.info("No containers running")
    else:
        st.markdown(f"### Running Containers ({len(bots)})")
        
        for bot in bots:
            with st.expander(f"🐳 {bot.get('container_name', 'Unknown')} - {bot.get('normalized_status', 'Unknown')}", expanded=False):
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    st.markdown("#### Container Details")
                    st.write(f"**Name:** `{bot.get('container_name', 'N/A')}`")
                    st.write(f"**ID:** `{bot.get('container_id', 'N/A')[:12]}...`")
                    st.write(f"**Full ID:** `{bot.get('container_id', 'N/A')}`")
                    st.write(f"**Status:** {bot.get('container_status', 'N/A')}")
                    st.write(f"**Normalized:** {bot.get('normalized_status', 'N/A')}")
                    st.write(f"**Created:** {bot.get('created_at', 'N/A')[:19]}")
                    
                    st.markdown("#### Meeting Details")
                    st.write(f"**Meeting ID:** #{bot.get('id', 'N/A')}")
                    st.write(f"**Platform:** {bot.get('platform', 'N/A').upper()}")
                    st.write(f"**Native Meeting ID:** {bot.get('native_meeting_id', 'N/A')}")
                    
                    if bot.get('labels'):
                        st.markdown("#### Labels")
                        for key, val in bot.get('labels', {}).items():
                            if key.startswith('vexa.'):
                                st.caption(f"`{key}`: {val}")
                
                with col2:
                    st.markdown("#### Actions")
                    
                    if st.button("📋 View Logs", key=f"logs_{bot.get('container_id')}", use_container_width=True):
                        with st.spinner("Fetching logs..."):
                            logs = get_container_logs(bot.get('container_id', ''), tail=50)
                            if logs:
                                st.text_area("Container Logs (last 50 lines)", logs, height=200)
                            else:
                                st.error("Failed to fetch logs")
                    
                    if st.button("⏹️ Stop Container", key=f"stop_{bot.get('container_id')}", 
                                type="secondary", use_container_width=True):
                        if st.session_state.get(f"confirm_stop_{bot.get('container_id')}", False):
                            with st.spinner("Stopping container..."):
                                if stop_container(bot.get('container_id', '')):
                                    st.success("✅ Container stopped!")
                                    time.sleep(1)
                                    st.rerun()
                                else:
                                    st.error("Failed to stop container")
                            st.session_state[f"confirm_stop_{bot.get('container_id')}"] = False
                        else:
                            st.warning("Click again to confirm stop")
                            st.session_state[f"confirm_stop_{bot.get('container_id')}"] = True
                    
                    if st.button("🗑️ Remove Container", key=f"remove_{bot.get('container_id')}", 
                                type="primary", use_container_width=True):
                        if st.session_state.get(f"confirm_remove_{bot.get('container_id')}", False):
                            with st.spinner("Removing container..."):
                                if remove_container(bot.get('container_id', '')):
                                    st.success("✅ Container removed!")
                                    time.sleep(1)
                                    st.rerun()
                                else:
                                    st.error("Failed to remove container")
                            st.session_state[f"confirm_remove_{bot.get('container_id')}"] = False
                        else:
                            st.warning("⚠️ Click again to confirm removal")
                            st.session_state[f"confirm_remove_{bot.get('container_id')}"] = True
                    
                    st.caption("⚠️ Manual actions may affect bot state")
        
        st.markdown("---")
        st.markdown("### Bulk Actions")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("⏹️ Stop All Bots", type="secondary", use_container_width=True):
                if st.session_state.get("confirm_stop_all", False):
                    count = 0
                    for bot in bots:
                        if stop_container(bot.get('container_id', '')):
                            count += 1
                    st.success(f"✅ Stopped {count}/{len(bots)} containers")
                    st.session_state["confirm_stop_all"] = False
                    time.sleep(2)
                    st.rerun()
                else:
                    st.warning("Click again to confirm")
                    st.session_state["confirm_stop_all"] = True
        
        with col2:
            if st.button("🗑️ Remove All Stopped", use_container_width=True):
                stopped_bots = [b for b in bots if b.get('normalized_status') != 'Up']
                if stopped_bots:
                    count = 0
                    for bot in stopped_bots:
                        if remove_container(bot.get('container_id', '')):
                            count += 1
                    st.success(f"✅ Removed {count}/{len(stopped_bots)} containers")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.info("No stopped containers to remove")
        
        with col3:
            st.metric("Running", len([b for b in bots if b.get('normalized_status') == 'Up']))
            st.metric("Stopped", len([b for b in bots if b.get('normalized_status') != 'Up']))

# Footer
st.markdown("---")
st.markdown(f"<div style='text-align:center;color:gray'><p>Vexa Bot Manager Pro v2.0 | {datetime.now().strftime('%Y-%m-%d %H:%M')}</p></div>", unsafe_allow_html=True)

if auto_refresh:
    time.sleep(refresh_interval)
    st.rerun()
