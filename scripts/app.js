// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Build virtual frame list array
const frameMetadata = [];

// ==========================================
// 1a. MAIN SEQUENCE
// frame_000001.jpg se start hoga
// ==========================================
for (let i = 1; i <= 102; i++) {

    let opacity = 1.0;

    // First frame completely visible
    if (i === 1) {
        opacity = 1.0;
    }

    // Optional fade-in after first frame
    else if (i <= 25) {
        opacity = (i - 1) / 24;
    }

    frameMetadata.push({
        type: 'standard',
        path: `assets/sequences/main/frame_${String(i).padStart(6, '0')}.jpg`,
        actualIndex: i,
        opacity: opacity
    });
}


// ==========================================
// 1b. RENDER VIDEO PAUSE
// frame 82 ko visible rakho
// ==========================================
for (let i = 0; i < 150; i++) {

    frameMetadata.push({
        type: 'render-video-pause',
        path: 'assets/sequences/main/frame_000082.jpg',
        actualIndex: 82,
        opacity: 1.0
    });
}


// ==========================================
// 1c. FEATURES PAUSE
// frame 82 visible rahega
// ==========================================
for (let i = 0; i < 150; i++) {

    let opacity = 1.0;

    // Fade in
    if (i < 25) {
        opacity = i / 24;
    }

    // Fade out
    else if (i >= 125) {
        opacity = (149 - i) / 24;
    }

    frameMetadata.push({
        type: 'features-pause',
        path: 'assets/sequences/main/frame_000082.jpg',
        actualIndex: 82,
        opacity: opacity
    });
}
// 1f. Intelligent, Served section using static asset image (frames 634 to 789)
for (let i = 634; i <= 789; i++) {
    frameMetadata.push({
        type: 'standard',
        path: 'assets/images/yy.png',
        actualIndex: i
    });
}

// Black fade-in transition after Intelligent, Served before 2x2 Collage (20 virtual frames)
const collageFadeInCount = 20;
for (let i = 0; i < collageFadeInCount; i++) {
    const opacity = (i + 1) / collageFadeInCount;
    frameMetadata.push({
        type: 'black-fade',
        opacity: opacity,
        path: 'assets/images/yy.png',
        actualIndex: 789
    });
}

// 2. Virtual frames: collage section pause
for (let i = 0; i < 120; i++) {
    frameMetadata.push({
        type: 'collage-pause',
        path: 'assets/images/yy.png',
        actualIndex: 789
    });
}

// 3. Voices of Our Customers section pause
for (let i = 0; i < 120; i++) {
    frameMetadata.push({
        type: 'voices-pause',
        path: 'assets/images/yy.png',
        actualIndex: 789
    });
}

// 4. Footer section pause (showing the new beautiful reference footer)
for (let i = 0; i < 120; i++) {
    frameMetadata.push({
        type: 'footer-pause',
        path: 'assets/images/yy.png',
        actualIndex: 789
    });
}





// Configuration
const totalFrames = frameMetadata.length;
let currentFrameIndex = 0;

// Helper to find the virtual frame index corresponding to a standard actual frame index
function getVirtualFrameIndexByActual(actualIndex, type = 'standard') {
    const idx = frameMetadata.findIndex(f => f.type === type && f.actualIndex === actualIndex);
    return idx !== -1 ? idx : 0;
}

// Dynamic Pause Index Detection
let renderVideoPauseStart = -1;
let renderVideoPauseEnd = -1;
let featuresPauseStart = -1;
let featuresPauseEnd = -1;


let voicesPauseStart = -1;
let voicesPauseEnd = -1;
let collagePauseStart = -1;
let collagePauseEnd = -1;
let footerPauseStart = -1;
let footerPauseEnd = -1;

function initDynamicPauseIndices() {
    renderVideoPauseStart = frameMetadata.findIndex(f => f.type === 'render-video-pause');
    if (renderVideoPauseStart !== -1) {
        renderVideoPauseEnd = frameMetadata.map(f => f.type).lastIndexOf('render-video-pause');
    }

    featuresPauseStart = frameMetadata.findIndex(f => f.type === 'features-pause');
    if (featuresPauseStart !== -1) {
        featuresPauseEnd = frameMetadata.map(f => f.type).lastIndexOf('features-pause');
    }

    voicesPauseStart = frameMetadata.findIndex(f => f.type === 'voices-pause');
    if (voicesPauseStart !== -1) {
        voicesPauseEnd = frameMetadata.map(f => f.type).lastIndexOf('voices-pause');
    }

    collagePauseStart = frameMetadata.findIndex(f => f.type === 'collage-pause');
    if (collagePauseStart !== -1) {
        collagePauseEnd = frameMetadata.map(f => f.type).lastIndexOf('collage-pause');
    }

    footerPauseStart = frameMetadata.findIndex(f => f.type === 'footer-pause');
    if (footerPauseStart !== -1) {
        footerPauseEnd = frameMetadata.map(f => f.type).lastIndexOf('footer-pause');
    }
}
initDynamicPauseIndices();

