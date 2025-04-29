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
  constructor({ x, y, image, scale = 1, parallaxFactor = 1 }) {
    this.position = {
      x,
      y,
    };
    this.initialX = x;
    this.initialY = y;
    this.image = image;
    this.width = image.width * scale;
    this.height = image.height * scale;
    this.scale = scale;
    this.parallaxFactor = parallaxFactor;
  }

  draw(ctx, cameraX) {
    // Draw the background image with parallax effect
    ctx.drawImage(
      this.image,
      this.position.x - cameraX * this.parallaxFactor,
      this.position.y,
      this.width,
      this.height
    );
  }
}
