/**
 * HAremos un juego de plataforma basado en mario, donde:
 * 1.Habra un player _/
 * 2.gravedad _/
 * 3.player movement
 * 4.platforms
 * 5.scroll the background.
 * 6. win scenario
 * 7. image platforms
 * 8.parallax scroll
 * 9. death pits
 * 10. level creation
 * 11. fine-tuning
 */

const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

const idleBunny = new Image();
idleBunny.src = "IdleRight(34x44).png";
const idleBunny2 = new Image();
idleBunny2.src = "Idle (34x44).png";
const runBunny = new Image();
runBunny.src = "RunRight(34x44).png";
const runBunny2 = new Image();
runBunny2.src = "Run (34x44).png";

const gravity = 0.5;
class Player {
  constructor() {
    this.speed = 5;
    this.position = {
      x: 100,
      y: 100,
    };
    this.velocity = {
      x: 0,
      y: 1,
    };
    this.width = 68;
    this.height = 88;
    this.frames = 0;
    this.sprites = {
      stand: {
        right: idleBunny,
        left: idleBunny2,
      },
      run: {
        right: runBunny,
        left: runBunny2,
      },
    };
    this.currentSprite = this.sprites.stand.right;
  }
  draw() {
    ctx.drawImage(
      this.currentSprite,
      34 * Math.floor(this.frames / 3),
      0,
      34,
      44,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
  update() {
    this.frames++;
    if (this.frames > 8 && this.currentSprite === this.sprites.stand.right)
      this.frames = 0;
    else if (this.frames > 8 && this.currentSprite === this.sprites.stand.left)
      this.frames = 0;
    else if (this.frames > 12 && this.currentSprite === this.sprites.run.right)
      this.frames = 0;
    else if (this.frames > 12 && this.currentSprite === this.sprites.run.left)
      this.frames = 0;
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y <= canvas.height)
      this.velocity.y += gravity;
  }
}

let scrollOffset = 0;

class Platform {
  constructor({ x, y, image }) {
    this.position = {
      x,
      y,
    };
    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }
  draw() {
    ctx.drawImage(this.image, this.position.x, this.position.y);
  }
}
class GenericObject {
  constructor({ x, y, image }) {
    this.position = {
      x,
      y,
    };
    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }
  draw() {
    ctx.drawImage(this.image, this.position.x, this.position.y);
  }
}

const platformImage = new Image();
platformImage.src = "platform.png";
const backImage = new Image();
backImage.src = "background.png";
// const hillImage = new Image();
// hillImage.src = "hills.png";
const smallPlatImage = new Image();
smallPlatImage.src = "platformSmallTall.png";

let player = new Player();
let platforms = [];
let genericObjects = [];
let lastKey;

function init() {
  scrollOffset = 0;
  player = new Player();
  platforms = [
    new Platform({
      x: platformImage.width * 6 - 104,
      y: 370,
      image: smallPlatImage,
    }),
    new Platform({
      x: platformImage.width * 8,
      y: 370,
      image: smallPlatImage,
    }),
    new Platform({
      x: -1,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width - 3,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 3 - 300,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 4 - 100,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 5 - 102,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 7,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 9,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 10,
      y: 470,
      image: platformImage,
    }),
  ];
  genericObjects = [
    new GenericObject({
      x: -1,
      y: -1,
      image: backImage,
    }),
  ];
}

const keys = {
  right: {
    pressed: false,
  },
  left: {
    pressed: false,
  },
};

function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  genericObjects.forEach((genericObject) => {
    genericObject.draw();
  });

  platforms.forEach((platform) => {
    platform.draw();
  });
  player.update();

  if (keys.right.pressed && player.position.x < 400) {
    player.velocity.x = player.speed;
  } else if (
    (keys.left.pressed && player.position.x > 100) ||
    (keys.left.pressed && scrollOffset === 0 && player.position.x > 0)
  ) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;

    if (keys.right.pressed) {
      scrollOffset += player.speed;
      platforms.forEach((platform) => {
        platform.position.x -= player.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x -= player.speed * 0.66;
      });
    } else if (keys.left.pressed && scrollOffset > 0) {
      scrollOffset -= player.speed;
      platforms.forEach((platform) => {
        platform.position.x += player.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x += player.speed * 0.66;
      });
    }
  }

  platforms.forEach((platform) => {
    if (
      player.position.y + player.height <= platform.position.y &&
      player.position.y + player.height + player.velocity.y >=
        platform.position.y &&
      player.position.x + player.width >= platform.position.x &&
      player.position.x <= platform.position.x + platform.width
    ) {
      player.velocity.y = 0;
    }
  });

  //Sprite Switching
  if (
    keys.right.pressed &&
    lastKey === "right" &&
    player.currentSprite !== player.sprites.run.right
  ) {
    player.frames = 1;
    player.currentSprite = player.sprites.run.right;
  } else if (
    keys.left.pressed &&
    lastKey === "left" &&
    player.currentSprite !== player.sprites.run.left
  ) {
    player.currentSprite = player.sprites.run.left;
  } else if (
    !keys.left.pressed &&
    lastKey === "left" &&
    player.currentSprite !== player.sprites.stand.left
  ) {
    player.currentSprite = player.sprites.stand.left;
  } else if (
    !keys.right.pressed &&
    lastKey === "right" &&
    player.currentSprite !== player.sprites.stand.right
  ) {
    player.currentSprite = player.sprites.stand.right;
  }

  //win condition
  if (scrollOffset > platformImage.width * 9) {
    console.log("you win!!!");
  }

  //lose condition
  if (player.position.y > canvas.height) {
    console.log("you lose!");
    init();
  }
}

init();
animate();

addEventListener("keydown", (e) => {
  switch (e.key) {
    case "d":
      keys.right.pressed = true;
      lastKey = "right";
      break;
    case "a":
      keys.left.pressed = true;
      lastKey = "left";
      break;
    // case "s":
    //   if (player.position.y + player.height <= platform.position.y) {
    //     // Solo aplica la velocidad hacia abajo si el personaje no está encima de la plataforma
    //     player.velocity.y += 15;
    //   }
    //   break;
    case "w":
      player.velocity.y -= 15;
      break;

    default:
      break;
  }
});
addEventListener("keyup", (e) => {
  switch (e.key) {
    case "d":
      keys.right.pressed = false;
      player.currentSprite = player.sprites.stand.right;
      break;
    case "a":
      keys.left.pressed = false;
      player.currentSprite = player.sprites.stand.left;
      break;
    // case "s":
    //   player.velocity.y === 0;
    //   break;
    // case "w":
    //   player.currentSprite = player.sprites.stand.right;
    //   break;

    default:
      break;
  }
});
