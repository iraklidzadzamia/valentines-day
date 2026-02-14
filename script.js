const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const mainQuestion = document.getElementById('mainQuestion');
const memeContainer = document.getElementById('memeContainer');
const btnContainer = document.getElementById('btnContainer');

let noCount = 0;
let lastHandledTime = 0; // Debounce: prevent double-counting from hover+click

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

    // 2. Update Yes button size (20% growth per step)
    const currentSize = 1 + (noCount * 0.2);
    yesBtn.style.transform = `scale(${currentSize})`;

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

        // Make Yes button HUGE
        yesBtn.style.transform = 'scale(1.6)';
    }
}

function teleportButton() {
    // If button is hidden, don't teleport
    if (noBtn.style.display === 'none') return;

    // window.innerHeight/Width = the VISIBLE viewport only (not scrollable area)
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Get button dimensions
    const btnWidth = noBtn.offsetWidth || 120;
    const btnHeight = noBtn.offsetHeight || 50;

    // Safe padding from edges
    const padding = 30;

    // Calculate safe range
    const minX = padding;
    const minY = padding;
    const maxX = Math.max(vw - btnWidth - padding, padding + 1);
    const maxY = Math.max(vh - btnHeight - padding, padding + 1);

    // Random position clamped within safe bounds
    const randomX = Math.floor(Math.random() * (maxX - minX)) + minX;
    const randomY = Math.floor(Math.random() * (maxY - minY)) + minY;

    // Apply new position (fixed = relative to viewport, not page)
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${Math.min(randomX, vw - btnWidth - 10)}px`;
    noBtn.style.top = `${Math.min(randomY, vh - btnHeight - 10)}px`;
    noBtn.style.margin = '0';
    noBtn.style.transform = '';
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
