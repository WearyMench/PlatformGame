// Platform and GenericObject classes
export class Platform {
  constructor({ x, y, image, scale }) {
    this.position = {
      x,
      y,
    };
    this.initialX = x;
    this.initialY = y;
    this.image = image;
    this.width = image.width * scale;
    this.height = image.height * scale;
  }

  draw(ctx, cameraX, cameraY) {
    ctx.drawImage(
      this.image,
      this.position.x - cameraX,
      this.position.y - cameraY,
      this.width,
      this.height
    );
  }
}

export class GenericObject {
  constructor({
    x,
    y,
    image,
    scale = 1,
    parallaxFactor = 1,
    isCollectible = false,
    width,
    height,
    isFlag = false,
  }) {
    this.position = {
      x,
      y,
    };
    this.initialX = x;
    this.initialY = y;
    this.image = image;
    this.width = width || image.width * scale;
    this.height = height || image.height * scale;
    this.scale = scale;
    this.parallaxFactor = parallaxFactor;
    this.isCollectible = isCollectible;
    this.isFlag = isFlag;

    // Animation properties
    this.frames = 0;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.framesMax = isFlag ? 5 : 4; // 5 frames for flag, 4 for collectibles
    this.currentCropWidth = isFlag ? 60 : 16; // 60px per frame for flag

    // Floating animation properties
    this.floatHeight = 10;
    this.floatSpeed = 0.02;
    this.floatTime = Math.random() * Math.PI * 2;
  }

  draw(ctx, cameraX, cameraY = 0) {
    if (this.isCollectible) {
      // Update spritesheet animation
      this.framesElapsed++;
      if (this.framesElapsed % this.framesHold === 0) {
        if (this.frames < this.framesMax - 1) {
          this.frames++;
        } else {
          this.frames = 0;
        }
      }

      // Update floating animation
      this.floatTime += this.floatSpeed;
      const floatOffset = Math.sin(this.floatTime) * this.floatHeight;
      const currentY = this.initialY + floatOffset;

      // Draw the collectible with spritesheet animation
      ctx.drawImage(
        this.image,
        this.currentCropWidth * this.frames,
        0,
        this.currentCropWidth,
        this.height,
        this.position.x - cameraX,
        currentY - cameraY,
        this.width,
        this.height
      );
    } else if (this.isFlag) {
      // Update flag animation
      this.framesElapsed++;
      if (this.framesElapsed % this.framesHold === 0) {
        if (this.frames < this.framesMax - 1) {
          this.frames++;
        } else {
          this.frames = 0;
        }
      }

      // Draw the flag with spritesheet animation
      ctx.drawImage(
        this.image,
        this.currentCropWidth * this.frames, // Source X: current frame * frame width
        0, // Source Y: always 0
        this.currentCropWidth, // Source width: single frame width
        this.height, // Source height: frame height
        this.position.x - cameraX * this.parallaxFactor,
        this.position.y - cameraY,
        this.width,
        this.height
      );
    } else {
      // Draw the object with proper camera offset
      ctx.drawImage(
        this.image,
        0,
        0,
        this.image.width,
        this.image.height,
        this.position.x - cameraX * this.parallaxFactor,
        this.position.y - cameraY,
        this.width,
        this.height
      );
    }
  }
}
