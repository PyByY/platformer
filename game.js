const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Game States
const STATE_MENU = 0;
const STATE_PLAY = 1;
const STATE_SHOP = 2;
const STATE_GAMEOVER = 3;
const STATE_MAP = 4;
let gameState = STATE_MENU;

// Secret Cheat Menu
let cheatMenuOpen = false;
let cheatInputBuffer = "";
let cheatNotification = "";
let cheatTimer = 0;

// Save System
let loadedSave = {};
try {
    loadedSave = JSON.parse(localStorage.getItem('cyber_platformer_save')) || {};
} catch(e) {
    loadedSave = {};
}

let saveData = {
    highScore: loadedSave.highScore || 0,
    totalCoins: loadedSave.totalCoins || 0,
    equippedSkin: loadedSave.equippedSkin || 0,
    unlockedSkins: loadedSave.unlockedSkins || [0],
    maxLevelUnlocked: Math.max(0, loadedSave.maxLevelUnlocked || 0)
};

function saveGame() {
    try {
        localStorage.setItem('cyber_platformer_save', JSON.stringify(saveData));
    } catch(e) {}
}

// Skins
const skins = [
    { id: 0, name: 'NEON BLUE', color: '#00f0ff', visor: '#ffffff', price: 0 },
    { id: 1, name: 'CYBER GOLD', color: '#ffd700', visor: '#ff0055', price: 50 },
    { id: 2, name: 'TOXIC GREEN', color: '#39ff14', visor: '#00f0ff', price: 100 },
    { id: 3, name: 'PLASMA PINK', color: '#ff00ff', visor: '#39ff14', price: 200 },
    { id: 4, name: 'PHANTOM WHITE', color: '#ffffff', visor: '#000000', price: 350 }
];

let currentLevel = 0;
let score = 0;
let particles = [];
let frame = 0;
let screenShake = 0;

// Touch State
let touchLeft = false;
let touchRight = false;
let touchJump = false;
let isMobileDevice = false;

// Background Starfield
const stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.4 + 0.1,
    color: Math.random() > 0.5 ? '#00f0ff' : '#ff00ff'
}));

// Player Attributes
const player = {
    x: 40, y: 180, width: 16, height: 22,
    vx: 0, vy: 0, baseSpeed: 3.5, speed: 3.5, jumpPower: -7.2,
    gravity: 0.36, jumps: 0, maxJumps: 2,
    facing: 'right', isMoving: false,
    invincible: false,
    shield: false,
    speedBoostTimer: 0,
    magnetTimer: 0,
    trail: []
};

const keys = {};

