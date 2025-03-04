const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 550;
canvas.height = 600;

const lullaby = new Audio('https://raw.githubusercontent.com/Swillycoder/floattedaway/main/lullaby.mp3');
const music = new Audio('https://raw.githubusercontent.com/Swillycoder/floattedaway/main/happyshort.mp3');
const splat = new Audio('https://raw.githubusercontent.com/Swillycoder/floattedaway/main/splat.ogg');
const starCollect = new Audio('https://raw.githubusercontent.com/Swillycoder/floattedaway/main/coinshort.ogg');

music.volume = 0.3

const images = {
    bear: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/bearballoonsml.png',
    bg_img: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/bg.png',
    snowball: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/snowball.png',
    intro: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/intro.png',
    gameOverBg: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/gameover.png',
    star: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/star.png',
    bearsml: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/bearsml.png',
    winner: 'https://raw.githubusercontent.com/Swillycoder/floattedaway/main/moonshot.png',
};

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
};

async function loadAllImages(imageSources) {
    const loadedImages = {};
    for (const [key, src] of Object.entries(imageSources)) {
        try {
            loadedImages[key] = await loadImage(src);
            console.log(`${key} loaded successfully`);
        } catch (error) {
            console.error(error);
        }
    }
    return loadedImages;
}

class Player {
    constructor (x,y, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.width = 52;
        this.height = 100;
        this.speed = 4
    }

    boundaries () {
        if (this.x <= 50) this.x = 50;
        if (this.x + this.width >= canvas.width - 50) this.x = canvas.width - this.width -50;
    }

    draw () {
        ctx.drawImage(this.image, this.x, this.y)
    }
    update () {
        if (keys.KeyA) this.x -= this.speed;
        if (keys.KeyD) this.x += this.speed;
        if (keys.ArrowLeft) this.x -= this.speed;
        if (keys.ArrowRight) this.x += this.speed;

        this.boundaries();
        this.draw();
    }
}

class Enemy {
    constructor(x,y, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.width = 30;
        this.height = 30;
        this.speed = 6;
        this.angle = (Math.random() - 0.5) * Math.PI / 8;
        this.dx = Math.sin(this.angle) * this.speed;
        this.dy = Math.cos(this.angle) * this.speed; 
    }

    boundaries() {
        if (this.y > canvas.height) {
            this.y = -(Math.random() * 1000) - this.height;
            this.x = 50 + Math.random() * 350;
            this.speed = 2 + Math.random() * 3;
            this.angle = (Math.random() - 0.5) * Math.PI / 4;
            this.dx = Math.sin(this.angle) * this.speed;
            this.dy = Math.cos(this.angle) * this.speed;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y)
    }

    update () {
        this.x += this.dx;
        this.y += this.dy;
        this.boundaries();
        this.draw();
    }
    
}

class Stars {
    constructor (x,y,image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.speed = 2;
        this.amplitude = 200;
        this.frequency = 0.05;
        this.time = Math.random() * Math.PI * 2;
    }
    boundaries () {
        if (this.y > canvas.height) {
            this.x = 100 + Math.random() * 300;
            this.y = -Math.random() * 500;
            this.time = Math.random() * Math.PI * 2;
        }
    }

    draw (){
        ctx.drawImage(this.image, this.x, this.y)
    }
    update () {
        this.y += this.speed;
        this.x += Math.sin(this.time) * this.amplitude * this.frequency;
        this.time += 0.1;
        this.boundaries();
        this.draw();
    }
}


const keys = {
    KeyA: false,
    KeyD: false,
    KeyP: false,
    Space: false,
    ArrowLeft: false,
    ArrowRight: false,
};

let gameState = "introScreen";
let loadedImages;
let player;
let enemies = [];
let stars = [];
const enemyCount = 12;
let lives = 3;
let bgOffsetY = 1390;
const scrollSpeed = 0.225;
let countdownStart;
let countdownDuration = 120000;
let timeRemaining;
let starsScore = 0;
let countIndex = 0;
const messages = ["READY!", "STEADY!!", "GO!!!"];
let frameCount = 0;

function spawnEnemies() {
    for (let i = 0; i < enemyCount; i++) {
        let x = 50 + Math.random() * 350; 
        let y = -(Math.random() * 1000); 
        enemies.push(new Enemy(x, y, loadedImages.snowball));
    }
}

function spawnStars () {
    for (let i = 0; i < 5; i++) {
        let x = 100 + Math.random() * 300;
        let y = -Math.random() * 500;
        stars.push(new Stars(x, y, loadedImages.star));
    }
}

function isColliding(obj1, obj2) {
    let collision = (
        obj1.x < obj2.x + 25 &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + 25 &&
        obj1.y + obj1.height > obj2.y
    );
    return collision;
}

function collisionStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
        let star = stars[i];

        if (isColliding(player, star)) {
            starCollect.play();
            starsScore += 1;

            star.x = 100 + Math.random() * 300;
            star.y = -Math.random() * 500;
            star.time = Math.random() * Math.PI * 2;
            
            continue;
        }
    }
}

function collisionSnowballs() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let snowball = enemies[i];

        if (isColliding(player, snowball)) {
            splat.play();
            console.log("Collision detected!");

            snowball.x = 50 + Math.random() * 350;
            snowball.y = -(Math.random() * 1000)
            lives -= 1;

            continue;
        }
    }
}

function startCountdown() {
    countdownStart = Date.now();
    timeRemaining = Math.ceil(countdownDuration / 1000);
}
function timer() {
    const now = Date.now();
    const elapsedTime = now - countdownStart;
    timeRemaining = Math.max(0, Math.ceil((countdownDuration - elapsedTime) / 1000));
    ctx.font = '50px Impact';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center'
    ctx.fillText(`${timeRemaining}`, canvas.width / 2, 50);
}

function drawImages(image, offset) {
    ctx.drawImage(
        image,
        0, offset,
        canvas.width,
        canvas.height,
        0, 0,
        canvas.width,
        canvas.height
    );
}

function gameLoop() {
    if (gameState === "introScreen") {
        introScreen();
    } else if (gameState === "gameScreen") {
        gameScreen();
    } else if (gameState === "gameOverScreen") {
        gameOverScreen();
    } else if (gameState === "countDown") {
        countDown();
    } else if (gameState === "winScreen") {
        winScreen();
    }
    requestAnimationFrame(gameLoop);
}

function introScreen() {
    lullaby.play();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImages(loadedImages.intro, 0,0);
}

function countDown() {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'skyblue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "100px Impact";
    ctx.textAlign = "center";
    
    if (frameCount < 60) {
        ctx.fillStyle = "red";
        ctx.fillText(messages[0], canvas.width / 2, canvas.height / 2);
    } else if (frameCount < 120) {
        ctx.fillStyle = "orange";
        ctx.fillText(messages[1], canvas.width / 2, canvas.height / 2);
    } else if (frameCount < 180) {
        ctx.fillStyle = "green";
        ctx.fillText(messages[2], canvas.width / 2, canvas.height / 2);
    }

    if (frameCount >= 180) {
        gameState = "gameScreen";
    }
}

function gameScreen() {
    music.play();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgb(0, 40, 95)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawImages(loadedImages.bg_img, bgOffsetY);
    if (bgOffsetY > 0) {
        bgOffsetY -= scrollSpeed;
    }

    player.update();
    enemies.forEach(enemy => {
        enemy.update();
    })
    stars.forEach(star => {
        star.update();
    })

    collisionStars();
    collisionSnowballs();

    timer();

    ctx.drawImage(loadedImages.star, 20,540,loadedImages.star.width * 1.2, loadedImages.star.height * 1.2);
    ctx.font = '25px Impact';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`${starsScore}`, 43, 577);

    ctx.drawImage(loadedImages.bearsml, 480,520);
    ctx.font = '25px Impact';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`${lives}`, 510, 580);


    if (timeRemaining <= 0) {
        gameState = 'winScreen';
    }
    if (lives <= 0) {
        gameState = 'gameOverScreen';
    }
}

function gameOverScreen () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    enemies = [];
    stars = [];
    drawImages(loadedImages.gameOverBg, 0);

    ctx.drawImage(loadedImages.star, 77,105,loadedImages.star.width * 2.5, loadedImages.star.height * 2.5)
    ctx.font = '40px Impact'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.fillText(`${starsScore}`, 127, 177)

}

function winScreen() {
    music.pause();
    music.currentTime = 0;
    lullaby.play();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImages(loadedImages.winner, 0,0);

    ctx.font = '40px Impact'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.fillText(`${starsScore}`, 140, 177)
}

(async () => {
    console.log("Loading images...");
    loadedImages = await loadAllImages(images);
    console.log("All images loaded!");

    player = new Player(canvas.width/2 -25, 450, loadedImages.bear)
    
    gameLoop();
})();

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
    if (gameState === "introScreen") {
        if (e.code === 'Space') {
            gameState = 'countDown';
            spawnEnemies();
            spawnStars();
            startCountdown();
            lives = 3;
            lullaby.pause();
            lullaby.currentTime = 0;

        }
    }
    if (gameState === "gameOverScreen" || gameState === "winScreen") {
        if (e.code === 'KeyP') {
            gameState = 'introScreen';
            starsScore = 0;
            stars.length = 0;
            enemies.length = 0;
            countdownStart = null;
            timeRemaining = Math.ceil(countdownDuration / 1000);
            countdownDuration = 120000;
            bgOffsetY = 1390;
            lives = 3;
            frameCount = 0;
            music.pause();
            music.currentTime = 0; 
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});
