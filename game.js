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
let dashUsed = false; 
let gracePeriod = true; 

const floor = Bodies.rectangle(600, 590, 1210, 60, { isStatic: true, render: { fillStyle: '#4a4e69' } });

startBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    levelSelect.style.display = 'block';
    setupEngine();
});

function setupEngine() {
    render = Render.create({ element: gameContainer, engine: engine, options: { width: 1200, height: 600, wireframes: false, background: 'transparent' } });
    const mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    render.mouse = mouse;
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
    
    Events.on(mouseConstraint, 'enddrag', function(event) {
        if (event.body === energyOrb && shotsLeft > 0 && elastic.bodyB !== null) {
            setTimeout(() => {
                elastic.bodyB = null; 
                Composite.remove(engine.world, elastic); 
                gracePeriod = false; 
                shotsLeft--; updateHUD();
                
                if (shotsLeft > 0 && !gameOver) {
                    setTimeout(() => { if (!gameOver) spawnOrb(); }, 2000);
                }
                checkWinLose();
            }, 20);
        }
    });

    document.addEventListener('mousedown', function() {
        if (energyOrb && elastic && elastic.bodyB === null && !dashUsed && energyOrb.speed > 2) {
            dashUsed = true;
            Matter.Body.setVelocity(energyOrb, { x: energyOrb.velocity.x * 1.5, y: 15 });
        }
    });

    Events.on(engine, 'collisionStart', function(event) {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.speed > 3 || pair.bodyB.speed > 3) {
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
            if (body.isMaterializing) {
                body.render.opacity += 0.02; 
                if (body.render.opacity >= 1) {
                    body.isMaterializing = false;
                }
            }
            if (body.position.y > 650 && body.customHealth && !body.isDying) {
                body.customHealth = 1; 
                let tempGrace = gracePeriod;
                gracePeriod = false;
                takeDamage(body); 
                gracePeriod = tempGrace;
            }
        });
    });
}

function spawnBlock(type, x, y) {
    const opts = { density: 0.005, restitution: 0.2 }; 
    let fill = ''; let body = null;

    if (type === 'rect') { fill = '#8d99ae'; body = Bodies.rectangle(x, y, 220, 80, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: fill, opacity: 0 } }); }
    if (type === 'square') { fill = '#ef233c'; body = Bodies.rectangle(x, y, 100, 100, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: fill, opacity: 0 } }); }
    if (type === 'circle') { fill = '#ffb703'; body = Bodies.circle(x, y, 50, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: fill, opacity: 0 } }); }
    if (type === 'triangle') { fill = '#8338ec'; body = Bodies.polygon(x, y, 3, 60, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: fill, opacity: 0 } }); }
    if (type === 'diamond') { fill = '#3a86ff'; body = Bodies.polygon(x, y, 4, 60, { ...opts, label: 'target', customHealth: 3, render: { fillStyle: fill, opacity: 0 } }); }
    if (type === 'star') { fill = '#ff006e'; body = Bodies.polygon(x, y, 5, 50, { ...opts, label: 'star', customHealth: 1, render: { fillStyle: fill, opacity: 0 } }); }
    
    body.isMaterializing = true;
    return body;
}

window.startLevel = function(levelNum) {
    currentLevel = levelNum;
    levelSelect.style.display = 'none';
    gameContainer.style.display = 'block';
    messageScreen.style.display = 'none';
    starDisplay.style.display = 'none';
    gameOver = false;
    
    gracePeriod = true;

    Composite.clear(engine.world);
    Engine.clear(engine);
    Composite.add(engine.world, [floor, mouseConstraint]);

    let blocks = [];
    
    if (levelNum === 1) {
        shotsLeft = 3;
        blocks.push(spawnBlock('square', 1000, 510));
        blocks.push(spawnBlock('square', 1000, 410));
        blocks.push(spawnBlock('circle', 1000, 310));
    } else if (levelNum === 2) {
        shotsLeft = 4;
        blocks.push(spawnBlock('rect', 850, 520));
        blocks.push(spawnBlock('triangle', 850, 430));
        blocks.push(spawnBlock('rect', 1100, 520));
        blocks.push(spawnBlock('triangle', 1100, 430));
    } else if (levelNum === 3) {
        shotsLeft = 3;
        blocks.push(spawnBlock('diamond', 1000, 500));
        blocks.push(spawnBlock('diamond', 1000, 380));
        blocks.push(spawnBlock('square', 1000, 270));
    } else if (levelNum === 4) {
        shotsLeft = 3;
        blocks.push(spawnBlock('rect', 1000, 520));
        blocks.push(spawnBlock('circle', 930, 430));
        blocks.push(spawnBlock('star', 1000, 430));
        blocks.push(spawnBlock('circle', 1070, 430));
        blocks.push(spawnBlock('rect', 1000, 340));
    } else if (levelNum === 5) {
        // THE NEW BOSS FORTRESS (16 Blocks, 8 Shots)
        shotsLeft = 8;
        
        // Floor Foundation
        blocks.push(spawnBlock('square', 800, 510));
        blocks.push(spawnBlock('square', 960, 510));
        blocks.push(spawnBlock('square', 1120, 510));

        // Platform 1
        blocks.push(spawnBlock('rect', 850, 420));
        blocks.push(spawnBlock('rect', 1070, 420));

        // The Core (2 Stars guarded by 2 Diamonds)
        blocks.push(spawnBlock('diamond', 780, 310));
        blocks.push(spawnBlock('star', 900, 310));
        blocks.push(spawnBlock('star', 1020, 310));
        blocks.push(spawnBlock('diamond', 1140, 310));

        // Platform 2
        blocks.push(spawnBlock('rect', 850, 200));
        blocks.push(spawnBlock('rect', 1070, 200));

        // Top Towers
        blocks.push(spawnBlock('circle', 850, 100));
        blocks.push(spawnBlock('square', 960, 100));
        blocks.push(spawnBlock('circle', 1070, 100));

        // The Crown
        blocks.push(spawnBlock('diamond', 960, -20));
    }

    initialShots = shotsLeft; 
    targetsLeft = blocks.filter(b => b.customHealth > 0).length;
    Composite.add(engine.world, blocks);
    updateHUD();
    spawnOrb();
};

function spawnOrb() {
    dashUsed = false; 
    energyOrb = Bodies.circle(250, 400, 30, { density: 0.01, restitution: 0.8, render: { fillStyle: '#00e5ff' } });
    const anchor = { x: 250, y: 400 };
    elastic = Constraint.create({ pointA: anchor, bodyB: energyOrb, stiffness: 0.05, render: { strokeStyle: '#ffffff', lineWidth: 2 } });
    Composite.add(engine.world, [energyOrb, elastic]);
}

function takeDamage(body) {
    if (gracePeriod) return;

    if (body.customHealth && !gameOver && !body.isDying) {
        body.customHealth -= 1;
        if (body.customHealth <= 0) {
            
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 300);

            for(let i = 0; i < 5; i++) {
                let debris = Bodies.rectangle(body.position.x, body.position.y, 20, 20, {
                    render: { fillStyle: body.render.fillStyle }
                });
                Matter.Body.setVelocity(debris, { x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 });
                Composite.add(engine.world, debris);
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
        if (otherBody.customHealth && Vector.magnitude(Vector.sub(pos, otherBody.position)) < 200) {
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
            
            let shotsUsed = initialShots - shotsLeft;
            if (shotsUsed <= 2) starDisplay.innerText = "★★★";
            else if (shotsUsed <= 4) starDisplay.innerText = "★★☆";
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
