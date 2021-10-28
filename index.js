const { spawn } = require("child_process");

const scoreElem = document.getElementById("score");
const pointsElem = document.querySelector(".points");
const modal = document.querySelector(".modal")
const startGameBtn = document.querySelector(".modal button");
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
const game_audio = document.querySelector(".game_audio");
const over = document.querySelector(".over");
const hit = document.querySelector(".hit");

canvas.width = innerWidth;
canvas.height = innerHeight;

startGameBtn.addEventListener("click", startGame);

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color
        c.fill()
    }
}

class Projectiles extends Player {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color);
        this.velocity = velocity;
    }

    update() {
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.draw()
    }
}

class Enemies extends Projectiles {}

const friction = 0.97;
class Particle extends Projectiles {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color);
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha = this.alpha <= 0.02 ? 0 : this.alpha - 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;
const player = new Player(x, y, 10, "white");
let projectiles = [];
let enemies = [];
let particles = [];

function startGame() {
    modal.style.display = "none";
    game_audio.muted = false
    setTimeout(() => {
        score = 0;
        time = 0;
        scoreElem.innerText = score;
        projectiles = [];
        enemies = [];
        particles = [];
        animate();
    }, 1500)
}

let time = 900;

function spawnEnemies() {
    const spawn = setInterval(() => {
        const radius = Math.random() * (30 - 10) + 10;
        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        if (time <= 1500) {
            enemies.push(new Enemies(x, y, radius, color, velocity))
            enemies.push(new Enemies(x, y, radius, color, velocity))
            enemies.push(new Enemies(x, y, radius, color, velocity))
        } else {
            enemies.push(new Enemies(x, y, radius, color, velocity))
        }
    }, time);
    const enemy_spawn_speed = setInterval(() => {
        console.log(time, "..................")
        if (time <= 100) {
            clearInterval(enemy_spawn_speed)
        }
        time -= 100
    }, 3000);
}

let animationId;
let score = 0;

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = "rgba(0, 0, 0, 0.1)";
    c.fillRect(0, 0, canvas.width, canvas.height)
    player.draw()
    particles.forEach((particle, particleCount) => {
        if (particle.alpha <= 0) {
            particles.splice(particleCount, 1);
        }
        particle.update()
    })
    projectiles.forEach((projectile, projectileCount) => {
        projectile.update();
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y + projectile.radius > canvas.height) {
            console.log("yes")
            projectiles.splice(projectileCount, 1);
        }
    })
    enemies.forEach((enemy, enemyCount) => {
        enemy.update();
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // player hits 
        if (dist - player.radius - enemy.radius < 1) {
            game_audio.muted = true;
            over.muted = false;
            over.play()
            cancelAnimationFrame(animationId);
            pointsElem.innerText = score;
            modal.style.display = "flex"
        }

        projectiles.forEach((projectile, projectileCount) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (dist - enemy.radius - projectile.radius < 1) {
                hit.muted = false;
                hit.play()
                for (let i = 0; i < enemy.radius * 2; i++) {
                    const velocity = {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, velocity))
                }

                if (enemy.radius - 10 > 5) {
                    // updating score on hit 
                    score += 100;
                    scoreElem.innerText = score;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    enemy.radius -= 10
                    setTimeout(() => {
                        projectiles.splice(projectileCount, 1)
                    }, 0);
                } else {
                    score += 250;
                    scoreElem.innerText = score;
                    setTimeout(() => {
                        enemies.splice(enemyCount, 1)
                        projectiles.splice(projectileCount, 1)
                    }, 0);
                }
            }
        })
    });
}

window.addEventListener("click", (e) => {
    const angle = Math.atan2(e.clientY - y, e.clientX - x);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectiles(x, y, 5, "white", velocity))
})


spawnEnemies();
animate();
game_audio.muted = true;
document.body.addEventListener("mousemove", () => {
    console.log("//////////////////////////")
    game_audio.muted = false
    game_audio.play()
})

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        game_audio.muted = true;
        clearInterval(spawn)
        console.log('bye');
    } else {
        game_audio.muted = false;
        console.log('well back');
    }
}, false);