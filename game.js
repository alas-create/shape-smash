const Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner,
      Bodies = Matter.Bodies, Composite = Matter.Composite, Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint, Constraint = Matter.Constraint,
      Events = Matter.Events, Vector = Matter.Vector;

const engine = Engine.create();
const startBtn = document.getElementById('start-btn');
const mainMenu = document.getElementById('main-menu');
const levelSelect = document.getElementById('level-select');
const gameContainer = document.getElementById('game-container');
const messageScreen = document.getElementById('message-screen');
const messageText = document.getElementById('message-text');
const starDisplay = document.getElementById('star-display');

let shotsLeft = 0, initialShots = 0, targetsLeft = 0, currentLevel = 1, gameOver = false;
let energyOrb, elastic, render, runner, mouseConstraint;
let dashUsed = false; // Tracks if the player used their in-flight dash
const floor = Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4a4e69' } });

startBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    levelSelect.style.display = 'block';
    setupEngine();
});

function setupEngine() {
    render = Render.create({ element: gameContainer, engine: engine, options: { width: 800, height: 600, wireframes: false, background: 'transparent' } });
    const mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    render.mouse = mouse;
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
    
    // Slingshot Firing
    Events.on(mouseConstraint, 'enddrag', function(event) {
        if (event.body === energyOrb && shotsLeft > 0 && elastic.bodyB !== null) {
            setTimeout(() => {
                elastic.bodyB = null; 
                Composite.remove(engine.world, elastic); 
                shotsLeft--; updateHUD();
                
                if (shotsLeft > 0 && !gameOver) {
                    setTimeout(() => { if (!gameOver) spawnOrb(); }, 2000);
                }
                checkWinLose();
            }, 20);
        }
    });

    // Dash Ability! Click anywhere on the screen while the orb is flying
    document.addEventListener('mousedown', function() {
        if (energyOrb && elastic && elastic.bodyB === null && !dashUsed && energyOrb.speed > 2) {
            dashUsed = true;
            // Force the orb sharply forward and down like a meteor strike
            Matter.Body.setVelocity(energyOrb, { x: energyOrb.velocity.x * 1.5, y: 15 });
        }
    });

    Events.on(engine, 'collisionStart', function(event) {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.speed > 2 || pair.bodyB.speed > 2) {
                takeDamage(pair.bodyA); takeDamage(pair.bodyB);
            }
        });
    });

    Events.on(engine, 'beforeUpdate', function() {
        engine.world.bodies.forEach(body => {
            if (body.isDying) {
                body.render.opacity -= 0.03; 
                if (body.render.opacity <= 0.05) Composite.remove(engine.world, body);
            }
            if (body.position.y > 650 && body.customHealth && !body.isDying) {
                body.customHealth = 1; 
                takeDamage(body); 
            }
        });
    });
}

function spawnBlock(type, x, y) {
    const opts = { density: 0.005, restitution: 0.2 }; 
    if (type === 'rect') return Bodies.rectangle(x, y, 180, 60, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: '#8d99ae' } });
    if (type === 'square') return Bodies.rectangle(x, y, 80, 80, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: '#ef233c' } });
    if (type === 'circle') return Bodies.circle(x, y, 40, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: '#ffb703' } });
    if (type === 'triangle') return Bodies.polygon(x, y, 3, 50, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: '#8338ec' } });
    if (type === 'diamond') return Bodies.polygon(x, y, 4, 50, { ...opts, label: 'target', customHealth: 3, render: { fillStyle: '#3a86ff' } });
    if (type === 'star') return Bodies.polygon(x, y, 5, 40, { ...opts, label: 'star', customHealth: 1, render: { fillStyle: '#ff006e' } });
}

