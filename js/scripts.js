/**
 * Mobile menu fixes, performance improvements, and cross-browser support
 */

document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    // RESUME TEXT LOADER (FOR AI CONTEXT)
    // =============================================
    let cachedResumeText = '';

    async function loadResumeText() {
        try {
            const res = await fetch('/api/resume');
            const data = await res.json();
            cachedResumeText = data?.resume || '';
            console.log("✅ Resume loaded for AI. Length:", cachedResumeText.length);
        } catch (e) {
            console.warn('⚠️ Resume not loaded:', e);
        }
    }

    // Load resume once when page loads
    loadResumeText();
    // =============================================
    // 1. ENHANCED MOBILE MENU WITH TOUCH SUPPORT
    // =============================================
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    const navList = nav ? nav.querySelector('ul') : null;
    
    // Mobile toggle setup
    let mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (!mobileToggle && nav) {
        mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        mobileToggle.setAttribute('aria-expanded', 'false');
        nav.appendChild(mobileToggle);
    }

    // Menu toggle function
    const toggleMenu = () => {
        if (!navList) return;
        
        const isOpening = !navList.classList.contains('active');
        
        // Toggle menu state
        navList.classList.toggle('active', isOpening);
        mobileToggle?.setAttribute('aria-expanded', isOpening);
        
        // Update icon
        if (mobileToggle) {
            mobileToggle.innerHTML = isOpening 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        }
        
        // Lock scroll when open
        document.body.style.overflow = isOpening ? 'hidden' : '';
        
        // iOS redraw fix
        if (isOpening) {
            header.style.display = 'none';
            header.offsetHeight;
            header.style.display = '';
        }
    };

    // Event listeners with passive handling
    if (mobileToggle) {
        // Click handler
        mobileToggle.addEventListener('click', toggleMenu);
        
        // Touch handler (for mobile)
        mobileToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleMenu();
        }, { passive: false });
    }

    // Close menu when clicking links
    if (navList) {
        navList.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                toggleMenu();
            }
        });
    }

    // Close when clicking outside
    const closeOnOutsideClick = (e) => {
        if (navList?.classList.contains('active') &&
            !e.target.closest('nav') &&
            !e.target.closest('.mobile-menu-toggle')) {
            toggleMenu();
        }
    };
    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick, { passive: true });

    // Reset on desktop resize
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768 && navList?.classList.contains('active')) {
            toggleMenu();
        }
    }, 250));

    // =============================================
    // 2. SMOOTH SCROLLING
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = header?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                }
            }
        });
    });

    // =============================================
    // 3. STICKY HEADER
    // =============================================
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        
        header?.classList.toggle('sticky', currentScrollY > 50);
        
        if (window.innerWidth > 768) {
            header.style.transform = scrollingDown && currentScrollY > 200 
                ? 'translateY(-100%)' 
                : 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', debounce(handleScroll, 16), { passive: true });

    // =============================================
    // 4. ANIMATION ON SCROLL
    // =============================================
    const animatedElements = document.querySelectorAll(
        'section, .skill-category, .project-card, .timeline-item, .certification-card, .publication-card, .achievement-card'
    );
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        element.classList.add('fade-in');
        observer.observe(element);
    });

    // =============================================
    // 5. LAZY LOADING IMAGES
    // =============================================
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '200px' });
    
    lazyImages.forEach(img => imageObserver.observe(img));

    // =============================================
    // 6. FORM VALIDATION (if form exists)
    // =============================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Add missing labels
        contactForm.querySelectorAll('input, textarea').forEach(input => {
            if (!input.previousElementSibling || input.previousElementSibling.tagName !== 'LABEL') {
                const label = document.createElement('label');
                label.setAttribute('for', input.id);
                label.textContent = input.placeholder || input.name;
                input.parentNode.insertBefore(label, input);
            }
        });
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            if (!name || !email || !message) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            console.log({ name, email, message });
            showNotification('Thank you for your message! I will get back to you soon.', 'success');
            contactForm.reset();
        });
    }

    // =============================================
    // 7. FOOTER YEAR UPDATE
    // =============================================
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // =============================================
    // 8. PAGE LOAD COMPLETE
    // =============================================
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        initParticleNetworkAnimation(); // Initialize the particle network animation on load
        initRoleTyping(); // Start dynamic role typing
        initStatCounters(); // Prepare stat counters
    });


// Typing effect for hero role (respects prefers-reduced-motion)
function initRoleTyping() {
    const el = document.getElementById('role-typing');
    if (!el) return;
    const roles = [
        'AI Engineer',
        'LLM & RAG Systems',
        'Real-Time ML Platforms',
    ];

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        el.textContent = roles[0];
        return;
    }

    let idx = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId = null;
    const typingSpeed = 70;
    const deletingSpeed = 40;
    const hold = 1400;

    function tick() {
        const current = roles[idx];
        if (!deleting) {
            charIndex = Math.min(charIndex + 1, current.length);
            el.textContent = current.slice(0, charIndex);
            if (charIndex >= current.length) {
                deleting = true;
                timeoutId = setTimeout(tick, hold);
                return;
            }
            timeoutId = setTimeout(tick, typingSpeed);
        } else {
            charIndex = Math.max(0, charIndex - 1);
            el.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                idx = (idx + 1) % roles.length;
                timeoutId = setTimeout(tick, 400);
                return;
            }
            timeoutId = setTimeout(tick, deletingSpeed);
        }
    }

    // Start after a small delay to allow other hero animations to play
    timeoutId = setTimeout(tick, 250);

    // Pause/resume typing while page is hidden (save work)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        } else if (!document.hidden && !timeoutId) {
            timeoutId = setTimeout(tick, 250);
        }
    });
}

// Animated numeric counters inside hero (triggered once when hero becomes visible)
function initStatCounters() {
    const stats = document.querySelectorAll('.hero-stats .stat-value');
    if (!stats.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        stats.forEach(s => {
            s.textContent = s.getAttribute('data-target') + (s.getAttribute('data-suffix') || '');
        });
        return;
    }

    const container = document.querySelector('#home');
    if (!container) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                stats.forEach(animateStat);
                obs.disconnect();
            }
        });
    }, { threshold: 0.4 });

    observer.observe(container);

    function animateStat(el) {
        const target = parseInt(el.getAttribute('data-target') || '0', 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1300;
        const startTime = performance.now();

        function frame(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(progress * target);
            el.textContent = current + (progress >= 1 ? suffix : '');
            if (progress < 1) requestAnimationFrame(frame);
            else el.textContent = target + suffix;
        }
        requestAnimationFrame(frame);
    }
}

