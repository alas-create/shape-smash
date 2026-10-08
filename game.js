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

let shotsLeft = 0, targetsLeft = 0, currentLevel = 1, gameOver = false;
let energyOrb, elastic, render, runner, mouseConstraint;
const floor = Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4a4e69' } });

// --- GAME SETUP ---
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
    
    // Firing Logic
    Events.on(mouseConstraint, 'enddrag', function(event) {
        if (event.body === energyOrb && shotsLeft > 0 && elastic.bodyB !== null) {
            setTimeout(() => {
                elastic.bodyB = null; 
                Composite.remove(engine.world, elastic); 
                
                shotsLeft--; updateHUD();
                
                if (shotsLeft > 0 && !gameOver) {
                    setTimeout(() => { if (!gameOver) spawnOrb(); }, 1500);
                }
                checkWinLose();
            }, 20);
        }
    });

    // Collision Logic (Damage on impact)
    Events.on(engine, 'collisionStart', function(event) {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.speed > 2 || pair.bodyB.speed > 2) {
                takeDamage(pair.bodyA); takeDamage(pair.bodyB);
            }
        });
    });

    // NEW: FADE OUT EFFECT AND KILL FLOOR
    Events.on(engine, 'beforeUpdate', function() {
        engine.world.bodies.forEach(body => {
            // 1. The Fade Effect for dead blocks
            if (body.isDying) {
                body.render.opacity -= 0.03; // Slowly reduce visibility
                if (body.render.opacity <= 0.05) {
                    Composite.remove(engine.world, body); // Delete once invisible
                }
            }
            
            // 2. The Kill Floor (if a block falls off the screen)
            if (body.position.y > 650 && body.customHealth && !body.isDying) {
                body.customHealth = 1; 
                takeDamage(body); 
            }
        });
    });
}

// --- HELPER: SPAWN BIGGER, HEAVIER BLOCKS ---
function spawnBlock(type, x, y) {
    // Increased all sizes significantly and added density for heavier impact
    const opts = { density: 0.005, restitution: 0.2 }; 
    
    if (type === 'rect') return Bodies.rectangle(x, y, 180, 60, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: '#8d99ae' } });
    if (type === 'square') return Bodies.rectangle(x, y, 80, 80, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: '#ef233c' } });
    if (type === 'circle') return Bodies.circle(x, y, 40, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: '#ffb703' } });
    if (type === 'triangle') return Bodies.polygon(x, y, 3, 50, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: '#8338ec' } });
    if (type === 'diamond') return Bodies.polygon(x, y, 4, 50, { ...opts, label: 'target', customHealth: 3, render: { fillStyle: '#3a86ff' } });
    if (type === 'star') return Bodies.polygon(x, y, 5, 40, { ...opts, label: 'star', customHealth: 1, render: { fillStyle: '#ff006e' } });
}

// --- LEVEL LOADER ---
window.startLevel = function(levelNum) {
    currentLevel = levelNum;
    levelSelect.style.display = 'none';
    gameContainer.style.display = 'block';
    messageScreen.style.display = 'none';
    gameOver = false;

    Composite.clear(engine.world);
    Engine.clear(engine);
    Composite.add(engine.world, [floor, mouseConstraint]);

    let blocks = [];
    
    // We adjusted the Y coordinates to drop them in, letting them stack dynamically!
    if (levelNum === 1) {
        shotsLeft = 3;
        blocks.push(spawnBlock('square', 600, 500));
        blocks.push(spawnBlock('square', 600, 400));
        blocks.push(spawnBlock('circle', 600, 300));
    } 
    else if (levelNum === 2) {
        shotsLeft = 4;
        blocks.push(spawnBlock('rect', 500, 500));
        blocks.push(spawnBlock('triangle', 500, 400));
        blocks.push(spawnBlock('rect', 700, 500));
        blocks.push(spawnBlock('triangle', 700, 400));
    }
    else if (levelNum === 3) {
        shotsLeft = 3;
        blocks.push(spawnBlock('diamond', 600, 500));
        blocks.push(spawnBlock('diamond', 600, 400));
        blocks.push(spawnBlock('square', 600, 300));
    }
    else if (levelNum === 4) {
        shotsLeft = 3;
        blocks.push(spawnBlock('rect', 600, 500));
        blocks.push(spawnBlock('circle', 550, 400));
        blocks.push(spawnBlock('star', 600, 400));
        blocks.push(spawnBlock('circle', 650, 400));
        blocks.push(spawnBlock('rect', 600, 300));
    }
    else if (levelNum === 5) {
        shotsLeft = 5;
        blocks.push(spawnBlock('rect', 600, 500));
        blocks.push(spawnBlock('diamond', 550, 400));
        blocks.push(spawnBlock('diamond', 650, 400));
        blocks.push(spawnBlock('rect', 600, 300));
        blocks.push(spawnBlock('star', 600, 200));
        blocks.push(spawnBlock('triangle', 600, 100));
    }

    targetsLeft = blocks.filter(b => b.customHealth > 0).length;
    Composite.add(engine.world, blocks);
    updateHUD();
    spawnOrb();
};

function spawnOrb() {
    // Moved slingshot back (X is now 80 instead of 150) and made orb slightly bigger
    energyOrb = Bodies.circle(80, 400, 25, { density: 0.01, restitution: 0.8, render: { fillStyle: '#00e5ff' } });
    const anchor = { x: 80, y: 400 };
    elastic = Constraint.create({ pointA: anchor, bodyB: energyOrb, stiffness: 0.05, render: { strokeStyle: '#ffffff', lineWidth: 2 } });
    Composite.add(engine.world, [energyOrb, elastic]);
}

function takeDamage(body) {
    if (body.customHealth && !gameOver && !body.isDying) {
        body.customHealth -= 1;
        if (body.customHealth <= 0) {
            if (body.label === 'star') triggerExplosion(body.position);
            
            // THE DRAMATIC COLLAPSE: Turn block into a ghost so others fall through it
            body.isSensor = true; 
            body.isDying = true; // Trigger the fade out animation
            
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
            document.getElementById('next-level-btn').style.display = currentLevel < 5 ? 'inline-block' : 'none';
            messageScreen.style.display = 'block';
        }, 1500); // Give a bit more time for the fade animation to finish
    } else if (shotsLeft <= 0 && targetsLeft > 0) {
        setTimeout(() => {
            if (targetsLeft > 0 && !gameOver) {
                gameOver = true;
                messageText.innerText = "OUT OF SHOTS!";
                document.getElementById('next-level-btn').style.display = 'none';
                messageScreen.style.display = 'block';
            }
        }, 3000);
    }
}

document.getElementById('retry-btn').addEventListener('click', () => window.startLevel(currentLevel));
document.getElementById('next-level-btn').addEventListener('click', () => window.startLevel(currentLevel + 1));
document.getElementById('menu-btn').addEventListener('click', () => location.reload());
