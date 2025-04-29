// Constants and utility functions
export const gravity = 0.5;

// Canvas dimensions
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 576;

// Load image helper function
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

// Sprite loading helper
export async function loadSprites() {
  try {
    const [idleBunny, idleBunny2, runBunny, runBunny2, hitBunny, hitBunny2] =
      await Promise.all([
        loadImage("./img/IdleRight(34x44).png"),
        loadImage("./img/Idle (34x44).png"),
        loadImage("./img/RunRight(34x44).png"),
        loadImage("./img/Run (34x44).png"),
        loadImage("./img/Hit (34x44).png"),
        loadImage("./img/Hit2(34x44).png"),
      ]);

    return {
      idleBunny,
      idleBunny2,
      runBunny,
      runBunny2,
      hitBunny,
      hitBunny2,
    };
  } catch (error) {
    console.error("Error loading sprites:", error);
    throw error;
  }
}
