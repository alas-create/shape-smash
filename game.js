const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Constraint = Matter.Constraint,
      Events = Matter.Events,
      Vector = Matter.Vector;

const engine = Engine.create();

const startBtn = document.getElementById('start-btn');
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const hud = document.getElementById('hud');
const messageScreen = document.getElementById('message-screen');
const messageText = document.getElementById('message-text');

let shotsLeft = 3;
let targetsLeft = 6;
let gameOver = false;

startBtn.addEventListener('click', function() {
    mainMenu.style.display = 'none';
    hud.style.display = 'block'; // Show the scoreboard

    const render = Render.create({
        element: gameContainer,
        engine: engine,
        options: { width: 800, height: 600, wireframes: false, background: 'transparent' }
    });

    const floor = Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4a4e69' } });

    let energyOrb = Bodies.circle(150, 400, 20, { restitution: 0.8, render: { fillStyle: '#00e5ff' } });
    const anchor = { x: 150, y: 400 };
    const elastic = Constraint.create({ pointA: anchor, bodyB: energyOrb, stiffness: 0.05, render: { strokeStyle: '#ffffff', lineWidth: 2 } });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    render.mouse = mouse;

    // --- SHOOTING LOGIC ---
    Events.on(mouseConstraint, 'enddrag', function(event) {
        if (event.body === energyOrb && shotsLeft > 0 && elastic.bodyB !== null) {
            setTimeout(() => {
                elastic.bodyB = null; // Release orb
                shotsLeft--;
                document.getElementById('shot-count').innerText = shotsLeft;
                checkWinLose(); // Check if we ran out of shots
            }, 20);
        }
    });

    // --- THE BLOCKS (WITH HEALTH) ---
    // We added customHealth. 1 = Weak, 2 = Medium, 3 = Strong.
    const blockRect = Bodies.rectangle(600, 540, 120, 40, { label: 'target', customHealth: 2, render: { fillStyle: '#8d99ae' } });
    const blockTriangle = Bodies.polygon(560, 490, 3, 30, { label: 'target', customHealth: 1, render: { fillStyle: '#8338ec' } });
    const blockCircle = Bodies.circle(640, 490, 25, { label: 'target', customHealth: 1, render: { fillStyle: '#ffb703' } });
    const blockSquare = Bodies.rectangle(600, 440, 50, 50, { label: 'target', customHealth: 2, render: { fillStyle: '#ef233c' } });
    const blockDiamond = Bodies.polygon(600, 390, 4, 30, { label: 'target', customHealth: 3, render: { fillStyle: '#3a86ff' } });
    const blockStar = Bodies.polygon(600, 340, 5, 25, { label: 'star', customHealth: 1, render: { fillStyle: '#ff006e' } }); // Star has its own label

    Composite.add(engine.world, [floor, energyOrb, elastic, mouseConstraint, blockRect, blockTriangle, blockCircle, blockSquare, blockDiamond, blockStar]);

    // --- COLLISION LOGIC ---
    Events.on(engine, 'collisionStart', function(event) {
        event.pairs.forEach((pair) => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            // If blocks hit each other hard enough (speed > 2), damage them
            if (bodyA.speed > 2 || bodyB.speed > 2) {
                takeDamage(bodyA);
                takeDamage(bodyB);
            }
        });
    });

    // --- DAMAGE AND EXPLOSION RULES ---
    function takeDamage(body) {
        if (body.customHealth && !gameOver) {
            body.customHealth -= 1;
            
            if (body.customHealth <= 0) {
                // If it's a star, create an explosion!
                if (body.label === 'star') {
                    triggerExplosion(body.position);
                }
                
                // Remove block from the game
                Composite.remove(engine.world, body);
                body.customHealth = null; // Prevent double-counting
                
                targetsLeft--;
                document.getElementById('target-count').innerText = targetsLeft;
                checkWinLose();
            } else {
                // Dim the color slightly to show it took damage
                body.render.opacity = 0.6;
            }
        }
    }

    function triggerExplosion(starPosition) {
        // Find every block near the star and damage it
        engine.world.bodies.forEach(otherBody => {
            if (otherBody.customHealth) {
                // Calculate distance between the star and the other block
                const distance = Vector.magnitude(Vector.sub(starPosition, otherBody.position));
                if (distance < 120) { // If it is close enough to the blast...
                    takeDamage(otherBody); // Damage it!
                }
            }
        });
    }

    // --- WIN/LOSE CONDITIONS ---
    function checkWinLose() {
        if (targetsLeft <= 0) {
            gameOver = true;
            setTimeout(() => {
                messageText.innerText = "YOU WIN!";
                messageScreen.style.display = 'block';
            }, 1000); // Wait 1 second to let the blocks finish falling
        } else if (shotsLeft <= 0 && targetsLeft > 0) {
            // Wait 3 seconds to see if blocks are still falling before officially losing
            setTimeout(() => {
                if (targetsLeft > 0 && !gameOver) {
                    gameOver = true;
                    messageText.innerText = "OUT OF SHOTS!";
                    messageScreen.style.display = 'block';
                }
            }, 3000);
        }
    }

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
});
