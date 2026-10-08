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
    levelSelect.style.display = 'block'; // Show level select instead of starting immediately
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
                elastic.bodyB = null; // Fire orb
                
                // NEW LINE: Delete the old rubber band so it doesn't get stuck!
                Composite.remove(engine.world, elastic); 
                
                shotsLeft--; updateHUD();
                
                // Reload Orb after 1.5 seconds if shots remain
                if (shotsLeft > 0 && !gameOver) {
                    setTimeout(() => { if (!gameOver) spawnOrb(); }, 1500);
                }
                checkWinLose();
            }, 20);
        }
    });

    // Collision Logic
    Events.on(engine, 'collisionStart', function(event) {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.speed > 2 || pair.bodyB.speed > 2) {
                takeDamage(pair.bodyA); takeDamage(pair.bodyB);
            }
        });
    });
}

// --- HELPER: SPAWN BLOCKS EASILY ---
function spawnBlock(type, x, y) {
    if (type === 'rect') return Bodies.rectangle(x, y, 120, 40, { label: 'target', customHealth: 2, render: { fillStyle: '#8d99ae' } });
    if (type === 'square') return Bodies.rectangle(x, y, 50, 50, { label: 'target', customHealth: 2, render: { fillStyle: '#ef233c' } });
    if (type === 'circle') return Bodies.circle(x, y, 25, { label: 'target', customHealth: 1, render: { fillStyle: '#ffb703' } });
    if (type === 'triangle') return Bodies.polygon(x, y, 3, 30, { label: 'target', customHealth: 1, render: { fillStyle: '#8338ec' } });
    if (type === 'diamond') return Bodies.polygon(x, y, 4, 30, { label: 'target', customHealth: 3, render: { fillStyle: '#3a86ff' } });
    if (type === 'star') return Bodies.polygon(x, y, 5, 25, { label: 'star', customHealth: 1, render: { fillStyle: '#ff006e' } });
}

// --- LEVEL LOADER ---
window.startLevel = function(levelNum) {
    currentLevel = levelNum;
    levelSelect.style.display = 'none';
    gameContainer.style.display = 'block';
    messageScreen.style.display = 'none';
    gameOver = false;

    // Clear previous level
    Composite.clear(engine.world);
    Engine.clear(engine);
    Composite.add(engine.world, [floor, mouseConstraint]);

    let blocks = [];

    // DESIGNING THE 5 LEVELS
    if (levelNum === 1) { // Easy Intro
        shotsLeft = 3;
        blocks.push(spawnBlock('square', 600, 540));
        blocks.push(spawnBlock('square', 600, 490));
        blocks.push(spawnBlock('circle', 600, 440));
    } 
    else if (levelNum === 2) { // Multiple Targets
        shotsLeft = 4;
        blocks.push(spawnBlock('rect', 500, 540));
        blocks.push(spawnBlock('triangle', 500, 490));
        blocks.push(spawnBlock('rect', 700, 540));
        blocks.push(spawnBlock('triangle', 700, 490));
    }
    else if (levelNum === 3) { // Stronger Structures
        shotsLeft = 3;
        blocks.push(spawnBlock('diamond', 600, 540));
        blocks.push(spawnBlock('diamond', 600, 490));
        blocks.push(spawnBlock('square', 600, 440));
    }
    else if (levelNum === 4) { // Mixed Mechanics
        shotsLeft = 3;
        blocks.push(spawnBlock('rect', 600, 540));
        blocks.push(spawnBlock('circle', 550, 490));
        blocks.push(spawnBlock('star', 600, 490)); // Explodes!
        blocks.push(spawnBlock('circle', 650, 490));
        blocks.push(spawnBlock('rect', 600, 440));
    }
    else if (levelNum === 5) { // Boss Fortress
        shotsLeft = 5;
        blocks.push(spawnBlock('rect', 600, 540));
        blocks.push(spawnBlock('diamond', 550, 490));
        blocks.push(spawnBlock('diamond', 650, 490));
        blocks.push(spawnBlock('rect', 600, 440));
        blocks.push(spawnBlock('star', 600, 390));
        blocks.push(spawnBlock('triangle', 600, 340));
    }

    targetsLeft = blocks.filter(b => b.customHealth > 0).length;
    Composite.add(engine.world, blocks);
    updateHUD();
    spawnOrb();
};

function spawnOrb() {
    energyOrb = Bodies.circle(150, 400, 20, { restitution: 0.8, render: { fillStyle: '#00e5ff' } });
    const anchor = { x: 150, y: 400 };
    elastic = Constraint.create({ pointA: anchor, bodyB: energyOrb, stiffness: 0.05, render: { strokeStyle: '#ffffff', lineWidth: 2 } });
    Composite.add(engine.world, [energyOrb, elastic]);
}

// --- DAMAGE AND UI LOGIC ---
function takeDamage(body) {
    if (body.customHealth && !gameOver) {
        body.customHealth -= 1;
        if (body.customHealth <= 0) {
            if (body.label === 'star') triggerExplosion(body.position);
            Composite.remove(engine.world, body);
            body.customHealth = null;
            targetsLeft--; updateHUD(); checkWinLose();
        } else {
            body.render.opacity = 0.6;
        }
    }
}

function triggerExplosion(pos) {
    engine.world.bodies.forEach(otherBody => {
        if (otherBody.customHealth && Vector.magnitude(Vector.sub(pos, otherBody.position)) < 120) {
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
        }, 1000);
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

// UI Buttons
document.getElementById('retry-btn').addEventListener('click', () => window.startLevel(currentLevel));
document.getElementById('next-level-btn').addEventListener('click', () => window.startLevel(currentLevel + 1));
document.getElementById('menu-btn').addEventListener('click', () => location.reload());