// Keyboard Controls
window.addEventListener('keydown', e => {
    keys[e.code] = true;

    if ((e.code === 'KeyC' && keys['KeyH']) || (e.code === 'KeyH' && keys['KeyC'])) {
        cheatMenuOpen = !cheatMenuOpen;
        cheatInputBuffer = "";
        return;
    }

    if (e.code === 'KeyM' && gameState === STATE_PLAY && !cheatMenuOpen) {
        gameState = STATE_MAP;
    }

    if (cheatMenuOpen && e.key >= '0' && e.key <= '9') {
        cheatInputBuffer += e.key;
        if (cheatInputBuffer.length > 2) cheatInputBuffer = cheatInputBuffer.slice(-2);
        evaluateCheatCode(cheatInputBuffer);
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

function evaluateCheatCode(code) {
    if (code === "22") {
        player.maxJumps = 2;
        triggerNotification("CHEAT: DOUBLE JUMP");
        cheatInputBuffer = "";
    } else if (code === "99") {
        player.maxJumps = 999;
        triggerNotification("CHEAT: INFINITE JUMP!");
        cheatInputBuffer = "";
    } else if (code === "29") {
        player.invincible = !player.invincible;
        triggerNotification(`CHEAT: GOD MODE ${player.invincible ? "ON" : "OFF"}`);
        cheatInputBuffer = "";
    } else if (code === "77") {
        player.shield = true;
        triggerNotification("CHEAT: SHIELD GRANTED");
        cheatInputBuffer = "";
    }
}

function triggerNotification(msg) {
    cheatNotification = msg;
    cheatTimer = 180;
}

// Touch Handling
function handleTouches(e) {
    isMobileDevice = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    touchLeft = false;
    touchRight = false;
    touchJump = false;

    if (gameState === STATE_PLAY && !cheatMenuOpen) {
        for (let i = 0; i < e.touches.length; i++) {
            let tx = (e.touches[i].clientX - rect.left) * scaleX;
            let ty = (e.touches[i].clientY - rect.top) * scaleY;

            if (tx >= 10 && tx <= 50 && ty >= 210 && ty <= 260) touchLeft = true;
            if (tx >= 60 && tx <= 100 && ty >= 210 && ty <= 260) touchRight = true;
            if (tx >= 420 && tx <= 470 && ty >= 210 && ty <= 260) touchJump = true;
        }
    }
}

canvas.addEventListener('touchstart', (e) => { handleTouches(e); handleCanvasClick(e); }, { passive: false });
canvas.addEventListener('touchmove', handleTouches, { passive: false });
canvas.addEventListener('touchend', handleTouches, { passive: false });

function handleCanvasClick(e) {
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = (clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (clientY - rect.top) * (canvas.height / rect.height);

    if (gameState === STATE_PLAY && !cheatMenuOpen) {
        if (clickX >= 410 && clickX <= 470 && clickY >= 5 && clickY <= 25) {
            gameState = STATE_MAP;
            return;
        }
    }

    if (cheatMenuOpen) {
        if (clickX >= 120 && clickX <= 360 && clickY >= 90 && clickY <= 115) evaluateCheatCode("22");
        if (clickX >= 120 && clickX <= 360 && clickY >= 125 && clickY <= 150) evaluateCheatCode("99");
        if (clickX >= 120 && clickX <= 360 && clickY >= 160 && clickY <= 185) evaluateCheatCode("29");
        if (clickX >= 120 && clickX <= 360 && clickY >= 195 && clickY <= 220) evaluateCheatCode("77");
        if (clickX >= 180 && clickX <= 300 && clickY >= 230 && clickY <= 250) cheatMenuOpen = false;
        return;
    }

    if (gameState === STATE_MENU) {
        if (clickX >= 160 && clickX <= 320 && clickY >= 120 && clickY <= 150) gameState = STATE_MAP;
        else if (clickX >= 160 && clickX <= 320 && clickY >= 165 && clickY <= 195) gameState = STATE_SHOP;
    } else if (gameState === STATE_MAP) {
        if (clickX >= 10 && clickX <= 80 && clickY >= 10 && clickY <= 30) {
            gameState = STATE_MENU;
            return;
        }
        levels.forEach((lvl, idx) => {
            let col = idx % 5;
            let row = Math.floor(idx / 5);
            let x = 30 + col * 85;
            let y = 50 + row * 52;
            if (clickX >= x && clickX <= x + 70 && clickY >= y && clickY <= y + 42) {
                if (idx <= saveData.maxLevelUnlocked) {
                    currentLevel = idx;
                    loadLevel(currentLevel);
                    gameState = STATE_PLAY;
                }
            }
        });
    } else if (gameState === STATE_SHOP) {
        if (clickX >= 10 && clickX <= 80 && clickY >= 10 && clickY <= 30) {
            gameState = STATE_MENU;
            return;
        }
        skins.forEach((s, idx) => {
            let btnY = 60 + idx * 40;
            if (clickX >= 300 && clickX <= 420 && clickY >= btnY && clickY <= btnY + 30) {
                if (saveData.unlockedSkins.includes(s.id)) {
                    saveData.equippedSkin = s.id;
                    saveGame();
                } else if (saveData.totalCoins >= s.price) {
                    saveData.totalCoins -= s.price;
                    saveData.unlockedSkins.push(s.id);
                    saveData.equippedSkin = s.id;
                    saveGame();
                }
            }
        });
    } else if (gameState === STATE_GAMEOVER) {
        gameState = STATE_MAP;
    }
}

canvas.addEventListener('click', handleCanvasClick);

// 20 Levels
const levels = [
    { spawn: { x: 30, y: 180 }, goal: { x: 430, y: 70, width: 22, height: 28 }, platforms: [{ x: 0, y: 240, width: 480, height: 30 }, { x: 130, y: 190, width: 100, height: 14 }, { x: 270, y: 140, width: 100, height: 14 }, { x: 370, y: 100, width: 90, height: 14 }], coins: [{ x: 170, y: 160 }, { x: 310, y: 110 }], items: [{ type: 'shield', x: 140, y: 165 }], enemies: [{ type: 'patrol', x: 270, y: 123, width: 18, height: 17, vx: 0.8, minX: 270, maxX: 350 }] },
    { spawn: { x: 30, y: 200 }, goal: { x: 430, y: 50, width: 22, height: 28 }, platforms: [{ x: 0, y: 245, width: 100, height: 25 }, { x: 130, y: 195, width: 80, height: 14 }, { x: 250, y: 150, width: 80, height: 14 }, { x: 360, y: 95, width: 90, height: 14 }], coins: [{ x: 160, y: 165 }, { x: 280, y: 120 }], items: [{ type: 'speed', x: 260, y: 125 }], enemies: [{ type: 'flyer', x: 215, y: 100, width: 16, height: 16, vx: 0, vy: 1.5, minY: 80, maxY: 170 }] },
    { spawn: { x: 20, y: 200 }, goal: { x: 440, y: 40, width: 22, height: 28 }, platforms: [{ x: 0, y: 245, width: 80, height: 25 }, { x: 110, y: 200, width: 60, height: 14 }, { x: 200, y: 160, width: 60, height: 14 }, { x: 290, y: 120, width: 60, height: 14 }, { x: 380, y: 80, width: 80, height: 14 }], coins: [{ x: 130, y: 170 }, { x: 310, y: 90 }], items: [{ type: 'magnet', x: 215, y: 135 }], enemies: [{ type: 'spike', x: 220, y: 146, width: 20, height: 14 }] },
    { spawn: { x: 20, y: 210 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 70, height: 20 }, { x: 100, y: 210, width: 50, height: 12 }, { x: 180, y: 170, width: 50, height: 12 }, { x: 260, y: 130, width: 50, height: 12 }, { x: 350, y: 80, width: 110, height: 12 }], coins: [{ x: 115, y: 180 }, { x: 275, y: 100 }], items: [{ type: 'star', x: 195, y: 145 }], enemies: [{ type: 'flyer', x: 150, y: 140, width: 16, height: 16, vx: 0, vy: 2.0, minY: 120, maxY: 200 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 30, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 255, width: 80, height: 15 }, { x: 110, y: 215, width: 45, height: 12 }, { x: 200, y: 175, width: 45, height: 12 }, { x: 290, y: 135, width: 45, height: 12 }, { x: 180, y: 95, width: 45, height: 12 }, { x: 20, y: 65, width: 80, height: 12 }], coins: [{ x: 210, y: 145 }, { x: 190, y: 65 }], items: [{ type: 'shield', x: 120, y: 190 }], enemies: [{ type: 'patrol', x: 110, y: 198, width: 18, height: 17, vx: 1.5, minX: 110, maxX: 140 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 50, height: 20 }, { x: 80, y: 210, width: 40, height: 12 }, { x: 150, y: 170, width: 40, height: 12 }, { x: 220, y: 130, width: 40, height: 12 }, { x: 290, y: 90, width: 40, height: 12 }, { x: 370, y: 65, width: 100, height: 12 }], coins: [{ x: 90, y: 180 }, { x: 300, y: 60 }], items: [{ type: 'speed', x: 160, y: 145 }], enemies: [{ type: 'spike', x: 90, y: 196, width: 20, height: 14 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 50, height: 20 }, { x: 90, y: 210, width: 80, height: 12 }, { x: 210, y: 160, width: 80, height: 12 }, { x: 330, y: 110, width: 80, height: 12 }, { x: 420, y: 65, width: 50, height: 12 }], coins: [{ x: 120, y: 180 }, { x: 350, y: 80 }], items: [{ type: 'magnet', x: 240, y: 135 }], enemies: [{ type: 'patrol', x: 90, y: 193, width: 18, height: 17, vx: 3.2, minX: 90, maxX: 150 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 255, width: 45, height: 15 }, { x: 70, y: 220, width: 35, height: 12 }, { x: 130, y: 180, width: 35, height: 12 }, { x: 190, y: 140, width: 35, height: 12 }, { x: 260, y: 110, width: 35, height: 12 }, { x: 330, y: 80, width: 35, height: 12 }, { x: 400, y: 60, width: 75, height: 12 }], coins: [{ x: 140, y: 150 }, { x: 270, y: 80 }], items: [{ type: 'star', x: 200, y: 115 }], enemies: [{ type: 'spike', x: 200, y: 126, width: 18, height: 14 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 430, y: 25, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 60, height: 15 }, { x: 90, y: 205, width: 40, height: 12 }, { x: 170, y: 165, width: 40, height: 12 }, { x: 250, y: 125, width: 40, height: 12 }, { x: 330, y: 85, width: 40, height: 12 }, { x: 410, y: 55, width: 65, height: 12 }], coins: [{ x: 185, y: 135 }, { x: 345, y: 55 }], items: [{ type: 'shield', x: 260, y: 100 }], enemies: [{ type: 'flyer', x: 130, y: 180, width: 16, height: 16, vx: 2.0, vy: 0, minX: 110, maxX: 170 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 20, y: 35, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 70, height: 15 }, { x: 100, y: 210, width: 70, height: 12 }, { x: 200, y: 170, width: 70, height: 12 }, { x: 300, y: 130, width: 70, height: 12 }, { x: 190, y: 90, width: 70, height: 12 }, { x: 10, y: 65, width: 80, height: 12 }], coins: [{ x: 230, y: 140 }, { x: 320, y: 100 }], items: [{ type: 'speed', x: 220, y: 145 }], enemies: [{ type: 'spike', x: 120, y: 196, width: 20, height: 14 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 25, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 50, height: 20 }, { x: 80, y: 210, width: 90, height: 12 }, { x: 210, y: 165, width: 90, height: 12 }, { x: 340, y: 115, width: 90, height: 12 }, { x: 420, y: 55, width: 55, height: 12 }], coins: [{ x: 120, y: 180 }, { x: 370, y: 85 }], items: [{ type: 'magnet', x: 240, y: 140 }], enemies: [{ type: 'patrol', x: 80, y: 193, width: 18, height: 17, vx: 3.5, minX: 80, maxX: 150 }] },
    { spawn: { x: 20, y: 230 }, goal: { x: 435, y: 20, width: 25, height: 30 }, platforms: [{ x: 0, y: 255, width: 45, height: 15 }, { x: 65, y: 220, width: 30, height: 12 }, { x: 115, y: 185, width: 30, height: 12 }, { x: 165, y: 150, width: 30, height: 12 }, { x: 225, y: 120, width: 30, height: 12 }, { x: 285, y: 90, width: 30, height: 12 }, { x: 345, y: 60, width: 30, height: 12 }, { x: 405, y: 50, width: 70, height: 12 }], coins: [{ x: 125, y: 155 }, { x: 295, y: 60 }], items: [{ type: 'star', x: 235, y: 95 }], enemies: [{ type: 'spike', x: 170, y: 136, width: 18, height: 14 }] },
    { spawn: { x: 20, y: 230 }, goal: { x: 440, y: 25, width: 22, height: 28 }, platforms: [{ x: 0, y: 255, width: 40, height: 15 }, { x: 90, y: 215, width: 30, height: 12 }, { x: 180, y: 175, width: 30, height: 12 }, { x: 270, y: 135, width: 30, height: 12 }, { x: 360, y: 95, width: 30, height: 12 }, { x: 420, y: 55, width: 60, height: 12 }], coins: [{ x: 100, y: 180 }, { x: 280, y: 100 }], items: [{ type: 'shield', x: 190, y: 150 }], enemies: [{ type: 'flyer', x: 135, y: 180, width: 16, height: 16, vx: 0, vy: 4.0, minY: 50, maxY: 230 }] },
    { spawn: { x: 20, y: 120 }, goal: { x: 440, y: 110, width: 22, height: 28 }, platforms: [{ x: 0, y: 150, width: 50, height: 12 }, { x: 120, y: 210, width: 20, height: 12 }, { x: 230, y: 250, width: 20, height: 12 }, { x: 340, y: 180, width: 20, height: 12 }, { x: 430, y: 140, width: 50, height: 12 }], coins: [{ x: 234, y: 220 }, { x: 344, y: 150 }], items: [{ type: 'speed', x: 120, y: 185 }], enemies: [{ type: 'flyer', x: 60, y: 180, width: 16, height: 16, vx: 2.5, vy: -1.5, minY: 100, maxY: 200 }] },
    { spawn: { x: 20, y: 230 }, goal: { x: 225, y: 25, width: 30, height: 35 }, platforms: [{ x: 0, y: 255, width: 80, height: 15 }, { x: 120, y: 220, width: 40, height: 12 }, { x: 320, y: 220, width: 40, height: 12 }, { x: 400, y: 170, width: 80, height: 12 }, { x: 320, y: 120, width: 40, height: 12 }, { x: 120, y: 120, width: 40, height: 12 }, { x: 0, y: 170, width: 80, height: 12 }, { x: 200, y: 60, width: 80, height: 12 }], coins: [{ x: 335, y: 190 }, { x: 135, y: 90 }], items: [{ type: 'star', x: 20, y: 140 }], enemies: [{ type: 'spike', x: 20, y: 156, width: 20, height: 14 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 50, height: 15 }, { x: 80, y: 210, width: 35, height: 12 }, { x: 150, y: 170, width: 35, height: 12 }, { x: 220, y: 210, width: 35, height: 12 }, { x: 290, y: 150, width: 35, height: 12 }, { x: 360, y: 100, width: 35, height: 12 }, { x: 420, y: 65, width: 60, height: 12 }], coins: [{ x: 160, y: 140 }, { x: 300, y: 120 }], items: [{ type: 'magnet', x: 230, y: 180 }], enemies: [{ type: 'patrol', x: 80, y: 193, width: 18, height: 17, vx: 3.8, minX: 80, maxX: 115 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 60, height: 15 }, { x: 100, y: 190, width: 40, height: 12 }, { x: 180, y: 140, width: 40, height: 12 }, { x: 260, y: 190, width: 40, height: 12 }, { x: 340, y: 120, width: 40, height: 12 }, { x: 420, y: 65, width: 60, height: 12 }], coins: [{ x: 110, y: 160 }, { x: 270, y: 160 }], items: [{ type: 'shield', x: 190, y: 110 }], enemies: [{ type: 'flyer', x: 190, y: 170, width: 16, height: 16, vx: 0, vy: 3.5, minY: 80, maxY: 230 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 20, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 50, height: 15 }, { x: 80, y: 210, width: 30, height: 12 }, { x: 150, y: 170, width: 30, height: 12 }, { x: 230, y: 130, width: 30, height: 12 }, { x: 310, y: 170, width: 30, height: 12 }, { x: 390, y: 120, width: 30, height: 12 }, { x: 300, y: 75, width: 30, height: 12 }, { x: 150, y: 65, width: 30, height: 12 }, { x: 10, y: 65, width: 60, height: 12 }], coins: [{ x: 240, y: 100 }, { x: 320, y: 140 }], items: [{ type: 'speed', x: 160, y: 140 }], enemies: [{ type: 'spike', x: 150, y: 156, width: 20, height: 14 }] },
    { spawn: { x: 20, y: 220 }, goal: { x: 440, y: 30, width: 22, height: 28 }, platforms: [{ x: 0, y: 250, width: 50, height: 15 }, { x: 90, y: 210, width: 60, height: 12 }, { x: 200, y: 165, width: 60, height: 12 }, { x: 310, y: 120, width: 60, height: 12 }, { x: 410, y: 65, width: 70, height: 12 }], coins: [{ x: 110, y: 180 }, { x: 330, y: 90 }], items: [{ type: 'star', x: 220, y: 135 }], enemies: [{ type: 'patrol', x: 90, y: 193, width: 18, height: 17, vx: 4.0, minX: 90, maxX: 150 }, { type: 'flyer', x: 250, y: 100, width: 16, height: 16, vx: 0, vy: 3.5, minY: 60, maxY: 180 }] },
    { spawn: { x: 20, y: 230 }, goal: { x: 225, y: 20, width: 30, height: 35 }, platforms: [{ x: 0, y: 255, width: 60, height: 15 }, { x: 90, y: 215, width: 30, height: 12 }, { x: 160, y: 175, width: 30, height: 12 }, { x: 230, y: 215, width: 30, height: 12 }, { x: 300, y: 175, width: 30, height: 12 }, { x: 370, y: 135, width: 30, height: 12 }, { x: 420, y: 95, width: 60, height: 12 }, { x: 330, y: 60, width: 30, height: 12 }, { x: 200, y: 55, width: 80, height: 12 }], coins: [{ x: 170, y: 145 }, { x: 310, y: 145 }, { x: 340, y: 35 }], items: [{ type: 'shield', x: 100, y: 185 }, { type: 'magnet', x: 380, y: 105 }], enemies: [{ type: 'spike', x: 230, y: 201, width: 20, height: 14 }, { type: 'flyer', x: 200, y: 110, width: 18, height: 18, vx: 4.0, vy: 0, minX: 100, maxX: 350 }] }
];

function loadLevel(index) {
    const lvl = levels[index];
    player.x = lvl.spawn.x;
    player.y = lvl.spawn.y;
    player.vx = 0; player.vy = 0;
    player.trail = [];
    player.speedBoostTimer = 0;
    player.magnetTimer = 0;
    player.speed = player.baseSpeed;
    lvl.coins.forEach(c => { c.width = 12; c.height = 12; c.collected = false; });
    if (lvl.items) lvl.items.forEach(i => { i.width = 14; i.height = 14; i.collected = false; });
    particles = [];
}

function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            life: 1.0, color: color, size: Math.random() * 4 + 1
        });
    }
}

