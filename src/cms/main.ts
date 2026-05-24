/* ==========================================================================
   TRANSLINK CMS - CONTROLLER ENGINE (FOUR-DATABASE DYNAMIC TS CONTROLLER)
   ========================================================================== */

interface LanguageConfig {
    languages: Record<string, number>;
    [key: string]: any;
}

class TranslinkCMS {
    // Config files states (original and active)
    private originalConfig!: LanguageConfig;
    private currentConfig!: LanguageConfig;
    
    private originalMeshBehavior!: any;
    private currentMeshBehavior!: any;
    
    private originalMeshMaterial!: any;
    private currentMeshMaterial!: any;

    private originalCamera!: any;
    private currentCamera!: any;

    private originalVoice!: any;
    private currentVoice!: any;

    private originalKnowledge!: any;
    private currentKnowledge!: any;

    private originalKnowledgeMd!: string;
    private currentKnowledgeMd!: string;
    
    // UI state
    private activeMode: 'lang' | '3d' | 'camera' | 'voice' = 'lang'; // 'lang', '3d', 'camera', 'voice'
    private activeLangTab: string = 'en'; // 'en', 'am', 'ar'
    private activeNavGroup: string = 'global'; // 'global', 'sections', 'waypoints', 'behavior-defaults', 'behavior-meshes', 'material-aesthetics', 'camera-desktop', 'camera-tablet', 'raw', 'raw-behavior', 'raw-material', 'raw-camera'
    private activeNavId: string = 'global'; 
    
    // Elements Cache
    private appEl!: HTMLElement;
    private saveBtn!: HTMLButtonElement;
    private discardBtn!: HTMLButtonElement;
    private exportBtn!: HTMLButtonElement;
    private dirtyBadge!: HTMLElement;
    private mainContentEl!: HTMLElement;
    
    // Waypoints Mapping for Human Readable Labels
    private readonly waypointLabels: Record<string, string> = {
        'fuel-head': 'Sensor Head',
        'harness': 'Wiring Harness',
        'base-mount': 'Mounting Base',
        'precision-tracking': 'Precision Probe',
        'iot-sensor': 'IoT Module',
        'vision-ai': 'Vision AI',
        'contact': 'Contact Us',
        'visit-us': 'Visit Us',
        'security-bolt': 'Security Bolt',
        'precision-filter': 'Precision Filter'
    };

    // Sections Mapping for Human Readable Labels
    private readonly sectionLabels: Record<string, string> = {
        's1': 'Hero & Overview',
        's2': 'Real-Time Tracking',
        's3': 'Fuel Management',
        's4': 'CAN/OBD Analytics',
        's5': 'AI Video Safety',
        's6': 'Smart IoT Solutions',
        's7': 'Sensor Network',
        's8': 'AI / IoT Edge',
        's9': 'Video Telematics',
        's10': '24/7 Connect'
    };

    constructor() {
        this.init();
    }

    private async init() {
        this.appEl = document.getElementById('app')!;
        
        try {
            await this.loadConfig();
            this.hideLoader();
            this.renderDashboard();
            this.showToast('CMS multi-database engine active', 'success');
        } catch (error: any) {
            console.error('[CMS] Initialization failed:', error);
            this.showToast(`Failed to load databases: ${error.message}`, 'error');
            this.appEl.innerHTML = `
                <div class="cms-loading-wrapper">
                    <div class="cms-loader-text" style="color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);">
                        DATABASE RETRIEVAL FAILED
                    </div>
                    <div style="color: var(--text-secondary); margin-top: 10px; font-size: 13px; font-family: monospace;">
                        ${error.message || 'Check local Vite server or file system paths.'}
                    </div>
                    <button class="cms-btn cms-btn-primary" style="margin-top: 20px;" onclick="window.location.reload()">
                        Retry Engine Initialize
                    </button>
                </div>
            `;
        }
    }

