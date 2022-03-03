import "./style.css";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 512;
let leniency = 5;
const cloudImage = document.querySelector("#cloud");
const birdImage = document.querySelector("#bird");

const instructions = {
    start: "Press <span class='key'>space</span> to start",
    pause: "Press <span class='key'>p</span> to pause",
    resume: "Press <span class='key'>space</span> to resume"
};

const gravity = 0.25;
class Player {
    constructor(promises) {
        this.width = 50;
        this.height = 50;
        this.vx = 0;
        this.vy = 0;
        this.image = new Image();
        this.image.src = birdImage.src;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height / 2 - this.height / 2;
        const promise = new Promise((resolve) => {
            this.image.onload = () => {
                this.ready = true;
                resolve(true);
            };
        });
        if (promises) promises.push(promise);
    }
    draw() {
        if (!this.ready) return;
        // ctx.fillStyle = "red";
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    update() {
        this.draw();
        this.vy += gravity;
        this.y += this.vy;
    }
}

class Background {
    constructor() {
        this.width = canvas.width;
        this.height = canvas.height;
    }
    draw() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#9ce6fa');
        gradient.addColorStop(0.75, '#e3f9ff');
        gradient.addColorStop(1, '#9ce6fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

class Cloud {
    constructor(promises) {
        this.vx = (Math.random() * -4) - 1;
        this.vy = 0;
        this.image = new Image();
        this.image.src = cloudImage.src;
        const promise = new Promise((resolve) => {
            this.image.onload = () => {
                this.ready = true;
                const reduction = Math.round((Math.random() * 8)) + 5;
                this.width = this.image.width / reduction;
                this.height = this.image.height / reduction;
                this.x = canvas.width;
                this.y = Math.random() * (canvas.height - this.height);
                resolve(true);
            }
        });
        if (promises) promises.push(promise);
    }
    draw() {
        if (!this.ready) return;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    update() {
        this.draw();
        this.x += this.vx;
    }
}

class Obstacle {
    static pos = 'top';
    constructor() {
        this.width = 100;
        this.height = canvas.height / 2;
        this.x = canvas.width + this.width + Math.round(Math.random() * this.width);
        this.y = getObstacleY();
    }
    draw() {
        const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradient.addColorStop(0, '#cdcdcd');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#cdcdcd');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x - 2, this.y > 0 ? this.y : this.y + this.height - 10, this.width + 4, 10);
    }
    update() {
        this.draw();
        this.x -= 2;
    }
}

function getObstacleY() {
    let pos = [25, 50, 75, 100, 125, 150];
    let y = 0;
    if (Obstacle.pos === "top") {
        y = -25 - pos[Math.ceil(Math.random() * pos.length) - 1];
        Obstacle.pos = "bottom";
    } else {
        y = (canvas.height / 2) + pos[Math.ceil(Math.random() * pos.length) - 1] + 25;
        Obstacle.pos = "top";
    }
    return y;
}

const bg = new Background();
let clouds = [], obstacles = [];
let player, FPS, then = Date.now(), reqAnimFrame = undefined, game = {};
let promises = [];

const instruction = document.querySelector(".subtitle");
const score = document.querySelector(".score");
const gameOverEl = document.querySelector("#gameOver");
const restartEl = document.querySelector("#restart");

function gameOver() {
    score.innerHTML = "";
    instruction.innerHTML = "";
    gameOverEl.style.display = "block";
    gameOverEl.style.top = canvas.height / 2 - gameOverEl.offsetHeight / 2 + "px";
    gameOverEl.style.left = canvas.width / 2 - gameOverEl.offsetWidth / 2 + "px";
    const scoreEl = document.querySelector("#score");
    scoreEl.innerHTML = `${FPS}`;
}

function restart() {
    instruction.innerHTML = instructions.start;
    gameOverEl.style.display = "none";
    init();
    animate();
}

restartEl.addEventListener("click", restart);

function init() {
    game = { ready: false, over: false, pause: false };
    bg.draw();
    clouds = [new Cloud(promises)];
    obstacles = [new Obstacle(), new Obstacle()];
    player = new Player(promises);

    player.draw();
    FPS = 0;
    then = Date.now();
    reqAnimFrame = undefined;

    Promise.all(promises).then(() => {
        player.draw();
    });
}


function animate() {
    reqAnimFrame = requestAnimationFrame(animate);
    if (!game.ready || game.pause) return;
    if (game.over) {
        cancelAnimationFrame(reqAnimFrame);
        reqAnimFrame = undefined;
        gameOver();
        return;
    }
    bg.draw();
    clouds.forEach((cloud, index) => {
        cloud.update();
        if (cloud.x + cloud.width <= 0) {
            clouds.splice(index, 1);
        }
    });
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        if (obstacle.x + obstacle.width <= 0) {
            obstacles.splice(index, 1);
        }

        if (obstacle.x + leniency <= player.x + player.width && obstacle.x + obstacle.width - leniency >= player.x &&
            obstacle.y + leniency <= player.y + player.height && obstacle.y + obstacle.height - leniency >= player.y) {
            game.over = true;
        }
    });
    player.update();

    if (player.y < -leniency || player.y + player.height > canvas.height + leniency) {
        game.over = true;
    }

    if (clouds.length < 5) clouds.push(new Cloud());

    const now = Date.now();
    if (now - then >= 1000) {
        FPS++;
        score.innerHTML = `SCORE: ${FPS}`;
        if (FPS % 3 === 0) {
            obstacles.push(new Obstacle(), new Obstacle());
        }
        then = now;
    }

}

addEventListener("keydown", function ({ key }) {
    if (key === " ") {
        game.ready = true;
        game.pause = false;
        player.vy = -5;
        if (!game.over) instruction.innerHTML = instructions.pause;
        else restart();
    }
    if ((key === 'p' || key === 'P') && game.ready) {
        game.pause = true;
        instruction.innerHTML = game.pause ? instructions.resume : instructions.pause;
    }
});

restart();
