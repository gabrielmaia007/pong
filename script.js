const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerScoreEl = document.getElementById("playerScore");
const aiScoreEl = document.getElementById("aiScore");
const message = document.getElementById("message");
const fpsEl = document.getElementById("fps");
const speedEl = document.getElementById("speed");

// ======================================================
// CANVAS
// ======================================================

let W = 0;
let H = 0;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    W = rect.width;
    H = rect.height;

    player.x = 35;
    player.y = H / 2 - player.h / 2;

    ai.x = W - 35 - ai.w;
    ai.y = H / 2 - ai.h / 2;

    if (!gameRunning) {
        resetBall();
    }
}

window.addEventListener("resize", resizeCanvas);

// ======================================================
// GAME VARIABLES
// ======================================================

const player = {
    x: 35,
    y: 0,
    w: 13,
    h: 115,
    speed: 8,
    dy: 0
};

const ai = {
    x: 0,
    y: 0,
    w: 13,
    h: 115,
    speed: 5.3,
    targetY: 0
};

const ball = {
    x: 0,
    y: 0,
    r: 9,
    vx: 0,
    vy: 0,
    speed: 7
};

let playerScore = 0;
let aiScore = 0;

let gameRunning = false;
let gameOver = false;

let particles = [];
let trail = [];
let sparks = [];

let screenShake = 0;

let keys = {};

let lastTime = performance.now();
let frames = 0;
let fpsTimer = performance.now();

