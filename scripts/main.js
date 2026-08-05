document.addEventListener("DOMContentLoaded", () => {
    const cfg = window.weddingConfig;

    function initCursorTrail() {
        if (!window.matchMedia('(pointer: fine)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const trailCanvas = document.getElementById('cursor-trail-canvas');
        if (!trailCanvas) return;
        const tCtx = trailCanvas.getContext('2d');
        if (!tCtx) return;

        trailCanvas.style.display = 'block';

        function resizeTrail() {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
        }
        resizeTrail();
        window.addEventListener('resize', resizeTrail, { passive: true });

        const points = [];
        const maxPoints = 28;
        let targetX = 0;
        let targetY = 0;
        let hasPointer = false;
        let lastSpawnTime = 0;

        window.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
            targetX = e.clientX;
            targetY = e.clientY;
            hasPointer = true;
        }, { passive: true });

        window.addEventListener('pointerleave', () => {
            hasPointer = false;
        }, { passive: true });

        function spawnPoint(ts) {
            if (!hasPointer) return;
            if (ts - lastSpawnTime < 16) return;
            lastSpawnTime = ts;
            points.push({ x: targetX, y: targetY, life: 1 });
            if (points.length > maxPoints) points.shift();
        }

        function renderTrail(ts) {
            spawnPoint(ts);
            tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                p.life -= 0.04;
            }

            while (points.length > 0 && points[0].life <= 0.02) {
                points.shift();
            }

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const t = (i + 1) / points.length;
                const rOuter = 2.6 + t * 8.2;
                const rInner = 1.1 + t * 3.1;
                const aOuter = p.life * (0.05 + t * 0.15);
                const aInner = p.life * (0.08 + t * 0.24);

                tCtx.beginPath();
                tCtx.arc(p.x, p.y, rOuter, 0, Math.PI * 2);
                tCtx.fillStyle = `rgba(184,145,58,${aOuter})`;
                tCtx.fill();

                tCtx.beginPath();
                tCtx.arc(p.x, p.y, rInner, 0, Math.PI * 2);
                tCtx.fillStyle = `rgba(253,250,243,${aInner})`;
                tCtx.fill();
            }

            if (hasPointer) {
                tCtx.beginPath();
                tCtx.arc(targetX, targetY, 3.2, 0, Math.PI * 2);
                tCtx.fillStyle = 'rgba(222,201,122,0.35)';
                tCtx.fill();
            }

            requestAnimationFrame(renderTrail);
        }

        requestAnimationFrame(renderTrail);
    }

    // 1. INJECT CONFIG DATA INTO HTML
    document.getElementById('env-names').innerHTML =
        `${cfg.brideName}<span class="env-ampersand">&amp;</span>${cfg.groomName}`;
    document.getElementById('hero-names-text').innerHTML = `${cfg.brideName} <br><span style="font-size: 3rem; color: var(--gold);">&</span><br> ${cfg.groomName}`;
    document.getElementById('hero-date-text').textContent = cfg.weddingDateText;
    document.getElementById('hero-venue-text').textContent = cfg.venue;

    document.getElementById('welcome-title').textContent = cfg.welcomeTitle;
    document.getElementById('welcome-message').textContent = cfg.welcomeMessage;
    document.getElementById('divine-blessing-title').textContent = cfg.divineBlessingTitle;
    document.getElementById('divine-blessing-message').textContent = cfg.divineBlessingMessage;
    document.getElementById('couple-fun-line').textContent =
        cfg.coupleFunLine || "One codes with calm, one teaches with spark â€” together they turn every day into a beautiful celebration.";
    document.getElementById('footer-presence-note').textContent = cfg.footerPresenceMessage;
    // Note: deity image replaced with inline SVG mandala - no img src needed
    document.getElementById('footer-names-text').textContent = `${cfg.brideName} & ${cfg.groomName}`;

    // Set temple overlay pattern + hero image together so blend-mode works correctly
    const heroEl = document.getElementById('hero-section');
    heroEl.style.backgroundImage = `var(--temple-overlay-pattern), url('${cfg.heroImage}')`;
    heroEl.style.backgroundBlendMode = 'overlay';
    const couplePhotoMainEl = document.getElementById('couple-photo-main');
    couplePhotoMainEl.src = cfg.couplePhoto;
    couplePhotoMainEl.alt = `${cfg.brideName} and ${cfg.groomName} together`;
    document.getElementById('map-iframe').src = cfg.mapIframeSrc;
    document.getElementById('reception-map-iframe').src = cfg.receptionMapIframeSrc;
    // Audio src is set lazily on door open to avoid loading a large MP3 on page load

    // Set Kolam Assets
    document.querySelectorAll('.kolam-asset').forEach(el => {
        el.style.backgroundImage = `url('${cfg.kolamPatternImage}')`;
    });
    // Set Temple and Kolam CSS variables
    document.documentElement.style.setProperty('--door-pattern', `url('${cfg.templeOutlineImage}')`);
    document.documentElement.style.setProperty('--temple-overlay-pattern', `url('${cfg.templeOutlineImage}')`);
    document.documentElement.style.setProperty('--kolam-pattern', `url('${cfg.kolamPatternImage}')`);

    // 2. GENERATE EVENTS FROM CONFIG
    const eventsContainer = document.getElementById('events-container');
    cfg.events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card fade-in-up';
        card.innerHTML = `
            <div class="event-icon">${ev.icon}</div>
            <h3 class="event-title">${ev.title}</h3>
            <p class="event-detail">${ev.date}</p>
            <p class="event-detail">${ev.time}</p>
            ${ev.location ? `<p class="event-detail">${ev.location}</p>` : ''}
        `;
        eventsContainer.appendChild(card);
    });

    // 3. DOOR ANIMATION, AUDIO, & PARTICLES
    const doorWrapper = document.getElementById('door-wrapper');
    const openBtn = document.getElementById('open-btn');
    const audio = document.getElementById('bg-audio');
    const musicBtn = document.getElementById('music-btn');
    const particleContainer = document.getElementById('particles-js');
    let audioActionInFlight = false;
    let audioPrimed = false;

    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    function getCdIconMarkup() {
        return '<svg class="music-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.8" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.85"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 3a9 9 0 0 1 7.3 3.7" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.65"/><path class="cd-slash" d="M5 19L19 5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';
    }

    function syncMusicButton() {
        const paused = audio.paused;
        musicBtn.innerHTML = getCdIconMarkup();
        musicBtn.classList.toggle('is-playing', !paused);
        musicBtn.classList.toggle('is-paused', paused);
        if (audioActionInFlight) {
            musicBtn.dataset.state = 'Loading';
            return;
        }
        musicBtn.dataset.state = paused ? 'Paused' : 'Playing';
        musicBtn.title = paused ? 'Play music' : 'Pause music';
        musicBtn.setAttribute('aria-label', paused ? 'Play music' : 'Pause music');
    }

    function ensureAudioSource() {
        if (!audio.src || audio.src === window.location.href) {
            audio.src = cfg.musicUrl;
            audio.volume = 0.25;
            audio.load();
        }
    }

    async function primeAudioOnGesture() {
        if (audioPrimed) return true;
        try {
            ensureAudioSource();
            await audio.play();
            audio.pause();
            audio.currentTime = 0;
            audioPrimed = true;
            return true;
        } catch (err) {
            if (!err || err.name !== 'AbortError') {
                console.warn('Audio priming failed on this gesture.', err);
            }
            return false;
        }
    }

    audio.addEventListener('play', syncMusicButton);
    audio.addEventListener('pause', syncMusicButton);

    async function startRevealAudio() {
        if (audioActionInFlight) return;
        if (!audio.paused) {
            musicBtn.style.display = 'block';
            syncMusicButton();
            return;
        }
        audioActionInFlight = true;
        musicBtn.disabled = true;
        musicBtn.style.display = 'block';
        syncMusicButton();
        try {
            ensureAudioSource();
            await audio.play();
            audioPrimed = true;
        } catch (err) {
            if (!err || err.name !== 'AbortError') {
                musicBtn.dataset.state = 'Tap to play';
                console.warn('Audio playback is blocked until the next tap.', err);
            }
        } finally {
            audioActionInFlight = false;
            musicBtn.disabled = false;
            syncMusicButton();
        }
    }

    openBtn.addEventListener('click', async () => {
        // Prevent double-clicks
        openBtn.disabled = true;

        // Prime audio inside a guaranteed user gesture for mobile browsers.
        await primeAudioOnGesture();

        // 1. Start door reveal
        doorWrapper.classList.add('open');
        document.body.classList.add('scrollable');

        function completeOpeningReveal() {
            if (document.body.classList.contains('reveal-opened')) return;
            particleContainer.style.display = 'block';
            initParticles();
            document.body.classList.add('reveal-opened');
        }

        const rightDoor = doorWrapper.querySelector('.door.right');
        if (rightDoor) {
            rightDoor.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'transform') {
                    completeOpeningReveal();
                }
            }, { once: true });
        }

        setTimeout(completeOpeningReveal, 1700);
    });

    musicBtn.addEventListener('click', async () => {
        if (audioActionInFlight) return;
        if (!audio.paused) {
            audio.pause();
            syncMusicButton();
        } else {
            await startRevealAudio();
        }
    });

    // 4. COUNTDOWN TIMER
    function updateCountdown() {
        const eventDate = new Date(cfg.weddingDateISO).getTime();
        const now = new Date().getTime();
        const distance = eventDate - now;

        if (distance < 0) {
            document.getElementById("countdown").style.display = "none";
            return;
        }

        document.getElementById("cd-days").textContent = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
        document.getElementById("cd-hours").textContent = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        document.getElementById("cd-mins").textContent = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        document.getElementById("cd-secs").textContent = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // 5. Advanced Scroll Animations (Intersection Observer)
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with new animations
    setTimeout(() => {
        document.querySelectorAll('.fade-in-up, .scale-in, .kolam-scale').forEach(el => observer.observe(el));
    }, 100);

    // 7. SCRATCH CARD FUNCTIONALITY - REVEAL ITINERARY
    const canvas = document.getElementById('scratchCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let scratchPixelCount = 0;
        const scratchRadius = 30;
        const scratchGain = Math.PI * scratchRadius * scratchRadius * 0.45;
        const revealThreshold = canvas.width * canvas.height * 0.65;
        let itineraryRevealed = false;
        let heroHintHidden = false;

        function hideHeroScratchHint() {
            if (heroHintHidden) return;
            const heroHint = document.querySelector('.hero-scroll-hint');
            if (heroHint) {
                heroHint.style.transition = 'opacity 0.35s ease';
                heroHint.style.opacity = '0';
                setTimeout(() => {
                    heroHint.style.display = 'none';
                }, 350);
            }
            heroHintHidden = true;
        }

        // Initialize scratch card
        function initScratchCard() {
            canvas.style.opacity = '1';
            canvas.style.pointerEvents = 'auto';
            ctx.globalCompositeOperation = 'source-over';
            // Draw the scratch layer
            ctx.fillStyle = '#C5A059';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add gold pattern and text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < 50; i++) {
                ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 20, 20);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = 'bold 24px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-serif');
            ctx.textAlign = 'center';
            ctx.fillText('✨ SCRATCH ME ✨', canvas.width / 2, canvas.height / 2);
            ctx.font = '14px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-sans');
            ctx.fillText('Reveal the itinerary', canvas.width / 2, canvas.height / 2 + 40);
        }

        // Scratch functionality
        function scratch(x, y) {
            if (itineraryRevealed) return;
            hideHeroScratchHint();
            const rect = canvas.getBoundingClientRect();
            const actualX = x - rect.left;
            const actualY = y - rect.top;

            // Erase a smooth circular scratch stroke
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(actualX, actualY, scratchRadius, 0, Math.PI * 2);
            ctx.fill();

            // Track approximate scratched area
            scratchPixelCount += scratchGain;

            // Reveal itinerary when threshold reached
            if (scratchPixelCount >= revealThreshold && !itineraryRevealed) {
                itineraryRevealed = true;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.opacity = '0';
                canvas.style.pointerEvents = 'none';
                const scratchHint = document.querySelector('.scratch-hint');
                const inviteContent = document.getElementById('invite-content');
                const footerEl = document.getElementById('wedding-footer');
                if (scratchHint) {
                    scratchHint.style.opacity = '0';
                    scratchHint.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        scratchHint.style.display = 'none';
                    }, 300);
                }

                // 1. Start music and fire themed poppers on successful reveal
                startRevealAudio();
                firePoppersAnimation();

                // 2. Reveal all hidden content
                if (inviteContent) inviteContent.classList.add('section-visible');
                if (footerEl) footerEl.classList.add('section-visible');

                // 3. Re-register scroll-reveal observer for newly visible elements
                setTimeout(() => {
                    document.querySelectorAll(
                        '#invite-content .fade-in-up, #invite-content .scale-in, #invite-content .kolam-scale'
                    ).forEach(el => observer.observe(el));
                }, 150);
            }
        }

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            scratch(e.clientX, e.clientY);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                scratch(e.clientX, e.clientY);
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
        });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            isDrawing = true;
            const touch = e.touches[0];
            scratch(touch.clientX, touch.clientY);
        });

        canvas.addEventListener('touchmove', (e) => {
            if (isDrawing) {
                e.preventDefault();
                const touch = e.touches[0];
                scratch(touch.clientX, touch.clientY);
            }
        });

        canvas.addEventListener('touchend', () => {
            isDrawing = false;
        });

        // Draw hidden message
        setTimeout(() => {
            const hiddenCtx = canvas.getContext('2d');
            hiddenCtx.fillStyle = 'white';
            hiddenCtx.fillRect(0, 0, canvas.width, canvas.height);

            hiddenCtx.fillStyle = '#C5A059';
            hiddenCtx.font = 'bold 24px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-cursive');
            hiddenCtx.textAlign = 'center';
            hiddenCtx.fillText('🌸 Welcome! 🌸', canvas.width / 2, canvas.height / 2 - 20);

            hiddenCtx.fillStyle = '#666';
            hiddenCtx.font = '14px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-sans');
            hiddenCtx.fillText('Your invitation is now unveiled!', canvas.width / 2, canvas.height / 2 + 30);
            hiddenCtx.fillText('✨ Scroll down to celebrate ✨', canvas.width / 2, canvas.height / 2 + 55);

            initScratchCard();
        }, 100);
    }
    function firePoppersAnimation() {
        const popCanvas = document.getElementById('popper-canvas');
        popCanvas.style.display = 'block';
        popCanvas.width = window.innerWidth;
        popCanvas.height = window.innerHeight;
        const pCtx = popCanvas.getContext('2d');

        // Theme-matched palette (ivory/gold/crimson accents)
        const PCOLS = [
            [184, 145, 58], // deep gold
            [222, 201, 122], // light gold
            [240, 228, 184], // pale gold
            [253, 250, 243], // ivory
            [139, 26, 42], // temple crimson
            [74, 63, 53], // earthy brown
        ];

        // 5 cannon positions across bottom edge
        const W = popCanvas.width, H = popCanvas.height;
        const cannons = [
            { x: 0, y: H, dir: -Math.PI * 0.68, spread: 0.55 },
            { x: W * 0.25, y: H, dir: -Math.PI * 0.58, spread: 0.45 },
            { x: W * 0.5, y: H, dir: -Math.PI * 0.50, spread: 0.60 },
            { x: W * 0.75, y: H, dir: -Math.PI * 0.42, spread: 0.45 },
            { x: W, y: H, dir: -Math.PI * 0.32, spread: 0.55 },
        ];

        const popParticles = [];
        cannons.forEach(c => {
            for (let i = 0; i < 50; i++) {
                const angle = c.dir + (Math.random() - 0.5) * c.spread;
                const speed = 11 + Math.random() * 19;
                popParticles.push({
                    x: c.x, y: c.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.38,
                    sz: 5 + Math.random() * 11,
                    rot: Math.random() * Math.PI * 2,
                    rotV: (Math.random() - 0.5) * 0.18,
                    col: PCOLS[Math.floor(Math.random() * PCOLS.length)],
                    petals: 5 + Math.floor(Math.random() * 3),
                    life: 1.0,
                    alpha: 0.8 + Math.random() * 0.2,
                });
            }
        });

        function drawPopFlower(sz, petals, col, alpha) {
            const step = (Math.PI * 2) / petals;
            pCtx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')';
            for (let i = 0; i < petals; i++) {
                pCtx.save();
                pCtx.rotate(step * i);
                pCtx.beginPath();
                pCtx.ellipse(0, -sz * 0.52, sz * 0.22, sz * 0.52, 0, 0, Math.PI * 2);
                pCtx.fill();
                pCtx.restore();
            }
            // golden centre
            pCtx.beginPath();
            pCtx.arc(0, 0, sz * 0.2, 0, Math.PI * 2);
            pCtx.fillStyle = 'rgba(222,201,122,' + Math.min(alpha + 0.2, 1) + ')';
            pCtx.fill();
        }

        function popTick() {
            pCtx.clearRect(0, 0, popCanvas.width, popCanvas.height);
            let alive = false;
            popParticles.forEach(p => {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rotV;
                p.life -= 0.006;
                if (p.life <= 0 || p.y > popCanvas.height + 80) return;
                alive = true;
                pCtx.save();
                pCtx.translate(p.x, p.y);
                pCtx.rotate(p.rot);
                drawPopFlower(p.sz, p.petals, p.col, p.alpha * p.life);
                pCtx.restore();
            });
            if (alive) {
                requestAnimationFrame(popTick);
            } else {
                popCanvas.style.display = 'none';
            }
        }
        popTick();
    }

    function initParticles() {
        const container = document.getElementById('particles-js');
        // Guard against double-initialisation
        if (container.querySelector('canvas')) return;

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        // Colour palette: warm white, ivory, gold, gold-light
        const COLS = [
            [255, 255, 245],
            [255, 248, 220],
            [197, 160, 89],
            [232, 216, 176],
            [255, 230, 180],
        ];

        function mkFlower(fresh) {
            return {
                x: Math.random() * canvas.width,
                y: fresh ? -30 - Math.random() * 60 : Math.random() * canvas.height,
                sz: 7 + Math.random() * 11,
                vy: 0.45 + Math.random() * 1.1,
                vx: (Math.random() - 0.5) * 0.35,
                rot: Math.random() * Math.PI * 2,
                rotV: (Math.random() - 0.5) * 0.022,
                swayF: 0.0022 + Math.random() * 0.003,
                swayP: Math.random() * Math.PI * 2,
                alpha: 0.3 + Math.random() * 0.45,
                col: COLS[Math.floor(Math.random() * COLS.length)],
                petals: 5 + Math.floor(Math.random() * 3),
                t: 0,
            };
        }

        function drawFlower(sz, petals, col, alpha) {
            const angleStep = (Math.PI * 2) / petals;
            const pLen = sz;
            const pW = sz * 0.38;
            ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')';
            for (let i = 0; i < petals; i++) {
                ctx.save();
                ctx.rotate(angleStep * i);
                ctx.beginPath();
                ctx.ellipse(0, -pLen * 0.52, pW * 0.48, pLen * 0.52, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            // Centre dot in gold
            ctx.beginPath();
            ctx.arc(0, 0, sz * 0.17, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(197,160,89,' + Math.min(alpha + 0.15, 1) + ')';
            ctx.fill();
        }

        let particles = [];
        for (let i = 0; i < 25; i++) particles.push(mkFlower(false));

        let frame = 0;
        function tick() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;
            if (particles.length < 35 && frame % 65 === 0) particles.push(mkFlower(true));

            particles = particles.filter(function (p) {
                p.t++;
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.t * p.swayF + p.swayP) * 0.55;
                p.rot += p.rotV;
                if (p.y > canvas.height + 60) return false;

                const a = p.t < 35 ? (p.t / 35) * p.alpha : p.alpha;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                drawFlower(p.sz, p.petals, p.col, a);
                ctx.restore();
                return true;
            });

            requestAnimationFrame(tick);
        }
        tick();
    }

    initCursorTrail();
});
    

