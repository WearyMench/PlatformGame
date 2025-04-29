import { Player } from "./player.js";
import { Platform, GenericObject } from "./platform.js";
import { Enemies } from "./enemies.js";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  loadSprites,
  loadImage,
} from "./utils.js";

// Get canvas and context
const canvas = document.getElementById("canvas1");
if (!canvas) {
  console.error("Canvas element not found");
  throw new Error("Canvas element not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  console.error("Could not get canvas context");
  throw new Error("Could not get canvas context");
}

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game state
let player;
let platforms = [];
let genericObjects = [];
let enemies = [];
let sprites;
let camera = {
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
};
let gameStarted = false;
let gamePaused = false;
let animationFrameId = null;
let gameOver = false;
let scrollOffset = 0;

// Start screen animation
let characterCanvas;
let characterCtx;
let characterFrame = 0;
let characterFramesMax = 2; // Enemy has 2 frames
let characterFramesElapsed = 0;
let characterFramesHold = 10; // Slower animation for enemy
let enemySprite = null;

// Initialize game
async function init() {
  try {
    // Get start screen elements
    const startScreen = document.getElementById("startScreen");
    const startButton = document.getElementById("startButton");
    const pauseButton = document.getElementById("pauseButton");
    const exitButton = document.getElementById("exitButton");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const restartButton = document.getElementById("restartButton");
    const livesDisplay = document.getElementById("livesDisplay");
    characterCanvas = document.getElementById("characterCanvas");
    characterCtx = characterCanvas.getContext("2d");

    // Add click event to start button
    startButton.addEventListener("click", () => {
      startScreen.classList.add("hidden");
      gameStarted = true;
      gameOver = false;
      gamePaused = false;
      pauseButton.querySelector(".button-text").textContent = "PAUSE";
      player.lives = 3;
      updateLivesDisplay();
      resetGameState();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animate();
    });

    // Add click event to restart button
    restartButton.addEventListener("click", () => {
      gameOverScreen.classList.add("hidden");
      gameStarted = true;
      gameOver = false;
      gamePaused = false;
      pauseButton.querySelector(".button-text").textContent = "PAUSE";
      player.lives = 3;
      updateLivesDisplay();
      resetGameState();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animate();
    });

    // Add click event to exit button
    exitButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to exit?")) {
        gameStarted = false;
        gamePaused = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        startScreen.classList.remove("hidden");
        pauseButton.querySelector(".button-text").textContent = "PAUSE";
        resetGameState();
      }
    });

    // Add click event to pause button
    pauseButton.addEventListener("click", () => {
      if (!gameStarted || gameOver) return;

      gamePaused = !gamePaused;
      pauseButton.querySelector(".button-text").textContent = gamePaused
        ? "RESUME"
        : "PAUSE";

      if (!gamePaused) {
        // Resume the game
        if (!animationFrameId) {
          animate();
        }
      } else {
        // Pause the game
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    });

    // Add game over event listener
    window.addEventListener("gameOver", () => {
      gameOver = true;
      gameStarted = false;
      gameOverScreen.classList.remove("hidden");
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });

    // Function to update lives display
    function updateLivesDisplay() {
      livesDisplay.textContent = `LIVES: ${player.lives}`;
    }

    // Function to reset game state
    function resetGameState() {
      // Reset player position and state
      player.position.x = 100;
      player.position.y = 100;
      player.velocity.x = 0;
      player.velocity.y = 0;
      player.currentSprite = player.sprites.stand.right;
      player.frames = 0;
      player.moving = false;
      player.direction = "right";
      player.hit = false;
      player.isJumping = false;
      player.isOnGround = false;

      // Reset camera
      camera.x = 0;
      camera.y = 0;

      // Reset scroll offset
      scrollOffset = 0;

      // Reset platforms
      platforms.forEach((platform) => {
        platform.position.x = platform.initialX;
        platform.position.y = platform.initialY;
      });

      // Reset enemies
      enemies.forEach((enemy) => {
        enemy.position.x = enemy.initialX;
        enemy.position.y = enemy.initialY;
        enemy.currentSprite = enemy.sprites.idle.in;
        enemy.frames = 0;
        enemy.idleTime = 0;
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
      });

      // Reset generic objects
      genericObjects.forEach((object) => {
        object.position.x = object.initialX;
        object.position.y = object.initialY;
      });
    }

    // Load enemy sprite for start screen
    enemySprite = await loadImage("./img/Idle 1 (44x26).png");

    // Start character animation
    animateCharacter();

    // Load game sprites
    sprites = await loadSprites();

    // Create player
    player = new Player({ canvas });
    player.sprites.stand.right = sprites.idleBunny;
    player.sprites.stand.left = sprites.idleBunny2;
    player.sprites.run.right = sprites.runBunny;
    player.sprites.run.left = sprites.runBunny2;
    player.sprites.hit.right = sprites.hitBunny2;
    player.sprites.hit.left = sprites.hitBunny;
    player.currentSprite = player.sprites.stand.right;

    // Create platforms
    const platformImage = await loadImage("./img/platform.png");
    platforms = [
      // Ground platform (wider)
      new Platform({
        x: -1,
        y: 470,
        image: platformImage,
        scale: 2,
      }),
      new Platform({
        x: 400,
        y: 470,
        image: platformImage,
        scale: 2,
      }),
      // First set of platforms (connected)
      new Platform({
        x: 600,
        y: 400,
        image: platformImage,
        scale: 2,
      }),
      new Platform({
        x: 800,
        y: 400,
        image: platformImage,
        scale: 2,
      }),
      // Second set of platforms (higher)
      new Platform({
        x: 1000,
        y: 350,
        image: platformImage,
        scale: 2,
      }),
      new Platform({
        x: 1200,
        y: 350,
        image: platformImage,
        scale: 2,
      }),
      // Third set of platforms (highest)
      new Platform({
        x: 1400,
        y: 300,
        image: platformImage,
        scale: 2,
      }),
      new Platform({
        x: 1600,
        y: 300,
        image: platformImage,
        scale: 2,
      }),
      // Fourth set of platforms (descending)
      new Platform({
        x: 1800,
        y: 350,
        image: platformImage,
        scale: 2,
      }),
      new Platform({
        x: 2000,
        y: 350,
        image: platformImage,
        scale: 2,
      }),
      // Final set of platforms (back to ground level)
      new Platform({
        x: 2200,
        y: 400,
        image: platformImage,
        scale: 2,
      }),
      new Platform({
        x: 2400,
        y: 400,
        image: platformImage,
        scale: 2,
      }),
    ];

    // Create generic objects (background with parallax)
    const backgroundImage = await loadImage("./img/background.png");
    genericObjects = [
      new GenericObject({
        x: -1,
        y: -1,
        image: backgroundImage,
        scale: 2,
        parallaxFactor: 0.5, // Slower parallax for background
      }),
    ];

    // Create enemies and load their images
    enemies = [
      new Enemies({
        x: 700, // Center of first platform set
        y: 400 - 26 * 2, // On first platform set
        canvas,
      }),
      new Enemies({
        x: 1100, // Center of second platform set
        y: 350 - 26 * 2, // On second platform set
        canvas,
      }),
      new Enemies({
        x: 1500, // Center of third platform set
        y: 300 - 26 * 2, // On third platform set
        canvas,
      }),
    ];

    // Load enemy images and wait for them to be ready
    await Promise.all(enemies.map((enemy) => enemy.loadImage()));

    // Event listeners
    window.addEventListener("keydown", (event) => {
      if (!gameStarted || gamePaused) return;

      switch (event.key) {
        case "ArrowLeft":
          player.velocity.x = -player.speed;
          player.moving = true;
          player.direction = "left";
          break;
        case "ArrowRight":
          player.velocity.x = player.speed;
          player.moving = true;
          player.direction = "right";
          break;
        case "ArrowUp":
        case " ":
          player.jump();
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      if (!gameStarted || gamePaused) return;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowRight":
          player.velocity.x = 0;
          player.moving = false;
          break;
      }
    });

    // Mobile controls
    const leftButton = document.querySelector(".mobile-button.left");
    const rightButton = document.querySelector(".mobile-button.right");
    const jumpButton = document.querySelector(".mobile-button.jump");

    // Touch start events
    leftButton.addEventListener(
      "touchstart",
      (e) => {
        if (!gameStarted || gamePaused) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        player.velocity.x = -player.speed;
        player.moving = true;
        player.direction = "left";
      },
      { passive: false }
    );

    rightButton.addEventListener(
      "touchstart",
      (e) => {
        if (!gameStarted || gamePaused) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        player.velocity.x = player.speed;
        player.moving = true;
        player.direction = "right";
      },
      { passive: false }
    );

    jumpButton.addEventListener(
      "touchstart",
      (e) => {
        if (!gameStarted || gamePaused) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        player.jump();
      },
      { passive: false }
    );

    // Touch end events
    leftButton.addEventListener(
      "touchend",
      (e) => {
        if (!gameStarted || gamePaused) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        if (player.velocity.x < 0) {
          player.velocity.x = 0;
          player.moving = false;
        }
      },
      { passive: false }
    );

    rightButton.addEventListener(
      "touchend",
      (e) => {
        if (!gameStarted || gamePaused) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        if (player.velocity.x > 0) {
          player.velocity.x = 0;
          player.moving = false;
        }
      },
      { passive: false }
    );

    // Prevent default touch behaviors
    document.querySelectorAll(".mobile-button").forEach((button) => {
      button.addEventListener(
        "touchmove",
        (e) => {
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        { passive: false }
      );
    });

    // Update lives display when player takes damage
    player.takeDamage = function () {
      const result = Player.prototype.takeDamage.call(this);
      updateLivesDisplay();
      return result;
    };

    // Initialize game state
    gameStarted = false;
    gamePaused = false;
    gameOver = false;
    player.lives = 3;
    updateLivesDisplay();
    resetGameState();

    // Start the game loop
    animate();
  } catch (error) {
    console.error("Error initializing game:", error);
  }
}

