import gsap from 'gsap';
import { TranslinkLanguageController } from '../controllers/TranslinkLanguageController';

/**
 * TranslinkLiveFeedPopup
 *
 * A futuristic cybernetic HUD-style diagnostics interface.
 * Implements advanced 3D parallax spring interactions, holographic scan sweeps, 
 * rotating radar reticles, and custom industrial technical layouts.
 */
export class TranslinkLiveFeedPopup {
    private element: HTMLElement | null = null;

    constructor(
        private id: string,
        private title: string,
        private description: string,
        private tags: string[]
    ) {}

    private static injectStyles(): void {
        const id = 'tl-popup-css';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            @keyframes hudLineDraw {
                from { stroke-dashoffset: 200; }
                to { stroke-dashoffset: 0; }
            }
            @keyframes hudPulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
            }
            @keyframes scanningLine {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            @keyframes blinkDot {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
            @keyframes spinClockwise {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes spinCounterClockwise {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(-360deg); }
            }
            .hologram-scan {
                position: absolute;
                left: 0;
                width: 100%;
                height: 5px;
                background: linear-gradient(180deg, transparent, rgba(0, 210, 255, 0.35), transparent);
                box-shadow: 0 0 10px rgba(0, 210, 255, 0.6);
                animation: scanningLine 3.5s linear infinite;
                pointer-events: none;
                z-index: 5;
            }
            .glow-cyan {
                text-shadow: none;
            }
            .glow-crimson {
                text-shadow: none;
            }
            html.dark .glow-cyan {
                text-shadow: 0 0 10px rgba(0, 210, 255, 0.35);
            }
            html.dark .glow-crimson {
                text-shadow: 0 0 10px rgba(192, 32, 47, 0.5);
            }
            .hud-desc-scroll::-webkit-scrollbar {
                width: 3px;
            }
            .hud-desc-scroll::-webkit-scrollbar-track {
                background: transparent;
            }
            .hud-desc-scroll::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.3);
                border-radius: 2px;
            }
            .hud-desc-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(192, 32, 47, 0.6);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Synthesize procedural low-to-high cyber chime on popup open
     */
    private _playOpenBeep(): void {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) {
            try {
                const ctx = new AC();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                const now = ctx.currentTime;
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
                
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                osc.start(now);
                osc.stop(now + 0.2);
            } catch (e) {
                console.log('[HUD] Audio play blocked by browser autoplay policy.');
            }
        }
    }

    /**
     * Synthesize procedural high-to-low cyber chime on popup close
     */
    private _playCloseBeep(): void {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) {
            try {
                const ctx = new AC();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                const now = ctx.currentTime;
                osc.frequency.setValueAtTime(950, now);
                osc.frequency.exponentialRampToValueAtTime(350, now + 0.15);
                
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                osc.start(now);
                osc.stop(now + 0.2);
            } catch (e) {}
        }
    }

    /**
     * Build the HUD popup element on demand.
     */
    public create(): HTMLElement {
        TranslinkLiveFeedPopup.injectStyles();
        const lang = TranslinkLanguageController.getInstance();
        const popup = document.createElement('div');
        popup.id = `live-feed-popup-${this.id}`;

        // Highly responsive sizing keeping the aspect ratio beautifully while preventing vertical bleed
        const baseClasses =
            'flex fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-auto opacity-0 scale-95 origin-center overflow-visible';

        // MAPPING: Section ID -> Language Key Paths & Image Asset
        const mapping: Record<string, { title: string; desc: string; tags: string; img: string }> =
            {
                s1: {
                    title: 'sections.s1.card1_title',
                    desc: 'sections.s1.card1_desc',
                    tags: 'sections.s1.card1_tags',
                    img: 'gps.webp',
                }, // TELEMATICS
                s2: {
                    title: 'sections.s1.card1_title',
                    desc: 'sections.s1.card1_desc',
                    tags: 'sections.s1.card1_tags',
                    img: 'gps.webp',
                }, // ASSETS-REAL-TIME-TRACKING
                s3: {
                    title: 'sections.s1.card2_title',
                    desc: 'sections.s1.card2_desc',
                    tags: 'sections.s1.card2_tags',
                    img: 'fuel.webp',
                }, // REAL-TIME-FUEL-MONITORING
                s4: {
                    title: 'sections.s6.card1_title',
                    desc: 'sections.s6.card1_desc',
                    tags: 'sections.s6.card1_tags',
                    img: 'can.webp',
                }, // VEHICLE HEALTH & DIAGNOSTICS
                s5: {
                    title: 'sections.s2.card1_title',
                    desc: 'sections.s2.card1_desc',
                    tags: 'sections.s2.card1_tags',
                    img: 'dashcam_black.webp',
                }, // AI-DRIVEN VIDEO TELEMATICS
                s6: {
                    title: 'sections.s4.card2_title',
                    desc: 'sections.s4.card2_desc',
                    tags: 'sections.s4.card2_tags',
                    img: 'rfid.webp',
                }, // SMART IOT SOLUTIONS
                s7: {
                    title: 'sections.s9.popup_title',
                    desc: 'sections.s9.popup_description',
                    tags: 'sections.s9.popup_tags',
                    img: 'dashcam_black.webp',
                }, // AI-DRIVEN VIDEO TELEMATICS
                s8: {
                    title: 'sections.s8.popup_title',
                    desc: 'sections.s8.popup_description',
                    tags: 'sections.s8.popup_tags',
                    img: 'rfid.webp',
                }, // ONE-STOP IoT SOLUTIONS
                s9: {
                    title: 'sections.s10.popup_title',
                    desc: 'sections.s10.popup_description',
                    tags: 'sections.s10.popup_tags',
                    img: 'safety.webp',
                }, // 24/7 SUPPORT
                s10: {
                    title: 'sections.s2.card2_title',
                    desc: 'sections.s2.card2_desc',
                    tags: 'sections.s2.card2_tags',
                    img: 'safety.webp',
                }, // 24/7 CONNECT
            };

        const config = mapping[this.id];

        if (config) {
            popup.className = `${baseClasses} w-[92vw] sm:w-[85vw] max-w-[410px] h-[80vh] max-h-[610px] bg-transparent`;
            const tags = lang.tArray(config.tags);

            popup.innerHTML = `
                <div class="hud-frame relative flex flex-col w-full h-full bg-[#fcfbfa]/96 dark:bg-[#07090f]/90 backdrop-blur-2xl rounded-2xl p-2.5 overflow-hidden shadow-[0_24px_55px_-12px_rgba(22,22,22,0.08),0_4px_18px_rgba(22,22,22,0.03)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95),0_0_40px_rgba(0,210,255,0.02)] group transition-all duration-500 hover:shadow-[0_32px_64px_-10px_rgba(22,22,22,0.14)] dark:hover:shadow-[0_36px_72px_-12px_rgba(0,0,0,0.98),0_0_50px_rgba(192,32,47,0.1)] hover:-translate-y-1" style="transform-style: preserve-3d;">
                    
                    <!-- HUD Cyber Glow Ambient Aura -->
                    <div class="absolute -inset-10 bg-gradient-to-tr from-[var(--brand-cyan)]/5 to-[var(--brand-crimson)]/5 blur-2xl opacity-40 pointer-events-none z-0"></div>

                    <!-- HUD Technical Grid Overlay -->
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style="background-image: radial-gradient(circle, #00d2ff 1px, transparent 1px); background-size: 16px 16px;"></div>

                    <!-- HUD Top Spec Readout Bar -->
                    <div class="flex items-center justify-between px-3 py-2 text-[8.5px] font-mono text-slate-500 dark:text-[var(--brand-cyan)]/70 tracking-widest uppercase relative z-20">
                        <div class="flex items-center gap-2 font-bold">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[blinkDot_1.5s_infinite] shadow-[0_0_6px_#10b981]"></span>
                            <span>TL-DIAG: SECURE</span>
                        </div>
                        <div class="text-slate-400 dark:text-white/40 tracking-wider">SYS_REF_800X</div>
                    </div>

                    <!-- HUD Diagnostic Connecting Path Node Markers -->
                    <svg class="absolute inset-0 w-full h-full pointer-events-none z-[5]" viewBox="0 0 100 160" fill="none">
                        <!-- Hardware Node Marker -->
                        <circle cx="45" cy="40" r="1.8" stroke="var(--brand-crimson)" stroke-width="0.4" class="opacity-60"/>
                        <circle cx="45" cy="40" r="0.6" fill="var(--brand-crimson)" class="opacity-80"/>
                        <!-- Card Node Marker -->
                        <circle cx="15" cy="95" r="1.8" stroke="var(--brand-crimson)" stroke-width="0.4" class="opacity-60"/>
                        <circle cx="15" cy="95" r="0.6" fill="var(--brand-crimson)" class="opacity-80"/>
                    </svg>

                    <!-- Top Section: Hardware Asset Viewer (52% height) -->
                    <div class="relative w-full h-[52%] flex items-center justify-center p-4 md:p-6 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 overflow-hidden" style="transform-style: preserve-3d;">
                        
                        <!-- Rotating High-Tech Reticle Background (Triple Concentric Rings) -->
                        <div class="absolute w-[200px] h-[200px] rounded-full border border-dashed border-slate-300/40 dark:border-[var(--brand-cyan)]/10 animate-[spinClockwise_32s_linear_infinite] flex items-center justify-center pointer-events-none">
                            <div class="w-[160px] h-[160px] rounded-full border border-slate-200/30 dark:border-[var(--brand-cyan)]/5"></div>
                        </div>
                        <div class="absolute w-[130px] h-[130px] rounded-full border border-dashed border-slate-300/30 dark:border-[var(--brand-crimson)]/8 animate-[spinCounterClockwise_16s_linear_infinite] pointer-events-none"></div>
                        <div class="absolute w-[90px] h-[90px] rounded-full border border-dotted border-slate-300/50 dark:border-[var(--brand-cyan)]/15 animate-[spinClockwise_8s_linear_infinite] pointer-events-none"></div>
                        
                        <!-- Crosshair Overlay Lines -->
                        <div class="absolute w-[220px] h-[1px] bg-gradient-to-r from-transparent via-slate-300/50 dark:via-[var(--brand-cyan)]/15 to-transparent pointer-events-none"></div>
                        <div class="absolute h-[220px] w-[1px] bg-gradient-to-b from-transparent via-slate-300/50 dark:via-[var(--brand-cyan)]/15 to-transparent pointer-events-none"></div>

                        <!-- Scanline Effect -->
                        <div class="hologram-scan"></div>

                        <img src="/images/servicescards/${config.img}" alt="${lang.t(config.title)}" class="max-w-[85%] max-h-[85%] object-contain pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-108 group-hover:-translate-y-2 drop-shadow-[0_15px_25px_rgba(0,0,0,0.65)]" style="transform: translateZ(50px);">
                        
                        <!-- Dynamic Coordinate readouts (simulating active tracking ticks) -->
                        <div class="hud-lat absolute top-4 left-4 font-mono text-[7.5px] text-slate-400 dark:text-[var(--brand-cyan)]/50 tracking-wider">
                            + 9.0128° N
                        </div>
                        <div class="hud-lon absolute bottom-4 right-4 font-mono text-[7.5px] text-slate-400 dark:text-[var(--brand-cyan)]/50 tracking-wider">
                            + 38.7468° E
                        </div>
                    </div>

                    <!-- Bottom Section: Technical UI Text Panel (48% height) - Elevated Layered Depth -->
                    <div class="relative w-full h-[48%] p-5 md:p-6 bg-slate-100/60 dark:bg-slate-900/45 backdrop-blur-md rounded-xl z-20 flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-md" style="transform: translateZ(25px);">
                        
                        <!-- Pulse Overlay Glow -->
                        <div class="absolute inset-0 bg-gradient-to-b from-[var(--brand-cyan)]/5 to-transparent pointer-events-none z-0"></div>

                        <div class="flex flex-col h-full justify-between relative z-10">
                            <div>
                                <!-- Header Status Row -->
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-mono text-[8px] tracking-[0.2em] text-[var(--brand-cyan)] font-extrabold uppercase flex items-center gap-1.5">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]"></span>
                                        LIVE STREAMING: <span class="hz-ticker text-slate-700 dark:text-white/90 font-bold">59.8</span> HZ
                                    </span>
                                    <div class="flex gap-1">
                                        <span class="px-1.5 py-0.5 rounded-[3px] bg-[var(--brand-crimson)]/10 dark:bg-[var(--brand-crimson)]/20 text-[7px] font-mono text-[var(--brand-crimson)] font-bold tracking-widest">SECURE</span>
                                    </div>
                                </div>

                                <!-- Title -->
                                <h3 class="font-outfit font-black text-xl md:text-2xl tracking-tight text-slate-900 dark:text-white mb-2 uppercase leading-none transition-colors duration-500 group-hover:text-[var(--brand-crimson)] glow-cyan group-hover:glow-crimson">${lang.t(config.title)}</h3>
                                
                                <!-- Futuristic Pill Tags (Borderless) -->
                                <div class="flex flex-wrap gap-1.5 mb-2.5">
                                    ${tags
                                        .slice(0, 3)
                                        .map(
                                            (tag) => `
                                        <span class="px-2 py-0.5 bg-slate-200/60 dark:bg-[var(--brand-cyan)]/10 rounded-[4px] text-[8px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-[var(--brand-cyan)] transition-all duration-300 hover:bg-[var(--brand-crimson)]/15 hover:text-slate-900 dark:hover:bg-[var(--brand-crimson)]/25 dark:hover:text-white cursor-default whitespace-nowrap">${tag}</span>
                                    `
                                        )
                                        .join('')}
                                </div>

                                <!-- Description -->
                                <p class="hud-desc-scroll text-[10px] md:text-[10.5px] leading-relaxed text-slate-600 dark:text-slate-300 font-mono tracking-tight text-left max-h-[70px] md:max-h-[85px] overflow-y-auto pr-1">
                                    ${lang.t(config.desc)}
                                </p>
                            </div>

                            <!-- Bottom Diagnostic Bar -->
                            <div class="pt-2 mt-2">
                                <div class="flex justify-between items-center text-[7.5px] font-mono text-slate-505 dark:text-slate-400 mb-1">
                                    <span>DATA LINK: SECURE</span>
                                    <span class="text-[var(--brand-cyan)] font-extrabold animate-pulse">TRANSLINK CORE v3.0</span>
                                </div>
                                <div class="w-full h-1.5 bg-black/10 dark:bg-black/40 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-crimson)] rounded-full transition-all duration-1000 w-[85%] group-hover:w-[100%] shadow-[0_0_8px_rgba(0,210,255,0.4)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Close Trigger (Tech crosshair button - borderless) -->
                    <button class="popup-close-trigger absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all duration-300 bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-900/80 dark:hover:bg-[var(--brand-crimson)]/30 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:rotate-90 z-[70] shadow-sm dark:shadow-[0_0_15px_rgba(192,32,47,0.15)] backdrop-blur-md">
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            // Default: Fallback card with sleek HUD styling
            popup.className = `${baseClasses} w-[92vw] max-w-[420px] bg-transparent`;
            popup.innerHTML = `
                <div class="hud-frame relative flex flex-col w-full bg-[#fcfbfa]/96 dark:bg-[#07090f]/90 backdrop-blur-2xl rounded-2xl p-5 shadow-[0_24px_55px_-12px_rgba(22,22,22,0.08),0_4px_18px_rgba(22,22,22,0.03)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95),0_0_40px_rgba(0,210,255,0.02)] group transition-all duration-500 hover:shadow-[0_32px_64px_-10px_rgba(22,22,22,0.14)] dark:hover:shadow-[0_36px_72px_-12px_rgba(0,0,0,0.98),0_0_50px_rgba(192,32,47,0.1)] hover:-translate-y-1" style="transform-style: preserve-3d;">
                    
                    <div class="flex flex-col gap-4 relative z-10 text-left" style="transform: translateZ(25px);">
                        <!-- Header Status Row -->
                        <div class="flex items-center justify-between pb-2">
                            <span class="font-mono text-[8px] tracking-[0.25em] text-slate-500 dark:text-[var(--brand-cyan)] font-extrabold uppercase">TL_SEC_GEN_SYS</span>
                            <div class="flex gap-1.5">
                                <div class="w-1.5 h-1.5 bg-slate-400 dark:bg-[var(--brand-cyan)] rounded-full animate-pulse shadow-[0_0_5px_var(--brand-cyan)]"></div>
                            </div>
                        </div>

                        <!-- Title -->
                        <h3 class="text-2xl font-outfit font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1 group-hover:text-[var(--brand-crimson)] transition-colors duration-500 glow-cyan group-hover:glow-crimson">${this.title}</h3>
                        
                        <!-- Futuristic pill tags (borderless) -->
                        <div class="flex flex-wrap gap-1.5">
                            ${this.tags
                                .map(
                                    (tag) => `
                                <span class="px-2.5 py-0.5 bg-slate-200/60 dark:bg-[var(--brand-cyan)]/10 rounded-[4px] text-[8px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-[var(--brand-cyan)] transition-all duration-300 cursor-default whitespace-nowrap">${tag}</span>
                            `
                                )
                                .join('')}
                        </div>

                        <!-- Description -->
                        <p class="hud-desc-scroll text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-mono tracking-tight pr-1 overflow-y-auto max-h-[140px] scrollbar-thin scrollbar-track-transparent">
                            ${this.description}
                        </p>

                        <!-- Bottom Diagnostic Bar -->
                        <div class="pt-2.5 mt-1 flex justify-between items-center text-[7px] font-mono text-slate-500 dark:text-slate-400">
                            <span>DATA LINK: SECURE</span>
                            <span class="text-[var(--brand-cyan)] font-extrabold animate-pulse">TRANSLINK CORE v3.0</span>
                        </div>
                    </div>

                    <!-- Close Trigger (Borderless) -->
                    <button class="popup-close-trigger absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all duration-300 bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-900/80 dark:hover:bg-[var(--brand-crimson)]/30 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:rotate-90 z-[70] shadow-sm dark:shadow-[0_0_15px_rgba(192,32,47,0.15)] backdrop-blur-md">
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `;
        }

        // 1. Play procedural low-to-high swoop beep chime
        this._playOpenBeep();

        // 2. Telemetry Coordinate Live-Flickering engine & Live frequency ticker
        const latEl = popup.querySelector('.hud-lat');
        const lonEl = popup.querySelector('.hud-lon');
        if (latEl && lonEl) {
            const flickerInterval = setInterval(() => {
                // Ensure elements are still in the DOM before updating
                if (!document.body.contains(popup)) {
                    clearInterval(flickerInterval);
                    return;
                }
                const latVal = (9.0128 + (Math.random() - 0.5) * 0.0006).toFixed(4);
                const lonVal = (38.7468 + (Math.random() - 0.5) * 0.0006).toFixed(4);
                latEl.textContent = `+ ${latVal}° N`;
                lonEl.textContent = `+ ${lonVal}° E`;
            }, 400);
        }

        const hzEl = popup.querySelector('.hz-ticker');
        if (hzEl) {
            const hzInterval = setInterval(() => {
                if (!document.body.contains(popup)) {
                    clearInterval(hzInterval);
                    return;
                }
                const hzVal = (59.7 + Math.random() * 0.5).toFixed(1);
                hzEl.textContent = hzVal;
            }, 300);
        }

        // 3. Play close chime when the close button is clicked
        popup.querySelector('.popup-close-trigger')?.addEventListener('click', () => {
            this._playCloseBeep();
        });

        // 4. Interactive 3D Parallax Tilt Effect with GSAP spring
        popup.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = popup.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            
            // Calculate tilt angle (max 8 degrees)
            const angleX = -(y - yc) / (yc / 6);
            const angleY = (x - xc) / (xc / 6);
            
            const card = popup.querySelector('.hud-frame') as HTMLElement;
            if (card) {
                gsap.to(card, {
                    rotationX: angleX,
                    rotationY: angleY,
                    ease: 'power2.out',
                    duration: 0.3,
                    transformPerspective: 1000
                });
            }
        });
        
        popup.addEventListener('mouseleave', () => {
            const card = popup.querySelector('.hud-frame') as HTMLElement;
            if (card) {
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    ease: 'power3.out',
                    duration: 0.5
                });
            }
        });

        this.element = popup;
        return popup;
    }

    getElement(): HTMLElement | null {
        return this.element;
    }
}
