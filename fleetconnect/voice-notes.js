/**
 * FleetConnect Voice Notes Utility
 * Web Speech API integration for voice transcription
 * Supports Chrome, Edge, and Safari (with webkit prefix)
 */

window.VoiceNotes = {
    recognition: null,
    isRecording: false,
    isSupported: false,
    currentTranscript: '',
    interimTranscript: '',
    onTranscriptCallback: null,

    /**
     * Initialize the Web Speech API
     * @returns {boolean} true if supported, false otherwise
     */
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.isSupported = false;
            return false;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.setupRecognitionHandlers();
        return true;
    },

    /**
     * Setup event handlers for speech recognition
     */
    setupRecognitionHandlers() {
        if (!this.recognition) return;

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        // On result
        this.recognition.onresult = (event) => {
            let interim = '';
            let finalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalText += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            this.interimTranscript = interim;
            this.currentTranscript += finalText;

            if (this.onTranscriptCallback) {
                this.onTranscriptCallback(this.currentTranscript, interim);
            }
        };

        // On error
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isRecording = false;
        };

        // On end
        this.recognition.onend = () => {
            this.isRecording = false;
        };
    },

    /**
     * Start recording
     * @param {Function} callback - Called with (transcript, interim) on each update
     */
    startRecording(callback) {
        if (!this.isSupported) {
            console.error('Voice notes not supported');
            return false;
        }

        if (!this.recognition) {
            this.init();
        }

        this.onTranscriptCallback = callback;
        this.currentTranscript = '';
        this.interimTranscript = '';
        this.isRecording = true;

        try {
            this.recognition.start();
            return true;
        } catch (err) {
            console.error('Error starting recording:', err);
            this.isRecording = false;
            return false;
        }
    },

    /**
     * Stop recording and return final transcript
     * @returns {string} Final transcript
     */
    stopRecording() {
        if (!this.recognition || !this.isRecording) return '';

        try {
            this.recognition.stop();
            this.isRecording = false;
            const result = this.currentTranscript.trim();
            this.currentTranscript = '';
            this.interimTranscript = '';
            return result;
        } catch (err) {
            console.error('Error stopping recording:', err);
            return this.currentTranscript;
        }
    },

    /**
     * Get current recording state
     * @returns {boolean}
     */
    isCurrentlyRecording() {
        return this.isRecording;
    },

    /**
     * Get current partial transcript (including interim results)
     * @returns {string}
     */
    getCurrentTranscript() {
        return this.currentTranscript + this.interimTranscript;
    },

    /**
     * Reset transcript
     */
    reset() {
        this.currentTranscript = '';
        this.interimTranscript = '';
    }
};

/**
 * VoiceNotesUI Class
 * Creates and manages the voice notes UI widget
 */
class VoiceNotesUI {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.textareaId = options.textareaId || null;
        this.appendMode = options.appendMode !== false; // default true
        this.onStart = options.onStart || null;
        this.onStop = options.onStop || null;
        this.recordingTime = 0;
        this.timerInterval = null;
        this.isRecording = false;

        if (!VoiceNotes.init()) {
            this.createUnsupportedMessage();
            return;
        }

