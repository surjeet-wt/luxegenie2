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

// Toggle menu active state to form the X sign and reveal full-screen overlay on Our Story page
const menuBtn = document.querySelector('.header-menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

// Close the menu overlay when navigation links are clicked (for standard browser page transitions)
const navLinks = document.querySelectorAll('.menu-link, .header-contact-btn');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Close menu if open
        if (menuBtn) menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
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

// Fade in transition helper (if needed) and GSAP Initialization
window.addEventListener('DOMContentLoaded', () => {
    const transitionOverlay = document.getElementById('transition-overlay');
    if (transitionOverlay) {
        // Start transparently
        transitionOverlay.classList.remove('active');
    }

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Split headers for character animation
    const headingsToSplit = document.querySelectorAll('.chapter-title, .profile-section-heading');
    headingsToSplit.forEach(title => {
        splitTextIntoSpans(title);
    });

    // ScrollTrigger animation for the Founder Section Heading
    const profileSection = document.querySelector('.story-profile-section');
    if (profileSection) {
        const profileChars = profileSection.querySelectorAll('.profile-section-heading .char');
        if (profileChars.length > 0) {
            gsap.fromTo(profileChars,
                { translateY: '100%', opacity: 0 },
                {
                    translateY: '0%',
                    opacity: 1,
                    stagger: 0.02,
                    duration: 0.7,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: profileSection,
                        start: "top 75%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }
    }

    // ScrollTrigger animations for the vertical editorial chapters (Leeds, Seoul, Dubai)
    const chapterRows = document.querySelectorAll('.chapter-row');
    if (chapterRows.length > 0) {
        chapterRows.forEach(row => {
            const imageCol = row.querySelector('.chapter-image-col');
            const img = row.querySelector('.chapter-img');
            const textCol = row.querySelector('.chapter-text-col');
            
            // Check layout order to determine text slide-in direction
            // Leeds (Chapter 1) & Dubai (Chapter 3) are text left / image right: text slides in from left (-60px)
            // Seoul (Chapter 2) is image left / text right: text slides in from right (60px)
            const isTextLeft = row.firstElementChild === textCol;
            
            // 1. Entrance animation for the image (softly fade in while moving upward)
            gsap.fromTo(imageCol, 
                { opacity: 0, y: 70 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: row,
                        start: "top 78%",
                        toggleActions: "play none none reverse"
                    }
                }
            );

            // 2. Entrance animation for the text (appears slightly later with a subtle horizontal slide)
            const slideStart = isTextLeft ? -50 : 50;
            gsap.fromTo(textCol,
                { opacity: 0, x: slideStart },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1.8,
                    delay: 0.35, // Deliberate offset to appear slightly later than the image
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: row,
                        start: "top 78%",
                        toggleActions: "play none none reverse"
                    }
                }
            );

            // 2b. Character reveal animation for the heading
            const titleChars = row.querySelectorAll('.chapter-title .char');
            if (titleChars.length > 0) {
                gsap.fromTo(titleChars,
                    { translateY: '100%', opacity: 0 },
                    {
                        translateY: '0%',
                        opacity: 1,
                        stagger: 0.02,
                        duration: 0.7,
                        delay: 0.5, // Sync/slightly after textCol starts sliding in
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: row,
                            start: "top 78%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            }

        });
    }
});
