// Player class and related code
import { gravity } from "./utils.js";

export class Player {
  constructor({ canvas }) {
    if (!canvas) {
      console.error("Canvas reference is required for Player class");
      return;
    }

    this.canvas = canvas;
    this.speed = 5;
    this.position = {
      x: 100,
      y: 100,
    };
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.width = 34;
    this.height = 44;
    this.frames = 0;
    this.sprites = {
      stand: {
        right: null,
        left: null,
      },
      run: {
        right: null,
        left: null,
      },
      hit: {
        right: null,
        left: null,
      },
    };
    this.currentSprite = this.sprites.stand.right;
    this.currentCropWidth = 34;
    this.framesMax = 4;
    this.scale = 2;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.moving = false;
    this.direction = "right";
    this.hit = false;
    this.isJumping = false;
    this.jumpForce = -15;
    this.isOnGround = false;
    this.lives = 3;
    this.invincible = false;
    this.invincibleTimer = 0;
  }

  draw(ctx, cameraX, cameraY) {
    if (!this.currentSprite) return;

    // Flash effect when invincible
    if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      return;
    }

    ctx.drawImage(
      this.currentSprite,
      this.currentCropWidth * this.frames,
      0,
      this.currentCropWidth,
      this.height,
      this.position.x - cameraX,
      this.position.y - cameraY,
      this.width * this.scale,
      this.height * this.scale
    );
  }

  takeDamage() {
    if (this.invincible) return;

    this.lives--;
    this.hit = true;
    this.invincible = true;
    this.invincibleTimer = 60; // 1 second of invincibility at 60fps
    this.currentSprite = this.sprites.hit[this.direction];

    setTimeout(() => {
      this.hit = false;
      this.currentSprite = this.sprites.stand[this.direction];
    }, 1000);

    return this.lives <= 0;
  }

  jump() {
    if (this.isOnGround && !this.isJumping) {
      this.velocity.y = this.jumpForce;
      this.isJumping = true;
      this.isOnGround = false;
    }
  }

  update(platforms, enemies) {
    if (!this.canvas) return;

    // Update invincibility timer
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    this.framesElapsed++;
    if (this.framesElapsed % this.framesHold === 0) {
      if (this.frames < this.framesMax - 1) this.frames++;
      else this.frames = 0;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Reset ground state before collision check
    this.isOnGround = false;

    // Platform collision detection
    platforms.forEach((platform) => {
      if (
        this.position.y + this.height * this.scale <= platform.position.y &&
        this.position.y + this.height * this.scale + this.velocity.y >=
          platform.position.y &&
        this.position.x + this.width * this.scale >= platform.position.x &&
        this.position.x <= platform.position.x + platform.width
      ) {
        this.velocity.y = 0;
        this.position.y = platform.position.y - this.height * this.scale;
        this.isOnGround = true;
        this.isJumping = false;
      }
    });

    // Apply gravity if not on ground
    if (!this.isOnGround) {
      this.velocity.y += gravity;
    }

    // Enemy collision detection
    enemies.forEach((enemy) => {
      if (
        this.position.x + this.width * this.scale >= enemy.position.x &&
        this.position.x <= enemy.position.x + enemy.width * enemy.scale &&
        this.position.y + this.height * this.scale >= enemy.position.y &&
        this.position.y <= enemy.position.y + enemy.height * enemy.scale
      ) {
        if (enemy.hasPikes()) {
          // If enemy has pikes, player takes damage
          const gameOver = this.takeDamage();
          if (gameOver) {
            // Trigger game over
            const event = new CustomEvent("gameOver");
            window.dispatchEvent(event);
          }
        } else {
          // If enemy doesn't have pikes, enemy takes damage
          enemy.takeHit();
        }
      }
    });

    // Sprite selection based on movement
    if (!this.hit) {
      if (this.moving) {
        this.currentSprite = this.sprites.run[this.direction];
      } else {
        this.currentSprite = this.sprites.stand[this.direction];
      }
    }
  }
}