// Dynamic Preloader Targets
let stage1Targets = [];
let loadedStage1Count = 0;

// Setup Stage 1 Preloader indices (First 80 frames + every 10th frame across the remaining timeline)
function setupStage1Targets() {
    const targets = new Set();
    
    // First 80 frames are essential for starting scroll
    for (let i = 0; i < 80; i++) {
        targets.add(i);
    }
    
    // Every 10th frame across the entire timeline to ensure a coarse frame is always loaded
    for (let i = 0; i < totalFrames; i += 10) {
        targets.add(i);
    }
    
    stage1Targets = Array.from(targets).sort((a, b) => a - b);
}

// DOM Elements
const canvas = document.getElementById('video-canvas');
const context = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loaderPercentage = document.getElementById('loader-percentage');

// Fit image to canvas (equivalent to CSS object-fit: cover)
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

// Find closest loaded frame to index to avoid flashing blank screens
function findClosestLoadedFrame(index) {
    const frame = frameMetadata[index];
    if (frame && frame.path && imageCache[frame.path] && imageCache[frame.path].dataset.loaded === 'true') {
        return imageCache[frame.path];
    }
    
    // Search outward
    let offset = 1;
    while (index - offset >= 0 || index + offset < totalFrames) {
        if (index - offset >= 0) {
            const fLeft = frameMetadata[index - offset];
            if (fLeft && fLeft.path && imageCache[fLeft.path] && imageCache[fLeft.path].dataset.loaded === 'true') {
                return imageCache[fLeft.path];
            }
        }
        if (index + offset < totalFrames) {
            const fRight = frameMetadata[index + offset];
            if (fRight && fRight.path && imageCache[fRight.path] && imageCache[fRight.path].dataset.loaded === 'true') {
                return imageCache[fRight.path];
            }
        }
        offset++;
    }
    return null;
}

// Scroll inactivity detection system
// Pauses background frame downloading while the user is actively scrolling
// to dedicate 100% of browser resources to rendering smooth visuals.
let isScrolling = false;
let scrollTimeout = null;

window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 200); // 200ms threshold for inactivity
});

async function checkScrollPause() {
    while (isScrolling) {
        await new Promise((r) => setTimeout(r, 50)); // Poll every 50ms
    }
}

// Load a single frame and return a Promise
function loadFrame(index) {
    const frame = frameMetadata[index];
    if (!frame) return Promise.resolve(null);
    
    if (frame.type === 'gold-transition') {
        return Promise.all([
            loadFrameByPath(frame.underlayPath),
            loadFrameByPath(frame.path)
        ]).then(([underlayImg, img]) => img);
    }
    
    return loadFrameByPath(frame.path);
}

// Resize canvas taking Retina/DPI settings into account (capped at 1.5 for performance)
function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Force redraw on resize
    lastRenderedFrameIndex = -1;
    renderFrame(currentFrameIndex);
}

let lastRenderedFrameIndex = -1;

