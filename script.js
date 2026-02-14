const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const mainQuestion = document.getElementById('mainQuestion');
const memeContainer = document.getElementById('memeContainer');
const btnContainer = document.getElementById('btnContainer');

let noCount = 0;
let lastHandledTime = 0; // Debounce: prevent double-counting from hover+click
let movedToBody = false; // Track if No button has been moved to body

// Text mapped to each "No" attempt
const noTexts = [
    'Are you sure? 🤨',
    'Think again! 😤',
    'Last chance! 😭',
];

// One image per "No" attempt
const memes = [
    'images/no1a.jpg',   // No #1
    'images/no2a.jpg',   // No #2
    'images/no3a.jpg',   // No #3
    'images/no4.jpg'     // No #4
];

// Yes button grows BIG with each No (classic meme pattern)
const yesSizes = [1.3, 1.7, 2.2, 2.8];

// Preload images for instant loading
function preloadImages() {
    const imagesToPreload = [...memes, 'images/yes.png'];
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}
preloadImages();

function handleNo() {
    // Debounce: prevent double-counting within 300ms (hover + click)
    const now = Date.now();
    if (now - lastHandledTime < 300) return;
    lastHandledTime = now;

    if (noCount >= 4) return; // Already at max

    noCount++;

    // 1. Show one meme (replaces the previous one)
    if (noCount <= memes.length) {
        memeContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = memes[noCount - 1];
        img.classList.add('meme-img');
        img.alt = 'meme';
        memeContainer.appendChild(img);
    }

    // 2. Yes button grows DRAMATICALLY with each No
    const scale = yesSizes[noCount - 1] || 2.8;
    yesBtn.style.transform = `scale(${scale})`;

    // 3. Update No button text or hide it
    if (noCount < 4) {
        noBtn.innerText = noTexts[noCount - 1];

        // Add shake animation
        noBtn.classList.add('shake');
        setTimeout(() => noBtn.classList.remove('shake'), 400);
    } else {
        // 4th time: Hide No button & change main text
        noBtn.style.display = 'none';
        mainQuestion.innerText = "I'll wait... ⏳";

        // Make Yes button MEGA
        yesBtn.style.transform = 'scale(2.8)';
    }
}

function isOverlapping(x, y, width, height, elementsToCheck, buffer = 10) {
    const newRect = { left: x, top: y, right: x + width, bottom: y + height };

    for (const el of elementsToCheck) {
        if (!el || el.style.display === 'none') continue;
        const rect = el.getBoundingClientRect();

        // AABB Collision with buffer
        if (!(newRect.right + buffer < rect.left - buffer ||
            newRect.left - buffer > rect.right + buffer ||
            newRect.bottom + buffer < rect.top - buffer ||
            newRect.top - buffer > rect.bottom + buffer)) {
            return true; // Overlap detected
        }
    }
    return false;
}

function teleportButton() {
    // If button is hidden, don't teleport
    if (noBtn.style.display === 'none') return;

    // FIRST teleport: move button from card to body
    if (!movedToBody) {
        document.body.appendChild(noBtn);
        movedToBody = true;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const btnWidth = noBtn.offsetWidth || 120;
    const btnHeight = noBtn.offsetHeight || 50;
    const padding = 15; // Reduced padding

    // 1. Try to avoid the entire card using Smart Zones
    const card = document.querySelector('.card');
    let safeZones = [];

    if (card) {
        const cardRect = card.getBoundingClientRect();

        // Zone 1: Above Card
        if (cardRect.top - btnHeight - padding > padding) {
            safeZones.push({
                minX: padding,
                maxX: vw - btnWidth - padding,
                minY: padding,
                maxY: cardRect.top - btnHeight - padding
            });
        }

        // Zone 2: Below Card
        if (vh - padding > cardRect.bottom + btnHeight + padding) {
            safeZones.push({
                minX: padding,
                maxX: vw - btnWidth - padding,
                minY: cardRect.bottom + padding,
                maxY: vh - btnHeight - padding
            });
        }

        // Zone 3: Left of Card (only if enough space)
        if (cardRect.left - btnWidth - padding > padding) {
            safeZones.push({
                minX: padding,
                maxX: cardRect.left - btnWidth - padding,
                minY: padding,
                maxY: vh - btnHeight - padding
            });
        }

        // Zone 4: Right of Card (only if enough space)
        if (vw - padding > cardRect.right + btnWidth + padding) {
            safeZones.push({
                minX: cardRect.right + padding,
                maxX: vw - btnWidth - padding,
                minY: padding,
                maxY: vh - btnHeight - padding
            });
        }
    }

    let randomX, randomY;

    // STRATEGY A: Use a Safe Zone if available
    if (safeZones.length > 0) {
        // Pick a random safe zone
        const zone = safeZones[Math.floor(Math.random() * safeZones.length)];

        // Pick random pos within that zone
        randomX = Math.floor(Math.random() * (zone.maxX - zone.minX)) + zone.minX;
        randomY = Math.floor(Math.random() * (zone.maxY - zone.minY)) + zone.minY;
    } else {
        // STRATEGY B: Fallback (Card is huge) - Just avoid Yes Button & Title
        // Use reduced buffer (5px) to fit in tight spaces
        let safe = false;
        let attempts = 0;
        const elementsToAvoid = [yesBtn, mainQuestion];

        while (!safe && attempts < 100) {
            attempts++;
            const maxX = Math.max(vw - btnWidth - padding, padding);
            const maxY = Math.max(vh - btnHeight - padding, padding);

            randomX = Math.floor(Math.random() * (maxX - padding)) + padding;
            randomY = Math.floor(Math.random() * (maxY - padding)) + padding;

            if (!isOverlapping(randomX, randomY, btnWidth, btnHeight, elementsToAvoid, 5)) {
                safe = true;
            }
        }
    }

    // Apply new position
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${randomX}px`;
    noBtn.style.top = `${randomY}px`;
    noBtn.style.margin = '0';
    noBtn.style.transform = '';
    noBtn.style.zIndex = '100';
    noBtn.classList.add('teleported');
}

// ============== Event Listeners ==============

// 1. Desktop Hover (escapes before click)
noBtn.addEventListener('mouseenter', () => {
    if (noCount < 4) {
        handleNo();
        teleportButton();
    }
});

// 2. Mobile Touch (move on touch start to prevent click)
noBtn.addEventListener('touchstart', (e) => {
    if (noCount < 4) {
        e.preventDefault();
        handleNo();
        teleportButton();
    }
}, { passive: false });

// 3. Click (fallback — debounce prevents double-counting with hover)
noBtn.addEventListener('click', (e) => {
    if (noCount < 4) {
        handleNo();
        teleportButton();
    }
});

// 4. Yes Button Click
yesBtn.addEventListener('click', () => {
    // 1. Confetti
    triggerConfetti();

    // 2. Change content
    mainQuestion.innerHTML = "Yay! 🥰💕";

    // 3. Show Yes meme
    memeContainer.innerHTML = '';
    const yesImg = document.createElement('img');
    yesImg.src = 'images/yes.png';
    yesImg.classList.add('meme-img');
    yesImg.alt = 'yes!';
    // 4. CSS will limit the size, but let's ensure it's not huge
    yesImg.style.maxHeight = '300px';
    memeContainer.appendChild(yesImg);

    // 4. Hide buttons
    yesBtn.style.display = 'none';
    noBtn.style.display = 'none';
});

function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const random = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
