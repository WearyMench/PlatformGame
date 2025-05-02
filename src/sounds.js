export class SoundManager {
  constructor() {
    this.sounds = {
      jump: new Audio("./sounds/jump.wav"),
      land: new Audio("./sounds/land.wav"),
      death: new Audio("./sounds/death.wav"),
      background: new Audio("./sounds/background.ogg"),
      collect: new Audio("./sounds/collect.wav"),
    };

    // Configure background music
    this.sounds.background.loop = true;
    this.sounds.background.volume = 0.3;

    // Configure sound effects volume
    this.sounds.jump.volume = 0.4;
    this.sounds.land.volume = 0.4;
    this.sounds.death.volume = 0.5;
    this.sounds.collect.volume = 0.4;

    // Load all sounds
    this.loadSounds();
  }

  async loadSounds() {
    try {
      // Load all sound files
      await Promise.all(
        Object.values(this.sounds).map((sound) => {
          return new Promise((resolve, reject) => {
            sound.addEventListener("canplaythrough", resolve, { once: true });
            sound.addEventListener("error", reject);
            sound.load();
          });
        })
      );
      console.log("All sounds loaded successfully");
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  }

  play(soundName) {
    if (this.sounds[soundName]) {
      // Clone the audio to allow overlapping sounds
      const sound = this.sounds[soundName].cloneNode();
      // Copy the volume from the original sound
      sound.volume = this.sounds[soundName].volume;
      sound.play().catch((error) => {
        console.error(`Error playing ${soundName}:`, error);
      });
    }
  }

  playBackground() {
    this.sounds.background.play().catch((error) => {
      console.error("Error playing background music:", error);
    });
  }

  stopBackground() {
    this.sounds.background.pause();
    this.sounds.background.currentTime = 0;
  }

  setVolume(soundName, volume) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].volume = Math.max(0, Math.min(1, volume));
    }
  }

  setAllVolumes(volume) {
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }

  setSFXVolume(volume) {
    // Set volume for all sound effects except background music
    this.sounds.jump.volume = Math.max(0, Math.min(1, volume));
    this.sounds.land.volume = Math.max(0, Math.min(1, volume));
    this.sounds.death.volume = Math.max(0, Math.min(1, volume));
    this.sounds.collect.volume = Math.max(0, Math.min(1, volume));
  }

  mute() {
    this.setAllVolumes(0);
  }

  unmute() {
    // Restore default volumes
    this.sounds.background.volume = 0.3;
    this.sounds.jump.volume = 0.4;
    this.sounds.land.volume = 0.4;
    this.sounds.death.volume = 0.5;
    this.sounds.collect.volume = 0.4;
  }
}
