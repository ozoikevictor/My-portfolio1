// ============================================================
// AI ASSISTANT — backend URL (update once your server is deployed)
// ============================================================
const AI_ASSISTANT_API_URL = "http://localhost:3001/api/chat";

document.addEventListener('DOMContentLoaded', () => {

    /* ============================
       THEME TOGGLE (DARK / LIGHT)
       The actual theme is applied instantly in a small
       inline script in <head> (before paint, so there's
       no flash). This block just wires up the button and
       keeps it in sync + saves the user's choice.
    ============================ */
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;

    // Screen-reader-only live region that announces the mode change.
    // Reuses one if already present on the page (e.g. added manually),
    // otherwise creates it once.
    let themeAnnouncer = document.getElementById('themeAnnouncer');
    if (!themeAnnouncer) {
        themeAnnouncer = document.createElement('span');
        themeAnnouncer.id = 'themeAnnouncer';
        themeAnnouncer.setAttribute('aria-live', 'polite');
        themeAnnouncer.setAttribute('role', 'status');
        themeAnnouncer.style.position = 'absolute';
        themeAnnouncer.style.width = '1px';
        themeAnnouncer.style.height = '1px';
        themeAnnouncer.style.overflow = 'hidden';
        themeAnnouncer.style.clip = 'rect(0 0 0 0)';
        themeAnnouncer.style.whiteSpace = 'nowrap';
        document.body.appendChild(themeAnnouncer);
    }

    const applyTheme = (theme) => {
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
        if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    };

    // Reflect whatever the blocking <head> script already applied
    // (it runs before this file loads, so data-theme is already correct).
    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'light' ? 'true' : 'false');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = root.getAttribute('data-theme') === 'light';
            const nextTheme = isLight ? 'dark' : 'light';

            applyTheme(nextTheme);
            localStorage.setItem('theme', nextTheme);
            themeAnnouncer.textContent = nextTheme === 'light' ? 'Light mode enabled' : 'Dark mode enabled';
        });
    }

    // Keep in sync with the OS setting, but only while the user hasn't
    // made an explicit choice on this site (no saved preference yet).
    if (window.matchMedia) {
        const systemPref = window.matchMedia('(prefers-color-scheme: light)');
        const handleSystemChange = (e) => {
            if (localStorage.getItem('theme')) return; // user has an explicit choice — don't override it
            applyTheme(e.matches ? 'light' : 'dark');
        };
        if (systemPref.addEventListener) {
            systemPref.addEventListener('change', handleSystemChange);
        } else if (systemPref.addListener) {
            systemPref.addListener(handleSystemChange); // older Safari
        }
    }

    // Keep every open tab in sync when the theme is changed in another tab.
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme' && e.newValue) {
            applyTheme(e.newValue);
        }
    });

    /* ============================
       SETTINGS SIDEBAR
       Opens/closes the panel and wires up:
       accent colour, font size, and animations on/off.
       (Dark/Light mode lives inside the panel too, but its
       logic is handled above since it's shared with the head script.)
    ============================ */
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsClose = document.getElementById('settingsClose');

    const openSettings = () => {
        if (!settingsPanel) return;
        settingsPanel.classList.add('open');
        settingsOverlay.classList.add('open');
        settingsPanel.setAttribute('aria-hidden', 'false');
        settingsBtn.setAttribute('aria-expanded', 'true');
    };

    const closeSettings = () => {
        if (!settingsPanel) return;
        settingsPanel.classList.remove('open');
        settingsOverlay.classList.remove('open');
        settingsPanel.setAttribute('aria-hidden', 'true');
        settingsBtn.setAttribute('aria-expanded', 'false');
    };

    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    if (settingsClose) settingsClose.addEventListener('click', closeSettings);
    if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettings);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsPanel && settingsPanel.classList.contains('open')) closeSettings();
    });

    // --- Accent colour ---
    const accentSwatches = document.querySelectorAll('.accent-swatch');
    const DEFAULT_ACCENT = '#FF6B35';

    const setAccent = (color, persist) => {
        root.style.setProperty('--color-accent', color);
        accentSwatches.forEach(sw => sw.classList.toggle('active', sw.dataset.accent.toLowerCase() === color.toLowerCase()));
        if (persist) localStorage.setItem('accentColor', color);
    };

    // Reflect whatever the head script already applied on load
    const savedAccent = localStorage.getItem('accentColor');
    if (savedAccent) setAccent(savedAccent, false);

    accentSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => setAccent(swatch.dataset.accent, true));
    });

    // --- Font size ---
    const fontSteps = [87.5, 100, 112.5, 125, 137.5]; // percentages
    const fontDecrease = document.getElementById('fontDecrease');
    const fontIncrease = document.getElementById('fontIncrease');
    const fontSizeLabel = document.getElementById('fontSizeLabel');

    const currentFontIndex = () => {
        const saved = parseFloat(localStorage.getItem('fontScale')) || 100;
        const idx = fontSteps.indexOf(saved);
        return idx === -1 ? fontSteps.indexOf(100) : idx;
    };

    const applyFontStep = (index, persist) => {
        index = Math.max(0, Math.min(fontSteps.length - 1, index));
        const value = fontSteps[index];
        root.style.fontSize = value + '%';
        if (fontSizeLabel) fontSizeLabel.textContent = Math.round(value) + '%';
        if (fontDecrease) fontDecrease.disabled = index === 0;
        if (fontIncrease) fontIncrease.disabled = index === fontSteps.length - 1;
        if (persist) localStorage.setItem('fontScale', value);
        return index;
    };

    let fontIndex = currentFontIndex();
    applyFontStep(fontIndex, false);

    if (fontDecrease) fontDecrease.addEventListener('click', () => { fontIndex = applyFontStep(fontIndex - 1, true); });
    if (fontIncrease) fontIncrease.addEventListener('click', () => { fontIndex = applyFontStep(fontIndex + 1, true); });

    // --- Animations on/off ---
    const animationsToggle = document.getElementById('animationsToggle');
    const animationsEnabled = localStorage.getItem('animationsEnabled') !== 'false'; // default: on

    if (animationsToggle) {
        animationsToggle.checked = animationsEnabled;
        root.classList.toggle('no-animations', !animationsEnabled);

        animationsToggle.addEventListener('change', () => {
            const enabled = animationsToggle.checked;
            root.classList.toggle('no-animations', !enabled);
            localStorage.setItem('animationsEnabled', enabled);
        });
    }

    // --- Reset to defaults ---
    const settingsReset = document.getElementById('settingsReset');
    if (settingsReset) {
        settingsReset.addEventListener('click', () => {
            localStorage.removeItem('theme');
            localStorage.removeItem('accentColor');
            localStorage.removeItem('fontScale');
            localStorage.removeItem('animationsEnabled');
            root.removeAttribute('style');
            root.classList.remove('no-animations');
            const systemLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
            applyTheme(systemLight ? 'light' : 'dark');
            setAccent(DEFAULT_ACCENT, false);
            fontIndex = applyFontStep(fontSteps.indexOf(100), false);
            if (animationsToggle) animationsToggle.checked = true;
        });
    }

    /* ============================
       LOADING SCREEN
    ============================ */
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        const hideLoader = () => loadingScreen.classList.add('hidden');
        if (document.readyState === 'complete') {
            hideLoader();
        } else {
            window.addEventListener('load', hideLoader);
        }
        // Safety net in case 'load' never fires (slow third-party assets, etc.)
        setTimeout(hideLoader, 3500);
    }

    /* ============================
       SCROLL PROGRESS BAR
    ============================ */
    const scrollProgress = document.getElementById('scrollProgress');

    const updateScrollProgress = () => {
        if (!scrollProgress) return;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = percent + '%';
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    /* ============================
       BACK TO TOP BUTTON
    ============================ */
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        const toggleBackToTop = () => {
            backToTop.classList.toggle('show', (window.scrollY || document.documentElement.scrollTop) > 400);
        };
        toggleBackToTop();
        window.addEventListener('scroll', toggleBackToTop, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: root.classList.contains('no-animations') ? 'auto' : 'smooth'
            });
        });
    }

    /* ============================
       ANIMATED STATISTICS COUNTERS
       Counts up from 0 to data-target once each number
       scrolls into view. Skips the animation (jumps straight
       to the final value) when animations are turned off.
    ============================ */
    const statNumbers = document.querySelectorAll('.stats-number[data-target]');

    if (statNumbers.length && 'IntersectionObserver' in window) {
        const animateCount = (el) => {
            const target = parseInt(el.dataset.target, 10) || 0;

            if (root.classList.contains('no-animations')) {
                el.textContent = target;
                return;
            }

            const duration = 1500;
            const start = performance.now();

            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                el.textContent = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target;
            };

            requestAnimationFrame(step);
        };

        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(el => statsObserver.observe(el));
    } else {
        // No IntersectionObserver support: just show final numbers
        statNumbers.forEach(el => { el.textContent = el.dataset.target; });
    }

    /* ============================
       HERO BACKGROUND PARTICLES
       Lightweight canvas particle drift behind the hero content.
       Skipped entirely if animations are off or the user prefers
       reduced motion.
    ============================ */
    const heroCanvas = document.getElementById('heroParticles');

    if (heroCanvas) {
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion && !root.classList.contains('no-animations')) {
            const ctx = heroCanvas.getContext('2d');
            const heroSection = heroCanvas.closest('.about');
            let particles = [];
            let animationId = null;

            const PARTICLE_COUNT = 45;

            const resizeCanvas = () => {
                heroCanvas.width = heroSection.offsetWidth;
                heroCanvas.height = heroSection.offsetHeight;
            };

            const createParticles = () => {
                particles = Array.from({ length: PARTICLE_COUNT }, () => ({
                    x: Math.random() * heroCanvas.width,
                    y: Math.random() * heroCanvas.height,
                    r: Math.random() * 2 + 0.6,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    alpha: Math.random() * 0.4 + 0.15
                }));
            };

            const draw = () => {
                ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;

                    if (p.x < 0) p.x = heroCanvas.width;
                    if (p.x > heroCanvas.width) p.x = 0;
                    if (p.y < 0) p.y = heroCanvas.height;
                    if (p.y > heroCanvas.height) p.y = 0;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,107,53,${p.alpha})`;
                    ctx.fill();
                });
                animationId = requestAnimationFrame(draw);
            };

            resizeCanvas();
            createParticles();
            draw();

            window.addEventListener('resize', () => {
                resizeCanvas();
                createParticles();
            });

            // Pause the animation loop when the tab isn't visible to save battery/CPU.
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                } else if (!document.hidden && !animationId) {
                    draw();
                }
            });
        }
    }

    /* ============================
       RIPPLE BUTTON EFFECT
    ============================ */
    document.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            if (root.classList.contains('no-animations')) return;

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const ripple = document.createElement('span');

            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    /* ============================
       CONTACT FORM VALIDATION
       Client-side only (no backend) — validates required fields
       and email format, then shows a success message.
    ============================ */
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        const nameField = document.getElementById('cf-name');
        const emailField = document.getElementById('cf-email');
        const messageField = document.getElementById('cf-message');
        const formSuccess = document.getElementById('formSuccess');

        const showError = (field, errorId, message) => {
            const wrapper = field.closest('.form-field');
            const errorEl = document.getElementById(errorId);
            wrapper.classList.add('invalid');
            if (errorEl) errorEl.textContent = message;
        };

        const clearError = (field) => {
            const wrapper = field.closest('.form-field');
            wrapper.classList.remove('invalid');
        };

        const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        [nameField, emailField, messageField].forEach(field => {
            if (!field) return;
            field.addEventListener('input', () => clearError(field));
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (formSuccess) formSuccess.classList.remove('show');

            let valid = true;

            if (!nameField.value.trim()) {
                showError(nameField, 'cf-name-error', 'Please enter your name.');
                valid = false;
            } else {
                clearError(nameField);
            }

            if (!emailField.value.trim()) {
                showError(emailField, 'cf-email-error', 'Please enter your email.');
                valid = false;
            } else if (!isValidEmail(emailField.value.trim())) {
                showError(emailField, 'cf-email-error', 'Please enter a valid email address.');
                valid = false;
            } else {
                clearError(emailField);
            }

            if (!messageField.value.trim()) {
                showError(messageField, 'cf-message-error', 'Please enter a message.');
                valid = false;
            } else {
                clearError(messageField);
            }

            if (!valid) {
                const firstInvalid = contactForm.querySelector('.form-field.invalid input, .form-field.invalid textarea');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // No backend wired up yet — this just confirms receipt client-side.
            // Hook up your form endpoint (e.g. Formspree, EmailJS, your own API) here.
            if (formSuccess) formSuccess.classList.add('show');
            contactForm.reset();
        });
    }

    /* ============================
       404 PAGE SEARCH BOX
       No real site search yet — this just sends the visitor
       back home with their query preserved in the URL, so it's
       ready to wire up to a real search later.
    ============================ */
    const notFoundSearch = document.getElementById('notFoundSearch');
    if (notFoundSearch) {
        notFoundSearch.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('notFoundSearchInput');
            const query = input ? input.value.trim() : '';
            window.location.href = query ? `home.html?q=${encodeURIComponent(query)}` : 'home.html';
        });
    }

    /* ============================
       MOBILE NAV TOGGLE
    ============================ */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navToggle.classList.toggle('open', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close the mobile menu whenever a nav link is clicked
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ============================
       SCROLL REVEAL ANIMATIONS
       (targets every .reveal element: fade-in, slide-up,
       slide-left, slide-right, zoom-in, scale-in)
    ============================ */
    const revealEls = document.querySelectorAll('.reveal');

    if (revealEls.length && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // animate once
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback: if IntersectionObserver isn't supported, just show everything
        revealEls.forEach(el => el.classList.add('active'));
    }

    /* ============================
       TYPING TEXT EFFECT
    ============================ */
    const typingEl = document.getElementById('typing');

    if (typingEl) {
        const roles = ['Web Developer', 'Web Designer', 'App Developer', 'SEO Specialist', 'Computer Science Student', 'Soft Ware Tester'];
        let roleIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const type = () => {
            const currentRole = roles[roleIndex];

            if (!deleting) {
                charIndex++;
                typingEl.textContent = currentRole.slice(0, charIndex);

                if (charIndex === currentRole.length) {
                    deleting = true;
                    setTimeout(type, 1400); // pause at full word
                    return;
                }
            } else {
                charIndex--;
                typingEl.textContent = currentRole.slice(0, charIndex);

                if (charIndex === 0) {
                    deleting = false;
                    roleIndex = (roleIndex + 1) % roles.length;
                }
            }

            setTimeout(type, deleting ? 60 : 110);
        };

        type();
    }

    /* ============================
       PORTFOLIO FILTER
       NOTE: add a data-category="web" (etc.) attribute to
       each .portfolio-item to match the buttons' data-filter
       values ("art", "branding", "design", "web"). Items
       without a matching data-category just won't filter.
    ============================ */
    const filterBtns = document.querySelectorAll('.portfolio-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (filterBtns.length && portfolioItems.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');

                portfolioItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    const matches = filter === 'all' || category === filter;

                    if (matches) {
                        item.classList.remove('hide');
                        item.style.display = '';
                    } else {
                        item.classList.add('hide');
                        setTimeout(() => {
                            if (item.classList.contains('hide')) {
                                item.style.display = 'none';
                            }
                        }, 300); // matches .portfolio-item transition duration
                    }
                });
            });
        });
    }

    /* ============================
       ACTIVE NAV LINK ON SCROLL
    ============================ */
    const sections = document.querySelectorAll('main section[id], main section.about, main section.services, main section.about-section, main section.skills-section, main section.portfolio-section, main section.pricing-section, main section.testimonial-section, main section.blog, main section.contact');
    const navItems = document.querySelectorAll('.nav-link');

    if (sections.length && navItems.length && 'IntersectionObserver' in window) {
        const sectionMap = {
            about: 'home.html',
            'about-section': 'about.html',
            services: 'services.html',
            'skills-section': 'skill.html',
            'portfolio-section': 'portfolio.html',
            blog: 'blog.html',
            contact: 'contact.html'
        };

        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const matchedClass = Object.keys(sectionMap).find(cls => entry.target.classList.contains(cls));
                    if (!matchedClass) return;

                    navItems.forEach(link => {
                        link.classList.toggle(
                            'active',
                            link.getAttribute('href') === sectionMap[matchedClass]
                        );
                    });
                }
            });
        }, { threshold: 0.4 });

        sections.forEach(section => navObserver.observe(section));
    }

    // Replace with your Paystack Public Key
    const PAYSTACK_PUBLIC_KEY = "YOUR_PAYSTACK_PUBLIC_KEY";

    // Select all purchase buttons
    const purchaseButtons = document.querySelectorAll(".buy-btn");

    // Add click event to each button
    purchaseButtons.forEach(button => {

        button.addEventListener("click", () => {

            // Ask customer for email
            const email = prompt("Enter your email:");

            if (!email) {
                alert("Please enter your email.");
                return;
            }

            // Get plan and price
            const plan = button.dataset.plan;
            const amount = button.dataset.price;

            // Open Paystack payment
            const handler = PaystackPop.setup({

                key: PAYSTACK_PUBLIC_KEY,

                email: email,

                amount: amount * 100, // Paystack accepts the smallest currency unit

                currency: "USD", // Change to "NGN" if using Naira

                metadata: {
                    custom_fields: [
                        {
                            display_name: "Plan",
                            variable_name: "plan",
                            value: plan
                        }
                    ]
                },

                callback: function (response) {

                    alert(
                        "Payment Successful!\n\n" +
                        "Plan: " + plan +
                        "\nReference: " + response.reference
                    );

                    // Send response.reference to your backend for verification
                },

                onClose: function () {
                    alert("Payment cancelled.");
                }

            });

            handler.openIframe();

        });

    });

    /* ============================================================
       AI CHAT ASSISTANT
       Floating button + panel, built entirely in JS so it appears
       on every page that includes this script — no HTML changes
       needed. Talks to the backend at AI_ASSISTANT_API_URL.
    ============================================================ */
    (function initAiAssistant() {
        const suggestions = [
            "Who is Victor?",
            "What are his skills?",
            "Show me his projects",
            "Is he available for freelance work?",
            "How do I contact him?",
        ];

        // Marker the backend appends after the visible reply, followed by
        // the updated conversation history as JSON (see server.js).
        const HISTORY_DELIM = '\u0000HISTORY:';

        let conversationHistory = [];
        let pendingFile = null;

        const aiBtn = document.createElement('button');
        aiBtn.id = 'ai-widget-btn';
        aiBtn.innerHTML = '💬';
        aiBtn.setAttribute('aria-label', 'Open AI assistant');

        const aiPanel = document.createElement('div');
        aiPanel.id = 'ai-widget-panel';
        aiPanel.innerHTML = `
            <div id="ai-widget-header">
                <div class="ai-header-title">
                    <span class="ai-avatar">🤖</span>
                    <span>
                        Victor's AI Assistant
                        <span class="ai-header-sub">Usually replies instantly</span>
                    </span>
                </div>
                <div id="ai-widget-header-actions">
                    <button class="ai-icon-btn" id="ai-widget-reset" aria-label="Restart conversation" title="Restart conversation">↺</button>
                    <button class="ai-icon-btn" id="ai-widget-close" aria-label="Close">✕</button>
                </div>
            </div>
            <div id="ai-widget-messages"></div>
            <div id="ai-widget-suggestions"></div>
            <div id="ai-widget-filechip">
                <span>📎</span>
                <span id="ai-widget-filename"></span>
                <button class="ai-file-remove" id="ai-widget-file-remove" aria-label="Remove file">✕</button>
            </div>
            <div id="ai-widget-inputrow">
                <input type="file" id="ai-widget-fileinput" style="display:none" accept="image/*,.txt,.md,.csv,.json,.pdf" />
                <button class="ai-round-btn" id="ai-widget-attach" aria-label="Attach a file" title="Attach a file">📎</button>
                <button class="ai-round-btn" id="ai-widget-mic" aria-label="Voice input" title="Voice input">🎤</button>
                <textarea id="ai-widget-input" rows="1" placeholder="Ask me anything about Victor..."></textarea>
                <button id="ai-widget-send" aria-label="Send">➤</button>
            </div>
        `;

        document.body.appendChild(aiBtn);
        document.body.appendChild(aiPanel);

        const aiMessagesEl = aiPanel.querySelector('#ai-widget-messages');
        const aiSuggestionsEl = aiPanel.querySelector('#ai-widget-suggestions');
        const aiInputEl = aiPanel.querySelector('#ai-widget-input');
        const aiSendBtn = aiPanel.querySelector('#ai-widget-send');
        const aiCloseBtn = aiPanel.querySelector('#ai-widget-close');
        const aiResetBtn = aiPanel.querySelector('#ai-widget-reset');
        const aiAttachBtn = aiPanel.querySelector('#ai-widget-attach');
        const aiFileInput = aiPanel.querySelector('#ai-widget-fileinput');
        const aiFileChip = aiPanel.querySelector('#ai-widget-filechip');
        const aiFileNameEl = aiPanel.querySelector('#ai-widget-filename');
        const aiFileRemoveBtn = aiPanel.querySelector('#ai-widget-file-remove');
        const aiMicBtn = aiPanel.querySelector('#ai-widget-mic');

        // Auto-grow the textarea as the visitor types (up to CSS max-height)
        aiInputEl.addEventListener('input', () => {
            aiInputEl.style.height = 'auto';
            aiInputEl.style.height = aiInputEl.scrollHeight + 'px';
        });

        function addAiRow(role, text, fileLabel) {
            const row = document.createElement('div');
            row.className = `ai-row ${role}`;

            const avatar = document.createElement('div');
            avatar.className = 'ai-avatar-sm';
            avatar.textContent = role === 'user' ? '🙂' : '🤖';

            const bubble = document.createElement('div');
            bubble.className = 'ai-msg';

            if (fileLabel) {
                const chip = document.createElement('div');
                chip.className = 'ai-file-chip-msg';
                chip.textContent = `📎 ${fileLabel}`;
                bubble.appendChild(chip);
                bubble.appendChild(document.createElement('br'));
            }

            const textNode = document.createElement('span');
            textNode.textContent = text;
            bubble.appendChild(textNode);

            row.appendChild(avatar);
            row.appendChild(bubble);
            aiMessagesEl.appendChild(row);
            aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
            return { row, bubble, textNode };
        }

        function addTypingIndicator() {
            const row = document.createElement('div');
            row.className = 'ai-row assistant';
            row.innerHTML = `
                <div class="ai-avatar-sm">🤖</div>
                <div class="ai-msg ai-typing-dots"><span></span><span></span><span></span></div>
            `;
            aiMessagesEl.appendChild(row);
            aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
            return row;
        }

        function renderAiSuggestions() {
            aiSuggestionsEl.innerHTML = '';
            suggestions.forEach((s) => {
                const chip = document.createElement('button');
                chip.className = 'ai-suggestion';
                chip.textContent = s;
                chip.onclick = () => sendAiMessage(s);
                aiSuggestionsEl.appendChild(chip);
            });
        }

        function showWelcome() {
            aiMessagesEl.innerHTML = '';
            addAiRow(
                'assistant',
                "👋 Hi! I'm Victor's AI Assistant. Ask me about his skills, projects, experience, services, or how to get in touch — or tell me about a project you'd like to hire him for!"
            );
            renderAiSuggestions();
        }

        // ---- File attach ----
        aiAttachBtn.addEventListener('click', () => aiFileInput.click());
        aiFileInput.addEventListener('change', () => {
            const file = aiFileInput.files[0];
            if (!file) return;
            if (file.size > 8 * 1024 * 1024) {
                alert('Please attach a file smaller than 8MB.');
                aiFileInput.value = '';
                return;
            }
            pendingFile = file;
            aiFileNameEl.textContent = file.name;
            aiFileChip.classList.add('show');
        });
        aiFileRemoveBtn.addEventListener('click', () => {
            pendingFile = null;
            aiFileInput.value = '';
            aiFileChip.classList.remove('show');
        });

        // ---- Voice input (Web Speech API — Chrome/Edge/Safari) ----
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionCtor) {
            const recognition = new SpeechRecognitionCtor();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            let listening = false;

            aiMicBtn.addEventListener('click', () => {
                if (listening) {
                    recognition.stop();
                    return;
                }
                try {
                    recognition.start();
                    listening = true;
                    aiMicBtn.classList.add('listening');
                } catch (e) { /* already started */ }
            });

            recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                aiInputEl.value = (aiInputEl.value ? aiInputEl.value + ' ' : '') + transcript;
                aiInputEl.dispatchEvent(new Event('input'));
            };
            recognition.onerror = () => { listening = false; aiMicBtn.classList.remove('listening'); };
            recognition.onend = () => { listening = false; aiMicBtn.classList.remove('listening'); };
        } else {
            aiMicBtn.style.display = 'none'; // browser doesn't support speech recognition
        }

        // ---- Send message (streams the reply as it arrives) ----
        async function sendAiMessage(text) {
            const message = (text || aiInputEl.value).trim();
            if (!message && !pendingFile) return;

            const fileToSend = pendingFile;
            addAiRow('user', message || '(sent a file)', fileToSend ? fileToSend.name : null);

            aiInputEl.value = '';
            aiInputEl.style.height = 'auto';
            aiSendBtn.disabled = true;
            aiSuggestionsEl.innerHTML = '';
            pendingFile = null;
            aiFileInput.value = '';
            aiFileChip.classList.remove('show');

            const typingRow = addTypingIndicator();
            let bubbleEls = null; // created on first chunk received

            try {
                const formData = new FormData();
                formData.append('message', message);
                formData.append('history', JSON.stringify(conversationHistory));
                if (fileToSend) formData.append('file', fileToSend);

                const res = await fetch(AI_ASSISTANT_API_URL, { method: 'POST', body: formData });

                if (!res.ok || !res.body) {
                    typingRow.remove();
                    let errMsg = 'Something went wrong, please try again.';
                    try { const data = await res.json(); errMsg = data.error || errMsg; } catch (e) { /* not json */ }
                    addAiRow('assistant', errMsg);
                    return;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let full = '';
                let shownSoFar = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    full += decoder.decode(value, { stream: true });

                    const delimIdx = full.indexOf(HISTORY_DELIM);
                    const visible = delimIdx !== -1 ? full.slice(0, delimIdx) : full;

                    if (visible.length > shownSoFar.length) {
                        if (!bubbleEls) {
                            typingRow.remove();
                            bubbleEls = addAiRow('assistant', '');
                        }
                        shownSoFar = visible;
                        bubbleEls.textNode.textContent = shownSoFar;
                        aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
                    }
                }

                if (!bubbleEls) {
                    typingRow.remove();
                    addAiRow('assistant', shownSoFar || "Sorry, I didn't get a response — please try again.");
                }

                const delimIdx = full.indexOf(HISTORY_DELIM);
                if (delimIdx !== -1) {
                    try {
                        conversationHistory = JSON.parse(full.slice(delimIdx + HISTORY_DELIM.length));
                    } catch (e) { /* keep previous history if parsing fails */ }
                }
            } catch (err) {
                typingRow.remove();
                addAiRow('assistant', "I couldn't reach the server. Please try again shortly.");
            } finally {
                aiSendBtn.disabled = false;
            }
        }

        aiBtn.addEventListener('click', () => {
            const opening = !aiPanel.classList.contains('open');
            aiPanel.classList.toggle('open');
            aiBtn.classList.toggle('open', opening);
            if (opening && aiMessagesEl.children.length === 0) showWelcome();
        });
        aiCloseBtn.addEventListener('click', () => {
            aiPanel.classList.remove('open');
            aiBtn.classList.remove('open');
        });
        aiResetBtn.addEventListener('click', () => {
            conversationHistory = [];
            showWelcome();
        });
        aiSendBtn.addEventListener('click', () => sendAiMessage());
        aiInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAiMessage();
            }
        });
    })();

});