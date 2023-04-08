/**
 * HAremos un juego de plataforma basado en mario pero de un conejo buscando su zanahoria.
 */

const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

const idleBunny = new Image();
idleBunny.src = "./img/IdleRight(34x44).png";
const idleBunny2 = new Image();
idleBunny2.src = "./img/Idle (34x44).png";
const runBunny = new Image();
runBunny.src = "./img/RunRight(34x44).png";
const runBunny2 = new Image();
runBunny2.src = "./img/Run (34x44).png";
const hitBunny = new Image();
hitBunny.src = "./img/Hit (34x44).png";
const hitBunny2 = new Image();
hitBunny2.src = "./img/Hit2(34x44).png";

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
      hit: {
        right: hitBunny2,
        left: hitBunny,
      },
    };
    this.isHit = false;
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

    if (this.isHit) {
      this.currentSprite = this.sprites.hit.left;
      // if (this.frames > 5) {
      //   this.frames = 0;
      //   this.isHit = false;
      // }
    }

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

const turtleIdleIn = new Image();
turtleIdleIn.src = "./img/Idle 2 (44x26).png";
const turtleIdleOut = new Image();
turtleIdleOut.src = "./img/Idle 1 (44x26).png";
const turtleHit = new Image();
turtleHit.src = "./img/Hit (44x26).png";

class Enemies {
  constructor({ x }) {
    this.position = {
      x,
      y: 300,
    };
    this.velocity = {
      x: 0,
      y: 1,
    };
    this.width = 44;
    this.height = 26;
    this.frames = 0;
    this.sprites = {
      idle: {
        in: turtleIdleIn,
        out: turtleIdleOut,
      },
      hit: turtleHit,
    };
    this.currentSprite = this.sprites.idle.in;
    this.idleTime = 0;
    this.idleDuration = 140; // tiempo en frames para cambiar de idle in a idle out
  }
  draw() {
    ctx.drawImage(
      this.currentSprite,
      44 * Math.floor(this.frames / 5),
      0,
      44,
      26,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
  update() {
    this.frames++;

    if (this.currentSprite === this.sprites.idle.in) {
      this.idleTime++;
      if (this.idleTime > this.idleDuration) {
        this.currentSprite = this.sprites.idle.out;
        this.idleTime = 0;
      }
    } else if (this.currentSprite === this.sprites.idle.out) {
      this.idleTime++;
      if (this.idleTime > this.idleDuration) {
        this.currentSprite = this.sprites.idle.in;
        this.idleTime = 0;
      }
    }

    if (this.frames > 14 && this.currentSprite === this.sprites.idle.in)
      this.frames = 0;
    else if (this.frames > 14 && this.currentSprite === this.sprites.idle.out)
      this.frames = 0;
    else if (this.frames > 5 && this.currentSprite === this.sprites.hit)
      this.frames = 0;
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y <= canvas.height)
      this.velocity.y += gravity;
  }
}

const platformImage = new Image();
platformImage.src = "./img/platform.png";
const backImage = new Image();
backImage.src = "./img/background.png";
const smallPlatImage = new Image();
smallPlatImage.src = "./img/platformSmallTall.png";

let player = new Player();
let platforms = [];
let genericObjects = [];
let enemies = [];
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
  enemies = [
    new Enemies({
      x: platformImage.width * 2 - 100,
    }),
    new Enemies({
      x: platformImage.width * 3 + 150,
    }),
    new Enemies({
      x: platformImage.width * 6,
    }),
    new Enemies({
      x: platformImage.width * 8,
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

  enemies.forEach((enemy) => {
    enemy.update();
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

    if (keys.right.pressed && scrollOffset < platformImage.width * 10 + 100) {
      scrollOffset += player.speed;
      platforms.forEach((platform) => {
        platform.position.x -= player.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x -= player.speed * 0.66;
      });
      enemies.forEach((enemy) => {
        enemy.position.x -= player.speed;
      });
    } else if (keys.left.pressed && scrollOffset > 0) {
      scrollOffset -= player.speed;
      platforms.forEach((platform) => {
        platform.position.x += player.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x += player.speed * 0.66;
      });
      enemies.forEach((enemy) => {
        enemy.position.x += player.speed;
      });
    }
  }

  //Platforms collisions.
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

    enemies.forEach((enemy) => {
      if (
        enemy.position.y + enemy.height <= platform.position.y &&
        enemy.position.y + enemy.height + enemy.velocity.y >=
          platform.position.y &&
        enemy.position.x + enemy.width >= platform.position.x &&
        enemy.position.x <= platform.position.x + platform.width
      ) {
        enemy.velocity.y = 0;
      }
    });
  });

  //Enemy collision

  enemies.forEach((enemy) => {
    if (
      player.position.x + player.width >= enemy.position.x &&
      player.position.x <= enemy.position.x + enemy.width &&
      player.position.y + player.height >= enemy.position.y &&
      enemy.currentSprite === enemy.sprites.idle.in
    ) {
      enemy.currentSprite = enemy.sprites.hit;
      setTimeout(() => {
        let index = enemies.indexOf(enemy);
        enemies.splice(index, 1);
      }, 200);
    } else if (
      player.position.x + player.width >= enemy.position.x &&
      player.position.x <= enemy.position.x + enemy.width &&
      player.position.y + player.height >= enemy.position.y &&
      enemy.currentSprite === enemy.sprites.idle.out
    ) {
      player.isHit = true;
      setTimeout(() => {
        player.position.y += 1;
      }, 200);
    }

    //Enemy movement

    if (scrollOffset > enemy.position.x - platformImage.width) {
      enemy.velocity.x = -1;
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
    case "s":
      break;
    case "w":
      player.velocity.y -= 15;
      // console.log(player.velocity.y);
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
    case "s":
      // player.velocity.y = 0;
      break;
    case "w":
      // player.velocity.y += 4;
      // player.currentSprite = player.sprites.stand.right;
      break;

    default:
      break;
  }
});
