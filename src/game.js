import { Player } from "./player.js";
import { Platform, GenericObject } from "./platform.js";
import { Enemies } from "./enemies.js";
import { SoundManager } from "./sounds.js";
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
let soundManager;
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
let levelStartTime = 0;
let levelComplete = false;
let finishFlag = null;
let collectibles = [];
let score = 0;
let collectibleFrame = 0;
let collectibleFramesMax = 4;
let collectibleFramesElapsed = 0;
let collectibleFramesHold = 10;
let timerDisplay = null;

// Start screen animation
let characterCanvas;
let characterCtx;
let characterFrame = 0;
let characterFramesMax = 2; // Enemy has 2 frames
let characterFramesElapsed = 0;
let characterFramesHold = 10; // Slower animation for enemy
let enemySprite = null;

// Function to update timer display
function updateTimerDisplay() {
  if (!gameStarted || gamePaused || gameOver || levelComplete) return;
  const currentTime = ((Date.now() - levelStartTime) / 1000).toFixed(1);
  timerDisplay.textContent = `TIME: ${currentTime}s`;
}

// Function to update score display
function updateScoreDisplay() {
  const scoreDisplay = document.getElementById("scoreDisplay");
  if (scoreDisplay) {
    scoreDisplay.textContent = `SCORE: ${score}`;
  }
}

