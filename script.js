const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext("2d");

const refreshRate = 60; // FPS
var FOV = {
    degrees: 50,
}
var resolution = 10;

var keyState = {};

var player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 60,
    direction: 0,
    speed: 0.7, // Pixels per frame
    angularSpeed: 0.4 // Radians per frame
}

var playerPath;
var playerHitboxPath;
var levelPath;
var scan = {
    x: 0,
    direction: 0
};

var showLevel = false;
var showHitbox = false;

fetch('levelPath.json')
    .then(response => response.json())
    .then(data => {
        levelPath = data;
        setInterval(gameLoop, refreshRate / 1000);
    })

document.addEventListener('keydown', (event) => {keyState[event.code] = true;})
document.addEventListener('keyup', (event) => {keyState[event.code] = false;})

document.addEventListener('keypress', (event) => {
    if (event.code == 'Enter') {
        showLevel = !showLevel;
    }
    if (event.code == 'KeyH') {
        showHitbox = !showHitbox;
    }
})

function updatePlayer() {
    playerHitboxPath = [
        [player.x - player.width / 8, player.y + player.height / 8], // Bottom Left
        [player.x - player.width / 8, player.y - player.height / 8], // Top Left
        [player.x + player.width / 8, player.y - player.height / 8], // Top Right
        [player.x + player.width / 8, player.y + player.height / 8] // Bottom Right
    ]
    if (keyState.ArrowLeft) {
        player.direction -= player.angularSpeed / refreshRate;
    }
    if (keyState.ArrowRight) {
        player.direction += player.angularSpeed / refreshRate;
    }
    if (keyState.ArrowUp || keyState.KeyW) {
        move(player.speed);
    }
    if (keyState.ArrowDown || keyState.KeyS) {
        move(-player.speed);
    }
    if (keyState.KeyA) {
        player.direction += 1.5 * Math.PI;
        move(player.speed);
        player.direction -= 1.5 * Math.PI;
    }
    if (keyState.KeyD) {
        player.direction -= 1.5 * Math.PI;
        move(player.speed);
        player.direction += 1.5 * Math.PI;
    }
}

function rayCast() {
    scan.x = resolution / 2;
    scan.direction = player.direction - FOV.radians / 2;
    for (let index = 0; index < 1920 / resolution; index++) {
        generateRay(scan.direction);
        scan.direction += FOV.radians * resolution / 1920;
        scan.x += resolution;
    }
}

