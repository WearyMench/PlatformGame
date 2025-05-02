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
      x: 2,
      y: 0,
    };
    this.width = 44; // Single frame width
    this.height = 26; // Frame height
    this.frames = 0;
    this.sprites = {
      idle1: null, // Enemy with pikes
      idle2: null, // Enemy without pikes
      hit: null, // Hit sprite
    };
    this.currentSprite = null;
    this.currentSpriteType = "idle1"; // Track which sprite sheet we're using
    this.framesMax = 14; // Number of frames in spritesheet
    this.hitFramesMax = 5; // Number of frames in hit animation
    this.scale = 2;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.moving = true;
    this.direction = "right";
    this.moveDistance = 150;
    this.startX = x;
    this.isHit = false;
    this.hitTimer = 0;
    this.hitDuration = 25; // Duration of hit animation (5 frames * 5 framesHold)
    this.isDead = false;
  }

  async loadImage() {
    try {
      const [idle1, idle2, hit] = await Promise.all([
        loadImage("./img/Idle 1 (44x26).png"),
        loadImage("./img/Idle 2 (44x26).png"),
        loadImage("./img/Hit (44x26).png"),
      ]);

      this.sprites.idle1 = idle1;
      this.sprites.idle2 = idle2;
      this.sprites.hit = hit;
      this.currentSprite = this.sprites.idle1;
    } catch (error) {
      console.error("Error loading enemy images:", error);
    }
  }

  draw(ctx, cameraX, cameraY) {
    if (!this.currentSprite || this.isDead) return;

    // Draw the current frame from the spritesheet
    ctx.drawImage(
      this.currentSprite,
      this.frames * this.width, // Source X: current frame * frame width
      0, // Source Y: always 0
      this.width, // Source width: single frame width
      this.height, // Source height: frame height
      this.position.x - cameraX,
      this.position.y - cameraY,
      this.width * this.scale, // Destination width: scaled frame width
      this.height * this.scale // Destination height: scaled frame height
    );
  }

  takeHit() {
    if (this.isHit || this.isDead) return false;

    this.isHit = true;
    this.hitTimer = this.hitDuration;
    this.currentSprite = this.sprites.hit;
    this.frames = 0;
    this.velocity.y = 0; // Reset vertical velocity when hit
    this.velocity.x = 0; // Stop horizontal movement when hit
    return true;
  }

  update(platforms) {
    if (!this.canvas || this.isDead) return;

    // Handle hit state
    if (this.isHit) {
      this.hitTimer--;
      this.framesElapsed++;

      // Update hit animation frames
      if (this.framesElapsed % this.framesHold === 0) {
        if (this.frames < this.hitFramesMax - 1) {
          this.frames++;
        }
      }

      if (this.hitTimer <= 0) {
        this.isDead = true; // Mark enemy as dead after hit animation completes
      }
      return; // Don't update movement or animation while hit
    }

    // Update animation frames
    this.framesElapsed++;
    if (this.framesElapsed % this.framesHold === 0) {
      if (this.frames < this.framesMax - 1) {
        this.frames++;
      } else {
        this.frames = 0;
        // Switch sprite sheets when we complete one cycle
        this.currentSpriteType =
          this.currentSpriteType === "idle1" ? "idle2" : "idle1";
        this.currentSprite = this.sprites[this.currentSpriteType];
      }
    }

    // Find the platform the enemy is on
    const currentPlatform = platforms.find(
      (platform) =>
        this.position.x + this.width * this.scale >= platform.position.x &&
        this.position.x <= platform.position.x + platform.width
    );

    // If enemy is on a platform
    if (currentPlatform) {
      // Keep enemy on platform
      this.position.y = currentPlatform.position.y - this.height * this.scale;
      this.velocity.y = 0;

      // Handle horizontal movement
      if (Math.abs(this.position.x - this.startX) > this.moveDistance) {
        this.velocity.x *= -1;
        this.direction = this.velocity.x > 0 ? "right" : "left";
      }
      this.position.x += this.velocity.x;
    } else {
      // If not on platform, apply gravity
      this.velocity.y += gravity;
      this.position.y += this.velocity.y;
    }
  }

  hasPikes() {
    return this.currentSpriteType === "idle1";
  }
}