// Character animation for start screen
function animateCharacter() {
  if (gameStarted) return;

  requestAnimationFrame(animateCharacter);
  characterCtx.clearRect(0, 0, characterCanvas.width, characterCanvas.height);

  characterFramesElapsed++;
  if (characterFramesElapsed % characterFramesHold === 0) {
    if (characterFrame < characterFramesMax - 1) characterFrame++;
    else characterFrame = 0;
  }

  // Draw the current frame of the enemy idle animation
  if (enemySprite) {
    characterCtx.drawImage(
      enemySprite,
      characterFrame * 44, // Frame width
      0,
      44, // Frame width
      26, // Frame height
      0,
      0,
      characterCanvas.width,
      characterCanvas.height
    );
  }
}

// Game loop
function animate() {
  if (!gameStarted || gamePaused || gameOver) return;

  animationFrameId = requestAnimationFrame(animate);

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update camera position to follow player
  camera.x = player.position.x - CANVAS_WIDTH / 2;
  camera.y = player.position.y - CANVAS_HEIGHT / 2;

  // Keep camera within level bounds
  camera.x = Math.max(0, Math.min(camera.x, 2400 - CANVAS_WIDTH));
  camera.y = Math.max(0, Math.min(camera.y, 470 - CANVAS_HEIGHT));

  // Draw and update all game objects with camera offset
  genericObjects.forEach((object) => {
    object.draw(ctx, camera.x);
  });

  platforms.forEach((platform) => {
    platform.draw(ctx, camera.x, camera.y);
  });

  enemies.forEach((enemy) => {
    enemy.update(platforms);
    enemy.draw(ctx, camera.x, camera.y);
  });

  player.draw(ctx, camera.x, camera.y);
  player.update(platforms, enemies);
}

// Initialize the game
init();
