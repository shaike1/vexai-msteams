import { Page } from "playwright";
import { log } from "../../utils";
import { BotConfig } from "../../types";
import { WhisperLiveService } from "../../services/whisperlive";
import WebSocket from "ws";
import {
  teamsParticipantSelectors,
  teamsSpeakingClassNames,
  teamsSilenceClassNames,
  teamsParticipantContainerSelectors,
  teamsNameSelectors,
  teamsSpeakingIndicators,
  teamsVoiceLevelSelectors,
  teamsOcclusionSelectors,
  teamsStreamTypeSelectors,
  teamsAudioActivitySelectors,
  teamsParticipantIdSelectors,
  teamsMeetingContainerSelectors
} from "./selectors";

// Modified to use new services - Teams recording functionality
export async function startTeamsRecording(page: Page, botConfig: BotConfig): Promise<void> {
  // Initialize WhisperLive service on Node.js side
  const whisperLiveService = new WhisperLiveService({
    whisperLiveUrl: process.env.WHISPER_LIVE_URL
  });

  // Initialize WhisperLive connection with STUBBORN reconnection - NEVER GIVES UP!
  const whisperLiveUrl = await whisperLiveService.initializeWithStubbornReconnection("Teams");

  log(`[Node.js] Using WhisperLive URL for Teams: ${whisperLiveUrl}`);
  log("Starting Teams recording with WebSocket connection");
  
  // Create Node.js WebSocket connection (bypasses browser security)
  let nodeWs: WebSocket | null = null;
  let isServerReady = false;
  const sessionUid = require('uuid').v4();
  
  const connectNodeWebSocket = () => {
    log(`[Node.js WS] Connecting to WhisperLive: ${whisperLiveUrl}`);
    const ws = new WebSocket.WebSocket(whisperLiveUrl!);
    nodeWs = ws;
    
    ws.on('open', () => {
      log('[Node.js WS] ✅ Connected to WhisperLive!');
      isServerReady = false;
      // Send initial config with required fields
      const config = {
        uid: sessionUid,
        language: botConfig.language || null,
        task: botConfig.task || "transcribe",
        model: null,
        use_vad: false,
        platform: botConfig.platform,
        token: botConfig.token,
        meeting_url: botConfig.meetingUrl || "unknown",
        meeting_id: (botConfig as any).meeting_id || "unknown"
      };
      log(`[Node.js WS] Sending config: ${JSON.stringify(config)}`);
      ws.send(JSON.stringify(config));
    });
    
    ws.on('message', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.status === 'SERVER_READY') {
          isServerReady = true;
          log('[Node.js WS] Server is READY');
        } else if (msg.language) {
          log(`[Node.js WS] Language detected: ${msg.language}`);
        }
      } catch (e) {}
    });
    
    nodeWs.on('error', (err: Error) => {
      log(`[Node.js WS] Error: ${err.message}`);
    });
    
    nodeWs.on('close', () => {
      log('[Node.js WS] Connection closed, reconnecting in 2s...');
      setTimeout(connectNodeWebSocket, 2000);
    });
  };
  
  connectNodeWebSocket();

  // Load browser utility classes from the bundled global file
  // Teams CSP blocks external scripts, so we inject the content directly
  const fs = require('fs');
  const path = require('path');
  const scriptPath = path.join(__dirname, '../../browser-utils.global.js');
  
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`browser-utils.global.js not found at ${scriptPath}`);
  }
  
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Wait for page to be ready, then inject the script by evaluating it
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((script) => {
    // Create a function scope to execute the script
    const scriptFn = new Function(script);
    scriptFn();
  }, scriptContent);
  
  // Verify VexaBrowserUtils is loaded
  const utilsLoaded = await page.evaluate(() => {
    return typeof (window as any).VexaBrowserUtils !== 'undefined';
  });
  
  if (!utilsLoaded) {
    throw new Error('VexaBrowserUtils failed to load in page context');
  }
  
  log('[DEBUG] VexaBrowserUtils loaded successfully in page context');

  // Expose function to send audio data from browser to Node.js
  await page.exposeFunction('sendAudioToNodeWS', (audioDataArray: number[], sampleRate: number) => {
    if (!nodeWs || nodeWs.readyState !== WebSocket.OPEN || !isServerReady) {
      return false;
    }
    try {
      // Convert to Float32Array and send as binary
      const float32Data = new Float32Array(audioDataArray);
      nodeWs.send(float32Data.buffer);
      return true;
    } catch (e: any) {
      log(`[Node.js WS] Send error: ${e.message}`);
      return false;
    }
  });
  
  // Expose function to send speaker events
  await page.exposeFunction('sendSpeakerEventToNodeWS', (eventType: string, name: string, id: string, timestamp: number) => {
    if (!nodeWs || nodeWs.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      const event = {
        type: 'speaker_event',
        event_type: eventType,
        participant_name: name,
        participant_id: id,
        timestamp_ms: timestamp
      };
      nodeWs.send(JSON.stringify(event));
      return true;
    } catch (e: any) {
      return false;
    }
  });

  // Pass the necessary config fields and the resolved URL into the page context
  await page.evaluate(
    async (pageArgs: {
      botConfigData: BotConfig;
      whisperUrlForBrowser: string;
      selectors: {
        participantSelectors: string[];
        speakingClasses: string[];
        silenceClasses: string[];
        containerSelectors: string[];
        nameSelectors: string[];
        speakingIndicators: string[];
        voiceLevelSelectors: string[];
        occlusionSelectors: string[];
        streamTypeSelectors: string[];
        audioActivitySelectors: string[];
        participantIdSelectors: string[];
        meetingContainerSelectors: string[];
      };
    }) => {
      const { botConfigData, whisperUrlForBrowser, selectors } = pageArgs;
      const selectorsTyped = selectors as any;

      // Use browser utility classes from the global bundle
      const { BrowserAudioService, BrowserWhisperLiveService } = (window as any).VexaBrowserUtils;

      // --- Early reconfigure wiring (event listener only) ---
      (window as any).__vexaPendingReconfigure = null;
      try {
        document.addEventListener('vexa:reconfigure', (ev: Event) => {
          try {
            const detail = (ev as CustomEvent).detail || {};
            const { lang, task } = detail;
            const fn = (window as any).triggerWebSocketReconfigure;
            if (typeof fn === 'function') fn(lang, task);
          } catch {}
        });
      } catch {}
      // ---------------------------------------------
      
      const audioService = new BrowserAudioService({
        targetSampleRate: 16000,
        bufferSize: 4096,
        inputChannels: 1,
        outputChannels: 1
      });

      // Instead of browser WebSocket, use Node.js relay functions
      const nodeWsRelay = {
        isReady: () => true, // Node.js handles connection, always ready from browser perspective
        sendAudioData: (audioData: Float32Array) => {
          try {
            // Call the exposed Node.js function
            const audioArray = Array.from(audioData);
            return (window as any).sendAudioToNodeWS(audioArray, 16000);
          } catch (e) {
            return false;
          }
        },
        sendAudioChunkMetadata: (length: number, sampleRate: number) => {
          // Metadata not needed for direct binary sending
        },
        sendSpeakerEvent: (eventType: string, name: string, id: string, timestamp: number) => {
          try {
            return (window as any).sendSpeakerEventToNodeWS(eventType, name, id, timestamp);
          } catch (e) {
            return false;
          }
        },
        close: () => {
          // Node.js handles connection lifecycle
        }
      };

      // Use relay instead of BrowserWhisperLiveService
      const whisperLiveService = nodeWsRelay;
      
      // Expose references for reconfiguration (keeping compatibility)
      (window as any).__vexaWhisperLiveService = whisperLiveService;
      (window as any).__vexaBotConfig = botConfigData;

      // Reconfigure stub (Node.js handles reconnection)
      (window as any).triggerWebSocketReconfigure = async (lang: string | null, task: string | null) => {
        try {
          const cfg = (window as any).__vexaBotConfig || {};
          cfg.language = lang;
          cfg.task = task || 'transcribe';
          (window as any).__vexaBotConfig = cfg;
          (window as any).logBot?.(`[Reconfigure] Config updated: language=${cfg.language}, task=${cfg.task}`);
          // Node.js will handle reconnection with new config
        } catch (e: any) {
          (window as any).logBot?.(`[Reconfigure] Error: ${e?.message || e}`);
        }
      };

      await new Promise<void>((resolve, reject) => {
        try {
          (window as any).logBot("Starting Teams recording process with new services.");
          
          // Find and create combined audio stream
          audioService.findMediaElements().then(async (mediaElements: HTMLMediaElement[]) => {
            if (mediaElements.length === 0) {
              reject(
                new Error(
                  "[Teams BOT Error] No active media elements found after multiple retries. Ensure the Teams meeting media is playing."
                )
              );
              return;
            }

            // Create combined audio stream
            return await audioService.createCombinedAudioStream(mediaElements);
          }).then(async (combinedStream: MediaStream | undefined) => {
            if (!combinedStream) {
              reject(new Error("[Teams BOT Error] Failed to create combined audio stream"));
              return;
            }
            // Initialize audio processor
            return await audioService.initializeAudioProcessor(combinedStream);
          }).then(async (processor: any) => {
            // Setup audio data processing
            audioService.setupAudioDataProcessor(async (audioData: Float32Array, sessionStartTime: number | null) => {
              // Only send after server ready
              if (!whisperLiveService.isReady()) {
                return;
              }
              // Compute simple RMS and peak for diagnostics
              let sumSquares = 0;
              let peak = 0;
              for (let i = 0; i < audioData.length; i++) {
                const v = audioData[i];
                sumSquares += v * v;
                const a = Math.abs(v);
                if (a > peak) peak = a;
              }
              const rms = Math.sqrt(sumSquares / Math.max(1, audioData.length));
              // Diagnostic: send metadata first
              whisperLiveService.sendAudioChunkMetadata(audioData.length, 16000);
              // Send audio data to WhisperLive
              const success = whisperLiveService.sendAudioData(audioData);
              if (!success) {
                (window as any).logBot("Failed to send Teams audio data to WhisperLive");
              }
            });

            // No browser-side WebSocket connection needed - using Node.js relay
            (window as any).logBot("Using Node.js WebSocket relay for WhisperLive");
            
            // Audio processing now sends to Node.js relay
            return Promise.resolve();
          }).then(() => {
            // Initialize Teams-specific speaker detection (browser context)
            (window as any).logBot("Initializing Teams speaker detection...");
            
            // Teams-specific speaker detection logic (comprehensive like Google Meet)
            const initializeTeamsSpeakerDetection = (whisperLiveService: any, audioService: any, botConfigData: any) => {
              (window as any).logBot("Setting up Teams speaker detection...");
              
              // Teams-specific configuration for speaker detection
              const participantSelectors = selectors.participantSelectors;
              
              // Teams-specific speaking/silence detection based on voice-level-stream-outline
              // The voice-level-stream-outline element appears/disappears or changes state when someone speaks
              const speakingIndicators = selectors.speakingIndicators;
              
              // Teams-specific speaking/silence classes (fallback)
              const speakingClasses = selectors.speakingClasses;
              
              const silenceClasses = selectors.silenceClasses;
              
              // State for tracking speaking status
              const speakingStates = new Map(); // Stores the logical speaking state for each participant ID
              
              // Helper functions for Teams speaker detection
              function getTeamsParticipantId(element: HTMLElement) {
                // Try various Teams-specific attributes
                let id = element.getAttribute('data-tid') || 
                        element.getAttribute('data-participant-id') ||
                        element.getAttribute('data-user-id') ||
                        element.getAttribute('data-object-id') ||
                        element.getAttribute('id');
                
                if (!id) {
                  // Look for stable child elements
                  const stableChild = element.querySelector(selectorsTyped.participantIdSelectors.join(', '));
                  if (stableChild) {
                    id = stableChild.getAttribute('data-tid') || 
                         stableChild.getAttribute('data-participant-id') ||
                         stableChild.getAttribute('data-user-id');
                  }
                }
                
                if (!id) {
                  // Generate a stable ID if none found
                  if (!(element as any).dataset.vexaGeneratedId) {
                    (element as any).dataset.vexaGeneratedId = 'teams-id-' + Math.random().toString(36).substr(2, 9);
                  }
                  id = (element as any).dataset.vexaGeneratedId;
                }
                
                return id;
              }
              
              function getTeamsParticipantName(participantElement: HTMLElement) {
                // Teams-specific name selectors based on actual UI structure
                const nameSelectors = selectors.nameSelectors;
                
                // Try to find name in the main element or its children
                for (const selector of nameSelectors) {
                  const nameElement = participantElement.querySelector(selector) as HTMLElement;
                  if (nameElement) {
                    let nameText = nameElement.textContent || 
                                  nameElement.innerText || 
                                  nameElement.getAttribute('title') ||
                                  nameElement.getAttribute('aria-label');
                    
                    if (nameText && nameText.trim()) {
                      // Clean up the name text
                      nameText = nameText.trim();
                      
                      // Filter out non-name content
                      const forbiddenSubstrings = [
                        "more_vert", "mic_off", "mic", "videocam", "videocam_off", 
                        "present_to_all", "devices", "speaker", "speakers", "microphone",
                        "camera", "camera_off", "share", "chat", "participant", "user"
                      ];
                      
                      if (nameText && !forbiddenSubstrings.some(sub => nameText!.toLowerCase().includes(sub.toLowerCase()))) {
                        // Basic length validation only (allow numbers, parentheses, etc.)
                        if (nameText.length > 1 && nameText.length < 50) {
                          return nameText;
                        }
                      }
                    }
                  }
                }
                
                // Fallback: try to extract from aria-label
                const ariaLabel = participantElement.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('name')) {
                  const nameMatch = ariaLabel.match(/name[:\s]+([^,]+)/i);
                  if (nameMatch && nameMatch[1]) {
                    const nameText = nameMatch[1].trim();
                    if (nameText.length > 1 && nameText.length < 50) {
                      return nameText;
                    }
                  }
                }
                
                // Final fallback
                const idToDisplay = getTeamsParticipantId(participantElement);
                return `Teams Participant (${idToDisplay})`;
              }
              
              function sendTeamsSpeakerEvent(eventType: string, participantElement: HTMLElement) {
                const eventAbsoluteTimeMs = Date.now();
                        const sessionStartTime = audioService.getSessionAudioStartTime();
                
                if (sessionStartTime === null) {
                  return;
                }
                
                const relativeTimestampMs = eventAbsoluteTimeMs - sessionStartTime;
                const participantId = getTeamsParticipantId(participantElement);
                const participantName = getTeamsParticipantName(participantElement);
                
                // Send via BrowserWhisperLiveService helper (handles OPEN state internally)
                try {
                  const sent = whisperLiveService.sendSpeakerEvent(
                    eventType,
                    participantName,
                    participantId,
                    relativeTimestampMs,
                    botConfigData
                  );
                } catch (error: any) {
                  // Handle errors silently
                }
              }
              
              function logTeamsSpeakerEvent(participantElement: HTMLElement, mutatedClassList: DOMTokenList) {
                const participantId = getTeamsParticipantId(participantElement);
                const participantName = getTeamsParticipantName(participantElement);
                const previousLogicalState = speakingStates.get(participantId) || "silent";
                
                // Check for voice-level-stream-outline element (primary Teams speaker indicator)
                // NOTE: voice-level-stream-outline appears when participant is SILENT, disappears when SPEAKING
                const voiceLevelElement = participantElement.querySelector(selectorsTyped.voiceLevelSelectors[0]) as HTMLElement;
                const hasVoiceLevelElement = !!voiceLevelElement;
                const isVoiceLevelVisible = hasVoiceLevelElement && 
                  voiceLevelElement.offsetWidth > 0 && 
                  voiceLevelElement.offsetHeight > 0 &&
                  getComputedStyle(voiceLevelElement).display !== 'none' &&
                  getComputedStyle(voiceLevelElement).visibility !== 'hidden';
                
                // Fallback to class-based detection
                const isNowVisiblySpeaking = speakingClasses.some(cls => mutatedClassList.contains(cls));
                const isNowVisiblySilent = silenceClasses.some(cls => mutatedClassList.contains(cls));
                
                // Determine if currently speaking
                // If voice-level indicator exists: visible => SILENT, hidden => SPEAKING
                // If no indicator exists: rely on class-based detection only
                let isCurrentlySpeaking = false;
                if (hasVoiceLevelElement) {
                  isCurrentlySpeaking = !isVoiceLevelVisible || isNowVisiblySpeaking;
                } else {
                  isCurrentlySpeaking = isNowVisiblySpeaking && !isNowVisiblySilent;
                }
                
                if (isCurrentlySpeaking) {
                  if (previousLogicalState !== "speaking") {
                    (window as any).logBot(`🎤 [Teams] SPEAKER_START: ${participantName} (ID: ${participantId}) - Voice level visible: ${isVoiceLevelVisible}`);
                    sendTeamsSpeakerEvent("SPEAKER_START", participantElement);
                  }
                  speakingStates.set(participantId, "speaking");
                } else {
                  if (previousLogicalState === "speaking") {
                    (window as any).logBot(`🔇 [Teams] SPEAKER_END: ${participantName} (ID: ${participantId}) - Voice level visible: ${isVoiceLevelVisible}`);
                    sendTeamsSpeakerEvent("SPEAKER_END", participantElement);
                  }
                  speakingStates.set(participantId, "silent");
                }
              }
              
              function observeTeamsParticipant(participantElement: HTMLElement) {
                const participantId = getTeamsParticipantId(participantElement);
                const participantName = getTeamsParticipantName(participantElement);
                
                // Initialize participant as silent
                speakingStates.set(participantId, "silent");
                
                // Check initial state
                let classListForInitialScan = participantElement.classList;
                for (const cls of speakingClasses) {
                  const descendantElement = participantElement.querySelector('.' + cls);
                  if (descendantElement) {
                    classListForInitialScan = descendantElement.classList;
                    break;
                  }
                }
                
                (window as any).logBot(`👁️ [Teams] Observing: ${participantName} (ID: ${participantId}). Performing initial participant state analysis.`);
                
                logTeamsSpeakerEvent(participantElement, classListForInitialScan);
                
                const callback = function(mutationsList: MutationRecord[], observer: MutationObserver) {
                  for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                      const targetElement = mutation.target as HTMLElement;
                      if (participantElement.contains(targetElement)) {
                        logTeamsSpeakerEvent(participantElement, targetElement.classList);
                      }
                    }
                  }
                };
                
                const observer = new MutationObserver(callback);
                observer.observe(participantElement, { 
                  attributes: true, 
                  attributeFilter: ['class'],
                  subtree: true 
                });
                
                if (!(participantElement as any).dataset.vexaObserverAttached) {
                  (participantElement as any).dataset.vexaObserverAttached = 'true';
                }
              }
              
              function scanForAllTeamsParticipants() {
                for (const selector of participantSelectors) {
                  const participantElements = document.querySelectorAll(selector);
                  for (let i = 0; i < participantElements.length; i++) {
                    const el = participantElements[i] as HTMLElement;
                    if (!(el as any).dataset.vexaObserverAttached) {
                      observeTeamsParticipant(el);
                    }
                  }
                }
              }
              
              // Initialize speaker detection
              scanForAllTeamsParticipants();

              // ===== Ported from legacy implementation: container + indicator based polling =====
              const containerSelectors: string[] = selectors.containerSelectors || [];

              const lastSpeakingStateById = new Map<string, 'speaking' | 'silent'>();
              const POLL_MS = 500;

              function isElementActuallyVisible(el: HTMLElement): boolean {
                const cs = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const ariaHidden = el.getAttribute('aria-hidden') === 'true';
                const transform = cs.transform || '';
                const scaledToZero = /matrix\((?:[^,]+,){4}\s*0(?:,|\s*\))/.test(transform) || transform.includes('scale(0');
                const occluded = !!el.closest((selectors as any).occlusionSelectors?.[0] || '.__no_occlusion__');
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  cs.display !== 'none' &&
                  cs.visibility !== 'hidden' &&
                  cs.opacity !== '0' &&
                  !ariaHidden &&
                  !scaledToZero &&
                  !occluded
                );
              }

              function isSpeakingForContainer(containerEl: HTMLElement): boolean {
                // Primary indicator: voice-level outline (visible => SILENT, hidden => SPEAKING)
                const vSel = (selectors as any).voiceLevelSelectors?.[0];
                const voiceLevel = vSel ? (containerEl.querySelector(vSel) as HTMLElement | null) : null;
                if (voiceLevel && isElementActuallyVisible(voiceLevel)) {
                  return false; // visible outline => silent
                }

                // Fallback indicators: any audio activity/speaking indicator visible
                const audioSels: string[] = (selectors as any).audioActivitySelectors || [];
                if (audioSels.length > 0) {
                  const anyInd = containerEl.querySelector(audioSels.join(', ')) as HTMLElement | null;
                  if (anyInd && isElementActuallyVisible(anyInd)) {
                    return true;
                  }
                }

                // Default to speaking when no voice-level element is present (legacy behavior)
                return true;
              }

              const pollTeamsActiveSpeakers = () => {
                try {
                  const containers: HTMLElement[] = [];
                  for (const sel of containerSelectors) {
                    document.querySelectorAll(sel).forEach((el) => containers.push(el as HTMLElement));
                  }

                  containers.forEach((container) => {
                    const participantId = String(getTeamsParticipantId(container) || 'unknown');
                    const participantName = String(getTeamsParticipantName(container) || participantId);
                    const speaking = isSpeakingForContainer(container);
                    const prev = lastSpeakingStateById.get(participantId) || 'silent';

                    if (speaking && prev !== 'speaking') {
                      const ts = new Date().toISOString();
                      (window as any).logBot(`[${ts}] [SPEAKER_START] ${participantName}`);
                      sendTeamsSpeakerEvent('SPEAKER_START', container);
                      lastSpeakingStateById.set(participantId, 'speaking');
                    } else if (!speaking && prev === 'speaking') {
                      const ts = new Date().toISOString();
                      (window as any).logBot(`[${ts}] [SPEAKER_END] ${participantName}`);
                      sendTeamsSpeakerEvent('SPEAKER_END', container);
                      lastSpeakingStateById.set(participantId, 'silent');
                    } else if (!lastSpeakingStateById.has(participantId)) {
                      lastSpeakingStateById.set(participantId, speaking ? 'speaking' : 'silent');
                    }
                  });
                } catch {}
              };

              setInterval(pollTeamsActiveSpeakers, POLL_MS);

              // Voice indicator polling with quick mutation-based state flips
              const lastIndicatorStateById = new Map<string, boolean>();
              const lastEventTsById = new Map<string, number>();
              const observedIndicators = new WeakSet<HTMLElement>();
              const observedIndicatorsList = new Set<HTMLElement>();
              const DEBOUNCE_MS = 300;

              function getContainerForIndicator(indicator: HTMLElement): HTMLElement | null {
                const sSel = (selectors as any).streamTypeSelectors?.[0];
                const container = sSel ? (indicator.closest(sSel) as HTMLElement | null) : null;
                if (container) return container;
                let parent: HTMLElement | null = indicator.parentElement;
                let hops = 0;
                while (parent && hops < 5) {
                  if (parent.hasAttribute('data-tid') || parent.hasAttribute('data-stream-type')) return parent;
                  parent = parent.parentElement;
                  hops++;
                }
                return indicator.parentElement as HTMLElement | null;
              }

              function collectSameOriginDocs(): Document[] {
                const docs: Document[] = [document];
                const visit = (doc: Document) => {
                  const iframes = Array.from(doc.querySelectorAll('iframe')) as HTMLIFrameElement[];
                  for (const frame of iframes) {
                    try {
                      if (frame.contentDocument) {
                        docs.push(frame.contentDocument);
                        visit(frame.contentDocument);
                      }
                    } catch {}
                  }
                };
                visit(document);
                return docs;
              }

              const pollTeamsVoiceIndicators = () => {
                try {
                  const vSel = (selectors as any).voiceLevelSelectors?.[0];
                  if (!vSel) return;
                  const allDocs = collectSameOriginDocs();
                  const indicators: HTMLElement[] = [];
                  for (const d of allDocs) {
                    d.querySelectorAll(vSel).forEach(el => indicators.push(el as HTMLElement));
                  }

                  indicators.forEach((indicator) => {
                    const container = getContainerForIndicator(indicator);
                    if (!container) return;
                    const participantId = String(getTeamsParticipantId(container) || 'unknown');
                    const participantName = String(getTeamsParticipantName(container) || participantId);

                    // Observe quick visibility flips
                    if (!observedIndicators.has(indicator)) {
                      try {
                        const observer = new MutationObserver(() => {
                          const currentlyVisible = isElementActuallyVisible(indicator);
                          const wasSpeaking = lastIndicatorStateById.get(participantId) === true;
                          if (!currentlyVisible && !wasSpeaking) {
                            const ts = new Date().toISOString();
                            (window as any).logBot(`[${ts}] [SPEAKER_START] ${participantName}`);
                            sendTeamsSpeakerEvent('SPEAKER_START', container);
                            lastIndicatorStateById.set(participantId, true);
                            lastEventTsById.set(participantId, Date.now());
                          } else if (currentlyVisible && wasSpeaking) {
                            const ts = new Date().toISOString();
                            (window as any).logBot(`[${ts}] [SPEAKER_END] ${participantName}`);
                            sendTeamsSpeakerEvent('SPEAKER_END', container);
                            lastIndicatorStateById.set(participantId, false);
                            lastEventTsById.set(participantId, Date.now());
                          }
                        });
                        observer.observe(indicator, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
                        observedIndicators.add(indicator);
                        observedIndicatorsList.add(indicator);
                      } catch {}
                    }

                    // If indicator not visible => speaking
                    const visible = isElementActuallyVisible(indicator);
                    if (!visible) {
                      const prevSpeaking = lastIndicatorStateById.get(participantId) === true;
                      const now = Date.now();
                      const lastTs = lastEventTsById.get(participantId) || 0;
                      if (!prevSpeaking && (now - lastTs) > DEBOUNCE_MS) {
                        const ts = new Date().toISOString();
                        (window as any).logBot(`[${ts}] [SPEAKER_START] ${participantName}`);
                        sendTeamsSpeakerEvent('SPEAKER_START', container);
                        lastIndicatorStateById.set(participantId, true);
                        lastEventTsById.set(participantId, now);
                      }
                    }
                  });
                } catch {}
              };

              setInterval(pollTeamsVoiceIndicators, 150);

              // requestAnimationFrame loop for near real-time indicator sampling
              function fastIndicatorTick() {
                try {
                  const now = Date.now();
                  observedIndicatorsList.forEach((indicator) => {
                    if (!indicator.isConnected) {
                      observedIndicatorsList.delete(indicator);
                      return;
                    }
                    const container = getContainerForIndicator(indicator);
                    if (!container) return;
                    const participantId = String(getTeamsParticipantId(container) || 'unknown');
                    const participantName = String(getTeamsParticipantName(container) || participantId);
                    const visible = isElementActuallyVisible(indicator);
                    const wasSpeaking = lastIndicatorStateById.get(participantId) === true;
                    const lastTs = lastEventTsById.get(participantId) || 0;
                    if (!visible && !wasSpeaking && (now - lastTs) > DEBOUNCE_MS) {
                      const ts = new Date().toISOString();
                      (window as any).logBot(`[${ts}] [SPEAKER_START] ${participantName}`);
                      sendTeamsSpeakerEvent('SPEAKER_START', container);
                      lastIndicatorStateById.set(participantId, true);
                      lastEventTsById.set(participantId, now);
                    } else if (visible && wasSpeaking && (now - lastTs) > DEBOUNCE_MS) {
                      const ts = new Date().toISOString();
                      (window as any).logBot(`[${ts}] [SPEAKER_END] ${participantName}`);
                      sendTeamsSpeakerEvent('SPEAKER_END', container);
                      lastIndicatorStateById.set(participantId, false);
                      lastEventTsById.set(participantId, now);
                    }
                  });
                } catch {}
                requestAnimationFrame(fastIndicatorTick);
              }
              requestAnimationFrame(fastIndicatorTick);
              
              // Monitor for new participants
              const bodyObserver = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                  if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                        const elementNode = node as HTMLElement;
                        
                        // Check if the added node matches any participant selector
                        for (const selector of participantSelectors) {
                          if (elementNode.matches(selector) && !(elementNode as any).dataset.vexaObserverAttached) {
                            observeTeamsParticipant(elementNode);
                          }
                          
                          // Check children
                          const childElements = elementNode.querySelectorAll(selector);
                          for (let i = 0; i < childElements.length; i++) {
                            const childEl = childElements[i] as HTMLElement;
                            if (!(childEl as any).dataset.vexaObserverAttached) {
                              observeTeamsParticipant(childEl);
                            }
                          }
                        }
                      }
                    });
                    
                    mutation.removedNodes.forEach(node => {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                        const elementNode = node as HTMLElement;
                        
                        // Check if removed node was a participant
                        for (const selector of participantSelectors) {
                          if (elementNode.matches(selector)) {
                            const participantId = getTeamsParticipantId(elementNode);
                            const participantName = getTeamsParticipantName(elementNode);
                            
                            if (speakingStates.get(participantId) === 'speaking') {
                              (window as any).logBot(`🔇 [Teams] SPEAKER_END (Participant removed while speaking): ${participantName} (ID: ${participantId})`);
                              sendTeamsSpeakerEvent("SPEAKER_END", elementNode);
                            }
                            
                            speakingStates.delete(participantId);
                            
                            delete (elementNode as any).dataset.vexaObserverAttached;
                            delete (elementNode as any).dataset.vexaGeneratedId;
                            (window as any).logBot(`🗑️ [Teams] Removed observer for: ${participantName} (ID: ${participantId})`);
                          }
                        }
                      }
                    });
                  }
                }
              });

              // Start observing the Teams meeting container
              const meetingContainer = document.querySelector(selectorsTyped.meetingContainerSelectors[0]) || document.body;
              bodyObserver.observe(meetingContainer, {
                childList: true,
                subtree: true
              });

              // Simple participant counting - poll every 5 seconds using ARIA list
              let currentParticipantCount = 0;
              
              const countParticipants = () => {
                const names = collectAriaParticipants();
                const totalCount = botConfigData?.name ? names.length + 1 : names.length;
                if (totalCount !== currentParticipantCount) {
                  (window as any).logBot(`🔢 Participant count: ${currentParticipantCount} → ${totalCount}`);
                  currentParticipantCount = totalCount;
                }
                return totalCount;
              };
              
              // Do initial count immediately, then poll every 5 seconds
              countParticipants();
              setInterval(countParticipants, 5000);
              
              // Expose participant count for meeting monitoring
              // Accessible-roles based participant collection (robust and simple)
              function collectAriaParticipants(): string[] {
                try {
                  // Find all menuitems in the Participants panel that contain an avatar/image
                  const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
                  const names = new Set<string>();
                  for (const item of menuItems) {
                    const hasImg = !!(item.querySelector('img') || item.querySelector('[role="img"]'));
                    if (!hasImg) continue;
                    // Derive accessible-like name
                    const aria = item.getAttribute('aria-label');
                    let name = aria && aria.trim() ? aria.trim() : '';
                    if (!name) {
                      const text = (item.textContent || '').trim();
                      if (text) name = text;
                    }
                    if (name) {
                      names.add(name);
                    }
                  }
                  return Array.from(names);
                } catch (err: any) {
                  const msg = (err && err.message) ? err.message : String(err);
                  (window as any).logBot?.(`⚠️ [ARIA Participants] Error collecting participants: ${msg}`);
                  return [];
                }
              }

              (window as any).getTeamsActiveParticipantsCount = () => {
                // Use ARIA role-based collection and include the bot if name is known
                const names = collectAriaParticipants();
                const total = botConfigData?.name ? names.length + 1 : names.length;
                return total;
              };
              (window as any).getTeamsActiveParticipants = () => {
                // Return ARIA role-based names plus bot (if known)
                const names = collectAriaParticipants();
                if (botConfigData?.name) names.push(botConfigData.name);
                (window as any).logBot(`🔍 [ARIA Participants] ${JSON.stringify(names)}`);
                return names;
              };
            };

            // Setup Teams meeting monitoring (browser context)
            const setupTeamsMeetingMonitoring = (botConfigData: any, audioService: any, whisperLiveService: any, resolve: any) => {
              (window as any).logBot("Setting up Teams meeting monitoring...");
              
              const leaveCfg = (botConfigData && (botConfigData as any).automaticLeave) || {};
              const startupAloneTimeoutSeconds = Number(leaveCfg.startupAloneTimeoutSeconds ?? 10);
              const everyoneLeftTimeoutSeconds = Number(leaveCfg.everyoneLeftTimeoutSeconds ?? 10);
              
              let aloneTime = 0;
              let lastParticipantCount = 0;
              let speakersIdentified = false;
              let hasEverHadMultipleParticipants = false;

              // Teams removal detection function (browser context)
              const checkForRemoval = () => {
                try {
                  // 1) Strong text heuristics on body text
                  const bodyText = (document.body?.innerText || '').toLowerCase();
                  const removalPhrases = [
                    "you've been removed from this meeting",
                    'you have been removed from this meeting',
                    'removed from meeting',
                    'meeting ended',
                    'call ended'
                  ];
                  if (removalPhrases.some(p => bodyText.includes(p))) {
                    (window as any).logBot('🚨 Teams removal detected via body text');
                    return true;
                  }

                  // 2) Button heuristics
                  const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
                  for (const btn of buttons) {
                    const txt = (btn.textContent || btn.innerText || '').trim().toLowerCase();
                    const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
                    if (txt === 'rejoin' || txt === 'dismiss' || aria.includes('rejoin') || aria.includes('dismiss')) {
                      if (btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                        const cs = getComputedStyle(btn);
                        if (cs.display !== 'none' && cs.visibility !== 'hidden') {
                          (window as any).logBot('🚨 Teams removal detected via visible buttons (Rejoin/Dismiss)');
                          return true;
                        }
                      }
                    }
                  }

                  return false;
                } catch (error: any) {
                  (window as any).logBot(`Error checking for Teams removal: ${error.message}`);
                  return false;
                }
              };

              const checkInterval = setInterval(() => {
                // First check for removal state
                if (checkForRemoval()) {
                  (window as any).logBot("🚨 Bot has been removed from the Teams meeting. Initiating graceful leave...");
                  clearInterval(checkInterval);
                  audioService.disconnect();
                  whisperLiveService.close();
                  reject(new Error("TEAMS_BOT_REMOVED_BY_ADMIN"));
                  return;
                }
                // Check participant count using the comprehensive speaker detection system
                const currentParticipantCount = (window as any).getTeamsActiveParticipantsCount ? (window as any).getTeamsActiveParticipantsCount() : 0;
                
                if (currentParticipantCount !== lastParticipantCount) {
                  (window as any).logBot(`🔢 Teams participant count changed: ${lastParticipantCount} → ${currentParticipantCount}`);
                  const participantList = (window as any).getTeamsActiveParticipants ? (window as any).getTeamsActiveParticipants() : [];
                  (window as any).logBot(`👥 Current participants: ${JSON.stringify(participantList)}`);
                  
                  lastParticipantCount = currentParticipantCount;
                  
                  // Track if we've ever had multiple participants
                  if (currentParticipantCount > 1) {
                    hasEverHadMultipleParticipants = true;
                    speakersIdentified = true; // Once we see multiple participants, we've identified speakers
                    (window as any).logBot("Teams Speakers identified - switching to post-speaker monitoring mode");
                  }
                }

                if (currentParticipantCount === 0) {
                  aloneTime++;
                  
                  // Determine timeout based on whether speakers have been identified
                  const currentTimeout = speakersIdentified ? everyoneLeftTimeoutSeconds : startupAloneTimeoutSeconds;
                  const timeoutDescription = speakersIdentified ? "post-speaker" : "startup";
                  
                  (window as any).logBot(`⏱️ Teams bot alone time: ${aloneTime}s/${currentTimeout}s (${timeoutDescription} mode, speakers identified: ${speakersIdentified})`);
                  
                  if (aloneTime >= currentTimeout) {
                    if (speakersIdentified) {
                      (window as any).logBot(`Teams meeting ended or bot has been alone for ${everyoneLeftTimeoutSeconds} seconds after speakers were identified. Stopping recorder...`);
                      clearInterval(checkInterval);
                      audioService.disconnect();
                      whisperLiveService.close();
                      reject(new Error("TEAMS_BOT_LEFT_ALONE_TIMEOUT"));
                    } else {
                      (window as any).logBot(`Teams bot has been alone for ${startupAloneTimeoutSeconds} seconds during startup with no other participants. Stopping recorder...`);
                      clearInterval(checkInterval);
                      audioService.disconnect();
                      whisperLiveService.close();
                      reject(new Error("TEAMS_BOT_STARTUP_ALONE_TIMEOUT"));
                    }
                  } else if (aloneTime > 0 && aloneTime % 10 === 0) { // Log every 10 seconds to avoid spam
                    if (speakersIdentified) {
                      (window as any).logBot(`Teams bot has been alone for ${aloneTime} seconds (${timeoutDescription} mode). Will leave in ${currentTimeout - aloneTime} more seconds.`);
                    } else {
                      const remainingMinutes = Math.floor((currentTimeout - aloneTime) / 60);
                      const remainingSeconds = (currentTimeout - aloneTime) % 60;
                      (window as any).logBot(`Teams bot has been alone for ${aloneTime} seconds during startup. Will leave in ${remainingMinutes}m ${remainingSeconds}s.`);
                    }
                  }
                } else {
                  aloneTime = 0; // Reset if others are present
                  if (hasEverHadMultipleParticipants && !speakersIdentified) {
                    speakersIdentified = true;
                    (window as any).logBot("Teams speakers identified - switching to post-speaker monitoring mode");
                  }
                }
              }, 1000);

              // Listen for page unload
              window.addEventListener("beforeunload", () => {
                (window as any).logBot("Teams page is unloading. Stopping recorder...");
                clearInterval(checkInterval);
                audioService.disconnect();
                whisperLiveService.close();
                resolve();
              });

              document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                  (window as any).logBot("Teams document is hidden. Stopping recorder...");
                  clearInterval(checkInterval);
                  audioService.disconnect();
                  whisperLiveService.close();
                  resolve();
                }
              });
            };

            // Initialize Teams-specific speaker detection
            initializeTeamsSpeakerDetection(whisperLiveService, audioService, botConfigData);
            
            // Setup Teams meeting monitoring
            setupTeamsMeetingMonitoring(botConfigData, audioService, whisperLiveService, resolve);
          }).catch((err: any) => {
            reject(err);
          });

        } catch (error: any) {
          return reject(new Error("[Teams BOT Error] " + error.message));
        }
      });

      try {
        const pending = (window as any).__vexaPendingReconfigure;
        if (pending && typeof (window as any).triggerWebSocketReconfigure === 'function') {
          (window as any).triggerWebSocketReconfigure(pending.lang, pending.task);
          (window as any).__vexaPendingReconfigure = null;
        }
      } catch {}
    },
    { 
      botConfigData: botConfig, 
      whisperUrlForBrowser: whisperLiveUrl,
      selectors: {
        participantSelectors: teamsParticipantSelectors,
        speakingClasses: teamsSpeakingClassNames,
        silenceClasses: teamsSilenceClassNames,
        containerSelectors: teamsParticipantContainerSelectors,
        nameSelectors: teamsNameSelectors,
        speakingIndicators: teamsSpeakingIndicators,
        voiceLevelSelectors: teamsVoiceLevelSelectors,
        occlusionSelectors: teamsOcclusionSelectors,
        streamTypeSelectors: teamsStreamTypeSelectors,
        audioActivitySelectors: teamsAudioActivitySelectors,
        participantIdSelectors: teamsParticipantIdSelectors,
        meetingContainerSelectors: teamsMeetingContainerSelectors
      } as any
    }
  );
  
  // After page.evaluate finishes, cleanup services
  await whisperLiveService.cleanup();
}
