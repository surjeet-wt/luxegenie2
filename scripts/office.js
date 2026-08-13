// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Define the office image sequence paths
const startFrame = 19;
const endFrame = 201;
const imagePaths = [];
for (let i = startFrame; i <= endFrame; i++) {
    if (i === 194) continue; // Skip missing frame
    imagePaths.push(`assets/sequences/office/frame_${String(i).padStart(3, '0')}.jpg`);
}
const totalFrames = imagePaths.length;

// Preloader / Cache
const imageCache = {}; // path -> Image
const loadPromises = {}; // path -> Promise<Image>

function loadFrameByPath(path) {
    if (!path) return Promise.resolve(null);
    if (imageCache[path] && imageCache[path].dataset.loaded === 'true') {
        return Promise.resolve(imageCache[path]);
    }
    if (loadPromises[path]) {
        return loadPromises[path];
    }

    const promise = new Promise((resolve) => {
        const img = new Image();
        img.dataset.path = path;
        img.dataset.loaded = 'false';
        img.onload = () => {
            if (typeof img.decode === 'function') {
                img.decode()
                    .then(() => {
                        img.dataset.loaded = 'true';
                        resolve(img);
                    })
                    .catch(() => {
                        img.dataset.loaded = 'true';
                        resolve(img);
                    });
            } else {
                img.dataset.loaded = 'true';
                resolve(img);
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${path}`);
            resolve(null);
        };
        img.src = path;
        imageCache[path] = img;
    });

    loadPromises[path] = promise;
    return promise;
}

// Find closest loaded frame to avoid visual flashes
function findClosestLoadedFrame(index) {
    const path = imagePaths[index];
    if (path && imageCache[path] && imageCache[path].dataset.loaded === 'true') {
        return imageCache[path];
    }
    
    // Search outward
    let offset = 1;
    while (index - offset >= 0 || index + offset < totalFrames) {
        if (index - offset >= 0) {
            const leftPath = imagePaths[index - offset];
            if (leftPath && imageCache[leftPath] && imageCache[leftPath].dataset.loaded === 'true') {
                return imageCache[leftPath];
            }
        }
        if (index + offset < totalFrames) {
            const rightPath = imagePaths[index + offset];
            if (rightPath && imageCache[rightPath] && imageCache[rightPath].dataset.loaded === 'true') {
                return imageCache[rightPath];
            }
        }
        offset++;
    }
    return null;
}

// Canvas & Rendering
const canvas = document.getElementById('office-canvas');
const context = canvas.getContext('2d');

let currentFrameIndex = 0;
let targetFrameIndex = 0;

function drawImageCover(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    if (!img || img.dataset.loaded !== 'true') return;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = Math.max(w / iw, h / ih);

    let nw = iw * r;
    let nh = ih * r;
    let cx, cy, cw, ch;

    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

function renderFrame(index) {
    const img = findClosestLoadedFrame(index);
    if (img && img.dataset.loaded === 'true') {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        context.save();
        context.scale(dpr, dpr);
        
        drawImageCover(context, img, 0, 0, window.innerWidth, window.innerHeight);
        
        context.restore();
    }
}

function renderLoop() {
    // Smoothen scrubbing interpolation
    if (Math.abs(targetFrameIndex - currentFrameIndex) > 0.01) {
        currentFrameIndex += (targetFrameIndex - currentFrameIndex) * 0.12; // Easing factor
        renderFrame(Math.round(currentFrameIndex));
    }
    requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    renderFrame(Math.round(currentFrameIndex));
}

// Background Image Preloader
async function startPreloader() {
    // 1. Immediately load the very first frame to render under 1234.png if needed
    if (imagePaths.length > 0) {
        await loadFrameByPath(imagePaths[0]);
        renderFrame(0);
    }
    
    // 2. Load the remaining images in small non-blocking chunks
    const batchSize = 6;
    for (let i = 1; i < totalFrames; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && (i + j) < totalFrames; j++) {
            batch.push(loadFrameByPath(imagePaths[i + j]));
        }
        await Promise.all(batch);
        // Sync canvas draw if sequence is active
        if (targetFrameIndex > 0) {
            renderFrame(Math.round(currentFrameIndex));
        }
    }
}

// Menu overlay toggles
const menuBtn = document.querySelector('.header-menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

const navLinks = document.querySelectorAll('.menu-link, .header-contact-btn');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (menuBtn) menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
});

const socialLinks = document.querySelectorAll('.menu-social-link');
socialLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (menuBtn) menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
});

// Initial load sequence
window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');

    const transitionOverlay = document.getElementById('transition-overlay');
    if (transitionOverlay) {
        // Start transparently for page fade-in
        transitionOverlay.classList.remove('active');
    }
    
    // Setup Canvas dimensioning
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start background image sequence load
    startPreloader();
    
    // Build ScrollTrigger scrubbing timeline
    const sequenceObj = { frame: 0 };
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#office-scroll-container",
            start: "top top",
            end: "+=380vh", // Sets the pinning scroll distance to 380vh for an even slower scroll-scrub
            scrub: true, // Instant updating to match scrollbar perfectly
            pin: true,
            anticipatePin: 1
        }
    });
    
    // Step 1: Fade out the scroll indicator overlay on scroll
    tl.to(".scroll-indicator-wrapper", {
        opacity: 0,
        y: -30,
        duration: 0.1,
        ease: "power2.out"
    }, 0);
    
    // Step 2: Scrub the image sequence frames (completes scrubbing on the last image at the bottom of the section)
    tl.to(sequenceObj, {
        frame: totalFrames - 1,
        ease: "none",
        duration: 0.95,
        onUpdate: () => {
            targetFrameIndex = sequenceObj.frame;
        }
    }, 0.05); // Scrubs from 0.05 to 1.0 (releasing the scroll pinning immediately on the last frame)

    // Staggered pull-up animations for the More than a lamp section
    gsap.fromTo(".features-main-title",
        { y: 40, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".office-features-section",
                start: "top 88%",
                toggleActions: "play none none reverse"
            }
        }
    );

    gsap.fromTo(".features-main-desc",
        { y: 30, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 1.2,
            delay: 0.15,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".office-features-section",
                start: "top 88%",
                toggleActions: "play none none reverse"
            }
        }
    );

    gsap.fromTo(".feature-card-col",
        { y: 50, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".features-grid-three-col",
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        }
    );

    // -------------------------------------------------------------
    // Product Specifications Interactive Animations
    // -------------------------------------------------------------
    
    // Scale up and fade in the center image on scroll
    gsap.fromTo(".specs-product-img-container",
        { opacity: 0, scale: 0.85 },
        {
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".office-specs-section",
                start: "top 80%",
                toggleActions: "play none none reverse",
                onEnter: () => {
                    const sec = document.querySelector(".office-specs-section");
                    if (sec) sec.classList.add("active");
                },
                onLeaveBack: () => {
                    const sec = document.querySelector(".office-specs-section");
                    if (sec) sec.classList.remove("active");
                }
            }
        }
    );

    // Staggered slide in for Left Column Items
    gsap.fromTo(".specs-left-col .spec-item",
        { x: -40, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".office-specs-section",
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        }
    );

    // Staggered slide in for Right Column Items
    gsap.fromTo(".specs-right-col .spec-item",
        { x: 40, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".office-specs-section",
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        }
    );

    // Interactive hover handlers for lines and glowing spots
    const specItems = document.querySelectorAll(".spec-item");
    specItems.forEach(item => {
        item.addEventListener("mouseenter", () => {
            const target = item.getAttribute("data-target");
            const dot = document.querySelector(`.glow-${target}`);
            if (dot) dot.classList.add("active");
            
            // Highlight connector line path
            const path = item.querySelector(".spec-line-path");
            if (path) {
                path.style.strokeWidth = "2px";
                path.style.stroke = "#ffffff"; // highlight path to white on hover
            }
        });
        
        item.addEventListener("mouseleave", () => {
            const target = item.getAttribute("data-target");
            const dot = document.querySelector(`.glow-${target}`);
            if (dot) dot.classList.remove("active");
            
            // Restore connector line path
            const path = item.querySelector(".spec-line-path");
            if (path) {
                path.style.strokeWidth = "1.1px";
                path.style.stroke = "var(--accent-color)";
            }
        });
    });

    // -------------------------------------------------------------
    // Executive Spaces Carousel Logic
    // -------------------------------------------------------------
    const spacesCards = document.querySelectorAll(".space-card");
    const spacesDots = document.querySelectorAll(".carousel-dot");
    const spacesPrevBtn = document.querySelector(".prev-btn");
    const spacesNextBtn = document.querySelector(".next-btn");
    
    let spacesIndex = 0;
    const totalSpaces = spacesCards.length;
    let spacesInterval = null;
    
    function updateSpacesCarousel(index) {
        spacesIndex = (index + totalSpaces) % totalSpaces;
        
        spacesCards.forEach((card, i) => {
            card.classList.remove("active", "prev", "next");
            
            const prevIdx = (spacesIndex - 1 + totalSpaces) % totalSpaces;
            const nextIdx = (spacesIndex + 1) % totalSpaces;
            
            if (i === spacesIndex) {
                card.classList.add("active");
            } else if (i === prevIdx) {
                card.classList.add("prev");
            } else if (i === nextIdx) {
                card.classList.add("next");
            }
        });
        
        spacesDots.forEach((dot, i) => {
            if (i === spacesIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }
    
    function startSpacesAutoPlay() {
        stopSpacesAutoPlay();
        spacesInterval = setInterval(() => {
            updateSpacesCarousel(spacesIndex + 1);
        }, 5000); // Auto-rotation every 5 seconds
    }
    
    function stopSpacesAutoPlay() {
        if (spacesInterval) {
            clearInterval(spacesInterval);
            spacesInterval = null;
        }
    }
    
    // Initialize
    if (totalSpaces > 0) {
        updateSpacesCarousel(spacesIndex);
        startSpacesAutoPlay();
        
        // Pause timer on hover
        const wrapper = document.querySelector(".spaces-carousel-wrapper");
        if (wrapper) {
            wrapper.addEventListener("mouseenter", stopSpacesAutoPlay);
            wrapper.addEventListener("mouseleave", startSpacesAutoPlay);
        }
        
        // Dots click handling
        spacesDots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                updateSpacesCarousel(i);
                startSpacesAutoPlay();
            });
        });
        
        // Navigation buttons
        if (spacesPrevBtn) {
            spacesPrevBtn.addEventListener("click", () => {
                updateSpacesCarousel(spacesIndex - 1);
                startSpacesAutoPlay();
            });
        }
        
        if (spacesNextBtn) {
            spacesNextBtn.addEventListener("click", () => {
                updateSpacesCarousel(spacesIndex + 1);
                startSpacesAutoPlay();
            });
        }
    }

    // Hero skip buttons click handler
    document.querySelectorAll(".hero-skip-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.querySelector(".office-features-section");
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // Start rendering frame loop
    requestAnimationFrame(renderLoop);
});
