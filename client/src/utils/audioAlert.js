// Web Audio API Emergency SOS Siren Synthesizer
let audioCtx = null;

export const playSOSTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Play 3 loud emergency alert beeps
    const now = audioCtx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      
      // Siren tone modulation: alternate between 880Hz and 660Hz
      const startTime = now + i * 0.4;
      const duration = 0.3;

      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.exponentialRampToValueAtTime(660, startTime + duration);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  } catch (err) {
    console.error('Audio synthesis error:', err);
  }
};