function checkCollision(r1, r2) {
    return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
}

function update() {
    frame++;
    if (cheatTimer > 0) cheatTimer--;

    if (gameState !== STATE_PLAY || cheatMenuOpen) return;

    const lvl = levels[currentLevel];

    if (player.speedBoostTimer > 0) {
        player.speedBoostTimer--;
        player.speed = player.baseSpeed * 1.5;
    } else {
        player.speed = player.baseSpeed;
    }

    if (player.magnetTimer > 0) player.magnetTimer--;

    if (frame % 2 === 0) {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 8) player.trail.shift();
    }

    player.isMoving = false;
    if (keys['ArrowRight'] || keys['KeyD'] || touchRight) {
        player.vx = player.speed;
        player.facing = 'right';
        player.isMoving = true;
    } else if (keys['ArrowLeft'] || keys['KeyA'] || touchLeft) {
        player.vx = -player.speed;
        player.facing = 'left';
        player.isMoving = true;
    } else {
        player.vx *= 0.70;
    }

    let pressJump = keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || touchJump;
    if (pressJump && !keys.jumpHeld && player.jumps > 0) {
        player.vy = player.jumpPower;
        player.jumps--;
        const currentSkin = skins.find(s => s.id === saveData.equippedSkin) || skins[0];
        spawnParticles(player.x + 8, player.y + 20, currentSkin.color, 12);
    }
    keys.jumpHeld = pressJump;

    player.vy += player.gravity;

    player.x += player.vx;
    for (let p of lvl.platforms) {
        if (checkCollision(player, p)) {
            if (player.vx > 0) player.x = p.x - player.width;
            else if (player.vx < 0) player.x = p.x + p.width;
        }
    }

    player.y += player.vy;
    for (let p of lvl.platforms) {
        if (checkCollision(player, p)) {
            if (player.vy > 0) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.jumps = player.maxJumps;
            } else if (player.vy < 0) {
                player.y = p.y + p.height;
                player.vy = 0;
            }
        }
    }

    for (let e of lvl.enemies) {
        if (e.type === 'patrol') {
            e.x += e.vx;
            if (e.x < e.minX || e.x + e.width > e.maxX) e.vx *= -1;
        } else if (e.type === 'flyer') {
            if (e.vx) { e.x += e.vx; if (e.x < e.minX || e.x + e.width > e.maxX) e.vx *= -1; }
            if (e.vy) { e.y += e.vy; if (e.y < e.minY || e.y + e.height > e.maxY) e.vy *= -1; }
        }

        if (!player.invincible && checkCollision(player, e)) {
            if (player.shield) {
                player.shield = false;
                spawnParticles(player.x + 8, player.y + 10, '#00f0ff', 20);
                triggerNotification("SHIELD BROKEN!");
                e.x = -999;
            } else {
                screenShake = 15;
                spawnParticles(player.x + 8, player.y + 10, '#ff0055', 25);
                loadLevel(currentLevel);
            }
        }
    }

    for (let c of lvl.coins) {
        if (!c.collected) {
            if (player.magnetTimer > 0) {
                let dx = (player.x + 8) - (c.x + 6);
                let dy = (player.y + 11) - (c.y + 6);
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    c.x += (dx / dist) * 4;
                    c.y += (dy / dist) * 4;
                }
            }
            if (checkCollision(player, c)) {
                c.collected = true;
                score += 25;
                saveData.totalCoins += 1;
                if (score > saveData.highScore) saveData.highScore = score;
                saveGame();
                spawnParticles(c.x + 6, c.y + 6, '#ffd700', 12);
            }
        }
    }

    if (lvl.items) {
        for (let item of lvl.items) {
            if (!item.collected && checkCollision(player, item)) {
                item.collected = true;
                if (item.type === 'shield') {
                    player.shield = true;
                    spawnParticles(item.x + 7, item.y + 7, '#00f0ff', 15);
                    triggerNotification("SHIELD ACQUIRED!");
                } else if (item.type === 'speed') {
                    player.speedBoostTimer = 300;
                    spawnParticles(item.x + 7, item.y + 7, '#ff00ff', 15);
                    triggerNotification("SUPER SPEED!");
                } else if (item.type === 'magnet') {
                    player.magnetTimer = 400;
                    spawnParticles(item.x + 7, item.y + 7, '#39ff14', 15);
                    triggerNotification("COIN MAGNET!");
                } else if (item.type === 'star') {
                    score += 100;
                    saveData.totalCoins += 5;
                    saveGame();
                    spawnParticles(item.x + 7, item.y + 7, '#ffd700', 20);
                    triggerNotification("STAR POWER! (+100 PTS / +5 COINS)");
                }
            }
        }
    }

    if (checkCollision(player, lvl.goal)) {
        spawnParticles(lvl.goal.x + 10, lvl.goal.y + 14, '#39ff14', 30);
        if (currentLevel + 1 > saveData.maxLevelUnlocked && currentLevel + 1 < levels.length) {
            saveData.maxLevelUnlocked = currentLevel + 1;
            saveGame();
        }
        if (currentLevel + 1 < levels.length) {
            currentLevel++;
            loadLevel(currentLevel);
        } else {
            gameState = STATE_GAMEOVER;
        }
    }

    if (player.y > canvas.height) loadLevel(currentLevel);

    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
    particles = particles.filter(p => p.life > 0);

    if (screenShake > 0) screenShake *= 0.85;
}