// Render the specified frame index to canvas (filtering out redundant updates)
function renderFrame(index) {
    if (index === lastRenderedFrameIndex) return; // Skip redundant draw!
    
    currentFrameIndex = index;
    const frame = frameMetadata[index];
    if (!frame) return;

    const img = findClosestLoadedFrame(index);
    if (img) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.save();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        context.scale(dpr, dpr);
        
        if (frame.type === 'gold-transition') {
            // Draw standard sequence underlay first
            const underlayImg = imageCache[frame.underlayPath];
            if (underlayImg && underlayImg.dataset.loaded === 'true') {
                drawImageCover(context, underlayImg, 0, 0, window.innerWidth, window.innerHeight);
            }
            // Draw gold sequence frame on top with transition opacity
            context.globalAlpha = frame.opacity;
            drawImageCover(context, img, 0, 0, window.innerWidth, window.innerHeight);
        } else if (frame.path === 'assets/images/yy.png') {
            context.fillStyle = '#000000';
            context.fillRect(0, 0, window.innerWidth, window.innerHeight);
            
            // Only draw the device image if it's NOT a collage-pause or voices-pause frame
            if (frame.type !== 'collage-pause' && frame.type !== 'voices-pause') {
                const maxW = window.innerWidth * 0.98;
                const maxH = window.innerHeight * 0.98;
                const r = Math.min(maxW / img.width, maxH / img.height);
                const w = img.width * r;
                const h = img.height * r;
                const x = (window.innerWidth - w) / 2;
                const y = (window.innerHeight - h) / 2 + 3;
                context.drawImage(img, x, y, w, h);
            }

            if (frame.type === 'black-fade') {
                context.fillStyle = `rgba(0, 0, 0, ${frame.opacity})`;
                context.fillRect(0, 0, window.innerWidth, window.innerHeight);
            }
        } else {
            context.globalAlpha = frame.opacity !== undefined ? frame.opacity : 1.0;
            drawImageCover(context, img, 0, 0, window.innerWidth, window.innerHeight);
            
            if (frame.type === 'black-fade') {
                context.fillStyle = `rgba(0, 0, 0, ${frame.opacity})`;
                context.fillRect(0, 0, window.innerWidth, window.innerHeight);
            }
        }
        
        context.restore();
        lastRenderedFrameIndex = index;
    }
}

// Preloader Logic
async function startPreloader() {
    setupStage1Targets();
    const STAGE1_TOTAL = stage1Targets.length;
    
    // Preload static section background asset
    loadFrameByPath('assets/images/yy.png');
    loadFrameByPath('assets/images/website44.png');
    
    // Stage 1: Load immediate first frames + coarse timeline markers
    const chunkSize = 15;
    for (let i = 0; i < STAGE1_TOTAL; i += chunkSize) {
        const chunk = [];
        for (let j = i; j < Math.min(i + chunkSize, STAGE1_TOTAL); j++) {
            const frameIndex = stage1Targets[j];
            chunk.push(
                loadFrame(frameIndex).then((img) => {
                    loadedStage1Count++;
                    const progress = Math.min(Math.floor((loadedStage1Count / STAGE1_TOTAL) * 100), 100);
                    loaderBar.style.width = `${progress}%`;
                    loaderPercentage.textContent = `${String(progress).padStart(2, '0')}%`;
                    return img;
                })
            );
        }
        await Promise.all(chunk);
    }
    
    // Stage 1 Complete: Initialize view
    document.body.classList.add('loaded');
    resizeCanvas();
    renderFrame(0);
    initializeGSAP();

    // Check URL hash on page load and jump to the corresponding section
    const hash = window.location.hash;
    if (hash) {
        setTimeout(() => {
            if (hash === '#home') {
                scrollToVirtualFrame(0);
            } else if (hash === '#story') {
                scrollToVirtualFrame(getVirtualFrameIndexByActual(70));
            } else if (hash === '#specifications') {
                scrollToVirtualFrame(getVirtualFrameIndexByActual(700));
            } else if (hash === '#office' || hash === '#restaurants') {
                const middlePause = collagePauseStart + Math.floor((collagePauseEnd - collagePauseStart) / 2);
                scrollToVirtualFrame(middlePause);

            } else if (hash === '#contact') {
                scrollToVirtualFrame(footerPauseStart);
            }
        }, 400); // 400ms delay to ensure GSAP/ScrollTrigger are initialized and preloader layout has faded out
    }
    
    // Background loading: Stage 2
    startBackgroundPreload();
}

// Background Asset Streams (Non-blocking)
async function startBackgroundPreload() {
    // Stage 2: Fine-grained preloading to fill in remaining gaps
    const remainingIndices = [];
    for (let i = 0; i < totalFrames; i++) {
        const frame = frameMetadata[i];
        if (frame && frame.path) {
            const isLoaded = imageCache[frame.path] && imageCache[frame.path].dataset.loaded === 'true';
            const isUnderlayLoaded = frame.underlayPath ? (imageCache[frame.underlayPath] && imageCache[frame.underlayPath].dataset.loaded === 'true') : true;
            if (!isLoaded || !isUnderlayLoaded) {
                remainingIndices.push(i);
            }
        }
    }
    
    const stage2ChunkSize = 5;
    for (let i = 0; i < remainingIndices.length; i += stage2ChunkSize) {
        await checkScrollPause(); // PAUSE LOADING IF USER IS SCROLLING
        
        const chunk = [];
        for (let j = i; j < Math.min(i + stage2ChunkSize, remainingIndices.length); j++) {
            chunk.push(loadFrame(remainingIndices[j]));
        }
        await Promise.all(chunk);
        // Throttled delay to prevent frame drops during scrolling
        await new Promise((r) => setTimeout(r, 10));
    }
}