// Respect reduced-motion: if user prefers reduced motion, reduce particle intensity or stop animation
(function patchParticleForReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    function handleChange() {
        if (mq.matches) {
            // If reduce motion is set, lower canvas opacity and stop heavy animation by reducing particle counts
            const canvas = document.getElementById('hero-background-canvas');
            if (canvas) {
                canvas.style.opacity = '0.12';
            }
        } else {
            const canvas = document.getElementById('hero-background-canvas');
            if (canvas) canvas.style.opacity = '';
        }
    }
    mq.addEventListener ? mq.addEventListener('change', handleChange) : mq.addListener(handleChange);
    handleChange();
})();

    // =============================================
    // 9. AI TERMINAL
    // =============================================

        function initAITerminal() {
            const terminalToggle = document.getElementById('terminal-toggle');
            const terminal = document.getElementById('ai-terminal');
            const chatBody = document.getElementById('chat-body');
            const chatMessages = document.getElementById('chat-messages');
            const terminalInput = document.getElementById('terminal-input');
            const sendBtn = document.getElementById('chat-send');
            const closeBtn = terminal?.querySelector('.close');
            if (!terminalToggle || !terminal || !chatBody || !chatMessages || !terminalInput) return;

            // Conversation state and pending request controller
            const convo = {
                history: [], // {role: 'user'|'assistant', content: '...'}
                booted: false,
                pendingRequest: null
            };

            // Gather rich profile context from all visible page sections
            function gatherProfileContext() {
                try {
                    // About section
                    const aboutElem = document.querySelector('#about');
                    const about = aboutElem ? aboutElem.innerText : '';

                    // Projects section (full text)
                    const projectsElem = document.querySelector('#projects');
                    const projects = projectsElem ? projectsElem.innerText : '';

                    // Skills section (full text)
                    const skillsElem = document.querySelector('#skills');
                    const skills = skillsElem ? skillsElem.innerText : '';

                    // Experience section (full text)
                    const experienceElem = document.querySelector('#experience');
                    const experience = experienceElem ? experienceElem.innerText : '';

                    // Education section (full text)
                    const educationElem = document.querySelector('#education');
                    const education = educationElem ? educationElem.innerText : '';

                    // Achievements/Certifications section (full text)
                    const certificationsElem = document.querySelector('#achievements') || document.querySelector('[id*="certif"]');
                    const certifications = certificationsElem ? certificationsElem.innerText : '';

                    // Combine all into comprehensive context
                    const context = [
                        '=== ATHAR SAYED - PROFESSIONAL PROFILE ===',
                        '',
                        about,
                        '',
                        '=== PROJECTS ===',
                        projects,
                        '',
                        '=== SKILLS & EXPERTISE ===',
                        skills,
                        '',
                        '=== PROFESSIONAL EXPERIENCE ===',
                        experience,
                        '',
                        '=== EDUCATION ===',
                        education,
                        '',
                        '=== CERTIFICATIONS & ACHIEVEMENTS ===',
                        certifications
                    ].filter(s => s.trim()).join('\n');

                    return context || 'No profile information found on page.';
                } catch (e) {
                    console.error('Context gathering error:', e);
                    return 'Error gathering profile context.';
                }
            }

            // Create a chat-style message element and append
            function appendMessage(role, text) {
                const li = document.createElement('li');
                li.className = `message ${role}`;

                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.setAttribute('aria-hidden', 'true');
                avatar.textContent = role === 'user' ? 'You' : (role === 'assistant' ? 'AI' : 'i');

                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.innerHTML = text;

                li.appendChild(avatar);
                li.appendChild(bubble);
                chatMessages.appendChild(li);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return li;
            }

            // Default boot message (typed token-by-token for nicer UI)
            const bootMessage = `Allow me to introduce myself - I am IRIS (Intelligent Responsive Interface System) here to help you explore Athar Sayed's professional profile. You can ask me any questions about Athar's profile.`;

            // Helper to append an empty bubble for typing
            function appendTypingMessage(role) {
                const li = document.createElement('li');
                li.className = `message ${role}`;

                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.setAttribute('aria-hidden', 'true');
                avatar.textContent = role === 'user' ? 'You' : (role === 'assistant' ? 'AI' : 'i');

                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                bubble.innerHTML = '';

                li.appendChild(avatar);
                li.appendChild(bubble);
                chatMessages.appendChild(li);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return bubble;
            }

            // Type text into a bubble token-by-token (words) and resolve when complete
            // This legacy-style typing is used for the boot/system message and supports skipping
            function typeTextToBubble(bubble, text, options = {}) {
                const tokenDelay = options.tokenDelay || 60; // ms per token
                const punctuationPause = options.punctuationPause || 300; // extra pause after .!? tokens
                bubble.classList.add('typing');
                let timeouts = [];
                let done = false;

                function clearAll() {
                    timeouts.forEach(id => clearTimeout(id));
                    timeouts = [];
                }

                const controller = {
                    kind: 'word',
                    cancel: () => {
                        if (done) return;
                        done = true;
                        clearAll();
                        bubble.classList.remove('typing');
                        bubble.innerHTML = sanitize(text);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        delete bubble._typingController;
                        if (resolveRef) resolveRef();
                    }
                };

                let resolveRef;
                const p = new Promise((resolve) => { resolveRef = resolve; });

                // Register controller so skip functions can reveal instantly
                bubble._typingController = controller;

                const tokens = String(text).split(/\s+/);
                let i = 0;

                function scheduleNext(delay) {
                    const id = setTimeout(() => {
                        if (done) return;

                        if (i >= tokens.length) {
                            done = true;
                            bubble.classList.remove('typing');
                            bubble.innerHTML = sanitize(text);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                            delete bubble._typingController;
                            resolveRef();
                            return;
                        }

                        const prefix = tokens.slice(0, i + 1).join(' ');
                        bubble.innerHTML = sanitize(prefix);
                        chatMessages.scrollTop = chatMessages.scrollHeight;

                        const currentToken = tokens[i] || '';
                        const extra = /[.!?]$/.test(currentToken) ? punctuationPause : 0;
                        i++;
                        scheduleNext(tokenDelay + extra);
                    }, delay);
                    timeouts.push(id);
                }

                // start
                scheduleNext(0);
                return p;
            }

            // Display the boot message using the typing effect
            async function displayBootMessage() {
                terminalInput.disabled = true;
                const bubble = appendTypingMessage('system');
                await typeTextToBubble(bubble, bootMessage, { tokenDelay: 50, punctuationPause: 350 });
                terminalInput.disabled = false;
                terminalInput.focus();
                if (sendBtn) sendBtn.disabled = false;
                convo.booted = true;
            }

            // Basic sanitizer to avoid injecting raw HTML
            function sanitize(str) {
                const s = String(str || '');
                return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            }

            // Typing animation helpers (UI layer only)
            // - Non-blocking, per-bubble controllers using requestAnimationFrame
            // - Skips are supported via bubble._typingController or by calling skipAllTyping()
            const TYPING_CONFIG = {
                charsPerSecond: 110,      // default speed (fast feel)
                minLengthForAnimation: 48 // responses shorter than this are rendered instantly
            };

            // Track active controllers (weak reference via DOM only)
            function startTypingAnimation(bubble, fullText, options = {}) {
                const cfg = Object.assign({}, TYPING_CONFIG, options || {});

                // Very short responses should render instantly for UX
                if (typeof fullText !== 'string' || fullText.length <= cfg.minLengthForAnimation) {
                    bubble.innerHTML = sanitize(fullText);
                    bubble.classList.remove('typing');
                    return Promise.resolve();
                }

                // Ensure whitespace/newlines are visible while typing
                bubble.style.whiteSpace = 'pre-wrap';
                bubble.innerHTML = '';

                const textNode = document.createTextNode('');
                bubble.appendChild(textNode);

                let idx = 0;
                let lastTime = performance.now();
                let rafId = null;
                let resolved = false;

                function finish() {
                    if (rafId) cancelAnimationFrame(rafId);
                    bubble.innerHTML = sanitize(fullText);
                    bubble.classList.remove('typing');
                    bubble.style.whiteSpace = '';
                    // cleanup controller
                    if (bubble._typingController && bubble._typingController.kind === 'char') {
                        delete bubble._typingController;
                    }
                    resolved = true;
                }

                function step(now) {
                    if (resolved) return;
                    const elapsed = now - lastTime;
                    const charsToAdd = Math.max(1, Math.floor(elapsed * (cfg.charsPerSecond / 1000)));
                    if (idx < fullText.length) {
                        const nextIdx = Math.min(fullText.length, idx + charsToAdd);
                        // Append chunk
                        textNode.nodeValue = fullText.slice(0, nextIdx);
                        idx = nextIdx;
                        bubble.classList.add('typing');
                        // scroll container safely without exotic operators
                        try {
                            const container = (bubble.ownerDocument ? bubble.ownerDocument.getElementById('chat-messages') : null) || bubble.parentNode;
                            if (container) container.scrollTop = container.scrollHeight;
                        } catch (e) { /* ignore */ }
                        lastTime = now;
                        rafId = requestAnimationFrame(step);
                    } else {
                        finish();
                    }
                }

                // Controller exposes cancel/finish so skipAllTyping can reveal instantly
                bubble._typingController = {
                    kind: 'char',
                    cancel: () => { if (!resolved) finish(); }
                };

                return new Promise((resolve) => {
                    // ensure clicking the bubble will finish it
                    rafId = requestAnimationFrame(function t(now) { step(now); if (resolved) resolve(); });
                });
            }

            // Support skipping for legacy word-based typing (used by boot message)
            function skipBubbleTyping(bubble) {
                if (!bubble) return;
                // If a char-based controller exists
                if (bubble._typingController && bubble._typingController.kind === 'char') {
                    bubble._typingController.cancel();
                    return;
                }
                // If a legacy word-based controller (created by typeTextToBubble) exists
                if (bubble._typingController && bubble._typingController.kind === 'word') {
                    const c = bubble._typingController;
                    if (c.cancel) c.cancel();
                }
            }

            function skipAllTyping() {
                // Find any dots with typing class and attempt to finish them
                document.querySelectorAll('.bubble.typing').forEach(b => skipBubbleTyping(b));
            }

            // Clicking a bubble should instantly reveal it (delegated)
            // We'll attach this listener later to the chat container so it works for dynamic messages

            // Determine API base for local dev vs production
            // If you're serving the frontend with Live Server (127.0.0.1:5500),
            // point requests to the local Express proxy at http://localhost:5173
            const API_BASE = (['127.0.0.1', 'localhost'].includes(window.location.hostname) && window.location.port === '5500')
                ? 'http://localhost:5173'
                : '';

            // Helper to build the correct API endpoint depending on environment
            function apiEndpoint(path) {
                if (API_BASE) return API_BASE + path;
                return path; // same-origin (useful when deployed to Vercel)
            }

            function extractModelText(payload) {
            // small helper to detect JSON-string
            function looksLikeJsonString(s) {
                return typeof s === 'string' && s.trim().length > 0 && /^[\[\{]\s*["'A-Za-z0-9]/.test(s.trim());
            }

            // Try to parse if payload itself is a JSON string
            if (typeof payload === 'string' && looksLikeJsonString(payload)) {
                try {
                const parsed = JSON.parse(payload);
                const inner = extractModelText(parsed);
                if (inner) return inner;
                } catch (e) {
                // not parseable JSON — continue to return the raw string later if nothing else
                }
            }

            // If payload is null/undefined
            if (payload === null || payload === undefined) return null;

            // If payload is a plain string (non-JSON), return it (trimmed)
            if (typeof payload === 'string') {
                const t = payload.trim();
                return t.length ? t : null;
            }

            // If payload.reply exists and is a string that itself contains JSON, parse it
            if (typeof payload.reply === 'string') {
                const candidate = payload.reply.trim();
                if (looksLikeJsonString(candidate)) {
                try {
                    const parsed = JSON.parse(candidate);
                    const inner = extractModelText(parsed);
                    if (inner) return inner;
                } catch (e) {
                    // If we can't parse, continue below and only return the raw string as last resort
                }
                } else if (candidate.length) {
                return candidate; // plain text reply (good)
                }
            }

            // If payload.text is plain text
            if (typeof payload.text === 'string' && payload.text.trim()) {
                return payload.text.trim();
            }

            // Common shape: payload.content.parts[*].text
            try {
                if (payload.content && Array.isArray(payload.content.parts) && payload.content.parts.length) {
                const txt = payload.content.parts.map(p => (typeof p === 'string' ? p : (p?.text || p?.content || ''))).join('\n\n').trim();
                if (txt) return txt;
                }
            } catch (e) { /* ignore */ }

            // OpenAI-like: choices -> message -> content -> parts
            try {
                if (Array.isArray(payload.choices) && payload.choices.length) {
                for (const c of payload.choices) {
                    // choices[].message.content.parts
                    const parts = c?.message?.content?.parts || c?.message?.content || c?.message;
                    if (Array.isArray(parts) && parts.length) {
                    const txt = parts.map(p => (typeof p === 'string' ? p : (p?.text || ''))).join('\n\n').trim();
                    if (txt) return txt;
                    }
                    // choices[].text
                    if (typeof c.text === 'string' && c.text.trim()) return c.text.trim();
                    // choices[].message?.content as string
                    if (typeof c?.message?.content === 'string' && c.message.content.trim()) return c.message.content.trim();
                }
                }
            } catch (e) { /* ignore */ }

            // Some APIs nest under `result`, `data`, `response`
            const altKeys = ['result', 'data', 'response', 'output'];
            for (const k of altKeys) {
                if (payload[k]) {
                const sub = extractModelText(payload[k]);
                if (sub) return sub;
                }
            }

            // Fallback: try to find first reasonably-sized string anywhere (defensive)
            try {
                const seen = new Set();
                function findFirstString(obj) {
                if (!obj || typeof obj === 'number' || typeof obj === 'boolean') return null;
                if (typeof obj === 'string') {
                    const s = obj.trim();
                    return s.length ? s : null;
                }
                if (seen.has(obj)) return null;
                seen.add(obj);
                if (Array.isArray(obj)) {
                    for (const it of obj) {
                    const s = findFirstString(it);
                    if (s) return s;
                    }
                } else if (typeof obj === 'object') {
                    for (const key of Object.keys(obj)) {
                    const s = findFirstString(obj[key]);
                    if (s) return s;
                    }
                }
                return null;
                }
                const found = findFirstString(payload);
                if (found) return found;
            } catch (e) { /* ignore */ }

            // Nothing useful found
            return null;
            }

            async function askMistral(userMessage) {
            convo.history.push({ role: 'user', content: userMessage });

            const payload = {
                prompt: userMessage,
                context: gatherProfileContext(),
                history: convo.history
            };

            // Add a temporary placeholder message while waiting for reply
            const placeholder = appendMessage('assistant', 'Thinking...');
            const bubble = placeholder.querySelector('.bubble');
            bubble.classList.add('typing');

            try {
                const res = await fetch(apiEndpoint('/api/chat'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errText = await res.text();
                    bubble.classList.remove('typing');
                    bubble.innerHTML = sanitize('Error: ' + errText);
                    return;
                }

                const data = await res.json();
                const reply = data?.reply || 'No response';

                convo.history.push({ role: 'assistant', content: reply });
                bubble.classList.remove('typing');
                // Store full text (immutable) and reveal via UI-layer typing animation
                bubble.dataset.fullText = reply;
                // Start the char-based non-blocking reveal (fast feel). It auto-disables for short replies.
                startTypingAnimation(bubble, reply, { charsPerSecond: 160, minLengthForAnimation: 48 }).catch(() => {
                    // Fallback to full render on any error
                    bubble.classList.remove('typing');
                    bubble.innerHTML = sanitize(reply);
                });
            } catch (e) {
                bubble.classList.remove('typing');
                bubble.innerHTML = sanitize('Network error: ' + String(e));
            }
            }

            // Local commands fallback
            const localCommands = {
                help: () => {
                    return [
                        'Available commands: help, projects, skills, contact, about, clear, stop',
                        'You can also type any question about the profile (e.g., "Tell me about Athar\'s projects").'
                    ].join('<br>');
                },
                projects: () => {
                    const nodes = Array.from(document.querySelectorAll('#projects .project-card'));
                    if (!nodes.length) return 'No project details found on the page.';
                    return nodes.map(n => n.querySelector('h3')?.innerText || '').join('<br>');
                },
                skills: () => {
                    return gatherProfileContext().split('\n').find(l => l.startsWith('Skills')) || 'Skills info not found.';
                },
                contact: () => {
                    return 'Email: <a href="mailto:sayedathar242@gmail.com">sayedathar242@gmail.com</a>';
                },
                about: () => {
                    return document.querySelector('#about .about-text')?.innerText || 'About section not found.';
                },
                clear: () => {
                    chatMessages.innerHTML = '';
                    // Replay the typed intro (do not return a string — displayBootMessage handles UI)
                    displayBootMessage();
                    return null;
                },
                stop: () => {
                    if (convo.pendingRequest && convo.pendingRequest.controller) {
                        convo.pendingRequest.controller.abort();
                        return 'Stopping current request...';
                    }
                    return 'No request in progress.';
                }
            };

            terminalInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !terminalInput.disabled) {
                    e.preventDefault();
                    // New user input should immediately reveal any typing messages
                    skipAllTyping();
                    const input = terminalInput.value.trim();
                    if (!input) return;
                    terminalInput.value = '';
                    appendMessage('user', sanitize(input));

                    const key = input.toLowerCase();
                    if (Object.prototype.hasOwnProperty.call(localCommands, key)) {
                        const out = localCommands[key]();
                        if (out !== undefined && out !== null && out !== '') {
                            appendMessage('system', out);
                        }
                        return;
                    }

                    askMistral(input);
                }
            });

            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (terminalInput.disabled) return;
                    // Reveal any in-flight typing before sending new message
                    skipAllTyping();
                    const input = terminalInput.value.trim();
                    if (!input) return;
                    terminalInput.value = '';
                    appendMessage('user', sanitize(input));

                    const key = input.toLowerCase();
                    if (Object.prototype.hasOwnProperty.call(localCommands, key)) {
                        const out = localCommands[key]();
                        if (out !== undefined && out !== null && out !== '') {
                            appendMessage('system', out);
                        }
                        return;
                    }

                    askMistral(input);
                });
            }

            function toggleTerminal() {
                terminal.classList.toggle('active');
                console.log('Toggle AI chat:', terminal.classList.contains('active'));
                if (terminal.classList.contains('active')) {
                    if (!convo.booted) {
                        displayBootMessage();
                    } else {
                        terminalInput.focus();
                    }
                } else {
                    terminalInput.blur();
                }
            }

            terminalToggle.addEventListener('click', toggleTerminal);
            if (closeBtn) closeBtn.addEventListener('click', toggleTerminal);

            // Clicking a bubble instantly reveals its full text (delegated)
            chatMessages.addEventListener('click', (e) => {
                const b = e.target.closest('.bubble');
                if (!b) return;
                skipBubbleTyping(b);
            });

            // Pressing any key reveals all typing messages immediately (global shortcut)
            document.addEventListener('keydown', (e) => {
                // Don't interfere with other special handlers; always reveal typing first
                skipAllTyping();
            });
        }

        initAITerminal();
    const heroSection = document.querySelector('.hero');
    const animatedWords = document.querySelectorAll('.animate-word');

    if (heroSection && animatedWords.length > 0) {
        const triggerHeroAnimation = () => {
            animatedWords.forEach(word => {
                word.style.animation = 'none';
                word.offsetHeight; // Trigger reflow
                word.style.animation = null; // Re-apply original animation
            });
        };

        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    triggerHeroAnimation();
                    heroObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        heroObserver.observe(heroSection);
    }


});

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Show notification popup
 */
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.form-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `form-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    notification.style.background = type === 'success' ? 'var(--primary-color)' : '#e74c3c';
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Email validation
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Escape key handler
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const mobileMenu = document.querySelector('nav ul');
        if (mobileMenu?.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            const toggle = document.querySelector('.mobile-menu-toggle');
            if (toggle) {
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
                toggle.setAttribute('aria-expanded', 'false');
            }
            document.body.style.overflow = '';
        }
    }
});

/**
 * Safe DOM query helpers
 */
function safeQuery(selector) {
    try {
        return document.querySelector(selector);
    } catch (e) {
        console.warn(`Query failed: ${selector}`, e);
        return null;
    }
}

function safeQueryAll(selector) {
    try {
        return document.querySelectorAll(selector);
    } catch (e) {
        console.warn(`QueryAll failed: ${selector}`, e);
        return [];
    }
}
// ---------- Blog fetch & render (Medium RSS) ----------
(async function initMediumBlogSection(){
  const BLOG_USERNAME = 'YOUR_MEDIUM_USERNAME'; // <-- set this to your Medium username (no @)
  const MAX_POSTS = 6;
  const blogGrid = document.getElementById('blog-grid');
  const fallback = document.getElementById('blog-fallback');

  if (!blogGrid) return;

  // Helpers
  function createCard({title, link, pubDate, excerpt, thumbnail}) {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'blog-card-link';

    const card = document.createElement('article');
    card.className = 'blog-card';

    if (thumbnail) {
      const img = document.createElement('img');
      img.src = thumbnail;
      img.alt = title;
      img.className = 'blog-thumb';
      card.appendChild(img);
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.textContent = title;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = new Date(pubDate).toLocaleDateString();

    const excerptEl = document.createElement('p');
    excerptEl.className = 'excerpt';
    excerptEl.innerHTML = excerpt || '';

    card.appendChild(titleEl);
    card.appendChild(meta);
    card.appendChild(excerptEl);

    a.appendChild(card);
    return a;
  }

  // Strategy: try rss2json API (simple); fallback to AllOrigins + parse RSS
  async function fetchViaRss2Json(rssUrl) {
    // rss2json public endpoint - note: rate limits may apply for heavy usage
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('rss2json failed');
    return res.json();
  }

  async function fetchViaAllOrigins(rssUrl) {
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('allorigins failed');
    const text = await res.text();
    // parse XML
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    return xml;
  }

  try {
    const rssUrl = `https://medium.com/feed/@${BLOG_USERNAME}`; // Medium RSS
    // Try rss2json first
    let data = await fetchViaRss2Json(rssUrl);

    if (data && data.items) {
      // Render items
      blogGrid.innerHTML = '';
      data.items.slice(0, MAX_POSTS).forEach(item => {
        const thumbnail = item.thumbnail || parseThumbnailFromContent(item.content);
        const card = createCard({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate || item.pubDate,
          excerpt: item.description || stripHtml(item.content).slice(0, 220) + '...',
          thumbnail
        });
        blogGrid.appendChild(card);
      });
      return;
    }
    throw new Error('rss2json returned no items');
  } catch (e) {
    // fallback path: use AllOrigins + parse RSS manually
    try {
      const rssUrl = `https://medium.com/feed/@${BLOG_USERNAME}`;
      const xml = await fetchViaAllOrigins(rssUrl);

      // parse item nodes
      const items = Array.from(xml.querySelectorAll('item')).slice(0, MAX_POSTS);
      if (!items.length) throw new Error('no items parsed');

      blogGrid.innerHTML = '';
      items.forEach(item => {
        const title = item.querySelector('title')?.textContent || 'Untitled';
        const link = item.querySelector('link')?.textContent || '#';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        // some RSS put content:encoded with HTML
        const contentNode = item.querySelector('content\\:encoded') || item.querySelector('description');
        const content = contentNode ? contentNode.textContent : '';
        const excerpt = stripHtml(content).slice(0, 220) + '...';
        const thumbnail = parseThumbnailFromHtml(content);
        const card = createCard({ title, link, pubDate, excerpt, thumbnail });
        blogGrid.appendChild(card);
      });
      return;
    } catch (err) {
      console.warn('Blog fetch failed:', e, err);
      // show fallback manual links
      if (fallback) fallback.hidden = false;
      return;
    }
  }

  // small helpers
  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  }

  function parseThumbnailFromHtml(html) {
    try {
      const div = document.createElement('div');
      div.innerHTML = html || '';
      const img = div.querySelector('img');
      return img ? img.src : null;
    } catch (e) { return null; }
  }

  function parseThumbnailFromContent(content) {
    // rss2json sometimes returns `content` with <img> tags
    return parseThumbnailFromHtml(content);
  }
})();