// ======================================================
// INPUT
// ======================================================

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        e.preventDefault();

        if (!gameRunning && !gameOver) {
            startGame();
        }
    }

    if (e.key.toLowerCase() === "r") {
        restartGame();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// ======================================================
// SOUND ENGINE
// ======================================================

let audioContext = null;

function initAudio() {

    if (!audioContext) {
        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function sound(frequency, duration, type = "sine", volume = 0.04) {

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, audioContext.currentTime);

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// ======================================================
// BALL
// ======================================================

function resetBall(direction = null) {

    ball.x = W / 2;
    ball.y = H / 2;

    const angle =
        (Math.random() * 0.8 - 0.4);

    let dir =
        direction ??
        (Math.random() > 0.5 ? 1 : -1);

    ball.speed = 7;

    ball.vx = Math.cos(angle) * ball.speed * dir;
    ball.vy = Math.sin(angle) * ball.speed;

    trail = [];
}

function startGame() {

    initAudio();

    gameRunning = true;
    gameOver = false;

    message.classList.add("hidden");

    resetBall(
        Math.random() > 0.5 ? 1 : -1
    );

    sound(440, .1, "square", .05);
}

function restartGame() {

    initAudio();

    playerScore = 0;
    aiScore = 0;

    playerScoreEl.textContent = "0";
    aiScoreEl.textContent = "0";

    gameOver = false;
    gameRunning = false;

    player.y = H / 2 - player.h / 2;
    ai.y = H / 2 - ai.h / 2;

    resetBall();

    message.querySelector("h1").textContent = "NEON PONG";
    message.querySelector("p").innerHTML =
        "PRESSIONE <b>ESPAÇO</b> PARA COMEÇAR";

    message.classList.remove("hidden");
}

// ======================================================
// PARTICLES
// ======================================================

function createExplosion(x, y, color, amount = 25) {

    for (let i = 0; i < amount; i++) {

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 7 + 1;

        particles.push({
            x,
            y,

            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,

            life: 1,
            decay: Math.random() * .025 + .015,

            size: Math.random() * 4 + 1,

            color
        });
    }
}

function createSpark(x, y, color) {

    for (let i = 0; i < 8; i++) {

        sparks.push({
            x,
            y,

            vx: (Math.random() - .5) * 12,
            vy: (Math.random() - .5) * 12,

            life: 1,

            color
        });
    }
}

function updateParticles() {

    for (let i = particles.length - 1; i >= 0; i--) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= .97;
        p.vy *= .97;

        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {

        const p = sparks[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= .92;
        p.vy *= .92;

        p.life -= .045;

        if (p.life <= 0) {
            sparks.splice(i, 1);
        }
    }
}

// ======================================================
// PLAYER
// ======================================================

function updatePlayer() {

    if (keys["w"] || keys["arrowup"]) {
        player.dy = -player.speed;
    }
    else if (keys["s"] || keys["arrowdown"]) {
        player.dy = player.speed;
    }
    else {
        player.dy *= .75;
    }

    player.y += player.dy;

    player.y = Math.max(
        10,
        Math.min(H - player.h - 10, player.y)
    );
}

// ======================================================
// AI
// ======================================================

function updateAI() {

    const center = ai.y + ai.h / 2;

    const reaction =
        Math.min(
            ai.speed,
            Math.abs(ball.y - center) * .065
        );

    if (ball.y < center - 12) {
        ai.y -= reaction;
    }

    if (ball.y > center + 12) {
        ai.y += reaction;
    }

    ai.y = Math.max(
        10,
        Math.min(H - ai.h - 10, ai.y)
    );
}

// ======================================================
// COLLISION
// ======================================================

function collision(ball, paddle) {

    return (
        ball.x + ball.r > paddle.x &&
        ball.x - ball.r < paddle.x + paddle.w &&
        ball.y + ball.r > paddle.y &&
        ball.y - ball.r < paddle.y + paddle.h
    );
}

// ======================================================
// BALL UPDATE
// ======================================================

function updateBall() {

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Trail
    trail.push({
        x: ball.x,
        y: ball.y,
        alpha: 1
    });

    if (trail.length > 18) {
        trail.shift();
    }

    trail.forEach(t => {
        t.alpha *= .9;
    });

    // Top / bottom
    if (
        ball.y - ball.r <= 0 ||
        ball.y + ball.r >= H
    ) {

        ball.vy *= -1;

        ball.y = Math.max(
            ball.r,
            Math.min(H - ball.r, ball.y)
        );

        createSpark(
            ball.x,
            ball.y,
            "#00f7ff"
        );

        sound(320, .06, "square", .035);
    }

    // Player
    if (collision(ball, player) && ball.vx < 0) {

        const hit =
            (ball.y - (player.y + player.h / 2))
            / (player.h / 2);

        const angle = hit * 1.15;

        ball.speed = Math.min(
            ball.speed + .35,
            17
        );

        ball.vx =
            Math.cos(angle) *
            ball.speed;

        ball.vy =
            Math.sin(angle) *
            ball.speed;

        ball.x =
            player.x +
            player.w +
            ball.r;

        createExplosion(
            ball.x,
            ball.y,
            "#00f7ff",
            18
        );

        createSpark(
            ball.x,
            ball.y,
            "#ffffff"
        );

        screenShake = 8;

        sound(170, .09, "square", .07);
    }

    // AI
    if (collision(ball, ai) && ball.vx > 0) {

        const hit =
            (ball.y - (ai.y + ai.h / 2))
            / (ai.h / 2);

        const angle = hit * 1.15;

        ball.speed = Math.min(
            ball.speed + .35,
            17
        );

        ball.vx =
            -Math.cos(angle) *
            ball.speed;

        ball.vy =
            Math.sin(angle) *
            ball.speed;

        ball.x =
            ai.x -
            ball.r;

        createExplosion(
            ball.x,
            ball.y,
            "#ff007a",
            18
        );

        createSpark(
            ball.x,
            ball.y,
            "#ffffff"
        );

        screenShake = 8;

        sound(230, .09, "square", .07);
    }

    // Player scores
    if (ball.x < -30) {

        aiScore++;

        aiScoreEl.textContent = aiScore;

        createExplosion(
            0,
            ball.y,
            "#ff007a",
            60
        );

        screenShake = 15;

        sound(80, .4, "sawtooth", .08);

        checkWinner();

        if (!gameOver) {
            resetBall(1);
        }
    }

    // AI scores
    if (ball.x > W + 30) {

        playerScore++;

        playerScoreEl.textContent = playerScore;

        createExplosion(
            W,
            ball.y,
            "#00f7ff",
            60
        );

        screenShake = 15;

        sound(100, .4, "sawtooth", .08);

        checkWinner();

        if (!gameOver) {
            resetBall(-1);
        }
    }
}

// ======================================================
// WINNER
// ======================================================

function checkWinner() {

    if (playerScore >= 5) {

        endGame("YOU WIN", "#00f7ff");

    }
    else if (aiScore >= 5) {

        endGame("AI WINS", "#ff007a");

    }
}

function endGame(text, color) {

    gameRunning = false;
    gameOver = true;

    message.querySelector("h1").textContent = text;

    message.querySelector("h1").style.color = color;

    message.querySelector("p").innerHTML =
        "PRESSIONE <b>R</b> PARA JOGAR NOVAMENTE";

    message.classList.remove("hidden");

    createExplosion(
        W / 2,
        H / 2,
        color,
        150
    );

    sound(
        playerScore > aiScore ? 700 : 100,
        .7,
        "sawtooth",
        .08
    );
}

// ======================================================
// DRAW HELPERS
// ======================================================

function glowRect(
    x,
    y,
    width,
    height,
    color
) {

    ctx.save();

    ctx.shadowColor = color;
    ctx.shadowBlur = 25;

    ctx.fillStyle = color;

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.restore();

    ctx.fillStyle = "#ffffff";

    ctx.globalAlpha = .75;

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.globalAlpha = 1;
}

function drawBackground() {

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            20,
            W / 2,
            H / 2,
            W * .65
        );

    gradient.addColorStop(
        0,
        "rgba(0,40,70,.22)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,.7)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

// ======================================================
// DRAW TRAIL
// ======================================================

function drawTrail() {

    for (let i = 0; i < trail.length; i++) {

        const t = trail[i];

        const alpha =
            (i / trail.length) * .35;

        const radius =
            ball.r *
            (i / trail.length);

        ctx.beginPath();

        ctx.arc(
            t.x,
            t.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(0,247,255,${alpha})`;

        ctx.fill();
    }
}

// ======================================================
// DRAW BALL
// ======================================================

function drawBall() {

    // Outer glow
    ctx.save();

    ctx.shadowColor = "#00f7ff";
    ctx.shadowBlur = 45;

    const gradient =
        ctx.createRadialGradient(
            ball.x,
            ball.y,
            1,
            ball.x,
            ball.y,
            ball.r * 3
        );

    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        .25,
        "#00f7ff"
    );

    gradient.addColorStop(
        1,
        "rgba(0,247,255,0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.r * 3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Core
    ctx.save();

    ctx.shadowColor = "#00f7ff";
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.r,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

// ======================================================
// DRAW PARTICLES
// ======================================================

function drawParticles() {

    particles.forEach(p => {

        ctx.save();

        ctx.globalAlpha = p.life;

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;

        ctx.fillStyle = p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    });

    sparks.forEach(p => {

        ctx.save();

        ctx.globalAlpha = p.life;

        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(p.x, p.y);

        ctx.lineTo(
            p.x - p.vx * 1.5,
            p.y - p.vy * 1.5
        );

        ctx.stroke();

        ctx.restore();
    });
}

// ======================================================
// DRAW PADDLES
// ======================================================

function drawPaddles() {

    glowRect(
        player.x,
        player.y,
        player.w,
        player.h,
        "#00f7ff"
    );

    glowRect(
        ai.x,
        ai.y,
        ai.w,
        ai.h,
        "#ff007a"
    );

    // energy bars
    ctx.globalAlpha = .3;

    ctx.fillStyle = "#00f7ff";

    ctx.fillRect(
        player.x - 4,
        player.y,
        2,
        player.h
    );

    ctx.fillStyle = "#ff007a";

    ctx.fillRect(
        ai.x + ai.w + 2,
        ai.y,
        2,
        ai.h
    );

    ctx.globalAlpha = 1;
}

// ======================================================
// DRAW ARENA DETAILS
// ======================================================

function drawArena() {

    // Top neon line
    const topGradient =
        ctx.createLinearGradient(
            0,
            0,
            W,
            0
        );

    topGradient.addColorStop(
        0,
        "transparent"
    );

    topGradient.addColorStop(
        .5,
        "#00f7ff"
    );

    topGradient.addColorStop(
        1,
        "transparent"
    );

    ctx.fillStyle = topGradient;

    ctx.fillRect(
        0,
        0,
        W,
        1
    );

    // Bottom line
    ctx.fillStyle = topGradient;

    ctx.fillRect(
        0,
        H - 1,
        W,
        1
    );

    // Center circles
    ctx.save();

    ctx.strokeStyle =
        "rgba(0,247,255,.08)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.arc(
        W / 2,
        H / 2,
        90,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        W / 2,
        H / 2,
        30,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

// ======================================================
// MAIN DRAW
// ======================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    ctx.save();

    if (screenShake > 0) {

        ctx.translate(
            (Math.random() - .5) *
            screenShake,
            (Math.random() - .5) *
            screenShake
        );

        screenShake *= .85;

        if (screenShake < .1) {
            screenShake = 0;
        }
    }

    drawBackground();

    drawArena();

    drawTrail();

    drawPaddles();

    drawBall();

    drawParticles();

    ctx.restore();
}

// ======================================================
// GAME LOOP
// ======================================================

function update() {

    if (gameRunning) {

        updatePlayer();
        updateAI();
        updateBall();
    }

    updateParticles();
}

// ======================================================
// FPS
// ======================================================

function updateFPS(now) {

    frames++;

    if (now - fpsTimer >= 1000) {

        fpsEl.textContent = frames;

        frames = 0;
        fpsTimer = now;
    }

    const currentSpeed =
        Math.sqrt(
            ball.vx * ball.vx +
            ball.vy * ball.vy
        ) / 7;

    speedEl.textContent =
        currentSpeed.toFixed(1) + "x";
}

// ======================================================
// LOOP
// ======================================================

function loop(now) {

    const delta =
        Math.min(
            (now - lastTime) / 16.67,
            2
        );

    lastTime = now;

    update();

    draw();

    updateFPS(now);

    requestAnimationFrame(loop);
}

// ======================================================
// START
// ======================================================

resizeCanvas();

restartGame();

requestAnimationFrame(loop);