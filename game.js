// 1. Setup Matter.js Tools (We added Mouse, MouseConstraint, Constraint, and Events)
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Constraint = Matter.Constraint,
      Events = Matter.Events;

// 2. Create the Physics Engine
const engine = Engine.create();

// 3. Connect the Start Button
const startBtn = document.getElementById('start-btn');
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');

startBtn.addEventListener('click', function() {
    // Hide the main menu
    mainMenu.style.display = 'none';

    // 4. Create the Renderer
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

    // 5. Create the Floor
    const floor = Bodies.rectangle(400, 590, 810, 60, { 
        isStatic: true, 
        render: { fillStyle: '#4a4e69' } 
    });

    // 6. Create the Energy Orb
    let energyOrb = Bodies.circle(150, 400, 20, { 
        restitution: 0.8, // Makes it bouncy
        render: { fillStyle: '#00e5ff' } // Bright neon blue
    });

    // 7. Create the Slingshot Elastic (The Rubber Band)
    const anchor = { x: 150, y: 400 }; // The fixed point in the air
    const elastic = Constraint.create({
        pointA: anchor,
        bodyB: energyOrb,
        stiffness: 0.05, // How stretchy the band is
        render: { strokeStyle: '#ffffff', lineWidth: 2 }
    });

    // 8. Add Mouse Controls
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false } // Hides the mouse's invisible grabbing line
        }
    });
    render.mouse = mouse; // Keeps the mouse synced with the screen

    // 9. The Firing Mechanism (Releasing the Orb)
    Events.on(mouseConstraint, 'enddrag', function(event) {
        if (event.body === energyOrb) {
            // Wait a tiny fraction of a second for the band to snap forward
            setTimeout(() => {
                elastic.bodyB = null; // Disconnects the rubber band so the orb flies!
            }, 20);
        }
    });

    // 10. Add everything to the world
    Composite.add(engine.world, [floor, energyOrb, elastic, mouseConstraint]);

    // 11. Start the game loop
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
});
