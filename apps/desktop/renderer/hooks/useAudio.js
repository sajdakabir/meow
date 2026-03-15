'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: '🌧', file: '/sounds/rain.wav' },
  { id: 'forest', name: 'Forest', icon: '🌲', file: '/sounds/forest.wav' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', file: '/sounds/ocean.wav' },
  { id: 'fire', name: 'Fireplace', icon: '🔥', file: '/sounds/fire.wav' },
  { id: 'cafe', name: 'Cafe', icon: '☕', file: '/sounds/cafe.wav' },
  { id: 'wind', name: 'Wind', icon: '💨', file: '/sounds/wind.wav' },
  { id: 'birds', name: 'Birds', icon: '🐦', file: '/sounds/birds.wav' },
  { id: 'thunder', name: 'Thunder', icon: '⛈', file: '/sounds/thunder.wav' },
];

export function useAudio() {
  const [activeSounds, setActiveSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isPaused, setIsPaused] = useState(false);
  const howlsRef = useRef({});

  const loadSound = useCallback((soundId, vol, master) => {
    if (howlsRef.current[soundId]) return howlsRef.current[soundId];

    const { Howl } = require('howler');
    const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
    if (!sound) return null;

    const howl = new Howl({
      src: [sound.file],
      loop: true,
      volume: (vol || 0.5) * master,
      html5: true,
      preload: true,
    });

    // html5 audio can fail to loop — force restart on end
    howl.on('end', () => {
      if (howlsRef.current[soundId]) {
        howl.play();
      }
    });

    // If audio pauses unexpectedly (browser throttling), resume it
    howl.on('pause', () => {
      if (howlsRef.current[soundId] && !howl._manualPause) {
        setTimeout(() => {
          if (howlsRef.current[soundId] && !howl._manualPause) {
            howl.play();
          }
        }, 100);
      }
    });

    howlsRef.current[soundId] = howl;
    return howl;
  }, []);

  const toggleSound = useCallback((soundId) => {
    setActiveSounds((prev) => {
      const next = { ...prev };
      if (next[soundId]) {
        if (howlsRef.current[soundId]) {
          const h = howlsRef.current[soundId];
          h._manualPause = true;
          h.fade(h.volume(), 0, 500);
          setTimeout(() => {
            h.stop();
            h.unload();
            delete howlsRef.current[soundId];
          }, 500);
        }
        delete next[soundId];
      } else {
        const vol = volumes[soundId] || 0.5;
        const howl = loadSound(soundId, vol, masterVolume);
        if (howl) {
          howl._manualPause = false;
          howl.volume(0);
          howl.play();
          howl.fade(0, vol * masterVolume, 500);
          next[soundId] = true;
        }
      }
      return next;
    });
  }, [loadSound, volumes, masterVolume]);

  const setSoundVolume = useCallback((soundId, volume) => {
    setVolumes((prev) => ({ ...prev, [soundId]: volume }));
    if (howlsRef.current[soundId]) {
      howlsRef.current[soundId].volume(volume * masterVolume);
    }
  }, [masterVolume]);

  const updateMasterVolume = useCallback((vol) => {
    setMasterVolume(vol);
    Object.entries(volumes).forEach(([soundId, soundVol]) => {
      if (howlsRef.current[soundId] && activeSounds[soundId]) {
        howlsRef.current[soundId].volume(soundVol * vol);
      }
    });
  }, [volumes, activeSounds]);

  const pauseAll = useCallback(() => {
    Object.keys(activeSounds).forEach((soundId) => {
      if (howlsRef.current[soundId]) {
        howlsRef.current[soundId]._manualPause = true;
        howlsRef.current[soundId].pause();
      }
    });
    setIsPaused(true);
  }, [activeSounds]);

  const resumeAll = useCallback(() => {
    Object.keys(activeSounds).forEach((soundId) => {
      if (howlsRef.current[soundId]) {
        howlsRef.current[soundId]._manualPause = false;
        howlsRef.current[soundId].play();
      }
    });
    setIsPaused(false);
  }, [activeSounds]);

  const stopAll = useCallback(() => {
    Object.keys(howlsRef.current).forEach((soundId) => {
      howlsRef.current[soundId]._manualPause = true;
      howlsRef.current[soundId]?.stop();
      howlsRef.current[soundId]?.unload();
    });
    howlsRef.current = {};
    setActiveSounds({});
    setIsPaused(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(howlsRef.current).forEach((howl) => {
        howl._manualPause = true;
        howl?.stop();
        howl?.unload();
      });
    };
  }, []);

  return {
    sounds: AMBIENT_SOUNDS,
    activeSounds,
    volumes,
    masterVolume,
    isPaused,
    toggleSound,
    setSoundVolume,
    setMasterVolume: updateMasterVolume,
    pauseAll,
    resumeAll,
    stopAll,
  };
}