// Function to check collectible collisions
function checkCollectibles() {
  if (!player || !collectibles) return;

  collectibles.forEach((collectible) => {
    if (!collectible.collected) {
      // Calculate the center points of both the player and collectible
      const playerCenterX =
        player.position.x + (player.width * player.scale) / 2;
      const playerCenterY =
        player.position.y + (player.height * player.scale) / 2;
      const collectibleCenterX =
        collectible.position.x + (collectible.width * collectible.scale) / 2;
      const collectibleCenterY =
        collectible.position.y + (collectible.height * collectible.scale) / 2;

      // Calculate the distance between centers
      const distanceX = Math.abs(playerCenterX - collectibleCenterX);
      const distanceY = Math.abs(playerCenterY - collectibleCenterY);

      // Define collision thresholds (adjust these values as needed)
      const collisionThresholdX = 30;
      const collisionThresholdY = 30;

      // Check if the distance is less than the threshold
      if (distanceX < collisionThresholdX && distanceY < collisionThresholdY) {
        collectible.collected = true;
        score += Number(collectible.value);
        updateScoreDisplay();
        soundManager.play("collect");
      }
    }
  });
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

  // Reset timer display
  timerDisplay.textContent = "TIME: 0.0s";

  // Reset score
  score = 0;
  updateScoreDisplay();

  // Reset collectibles
  collectibles.forEach((collectible) => {
    collectible.collected = false;
    collectible.frames = 0;
    collectible.framesElapsed = 0;
    collectible.floatTime = Math.random() * Math.PI * 2;
  });

  // Reset platforms
  platforms.forEach((platform) => {
    platform.position.x = platform.initialX;
    platform.position.y = platform.initialY;
  });

  // Reset enemies
  enemies.forEach((enemy) => {
    enemy.position.x = enemy.initialX;
    enemy.position.y = enemy.initialY;
    enemy.currentSprite = enemy.sprites.idle1;
    enemy.frames = 0;
    enemy.velocity.x = 2; // Reset to initial velocity
    enemy.velocity.y = 0;
    enemy.direction = "right";
    enemy.startX = enemy.initialX;
    // Ensure platform bounds are maintained
    enemy.platformStart = enemy.initialX;
    enemy.platformEnd = enemy.initialX + enemy.moveDistance;
    // Reset hit and dead states
    enemy.isHit = false;
    enemy.isDead = false;
    enemy.hitTimer = 0;
    enemy.currentSpriteType = "idle1";
  });

  // Reset generic objects
  genericObjects.forEach((object) => {
    object.position.x = object.initialX;
    object.position.y = object.initialY;
  });

  // Reset level completion state
  levelComplete = false;
  levelStartTime = Date.now();

  // Cancel any ongoing animations
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// Function to check level completion
function checkLevelCompletion() {
  if (levelComplete) return;

  // Check if player reached the finish flag
  if (
    player.position.x >= finishFlag.position.x - 50 &&
    player.position.x <= finishFlag.position.x + 50 &&
    player.position.y <= finishFlag.position.y + 100
  ) {
    levelComplete = true;
    const completionTime = ((Date.now() - levelStartTime) / 1000).toFixed(1);
    const timeBonus = Math.max(0, 10000 - completionTime * 10);
    const collectibleBonus = Number(score) || 0;
    const totalScore = timeBonus + collectibleBonus;

    // Show completion screen
    const completionScreen = document.createElement("div");
    completionScreen.className = "completion-screen";
    completionScreen.innerHTML = `
      <div class="completion-content">
        <h2>LEVEL COMPLETE!</h2>
        <p>Time: ${completionTime}s</p>
        <p>Time Bonus: ${timeBonus}</p>
        <p>Collectibles: ${collectibleBonus}</p>
        <p>Total Score: ${totalScore}</p>
        <button id="nextLevelButton" class="retro-button">
          <span class="button-text">NEXT LEVEL</span>
        </button>
        <button id="retryLevelButton" class="retro-button">
          <span class="button-text">RETRY</span>
        </button>
      </div>
    `;
    document.body.appendChild(completionScreen);

    // Add event listeners for completion screen buttons
    document.getElementById("nextLevelButton").addEventListener("click", () => {
      completionScreen.remove();
      resetGameState();
      gameStarted = true;
      gamePaused = false;
      gameOver = false;
      animate();
    });

    document
      .getElementById("retryLevelButton")
      .addEventListener("click", () => {
        completionScreen.remove();
        resetGameState();
        gameStarted = true;
        gamePaused = false;
        gameOver = false;
        animate();
      });

    // Play completion sound
    soundManager.play("collect");
  }
}

// Initialize game
async function init() {
  try {
    // Initialize sound manager
    soundManager = new SoundManager();

    // Get start screen elements
    const startScreen = document.getElementById("startScreen");
    const startButton = document.getElementById("startButton");
    const pauseButton = document.getElementById("pauseButton");
    const exitButton = document.getElementById("exitButton");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const restartButton = document.getElementById("restartButton");
    const livesDisplay = document.getElementById("livesDisplay");
    const pauseScreen = document.getElementById("pauseScreen");
    const resumeButton = document.getElementById("resumeButton");
    const pauseExitButton = document.getElementById("pauseExitButton");
    const musicVolumeSlider = document.getElementById("musicVolumeSlider");
    const sfxVolumeSlider = document.getElementById("sfxVolumeSlider");
    const muteButton = document.getElementById("muteButton");
    const pauseMusicVolumeSlider = document.getElementById(
      "pauseMusicVolumeSlider"
    );
    const pauseSfxVolumeSlider = document.getElementById(
      "pauseSfxVolumeSlider"
    );
    const pauseMuteButton = document.getElementById("pauseMuteButton");
    const testSoundButton = document.getElementById("testSoundButton");
    const pauseTestSoundButton = document.getElementById(
      "pauseTestSoundButton"
    );
    timerDisplay = document.getElementById("timerDisplay");
    characterCanvas = document.getElementById("characterCanvas");
    characterCtx = characterCanvas.getContext("2d");

    // Function to play test sounds
    function playTestSounds() {
      // Play each sound effect in sequence with a small delay
      const sounds = ["jump", "land", "collect", "death"];
      let delay = 0;

      sounds.forEach((sound) => {
        setTimeout(() => {
          soundManager.play(sound);
        }, delay);
        delay += 500; // 500ms delay between each sound
      });
    }

    // Add click event listeners for test sound buttons
    testSoundButton.addEventListener("click", playTestSounds);
    pauseTestSoundButton.addEventListener("click", playTestSounds);

    // Volume control event listeners
    let isMuted = false;
    let previousMusicVolume = 70; // Default music volume
    let previousSfxVolume = 70; // Default SFX volume

    // Function to update volume sliders
    function updateVolumeSliders(musicVolume, sfxVolume) {
      musicVolumeSlider.value = musicVolume;
      pauseMusicVolumeSlider.value = musicVolume;
      sfxVolumeSlider.value = sfxVolume;
      pauseSfxVolumeSlider.value = sfxVolume;
    }

    // Function to update mute buttons
    function updateMuteButtons(isMuted) {
      const icon = isMuted ? "🔇" : "🔊";
      muteButton.querySelector(".button-text").textContent = icon;
      pauseMuteButton.querySelector(".button-text").textContent = icon;
      muteButton.classList.toggle("muted", isMuted);
      pauseMuteButton.classList.toggle("muted", isMuted);
    }

    // Function to handle volume changes
    function handleVolumeChange(musicVolume, sfxVolume) {
      soundManager.setVolume("background", musicVolume / 100);
      soundManager.setSFXVolume(sfxVolume / 100);
      updateVolumeSliders(musicVolume, sfxVolume);
    }

    // Music volume slider event listeners
    [musicVolumeSlider, pauseMusicVolumeSlider].forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value);
        handleVolumeChange(volume, parseInt(sfxVolumeSlider.value));
        if (volume > 0) {
          isMuted = false;
          previousMusicVolume = volume;
          updateMuteButtons(false);
        }
      });
    });

    // SFX volume slider event listeners
    [sfxVolumeSlider, pauseSfxVolumeSlider].forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value);
        handleVolumeChange(parseInt(musicVolumeSlider.value), volume);
        if (volume > 0) {
          isMuted = false;
          previousSfxVolume = volume;
          updateMuteButtons(false);
        }
      });
    });

    // Mute button event listeners
    [muteButton, pauseMuteButton].forEach((button) => {
      button.addEventListener("click", () => {
        isMuted = !isMuted;
        if (isMuted) {
          previousMusicVolume = parseInt(musicVolumeSlider.value);
          previousSfxVolume = parseInt(sfxVolumeSlider.value);
          handleVolumeChange(0, 0);
          updateMuteButtons(true);
        } else {
          handleVolumeChange(previousMusicVolume, previousSfxVolume);
          updateMuteButtons(false);
        }
      });
    });

    // Set initial volumes
    handleVolumeChange(70, 70);

    // Add click event to start button
    startButton.addEventListener("click", () => {
      startScreen.classList.add("hidden");
      gameStarted = true;
      gameOver = false;
      gamePaused = false;
      levelComplete = false;
      levelStartTime = Date.now();
      updateTimerDisplay();
      pauseButton.querySelector(".button-text").textContent = "PAUSE";
      player.lives = 3;
      updateLivesDisplay();
      resetGameState();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      soundManager.playBackground();
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
      soundManager.playBackground();
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
        soundManager.stopBackground();
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
          soundManager.playBackground();
          animate();
        }
        pauseScreen.classList.add("hidden");
      } else {
        // Pause the game
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        soundManager.stopBackground();
        pauseScreen.classList.remove("hidden");
      }
    });

    // Add click event to resume button
    resumeButton.addEventListener("click", () => {
      gamePaused = false;
      pauseButton.querySelector(".button-text").textContent = "PAUSE";
      pauseScreen.classList.add("hidden");
      if (!animationFrameId) {
        soundManager.playBackground();
        animate();
      }
    });

    // Add click event to pause exit button
    pauseExitButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to exit?")) {
        gameStarted = false;
        gamePaused = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        startScreen.classList.remove("hidden");
        pauseScreen.classList.add("hidden");
        pauseButton.querySelector(".button-text").textContent = "PAUSE";
        soundManager.stopBackground();
        resetGameState();
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

    // Create platforms with procedural generation
    const platformImage = await loadImage("./img/platform.png");
    const flagImage = await loadImage("./img/flag.png"); // Add flag image
    finishFlag = new GenericObject({
      x: 4150, // Position at the end of the level
      y: 450, // Position above the final platform
      image: flagImage,
      scale: 8,
      width: 60, // Frame width
      height: 60, // Frame height
      isFlag: true, // Enable flag animation
      parallaxFactor: 0.5, // Slower parallax for background
    });
    genericObjects.push(finishFlag);

    // Procedural platform generation parameters
    const numPlatforms = 24;
    const startX = -200;
    const startY = 470;
    const minHorizontalGap = 150;
    const maxHorizontalGap = 300;
    const minVerticalGap = -80; // negative = can go up
    const maxVerticalGap = 60;  // positive = can go down
    const minY = 200;
    const maxY = 470;
    const baseScale = 2;
    const smallScale = 1;
    const largeScale = 3;
    const platformWidth = platformImage.width * baseScale;

    platforms = [];
    let prevX = startX;
    let prevY = startY;
    let prevScale = baseScale;
    for (let i = 0; i < numPlatforms; i++) {
      // Special cases for start, end, and certain indices
      let scale = baseScale;
      if (i === 0) {
        // Left wall
        platforms.push(new Platform({
          x: startX,
          y: startY,
          image: platformImage,
          scale: baseScale,
        }));
        prevX = startX;
        prevY = startY;
        prevScale = baseScale;
        continue;
      }
      if (i === 1) {
        // Starting safe ground
        platforms.push(new Platform({
          x: -1,
          y: startY,
          image: platformImage,
          scale: baseScale,
        }));
        prevX = -1;
        prevY = startY;
        prevScale = baseScale;
        continue;
      }
      // Randomize scale for variety
      if (i % 7 === 0) scale = largeScale;
      else if (i % 5 === 0) scale = smallScale;

      // Randomize horizontal and vertical gaps
      let gapX = Math.floor(
        Math.random() * (maxHorizontalGap - minHorizontalGap + 1)
      ) + minHorizontalGap;
      let gapY = Math.floor(
        Math.random() * (maxVerticalGap - minVerticalGap + 1)
      ) + minVerticalGap;

      // For 'mountainous' regions, bias gapY to go up or down for a few platforms
      if (i > 5 && i < 10) gapY = Math.abs(gapY); // go up
      if (i > 10 && i < 15) gapY = -Math.abs(gapY); // go down

      // Calculate new position
      let x = prevX + platformWidth + gapX;
      let y = Math.max(minY, Math.min(prevY + gapY, maxY));

      // Prevent vertical overlap/stacking: ensure y differs enough from previous
      if (Math.abs(y - prevY) < 40) {
        y = prevY + (gapY > 0 ? 40 : -40);
        y = Math.max(minY, Math.min(y, maxY));
      }

      // Add platform
      platforms.push(
        new Platform({
          x,
          y,
          image: platformImage,
          scale,
        })
      );
      prevX = x;
      prevY = y;
      prevScale = scale;
    }

    // Add a final wide platform for the goal
    platforms.push(
      new Platform({
        x: 4150,
        y: 400,
        image: platformImage,
        scale: largeScale,
      })
    );

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

    // Create enemies with initial x positions, will align to platforms below
    const enemyXPositions = [900, 1300, 1700, 2300];
    enemies = enemyXPositions.map((x, idx) => {
      return new Enemies({
        x: x,
        y: 0, // Temporary, will be set after platform alignment
        canvas,
        moveDistance: 100,
        scale: 2,
        width: 44,
        height: 26,
      });
    });

    // Align each enemy to the top of the nearest platform beneath their x position
    function alignEnemiesToPlatforms(enemies, platforms) {
      enemies.forEach((enemy) => {
        // Find the platform directly under the enemy's x
        let closestPlatform = null;
        let minDist = Infinity;
        platforms.forEach((platform) => {
          const px = platform.position.x;
          const pw = platform.width;
          // Enemy must be horizontally on the platform
          if (enemy.position.x >= px && enemy.position.x <= px + pw) {
            // Prefer the highest platform (lowest y)
            if (!closestPlatform || platform.position.y < closestPlatform.position.y) {
              closestPlatform = platform;
            }
          }
        });
        if (closestPlatform) {
          // Place enemy so feet are on platform
          enemy.position.y = closestPlatform.position.y - enemy.height * enemy.scale;
          enemy.initialY = enemy.position.y;
        } else {
          // If no platform below, place offscreen (fail-safe)
          enemy.position.y = 10000;
          enemy.initialY = 10000;
        }
      });
    }

    alignEnemiesToPlatforms(enemies, platforms);

    // Load enemy images and wait for them to be ready
    await Promise.all(
      enemies.map(async (enemy) => {
        await enemy.loadImage();
        // Set initial sprite
        enemy.currentSprite = enemy.sprites.idle1;
        enemy.velocity.y = 0;
      })
    );

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
      soundManager.play("death");
      return result;
    };

    // Add sound effects to player movement
    const originalJump = player.jump;
    player.jump = function () {
      originalJump.call(this);
      soundManager.play("jump");
    };

    // Add landing sound
    const originalUpdate = player.update;
    player.update = function (platforms, enemies) {
      const wasInAir = !this.isOnGround;
      originalUpdate.call(this, platforms, enemies);
      if (wasInAir && this.isOnGround) {
        soundManager.play("land");
      }

      // --- Player fall-off mechanic ---
      const fallThreshold = canvas.height + 100;
      if (this.position.y > fallThreshold && !gameOver && gameStarted) {
        // Subtract a life and reset position
        const lost = this.takeDamage();
        updateLivesDisplay();
        soundManager.play("death");
        // Reset to spawn
        this.position.x = 100;
        this.position.y = 100;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.isOnGround = false;
        // Optionally, add a short delay or animation here if desired
        if (lost) {
          // If lives reach zero, trigger game over
          const event = new CustomEvent("gameOver");
          window.dispatchEvent(event);
        }
      }
      // --- End fall-off mechanic ---
    };

    // Initialize game state
    gameStarted = false;
    gamePaused = false;
    gameOver = false;
    player.lives = 3;
    updateLivesDisplay();
    resetGameState();

    // Create collectible items with different types and values
    const blueCoinImage = await loadImage("./img/spr_coin_azu.png");
    const silverCoinImage = await loadImage("./img/spr_coin_gri.png");
    const goldCoinImage = await loadImage("./img/spr_coin_ama.png");
    const redCoinImage = await loadImage("./img/spr_coin_roj.png");

    // Animation properties for collectibles
    const collectibleAnimation = {
      floatHeight: 10, // How high the coin floats
      floatSpeed: 0.02, // Speed of floating animation
      framesMax: 4, // Number of frames in spritesheet
      framesHold: 5, // How long to hold each frame
    };

    collectibles = [
      // Blue coins (500 points)
      new GenericObject({
        x: 700,
        y: 400,
        image: blueCoinImage,
        scale: 1,
        isCollectible: true,
        type: "blue",
        value: 500,
        // Spritesheet animation properties
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        // Floating animation properties
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2, // Random start time for varied animation
        initialY: 400,
      }),
      new GenericObject({
        x: 1100,
        y: 350,
        image: blueCoinImage,
        scale: 1,
        isCollectible: true,
        type: "blue",
        value: 500,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 350,
      }),
      // Silver coins (1000 points)
      new GenericObject({
        x: 1500,
        y: 300,
        image: silverCoinImage,
        scale: 1,
        isCollectible: true,
        type: "silver",
        value: 1000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 300,
      }),
      new GenericObject({
        x: 1900,
        y: 250,
        image: silverCoinImage,
        scale: 1,
        isCollectible: true,
        type: "silver",
        value: 1000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 280,
      }),
      // Gold coins (2000 points)
      new GenericObject({
        x: 2300,
        y: 100,
        image: goldCoinImage,
        scale: 1,
        isCollectible: true,
        type: "gold",
        value: 2000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 320,
      }),
      new GenericObject({
        x: 2600,
        y: 170,
        image: goldCoinImage,
        scale: 1,
        isCollectible: true,
        type: "gold",
        value: 2000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 350,
      }),
      // Red coins (5000 points)
      new GenericObject({
        x: 2950,
        y: 200,
        image: redCoinImage,
        scale: 1,
        isCollectible: true,
        type: "red",
        value: 5000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 400,
      }),
      new GenericObject({
        x: 3350,
        y: 400,
        image: redCoinImage,
        scale: 1,
        isCollectible: true,
        type: "red",
        value: 5000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 420,
      }),
      new GenericObject({
        x: 3750,
        y: 380,
        image: redCoinImage,
        scale: 1,
        isCollectible: true,
        type: "red",
        value: 5000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 380,
      }),
      new GenericObject({
        x: 4100,
        y: 250,
        image: redCoinImage,
        scale: 1,
        isCollectible: true,
        type: "red",
        value: 5000,
        frames: 0,
        framesElapsed: 0,
        framesHold: collectibleAnimation.framesHold,
        framesMax: collectibleAnimation.framesMax,
        width: 16,
        height: 16,
        currentCropWidth: 16,
        floatHeight: collectibleAnimation.floatHeight,
        floatSpeed: collectibleAnimation.floatSpeed,
        floatTime: Math.random() * Math.PI * 2,
        initialY: 250,
      }),
    ];

    // Add collectibles to generic objects
    genericObjects.push(...collectibles);

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

  // Update timer display
  updateTimerDisplay();

  // Update camera position to follow player
  camera.x = player.position.x - CANVAS_WIDTH / 2;
  camera.y = player.position.y - CANVAS_HEIGHT / 2;

  // Keep camera within level bounds
  const maxCameraX = 4350 - CANVAS_WIDTH;
  camera.x = Math.max(0, Math.min(camera.x, maxCameraX));
  camera.y = Math.max(0, Math.min(camera.y, 470 - CANVAS_HEIGHT));

  // Prevent player from going off-screen
  player.position.x = Math.max(0, Math.min(player.position.x, 4350));

  // Draw and update all game objects with camera offset
  genericObjects.forEach((object) => {
    if (!object.isCollectible || !object.collected) {
      object.draw(ctx, camera.x, camera.y);
    }
  });

  platforms.forEach((platform) => {
    platform.draw(ctx, camera.x, camera.y);
  });

  enemies.forEach((enemy) => {
    // Update enemy movement
    if (
      enemy.position.x <= enemy.platformStart ||
      enemy.position.x >= enemy.platformEnd
    ) {
      enemy.velocity.x *= -1;
      enemy.direction = enemy.velocity.x > 0 ? "right" : "left";
      // Ensure enemy stays within platform bounds
      enemy.position.x = Math.max(
        enemy.platformStart,
        Math.min(enemy.position.x, enemy.platformEnd)
      );
    }

    // Update enemy position and check platform collision
    enemy.update(platforms);

    // Ensure enemy stays on platform
    const enemyBottom = enemy.position.y + enemy.height * enemy.scale;
    const platformY =
      platforms.find(
        (p) =>
          enemy.position.x >= p.position.x &&
          enemy.position.x <= p.position.x + p.width * p.scale
      )?.position.y || enemy.position.y;

    if (enemyBottom > platformY) {
      enemy.position.y = platformY - enemy.height * enemy.scale;
      enemy.velocity.y = 0;
    }

    // Draw enemy with proper dimensions
    if (enemy.currentSprite) {
      ctx.drawImage(
        enemy.currentSprite,
        enemy.frames * enemy.width, // Source X: current frame * frame width
        0, // Source Y: always 0
        enemy.width, // Source width: single frame width
        enemy.height, // Source height: frame height
        enemy.position.x - camera.x,
        enemy.position.y - camera.y,
        enemy.width * enemy.scale,
        enemy.height * enemy.scale
      );
    }
  });

  player.draw(ctx, camera.x, camera.y);
  player.update(platforms, enemies);

  // Check for collectibles
  checkCollectibles();

  // Check for level completion
  checkLevelCompletion();
}

// Initialize the game
init();
