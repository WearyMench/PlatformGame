// Enemies class and related code
import { gravity, loadImage } from "./utils.js";

export class Enemies {
  constructor({ x, y, canvas }) {
    if (!canvas) {
      console.error("Canvas reference is required for Enemies class");
      return;
    }

    this.position = {
      x,
      y,
    };
    this.initialX = x;
    this.initialY = y;
    this.canvas = canvas;
    this.velocity = {
      x: 2, // Movement speed
      y: 0,
    };
    this.width = 44;
    this.height = 26;
    this.frames = 0;
    this.sprites = {
      idle: {
        in: null,
        out: null,
      },
      hit: null,
    };
    this.currentSprite = null;
    this.idleTime = 0;
    this.idleDuration = 140;
    this.framesMax = 2;
    this.scale = 2;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.moving = true;
    this.direction = "right";
    this.moveDistance = 150;
    this.startX = x;
  }

  async loadImage() {
    try {
      // Load both idle sprites
      const [idle1, idle2] = await Promise.all([
        loadImage("./img/Idle 1 (44x26).png"),
        loadImage("./img/Idle 2 (44x26).png"),
      ]);

      this.sprites.idle.in = idle1;
      this.sprites.idle.out = idle2;
      this.currentSprite = this.sprites.idle.in;
      this.image = this.currentSprite;
    } catch (error) {
      console.error("Error loading enemy images:", error);
    }
  }

  draw(ctx, cameraX, cameraY) {
    if (!this.currentSprite) return;

    ctx.drawImage(
      this.currentSprite,
      44 * this.frames, // Frame width
      0,
      44, // Frame width
      26, // Frame height
      this.position.x - cameraX,
      this.position.y - cameraY,
      this.width * this.scale,
      this.height * this.scale
    );
  }

  update(platforms) {
    if (!this.canvas) return;

    // Update animation frames
    this.framesElapsed++;
    if (this.framesElapsed % this.framesHold === 0) {
      if (this.frames < this.framesMax - 1) this.frames++;
      else this.frames = 0;
    }

    // Movement logic
    if (Math.abs(this.position.x - this.startX) > this.moveDistance) {
      this.velocity.x *= -1; // Reverse direction
      this.direction = this.velocity.x > 0 ? "right" : "left";
      this.currentSprite = this.sprites.idle[this.direction];
    }

    // Update position
    this.position.x += this.velocity.x;

    // Platform collision detection
    platforms.forEach((platform) => {
      // Check if enemy is on the platform
      if (
        this.position.y + this.height * this.scale <= platform.position.y &&
        this.position.y + this.height * this.scale + this.velocity.y >=
          platform.position.y &&
        this.position.x + this.width * this.scale >= platform.position.x &&
        this.position.x <= platform.position.x + platform.width
      ) {
        // Keep enemy on platform
        this.position.y = platform.position.y - this.height * this.scale;
        this.velocity.y = 0;
      }
    });

    // Apply gravity if not on platform
    let isOnPlatform = false;
    platforms.forEach((platform) => {
      if (
        this.position.y + this.height * this.scale <= platform.position.y &&
        this.position.y + this.height * this.scale + this.velocity.y >=
          platform.position.y &&
        this.position.x + this.width * this.scale >= platform.position.x &&
        this.position.x <= platform.position.x + platform.width
      ) {
        isOnPlatform = true;
      }
    });

    if (!isOnPlatform) {
      this.velocity.y += gravity;
      this.position.y += this.velocity.y;
    }
  }
}