function drawPlayer(p) {
    const activeSkin = skins.find(s => s.id === saveData.equippedSkin) || skins[0];

    ctx.save();
    p.trail.forEach((pos, i) => {
        ctx.globalAlpha = (i / p.trail.length) * 0.4;
        ctx.fillStyle = p.speedBoostTimer > 0 ? '#ff00ff' : activeSkin.color;
        ctx.fillRect(pos.x + 2, pos.y + 2, 12, 18);
    });
    ctx.globalAlpha = 1.0;

    ctx.translate(p.x, p.y);

    if (p.shield) {
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(8, 11, 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    if (p.invincible) {
        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
    }

    let legOffset = p.isMoving ? Math.sin(frame * 0.5) * 3 : 0;
    ctx.fillStyle = p.invincible ? '#ffd700' : '#121629';
    ctx.fillRect(2, 6, 12, 12);

    ctx.fillStyle = p.speedBoostTimer > 0 ? '#ff00ff' : activeSkin.color;
    ctx.shadowColor = activeSkin.color; ctx.shadowBlur = 10;
    ctx.fillRect(3, 17, 4, 5 + legOffset);
    ctx.fillRect(9, 17, 4, 5 - legOffset);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#222845'; ctx.fillRect(1, 0, 14, 8);
    ctx.fillStyle = activeSkin.visor; ctx.shadowColor = activeSkin.visor; ctx.shadowBlur = 12;
    if (p.facing === 'right') ctx.fillRect(7, 2, 7, 3);
    else ctx.fillRect(2, 2, 7, 3);

    ctx.restore();
}

function drawTouchControls() {
    ctx.save();
    ctx.globalAlpha = 0.45;

    ctx.fillStyle = touchLeft ? '#00f0ff' : '#181b30';
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2;
    ctx.fillRect(10, 210, 40, 50);
    ctx.strokeRect(10, 210, 40, 50);
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText("◄", 30, 241);

    ctx.fillStyle = touchRight ? '#00f0ff' : '#181b30';
    ctx.fillRect(60, 210, 40, 50);
    ctx.strokeRect(60, 210, 40, 50);
    ctx.fillStyle = '#fff';
    ctx.fillText("►", 80, 241);

    ctx.fillStyle = touchJump ? '#ff00ff' : '#181b30';
    ctx.strokeStyle = '#ff00ff';
    ctx.fillRect(420, 210, 50, 50);
    ctx.strokeRect(420, 210, 50, 50);
    ctx.fillStyle = '#fff'; ctx.font = '12px "Courier New", monospace';
    ctx.fillText("JUMP", 445, 240);

    ctx.restore();
}

function drawItem(item) {
    if (item.collected) return;
    ctx.save();
    let floatY = Math.sin(frame * 0.1) * 3;
    ctx.translate(item.x + 7, item.y + 7 + floatY);

    if (item.type === 'shield') {
        ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    } else if (item.type === 'speed') {
        ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 12;
        ctx.fillRect(-6, -6, 12, 12);
    } else if (item.type === 'magnet') {
        ctx.fillStyle = '#39ff14'; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 12;
        ctx.fillRect(-5, -7, 10, 14);
    } else if (item.type === 'star') {
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawEnemy(e) {
    if (e.x < -100) return;
    ctx.save();
    ctx.translate(e.x, e.y);
    let pulse = Math.abs(Math.sin(frame * 0.1)) * 5;

    if (e.type === 'patrol') {
        ctx.fillStyle = '#ff0055'; ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 10 + pulse;
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(18, 17); ctx.lineTo(0, 17); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
        let eyeOffset = Math.sin(frame * 0.3) * 2;
        ctx.fillRect(6 + eyeOffset, 8, 5, 5);
    } else if (e.type === 'flyer') {
        ctx.fillStyle = '#b000ff'; ctx.shadowColor = '#b000ff'; ctx.shadowBlur = 15 + pulse;
        ctx.fillRect(2, 2, e.width - 4, e.height - 4);
        ctx.fillStyle = '#00f0ff'; ctx.shadowBlur = 0;
        ctx.fillRect(4, 5, e.width - 8, 4);
    } else if (e.type === 'spike') {
        ctx.fillStyle = '#ff7700'; ctx.shadowColor = '#ff7700'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(10, 14); ctx.lineTo(0, 14); ctx.fill();
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(20, 14); ctx.lineTo(10, 14); ctx.fill();
    }
    ctx.restore();
}

function drawCoin(c) {
    if (c.collected) return;
    ctx.save();
    let floatY = Math.sin(frame * 0.1) * 3;
    let widthScale = Math.abs(Math.sin(frame * 0.08));
    ctx.translate(c.x + 6, c.y + 6 + floatY);
    ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15;
    ctx.fillRect(-6 * widthScale, -6, 12 * widthScale, 12);
    ctx.restore();
}

function renderMap() {
    ctx.fillStyle = '#ffffff'; ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText("LEVEL MAP SELECT", 240, 25);

    ctx.fillStyle = '#ff0055'; ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 10;
    ctx.fillRect(10, 8, 70, 20); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = '10px "Courier New", monospace';
    ctx.fillText("< MENU", 45, 22);

    levels.forEach((lvl, idx) => {
        let col = idx % 5;
        let row = Math.floor(idx / 5);
        let x = 30 + col * 85;
        let y = 50 + row * 52;

        let isUnlocked = idx <= saveData.maxLevelUnlocked;

        ctx.fillStyle = isUnlocked ? '#181b30' : '#0d0e17';
        ctx.fillRect(x, y, 70, 42);
        
        ctx.shadowColor = isUnlocked ? '#00f0ff' : '#000';
        ctx.shadowBlur = isUnlocked ? 6 : 0;
        ctx.strokeStyle = isUnlocked ? '#00f0ff' : '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 70, 42);
        ctx.shadowBlur = 0;

        ctx.fillStyle = isUnlocked ? '#ffffff' : '#666';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText(`LVL ${idx + 1}`, x + 35, y + 20);

        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = isUnlocked ? '#39ff14' : '#ff0055';
        ctx.fillText(isUnlocked ? "READY" : "LOCKED", x + 35, y + 33);
    });
}

function renderCheatMenu() {
    ctx.fillStyle = 'rgba(5, 5, 15, 0.96)';
    ctx.fillRect(40, 15, 400, 245);
    ctx.strokeStyle = '#ff00f0'; ctx.shadowColor = '#ff00f0'; ctx.shadowBlur = 15;
    ctx.lineWidth = 2; ctx.strokeRect(40, 15, 400, 245); ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff00f0'; ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText("--- SECRET CHEAT TERMINAL ---", 240, 40);

    ctx.fillStyle = '#8a8fb5'; ctx.font = '11px "Courier New", monospace';
    ctx.fillText("ENTER CODE (KEYBOARD OR CLICK):", 240, 62);

    ctx.fillStyle = '#181b30'; ctx.fillRect(120, 90, 240, 25);
    ctx.fillStyle = '#00f0ff'; ctx.fillText("[22] DOUBLE JUMP", 240, 107);

    ctx.fillStyle = '#181b30'; ctx.fillRect(120, 125, 240, 25);
    ctx.fillStyle = '#39ff14'; ctx.fillText("[99] INFINITE JUMP", 240, 142);

    ctx.fillStyle = '#181b30'; ctx.fillRect(120, 160, 240, 25);
    ctx.fillStyle = '#ffd700'; ctx.fillText(`[29] GOD MODE: ${player.invincible ? "ON" : "OFF"}`, 240, 177);

    ctx.fillStyle = '#181b30'; ctx.fillRect(120, 195, 240, 25);
    ctx.fillStyle = '#ff00ff'; ctx.fillText("[77] GIVE SHIELD", 240, 212);

    ctx.fillStyle = '#ff0055'; ctx.fillRect(180, 230, 120, 20);
    ctx.fillStyle = '#fff'; ctx.fillText("CLOSE", 240, 244);
}

function renderMenu() {
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff'; ctx.font = '24px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText("CYBER PLATFORMER", 240, 65);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 15;
    ctx.fillRect(160, 120, 160, 35); ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.font = '15px "Courier New", monospace';
    ctx.fillText("SELECT LEVEL", 240, 142);

    ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 15;
    ctx.fillRect(160, 175, 160, 35); ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.fillText("SKIN SHOP", 240, 198);

    ctx.fillStyle = '#8a8fb5'; ctx.font = '12px "Courier New", monospace';
    ctx.fillText(`HIGH SCORE: ${saveData.highScore}  |  COINS: ${saveData.totalCoins}`, 240, 250);
}

function renderShop() {
    ctx.fillStyle = '#ffffff'; ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText("SKIN SHOP", 240, 35);
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd700'; ctx.font = '14px "Courier New", monospace';
    ctx.fillText(`COINS: ${saveData.totalCoins}`, 350, 35);

    ctx.fillStyle = '#ff0055'; ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 10;
    ctx.fillRect(10, 10, 70, 20); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = '10px "Courier New", monospace';
    ctx.fillText("< MENU", 25, 24);

    skins.forEach((s, idx) => {
        let btnY = 60 + idx * 40;
        ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 10;
        ctx.fillRect(40, btnY, 20, 20); ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff'; ctx.font = '12px "Courier New", monospace'; 
        ctx.fillText(s.name, 75, btnY + 15);

        let isUnlocked = saveData.unlockedSkins.includes(s.id);
        let isEquipped = saveData.equippedSkin === s.id;

        if (isEquipped) {
            ctx.fillStyle = '#39ff14'; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 10;
            ctx.fillRect(300, btnY, 120, 28); ctx.shadowBlur = 0;
            ctx.fillStyle = '#000'; ctx.fillText("EQUIPPED", 325, btnY + 18);
        } else if (isUnlocked) {
            ctx.fillStyle = '#00f0ff'; ctx.fillRect(300, btnY, 120, 28);
            ctx.fillStyle = '#000'; ctx.fillText("EQUIP", 340, btnY + 18);
        } else {
            ctx.fillStyle = saveData.totalCoins >= s.price ? '#ffd700' : '#444';
            ctx.fillRect(300, btnY, 120, 28);
            ctx.fillStyle = '#000'; ctx.fillText(`BUY (${s.price}C)`, 315, btnY + 18);
        }
    });
}

function renderGameOver() {
    ctx.fillStyle = '#39ff14'; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 20;
    ctx.font = '22px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText("ALL 20 LEVELS CLEARED!", 240, 110);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ffffff'; ctx.font = '16px "Courier New", monospace';
    ctx.fillText(`YOU ARE A PLATFORM MASTER!`, 240, 150);
    ctx.fillStyle = '#ffd700'; ctx.fillText(`FINAL SCORE: ${score}`, 240, 180);
    ctx.fillStyle = '#8a8fb5'; ctx.font = '12px "Courier New", monospace';
    ctx.fillText("TAP OR CLICK TO RETURN TO MAP", 240, 230);
}

function render() {
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#060814');
    bgGradient.addColorStop(1, '#120524');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;

    if (gameState === STATE_MENU) renderMenu();
    else if (gameState === STATE_MAP) renderMap();
    else if (gameState === STATE_SHOP) renderShop();
    else if (gameState === STATE_GAMEOVER) renderGameOver();
    else if (gameState === STATE_PLAY) {
        const lvl = levels[currentLevel];

        for (let p of lvl.platforms) {
            ctx.fillStyle = '#181b30'; ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 10;
            ctx.fillRect(p.x, p.y, p.width, 2);
            ctx.shadowBlur = 0;
        }

        let goalPulse = Math.abs(Math.sin(frame * 0.05)) * 10;
        ctx.fillStyle = '#39ff14'; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 15 + goalPulse;
        ctx.fillRect(lvl.goal.x, lvl.goal.y, lvl.goal.width, lvl.goal.height);
        ctx.shadowBlur = 0;

        lvl.coins.forEach(drawCoin);
        if (lvl.items) lvl.items.forEach(drawItem);
        lvl.enemies.forEach(drawEnemy);
        drawPlayer(player);

        for (let p of particles) {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color; ctx.shadowBlur = 8;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff'; ctx.font = '12px "Courier New", monospace'; ctx.textAlign = 'left';
        ctx.fillText(`LVL ${currentLevel + 1}/${levels.length}`, 10, 18);
        ctx.fillText(`SCORE: ${score}`, 110, 18);

        if (player.invincible) {
            ctx.fillStyle = '#ffd700'; ctx.fillText(`[GOD]`, 220, 18);
        }

        ctx.fillStyle = '#181b30'; ctx.fillRect(410, 4, 60, 20);
        ctx.fillStyle = '#00f0ff'; ctx.fillText("MAP", 428, 18);

        if (isMobileDevice) drawTouchControls();
    }

    if (cheatMenuOpen) renderCheatMenu();

    if (cheatTimer > 0) {
        ctx.fillStyle = '#ff00f0'; ctx.shadowColor = '#ff00f0'; ctx.shadowBlur = 15;
        ctx.font = '13px "Courier New", monospace';
        ctx.textAlign = 'center'; ctx.fillText(cheatNotification, 240, 262);
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

function gameLoop() {
    update(); render();
    requestAnimationFrame(gameLoop);
}

gameLoop();
