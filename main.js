import './style.css'

import Matter from "matter-js";
const { Engine, Render, Bodies, Composite, Runner, Events } = Matter;

// PID internal variables
let integral = 0;
let lastError = 0;
let weights = [];

// Control variables
let lastPosition = 0;
let desiredHeight = null;

// TODO document.all deprecated
const { element, target, kp, kd, ki, c1: c, c2 } = document.all;
const levers = { kp, ki, kd };

// Initialize Engine
const engine = Engine.create();

// Initialize Render
const render = Render.create({
  element,
  engine,
  options: {
    width: 800,
    height: 600,
    showVelocity: true
  }
});

// Create Submarine object 
const submarine = Bodies.rectangle(400, 300, 60, 20, { frictionAir: 0.05 });

// add bodies
Composite.add(engine.world, [submarine]);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);

// Reference to html canvas elements
const ctx = c.getContext("2d");
const ctx2 = c2.getContext("2d");

// Call update fn when Target, Kp, Kd or Ki changes 
Object.entries(levers).forEach(([name, input]) => {
  input.addEventListener("input", update);
});

target.addEventListener("input", update);

// 
Object.assign(globalThis, {
  desiredHeight: 0,
  weights: {
    kp: 0,
    ki: 0,
    kd: 0
  },
  submarine
});

function getInputSpan(input) {
  return input.closest("label").querySelector(".output");
}

// Update
function update() {
  integral = 0;
  getInputSpan(target).textContent = target.value;
  desiredHeight = target.valueAsNumber;

  Object.entries(levers).forEach(([name, input]) => {
    getInputSpan(input).textContent = input.value;
    weights[name] = input.valueAsNumber;
  });
}

update();

Events.on(runner, "beforeUpdate", async (ev) => {
  const { delta } = ev.source;

  // t
  const error = desiredHeight - submarine.position.y;
  // i
  integral += error;
  // d
  const differential = (error - lastError) / delta;

  submarine.force.y =
    weights.kp * error + weights.kd * differential + weights.ki * integral;

  // Draw on canvas
  ctx.beginPath();
  ctx.moveTo(ctx.canvas.width - 2, lastPosition);
  ctx.lineTo(ctx.canvas.width - 1, submarine.position.y);
  ctx.stroke();
  lastPosition = submarine.position.y;

  // Turn canvas into a bitmap and repaint it one pixel to the left
  const bitmap = await createImageBitmap(ctx.canvas);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(bitmap, -1, 0);

  // ctx.fillStyle = 'red';
  // ctx.fillRect(0, 0, 50, 50);
  ctx2.clearRect(0, 0, ctx2.canvas.width, ctx.canvas.height);
  ctx2.strokeStyle = "red";
  ctx2.beginPath();
  ctx2.moveTo(0, desiredHeight);
  ctx2.lineTo(ctx2.canvas.width, desiredHeight);
  ctx2.stroke();
});