    // Parallel loading of configurations
    private async loadConfig() {
        const fetchJSON = async (devUrl: string, staticUrl: string) => {
            try {
                const response = await fetch(devUrl);
                if (!response.ok) throw new Error();
                return await response.json();
            } catch {
                const response = await fetch(staticUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            }
        };

        const fetchText = async (devUrl: string, staticUrl: string) => {
            try {
                const response = await fetch(devUrl);
                if (!response.ok) throw new Error();
                return await response.text();
            } catch {
                const response = await fetch(staticUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.text();
            }
        };

        const [langData, behaviorData, materialData, cameraData, voiceData, knowledgeData, knowledgeMdData] = await Promise.all([
            fetchJSON('/api/config/language', '/src/translinkconfig/language_config.json'),
            fetchJSON('/api/config/mesh/behavior', '/src/translinkconfig/mesh_behavior_config.json'),
            fetchJSON('/api/config/mesh/material', '/src/translinkconfig/mesh_material_config.json'),
            fetchJSON('/api/config/camera', '/src/translinkconfig/camera_config.json'),
            fetchJSON('/api/config/voice', '/src/translinkconfig/live-voice/voice_config.json'),
            fetchJSON('/api/config/knowledge', '/src/translinkconfig/live-voice/knowledge_config.json'),
            fetchText('/api/config/knowledge-md', '/src/translinkconfig/live-voice/knowledge.md')
        ]);

        // Isolate current & original deep states
        this.originalConfig = JSON.parse(JSON.stringify(langData));
        this.currentConfig = JSON.parse(JSON.stringify(langData));

        this.originalMeshBehavior = JSON.parse(JSON.stringify(behaviorData));
        this.currentMeshBehavior = JSON.parse(JSON.stringify(behaviorData));

        this.originalMeshMaterial = JSON.parse(JSON.stringify(materialData));
        this.currentMeshMaterial = JSON.parse(JSON.stringify(materialData));

        this.originalCamera = JSON.parse(JSON.stringify(cameraData));
        this.currentCamera = JSON.parse(JSON.stringify(cameraData));

        this.originalVoice = JSON.parse(JSON.stringify(voiceData));
        this.currentVoice = JSON.parse(JSON.stringify(voiceData));

        this.originalKnowledge = JSON.parse(JSON.stringify(knowledgeData));
        this.currentKnowledge = JSON.parse(JSON.stringify(knowledgeData));

        this.originalKnowledgeMd = knowledgeMdData;
        this.currentKnowledgeMd = knowledgeMdData;
    }

    private hideLoader() {
        const loader = document.querySelector('.cms-loading-wrapper');
        if (loader) {
            loader.classList.add('hide');
            setTimeout(() => loader.remove(), 400);
        }
    }

    /* --- Core Dashboard Structure --- */
    private renderDashboard() {
        this.appEl.innerHTML = `
            <div class="cms-dashboard">
                <!-- Sidebar Nav Group -->
                <aside class="cms-sidebar" id="cmsSidebar">
                    <div class="cms-brand">
                        <div class="cms-brand-logo">T</div>
                        <div class="cms-brand-name">TRANSLINK</div>
                        <span class="cms-brand-badge">CMS</span>
                    </div>

                    <!-- Global Mode Switches Tab -->
                    <div class="cms-sidebar-modes">
                        <button class="cms-sidebar-mode-btn active" id="modeBtnLang">Copy Editor</button>
                        <button class="cms-sidebar-mode-btn" id="modeBtn3d">3D Meshes</button>
                        <button class="cms-sidebar-mode-btn" id="modeBtnCamera">Camera Path</button>
                        <button class="cms-sidebar-mode-btn" id="modeBtnVoice">Live Voice</button>
                    </div>

                    <!-- Languages Toggle Panel (Only for Copy Editor) -->
                    <div class="cms-lang-toggles" id="sidebarLangToggles">
                        <div class="cms-section-label">ACTIVE LANGUAGES</div>
                        <div id="activeLangsList"></div>
                    </div>

                    <!-- Sidebar Navigation Container -->
                    <nav class="cms-nav" id="cmsSidebarNav"></nav>

                    <div class="cms-sidebar-footer">
                        <span class="cms-footer-text">Translink CMS v1.2.0</span>
                    </div>
                </aside>

                <!-- Main Section Workspace -->
                <main class="cms-main-content">
                    <header class="cms-header">
                        <div class="cms-header-title-wrapper">
                            <button class="cms-menu-toggle" id="sidebarToggle" aria-label="Toggle Menu">☰</button>
                            <div>
                                <h1 class="cms-header-title" id="cmsHeaderTitle">Language Config Editor</h1>
                                <p class="cms-header-subtitle" id="cmsHeaderSubtitle">Direct, visual editing of website localization copy</p>
                            </div>
                        </div>

                        <div class="cms-header-actions">
                            <div class="cms-dirty-badge" id="cmsDirtyBadge" style="display: none;">
                                <div class="cms-toast-icon"></div>
                                <span id="dirtyCountText">0 pending changes</span>
                            </div>
                            <button class="cms-btn cms-btn-secondary" id="cmsExportBtn">
                                <span>Export JSON</span>
                            </button>
                            <button class="cms-btn cms-btn-secondary" id="cmsDiscardBtn" disabled>Discard</button>
                            <button class="cms-btn cms-btn-primary" id="cmsSaveBtn" disabled>Save Changes</button>
                        </div>
                    </header>

                    <!-- Language Tab Selectors (Only for Copy Editor) -->
                    <div class="cms-lang-tabs">
                        <div class="cms-lang-tab active" data-lang="en">ENGLISH</div>
                        <div class="cms-lang-tab" data-lang="am">AMHARIC</div>
                        <div class="cms-lang-tab" data-lang="ar">ARABIC</div>
                    </div>

                    <!-- Inner Workspace body -->
                    <div class="cms-workspace-body" id="cmsWorkspaceBody"></div>
                </main>
            </div>
            <div class="cms-toast-container" id="cmsToastContainer"></div>
        `;

        // Cache Elements
        this.saveBtn = document.getElementById('cmsSaveBtn') as HTMLButtonElement;
        this.discardBtn = document.getElementById('cmsDiscardBtn') as HTMLButtonElement;
        this.exportBtn = document.getElementById('cmsExportBtn') as HTMLButtonElement;
        this.dirtyBadge = document.getElementById('cmsDirtyBadge')!;
        this.mainContentEl = document.getElementById('cmsWorkspaceBody')!;

        // Register Global Handlers
        this.setupEventListeners();
        this.renderSidebarNav();
        this.renderActiveLanguagesList();
        this.renderActiveWorkspace();
        this.updateChangesCount();
    }

    private setupEventListeners() {
        // Toggle Sidebar Drawer on mobile
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('cmsSidebar')?.classList.toggle('active');
        });

        // Close sidebar drawer if clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const sidebar = document.getElementById('cmsSidebar');
            const toggle = document.getElementById('sidebarToggle');
            if (sidebar?.classList.contains('active') && !sidebar.contains(target) && !toggle?.contains(target)) {
                sidebar.classList.remove('active');
            }
        });

        // Mode Switching
        const modeBtnLang = document.getElementById('modeBtnLang')!;
        const modeBtn3d = document.getElementById('modeBtn3d')!;
        const modeBtnCamera = document.getElementById('modeBtnCamera')!;
        const modeBtnVoice = document.getElementById('modeBtnVoice')!;

        const resetHeaderAndLangPanel = (mode: 'lang' | '3d' | 'camera' | 'voice') => {
            this.activeMode = mode;
            const tabs = document.querySelector('.cms-lang-tabs') as HTMLElement;
            const langToggles = document.getElementById('sidebarLangToggles')!;

            // Remove active classes
            modeBtnLang.classList.remove('active');
            modeBtn3d.classList.remove('active');
            modeBtnCamera.classList.remove('active');
            modeBtnVoice.classList.remove('active');

            if (mode === 'lang') {
                modeBtnLang.classList.add('active');
                langToggles.style.display = 'block';
                tabs.style.display = 'flex';
                
                this.activeNavGroup = 'global';
                this.activeNavId = 'global';
                
                document.getElementById('cmsHeaderTitle')!.textContent = 'Language Config Editor';
                document.getElementById('cmsHeaderSubtitle')!.textContent = 'Direct, visual editing of website localization copy';
            } else if (mode === '3d') {
                modeBtn3d.classList.add('active');
                langToggles.style.display = 'none';
                tabs.style.display = 'none';
                
                this.activeNavGroup = 'behavior-defaults';
                this.activeNavId = 'behavior-defaults';
                
                document.getElementById('cmsHeaderTitle')!.textContent = '3D Canvas Mesh Editor';
                document.getElementById('cmsHeaderSubtitle')!.textContent = 'Interactive editing of mesh default behaviors and material aesthetics';
            } else if (mode === 'camera') {
                modeBtnCamera.classList.add('active');
                langToggles.style.display = 'none';
                tabs.style.display = 'none';
                
                this.activeNavGroup = 'camera-desktop';
                this.activeNavId = 'camera-desktop';
                
                document.getElementById('cmsHeaderTitle')!.textContent = 'Camera Animation Path Editor';
                document.getElementById('cmsHeaderSubtitle')!.textContent = 'Tune scroll-driven PBR camera framing keyframes and lookAt focus coordinates';
            } else {
                modeBtnVoice.classList.add('active');
                langToggles.style.display = 'none';
                tabs.style.display = 'none';
                
                this.activeNavGroup = 'voice-settings';
                this.activeNavId = 'voice-settings';
                
                document.getElementById('cmsHeaderTitle')!.textContent = 'Gemini Live Voice & RAG Configs';
                document.getElementById('cmsHeaderSubtitle')!.textContent = 'Tune active voice speakers, sync domain frequencies, memory retention, and assistant knowledge RAG manual';
            }

            this.renderSidebarNav();
            this.renderActiveWorkspace();
            this.updateChangesCount();
        };

        modeBtnLang.addEventListener('click', () => resetHeaderAndLangPanel('lang'));
        modeBtn3d.addEventListener('click', () => resetHeaderAndLangPanel('3d'));
        modeBtnCamera.addEventListener('click', () => resetHeaderAndLangPanel('camera'));
        modeBtnVoice.addEventListener('click', () => resetHeaderAndLangPanel('voice'));

        // Save, Discard, and Download actions
        this.saveBtn.addEventListener('click', () => this.saveChanges());
        this.discardBtn.addEventListener('click', () => this.discardChanges());
        this.exportBtn.addEventListener('click', () => this.exportConfig());

        // Language translation tabs switches
        const tabs = document.querySelectorAll('.cms-lang-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeLangTab = tab.getAttribute('data-lang')!;
                this.renderActiveWorkspace();
            });
        });

        // Sidebar navigation list routing
        this.appEl.addEventListener('click', (e) => {
            const navItem = (e.target as HTMLElement).closest('.cms-nav-item');
            if (navItem) {
                document.querySelectorAll('.cms-nav-item').forEach(el => el.classList.remove('active'));
                navItem.classList.add('active');
                
                this.activeNavGroup = navItem.getAttribute('data-group')!;
                this.activeNavId = navItem.getAttribute('data-id')!;
                
                // Close mobile sidebar drawer
                document.getElementById('cmsSidebar')?.classList.remove('active');
                
                this.renderActiveWorkspace();
            }
        });

        // 1. Delete Keyframe Event (delegated)
        this.mainContentEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const deleteBtn = target.closest('.cms-keyframe-delete');
            if (deleteBtn) {
                const globalIdx = parseInt(deleteBtn.getAttribute('data-global-idx')!);
                const isTablet = this.activeNavGroup === 'camera-tablet';
                const isMobile = this.activeNavGroup === 'camera-mobile';
                const timelineKey = isTablet 
                    ? 'cameraKeyframesTablet' 
                    : isMobile 
                        ? 'cameraKeyframesMobile' 
                        : 'cameraKeyframesDesktop';
                
                const keyframes = this.currentCamera[timelineKey] || [];
                if (confirm(`Are you sure you want to delete Keyframe #${globalIdx + 1}?`)) {
                    keyframes.splice(globalIdx, 1);
                    this.currentCamera[timelineKey] = keyframes;
                    
                    this.showToast('Keyframe deleted from timeline', 'info');
                    this.updateChangesCount();
                    this.renderCameraTimelineWorkspace();
                }
            }
        });

        // 2. Add Keyframe Event (delegated)
        this.mainContentEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const addBtn = target.closest('.cms-timeline-section-header-btn');
            if (addBtn) {
                const secName = addBtn.getAttribute('data-section-name')!;
                const isTablet = this.activeNavGroup === 'camera-tablet';
                const isMobile = this.activeNavGroup === 'camera-mobile';
                const timelineKey = isTablet 
                    ? 'cameraKeyframesTablet' 
                    : isMobile 
                        ? 'cameraKeyframesMobile' 
                        : 'cameraKeyframesDesktop';
                
                const keyframes = this.currentCamera[timelineKey] || [];
                
                // Fetch last keyframe parameters of this section to copy, or fallback defaults
                const secKeyframes = keyframes.filter((kf: any) => kf.section === secName);
                let baseKf = secKeyframes[secKeyframes.length - 1];
                if (!baseKf) {
                    baseKf = keyframes[keyframes.length - 1] || { scroll: 0.5, distance: 5, angleY: 0, angleX: 0, target: { x: 0, y: 0, z: 0 }, ease: 'gentle' };
                }

                // Injects a default keyframe slightly offset in scroll percentage
                const newKf = {
                    scroll: Math.min(1.0, baseKf.scroll + 0.01),
                    distance: baseKf.distance,
                    angleY: baseKf.angleY,
                    angleX: baseKf.angleX,
                    target: {
                        x: baseKf.target?.x || 0,
                        y: baseKf.target?.y || 0,
                        z: baseKf.target?.z || 0
                    },
                    ease: baseKf.ease,
                    section: secName
                };

                keyframes.push(newKf);
                
                // Chronological Sorting: Automatically sort keyframes array by scroll value trigger!
                keyframes.sort((a: any, b: any) => a.scroll - b.scroll);
                
                this.currentCamera[timelineKey] = keyframes;
                this.showToast(`New keyframe inserted in Section ${secName}`, 'success');
                this.updateChangesCount();
                this.renderCameraTimelineWorkspace();
            }
        });
    }

    /* --- Sidebar Nav Builders --- */
    private renderSidebarNav() {
        const navContainer = document.getElementById('cmsSidebarNav')!;
        navContainer.innerHTML = '';

        if (this.activeMode === 'lang') {
            // Render Language Navigation
            navContainer.innerHTML = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">NAVIGATION</div>
                    <div class="cms-nav-item ${this.activeNavId === 'global' ? 'active' : ''}" data-group="global" data-id="global">
                        <span>Global Layout Copy</span>
                        <span class="cms-nav-item-count" id="count-global">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">SECTIONS (S1 - S10)</div>
                    <div id="sidebarSectionsList"></div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">WAYPOINTS</div>
                    <div id="sidebarWaypointsList"></div>
                </div>

                <div class="cms-nav-group" style="margin-top: 30px;">
                    <div class="cms-section-label">ADVANCED</div>
                    <div class="cms-nav-item ${this.activeNavId === 'raw' ? 'active' : ''}" data-group="raw" data-id="raw">
                        <span>Raw JSON Code</span>
                    </div>
                </div>
            `;
            this.renderSidebarItems();
        } else if (this.activeMode === '3d') {
            // Render 3D Config Navigation
            navContainer.innerHTML = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">MESH BEHAVIORS</div>
                    <div class="cms-nav-item ${this.activeNavId === 'behavior-defaults' ? 'active' : ''}" data-group="behavior-defaults" data-id="behavior-defaults">
                        <span>Global Defaults</span>
                        <span class="cms-nav-item-count" id="count-3d-beh-def">0</span>
                    </div>
                    <div class="cms-nav-item ${this.activeNavId === 'behavior-meshes' ? 'active' : ''}" data-group="behavior-meshes" data-id="behavior-meshes">
                        <span>Meshes Overrides</span>
                        <span class="cms-nav-item-count" id="count-3d-beh-mesh">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">MESH MATERIALS</div>
                    <div class="cms-nav-item ${this.activeNavId === 'material-aesthetics' ? 'active' : ''}" data-group="material-aesthetics" data-id="material-aesthetics">
                        <span>Material Aesthetics</span>
                        <span class="cms-nav-item-count" id="count-3d-mat">0</span>
                    </div>
                </div>

                <div class="cms-nav-group" style="margin-top: 30px;">
                    <div class="cms-section-label">ADVANCED</div>
                    <div class="cms-nav-item ${this.activeNavId === 'raw-behavior' ? 'active' : ''}" data-group="raw-behavior" data-id="raw-behavior">
                        <span>Raw Behavior JSON</span>
                    </div>
                    <div class="cms-nav-item ${this.activeNavId === 'raw-material' ? 'active' : ''}" data-group="raw-material" data-id="raw-material">
                        <span>Raw Material JSON</span>
                    </div>
                </div>
            `;
        } else if (this.activeMode === 'camera') {
            // Render Camera Navigation
            navContainer.innerHTML = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">CAMERA PATH TIMELINES</div>
                    <div class="cms-nav-item ${this.activeNavId === 'camera-desktop' ? 'active' : ''}" data-group="camera-desktop" data-id="camera-desktop">
                        <span>Desktop path (16:9+)</span>
                        <span class="cms-nav-item-count" id="count-cam-desk">0</span>
                    </div>
                    <div class="cms-nav-item ${this.activeNavId === 'camera-tablet' ? 'active' : ''}" data-group="camera-tablet" data-id="camera-tablet">
                        <span>Tablet path (4:3)</span>
                        <span class="cms-nav-item-count" id="count-cam-tab">0</span>
                    </div>
                    <div class="cms-nav-item ${this.activeNavId === 'camera-mobile' ? 'active' : ''}" data-group="camera-mobile" data-id="camera-mobile">
                        <span>Mobile path (Portrait)</span>
                        <span class="cms-nav-item-count" id="count-cam-mob">0</span>
                    </div>
                </div>

                <div class="cms-nav-group" style="margin-top: 30px;">
                    <div class="cms-section-label">ADVANCED</div>
                    <div class="cms-nav-item ${this.activeNavId === 'raw-camera' ? 'active' : ''}" data-group="raw-camera" data-id="raw-camera">
                        <span>Raw Camera JSON</span>
                    </div>
                </div>
            `;
        } else {
            // Render Voice Config Navigation
            navContainer.innerHTML = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">ASSISTANT CHANNELS</div>
                    <div class="cms-nav-item ${this.activeNavId === 'voice-settings' ? 'active' : ''}" data-group="voice-settings" data-id="voice-settings">
                        <span>Voice Settings</span>
                        <span class="cms-nav-item-count" id="count-voice-sett">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">RAG SYSTEM CONFIG</div>
                    <div class="cms-nav-item ${this.activeNavId === 'knowledge-config' ? 'active' : ''}" data-group="knowledge-config" data-id="knowledge-config">
                        <span>RAG Knowledge Config</span>
                        <span class="cms-nav-item-count" id="count-voice-kn-conf">0</span>
                    </div>
                    <div class="cms-nav-item ${this.activeNavId === 'knowledge-md' ? 'active' : ''}" data-group="knowledge-md" data-id="knowledge-md">
                        <span>AI Knowledge Manual (MD)</span>
                        <span class="cms-nav-item-count" id="count-voice-kn-md">0</span>
                    </div>
                </div>

                <div class="cms-nav-group" style="margin-top: 30px;">
                    <div class="cms-section-label">ADVANCED</div>
                    <div class="cms-nav-item ${this.activeNavId === 'raw-voice' ? 'active' : ''}" data-group="raw-voice" data-id="raw-voice">
                        <span>Raw Voice JSON</span>
                    </div>
                    <div class="cms-nav-item ${this.activeNavId === 'raw-knowledge' ? 'active' : ''}" data-group="raw-knowledge" data-id="raw-knowledge">
                        <span>Raw Knowledge JSON</span>
                    </div>
                </div>
            `;
        }
    }

    private renderSidebarItems() {
        const sectionsContainer = document.getElementById('sidebarSectionsList')!;
        const waypointsContainer = document.getElementById('sidebarWaypointsList')!;
        
        // Sections S1 - S10
        sectionsContainer.innerHTML = Object.entries(this.sectionLabels).map(([id, label]) => `
            <div class="cms-nav-item ${this.activeNavId === id ? 'active' : ''}" data-group="sections" data-id="${id}">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 700; text-transform: uppercase;">${id}</span>
                    <span style="font-size: 10px; color: var(--text-secondary); font-family: var(--font-body);">${label}</span>
                </div>
                <span class="cms-nav-item-count" id="count-sec-${id}">0</span>
            </div>
        `).join('');

        // Waypoints
        waypointsContainer.innerHTML = Object.entries(this.waypointLabels).map(([id, label]) => `
            <div class="cms-nav-item ${this.activeNavId === id ? 'active' : ''}" data-group="waypoints" data-id="${id}">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600;">${label}</span>
                    <span style="font-size: 9px; color: var(--text-muted); font-family: monospace;">${id}</span>
                </div>
                <span class="cms-nav-item-count" id="count-way-${id}">0</span>
            </div>
        `).join('');
    }

    private renderActiveLanguagesList() {
        const container = document.getElementById('activeLangsList')!;
        if (!container) return;

        const langs = this.currentConfig.languages;
        container.innerHTML = Object.keys(langs).map(langCode => {
            const isChecked = langs[langCode] === 1;
            return `
                <div class="cms-lang-switch-item">
                    <span>${langCode} (${langCode === 'EN' ? 'English' : langCode === 'AM' ? 'Amharic' : 'Arabic'})</span>
                    <label class="cms-switch">
                        <input type="checkbox" id="lang-switch-${langCode}" ${isChecked ? 'checked' : ''}>
                        <span class="cms-slider"></span>
                    </label>
                </div>
            `;
        }).join('');

        // Switch toggles listeners
        Object.keys(langs).forEach(langCode => {
            const input = document.getElementById(`lang-switch-${langCode}`) as HTMLInputElement;
            input.addEventListener('change', () => {
                this.currentConfig.languages[langCode] = input.checked ? 1 : 0;
                this.updateChangesCount();
            });
        });
    }

    /* --- Workspace Render Routing --- */
    private renderActiveWorkspace() {
        this.mainContentEl.innerHTML = '';
        
        // Advanced raw editors router
        if (this.activeNavGroup.startsWith('raw')) {
            this.renderRawJSONWorkspace();
            return;
        }

        if (this.activeMode === 'lang') {
            // Render Language translation layouts
            const langData = this.currentConfig[this.activeLangTab];
            if (!langData) {
                this.mainContentEl.innerHTML = `
                    <div class="cms-view-container" style="text-align: center; padding-top: 60px;">
                        <div style="font-size: 36px;">⚠</div>
                        <h3 style="font-family: var(--font-heading); margin-top: 16px;">Language Data Missing</h3>
                        <p style="color: var(--text-secondary); margin-top: 8px;">No localization records exist for "${this.activeLangTab.toUpperCase()}"</p>
                    </div>
                `;
                return;
            }

            if (this.activeNavGroup === 'global') {
                this.renderGlobalWorkspace(langData.global);
            } else if (this.activeNavGroup === 'sections') {
                this.renderSectionsWorkspace(langData.sections[this.activeNavId]);
            } else if (this.activeNavGroup === 'waypoints') {
                this.renderWaypointsWorkspace(langData.waypoints[this.activeNavId]);
            }
        } else if (this.activeMode === '3d') {
            // Render 3D Canvas properties layouts
            if (this.activeNavGroup === 'behavior-defaults') {
                this.render3DBehaviorDefaultsWorkspace();
            } else if (this.activeNavGroup === 'behavior-meshes') {
                this.render3DBehaviorMeshesWorkspace();
            } else if (this.activeNavGroup === 'material-aesthetics') {
                this.render3DMaterialsWorkspace();
            }
        } else if (this.activeMode === 'camera') {
            // Render Camera Path configuration timelines
            this.renderCameraTimelineWorkspace();
        } else {
            // Render Live Voice configurations
            if (this.activeNavGroup === 'voice-settings') {
                this.renderVoiceSettingsWorkspace();
            } else if (this.activeNavGroup === 'knowledge-config') {
                this.renderKnowledgeConfigWorkspace();
            } else if (this.activeNavGroup === 'knowledge-md') {
                this.renderMarkdownKnowledgeWorkspace();
            }
        }
    }

    /* --- 1. Language Layout Renderers --- */
    private renderGlobalWorkspace(globalData: Record<string, string>) {
        const title = "Global Copy Settings";
        const desc = "Edit global variables like branding, common action text, loader synchronization, and structural telematics labels.";
        
        let fieldsHtml = '';
        Object.keys(globalData).forEach(key => {
            const val = globalData[key];
            const isDirty = val !== this.originalConfig[this.activeLangTab]?.global?.[key];
            
            fieldsHtml += `
                <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                    <div class="cms-field-label-row">
                        <div class="cms-field-label-wrapper">
                            <label class="cms-field-label" for="field-global-${key}">${key.replace(/_/g, ' ')}</label>
                            <span class="cms-field-key">global.${key}</span>
                        </div>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <input type="text" class="cms-input cms-input-${this.activeLangTab}" id="field-global-${key}" value="${this.escapeHtml(val)}">
                </div>
            `;
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-fields-grid">${fieldsHtml}</div>
            </div>
        `;

        // Action inputs listeners
        Object.keys(globalData).forEach(key => {
            const input = document.getElementById(`field-global-${key}`) as HTMLInputElement;
            input.addEventListener('input', () => {
                this.currentConfig[this.activeLangTab].global[key] = input.value;
                this.updateChangesCount();
                
                const card = input.closest('.cms-field-card')!;
                const isChanged = input.value !== this.originalConfig[this.activeLangTab]?.global?.[key];
                card.classList.toggle('dirty', isChanged);
                
                let badge = card.querySelector('.cms-field-dirty-marker');
                if (isChanged && !badge) {
                    card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                } else if (!isChanged && badge) {
                    badge.remove();
                }
            });
        });
    }

    private renderSectionsWorkspace(sectionData: any) {
        if (!sectionData) return;
        const sectionId = this.activeNavId;
        const title = `Section ${sectionId.substring(1).padStart(2, '0')} Copy`;
        const desc = `Edit copy text blocks and badge labels displayed inside the ${this.sectionLabels[sectionId]} section viewport.`;

        let fieldsHtml = '';
        const fields = Object.keys(sectionData).filter(k => k !== 'id');

        fields.forEach(key => {
            const val = sectionData[key];
            const originalVal = this.originalConfig[this.activeLangTab]?.sections?.[sectionId]?.[key];
            const isDirty = JSON.stringify(val) !== JSON.stringify(originalVal);

            if (Array.isArray(val)) {
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}" id="card-sec-${key}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">${key.replace(/_/g, ' ')}</label>
                                <span class="cms-field-key">sections.${sectionId}.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div class="cms-tag-editor" id="tag-editor-sec-${key}">
                            <div class="cms-tags-list" id="tags-list-sec-${key}"></div>
                            <input type="text" class="cms-tag-input" id="tag-input-sec-${key}" placeholder="+ Add tag pill...">
                        </div>
                    </div>
                `;
            } else {
                const isLongText = key.includes('desc') || key.includes('description') || val.length > 50;
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label" for="field-sec-${key}">${key.replace(/_/g, ' ')}</label>
                                <span class="cms-field-key">sections.${sectionId}.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        ${isLongText 
                            ? `<textarea class="cms-textarea cms-textarea-${this.activeLangTab} cms-textarea" id="field-sec-${key}">${this.escapeHtml(val)}</textarea>`
                            : `<input type="text" class="cms-input cms-input-${this.activeLangTab} cms-input" id="field-sec-${key}" value="${this.escapeHtml(val)}">`
                        }
                    </div>
                `;
            }
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-fields-grid">${fieldsHtml}</div>
            </div>
        `;

        // Bind handlers
        fields.forEach(key => {
            const val = sectionData[key];
            const originalVal = this.originalConfig[this.activeLangTab]?.sections?.[sectionId]?.[key];

            if (Array.isArray(val)) {
                this.setupTagEditor(`sec-${key}`, val, originalVal, (newTags) => {
                    this.currentConfig[this.activeLangTab].sections[sectionId][key] = newTags;
                    this.updateChangesCount();
                });
            } else {
                const el = document.getElementById(`field-sec-${key}`) as HTMLInputElement | HTMLTextAreaElement;
                el.addEventListener('input', () => {
                    this.currentConfig[this.activeLangTab].sections[sectionId][key] = el.value;
                    this.updateChangesCount();
                    
                    const card = el.closest('.cms-field-card')!;
                    const isChanged = el.value !== originalVal;
                    card.classList.toggle('dirty', isChanged);
                    
                    let badge = card.querySelector('.cms-field-dirty-marker');
                    if (isChanged && !badge) {
                        card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                    } else if (!isChanged && badge) {
                        badge.remove();
                    }
                });
            }
        });
    }

    private renderWaypointsWorkspace(waypointData: any) {
        if (!waypointData) return;
        const waypointId = this.activeNavId;
        const title = `Waypoint Copy: ${this.waypointLabels[waypointId]}`;
        const desc = `Edit subtitles, descriptions, and feature bullet values displayed inside the 3D canvas popups for the ${this.waypointLabels[waypointId]} node.`;

        let fieldsHtml = '';
        const fields = Object.keys(waypointData);

        fields.forEach(key => {
            const val = waypointData[key];
            const originalVal = this.originalConfig[this.activeLangTab]?.waypoints?.[waypointId]?.[key];
            const isDirty = JSON.stringify(val) !== JSON.stringify(originalVal);

            if (Array.isArray(val)) {
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}" id="card-way-${key}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">${key.replace(/_/g, ' ')}</label>
                                <span class="cms-field-key">waypoints.${waypointId}.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div class="cms-tag-editor" id="tag-editor-way-${key}">
                            <div class="cms-tags-list" id="tags-list-way-${key}"></div>
                            <input type="text" class="cms-tag-input" id="tag-input-way-${key}" placeholder="+ Add tag...">
                        </div>
                    </div>
                `;
            } else {
                const isLongText = key === 'description' || val.length > 50;
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label" for="field-way-${key}">${key.replace(/_/g, ' ')}</label>
                                <span class="cms-field-key">waypoints.${waypointId}.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        ${isLongText 
                            ? `<textarea class="cms-textarea cms-textarea-${this.activeLangTab} cms-textarea" id="field-way-${key}">${this.escapeHtml(val)}</textarea>`
                            : `<input type="text" class="cms-input cms-input-${this.activeLangTab} cms-input" id="field-way-${key}" value="${this.escapeHtml(val)}">`
                        }
                    </div>
                `;
            }
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-fields-grid">${fieldsHtml}</div>
            </div>
        `;

        // Bind handlers
        fields.forEach(key => {
            const val = waypointData[key];
            const originalVal = this.originalConfig[this.activeLangTab]?.waypoints?.[waypointId]?.[key];

            if (Array.isArray(val)) {
                this.setupTagEditor(`way-${key}`, val, originalVal, (newTags) => {
                    this.currentConfig[this.activeLangTab].waypoints[waypointId][key] = newTags;
                    this.updateChangesCount();
                });
            } else {
                const el = document.getElementById(`field-way-${key}`) as HTMLInputElement | HTMLTextAreaElement;
                el.addEventListener('input', () => {
                    this.currentConfig[this.activeLangTab].waypoints[waypointId][key] = el.value;
                    this.updateChangesCount();
                    
                    const card = el.closest('.cms-field-card')!;
                    const isChanged = el.value !== originalVal;
                    card.classList.toggle('dirty', isChanged);
                    
                    let badge = card.querySelector('.cms-field-dirty-marker');
                    if (isChanged && !badge) {
                        card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                    } else if (!isChanged && badge) {
                        badge.remove();
                    }
                });
            }
        });
    }

    /* --- 2. 3D Canvas Layout Renderers --- */
    private render3DBehaviorDefaultsWorkspace() {
        const title = "Mesh Behavior Defaults";
        const desc = "Edit default global rendering conditions applied to meshes inside the Three.js 3D canvas (shadows, opacities, wireframe states).";

        const defaults = this.currentMeshBehavior.defaults;
        const originalDefaults = this.originalMeshBehavior.defaults;

        let fieldsHtml = '';
        Object.keys(defaults).forEach(key => {
            const val = defaults[key];
            const isDirty = val !== originalDefaults[key];

            if (typeof val === 'boolean') {
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">${key.replace(/([A-Z])/g, ' $1')}</label>
                                <span class="cms-field-key">defaults.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; align-items: center; justify-content: flex-start; height: 32px;">
                            <label class="cms-switch">
                                <input type="checkbox" id="field-beh-def-${key}" ${val ? 'checked' : ''}>
                                <span class="cms-slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            } else if (key === 'opacity') {
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">${key.replace(/([A-Z])/g, ' $1')}</label>
                                <span class="cms-field-key">defaults.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div class="cms-slider-wrapper">
                            <div class="cms-slider-label-row">
                                <span>Opacity Level</span>
                                <span class="cms-slider-value-badge" id="val-badge-beh-def-opacity">${val.toFixed(2)}</span>
                            </div>
                            <input type="range" class="cms-range-input" id="field-beh-def-opacity" min="0" max="1" step="0.05" value="${val}">
                        </div>
                    </div>
                `;
            } else {
                const isVisible = key === 'visible';
                fieldsHtml += `
                    <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">${key.replace(/([A-Z])/g, ' $1')}</label>
                                <span class="cms-field-key">defaults.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        ${isVisible
                            ? `
                            <select class="cms-input" id="field-beh-def-visible" style="background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary);">
                                <option value="null" ${val === null ? 'selected' : ''}>Default (null)</option>
                                <option value="true" ${val === true ? 'selected' : ''}>True (Visible)</option>
                                <option value="false" ${val === false ? 'selected' : ''}>False (Hidden)</option>
                            </select>
                            `
                            : `<input type="number" class="cms-input" id="field-beh-def-${key}" value="${val}">`
                        }
                    </div>
                `;
            }
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-fields-grid">${fieldsHtml}</div>
            </div>
        `;

        // Listeners for Defaults
        Object.keys(defaults).forEach(key => {
            const val = defaults[key];
            const originalVal = originalDefaults[key];

            if (typeof val === 'boolean') {
                const input = document.getElementById(`field-beh-def-${key}`) as HTMLInputElement;
                input.addEventListener('change', () => {
                    this.currentMeshBehavior.defaults[key] = input.checked;
                    this.updateChangesCount();
                    
                    const card = input.closest('.cms-field-card')!;
                    const isChanged = input.checked !== originalVal;
                    card.classList.toggle('dirty', isChanged);
                    
                    let badge = card.querySelector('.cms-field-dirty-marker');
                    if (isChanged && !badge) {
                        card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                    } else if (!isChanged && badge) {
                        badge.remove();
                    }
                });
            } else if (key === 'opacity') {
                const slider = document.getElementById('field-beh-def-opacity') as HTMLInputElement;
                const badge = document.getElementById('val-badge-beh-def-opacity')!;
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    this.currentMeshBehavior.defaults.opacity = parsedVal;
                    this.updateChangesCount();
                    
                    const card = slider.closest('.cms-field-card')!;
                    const isChanged = parsedVal !== originalVal;
                    card.classList.toggle('dirty', isChanged);
                    
                    let mBadge = card.querySelector('.cms-field-dirty-marker');
                    if (isChanged && !mBadge) {
                        card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                    } else if (!isChanged && mBadge) {
                        mBadge.remove();
                    }
                });
            } else if (key === 'visible') {
                const select = document.getElementById('field-beh-def-visible') as HTMLSelectElement;
                select.addEventListener('change', () => {
                    let parsed: boolean | null = null;
                    if (select.value === 'true') parsed = true;
                    else if (select.value === 'false') parsed = false;
                    
                    this.currentMeshBehavior.defaults.visible = parsed;
                    this.updateChangesCount();
                    
                    const card = select.closest('.cms-field-card')!;
                    const isChanged = parsed !== originalVal;
                    card.classList.toggle('dirty', isChanged);
                    
                    let badge = card.querySelector('.cms-field-dirty-marker');
                    if (isChanged && !badge) {
                        card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                    } else if (!isChanged && badge) {
                        badge.remove();
                    }
                });
            } else {
                const input = document.getElementById(`field-beh-def-${key}`) as HTMLInputElement;
                input.addEventListener('input', () => {
                    const parsedVal = parseFloat(input.value) || 0;
                    this.currentMeshBehavior.defaults[key] = parsedVal;
                    this.updateChangesCount();
                    
                    const card = input.closest('.cms-field-card')!;
                    const isChanged = parsedVal !== originalVal;
                    card.classList.toggle('dirty', isChanged);
                });
            }
        });
    }

    private render3DBehaviorMeshesWorkspace() {
        const title = "Individual Mesh Overrides";
        const desc = "Edit specific visibility toggles or key animations overrides for individual geometry nodes within the 3D scene.";

        const meshes = this.currentMeshBehavior.meshes;
        const originalMeshes = this.originalMeshBehavior.meshes;

        let fieldsHtml = '';
        Object.keys(meshes).forEach(meshId => {
            const meshObj = meshes[meshId];
            const originalObj = originalMeshes[meshId] || {};
            const isDirty = JSON.stringify(meshObj) !== JSON.stringify(originalObj);

            const isVisible = meshObj.visible !== undefined ? meshObj.visible : 'default';
            const overrideAnim = meshObj.overrideAnimation !== undefined ? meshObj.overrideAnimation : 'default';

            fieldsHtml += `
                <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                    <div class="cms-field-label-row">
                        <div class="cms-field-label-wrapper">
                            <label class="cms-field-label">${meshId.replace(/_/g, ' ')}</label>
                            <span class="cms-field-key">meshes.${meshId}</span>
                        </div>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                            <span style="color: var(--text-secondary);">Visible state:</span>
                            <select class="cms-input" id="field-beh-mesh-visible-${meshId}" style="width: 140px; padding: 4px 8px; font-size: 11px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary);">
                                <option value="default" ${isVisible === 'default' ? 'selected' : ''}>Inherit default</option>
                                <option value="true" ${isVisible === true ? 'selected' : ''}>True (Visible)</option>
                                <option value="false" ${isVisible === false ? 'selected' : ''}>False (Hidden)</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                            <span style="color: var(--text-secondary);">Override Animation:</span>
                            <select class="cms-input" id="field-beh-mesh-anim-${meshId}" style="width: 140px; padding: 4px 8px; font-size: 11px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary);">
                                <option value="default" ${overrideAnim === 'default' ? 'selected' : ''}>Inherit default</option>
                                <option value="true" ${overrideAnim === true ? 'selected' : ''}>True (Override)</option>
                                <option value="false" ${overrideAnim === false ? 'selected' : ''}>False (Follow)</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-fields-grid">${fieldsHtml}</div>
            </div>
        `;

        // Listeners for Meshes
        Object.keys(meshes).forEach(meshId => {
            const visibleSelect = document.getElementById(`field-beh-mesh-visible-${meshId}`) as HTMLSelectElement;
            const animSelect = document.getElementById(`field-beh-mesh-anim-${meshId}`) as HTMLSelectElement;
            const originalObj = originalMeshes[meshId] || {};

            const updateMeshConfig = () => {
                const meshObj: any = {};
                
                if (visibleSelect.value === 'true') meshObj.visible = true;
                else if (visibleSelect.value === 'false') meshObj.visible = false;
                
                if (animSelect.value === 'true') meshObj.overrideAnimation = true;
                else if (animSelect.value === 'false') meshObj.overrideAnimation = false;

                this.currentMeshBehavior.meshes[meshId] = meshObj;
                this.updateChangesCount();

                const card = visibleSelect.closest('.cms-field-card')!;
                const isChanged = JSON.stringify(meshObj) !== JSON.stringify(originalObj);
                card.classList.toggle('dirty', isChanged);

                let badge = card.querySelector('.cms-field-dirty-marker');
                if (isChanged && !badge) {
                    card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                } else if (!isChanged && badge) {
                    badge.remove();
                }
            };

            visibleSelect.addEventListener('change', updateMeshConfig);
            animSelect.addEventListener('change', updateMeshConfig);
        });
    }

    private render3DMaterialsWorkspace() {
        const title = "PBR Material Aesthetics";
        const desc = "Edit color hex values, metallic layers, roughness surfaces, and reflection coefficients for Physically-Based materials on the 3D model.";

        const materials = this.currentMeshMaterial.materials;
        const originalMaterials = this.originalMeshMaterial.materials;

        let fieldsHtml = '';
        Object.keys(materials).forEach(matId => {
            const matObj = materials[matId];
            const originalObj = originalMaterials[matId];
            const isDirty = JSON.stringify(matObj) !== JSON.stringify(originalObj);

            let humanLabel = matId.replace(/([A-Z])/g, ' $1');
            if (matId === 'prob') humanLabel = 'Precision Probe';
            if (matId === 'fuelTank') humanLabel = 'Fuel Tank';
            if (matId === 'fuelHead') humanLabel = 'Sensor Head';
            if (matId === 'fuelHeadCover') humanLabel = 'Harness Cover';
            if (matId === 'brandLogo') humanLabel = 'Brand Emissive Logo';
            if (matId === 'filterWireframe') humanLabel = 'Filter Wireframe';

            fieldsHtml += `
                <div class="cms-field-card ${isDirty ? 'dirty' : ''}">
                    <div class="cms-field-label-row" style="margin-bottom: 10px;">
                        <div class="cms-field-label-wrapper">
                            <label class="cms-field-label">${humanLabel}</label>
                            <span class="cms-field-key">materials.${matId}</span>
                        </div>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${matObj.color !== undefined ? `
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 10px; color: var(--text-secondary); font-family: var(--font-heading);">PBR Base Color</span>
                                <div class="cms-color-picker-wrapper">
                                    <input type="color" class="cms-color-chip" id="field-mat-color-${matId}" value="${matObj.color}">
                                    <input type="text" class="cms-color-hex-text" id="field-mat-color-hex-${matId}" value="${matObj.color}" maxlength="7">
                                </div>
                            </div>
                        ` : ''}

                        ${matObj.metalness !== undefined ? `
                            <div class="cms-slider-wrapper">
                                <div class="cms-slider-label-row">
                                    <span>Metalness (Metallic sheen)</span>
                                    <span class="cms-slider-value-badge" id="val-badge-mat-metal-${matId}">${matObj.metalness.toFixed(2)}</span>
                                </div>
                                <input type="range" class="cms-range-input" id="field-mat-metal-${matId}" min="0" max="1" step="0.01" value="${matObj.metalness}">
                            </div>
                        ` : ''}

                        ${matObj.roughness !== undefined ? `
                            <div class="cms-slider-wrapper">
                                <div class="cms-slider-label-row">
                                    <span>Roughness (Surface microscopic relief)</span>
                                    <span class="cms-slider-value-badge" id="val-badge-mat-rough-${matId}">${matObj.roughness.toFixed(2)}</span>
                                </div>
                                <input type="range" class="cms-range-input" id="field-mat-rough-${matId}" min="0" max="1" step="0.01" value="${matObj.roughness}">
                            </div>
                        ` : ''}

                        ${matObj.envMapIntensity !== undefined ? `
                            <div class="cms-slider-wrapper">
                                <div class="cms-slider-label-row">
                                    <span>Env Map Intensity (Environment reflections)</span>
                                    <span class="cms-slider-value-badge" id="val-badge-mat-env-${matId}">${matObj.envMapIntensity.toFixed(2)}</span>
                                </div>
                                <input type="range" class="cms-range-input" id="field-mat-env-${matId}" min="0" max="3" step="0.05" value="${matObj.envMapIntensity}">
                            </div>
                        ` : ''}

                        ${matObj.emissive !== undefined ? `
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                                <span style="font-size: 10px; color: var(--text-secondary); font-family: var(--font-heading);">Emissive (Self-Glow) Color</span>
                                <div class="cms-color-picker-wrapper">
                                    <input type="color" class="cms-color-chip" id="field-mat-emissive-${matId}" value="${matObj.emissive}">
                                    <input type="text" class="cms-color-hex-text" id="field-mat-emissive-hex-${matId}" value="${matObj.emissive}" maxlength="7">
                                </div>
                            </div>
                            
                            <div class="cms-slider-wrapper" style="margin-top: 4px;">
                                <div class="cms-slider-label-row">
                                    <span>Emissive Intensity</span>
                                    <span class="cms-slider-value-badge" id="val-badge-mat-emis-int-${matId}">${matObj.emissiveIntensity.toFixed(2)}</span>
                                </div>
                                <input type="range" class="cms-range-input" id="field-mat-emis-int-${matId}" min="0" max="2" step="0.05" value="${matObj.emissiveIntensity}">
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-fields-grid">${fieldsHtml}</div>
            </div>
        `;

        // Bind interactive color and numeric range listeners
        Object.keys(materials).forEach(matId => {
            const matObj = materials[matId];
            const originalObj = originalMaterials[matId];

            if (matObj.color !== undefined) {
                const picker = document.getElementById(`field-mat-color-${matId}`) as HTMLInputElement;
                const text = document.getElementById(`field-mat-color-hex-${matId}`) as HTMLInputElement;
                
                const updateColor = (hex: string) => {
                    this.currentMeshMaterial.materials[matId].color = hex;
                    this.updateChangesCount();
                    this.markCardDirtyState(picker, originalObj);
                };

                picker.addEventListener('input', () => {
                    text.value = picker.value.toUpperCase();
                    updateColor(picker.value);
                });

                text.addEventListener('input', () => {
                    let hex = text.value.trim();
                    if (!hex.startsWith('#')) hex = '#' + hex;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        picker.value = hex;
                        updateColor(hex);
                    }
                });
            }

            if (matObj.metalness !== undefined) {
                const slider = document.getElementById(`field-mat-metal-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-metal-${matId}`)!;
                
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    this.currentMeshMaterial.materials[matId].metalness = parsedVal;
                    this.updateChangesCount();
                    this.markCardDirtyState(slider, originalObj);
                });
            }

            if (matObj.roughness !== undefined) {
                const slider = document.getElementById(`field-mat-rough-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-rough-${matId}`)!;
                
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    this.currentMeshMaterial.materials[matId].roughness = parsedVal;
                    this.updateChangesCount();
                    this.markCardDirtyState(slider, originalObj);
                });
            }

            if (matObj.envMapIntensity !== undefined) {
                const slider = document.getElementById(`field-mat-env-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-env-${matId}`)!;
                
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    this.currentMeshMaterial.materials[matId].envMapIntensity = parsedVal;
                    this.updateChangesCount();
                    this.markCardDirtyState(slider, originalObj);
                });
            }

            if (matObj.emissive !== undefined) {
                const picker = document.getElementById(`field-mat-emissive-${matId}`) as HTMLInputElement;
                const text = document.getElementById(`field-mat-emissive-hex-${matId}`) as HTMLInputElement;
                const slider = document.getElementById(`field-mat-emis-int-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-emis-int-${matId}`)!;

                const updateEmissiveColor = (hex: string) => {
                    this.currentMeshMaterial.materials[matId].emissive = hex;
                    this.updateChangesCount();
                    this.markCardDirtyState(picker, originalObj);
                };

                picker.addEventListener('input', () => {
                    text.value = picker.value.toUpperCase();
                    updateEmissiveColor(picker.value);
                });

                text.addEventListener('input', () => {
                    let hex = text.value.trim();
                    if (!hex.startsWith('#')) hex = '#' + hex;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        picker.value = hex;
                        updateEmissiveColor(hex);
                    }
                });

                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    this.currentMeshMaterial.materials[matId].emissiveIntensity = parsedVal;
                    this.updateChangesCount();
                    this.markCardDirtyState(slider, originalObj);
                });
            }
        });
    }

    private markCardDirtyState(inputEl: HTMLElement, originalObj: any) {
        const card = inputEl.closest('.cms-field-card')!;
        const matId = card.querySelector('.cms-field-key')!.textContent!.split('.').pop()!;
        const matCurrent = this.currentMeshMaterial.materials[matId];
        
        const isChanged = JSON.stringify(matCurrent) !== JSON.stringify(originalObj);
        card.classList.toggle('dirty', isChanged);

        let badge = card.querySelector('.cms-field-dirty-marker');
        if (isChanged && !badge) {
            card.querySelector('.cms-field-label-row')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
        } else if (!isChanged && badge) {
            badge.remove();
        }
    }

    /* --- 3. Camera Scroll Path Timeline Workspace Renderer --- */
    private renderCameraTimelineWorkspace() {
        const isTablet = this.activeNavGroup === 'camera-tablet';
        const isMobile = this.activeNavGroup === 'camera-mobile';
        const timelineKey = isTablet 
            ? 'cameraKeyframesTablet' 
            : isMobile 
                ? 'cameraKeyframesMobile' 
                : 'cameraKeyframesDesktop';
        const title = isTablet 
            ? 'Tablet Camera Path Timeline' 
            : isMobile 
                ? 'Mobile Camera Path Timeline' 
                : 'Desktop Camera Path Timeline';
        const desc = `Directly adjust spherical positioning angles, distances, easing transitions, and three-dimensional focal points (LookAt X, Y, Z) grouped by section viewports.`;

        const keyframes: any[] = this.currentCamera[timelineKey] || [];
        const originalKeyframes: any[] = this.originalCamera[timelineKey] || [];

        // Build sections timeline grouping S1 - S10
        let sectionsHtml = '';
        Object.keys(this.sectionLabels).forEach(secId => {
            const secName = secId.toUpperCase();
            
            // Filter keyframes belonging to this section
            const secKeyframes = keyframes.filter(kf => kf.section === secName);
            
            let keyframesListHtml = '';
            
            if (secKeyframes.length === 0) {
                keyframesListHtml = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px; font-family: var(--font-heading);">
                        No keyframe frames configured for this section. Click "+ Add Keyframe" to create one.
                    </div>
                `;
            } else {
                secKeyframes.forEach((kf) => {
                    // Search for index within the main timeline array to sync values back
                    const globalIdx = keyframes.indexOf(kf);
                    const originalKf = originalKeyframes[globalIdx] || {};
                    const isDirty = JSON.stringify(kf) !== JSON.stringify(originalKf);

                    keyframesListHtml += `
                        <div class="cms-keyframe-card ${isDirty ? 'dirty' : ''}" id="card-cam-key-${globalIdx}">
                            <div class="cms-keyframe-header">
                                <div class="cms-keyframe-index">Keyframe #${globalIdx + 1}</div>
                                <div class="cms-keyframe-delete" data-global-idx="${globalIdx}" title="Delete Keyframe">&times;</div>
                            </div>
                            
                            <!-- Scroll Trigger percentage -->
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                                <span style="color: var(--text-secondary);">Scroll Trigger (%):</span>
                                <input type="number" class="cms-input" id="field-cam-scroll-${globalIdx}" step="0.001" min="0" max="1" style="width: 100px; padding: 4px 8px;" value="${kf.scroll}">
                            </div>

                            <!-- Distance -->
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                                <span style="color: var(--text-secondary);">Distance (Radius):</span>
                                <input type="number" class="cms-input" id="field-cam-dist-${globalIdx}" step="0.01" style="width: 100px; padding: 4px 8px;" value="${kf.distance}">
                            </div>

                            <!-- Angle Y & Angle X -->
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                                <span style="color: var(--text-secondary);">Spherical Angles (Y, X):</span>
                                <div style="display: flex; gap: 4px;">
                                    <input type="number" class="cms-input" id="field-cam-angy-${globalIdx}" step="0.001" style="width: 70px; padding: 4px 8px; font-family: monospace;" value="${kf.angleY}" title="Yaw (angleY)">
                                    <input type="number" class="cms-input" id="field-cam-angx-${globalIdx}" step="0.001" style="width: 70px; padding: 4px 8px; font-family: monospace;" value="${kf.angleX}" title="Pitch (angleX)">
                                </div>
                            </div>

                            <!-- Target Coordinates LookAt (X, Y, Z) -->
                            <div style="display: flex; flex-direction: column; gap: 3px;">
                                <span style="font-size: 10px; color: var(--text-secondary);">Target coordinates (LookAt X, Y, Z):</span>
                                <div class="cms-coords-row">
                                    <div class="cms-coord-input-wrapper">
                                        <span class="cms-coord-label">X</span>
                                        <input type="number" class="cms-input" id="field-cam-target-x-${globalIdx}" step="0.001" style="padding: 4px 6px; font-family: monospace;" value="${kf.target?.x || 0}">
                                    </div>
                                    <div class="cms-coord-input-wrapper">
                                        <span class="cms-coord-label">Y</span>
                                        <input type="number" class="cms-input" id="field-cam-target-y-${globalIdx}" step="0.001" style="padding: 4px 6px; font-family: monospace;" value="${kf.target?.y || 0}">
                                    </div>
                                    <div class="cms-coord-input-wrapper">
                                        <span class="cms-coord-label">Z</span>
                                        <input type="number" class="cms-input" id="field-cam-target-z-${globalIdx}" step="0.001" style="padding: 4px 6px; font-family: monospace;" value="${kf.target?.z || 0}">
                                    </div>
                                </div>
                            </div>

                            <!-- Easing Dropdown -->
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 2px;">
                                <span style="color: var(--text-secondary);">Easing Transition:</span>
                                <select class="cms-input" id="field-cam-ease-${globalIdx}" style="width: 140px; padding: 4px 8px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); font-size: 11px;">
                                    <option value="gentle" ${kf.ease === 'gentle' ? 'selected' : ''}>gentle (Smooth)</option>
                                    <option value="hold" ${kf.ease === 'hold' ? 'selected' : ''}>hold (Lock camera)</option>
                                    <option value="dramatic" ${kf.ease === 'dramatic' ? 'selected' : ''}>dramatic (Fast snap)</option>
                                </select>
                            </div>
                        </div>
                    `;
                });
            }

            sectionsHtml += `
                <div class="cms-timeline-section-group">
                    <div class="cms-timeline-section-header">
                        <span>SECTION ${secName} // ${this.sectionLabels[secId]}</span>
                        <button class="cms-timeline-section-header-btn" data-section-name="${secName}">+ Add Keyframe</button>
                    </div>
                    <div class="cms-timeline-grid">${keyframesListHtml}</div>
                </div>
            `;
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div>${sectionsHtml}</div>
            </div>
        `;

        // Bind Action Listeners to Keyframe Cards
        keyframes.forEach((kf, globalIdx) => {
            const originalKf = originalKeyframes[globalIdx] || {};

            const scrollInput = document.getElementById(`field-cam-scroll-${globalIdx}`) as HTMLInputElement;
            const distInput = document.getElementById(`field-cam-dist-${globalIdx}`) as HTMLInputElement;
            const angyInput = document.getElementById(`field-cam-angy-${globalIdx}`) as HTMLInputElement;
            const angxInput = document.getElementById(`field-cam-angx-${globalIdx}`) as HTMLInputElement;
            const targetX = document.getElementById(`field-cam-target-x-${globalIdx}`) as HTMLInputElement;
            const targetY = document.getElementById(`field-cam-target-y-${globalIdx}`) as HTMLInputElement;
            const targetZ = document.getElementById(`field-cam-target-z-${globalIdx}`) as HTMLInputElement;
            const easeSelect = document.getElementById(`field-cam-ease-${globalIdx}`) as HTMLSelectElement;

            const updateKeyframeValues = () => {
                const scrollVal = parseFloat(scrollInput.value) || 0;
                const distVal = parseFloat(distInput.value) || 0;
                const angyVal = parseFloat(angyInput.value) || 0;
                const angxVal = parseFloat(angxInput.value) || 0;
                const xVal = parseFloat(targetX.value) || 0;
                const yVal = parseFloat(targetY.value) || 0;
                const zVal = parseFloat(targetZ.value) || 0;

                keyframes[globalIdx] = {
                    scroll: scrollVal,
                    distance: distVal,
                    angleY: angyVal,
                    angleX: angxVal,
                    target: { x: xVal, y: yVal, z: zVal },
                    ease: easeSelect.value,
                    section: kf.section
                };

                this.updateChangesCount();

                // Check card dirty decoration
                const card = scrollInput.closest('.cms-keyframe-card')!;
                const isChanged = JSON.stringify(keyframes[globalIdx]) !== JSON.stringify(originalKf);
                card.classList.toggle('dirty', isChanged);
            };

            // Input triggers
            [scrollInput, distInput, angyInput, angxInput, targetX, targetY, targetZ].forEach(el => {
                el.addEventListener('input', updateKeyframeValues);
            });
            easeSelect.addEventListener('change', updateKeyframeValues);
        });

    }

    private renderVoiceSettingsWorkspace() {
        const title = "Gemini Assistant Voice Settings";
        const desc = "Adjust the active speaking voice character for English, Amharic, and Arabic languages. Changing speaker voices directly affects live text-to-speech assistant modules.";

        const voiceMetadata = this.currentVoice.voiceMetadata || {};
        const languages = ['en', 'am', 'ar'];

        let sectionsHtml = '';

        languages.forEach(lang => {
            const langName = lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Arabic';
            const activeVoice = this.currentVoice[lang]?.activeVoice || '';
            const originalVoiceVal = this.originalVoice[lang]?.activeVoice || '';
            const isDirty = activeVoice !== originalVoiceVal;

            let voicesGridHtml = '';
            Object.keys(voiceMetadata).forEach(voiceName => {
                const meta = voiceMetadata[voiceName];
                const isActive = voiceName === activeVoice;
                const genderClass = meta.gender === 'Woman' ? 'female' : 'male';
                
                voicesGridHtml += `
                    <div class="cms-voice-chip ${isActive ? 'active' : ''}" data-lang="${lang}" data-voice="${voiceName}">
                        <div class="cms-voice-chip-header">
                            <span class="cms-voice-name">${voiceName}</span>
                            <span class="cms-gender-badge ${genderClass}">${meta.gender}</span>
                        </div>
                        <p class="cms-voice-tone">${meta.tone}</p>
                        <div class="cms-voice-wave-container">
                            <span class="cms-voice-status-text">${isActive ? 'Active Speaker' : 'Standby'}</span>
                            <div class="cms-voice-wave-bars">
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

            sectionsHtml += `
                <div class="cms-voice-lang-group ${isDirty ? 'dirty' : ''}">
                    <div class="cms-voice-lang-header">
                        <span>${langName} AI Voice Assistant</span>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <div class="cms-voice-chips-grid">${voicesGridHtml}</div>
                </div>
            `;
        });

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 30px;">
                    ${sectionsHtml}
                </div>
            </div>
        `;

        // Bind click events on chips
        this.mainContentEl.querySelectorAll('.cms-voice-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const lang = chip.getAttribute('data-lang')!;
                const voiceName = chip.getAttribute('data-voice')!;

                // Update state
                this.currentVoice[lang].activeVoice = voiceName;
                Object.keys(this.currentVoice[lang].voices).forEach(k => {
                    this.currentVoice[lang].voices[k] = k === voiceName ? 1 : 0;
                });

                this.updateChangesCount();
                this.renderVoiceSettingsWorkspace();
            });
        });
    }

    private renderKnowledgeConfigWorkspace() {
        const title = "RAG Knowledge Base & Crawler Config";
        const desc = "Manage ingestion policies for the assistant. Calibrate crawling depth, semantic parsing chunk sizes, taxonomy tagging, RAG vector parameters, and session memory tiers.";

        const knowledge = this.currentKnowledge;
        const originalKnowledge = this.originalKnowledge;

        // Sync Engine card
        const se = knowledge.sync_engine;
        const seOrig = originalKnowledge.sync_engine;
        const seDirty = JSON.stringify(se) !== JSON.stringify(seOrig);

        // Chunking rules card
        const cr = knowledge.chunking_rules;
        const crOrig = originalKnowledge.chunking_rules;
        const crDirty = JSON.stringify(cr) !== JSON.stringify(crOrig);

        // Retrieval & Memory card
        const rp = knowledge.retrieval_policies;
        const rpOrig = originalKnowledge.retrieval_policies;
        const mt = knowledge.memory_tiers;
        const mtOrig = originalKnowledge.memory_tiers;
        const rmDirty = JSON.stringify(rp) !== JSON.stringify(rpOrig) || JSON.stringify(mt) !== JSON.stringify(mtOrig);

        // Taxonomy card
        const tax = knowledge.taxonomy_and_tagging;
        const taxOrig = originalKnowledge.taxonomy_and_tagging;
        const taxDirty = JSON.stringify(tax) !== JSON.stringify(taxOrig);

        // Sources card
        const ks = knowledge.knowledge_sources;
        const ksOrig = originalKnowledge.knowledge_sources;
        const ksDirty = JSON.stringify(ks) !== JSON.stringify(ksOrig);

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>

                <div class="cms-fields-grid" style="grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));">
                    <!-- 1. Crawler Sync Engine -->
                    <div class="cms-field-card ${seDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Crawler Sync Engine</label>
                                <span class="cms-field-key">knowledge_config.sync_engine</span>
                            </div>
                            ${seDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="display: flex; gap: 20px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">Sync Ingestion:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-se-enabled" ${se.enabled ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">Robots.txt compliance:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-se-robots" ${se.respect_robots_txt ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 1;">
                                    <span style="font-size: 10px; color: var(--text-muted);">Sync Mode</span>
                                    <select class="cms-input" id="field-kn-se-mode" style="background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); padding: 5px;">
                                        <option value="polling" ${se.sync_mode === 'polling' ? 'selected' : ''}>polling (Interval-based)</option>
                                        <option value="realtime" ${se.sync_mode === 'realtime' ? 'selected' : ''}>realtime (Webhook Push)</option>
                                    </select>
                                </div>
                                <div style="width: 120px;">
                                    <span style="font-size: 10px; color: var(--text-muted);">Polling Interval (Hrs)</span>
                                    <input type="number" class="cms-input" id="field-kn-se-interval" value="${se.polling_interval_hours}" style="padding: 5px;">
                                </div>
                                <div style="width: 90px;">
                                    <span style="font-size: 10px; color: var(--text-muted);">Crawl Depth</span>
                                    <input type="number" class="cms-input" id="field-kn-se-depth" value="${se.crawl_depth}" style="padding: 5px;">
                                </div>
                            </div>

                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Ingestion Targets (Domains)</span>
                                <div class="cms-tag-editor" id="tag-editor-se-domains" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-se-domains"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-se-domains" placeholder="+ Add crawl domain...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Chunking & Ingestion Rules -->
                    <div class="cms-field-card ${crDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Semantic Text Chunking</label>
                                <span class="cms-field-key">knowledge_config.chunking_rules</span>
                            </div>
                            ${crDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Target Chunk Size (Tokens)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-target" value="${cr.target_chunk_size_tokens}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Overlap Percentage (%)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-overlap" value="${cr.overlap_percentage}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Min Chunk size (Tokens)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-min" value="${cr.min_chunk_size_tokens}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Max Chunk size (Tokens)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-max" value="${cr.max_chunk_size_tokens}" style="padding: 5px;">
                                </div>
                            </div>

                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Semantic parsing separators</span>
                                <div class="cms-tag-editor" id="tag-editor-cr-bounds" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-cr-bounds"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-cr-bounds" placeholder="+ Add tag boundary...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Vector Retrieval & Memory Tiers Policies -->
                    <div class="cms-field-card ${rmDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Vector Retrieval & Memory Tiers</label>
                                <span class="cms-field-key">knowledge_config.retrieval_policies</span>
                            </div>
                            ${rmDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Vector Dimensions</span>
                                    <input type="number" class="cms-input" id="field-kn-rp-dim" value="${rp.vector_dimensions}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Freshness Boost (Days)</span>
                                    <input type="number" class="cms-input" id="field-kn-rp-fresh" value="${rp.freshness_boost_days}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Max Retrieved chunks</span>
                                    <input type="number" class="cms-input" id="field-kn-rp-max" value="${rp.max_retrieved_chunks}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Session Memory limit</span>
                                    <input type="number" class="cms-input" id="field-kn-mt-messages" value="${mt.session_memory_messages}" style="padding: 5px;" title="session_memory_messages">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Short-Term Memory (Days)</span>
                                    <input type="number" class="cms-input" id="field-kn-mt-days" value="${mt.short_term_memory_days}" style="padding: 5px;" title="short_term_memory_days">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Long-Term Memory tier</span>
                                    <input type="text" class="cms-input" id="field-kn-mt-ltm" value="${mt.long_term_memory}" style="padding: 5px; font-size: 11px;" title="long_term_memory">
                                </div>
                            </div>

                            <div style="display: flex; gap: 20px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">Include Citations:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-rp-citations" ${rp.include_citations ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">PII Redaction:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-mt-pii" ${mt.pii_redaction_enabled ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Taxonomy & Intelligent Tagging -->
                    <div class="cms-field-card ${taxDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Taxonomy & Intelligent Tagging</label>
                                <span class="cms-field-key">knowledge_config.taxonomy_and_tagging</span>
                            </div>
                            ${taxDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Taxonomy Knowledge Domains</span>
                                <div class="cms-tag-editor" id="tag-editor-tax-domains" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-tax-domains"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-tax-domains" placeholder="+ Add domain tag...">
                                </div>
                            </div>
                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Target Audiences</span>
                                <div class="cms-tag-editor" id="tag-editor-tax-audiences" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-tax-audiences"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-tax-audiences" placeholder="+ Add audience tag...">
                                </div>
                            </div>
                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Intelligent Intent classifications</span>
                                <div class="cms-tag-editor" id="tag-editor-tax-intents" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-tax-intents"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-tax-intents" placeholder="+ Add intent tag...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Knowledge Sources Files -->
                    <div class="cms-field-card ${ksDirty ? 'dirty' : ''}" style="grid-column: 1 / -1;">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Primary Knowledge Sources (Files)</label>
                                <span class="cms-field-key">knowledge_config.knowledge_sources</span>
                            </div>
                            ${ksDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        
                        <div style="margin-top: 10px; overflow-x: auto;">
                            <table class="cms-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--border-color); text-align: left; color: var(--text-secondary);">
                                        <th style="padding: 6px;">ID</th>
                                        <th style="padding: 6px;">Resource Path</th>
                                        <th style="padding: 6px;">Type</th>
                                        <th style="padding: 6px;">Priority</th>
                                        <th style="padding: 6px; text-align: center;">Enabled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ks.map((src: any, idx: number) => {
                                        return `
                                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                <td style="padding: 6px; font-family: monospace; font-weight: 700;">${src.id}</td>
                                                <td style="padding: 6px;">
                                                    <input type="text" class="cms-input" id="field-kn-src-file-${idx}" value="${src.file}" style="padding: 3px 6px; font-size: 11px; width: 180px;">
                                                </td>
                                                <td style="padding: 6px;">
                                                    <select class="cms-input" id="field-kn-src-type-${idx}" style="padding: 3px 6px; font-size: 11px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); width: 100px;">
                                                        <option value="markdown" ${src.type === 'markdown' ? 'selected' : ''}>markdown</option>
                                                        <option value="text" ${src.type === 'text' ? 'selected' : ''}>text</option>
                                                        <option value="pdf" ${src.type === 'pdf' ? 'selected' : ''}>pdf</option>
                                                    </select>
                                                </td>
                                                <td style="padding: 6px;">
                                                    <select class="cms-input" id="field-kn-src-priority-${idx}" style="padding: 3px 6px; font-size: 11px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); width: 100px;">
                                                        <option value="high" ${src.priority === 'high' ? 'selected' : ''}>high</option>
                                                        <option value="medium" ${src.priority === 'medium' ? 'selected' : ''}>medium</option>
                                                        <option value="low" ${src.priority === 'low' ? 'selected' : ''}>low</option>
                                                    </select>
                                                </td>
                                                <td style="padding: 6px; text-align: center;">
                                                    <label class="cms-switch" style="display: inline-block;">
                                                        <input type="checkbox" id="field-kn-src-enabled-${idx}" ${src.enabled ? 'checked' : ''}>
                                                        <span class="cms-slider"></span>
                                                    </label>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // --- BIND EVENT HANDLERS ---

        // Bind Crawler Sync Engine
        const bindSwitch = (id: string, pathObj: any, key: string) => {
            const el = document.getElementById(id) as HTMLInputElement;
            if (!el) return;
            el.addEventListener('change', () => {
                pathObj[key] = el.checked;
                this.updateChangesCount();
                el.closest('.cms-field-card')!.classList.add('dirty');
            });
        };

        const bindNumber = (id: string, pathObj: any, key: string) => {
            const el = document.getElementById(id) as HTMLInputElement;
            if (!el) return;
            el.addEventListener('input', () => {
                pathObj[key] = parseFloat(el.value) || 0;
                this.updateChangesCount();
                el.closest('.cms-field-card')!.classList.add('dirty');
            });
        };

        const bindText = (id: string, pathObj: any, key: string) => {
            const el = document.getElementById(id) as HTMLInputElement;
            if (!el) return;
            el.addEventListener('input', () => {
                pathObj[key] = el.value;
                this.updateChangesCount();
                el.closest('.cms-field-card')!.classList.add('dirty');
            });
        };

        const bindSelect = (id: string, pathObj: any, key: string) => {
            const el = document.getElementById(id) as HTMLSelectElement;
            if (!el) return;
            el.addEventListener('change', () => {
                pathObj[key] = el.value;
                this.updateChangesCount();
                el.closest('.cms-field-card')!.classList.add('dirty');
            });
        };

        bindSwitch('field-kn-se-enabled', se, 'enabled');
        bindSwitch('field-kn-se-robots', se, 'respect_robots_txt');
        bindSelect('field-kn-se-mode', se, 'sync_mode');
        bindNumber('field-kn-se-interval', se, 'polling_interval_hours');
        bindNumber('field-kn-se-depth', se, 'crawl_depth');

        // Target domains tag editor
        this.setupTagEditor('se-domains', se.target_domains, seOrig.target_domains, (newTags) => {
            se.target_domains = newTags;
            this.updateChangesCount();
        });

        // Chunking rules
        bindNumber('field-kn-cr-target', cr, 'target_chunk_size_tokens');
        bindNumber('field-kn-cr-overlap', cr, 'overlap_percentage');
        bindNumber('field-kn-cr-min', cr, 'min_chunk_size_tokens');
        bindNumber('field-kn-cr-max', cr, 'max_chunk_size_tokens');

        this.setupTagEditor('cr-bounds', cr.semantic_boundaries, crOrig.semantic_boundaries, (newTags) => {
            cr.semantic_boundaries = newTags;
            this.updateChangesCount();
        });

        // Retrieval & Memory
        bindNumber('field-kn-rp-dim', rp, 'vector_dimensions');
        bindNumber('field-kn-rp-fresh', rp, 'freshness_boost_days');
        bindNumber('field-kn-rp-max', rp, 'max_retrieved_chunks');
        bindSwitch('field-kn-rp-citations', rp, 'include_citations');

        bindNumber('field-kn-mt-messages', mt, 'session_memory_messages');
        bindNumber('field-kn-mt-days', mt, 'short_term_memory_days');
        bindText('field-kn-mt-ltm', mt, 'long_term_memory');
        bindSwitch('field-kn-mt-pii', mt, 'pii_redaction_enabled');

        // Taxonomy
        this.setupTagEditor('tax-domains', tax.domains, taxOrig.domains, (newTags) => {
            tax.domains = newTags;
            this.updateChangesCount();
        });
        this.setupTagEditor('tax-audiences', tax.audiences, taxOrig.audiences, (newTags) => {
            tax.audiences = newTags;
            this.updateChangesCount();
        });
        this.setupTagEditor('tax-intents', tax.intents, taxOrig.intents, (newTags) => {
            tax.intents = newTags;
            this.updateChangesCount();
        });

        // Knowledge Sources table bindings
        ks.forEach((src: any, idx: number) => {
            const fileInput = document.getElementById(`field-kn-src-file-${idx}`) as HTMLInputElement;
            const typeSelect = document.getElementById(`field-kn-src-type-${idx}`) as HTMLSelectElement;
            const prioritySelect = document.getElementById(`field-kn-src-priority-${idx}`) as HTMLSelectElement;
            const enabledInput = document.getElementById(`field-kn-src-enabled-${idx}`) as HTMLInputElement;

            if (!fileInput || !typeSelect || !prioritySelect || !enabledInput) return;

            const updateSource = () => {
                src.file = fileInput.value;
                src.type = typeSelect.value;
                src.priority = prioritySelect.value;
                src.enabled = enabledInput.checked;
                this.updateChangesCount();
                fileInput.closest('.cms-field-card')!.classList.add('dirty');
            };

            fileInput.addEventListener('input', updateSource);
            typeSelect.addEventListener('change', updateSource);
            prioritySelect.addEventListener('change', updateSource);
            enabledInput.addEventListener('change', updateSource);
        });
    }

    private renderMarkdownKnowledgeWorkspace() {
        const title = "AI Assistant Knowledge Manual (MD)";
        const desc = "Edit the core semantic markdown text manual directly. This file serves as the canonical RAG database, loaded by the Gemini Live Voice assistant engine during real-time calls.";

        const isDirty = this.currentKnowledgeMd !== this.originalKnowledgeMd;

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container" style="height: calc(100vh - 120px); display: flex; flex-direction: column;">
                <div class="cms-content-header" style="margin-bottom: 12px; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div>
                            <h2 class="cms-content-title">${title}</h2>
                            <p class="cms-content-description">${desc}</p>
                        </div>
                        ${isDirty ? '<span class="cms-field-dirty-marker" style="font-size: 11px;">Modified</span>' : ''}
                    </div>
                </div>

                <div style="flex: 1; min-height: 200px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-family: monospace; font-size: 10px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                        <span>Path: src/translinkconfig/live-voice/knowledge.md</span>
                        <span id="mdCharCounter">Characters: ${this.currentKnowledgeMd.length}</span>
                    </div>
                    <textarea class="cms-json-textarea" id="cmsKnowledgeMdTextarea" style="flex: 1; resize: none; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.5; padding: 16px; background-color: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); outline: none; border-radius: 4px;" spellcheck="false"></textarea>
                </div>
            </div>
        `;

        const textarea = document.getElementById('cmsKnowledgeMdTextarea') as HTMLTextAreaElement;
        const charCounter = document.getElementById('mdCharCounter')!;

        textarea.value = this.currentKnowledgeMd;

        textarea.addEventListener('input', () => {
            this.currentKnowledgeMd = textarea.value;
            charCounter.textContent = `Characters: ${textarea.value.length}`;
            this.updateChangesCount();

            // Set modified state visually on save buttons and badges
            const badge = document.querySelector('.cms-field-dirty-marker');
            const hasChanges = this.currentKnowledgeMd !== this.originalKnowledgeMd;
            if (hasChanges && !badge) {
                document.querySelector('.cms-content-header div')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker" style="font-size: 11px;">Modified</span>');
            } else if (!hasChanges && badge) {
                badge.remove();
            }
        });
    }

    private async saveRawTextToServer(endpoint: string, payload: string) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: payload
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server responded with write error');
        return data;
    }

    // Advanced raw editors
    private renderRawJSONWorkspace() {
        let title = '';
        let desc = '';
        let targetConfig: any = null;

        if (this.activeNavGroup === 'raw') {
            title = 'Raw Translation copy JSON';
            desc = 'Inspect copy text dictionary files directly.';
            targetConfig = this.currentConfig;
        } else if (this.activeNavGroup === 'raw-behavior') {
            title = 'Raw Mesh Behaviors JSON';
            desc = 'Direct overrides code configurations for shadows and visibilities.';
            targetConfig = this.currentMeshBehavior;
        } else if (this.activeNavGroup === 'raw-material') {
            title = 'Raw Mesh Materials PBR JSON';
            desc = 'Metallic, roughness, envMap reflection parameters and self-glow hex colors configurations.';
            targetConfig = this.currentMeshMaterial;
        } else if (this.activeNavGroup === 'raw-camera') {
            title = 'Raw Camera Scroll keyframes JSON';
            desc = 'Inspect yaw, pitch, radius distance, lookAt coordinate vectors and easings transitions.';
            targetConfig = this.currentCamera;
        } else if (this.activeNavGroup === 'raw-voice') {
            title = 'Raw Gemini Voice Config JSON';
            desc = 'Direct speaker active selection and metadata details.';
            targetConfig = this.currentVoice;
        } else if (this.activeNavGroup === 'raw-knowledge') {
            title = 'Raw RAG Knowledge Config JSON';
            desc = 'Crawl intervals, vector rules, tags, and memory settings.';
            targetConfig = this.currentKnowledge;
        }

        this.mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-content-header">
                    <div>
                        <h2 class="cms-content-title">${title}</h2>
                        <p class="cms-content-description">${desc}</p>
                    </div>
                </div>
                <div class="cms-json-view">
                    <div id="jsonErrorContainer" class="cms-json-error" style="display: none;"></div>
                    <textarea class="cms-json-textarea" id="cmsJsonTextarea" spellcheck="false"></textarea>
                </div>
            </div>
        `;

        const textarea = document.getElementById('cmsJsonTextarea') as HTMLTextAreaElement;
        const errContainer = document.getElementById('jsonErrorContainer')!;
        
        textarea.value = JSON.stringify(targetConfig, null, 2);

        textarea.addEventListener('input', () => {
            try {
                const parsed = JSON.parse(textarea.value);
                errContainer.style.display = 'none';
                
                if (this.activeNavGroup === 'raw') {
                    this.currentConfig = parsed;
                } else if (this.activeNavGroup === 'raw-behavior') {
                    this.currentMeshBehavior = parsed;
                } else if (this.activeNavGroup === 'raw-material') {
                    this.currentMeshMaterial = parsed;
                } else if (this.activeNavGroup === 'raw-camera') {
                    this.currentCamera = parsed;
                } else if (this.activeNavGroup === 'raw-voice') {
                    this.currentVoice = parsed;
                } else if (this.activeNavGroup === 'raw-knowledge') {
                    this.currentKnowledge = parsed;
                }
                
                this.updateChangesCount();
            } catch (e: any) {
                errContainer.textContent = `JSON Parsing Error: ${e.message}`;
                errContainer.style.display = 'block';
            }
        });
    }

    /* --- Tag Badge System Builder --- */
    private setupTagEditor(uniqueId: string, tags: string[], originalTags: string[], onChange: (tags: string[]) => void) {
        const listEl = document.getElementById(`tags-list-${uniqueId}`)!;
        const inputEl = document.getElementById(`tag-input-${uniqueId}`) as HTMLInputElement;
        const cardEl = document.getElementById(`card-${uniqueId}`)!;

        const renderPills = () => {
            listEl.innerHTML = tags.map((t, idx) => `
                <div class="cms-tag-badge" data-index="${idx}">
                    <span>${this.escapeHtml(t)}</span>
                    <span class="cms-tag-badge-remove" data-index="${idx}">&times;</span>
                </div>
            `).join('');
        };

        const addTag = () => {
            const rawTag = inputEl.value.trim();
            if (rawTag) {
                tags.push(rawTag);
                inputEl.value = '';
                renderPills();
                onChange(tags);
                
                const isChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
                cardEl.classList.toggle('dirty', isChanged);
            }
        };

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });

        inputEl.addEventListener('blur', addTag);

        listEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('cms-tag-badge-remove')) {
                const idx = parseInt(target.getAttribute('data-index')!);
                tags.splice(idx, 1);
                renderPills();
                onChange(tags);
                
                const isChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
                cardEl.classList.toggle('dirty', isChanged);
            }
        });

        renderPills();
    }

    /* --- Combined Changes Calculator Engine --- */
    private calculateChangesCount(): Record<string, number> {
        const count: Record<string, number> = {
            global: 0,
            languages: 0,
            behDefaults: 0,
            behMeshes: 0,
            materials: 0,
            cameraDesktop: 0,
            cameraTablet: 0,
            cameraMobile: 0,
            voiceSettings: 0,
            knowledgeConfig: 0,
            knowledgeMd: 0
        };

        // Initialize S1 - S10 sections
        Object.keys(this.sectionLabels).forEach(k => count[`sec-${k}`] = 0);
        // Initialize Waypoints
        Object.keys(this.waypointLabels).forEach(k => count[`way-${k}`] = 0);

        // A. LANGUAGES
        if (JSON.stringify(this.currentConfig.languages) !== JSON.stringify(this.originalConfig.languages)) {
            count.languages = 1;
        }

        const languagesList = ['en', 'am', 'ar'];
        languagesList.forEach(lang => {
            const originalLang = this.originalConfig[lang];
            const currentLang = this.currentConfig[lang];
            if (!originalLang || !currentLang) return;

            Object.keys(currentLang.global).forEach(key => {
                if (currentLang.global[key] !== originalLang.global[key]) {
                    count.global++;
                }
            });

            Object.keys(currentLang.sections).forEach(secId => {
                const secOriginal = originalLang.sections[secId];
                const secCurrent = currentLang.sections[secId];
                if (!secOriginal || !secCurrent) return;

                Object.keys(secCurrent).forEach(k => {
                    if (k === 'id') return;
                    if (JSON.stringify(secCurrent[k]) !== JSON.stringify(secOriginal[k])) {
                        count[`sec-${secId}`]++;
                    }
                });
            });

            Object.keys(currentLang.waypoints).forEach(wayId => {
                const wayOriginal = originalLang.waypoints[wayId];
                const wayCurrent = currentLang.waypoints[wayId];
                if (!wayOriginal || !wayCurrent) return;

                Object.keys(wayCurrent).forEach(k => {
                    if (JSON.stringify(wayCurrent[k]) !== JSON.stringify(wayOriginal[k])) {
                        count[`way-${wayId}`]++;
                    }
                });
            });
        });

        // B. 3D MESH BEHAVIORS
        Object.keys(this.currentMeshBehavior.defaults).forEach(k => {
            if (this.currentMeshBehavior.defaults[k] !== this.originalMeshBehavior.defaults[k]) {
                count.behDefaults++;
            }
        });

        Object.keys(this.currentMeshBehavior.meshes).forEach(meshId => {
            const meshObj = this.currentMeshBehavior.meshes[meshId] || {};
            const originalObj = this.originalMeshBehavior.meshes[meshId] || {};
            if (JSON.stringify(meshObj) !== JSON.stringify(originalObj)) {
                count.behMeshes++;
            }
        });

        // C. 3D MATERIAL AESTHETICS
        Object.keys(this.currentMeshMaterial.materials).forEach(matId => {
            const matObj = this.currentMeshMaterial.materials[matId];
            const originalObj = this.originalMeshMaterial.materials[matId];
            if (JSON.stringify(matObj) !== JSON.stringify(originalObj)) {
                count.materials++;
            }
        });

        // D. 3D CAMERA PATH TIMELINES
        if (JSON.stringify(this.currentCamera.cameraKeyframesDesktop) !== JSON.stringify(this.originalCamera.cameraKeyframesDesktop)) {
            count.cameraDesktop = 1; // Mark active timeline changes
        }
        if (JSON.stringify(this.currentCamera.cameraKeyframesTablet) !== JSON.stringify(this.originalCamera.cameraKeyframesTablet)) {
            count.cameraTablet = 1;
        }
        if (JSON.stringify(this.currentCamera.cameraKeyframesMobile) !== JSON.stringify(this.originalCamera.cameraKeyframesMobile)) {
            count.cameraMobile = 1;
        }

        // E. LIVE VOICE
        if (JSON.stringify(this.currentVoice) !== JSON.stringify(this.originalVoice)) {
            count.voiceSettings = 1;
        }
        if (JSON.stringify(this.currentKnowledge) !== JSON.stringify(this.originalKnowledge)) {
            count.knowledgeConfig = 1;
        }
        if (this.currentKnowledgeMd !== this.originalKnowledgeMd) {
            count.knowledgeMd = 1;
        }

        return count;
    }

    private updateChangesCount() {
        const counts = this.calculateChangesCount();
        
        let totalLangChanges = counts.global + counts.languages;
        Object.keys(this.sectionLabels).forEach(secId => totalLangChanges += counts[`sec-${secId}`]);
        Object.keys(this.waypointLabels).forEach(wayId => totalLangChanges += counts[`way-${wayId}`]);

        const total3DChanges = counts.behDefaults + counts.behMeshes + counts.materials;
        const totalCameraChanges = counts.cameraDesktop + counts.cameraTablet + counts.cameraMobile;
        const totalVoiceChanges = counts.voiceSettings + counts.knowledgeConfig + counts.knowledgeMd;
        
        const total = totalLangChanges + total3DChanges + totalCameraChanges + totalVoiceChanges;

        // Update nav item counts dynamically
        if (this.activeMode === 'lang') {
            const globalCountEl = document.getElementById('count-global')!;
            if (globalCountEl) {
                globalCountEl.textContent = counts.global.toString();
                globalCountEl.style.display = counts.global > 0 ? 'inline-block' : 'none';
            }

            Object.keys(this.sectionLabels).forEach(secId => {
                const el = document.getElementById(`count-sec-${secId}`);
                if (el) {
                    const val = counts[`sec-${secId}`];
                    el.textContent = val.toString();
                    el.style.display = val > 0 ? 'inline-block' : 'none';
                }
            });

            Object.keys(this.waypointLabels).forEach(wayId => {
                const el = document.getElementById(`count-way-${wayId}`);
                if (el) {
                    const val = counts[`way-${wayId}`];
                    el.textContent = val.toString();
                    el.style.display = val > 0 ? 'inline-block' : 'none';
                }
            });
        } else if (this.activeMode === '3d') {
            const behDefEl = document.getElementById('count-3d-beh-def')!;
            if (behDefEl) {
                behDefEl.textContent = counts.behDefaults.toString();
                behDefEl.style.display = counts.behDefaults > 0 ? 'inline-block' : 'none';
            }

            const behMeshEl = document.getElementById('count-3d-beh-mesh')!;
            if (behMeshEl) {
                behMeshEl.textContent = counts.behMeshes.toString();
                behMeshEl.style.display = counts.behMeshes > 0 ? 'inline-block' : 'none';
            }

            const matEl = document.getElementById('count-3d-mat')!;
            if (matEl) {
                matEl.textContent = counts.materials.toString();
                matEl.style.display = counts.materials > 0 ? 'inline-block' : 'none';
            }
        } else if (this.activeMode === 'camera') {
            const camDeskEl = document.getElementById('count-cam-desk')!;
            if (camDeskEl) {
                camDeskEl.textContent = counts.cameraDesktop > 0 ? '1' : '0';
                camDeskEl.style.display = counts.cameraDesktop > 0 ? 'inline-block' : 'none';
            }

            const camTabEl = document.getElementById('count-cam-tab')!;
            if (camTabEl) {
                camTabEl.textContent = counts.cameraTablet > 0 ? '1' : '0';
                camTabEl.style.display = counts.cameraTablet > 0 ? 'inline-block' : 'none';
            }

            const camMobEl = document.getElementById('count-cam-mob')!;
            if (camMobEl) {
                camMobEl.textContent = counts.cameraMobile > 0 ? '1' : '0';
                camMobEl.style.display = counts.cameraMobile > 0 ? 'inline-block' : 'none';
            }
        } else {
            const voiceSettEl = document.getElementById('count-voice-sett')!;
            if (voiceSettEl) {
                voiceSettEl.textContent = counts.voiceSettings > 0 ? '1' : '0';
                voiceSettEl.style.display = counts.voiceSettings > 0 ? 'inline-block' : 'none';
            }

            const knConfEl = document.getElementById('count-voice-kn-conf')!;
            if (knConfEl) {
                knConfEl.textContent = counts.knowledgeConfig > 0 ? '1' : '0';
                knConfEl.style.display = counts.knowledgeConfig > 0 ? 'inline-block' : 'none';
            }

            const knMdEl = document.getElementById('count-voice-kn-md')!;
            if (knMdEl) {
                knMdEl.textContent = counts.knowledgeMd > 0 ? '1' : '0';
                knMdEl.style.display = counts.knowledgeMd > 0 ? 'inline-block' : 'none';
            }
        }

        // Toggle dirty modes switcher badge values
        const langModeBtn = document.getElementById('modeBtnLang')!;
        const meshModeBtn = document.getElementById('modeBtn3d')!;
        const cameraModeBtn = document.getElementById('modeBtnCamera')!;
        const voiceModeBtn = document.getElementById('modeBtnVoice')!;
        
        langModeBtn.innerHTML = totalLangChanges > 0 
            ? `Copy Editor <span style="background:#eab308; color:#000; font-size:9px; padding:0 3px; border-radius:3px; font-weight:800; margin-left:4px;">${totalLangChanges}</span>`
            : `Copy Editor`;

        meshModeBtn.innerHTML = total3DChanges > 0 
            ? `3D Meshes <span style="background:#eab308; color:#000; font-size:9px; padding:0 3px; border-radius:3px; font-weight:800; margin-left:4px;">${total3DChanges}</span>`
            : `3D Meshes`;

        cameraModeBtn.innerHTML = totalCameraChanges > 0 
            ? `Camera Path <span style="background:#eab308; color:#000; font-size:9px; padding:0 3px; border-radius:3px; font-weight:800; margin-left:4px;">${totalCameraChanges}</span>`
            : `Camera Path`;

        voiceModeBtn.innerHTML = totalVoiceChanges > 0 
            ? `Live Voice <span style="background:#eab308; color:#000; font-size:9px; padding:0 3px; border-radius:3px; font-weight:800; margin-left:4px;">${totalVoiceChanges}</span>`
            : `Live Voice`;

        // Update header badges
        if (total > 0) {
            this.dirtyBadge.style.display = 'flex';
            document.getElementById('dirtyCountText')!.textContent = `${total} pending changes`;
            this.saveBtn.disabled = false;
            this.discardBtn.disabled = false;
        } else {
            this.dirtyBadge.style.display = 'none';
            this.saveBtn.disabled = true;
            this.discardBtn.disabled = true;
        }
    }

    /* --- Combined Multi-File Save Engine --- */
    private async saveChanges() {
        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'Saving...';

        const counts = this.calculateChangesCount();
        const savesList: Promise<any>[] = [];

        // 1. Save Copy translations file
        let totalLangChanges = counts.global + counts.languages;
        Object.keys(this.sectionLabels).forEach(secId => totalLangChanges += counts[`sec-${secId}`]);
        Object.keys(this.waypointLabels).forEach(wayId => totalLangChanges += counts[`way-${wayId}`]);
        
        if (totalLangChanges > 0) {
            savesList.push(this.saveFileToServer('/api/config/language', this.currentConfig));
        }

        // 2. Save Mesh behavior configurations file
        if (counts.behDefaults > 0 || counts.behMeshes > 0) {
            savesList.push(this.saveFileToServer('/api/config/mesh/behavior', this.currentMeshBehavior));
        }

        // 3. Save Mesh material aesthetics file
        if (counts.materials > 0) {
            savesList.push(this.saveFileToServer('/api/config/mesh/material', this.currentMeshMaterial));
        }

        // 4. Save Camera configurations file
        if (counts.cameraDesktop > 0 || counts.cameraTablet > 0 || counts.cameraMobile > 0) {
            savesList.push(this.saveFileToServer('/api/config/camera', this.currentCamera));
        }

        // 5. Save Voice configuration
        if (counts.voiceSettings > 0) {
            savesList.push(this.saveFileToServer('/api/config/voice', this.currentVoice));
        }

        // 6. Save Knowledge Configuration
        if (counts.knowledgeConfig > 0) {
            savesList.push(this.saveFileToServer('/api/config/knowledge', this.currentKnowledge));
        }

        // 7. Save Knowledge Markdown Manual
        if (counts.knowledgeMd > 0) {
            savesList.push(this.saveRawTextToServer('/api/config/knowledge-md', this.currentKnowledgeMd));
        }

        try {
            await Promise.all(savesList);
            this.showToast('Config files successfully saved and backed up on disk', 'success');

            // Sync deep states to lock changes
            this.originalConfig = JSON.parse(JSON.stringify(this.currentConfig));
            this.originalMeshBehavior = JSON.parse(JSON.stringify(this.currentMeshBehavior));
            this.originalMeshMaterial = JSON.parse(JSON.stringify(this.currentMeshMaterial));
            this.originalCamera = JSON.parse(JSON.stringify(this.currentCamera));
            this.originalVoice = JSON.parse(JSON.stringify(this.currentVoice));
            this.originalKnowledge = JSON.parse(JSON.stringify(this.currentKnowledge));
            this.originalKnowledgeMd = this.currentKnowledgeMd;

            this.updateChangesCount();
            this.renderActiveWorkspace();
        } catch (error: any) {
            console.error('[CMS] Multi-Save failed:', error);
            this.showToast(`Disk write failed: ${error.message || 'Internal connection error'}`, 'error');
        } finally {
            this.saveBtn.textContent = 'Save Changes';
            this.updateChangesCount();
        }
    }

    private async saveFileToServer(endpoint: string, payload: any) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server responded with write error');
        return data;
    }

    /* --- Action: Discard Changes --- */
    private discardChanges() {
        if (confirm('Are you absolutely sure you want to discard all pending changes across all files?')) {
            this.currentConfig = JSON.parse(JSON.stringify(this.originalConfig));
            this.currentMeshBehavior = JSON.parse(JSON.stringify(this.originalMeshBehavior));
            this.currentMeshMaterial = JSON.parse(JSON.stringify(this.originalMeshMaterial));
            this.currentCamera = JSON.parse(JSON.stringify(this.originalCamera));
            this.currentVoice = JSON.parse(JSON.stringify(this.originalVoice));
            this.currentKnowledge = JSON.parse(JSON.stringify(this.originalKnowledge));
            this.currentKnowledgeMd = this.originalKnowledgeMd;
            
            this.showToast('All pending edits discarded.', 'success');
            
            this.renderActiveLanguagesList();
            this.renderActiveWorkspace();
            this.updateChangesCount();
        }
    }

    /* --- Action: Offline JSON Browser Exports --- */
    private exportConfig() {
        let payload = '';
        let filename = 'config.json';

        if (this.activeMode === 'lang') {
            payload = JSON.stringify(this.currentConfig, null, 2);
            filename = 'language_config.json';
        } else if (this.activeMode === '3d') {
            if (this.activeNavGroup.includes('behavior') || this.activeNavId.includes('behavior')) {
                payload = JSON.stringify(this.currentMeshBehavior, null, 2);
                filename = 'mesh_behavior_config.json';
            } else {
                payload = JSON.stringify(this.currentMeshMaterial, null, 2);
                filename = 'mesh_material_config.json';
            }
        } else if (this.activeMode === 'camera') {
            payload = JSON.stringify(this.currentCamera, null, 2);
            filename = 'camera_config.json';
        } else {
            if (this.activeNavGroup === 'voice-settings' || this.activeNavGroup === 'raw-voice') {
                payload = JSON.stringify(this.currentVoice, null, 2);
                filename = 'voice_config.json';
            } else if (this.activeNavGroup === 'knowledge-config' || this.activeNavGroup === 'raw-knowledge') {
                payload = JSON.stringify(this.currentKnowledge, null, 2);
                filename = 'knowledge_config.json';
            } else {
                payload = this.currentKnowledgeMd;
                filename = 'knowledge.md';
            }
        }

        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`${filename} exported successfully`, 'success');
    }

    /* --- Toast system --- */
    private showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
        const container = document.getElementById('cmsToastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `cms-toast ${type}`;
        toast.innerHTML = `
            <div class="cms-toast-icon"></div>
            <span>${msg}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    private escapeHtml(str: string): string {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Boot CMS Engine
window.addEventListener('DOMContentLoaded', () => {
    (window as any).cmsEngine = new TranslinkCMS();
});