// Center-Aligned Info Section Overlay Controller
const infoOverlay = document.getElementById('info-overlay');
const infoHeading = document.querySelector('.info-heading');
let textSplitDone = false;
let isInfoVisible = false;

// Helper to wrap text letters in span tags for character-by-character animation
function splitTextIntoSpans(element) {
    const text = element.innerHTML;
    // Temporarily replace <br> tags with a marker token
    const tempText = text.replace(/<br\s*\/?>/gi, ' [br] ');
    const tokens = tempText.split(/\s+/);
    element.innerHTML = '';
    
    let charCounter = 0; // Global character index for staggered animations
    
    tokens.forEach((token, index) => {
        if (token === '[br]') {
            element.appendChild(document.createElement('br'));
        } else {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.style.display = 'inline-block';
            wordSpan.style.overflow = 'hidden';
            wordSpan.style.verticalAlign = 'bottom';
            
            for (let i = 0; i < token.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.style.display = 'inline-block';
                charSpan.style.transform = 'translateY(100%)';
                charSpan.style.opacity = '0';
                charSpan.textContent = token[i];
                // Staggered animation delay to sweep the gold shimer from left to right across the heading
                charSpan.style.animationDelay = `${charCounter * 0.08}s`;
                charCounter++;
                wordSpan.appendChild(charSpan);
            }
            element.appendChild(wordSpan);
            
            // Re-add space separator between words unless followed by a break tag
            if (index < tokens.length - 1 && tokens[index + 1] !== '[br]') {
                element.appendChild(document.createTextNode(' '));
            }
        }
    });
}

function setupInfoOverlayText() {
    if (infoHeading && !textSplitDone) {
        splitTextIntoSpans(infoHeading);
        textSplitDone = true;
    }
}

