// Web Audio API Synthesizer for Temple Singing Bowls, Bowing Bell, Wooden Fish, and Chimes

class TempleAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.voiceEnabled = true;
    this.ambientTimer = null;
    this._lastSpokenText = '';
    this._preferredVoice = null;
    this._initVoiceSelection();
  }

  _initVoiceSelection() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const refresh = () => { this._preferredVoice = this._pickGentleVoice(); };
    refresh();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', refresh);
    } else {
      window.speechSynthesis.onvoiceschanged = refresh;
    }
  }

  _pickGentleVoice(preferChinese = false) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    if (preferChinese) {
      const zhPool = voices.filter((v) => /^zh(-|_|$)/i.test(v.lang || ''));
      if (zhPool.length) {
        const mainland = zhPool.find((v) => /zh[-_]?cn/i.test(v.lang || '') && !/male/i.test(v.name || ''));
        return mainland || zhPool.find((v) => /zh[-_]?cn/i.test(v.lang || '')) || zhPool[0];
      }
    }

    const enVoices = voices.filter((v) => /^en(-|_|$)/i.test(v.lang || ''));
    const pool = enVoices.length ? enVoices : voices;

    // Exclude stiff/robotic male voices so the storyteller never sounds like a machine man
    const malePattern = /\b(david|mark|george|guy|richard|ryan|sean|ravi|daniel|alex|fred|bruce|ralph|junior|albert)\b/i;
    const nonMalePool = pool.filter((v) => !malePattern.test(v.name || ''));
    if (!nonMalePool.length) return null;

    // Highest-priority gentle & natural female storytelling voices
    const preferredPatterns = [
      /aria.*natural/i,
      /jenny.*natural/i,
      /ava.*natural/i,
      /emma.*natural/i,
      /ana.*natural/i,
      /sonia.*natural/i,
      /libby.*natural/i,
      /aria|jenny|ava|emma|ana|sonia|libby|samantha|victoria|karen|moira|tessa|serena/i,
      /google us english/i,
      /google uk english female/i,
      /zira|hazel|susan|heera/i,
      /natural/i,
      /female/i
    ];

    for (const pat of preferredPatterns) {
      const match = nonMalePool.find((v) => pat.test(v.name || ''));
      if (match) return match;
    }
    return nonMalePool[0] || null;
  }

  // Subtle soft bell note when no gentle voice is available
  playSoftWhisperBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.muted;
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.voiceEnabled;
  }

  // Gentle Voice Narration for Kid-Friendly Talking Windows & 7 Buddhas (Bilingual zh-CN & en-US)
  speakText(text, force = false) {
    if (this.muted || (!this.voiceEnabled && !force)) return;
    if (!window.speechSynthesis || !text) return;
    const clean = text.replace(/[^\w\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef.,!?'"，。！？、：；“”‘’-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    if (!force && this._lastSpokenText === clean) return;
    this._lastSpokenText = clean;
    try {
      window.speechSynthesis.cancel();
      const hasChinese = /[\u4e00-\u9fff]/.test(clean);
      const voice = this._pickGentleVoice(hasChinese) || (!hasChinese ? this._preferredVoice : null);
      if (!hasChinese && voice) {
        this._preferredVoice = voice;
      }
      if (!voice) {
        this.playSoftWhisperBell();
        return;
      }
      const utter = new SpeechSynthesisUtterance(clean);
      utter.voice = voice;
      utter.lang = hasChinese ? (voice.lang || 'zh-CN') : (voice.lang || 'en-US');
      utter.rate = hasChinese ? 0.94 : 0.88; // Warm, gentle storytelling pace
      utter.pitch = 1.05;
      utter.volume = 0.82;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  // Majestic Grand Temple Gate Opening Fanfare (Deep Bronze Bell + Celestial Harp Cascade + Shimmer)
  playGateOpenFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Deep Sacred Temple Bronze Bell Strike (Soft warm resonance)
    const bellPartials = [
      { freq: 130.81, gain: 0.22, decay: 4.8 }, // C3
      { freq: 196.00, gain: 0.14, decay: 4.2 }, // G3
      { freq: 261.63, gain: 0.16, decay: 3.8 }, // C4
      { freq: 329.63, gain: 0.11, decay: 3.4 }, // E4
      { freq: 392.00, gain: 0.09, decay: 3.2 }  // G4
    ];
    bellPartials.forEach((p) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    });

    // 2. Rising Celestial Lotus Harp Cascade (Silky sine partials)
    const harpNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];
    harpNotes.forEach((freq, idx) => {
      const start = now + 0.18 + idx * 0.11;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc2.frequency.setValueAtTime(freq * 1.5, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.095, start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + 2.45);
      osc2.stop(start + 2.45);
    });
  }

  // Calm Tibetan / Temple Singing Bowl Sound Effect for each Bowing
  playBowingBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Singing bowl partials: fundamental + warm silky overtones
    const partials = [
      { freq: 256, gain: 0.19, decay: 3.6 },   // Root C4
      { freq: 512, gain: 0.10, decay: 3.0 },   // Octave C5
      { freq: 768, gain: 0.06, decay: 2.4 },   // Fifth G5
      { freq: 1028, gain: 0.03, decay: 1.8 },  // Shimmer overtone
      { freq: 128.0, gain: 0.09, decay: 4.0 }  // Deep warm hum
    ];

    partials.forEach((p, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);
      if (idx === 1) {
        osc.frequency.exponentialRampToValueAtTime(p.freq * 1.003, now + p.decay);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    });
  }

  // Soft Wooden Fish (Muyu / 木鱼) & Prayer Bead Tap Sound
  playBeadClick(pitchOffset = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 520 + pitchOffset * 12;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.11);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(680, now);
    filter.Q.setValueAtTime(3.2, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Uplifting Pentatonic Chime for Completing a Good Deed
  playGoodDeedChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 587.33, 659.25, 783.99, 1046.5]; // C5 D5 E5 G5 C6
    notes.forEach((freq, i) => {
      const start = this.ctx.currentTime + i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.95);
    });
  }

  // Celestial Offering Sound (Doubling Virtue Points)
  playOfferingSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    chord.forEach((freq, i) => {
      const start = this.ctx.currentTime + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 2.3);
    });
  }

  // Serene Harmonic Chant Resonance for 'Nanmo Amitofo' Skill (+5 VP)
  playAmitofoChant() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // 4-syllable gentle melodic contour ("Nan-mo A-mi-to-fo")
    const melody = [
      { freq: 392.00, delay: 0.0, dur: 0.55 },  // G4
      { freq: 440.00, delay: 0.35, dur: 0.55 }, // A4
      { freq: 523.25, delay: 0.72, dur: 0.65 }, // C5
      { freq: 392.00, delay: 1.15, dur: 1.50 }  // G4 resolve + singing bowl
    ];

    melody.forEach((note) => {
      const start = this.ctx.currentTime + note.delay;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, start);
      osc2.frequency.setValueAtTime(note.freq * 2, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.10, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + note.dur + 0.05);
      osc2.stop(start + note.dur + 0.05);
    });
  }

  // Gentle Syllable-by-Syllable Harmonic Chant for Each Prayer Skill
  playPrayerSyllableChant(skillId) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const patterns = {
      amitofo: [
        { freq: 392.00, delay: 0.00, dur: 0.40 }, // Nan
        { freq: 440.00, delay: 0.32, dur: 0.40 }, // mo
        { freq: 523.25, delay: 0.64, dur: 0.42 }, // A
        { freq: 587.33, delay: 0.96, dur: 0.42 }, // mi
        { freq: 523.25, delay: 1.28, dur: 0.45 }, // to
        { freq: 392.00, delay: 1.60, dur: 0.75 }  // fo
      ],
      wenshu: [
        { freq: 440.00, delay: 0.00, dur: 0.36 }, // Om
        { freq: 493.88, delay: 0.32, dur: 0.34 }, // A
        { freq: 523.25, delay: 0.64, dur: 0.34 }, // Ra
        { freq: 587.33, delay: 0.96, dur: 0.34 }, // Pa
        { freq: 659.25, delay: 1.28, dur: 0.34 }, // Ca
        { freq: 587.33, delay: 1.60, dur: 0.36 }, // Na
        { freq: 523.25, delay: 1.92, dur: 0.72 }  // Dhih
      ],
      changshou: [
        { freq: 349.23, delay: 0.00, dur: 0.38 },
        { freq: 392.00, delay: 0.34, dur: 0.38 },
        { freq: 440.00, delay: 0.68, dur: 0.38 },
        { freq: 523.25, delay: 1.02, dur: 0.40 },
        { freq: 440.00, delay: 1.38, dur: 0.42 },
        { freq: 392.00, delay: 1.74, dur: 0.72 }
      ]
    };
    const melody = patterns[skillId] || patterns.amitofo;

    melody.forEach((note) => {
      const start = this.ctx.currentTime + note.delay;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, start);
      osc2.frequency.setValueAtTime(note.freq * 2, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.065, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + note.dur + 0.05);
      osc2.stop(start + note.dur + 0.05);
    });
  }

  // Pronounce Prayer Mantra aloud and invoke onComplete once both audio chant and speech finish
  pronouncePrayer(skillId, lang = 'zh', onComplete = null) {
    const minDurations = { amitofo: 2200, wenshu: 2500, changshou: 2800 };
    const minDurMs = minDurations[skillId] || 2200;

    this.playPrayerSyllableChant(skillId);

    const skillMap = (window.GAME_DATA && window.GAME_DATA.PRAYER_SKILLS) || {};
    const info = skillMap[skillId] || {};
    const textZh = info.spokenZh || (skillId === 'wenshu' ? '嗡 阿 喇 巴 札 那 谛' : skillId === 'changshou' ? '嗡 格热 阿耶 色德 吽舍，阿玛拉呢 则万德耶 索哈' : '南无阿弥陀佛');
    const textEn = info.spokenEn || (skillId === 'wenshu' ? 'Om, Ah, Ra, Pa, Ca, Na, Dhih' : skillId === 'changshou' ? 'Om Guru Ayur Siddhi Hum Hrih, Ah ma ra ni, Ji van ti ye, Sva ha' : 'Nan mo, Ah mee to fo');

    let minTimerDone = false;
    let speechDone = false;
    let completed = false;
    let safetyTimer = null;

    const finishIfReady = () => {
      if (completed || !minTimerDone || !speechDone) return;
      completed = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (typeof onComplete === 'function') onComplete();
    };

    setTimeout(() => {
      minTimerDone = true;
      finishIfReady();
    }, minDurMs);

    safetyTimer = setTimeout(() => {
      minTimerDone = true;
      speechDone = true;
      finishIfReady();
    }, 4500);

    if (this.muted || !window.speechSynthesis) {
      speechDone = true;
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const forceZhPrayer = skillId === 'wenshu' || skillId === 'changshou';
      const preferZh = lang === 'zh' || forceZhPrayer;
      const zhVoice = preferZh ? this._pickGentleVoice(true) : null;
      const useZhVoice = Boolean(preferZh && (zhVoice || forceZhPrayer));
      const spokenText = useZhVoice ? textZh : textEn;
      const voice = useZhVoice ? (zhVoice || null) : (this._pickGentleVoice(false) || this._preferredVoice);

      const utter = new SpeechSynthesisUtterance(spokenText);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang || (useZhVoice ? 'zh-CN' : 'en-US');
      } else {
        utter.lang = useZhVoice ? 'zh-CN' : 'en-US';
      }
      utter.rate = 0.78;
      utter.pitch = 1.02;
      utter.volume = 0.95;

      const markSpeechDone = () => {
        speechDone = true;
        finishIfReady();
      };
      utter.onend = markSpeechDone;
      utter.onerror = markSpeechDone;
      this._activePrayerUtterance = utter;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      speechDone = true;
      finishIfReady();
    }
  }

  // Serene Lotus Harp & Warm Chime for 「回向」 (Merit Dedication / Liberation +1)
  playHuixiangBlessing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4 C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const start = this.ctx.currentTime + idx * 0.13;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 2.7);
    });
  }

  // Gentle Meditation Breath Tone
  playMeditationTone() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.3);
  }

  // Deep Calming Giant Bronze Temple Bell (Sansa Bell Pavilion / 钟楼梵钟)
  playGiantTempleBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const partials = [
      { freq: 110.0, gain: 0.24, decay: 6.2 },
      { freq: 110.6, gain: 0.18, decay: 5.8 }, // slow organic beat
      { freq: 220.0, gain: 0.12, decay: 4.5 },
      { freq: 331.5, gain: 0.06, decay: 3.2 },
      { freq: 442.0, gain: 0.035, decay: 2.1 }
    ];

    partials.forEach((p) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    });
  }

  // Gentle Mountain Breeze & Trickling Stream Ambient Soundscape
  toggleNatureAmbient(forceState) {
    this.init();
    if (!this.ctx) return false;

    const nextState = typeof forceState === 'boolean' ? forceState : !this._naturePlaying;
    if (nextState === this._naturePlaying) return this._naturePlaying;

    if (!nextState) {
      if (this._natureGain && this.ctx) {
        try {
          this._natureGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
        } catch (e) {}
      }
      if (this._natureSource) {
        const src = this._natureSource;
        setTimeout(() => { try { src.stop(); } catch (e) {} }, 650);
      }
      this._naturePlaying = false;
      this._natureSource = null;
      return false;
    }

    if (this.muted) {
      this._naturePlaying = false;
      return false;
    }

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
      data[i] = pink;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.11, this.ctx.currentTime + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();

    this._natureSource = noise;
    this._natureGain = gain;
    this._naturePlaying = true;
    return true;
  }
}

window.templeAudio = new TempleAudioEngine();
