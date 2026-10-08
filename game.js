// 1. Setup Matter.js Tools
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Constraint = Matter.Constraint,
      Events = Matter.Events;

const engine = Engine.create();

// 2. Connect UI Elements
const startBtn = document.getElementById('start-btn');
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');

startBtn.addEventListener('click', function() {
    mainMenu.style.display = 'none';

    // 3. Create the Renderer
    const render = Render.create({
        element: gameContainer,
        engine: engine,
        options: {
            width: 800,
            height: 600,
            wireframes: false,
            background: 'transparent'
        }
    });

    // 4. Create the Floor
    const floor = Bodies.rectangle(400, 590, 810, 60, { 
        isStatic: true, 
        render: { fillStyle: '#4a4e69' } 
    });

    // 5. Create the Energy Orb and Slingshot
    let energyOrb = Bodies.circle(150, 400, 20, { 
        restitution: 0.8, 
        render: { fillStyle: '#00e5ff' } 
    });

    const anchor = { x: 150, y: 400 };
    const elastic = Constraint.create({
        pointA: anchor,
        bodyB: energyOrb,
        stiffness: 0.05,
        render: { strokeStyle: '#ffffff', lineWidth: 2 }
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    render.mouse = mouse;

    Events.on(mouseConstraint, 'enddrag', function(event) {
        if (event.body === energyOrb) {
            setTimeout(() => {
                elastic.bodyB = null;
            }, 20);
        }
    });

    // 6. BUILD THE TARGET TOWER
    // We use 'label' so the game knows what shape is what for Phase 6.

    // Base: Rectangle (Heavy & Stable)
    const blockRect = Bodies.rectangle(600, 540, 120, 40, { 
        label: 'rectangle', render: { fillStyle: '#8d99ae' } 
    });

    // Middle Left: Triangle (Slides easily)
    // Polygon(x, y, sides, radius)
    const blockTriangle = Bodies.polygon(560, 490, 3, 30, { 
        label: 'triangle', render: { fillStyle: '#8338ec' } 
    });

    // Middle Right: Circle (Rolls away)
    const blockCircle = Bodies.circle(640, 490, 25, { 
        label: 'circle', render: { fillStyle: '#ffb703' } 
    });

    // Upper Middle: Square (Balanced)
    const blockSquare = Bodies.rectangle(600, 440, 50, 50, { 
        label: 'square', render: { fillStyle: '#ef233c' } 
    });

    // Top: Diamond (Strongest)
    // A 4-sided polygon drawn from the center makes a diamond shape!
    const blockDiamond = Bodies.polygon(600, 390, 4, 30, { 
        label: 'diamond', render: { fillStyle: '#3a86ff' } 
    });

    // Very Top: Star (Explosive - Represented physically as a 5-sided gem/pentagon)
    const blockStar = Bodies.polygon(600, 340, 5, 25, { 
        label: 'star', render: { fillStyle: '#ff006e' } 
    });

    // 7. Add EVERYTHING to the world
    Composite.add(engine.world, [
        floor, energyOrb, elastic, mouseConstraint,
        blockRect, blockTriangle, blockCircle, blockSquare, blockDiamond, blockStar
    ]);

    // 8. Start the game loop
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
});