function updateInfoOverlayVisibility(frame) {
    setupInfoOverlayText();
    
    if (infoOverlay && frame) {
        // Show only between frame_000042 (index 42) and frame_000100 (index 100) of standard sequence
        if (frame.type === 'standard' && frame.actualIndex >= 42 && frame.actualIndex <= 100) {
            if (!isInfoVisible) {
                isInfoVisible = true;
                infoOverlay.classList.add('visible');
                
                // Premium stagger character animation from bottom up
                gsap.to('#info-overlay .char', {
                    translateY: '0%',
                    opacity: 1,
                    stagger: 0.02,
                    duration: 0.7,
                    ease: "power3.out",
                    overwrite: "auto"
                });

                // Scale transition: starts smaller and gets bigger
                gsap.fromTo('#info-overlay .info-heading', {
                    scale: 0.8
                }, {
                    scale: 1,
                    duration: 0.9,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            }
        } else {
            if (isInfoVisible) {
                isInfoVisible = false;
                
                // Slide characters down stagger-style when leaving viewport
                gsap.to('#info-overlay .char', {
                    translateY: '100%',
                    opacity: 0,
                    stagger: 0.01,
                    duration: 0.4,
                    ease: "power3.in",
                    overwrite: "auto",
                    onComplete: () => {
                        if (!isInfoVisible) {
                            infoOverlay.classList.remove('visible');
                        }
                    }
                });

                // Scale down transition when leaving
                gsap.to('#info-overlay .info-heading', {
                    scale: 0.8,
                    duration: 0.4,
                    ease: "power3.in",
                    overwrite: "auto"
                });
            } else {
                infoOverlay.classList.remove('visible');
            }
        }
    }
}

// Render Video Fullscreen Overlay & Curtain Controller
const renderVideoOverlay = document.getElementById('render-video-overlay');
const renderVideo = document.getElementById('render-video');
let isRenderVideoVisible = false;

function updateRenderVideoVisibility(virtualFrame) {
    if (renderVideoOverlay && renderVideo) {
        // Keep video overlay active strictly during render video section pause
        if (virtualFrame >= renderVideoPauseStart && virtualFrame <= renderVideoPauseEnd) {
            if (!isRenderVideoVisible) {
                isRenderVideoVisible = true;
                renderVideoOverlay.classList.add('visible');
            }
        } else {
            if (isRenderVideoVisible) {
                isRenderVideoVisible = false;
                renderVideoOverlay.classList.remove('visible');
                const wrapper = document.querySelector('.render-video-wrapper');
                if (renderVideo) {
                    renderVideo.pause();
                }
                if (wrapper) {
                    wrapper.classList.remove('playing');
                }
            }
        }
    }
}

// Fullscreen Static Background Curtain Controller
const tySectionCurtain = document.getElementById('ty-section-curtain');
let isTyCurtainVisible = false;

function updateTyCurtainVisibility(virtualFrame) {
    const curtainEnd = collagePauseStart > -1 ? collagePauseStart - 1 : 550;
    // Curtain starts after the features-pause window to avoid showing yy.png under the features overlay
    const curtainStart = featuresPauseEnd > -1 ? featuresPauseEnd + 1 : 253;

    // Static background curtain slides UP over video frame during Vision & Mission through Intelligent, Served
    if (tySectionCurtain) {
        if (virtualFrame >= curtainStart && virtualFrame <= curtainEnd) {
            if (!isTyCurtainVisible) {
                isTyCurtainVisible = true;
                tySectionCurtain.classList.add('visible');
            }
        } else {
            if (isTyCurtainVisible) {
                isTyCurtainVisible = false;
                tySectionCurtain.classList.remove('visible');
            }
        }
    }
}

// Split Features Section (Vision & Mission) Overlay Controller
const featuresOverlay = document.getElementById('features-overlay');
let isFeaturesVisible = false;

function updateFeaturesOverlayVisibility(virtualFrame) {
    if (featuresOverlay) {
        if (virtualFrame >= featuresPauseStart && virtualFrame <= featuresPauseEnd) {
            if (!isFeaturesVisible) {
                isFeaturesVisible = true;
                featuresOverlay.classList.add('visible');
                
                // Animate left side image wrapper sliding in from left
                gsap.fromTo('#features-overlay .features-left', {
                    opacity: 0,
                    x: -40
                }, {
                    opacity: 1,
                    x: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    overwrite: "auto"
                });
                
                // Stagger animate the main heading and 4 copy blocks rising up and fading in from right
                gsap.fromTo('#features-overlay .features-main-heading, #features-overlay .features-text-block', {
                    opacity: 0,
                    y: 30
                }, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.15,
                    duration: 0.9,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            }
        } else {
            if (isFeaturesVisible) {
                isFeaturesVisible = false;
                gsap.to(featuresOverlay, {
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.inOut",
                    overwrite: "auto",
                    onComplete: () => {
                        if (!isFeaturesVisible) {
                            featuresOverlay.classList.remove('visible');
                            gsap.set(featuresOverlay, { clearProps: "opacity" });
                        }
                    }
                });
            } else {
                featuresOverlay.classList.remove('visible');
            }
        }
    }
}


// Concierge & Stats Section Overlay Controller
const conciergeOverlay = document.getElementById('concierge-overlay');
const conciergeHeadings = document.querySelectorAll('.concierge-heading, .concierge-distinction-heading');
let conciergeSplitDone = false;
let isConciergeVisible = false;

function setupConciergeOverlayText() {
    if (conciergeHeadings.length > 0 && !conciergeSplitDone) {
        conciergeHeadings.forEach(heading => {
            splitTextIntoSpans(heading);
        });
        conciergeSplitDone = true;
    }
}

function updateConciergeOverlayVisibility(frame) {
    setupConciergeOverlayText();
    
    if (conciergeOverlay && frame) {
        // Show only between frame_000634 (index 634) and frame_000789 (index 789) of standard sequence
        if (frame.type === 'standard' && frame.actualIndex >= 634 && frame.actualIndex <= 789) {
            if (!isConciergeVisible) {
                isConciergeVisible = true;
                conciergeOverlay.classList.add('visible');
                
                // Stagger characters rising up
                gsap.to('#concierge-overlay .char', {
                    translateY: '0%',
                    opacity: 1,
                    stagger: 0.015,
                    duration: 0.7,
                    ease: "power3.out",
                    overwrite: "auto"
                });
                
                // Slide up subheadings
                gsap.to('#concierge-overlay .concierge-subheading', {
                    translateY: '0px',
                    opacity: 1,
                    duration: 0.8,
                    delay: 0.35,
                    ease: "power3.out",
                    overwrite: "auto"
                });
                
                // Stagger stats block cards slide up
                gsap.to('#concierge-overlay .stat-block', {
                    translateY: '0px',
                    opacity: 1,
                    stagger: 0.15,
                    duration: 0.8,
                    delay: 0.25,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            }
        } else {
            if (isConciergeVisible) {
                isConciergeVisible = false;
                
                // Stagger characters down
                gsap.to('#concierge-overlay .char', {
                    translateY: '100%',
                    opacity: 0,
                    stagger: 0.008,
                    duration: 0.4,
                    ease: "power3.in",
                    overwrite: "auto",
                    onComplete: () => {
                        if (!isConciergeVisible) {
                            conciergeOverlay.classList.remove('visible');
                        }
                    }
                });
                
                // Slide down subheadings
                gsap.to('#concierge-overlay .concierge-subheading', {
                    translateY: '15px',
                    opacity: 0,
                    duration: 0.4,
                    ease: "power3.in",
                    overwrite: "auto"
                });
                
                // Hide stats blocks
                gsap.to('#concierge-overlay .stat-block', {
                    translateY: '15px',
                    opacity: 0,
                    duration: 0.4,
                    ease: "power3.in",
                    overwrite: "auto"
                });
            } else {
                conciergeOverlay.classList.remove('visible');
            }
        }
    }
}

// Footer Section Overlay Controller (Copyright Bar)
const footerOverlay = document.getElementById('footer-overlay');
const footerTagline = document.querySelector('.footer-tagline');
let isFooterVisible = false;

function updateFooterOverlayVisibility(virtualFrame) {
    if (footerOverlay) {
        // Show during the final footer section pause
        if (virtualFrame >= footerPauseStart) {
            if (!isFooterVisible) {
                isFooterVisible = true;
                footerOverlay.classList.add('visible');
                // Force clear any GSAP inline opacity so CSS takes over
                if (footerTagline) {
                    gsap.set(footerTagline, { clearProps: 'opacity,transform,y' });
                }
            }
        } else {
            if (isFooterVisible) {
                isFooterVisible = false;
            }
            footerOverlay.classList.remove('visible');
        }
    }
}

// Voices of Our Customers Overlay Controller
const voicesOverlay = document.getElementById('voices-overlay');
const voicesCardsTrack = document.getElementById('voices-cards-track');
let isVoicesVisible = false;

function updateVoicesVisibility(virtualFrame) {
    if (voicesOverlay) {
        if (virtualFrame >= voicesPauseStart && virtualFrame <= voicesPauseEnd) {
            if (!isVoicesVisible) {
                isVoicesVisible = true;
                voicesOverlay.classList.add('visible');
                
                gsap.fromTo('#voices-overlay .partnering-container', {
                    opacity: 0,
                    y: 35
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    overwrite: "auto"
                });

                gsap.fromTo('#voices-overlay .voices-heading', {
                    opacity: 0,
                    y: 25
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    overwrite: "auto",
                    delay: 0.2
                });

                gsap.fromTo('#voices-overlay .voices-card', {
                    opacity: 0,
                    y: 40
                }, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.12,
                    duration: 0.9,
                    ease: "power3.out",
                    overwrite: "auto",
                    delay: 0.4
                });
            }
        } else {
            if (isVoicesVisible) {
                isVoicesVisible = false;

                // Stop all playing videos when scrolling away
                const cards = document.querySelectorAll('.voices-card');
                cards.forEach(card => {
                    card.classList.remove('playing');
                    const video = card.querySelector('.voices-video');
                    if (video) {
                        video.pause();
                    }
                });

                gsap.to('#voices-overlay', {
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.inOut",
                    overwrite: "auto",
                    onComplete: () => {
                        if (!isVoicesVisible) {
                            voicesOverlay.classList.remove('visible');
                            gsap.set('#voices-overlay', { clearProps: "opacity" });
                        }
                    }
                });
            } else {
                voicesOverlay.classList.remove('visible');
            }
        }
    }
}

// Voices Card Interaction setup (Video Click-to-Play Only)
function setupVoicesCardInteractions() {
    const cards = document.querySelectorAll('.voices-card');
    cards.forEach(card => {
        const wrapper = card.querySelector('.voices-video-wrapper');
        const video = card.querySelector('.voices-video');
        if (!wrapper || !video) return;

        wrapper.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (card.classList.contains('playing')) {
                card.classList.remove('playing');
                video.pause();
            } else {
                // Pause all other playing videos first
                cards.forEach(otherCard => {
                    if (otherCard !== card && otherCard.classList.contains('playing')) {
                        otherCard.classList.remove('playing');
                        const otherVideo = otherCard.querySelector('.voices-video');
                        if (otherVideo) {
                            otherVideo.pause();
                        }
                    }
                });

                card.classList.add('playing');
                video.muted = false;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Fallback to muted play if browser policy restricts
                        video.muted = true;
                        video.play().catch(() => {});
                    });
                }
            }
        });
    });

}