        this.createWidgetHTML();
    }

    /**
     * Create the voice notes widget UI
     */
    createWidgetHTML() {
        this.widgetHTML = `
            <div class="voice-notes-widget">
                <div class="voice-notes-container">
                    <button class="voice-notes-button" id="voiceNotesBtn" title="Tap to record">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.7 2.36-2.2 0-4.2-.9-5.7-2.36l-1.41 1.41c1.89 1.89 4.49 3.05 7.11 3.05s5.22-1.16 7.11-3.05l-1.41-1.41zM12 4c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1z"/>
                        </svg>
                    </button>
                    <div class="voice-notes-timer" id="voiceNotesTimer" style="display: none;">
                        <span class="voice-notes-pulse"></span>
                        <span id="timerDisplay">0:00</span>
                    </div>
                    <div class="voice-notes-hint" id="voiceNotesHint">Tap to speak</div>
                </div>
            </div>
        `;

        // Insert widget before textarea if specified
        if (this.textareaId) {
            const textarea = document.getElementById(this.textareaId);
            if (textarea) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = this.widgetHTML;
                textarea.parentNode.insertBefore(wrapper, textarea);
                this.setupEventListeners(textarea);
            }
        } else {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = this.widgetHTML;
            this.container.appendChild(wrapper);
            this.setupEventListeners(null);
        }

        // Add CSS if not already present
        this.injectStyles();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners(textarea) {
        const btn = document.getElementById('voiceNotesBtn');
        if (!btn) return;

        btn.addEventListener('click', () => this.toggleRecording(textarea));
    }

    /**
     * Toggle recording on/off
     */
    async toggleRecording(textarea) {
        const btn = document.getElementById('voiceNotesBtn');
        if (!btn) return;

        if (!this.isRecording) {
            // Start recording
            const started = VoiceNotes.startRecording((transcript, interim) => {
                if (textarea) {
                    let displayText = transcript + (interim ? ' ' + interim : '');

                    if (this.appendMode && textarea.value) {
                        // Show interim in different color
                        const baseText = transcript;
                        const interimText = interim ? ` ${interim}` : '';
                        textarea.value = textarea.getAttribute('data-base') + baseText + interimText;
                    } else {
                        if (!textarea.getAttribute('data-base')) {
                            textarea.setAttribute('data-base', textarea.value);
                        }
                        textarea.value = (textarea.getAttribute('data-base') || '') + displayText;
                    }
                }
            });

            if (started) {
                this.isRecording = true;
                this.recordingTime = 0;
                btn.classList.add('recording');
                btn.innerHTML = '<span class="pulse"></span>';
                document.getElementById('voiceNotesHint').textContent = '🔴 Recording...';
                document.getElementById('voiceNotesTimer').style.display = 'flex';
                this.startTimer();

                if (this.onStart) this.onStart();

                if (textarea && this.appendMode) {
                    if (!textarea.getAttribute('data-base')) {
                        textarea.setAttribute('data-base', textarea.value);
                    }
                }
            }
        } else {
            // Stop recording
            const transcript = VoiceNotes.stopRecording();
            this.isRecording = false;
            btn.classList.remove('recording');
            btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.7 2.36-2.2 0-4.2-.9-5.7-2.36l-1.41 1.41c1.89 1.89 4.49 3.05 7.11 3.05s5.22-1.16 7.11-3.05l-1.41-1.41zM12 4c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1z"/>
            </svg>`;
            document.getElementById('voiceNotesHint').textContent = 'Tap to speak';
            document.getElementById('voiceNotesTimer').style.display = 'none';
            this.stopTimer();

            if (textarea) {
                textarea.removeAttribute('data-base');
                // Final transcript is already in textarea via callback
            }

            if (this.onStop) this.onStop(transcript);
        }
    }

    /**
     * Start the recording timer
     */
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.recordingTime++;
            const mins = Math.floor(this.recordingTime / 60);
            const secs = this.recordingTime % 60;
            const display = `${mins}:${secs.toString().padStart(2, '0')}`;
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) timerDisplay.textContent = display;
        }, 1000);
    }

    /**
     * Stop the recording timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Inject CSS styles for the widget
     */
    injectStyles() {
        if (document.getElementById('voice-notes-styles')) return;

        const style = document.createElement('style');
        style.id = 'voice-notes-styles';
        style.textContent = `
            .voice-notes-widget {
                margin: 12px 0;
            }

            .voice-notes-container {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: #242424;
                border: 1px solid #333;
                border-radius: 8px;
            }

            .voice-notes-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #333;
                border: 2px solid #444;
                color: #f5f0e8;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
                font-size: 0;
                position: relative;
            }

            .voice-notes-button:hover {
                background: #3d3d3d;
                border-color: #60a5fa;
                color: #60a5fa;
            }

            .voice-notes-button.recording {
                background: #ef4444;
                border-color: #ef4444;
                color: #fff;
                box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
                animation: pulse-ring 1.5s ease-in-out infinite;
            }

            .voice-notes-button svg {
                width: 24px;
                height: 24px;
                display: inline;
            }

            .pulse {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                animation: blink 1s ease-in-out infinite;
            }

            @keyframes blink {
                0%, 50%, 100% { opacity: 1; }
                25%, 75% { opacity: 0.3; }
            }

            @keyframes pulse-ring {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }

            .voice-notes-timer {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #ef4444;
            }

            .voice-notes-pulse {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #ef4444;
                border-radius: 50%;
                animation: blink 1s ease-in-out infinite;
            }

            .voice-notes-hint {
                font-size: 0.85rem;
                color: #888;
                flex: 1;
            }

            @media (max-width: 768px) {
                .voice-notes-button {
                    width: 56px;
                    height: 56px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Create unsupported message
     */
    createUnsupportedMessage() {
        const msg = document.createElement('div');
        msg.style.cssText = 'padding: 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; font-size: 0.85rem; margin: 12px 0;';
        msg.textContent = '🎤 Voice notes not supported on this browser. Please use Chrome, Edge, or Safari.';
        this.container.appendChild(msg);
    }

    /**
     * Destroy the widget
     */
    destroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.isRecording) VoiceNotes.stopRecording();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceNotes, VoiceNotesUI };
}
