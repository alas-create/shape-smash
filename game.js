// 1. Setup Matter.js Tools
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

// 2. Create the Physics Engine
const engine = Engine.create();

// 3. Connect the Start Button
const startBtn = document.getElementById('start-btn');
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');

startBtn.addEventListener('click', function() {
    // Hide the main menu
    mainMenu.style.display = 'none';

    // 4. Create the Renderer (Draws the game on screen)
    const render = Render.create({
        element: gameContainer,
        engine: engine,
        options: {
            width: 800,
            height: 600,
            wireframes: false, // Shows solid colors instead of outlines
            background: 'transparent' // Lets our watermark show through
        }
    });

    // 5. Create a Floor and a Test Box
    // Bodies.rectangle(x-position, y-position, width, height, options)
    const floor = Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4a4e69' } });
    const testBox = Bodies.rectangle(400, 50, 80, 80, { render: { fillStyle: '#f2e9e4' } });

    // 6. Add the objects to the world
    Composite.add(engine.world, [floor, testBox]);

    // 7. Start the game loop
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);
});