// Virtual Frame Mapping & 2x2 Collage Section Overlay Controller
const collageOverlay = document.getElementById('collage-overlay');
let isCollageVisible = false;
let collageTimeline = null;



function updateCollageVisibility(virtualFrame) {
    if (collageOverlay) {
        if (virtualFrame >= collagePauseStart && virtualFrame <= collagePauseEnd) {
            if (!isCollageVisible) {
                isCollageVisible = true;
                collageOverlay.classList.add('visible');
                
                // Kill any existing timeline to prevent race conditions during scrub
                if (collageTimeline) {
                    collageTimeline.kill();
                }
                
                collageTimeline = gsap.timeline({ overwrite: "auto" });
                
                // Immediate backdrop and card entrance
                collageTimeline.fromTo(collageOverlay, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, 0);
                collageTimeline.fromTo('#collage-overlay .collage-card', { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, 0);
            }
        } else {
            if (isCollageVisible) {
                isCollageVisible = false;
                
                if (collageTimeline) {
                    collageTimeline.kill();
                }
                
                collageTimeline = gsap.timeline({
                    overwrite: "auto",
                    onComplete: () => {
                        if (!isCollageVisible) {
                            collageOverlay.classList.remove('visible');
                        }
                    }
                });
                
                collageTimeline.to('#collage-overlay .collage-card', {
                    opacity: 0,
                    scale: 0.96,
                    y: 15,
                    stagger: 0.05,
                    duration: 0.5,
                    ease: "power2.in"
                }, 0);

                collageTimeline.to(collageOverlay, {
                    opacity: 0,
                    duration: 0.7,
                    ease: "power2.inOut"
                }, 0.2);
            } else {
                collageOverlay.classList.remove('visible');
            }
        }
    }
}



// Inertial Easing & Drift Rendering Loop
let targetFrame = 0;
let currentFrame = 0;
const frameLerpEase = 0.022; // Smoother float effect (reduced from 0.055)

function renderLoop() {
    // Smoothly ease currentFrame towards targetFrame
    currentFrame += (targetFrame - currentFrame) * frameLerpEase;
    
    // Snap value if difference is negligible
    let isSettled = false;
    if (Math.abs(targetFrame - currentFrame) < 0.005) {
        currentFrame = targetFrame;
        isSettled = true;
    }
    
    // Add 3D float effect to sequence canvas when scroll is stationary
    if (canvas) {
        if (isSettled) {
            canvas.classList.add('floating');
        } else {
            canvas.classList.remove('floating');
        }
    }
    
    const roundedIndex = Math.round(currentFrame);
    const frame = frameMetadata[roundedIndex];
    
    renderFrame(roundedIndex);

    updateInfoOverlayVisibility(frame);
    updateRenderVideoVisibility(roundedIndex);
    updateFeaturesOverlayVisibility(roundedIndex);
    updateTyCurtainVisibility(roundedIndex);

    updateVoicesVisibility(roundedIndex);
    updateConciergeOverlayVisibility(frame);
    updateFooterOverlayVisibility(roundedIndex);
    
    // 2x2 Collage reacts to virtual frame coordinates
    updateCollageVisibility(roundedIndex);
    
    // Handle scroll & skip indicators visibility (only visible during the first 30 frames)
    const scrollIndicator = document.getElementById('scroll-indicator');
    const skipWrappers = document.querySelectorAll('.skip-indicator-wrapper');
    
    if (roundedIndex >= 30) {
        if (scrollIndicator) {
            scrollIndicator.style.opacity = 0;
            scrollIndicator.style.visibility = 'hidden';
            scrollIndicator.style.pointerEvents = 'none';
        }
        skipWrappers.forEach(el => {
            el.style.opacity = 0;
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
        });
    } else {
        const progress = Math.min(roundedIndex / 30, 1);
        const opacityVal = 1 - progress;
        
        if (scrollIndicator) {
            scrollIndicator.style.opacity = opacityVal;
            scrollIndicator.style.visibility = opacityVal > 0.05 ? 'visible' : 'hidden';
            scrollIndicator.style.pointerEvents = opacityVal > 0.05 ? 'auto' : 'none';
            scrollIndicator.style.transform = `translateY(${-30 * progress}px)`;
        }
        skipWrappers.forEach(el => {
            el.style.opacity = opacityVal;
            el.style.visibility = opacityVal > 0.05 ? 'visible' : 'hidden';
            el.style.pointerEvents = opacityVal > 0.05 ? 'auto' : 'none';
            el.style.transform = `translateY(${-30 * progress}px)`;
        });
    }
    
    requestAnimationFrame(renderLoop);
}

// Initialize GSAP Animations
function initializeGSAP() {
    const sequenceObj = { frame: 0 };
    
    // Main video scrub timeline
    gsap.to(sequenceObj, {
        frame: totalFrames - 1,
        ease: "none",
        scrollTrigger: {
            trigger: "#scroll-container",
            start: "top top",
            end: "bottom bottom",
            scrub: true, // Syncs targetFrame directly to scroll position for raw responsiveness
            onUpdate: () => {
                targetFrame = sequenceObj.frame;
            }
        }
    });
    
    // Run the animation rendering loop
    requestAnimationFrame(renderLoop);
}

// Listeners
window.addEventListener('resize', resizeCanvas);

// Toggle menu active state to form the X sign and reveal full-screen overlay
const menuBtn = document.querySelector('.header-menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

// Smooth scroll to specific virtual frame index
function scrollToVirtualFrame(frameIndex) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = frameIndex / (totalFrames - 1);
    const targetScrollY = progress * maxScroll;
    window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
    });
}