window.startLevel = function(levelNum) {
    currentLevel = levelNum;
    levelSelect.style.display = 'none';
    gameContainer.style.display = 'block';
    messageScreen.style.display = 'none';
    starDisplay.style.display = 'none'; // Hide stars when starting
    gameOver = false;

    Composite.clear(engine.world);
    Engine.clear(engine);
    Composite.add(engine.world, [floor, mouseConstraint]);

    let blocks = [];
    if (levelNum === 1) {
        shotsLeft = 3;
        blocks.push(spawnBlock('square', 600, 500));
        blocks.push(spawnBlock('square', 600, 400));
        blocks.push(spawnBlock('circle', 600, 300));
    } else if (levelNum === 2) {
        shotsLeft = 4;
        blocks.push(spawnBlock('rect', 500, 500));
        blocks.push(spawnBlock('triangle', 500, 400));
        blocks.push(spawnBlock('rect', 700, 500));
        blocks.push(spawnBlock('triangle', 700, 400));
    } else if (levelNum === 3) {
        shotsLeft = 3;
        blocks.push(spawnBlock('diamond', 600, 500));
        blocks.push(spawnBlock('diamond', 600, 400));
        blocks.push(spawnBlock('square', 600, 300));
    } else if (levelNum === 4) {
        shotsLeft = 3;
        blocks.push(spawnBlock('rect', 600, 500));
        blocks.push(spawnBlock('circle', 550, 400));
        blocks.push(spawnBlock('star', 600, 400));
        blocks.push(spawnBlock('circle', 650, 400));
        blocks.push(spawnBlock('rect', 600, 300));
    } else if (levelNum === 5) {
        shotsLeft = 5;
        blocks.push(spawnBlock('rect', 600, 500));
        blocks.push(spawnBlock('diamond', 550, 400));
        blocks.push(spawnBlock('diamond', 650, 400));
        blocks.push(spawnBlock('rect', 600, 300));
        blocks.push(spawnBlock('star', 600, 200));
        blocks.push(spawnBlock('triangle', 600, 100));
    }

    initialShots = shotsLeft; // Remember how many shots we started with for the Star Rating
    targetsLeft = blocks.filter(b => b.customHealth > 0).length;
    Composite.add(engine.world, blocks);
    updateHUD();
    spawnOrb();
};

function spawnOrb() {
    dashUsed = false; // Reset ability for the new orb
    energyOrb = Bodies.circle(80, 400, 25, { density: 0.01, restitution: 0.8, render: { fillStyle: '#00e5ff' } });
    const anchor = { x: 80, y: 400 };
    elastic = Constraint.create({ pointA: anchor, bodyB: energyOrb, stiffness: 0.05, render: { strokeStyle: '#ffffff', lineWidth: 2 } });
    Composite.add(engine.world, [energyOrb, elastic]);
}

function takeDamage(body) {
    if (body.customHealth && !gameOver && !body.isDying) {
        body.customHealth -= 1;
        if (body.customHealth <= 0) {
            
            // 1. Trigger Screen Shake
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 300);

            // 2. Spawn Particle Debris
            for(let i = 0; i < 5; i++) {
                let debris = Bodies.rectangle(body.position.x, body.position.y, 15, 15, {
                    render: { fillStyle: body.render.fillStyle }
                });
                // Shoot debris in random directions
                Matter.Body.setVelocity(debris, { x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 });
                Composite.add(engine.world, debris);
                
                // Make debris disappear after 1 second so it doesn't clutter the game
                setTimeout(() => Composite.remove(engine.world, debris), 1000);
            }

            if (body.label === 'star') triggerExplosion(body.position);
            body.isSensor = true; 
            body.isDying = true; 
            
            targetsLeft--; updateHUD(); checkWinLose();
        } else {
            body.render.opacity = 0.8;
        }
    }
}

function triggerExplosion(pos) {
    engine.world.bodies.forEach(otherBody => {
        if (otherBody.customHealth && Vector.magnitude(Vector.sub(pos, otherBody.position)) < 150) {
            takeDamage(otherBody);
        }
    });
}

function updateHUD() {
    document.getElementById('current-level-text').innerText = currentLevel;
    document.getElementById('shot-count').innerText = shotsLeft;
    document.getElementById('target-count').innerText = targetsLeft;
}

function checkWinLose() {
    if (targetsLeft <= 0) {
        gameOver = true;
        setTimeout(() => {
            messageText.innerText = "LEVEL CLEARED!";
            
            // Calculate 3-Star Rating
            let shotsUsed = initialShots - shotsLeft;
            if (shotsUsed === 1) starDisplay.innerText = "★★★";
            else if (shotsUsed === 2) starDisplay.innerText = "★★☆";
            else starDisplay.innerText = "★☆☆";
            
            starDisplay.style.display = 'block';
            document.getElementById('next-level-btn').style.display = currentLevel < 5 ? 'inline-block' : 'none';
            messageScreen.style.display = 'block';
        }, 1500);
    } else if (shotsLeft <= 0 && targetsLeft > 0) {
        setTimeout(() => {
            if (targetsLeft > 0 && !gameOver) {
                gameOver = true;
                messageText.innerText = "OUT OF SHOTS!";
                starDisplay.style.display = 'none';
                document.getElementById('next-level-btn').style.display = 'none';
                messageScreen.style.display = 'block';
            }
        }, 3000);
    }
}

document.getElementById('retry-btn').addEventListener('click', () => window.startLevel(currentLevel));
document.getElementById('next-level-btn').addEventListener('click', () => window.startLevel(currentLevel + 1));
document.getElementById('menu-btn').addEventListener('click', () => location.reload());