function generateRay(direction) {
    let ray = {
        x: player.x,
        y: player.y
    }

    while (!checkRayCollision(ray.x, ray.y)) {
        ray.x += 2 * Math.sin(direction);
        ray.y -= 2 * Math.cos(direction);
    }

    let distance = Math.sqrt(Math.pow(ray.x - player.x, 2) + Math.pow(ray.y - player.y, 2)) * Math.cos(player.direction - scan.direction);
    let height = 50000 / distance;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 255, ${50 / (distance)})`
    ctx.lineWidth = resolution;
    ctx.beginPath();
    ctx.moveTo(scan.x, height + canvas.height / 2);
    ctx.lineTo(scan.x, -height + canvas.height / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function move(px) {
    if (checkPlayerCollision().top && px * Math.cos(player.direction) > 0) {
        if (!checkPlayerCollision().right && !checkPlayerCollision().left) {
            player.x += px * Math.sin(player.direction);
        }
        return;
    }
    if (checkPlayerCollision().bottom && px * Math.cos(player.direction) < 0) {
        if (!checkPlayerCollision().right && !checkPlayerCollision().left) {
            player.x += px * Math.sin(player.direction);
        }
        return;
    }
    if (checkPlayerCollision().left && px * Math.sin(player.direction) < 0) {
        if (!checkPlayerCollision().top && !checkPlayerCollision().bottom) {
            player.y -= px * Math.cos(player.direction);
        }
        return;
    }
    if (checkPlayerCollision().right && px * Math.sin(player.direction) > 0) {
        if (!checkPlayerCollision().top && !checkPlayerCollision().bottom) {
            player.y -= px * Math.cos(player.direction);
        }
        return;
    }
    else {
        player.x += px * Math.sin(player.direction);
        player.y -= px * Math.cos(player.direction);
    }   
}

function checkRayCollision(x, y) {
    let collision = false;
    for (let polygon = 0; polygon < levelPath.length; polygon++) {
        let minX = levelPath[polygon][0][0];
        let maxX = levelPath[polygon][0][0];
        let minY = levelPath[polygon][0][1];
        let maxY = levelPath[polygon][0][1];
        for (let vertex = 0; vertex < levelPath[polygon].length; vertex++) {
            minX = Math.min(minX, levelPath[polygon][vertex][0]);
            maxX = Math.max(maxX, levelPath[polygon][vertex][0]);
            minY = Math.min(minY, levelPath[polygon][vertex][1]);
            maxY = Math.max(maxY, levelPath[polygon][vertex][1]);
        }
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            collision = true;
        }
    }
    return collision;
}
    
function checkPlayerCollision() {
    let collision = {
        state: false,
        left: false,
        top: false,
        right: false,
        bottom: false,
        0: false,
        1: false,
        2: false,
        3: false,
    };
    for (let polygon = 0; polygon < levelPath.length; polygon++) {
        let minX = levelPath[polygon][0][0];
        let maxX = levelPath[polygon][0][0];
        let minY = levelPath[polygon][0][1];
        let maxY = levelPath[polygon][0][1];
        for (let vertex = 0; vertex < levelPath[polygon].length; vertex++) {
            minX = Math.min(minX, levelPath[polygon][vertex][0]);
            maxX = Math.max(maxX, levelPath[polygon][vertex][0]);
            minY = Math.min(minY, levelPath[polygon][vertex][1]);
            maxY = Math.max(maxY, levelPath[polygon][vertex][1]);
        }
        for (let vertex = 0; vertex < playerHitboxPath.length; vertex++) {
            if (playerHitboxPath[vertex][0] >= minX && playerHitboxPath[vertex][0] <= maxX && playerHitboxPath[vertex][1] >= minY && playerHitboxPath[vertex][1] <= maxY) {
                collision.state = true;
                collision[vertex] = true;
            }
        }
    }
    if (collision[0] && collision[1]) {
        collision.left = true;
    }
    if (collision[1] && collision[2]) {
        collision.top = true;
    }
    if (collision[2] && collision[3]) {
        collision.right = true;
    }
    if (collision[3] && collision[0]) {
        collision.bottom = true;
    }
    return collision;
}

function drawLevel() {
    ctx.save();
    ctx.fillStyle = 'gray';
    for (let polygon = 0; polygon < levelPath.length; polygon++) {
        ctx.beginPath();
        ctx.moveTo(...levelPath[polygon][0]);
        for (let vertex = 0; vertex < levelPath[polygon].length; vertex++) {
            ctx.lineTo(...levelPath[polygon][vertex]);
        }
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawPlayer() {
    // I created this manual rotation matrix because I was bored (and curious). It is used to determine the coordinates of the three vertices of the player triangle based on direction.
    playerPath = [
        [-player.width / 2 * Math.cos(player.direction) - player.height / 2 * Math.sin(player.direction) + player.x, -player.width / 2 * Math.sin(player.direction) + Math.cos(player.direction) * player.height / 2 + player.y],
        [Math.cos(player.direction) + player.height / 2 * Math.sin(player.direction) + player.x, Math.cos(player.direction) * -player.height / 2 + player.y], 
        [player.width / 2 * Math.cos(player.direction) - player.height / 2 * Math.sin(player.direction) + player.x, player.width / 2 * Math.sin(player.direction) + Math.cos(player.direction) * player.height / 2 + player.y]
    ];
    ctx.save();
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(...playerPath[0]);
    ctx.lineTo(...playerPath[1]);
    ctx.lineTo(...playerPath[2]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawPlayerHitbox() {
    ctx.save();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 3;
    ctx.stroke
    ctx.beginPath();
    ctx.moveTo(...playerHitboxPath[0]);
    ctx.lineTo(...playerHitboxPath[1]);
    ctx.lineTo(...playerHitboxPath[2]);
    ctx.lineTo(...playerHitboxPath[3]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    FOV.radians = FOV.degrees * Math.PI / 180;
    updatePlayer();
    rayCast();
    if (showLevel) {
        drawPlayer();
        drawLevel();
        if (showHitbox) {
            drawPlayerHitbox();
        }
    }
}