// Close the menu and scroll smoothly to section when navigation links are clicked
const navLinks = document.querySelectorAll('.menu-link, .header-contact-btn');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            
            // Close menu if open
            if (menuBtn) menuBtn.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // Map anchor href to specific virtual frame indices dynamically
            if (href === '#home') {
                scrollToVirtualFrame(0);
            } else if (href === '#story') {
                scrollToVirtualFrame(getVirtualFrameIndexByActual(70));          // Inside Info Section (42 to 100)
            } else if (href === '#specifications') {
                scrollToVirtualFrame(getVirtualFrameIndexByActual(700));         // Inside Concierge & Distinction (634 to 789)
            } else if (href === '#office' || href === '#restaurants') {
                const middlePause = collagePauseStart + Math.floor((collagePauseEnd - collagePauseStart) / 2);
                scrollToVirtualFrame(middlePause);                               // Middle of collage pause

            } else if (href === '#contact') {
                scrollToVirtualFrame(footerPauseStart);        // Inside Footer overlay
            }
        }
    });
});

// Close menu when clicking social links
const socialLinks = document.querySelectorAll('.menu-social-link');
socialLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (menuBtn) menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
});



// Jump directly to specific virtual frame index with a smooth black fade transition
function jumpToVirtualFrameWithFade(frameIndex) {
    const transitionOverlay = document.getElementById('transition-overlay');
    if (!transitionOverlay) {
        // Fallback to standard smooth scroll if element is missing
        scrollToVirtualFrame(frameIndex);
        return;
    }
    
    // 1. Fade screen to black
    transitionOverlay.classList.add('active');
    
    setTimeout(() => {
        // 2. Instantly update scroll position when screen is fully black
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = frameIndex / (totalFrames - 1);
        const targetScrollY = progress * maxScroll;
        window.scrollTo({
            top: targetScrollY,
            behavior: 'auto' // Instant jump!
        });
        
        // Force ScrollTrigger to refresh and sync frames immediately
        ScrollTrigger.refresh();
        
        // Instantly snap target and current frame to prevent intermediate frames from rendering
        targetFrame = frameIndex;
        currentFrame = frameIndex;
        
        const roundedIndex = Math.round(frameIndex);
        renderFrame(roundedIndex);
        
        setTimeout(() => {
            // 3. Fade screen back to normal
            transitionOverlay.classList.remove('active');
        }, 300); // Give a tiny moment for layout to settle in blackness
    }, 500); // Matches the 0.5s CSS transition duration
}

// Click handler for Skip to Experience buttons
document.querySelectorAll('.skip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        jumpToVirtualFrameWithFade(collagePauseStart);
    });
});



// Render Video Click-to-Play Setup
function setupRenderVideoInteractions() {
    const wrapper = document.querySelector('.render-video-wrapper');
    const video = document.getElementById('render-video');
    if (!wrapper || !video) return;

    wrapper.addEventListener('click', (e) => {
        e.preventDefault();
        if (video.paused) {
            video.muted = false; // Unmute on user interaction
            video.play()
                .then(() => {
                    wrapper.classList.add('playing');
                })
                .catch(err => console.log('Video play error:', err));
        } else {
            video.pause();
            wrapper.classList.remove('playing');
        }
    });
}

// Initialize Render Video Interactions
setupRenderVideoInteractions();

// Initialize Voices Card Interactions
setupVoicesCardInteractions();

// Kick off the experience
startPreloader();
