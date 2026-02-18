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

  const loadSound = useCallback((soundId) => {
    if (howlsRef.current[soundId]) return howlsRef.current[soundId];

    // Dynamic import of Howler since it needs the browser
    const { Howl } = require('howler');
    const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
    if (!sound) return null;

    const howl = new Howl({
      src: [sound.file],
      loop: true,
      volume: (volumes[soundId] || 0.5) * masterVolume,
      html5: true,
    });

    howlsRef.current[soundId] = howl;
    return howl;
  }, [volumes, masterVolume]);

  const toggleSound = useCallback((soundId) => {
    setActiveSounds((prev) => {
      const next = { ...prev };
      if (next[soundId]) {
        // Stop sound
        if (howlsRef.current[soundId]) {
          howlsRef.current[soundId].fade(howlsRef.current[soundId].volume(), 0, 500);
          setTimeout(() => {
            howlsRef.current[soundId]?.stop();
          }, 500);
        }
        delete next[soundId];
      } else {
        // Start sound
        const howl = loadSound(soundId);
        if (howl) {
          howl.volume(0);
          howl.play();
          howl.fade(0, (volumes[soundId] || 0.5) * masterVolume, 500);
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
        howlsRef.current[soundId].pause();
      }
    });
    setIsPaused(true);
  }, [activeSounds]);

  const resumeAll = useCallback(() => {
    Object.keys(activeSounds).forEach((soundId) => {
      if (howlsRef.current[soundId]) {
        howlsRef.current[soundId].play();
      }
    });
    setIsPaused(false);
  }, [activeSounds]);

  const stopAll = useCallback(() => {
    Object.keys(howlsRef.current).forEach((soundId) => {
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