// =============================================
// PARTICLE NETWORK BACKGROUND ANIMATION
// =============================================
// =============================================
// AI SIGNAL FLOW NETWORK - Subtle directional graph with pulsing signals
// =============================================
function initParticleNetworkAnimation() {
    const canvas = document.getElementById('hero-background-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // If previously initialized, clean it up so re-init works after resize or HMR
    if (canvas._signalCleanup) {
        try { canvas._signalCleanup(); } catch (e) { /* ignore */ }
    }

    // --- Config & Colors -------------------------------------------------
    const MOBILE_BREAKPOINT = 768;

    // Respect user preference to reduce motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Color system used by the canvas (matches CSS variables)
    const COLORS = {
        ambientRGB: '180,200,255',   // background nodes
        mainRGB: '180,200,255',      // main nodes
        lineRGB: '140,160,255',      // connection lines
        pulseStartRGB: '125,211,252',// #7dd3fc
        pulseEndRGB: '79,156,255',   // #4f9cff
        hubGlowRGB: '111,186,255'    // soft hub glow base
    };

    // State
    let nodes = [];
    let edges = [];
    let pulses = [];

    let rafId = null;
    let spawnTimer = null;
    let running = true; // toggled by visibility

    // DPI-aware canvas resize
    function setCanvasSize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // scale drawing operations
    }

    // Build nodes in columns (left-to-right bias) with slight jitter
    function buildGraph() {
        nodes = [];
        edges = [];

        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        const columns = isMobile ? 3 : 5;
        const rows = isMobile ? Math.max(3, Math.floor((window.innerHeight / 120))) : Math.max(3, Math.floor((window.innerHeight / 140)));

        // Node counts with small randomness
        const basePerCol = Math.max(2, Math.floor((isMobile ? 8 : 26) / columns));

        const colGap = window.innerWidth / (columns + 1);
        const rowGap = window.innerHeight / (rows + 1);

        for (let c = 0; c < columns; c++) {
            for (let r = 0; r < rows; r++) {
                // Reduce random jitter for a cleaner layout (more intentional, premium feel)
                const jitterX = (Math.random() - 0.5) * colGap * 0.12;
                const jitterY = (Math.random() - 0.5) * rowGap * 0.12;
                const x = (c + 1) * colGap + jitterX;
                const y = (r + 1) * rowGap + jitterY;
                // Slightly larger base sizes for clarity; mobile uses slightly smaller but still clearer nodes
                const size = (isMobile ? 3.6 : 4.6) + Math.random() * (isMobile ? 1.2 : 1.8);
                // Decide node layer (ambient vs main) — ambient nodes form the background layer
                const ambientProbability = isMobile ? 0.45 : 0.28;
                const layer = Math.random() < ambientProbability ? 'ambient' : 'main';
                nodes.push({ id: `${c}-${r}`, x, y, col: c, row: r, size, layer, isHub: false });
            }
        }

        // Designate hubs with one primary hub near the hero center and 1-2 secondary hubs offset diagonally
        const hubCount = Math.min(3, Math.max(2, Math.floor(nodes.length * 0.06)));
        const midCol = Math.floor(columns / 2);
        // Candidates near the center columns first
        let hubCandidates = nodes.filter(n => Math.abs(n.col - midCol) <= 1);
        if (hubCandidates.length < hubCount) hubCandidates = nodes.slice();
        // sort by size to pick visually prominent hubs
        hubCandidates.sort((a, b) => b.size - a.size);

        // 1) Primary hub: closest node to the hero content center (so it sits behind the hero text)
        const hero = document.querySelector('#home');
        let heroCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (hero) {
            const rect = hero.getBoundingClientRect();
            heroCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        let primary = null;
        // find nearest candidate to hero center
        let bestDist = Infinity;
        hubCandidates.forEach(n => {
            const dx = n.x - heroCenter.x;
            const dy = n.y - heroCenter.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < bestDist) { bestDist = d; primary = n; }
        });
        if (primary) {
            primary.isHub = true;
            primary.isPrimary = true; // mark for stronger styling
            primary.size *= 1.6; // primary hub slightly larger
        }

        // 2) Secondary hubs: pick up to (hubCount - 1) nodes diagonally offset from center
        const secondariesNeeded = hubCount - (primary ? 1 : 0);
        const secondaryTargets = [
            { x: heroCenter.x - window.innerWidth * 0.22, y: heroCenter.y - window.innerHeight * 0.18 },
            { x: heroCenter.x + window.innerWidth * 0.22, y: heroCenter.y + window.innerHeight * 0.18 }
        ];
        let secPicked = 0;
        for (let t of secondaryTargets) {
            if (secPicked >= secondariesNeeded) break;
            let nearest = null; let nearestD = Infinity;
            nodes.forEach(n => {
                if (n.isHub) return; // skip already chosen
                const dx = n.x - t.x; const dy = n.y - t.y; const d = Math.sqrt(dx*dx + dy*dy);
                if (d < nearestD) { nearestD = d; nearest = n; }
            });
            if (nearest) {
                nearest.isHub = true;
                nearest.isSecondary = true;
                nearest.size *= 1.35;
                secPicked++;
            }
        }

        // Fallback: if not enough hubs chosen, pick top candidates by size
        if (secPicked < secondariesNeeded) {
            hubCandidates.forEach(n => {
                if (secPicked >= secondariesNeeded) return;
                if (!n.isHub) { n.isHub = true; n.isSecondary = true; n.size *= 1.28; secPicked++; }
            });
        }

        // Connect nodes from column c to nodes in column c+1 (directional left-to-right) and some vertical bias
        nodes.forEach(src => {
            if (src.col === columns - 1) return;
            // Potential destinations are nodes in next column
            const candidates = nodes.filter(n => n.col === src.col + 1);
            // Hubs produce more outgoing edges
            const outCount = 1 + Math.floor(Math.random() * (src.isHub ? 3 : 1));
            for (let i = 0; i < outCount; i++) {
                const dest = candidates[Math.floor(Math.random() * candidates.length)];
                if (!dest) continue;
                // small vertical bias: prefer nodes roughly at same row
                const weight = Math.abs(dest.row - src.row);
                // push edge
                edges.push({ from: src, to: dest, weight, length: null });
            }
        });

        // Compute edge lengths
        edges.forEach(e => {
            const dx = e.to.x - e.from.x;
            const dy = e.to.y - e.from.y;
            e.length = Math.sqrt(dx*dx + dy*dy);
        });
    }

    // Drawing helpers
    function drawBackground() {
        // subtle gradient overlay to ensure readability
        // we keep canvas behind content, so draw edges/nodes softly
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawEdges() {
        // Slightly stronger, clearer lines with gentle gradients near hubs for improved visibility
        ctx.lineWidth = 1.15;
        edges.forEach(e => {
            const startAlpha = 0.12 + ((e.from.isPrimary || e.from.isHub) ? 0.06 : 0);
            const endAlpha = 0.12 + ((e.to.isPrimary || e.to.isHub) ? 0.06 : 0);

            // create linear gradient along edge to make lines read with depth and hub emphasis
            const grad = ctx.createLinearGradient(e.from.x, e.from.y, e.to.x, e.to.y);
            grad.addColorStop(0, `rgba(${COLORS.lineRGB},${startAlpha})`);
            grad.addColorStop(0.45, `rgba(${COLORS.mainRGB},${Math.max(startAlpha, endAlpha) * 0.82})`);
            grad.addColorStop(0.55, `rgba(${COLORS.mainRGB},${Math.max(startAlpha, endAlpha) * 0.5})`);
            grad.addColorStop(1, `rgba(${COLORS.lineRGB},${endAlpha})`);

            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(e.from.x, e.from.y);
            ctx.lineTo(e.to.x, e.to.y);
            ctx.stroke();

            // subtle directional marker, even more faint near hubs
            const t = 0.84;
            const ax = e.from.x + (e.to.x - e.from.x) * t;
            const ay = e.from.y + (e.to.y - e.from.y) * t;
            const angle = Math.atan2(e.to.y - e.from.y, e.to.x - e.from.x);
            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(angle);
            ctx.fillStyle = `rgba(${COLORS.mainRGB},${Math.max(startAlpha, endAlpha) * 0.34})`;
            ctx.beginPath();
            ctx.moveTo(-2.4, -1.4);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2.4, 1.4);
            ctx.fill();
            ctx.restore();
        });
    }

    // Background (ambient) nodes layer
    function drawAmbientNodes() {
        nodes.forEach(n => {
            if (n.layer !== 'ambient') return;
            const r = n.size * 0.5;
            const alpha = 0.14; // slightly brighter ambient background
            const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
            grd.addColorStop(0, `rgba(${COLORS.ambientRGB},${alpha * 0.95})`);
            grd.addColorStop(1, `rgba(${COLORS.ambientRGB},0)`);
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Main nodes + Hubs layer
    function drawMainAndHubs() {
        const t = performance.now();

        // Draw main nodes (non-hub, main layer)
        nodes.forEach(n => {
            if (n.layer !== 'main' || n.isHub) return;
            const r = n.size;
            const alpha = 0.9; // more visible than ambient
            const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.6);
            grd.addColorStop(0, `rgba(${COLORS.mainRGB},${alpha * 0.95})`);
            grd.addColorStop(0.7, `rgba(${COLORS.mainRGB},${alpha * 0.18})`);
            grd.addColorStop(1, `rgba(${COLORS.mainRGB},0)`);
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw hubs (primary then secondaries)
        nodes.forEach(n => {
            if (!n.isHub) return;
            const isPrimary = !!n.isPrimary;
            const isSecondary = !!n.isSecondary;
            const baseR = n.size * (isPrimary ? 1.0 : 0.95);

            // primary breathing animation (slow, subtle)
            const breath = (isPrimary && !prefersReduced) ? (1 + 0.045 * Math.sin(t / 780)) : 1;
            const glowAlpha = isPrimary ? 0.36 : (isSecondary ? 0.18 : 0.2);

            // soft radial glow behind the hub (brighter primary)
            const glowRadius = baseR * (isPrimary ? 6.6 : 4.8) * breath;
            const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
            glow.addColorStop(0, `rgba(${COLORS.hubGlowRGB},${glowAlpha})`);
            glow.addColorStop(0.5, `rgba(${COLORS.hubGlowRGB},${glowAlpha * 0.5})`);
            glow.addColorStop(1, `rgba(${COLORS.lineRGB},0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // core hub circle with subtle tint for clarity
            const coreR = baseR * (isPrimary ? 1.45 : 1.18) * breath;
            const coreGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, coreR * 3.2);
            coreGrad.addColorStop(0, `rgba(255,255,255,${isPrimary ? 0.98 : 0.9})`);
            coreGrad.addColorStop(0.08, `rgba(${COLORS.pulseStartRGB},${isPrimary ? 0.9 : 0.5})`);
            coreGrad.addColorStop(0.6, `rgba(255,255,255,${isPrimary ? 0.22 : 0.14})`);
            coreGrad.addColorStop(1, `rgba(${COLORS.lineRGB},0)`);
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(n.x, n.y, coreR, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Pulse management
    function spawnPulsePath() {
        // Pulses disabled if user prefers reduced motion
        if (prefersReduced) return null;
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        // Limit active pulses: desktop max 2, mobile max 1
        const activeLimit = isMobile ? 1 : 2;
        if (pulses.length >= activeLimit) return null;

        // Prefer two-segment paths that route through a hub: source -> hub -> destination
        const hubs = nodes.filter(n => n.isHub);
        // collect edges into maps for faster lookup
        const incomingByNode = new Map();
        const outgoingByNode = new Map();
        edges.forEach(e => {
            if (!incomingByNode.has(e.to.id)) incomingByNode.set(e.to.id, []);
            incomingByNode.get(e.to.id).push(e);
            if (!outgoingByNode.has(e.from.id)) outgoingByNode.set(e.from.id, []);
            outgoingByNode.get(e.from.id).push(e);
        });

        // Try to build a path via a random hub
        const hub = hubs.length ? hubs[Math.floor(Math.random() * hubs.length)] : null;
        if (hub) {
            const inEdges = incomingByNode.get(hub.id) || edges.filter(e => e.to === hub);
            const outEdges = outgoingByNode.get(hub.id) || edges.filter(e => e.from === hub);
            if (inEdges.length && outEdges.length) {
                const e1 = inEdges[Math.floor(Math.random() * inEdges.length)];
                const e2 = outEdges[Math.floor(Math.random() * outEdges.length)];
                const path = [e1, e2];
                const totalLength = path.reduce((s, seg) => s + (seg.length || 0), 0);
                // Reduce speed to create calmer motion and slightly larger pulses for better readability
                const speedMultiplier = isMobile ? 0.48 : 0.78; // slower on mobile and overall reduced
                const baseSpeed = 90; // px/s baseline
                const pulse = {
                    path,
                    segIndex: 0,
                    segProgress: 0,
                    totalLength,
                    speed: baseSpeed * speedMultiplier,
                    size: 2.8, // slightly larger and more visible
                    createdAt: performance.now(),
                    finishedAt: null
                };
                pulses.push(pulse);
                return pulse;
            }
        }

        // Fallback: single-edge pulse if hub routing isn't available
        const edge = edges[Math.floor(Math.random() * edges.length)];
        if (!edge) return null;
        const path = [edge];
        const totalLength = path[0].length || 0;
        const speedMultiplier = isMobile ? 0.52 : 0.92; // slightly faster so pulses feel purposeful
        const pulseSize = isMobile ? 2.0 : 3.4;
        const pulse = {
            path,
            segIndex: 0,
            segProgress: 0,
            totalLength,
            speed: 110 * speedMultiplier,
            size: pulseSize,
            createdAt: performance.now(),
            finishedAt: null
        };
        pulses.push(pulse);
        return pulse;
    }

    function scheduleNextSpawn() {
        if (prefersReduced) return;
        // Spawn cadence tuned per device so pulses are noticeable quickly on desktop
        const isMobileSpawn = window.innerWidth <= MOBILE_BREAKPOINT;
        const min = isMobileSpawn ? 1800 : 900;   // faster on desktop
        const max = isMobileSpawn ? 3200 : 2200;
        const t = Math.random() * (max - min) + min;
        spawnTimer = setTimeout(() => {
            spawnPulsePath();
            scheduleNextSpawn();
        }, t);
    }

    // Render pulses
    // Pulses travel along the provided path segments; they fade in at the start and fade out when finished.
    function updateAndDrawPulses(delta) {
        const now = performance.now();
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];

            // If this pulse has completed its path, allow a short fade-out period before removing
            if (p.finishedAt) {
                const fadeDur = 350;
                const fadeProgress = Math.min(1, (now - p.finishedAt) / fadeDur);
                if (fadeProgress >= 1) {
                    pulses.splice(i, 1);
                    continue;
                }
            } else {
                // Advance along current segment according to speed and delta
                const seg = p.path[p.segIndex];
                const segLen = seg.length || 1;
                const distThisFrame = p.speed * (delta / 1000);
                const progressInc = distThisFrame / segLen;
                p.segProgress += progressInc;

                // Move across segments, carrying overflow progress
                while (p.segProgress >= 1 && p.segIndex < p.path.length) {
                    p.segProgress -= 1;
                    p.segIndex++;
                }

                // If we've reached the end of the path, mark finished (start fade-out)
                if (p.segIndex >= p.path.length) {
                    p.finishedAt = now;
                }
            }

            // Determine normalized global progress along the full path (0..1)
            let distCovered = 0;
            for (let j = 0; j < Math.min(p.segIndex, p.path.length); j++) distCovered += (p.path[j].length || 0);
            if (p.segIndex < p.path.length) {
                distCovered += (p.segProgress * (p.path[p.segIndex].length || 0));
            }
            const globalProgress = Math.min(1, (p.totalLength ? distCovered / (p.totalLength || 1) : 0));

            // Opacity: fade-in at start and fade-out near end
            const fadeWindow = 0.12; // fraction of total path used for fade in/out
            let alpha = 1;
            if (globalProgress < fadeWindow) alpha = globalProgress / fadeWindow;
            else if (globalProgress > (1 - fadeWindow)) alpha = (1 - globalProgress) / fadeWindow;

            if (p.finishedAt) {
                const fadeDur = 350;
                const fadeProgress = Math.min(1, (now - p.finishedAt) / fadeDur);
                alpha *= (1 - fadeProgress);
            }

            // Compute current position along current segment
            const currentSegIndex = Math.min(p.segIndex, p.path.length - 1);
            const s = p.path[currentSegIndex];
            const t = (currentSegIndex === p.segIndex) ? p.segProgress : 0.999;
            const sx = s.from.x, sy = s.from.y;
            const ex = s.to.x, ey = s.to.y;
            const x = sx + (ex - sx) * t;
            const y = sy + (ey - sy) * t;

            // Draw subtle glow and small core (alpha applied to keep pulses understated)
            const baseRadius = p.size + (s.to.isHub ? 1.4 : 0);
            const pulseRadius = baseRadius * (1 + 0.06 * Math.sin((now - p.createdAt) / 340));

            // radial glow (pulses are the brightest logical layer: intelligence layer)
            const g = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius * 6);
            g.addColorStop(0, `rgba(${COLORS.pulseStartRGB},${1.0 * alpha})`);
            g.addColorStop(0.08, `rgba(${COLORS.pulseStartRGB},${0.82 * alpha})`);
            g.addColorStop(0.28, `rgba(${COLORS.pulseEndRGB},${0.36 * alpha})`);
            g.addColorStop(0.6, `rgba(${COLORS.pulseEndRGB},${0.14 * alpha})`);
            g.addColorStop(1, `rgba(${COLORS.lineRGB},0)`);

            ctx.save();
            // Add a soft shadow for depth; stronger but still controlled
            ctx.shadowBlur = 18;
            ctx.shadowColor = `rgba(${COLORS.pulseEndRGB},${0.16 * alpha})`;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, pulseRadius * 1.55, 0, Math.PI * 2);
            ctx.fill();

            // tiny bright core (clear readable dot)
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255,255,255,${1.0 * alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(1.6, p.size * 1.1), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Animation loop (drives network drawing and pulse updates)
    let lastTs = performance.now();
    function animate(ts) {
        const delta = Math.min(50, ts - lastTs); // clamp to avoid huge jumps
        lastTs = ts;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw layered network for depth: ambient nodes -> edges -> main nodes & hubs -> pulses
        drawAmbientNodes();
        drawEdges();
        drawMainAndHubs();
        updateAndDrawPulses(delta);

        rafId = requestAnimationFrame(animate);
    }

    // Pause when tab inactive
    function handleVisibility() {
        if (document.hidden) {
            running = false;
            if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else {
            running = true;
            // schedule spawn if none
            if (!spawnTimer && !prefersReduced) scheduleNextSpawn();
            if (!rafId) {
                lastTs = performance.now();
                rafId = requestAnimationFrame(animate);
            }
        }
    }

    // Rebuild layout on resize
    const handleResize = debounce(() => {
        setCanvasSize();
        buildGraph();
        // clear pulses on significant layout change
        pulses.length = 0;
    }, 240);

    // Initial setup
    setCanvasSize();
    buildGraph();

    // If reduced motion, draw a quiet static network and return
    if (prefersReduced) {
        drawEdges();
        drawNodes();
        // expose cleanup handler
        canvas._signalCleanup = function() {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (spawnTimer) clearTimeout(spawnTimer);
            if (rafId) cancelAnimationFrame(rafId);
        };
        return;
    }

    // start spawn scheduling and animation
    scheduleNextSpawn();
    rafId = requestAnimationFrame(animate);

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    // Expose cleanup to allow safe re-init
    canvas._signalCleanup = function() {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (spawnTimer) clearTimeout(spawnTimer);
        if (rafId) cancelAnimationFrame(rafId);
        // clear references
        nodes = [];
        edges = [];
        pulses = [];
        canvas._signalCleanup = null;
    };
}