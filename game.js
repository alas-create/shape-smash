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

// WIDENED THE FLOOR to fit the new 1000px wide arena
const floor = Bodies.rectangle(500, 590, 1010, 60, { isStatic: true, render: { fillStyle: '#4a4e69' } });

startBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    levelSelect.style.display = 'block';
    setupEngine();
});

function setupEngine() {
    // EXPANDED CANVAS: Width is now 1000 (was 800)
    render = Render.create({ element: gameContainer, engine: engine, options: { width: 1000, height: 600, wireframes: false, background: 'transparent' } });
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
            if (body.position.y > 650 && body.customHealth && !body.isDying) {
                body.customHealth = 1; 
                takeDamage(body); 
            }
        });
    });
}

// SUPER-SIZED BLOCKS: Increased width, height, and radius of everything
function spawnBlock(type, x, y) {
    const opts = { density: 0.005, restitution: 0.2 }; 
    if (type === 'rect') return Bodies.rectangle(x, y, 220, 80, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: '#8d99ae' } });
    if (type === 'square') return Bodies.rectangle(x, y, 100, 100, { ...opts, label: 'target', customHealth: 2, render: { fillStyle: '#ef233c' } });
    if (type === 'circle') return Bodies.circle(x, y, 50, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: '#ffb703' } });
    if (type === 'triangle') return Bodies.polygon(x, y, 3, 60, { ...opts, label: 'target', customHealth: 1, render: { fillStyle: '#8338ec' } });
    if (type === 'diamond') return Bodies.polygon(x, y, 4, 60, { ...opts, label: 'target', customHealth: 3, render: { fillStyle: '#3a86ff' } });
    if (type === 'star') return Bodies.polygon(x, y, 5, 50, { ...opts, label: 'star', customHealth: 1, render: { fillStyle: '#ff006e' } });
}

window.startLevel = function(levelNum) {
    currentLevel = levelNum;
    levelSelect.style.display = 'none';
    gameContainer.style.display = 'block';
    messageScreen.style.display = 'none';
    starDisplay.style.display = 'none';
    gameOver = false;
    
    gracePeriod = true;
    setTimeout(() => { gracePeriod = false; }, 2000); 

    Composite.clear(engine.world);
    Engine.clear(engine);
    Composite.add(engine.world, [floor, mouseConstraint]);

    let blocks = [];
    
    // MOVED TOWERS FARTHER RIGHT (X coordinates changed from 600 to 800)
    // SPACED OUT Y COORDINATES to fit the much bigger blocks!
    if (levelNum === 1) {
        shotsLeft = 3;
        blocks.push(spawnBlock('square', 800, 500));
        blocks.push(spawnBlock('square', 800, 380));
        blocks.push(spawnBlock('circle', 800, 240));
    } else if (levelNum === 2) {
        shotsLeft = 4;
        blocks.push(spawnBlock('rect', 650, 500));
        blocks.push(spawnBlock('triangle', 650, 380));
        blocks.push(spawnBlock('rect', 900, 500));
        blocks.push(spawnBlock('triangle', 900, 380));
    } else if (levelNum === 3) {
        shotsLeft = 3;
        blocks.
