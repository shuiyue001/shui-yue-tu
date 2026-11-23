// Web Audio API Synthesizer for Temple Singing Bowls, Bowing Bell, Wooden Fish, and Chimes

class TempleAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.voiceEnabled = true;
    this.ambientTimer = null;
    this._mantraMusicPlaying = false;
    this._bgmAudio = null;
    this.bgmVolume = 0.20; // Slider level 0..1 (default 20% -> ~0.04 perceptual audio amplitude)
    this.waterfallMusicVolume = 0.85;
    this.waterfallStreamVolume = 0.38;
    this._waterfallMusicAudio = null;
    this._waterfallStreamAudio = null;
    this._waterfallWavUrl = null;
    this._waterfallStreamNodes = null;
    this._wasBgmPlayingBeforeWaterfall = false;
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
    if (this.muted) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (this._mantraMusicPlaying) this.toggleMantraMusic(false);
    }
    this.setWaterfallMusicVolume(this.waterfallMusicVolume, false);
    this.setWaterfallStreamVolume(this.waterfallStreamVolume, false);
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
      ],
      om_mani: [
        { freq: 293.66, delay: 0.00, dur: 0.45 }, // Om
        { freq: 369.99, delay: 0.38, dur: 0.38 }, // Ma
        { freq: 440.00, delay: 0.72, dur: 0.38 }, // ni
        { freq: 493.88, delay: 1.06, dur: 0.38 }, // Pad
        { freq: 440.00, delay: 1.40, dur: 0.40 }, // me
        { freq: 293.66, delay: 1.76, dur: 0.85 }  // Hum
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
    const minDurations = { amitofo: 2200, om_mani: 2500, wenshu: 2500, changshou: 2800 };
    const minDurMs = minDurations[skillId] || 2200;

    this.playPrayerSyllableChant(skillId);

    const skillMap = (window.GAME_DATA && window.GAME_DATA.PRAYER_SKILLS) || {};
    const info = skillMap[skillId] || {};
    const textZh = info.spokenZh || (
      skillId === 'om_mani'
        ? '嗡 嘛 呢 呗 美 吽'
        : skillId === 'wenshu'
          ? '嗡 阿 喇 巴 札 那 谛'
          : skillId === 'changshou'
            ? '嗡 格热 阿耶 色德 吽舍，阿玛拉呢 则万德耶 索哈'
            : '南无阿弥陀佛'
    );
    const textEn = info.spokenEn || (
      skillId === 'om_mani'
        ? 'Om, Ma ni, Pad me, Hum'
        : skillId === 'wenshu'
          ? 'Om, Ah, Ra, Pa, Ca, Na, Dhih'
          : skillId === 'changshou'
            ? 'Om Guru Ayur Siddhi Hum Hrih, Ah ma ra ni, Ji van ti ye, Sva ha'
            : 'Nan mo, Ah mee to fo'
    );

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
      const forceZhPrayer = skillId === 'wenshu' || skillId === 'changshou' || skillId === 'om_mani';
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

  isMantraMusicPlaying() {
    return !!this._mantraMusicPlaying;
  }

  _effectiveBgmGain(level) {
    const v = Math.max(0, Math.min(1, Number(level)));
    if (!Number.isFinite(v) || v <= 0.005) return 0;
    // Quadratic perceptual curve so low slider levels (10%–35%) feel genuinely gentle and responsive
    return Math.min(1, v * v);
  }

  setBgmVolume(vol) {
    const v = Math.max(0, Math.min(1, Number(vol)));
    if (!Number.isFinite(v)) return this.bgmVolume;
    this.bgmVolume = v;
    const effectiveVol = this._effectiveBgmGain(v);
    if (this._bgmAudio) {
      this._bgmAudio.volume = effectiveVol;
      this._bgmAudio.muted = effectiveVol === 0;
    }
    return this.bgmVolume;
  }

  // Gentle Bodhi Breeze Chime when releasing a Bodhi Leaf Wish
  playBodhiWishBreezeChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 659.25, 783.99, 880.00, 1174.66, 1318.51];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.065, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 2.9);
    });
  }

  // Gentle Sacred 梵音 Background Music (assets/fanyin_bgm.m4a)
  toggleMantraMusic(forceState) {
    const nextState = typeof forceState === 'boolean' ? forceState : !this._mantraMusicPlaying;

    if (!nextState) {
      this._mantraMusicPlaying = false;
      if (this._bgmAudio) {
        try {
          this._bgmAudio.pause();
        } catch (e) {}
      }
      return false;
    }

    if (this.muted) {
      this._mantraMusicPlaying = false;
      return false;
    }

    if (typeof Audio === 'undefined') {
      this._mantraMusicPlaying = false;
      return false;
    }

    if (!this._bgmAudio) {
      const src = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/fanyin_bgm.m4a']) || 'assets/fanyin_bgm.m4a';
      const audio = new Audio(src);
      audio.loop = true;
      audio.preload = 'auto';
      const eff = this._effectiveBgmGain(this.bgmVolume);
      audio.volume = eff;
      audio.muted = eff === 0;
      this._bgmAudio = audio;
    }

    this._mantraMusicPlaying = true;
    try {
      const playPromise = this._bgmAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          this._mantraMusicPlaying = false;
          if (window.game && typeof window.game.syncBgmButtonUI === 'function') {
            window.game.syncBgmButtonUI();
          }
        });
      }
    } catch (e) {
      this._mantraMusicPlaying = false;
      return false;
    }

    return true;
  }

  // -------------------- 「瀑布清流」 SANCTUARY MUSIC + MULTI-LAYER WATERFALL & BROOK AUDIO --------------------
  _getWaterfallStreamWavUrl() {
    if (this._waterfallWavUrl) return this._waterfallWavUrl;

    const sr = 22050;
    const durationSec = 6;
    const n = sr * durationSec;
    const fadeSamples = Math.floor(sr * 0.25);
    const total = n + fadeSamples;

    const rawL = new Float32Array(total);
    const rawR = new Float32Array(total);

    // Deterministic LCG PRNG for organic noise without harsh spikes
    let seed = 135792468;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed / 4294967296) * 2 - 1;
    };

    // Pink-noise + multi-band water filter states per stereo channel
    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;
    let lpRumbleL = 0, lpRumbleR = 0;
    let lpCascadeHiL = 0, lpCascadeLoL = 0, lpCascadeHiR = 0, lpCascadeLoR = 0;
    let lpBrookHiL = 0, lpBrookLoL = 0, lpBrookHiR = 0, lpBrookLoR = 0;

    // Filter coefficients at 22050 Hz
    const dt = 1 / sr;
    const alpha = (fc) => {
      const rc = 1 / (2 * Math.PI * fc);
      return dt / (rc + dt);
    };
    const aRumble = alpha(280);
    const aCascHi = alpha(2100);
    const aCascLo = alpha(480);
    const aBrookHi = alpha(1650);
    const aBrookLo = alpha(680);

    for (let i = 0; i < total; i++) {
      const t = i / sr;

      const wL = rand();
      b0L = 0.99886 * b0L + wL * 0.0555179;
      b1L = 0.99332 * b1L + wL * 0.0750759;
      b2L = 0.96900 * b2L + wL * 0.1538520;
      b3L = 0.86650 * b3L + wL * 0.3104856;
      b4L = 0.55000 * b4L + wL * 0.5329522;
      b5L = -0.7616 * b5L - wL * 0.0168980;
      const pinkL = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + wL * 0.5362) * 0.12;
      b6L = wL * 0.115926;

      const wR = rand();
      b0R = 0.99886 * b0R + wR * 0.0555179;
      b1R = 0.99332 * b1R + wR * 0.0750759;
      b2R = 0.96900 * b2R + wR * 0.1538520;
      b3R = 0.86650 * b3R + wR * 0.3104856;
      b4R = 0.55000 * b4R + wR * 0.5329522;
      b5R = -0.7616 * b5R - wR * 0.0168980;
      const pinkR = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + wR * 0.5362) * 0.12;
      b6R = wR * 0.115926;

      // 1. Deep Waterfall Plunge Rumble (120-420 Hz warm body + slow 1/6 & 2/6 Hz swell)
      lpRumbleL += aRumble * (pinkL - lpRumbleL);
      lpRumbleR += aRumble * (pinkR - lpRumbleR);
      const swell = 0.82 + 0.12 * Math.sin(2 * Math.PI * (1 / 6) * t) + 0.06 * Math.cos(2 * Math.PI * (2 / 6) * t + 0.9);
      const rumbleL = lpRumbleL * 1.45 * swell;
      const rumbleR = lpRumbleR * 1.45 * swell;

      // 2. Silky White-Water Cascade (500-2200 Hz stereo-decorrelated cascade)
      lpCascadeHiL += aCascHi * (pinkL - lpCascadeHiL);
      lpCascadeLoL += aCascLo * (pinkL - lpCascadeLoL);
      lpCascadeHiR += aCascHi * (pinkR - lpCascadeHiR);
      lpCascadeLoR += aCascLo * (pinkR - lpCascadeLoR);
      const cascEnvL = 0.85 + 0.15 * Math.sin(2 * Math.PI * (3 / 6) * t + 0.4);
      const cascEnvR = 0.85 + 0.15 * Math.cos(2 * Math.PI * (4 / 6) * t + 1.1);
      const cascadeL = (lpCascadeHiL - lpCascadeLoL) * 1.35 * cascEnvL;
      const cascadeR = (lpCascadeHiR - lpCascadeLoR) * 1.35 * cascEnvR;

      // 3. Babbling Rocky Brook Gurgle (1.5 Hz, 2.5 Hz, 3.8 Hz modulation)
      lpBrookHiL += aBrookHi * (wL * 0.35 + pinkL * 0.65 - lpBrookHiL);
      lpBrookLoL += aBrookLo * (wL * 0.35 + pinkL * 0.65 - lpBrookLoL);
      lpBrookHiR += aBrookHi * (wR * 0.35 + pinkR * 0.65 - lpBrookHiR);
      lpBrookLoR += aBrookLo * (wR * 0.35 + pinkR * 0.65 - lpBrookLoR);
      const gurgleL = 0.48 + 0.22 * Math.sin(2 * Math.PI * 1.5 * t) + 0.18 * Math.sin(2 * Math.PI * 2.5 * t + 1.3) + 0.12 * Math.sin(2 * Math.PI * 3.8333 * t + 0.5);
      const gurgleR = 0.48 + 0.22 * Math.sin(2 * Math.PI * 1.5 * t + 1.1) + 0.18 * Math.cos(2 * Math.PI * 2.5 * t + 0.4) + 0.12 * Math.sin(2 * Math.PI * 3.8333 * t + 2.2);
      const brookL = (lpBrookHiL - lpBrookLoL) * 1.25 * gurgleL;
      const brookR = (lpBrookHiR - lpBrookLoR) * 1.25 * gurgleR;

      rawL[i] = rumbleL + cascadeL + brookL;
      rawR[i] = rumbleR + cascadeR + brookR;
    }

    // Blend loop tail over head with 0.25s cosine crossfade before adding wrapped droplets
    const outL = new Float32Array(n);
    const outR = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      outL[i] = rawL[i];
      outR[i] = rawR[i];
    }
    for (let i = 0; i < fadeSamples; i++) {
      const k = i / fadeSamples;
      const wHead = 0.5 * (1 - Math.cos(Math.PI * k));
      const wTail = 1 - wHead;
      outL[i] = rawL[i] * wHead + rawL[n + i] * wTail;
      outR[i] = rawR[i] * wHead + rawR[n + i] * wTail;
    }

    // Overlay ~45 soft water-bubble & stream droplet chirps (550-1600 Hz), wrapped modulo loop length
    for (let d = 0; d < 45; d++) {
      const startSample = Math.floor(((d + 0.35 + (d % 3) * 0.18) / 45) * n);
      const freq = 550 + ((d * 197) % 1050);
      const lenSamples = Math.floor(sr * (0.045 + (d % 4) * 0.015));
      const panL = d % 2 === 0 ? 0.85 : 0.45;
      const panR = d % 2 === 0 ? 0.45 : 0.85;
      const amp = 0.048 + (d % 3) * 0.014;
      for (let k = 0; k < lenSamples; k++) {
        const idx = (startSample + k) % n;
        const kt = k / sr;
        const env = Math.sin(Math.PI * (k / lenSamples)) * Math.exp(-kt * 26);
        const pitchGlide = freq * (1 + 0.18 * (k / lenSamples));
        const val = Math.sin(2 * Math.PI * pitchGlide * kt) * env * amp;
        outL[idx] += val * panL;
        outR[idx] += val * panR;
      }
    }

    // Peak normalize to ~0.68
    let peak = 0.001;
    for (let i = 0; i < n; i++) {
      const aL = Math.abs(outL[i]);
      const aR = Math.abs(outR[i]);
      if (aL > peak) peak = aL;
      if (aR > peak) peak = aR;
    }
    const norm = 0.68 / peak;

    const dataBytes = n * 4;
    const wavBytes = new Uint8Array(44 + dataBytes);
    const view = new DataView(wavBytes.buffer);
    const writeStr = (off, s) => { for (let j = 0; j < s.length; j++) wavBytes[off + j] = s.charCodeAt(j); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataBytes, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 2, true); // Stereo
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataBytes, true);

    let p = 44;
    for (let i = 0; i < n; i++) {
      const sL = Math.max(-1, Math.min(1, outL[i] * norm));
      const sR = Math.max(-1, Math.min(1, outR[i] * norm));
      view.setInt16(p, Math.round(sL * 32767), true);
      view.setInt16(p + 2, Math.round(sR * 32767), true);
      p += 4;
    }

    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      this._waterfallWavUrl = URL.createObjectURL(new Blob([wavBytes], { type: 'audio/wav' }));
    } else {
      let bin = '';
      for (let i = 0; i < wavBytes.length; i++) bin += String.fromCharCode(wavBytes[i]);
      this._waterfallWavUrl = 'data:audio/wav;base64,' + (typeof btoa === 'function' ? btoa(bin) : '');
    }
    return this._waterfallWavUrl;
  }

  startWaterfallStreamAmbient() {
    this.stopWaterfallStreamAmbient();

    const scale = Math.max(0, Math.min(1, Number(this.waterfallStreamVolume) || 0));

    // 1. Primary Stereo WAV Waterfall & Babbling Brook Loop (guaranteed audible HTML5 playback)
    if (typeof Audio !== 'undefined') {
      try {
        if (!this._waterfallStreamAudio) {
          const wavUrl = this._getWaterfallStreamWavUrl();
          const created = new Audio(wavUrl);
          created.loop = true;
          created.preload = 'auto';
          this._waterfallStreamAudio = created;
        }
        const streamAudio = this._waterfallStreamAudio;
        streamAudio.volume = this.muted ? 0 : Math.max(0, Math.min(1, scale * 0.90));
        streamAudio.muted = this.muted || scale <= 0.005;
        streamAudio.currentTime = 0;
        if (!this.muted && scale > 0.005) {
          const p = streamAudio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } catch (e) {}
    }

    if (this.muted) return false;
    this.init();
    if (!this.ctx) return true;

    // 2. Live WebAudio Layered Cascade & Brook Shimmer
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
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.28;
      b6 = white * 0.115926;
      data[i] = pink;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const now = this.ctx.currentTime;
    const lowFilter = this.ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(360, now);

    const silkFilter = this.ctx.createBiquadFilter();
    silkFilter.type = 'bandpass';
    silkFilter.frequency.setValueAtTime(1050, now);
    silkFilter.Q.setValueAtTime(0.75, now);

    const shimmerFilter = this.ctx.createBiquadFilter();
    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.setValueAtTime(1650, now);
    shimmerFilter.Q.setValueAtTime(0.7, now);

    const lowGain = this.ctx.createGain();
    const silkGain = this.ctx.createGain();
    const shimmerGain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();

    lowGain.gain.setValueAtTime(0.58, now);
    silkGain.gain.setValueAtTime(0.38, now);
    shimmerGain.gain.setValueAtTime(0.34, now);

    const targetGain = this.muted ? 0.0001 : Math.max(0.0001, scale * 0.42);
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.8);

    src.connect(lowFilter);
    src.connect(silkFilter);
    src.connect(shimmerFilter);
    lowFilter.connect(lowGain);
    silkFilter.connect(silkGain);
    shimmerFilter.connect(shimmerGain);
    lowGain.connect(masterGain);
    silkGain.connect(masterGain);
    shimmerGain.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    src.start();

    this._waterfallStreamNodes = { src, masterGain };
    return true;
  }

  stopWaterfallStreamAmbient() {
    if (this._waterfallStreamAudio) {
      try {
        this._waterfallStreamAudio.pause();
        this._waterfallStreamAudio.currentTime = 0;
      } catch (e) {}
    }
    if (!this._waterfallStreamNodes) return;
    const nodes = this._waterfallStreamNodes;
    this._waterfallStreamNodes = null;
    try {
      if (nodes.masterGain && this.ctx) {
        if (typeof nodes.masterGain.gain.cancelScheduledValues === 'function') {
          nodes.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        }
        nodes.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      }
      setTimeout(() => {
        try { nodes.src.stop(); } catch (e) {}
      }, 400);
    } catch (e) {}
  }

  setWaterfallMusicVolume(vol, unmuteOnAdjust = true) {
    const v = Math.max(0, Math.min(1, Number(vol)));
    if (!Number.isFinite(v)) return this.waterfallMusicVolume;
    if (unmuteOnAdjust && v > 0.01 && this.muted) {
      this.muted = false;
    }
    this.waterfallMusicVolume = v;
    if (this._waterfallMusicAudio) {
      this._waterfallMusicAudio.volume = this.muted ? 0 : v;
      this._waterfallMusicAudio.muted = this.muted || v <= 0.005;
    }
    return this.waterfallMusicVolume;
  }

  setWaterfallStreamVolume(vol, unmuteOnAdjust = true) {
    const v = Math.max(0, Math.min(1, Number(vol)));
    if (!Number.isFinite(v)) return this.waterfallStreamVolume;
    if (unmuteOnAdjust && v > 0.01 && this.muted) {
      this.muted = false;
    }
    this.waterfallStreamVolume = v;
    this.init();
    if (!this._waterfallStreamAudio && v > 0.01 && !this.muted) {
      this.startWaterfallStreamAmbient();
      return this.waterfallStreamVolume;
    }
    if (this._waterfallStreamAudio) {
      this._waterfallStreamAudio.volume = this.muted ? 0 : Math.max(0, Math.min(1, v * 0.90));
      this._waterfallStreamAudio.muted = this.muted || v <= 0.005;
      if (!this.muted && v > 0.005 && this._waterfallStreamAudio.paused) {
        try {
          const p = this._waterfallStreamAudio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      }
    }
    if (this._waterfallStreamNodes && this._waterfallStreamNodes.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      const target = this.muted ? 0.0001 : Math.max(0.0001, v * 0.42);
      const gainParam = this._waterfallStreamNodes.masterGain.gain;
      if (typeof gainParam.cancelScheduledValues === 'function') {
        gainParam.cancelScheduledValues(now);
      }
      if (typeof gainParam.setValueAtTime === 'function') {
        gainParam.setValueAtTime(target, now);
      } else if (typeof gainParam.setTargetAtTime === 'function') {
        gainParam.setTargetAtTime(target, now, 0.03);
      }
    }
    return this.waterfallStreamVolume;
  }

  startWaterfallSanctuaryAudio(onEndedCallback = null) {
    this._wasBgmPlayingBeforeWaterfall = !!this._mantraMusicPlaying;
    if (this._mantraMusicPlaying) {
      this.toggleMantraMusic(false);
    }

    if (typeof Audio !== 'undefined') {
      if (!this._waterfallMusicAudio) {
        const src = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/waterfall_zen_music.m4a']) || 'assets/waterfall_zen_music.m4a';
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.loop = false;
        this._waterfallMusicAudio = audio;
      }
      const audio = this._waterfallMusicAudio;
      audio.onended = typeof onEndedCallback === 'function' ? onEndedCallback : null;
      audio.volume = this.muted ? 0 : Math.max(0, Math.min(1, this.waterfallMusicVolume));
      audio.muted = this.muted || this.waterfallMusicVolume <= 0.005;
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }

    this.startWaterfallStreamAmbient();
    return true;
  }

  replayWaterfallSanctuaryAudio(onEndedCallback = null) {
    this.startWaterfallSanctuaryAudio(onEndedCallback);
  }

  stopWaterfallSanctuaryAudio(resumeBgm = true) {
    if (this._waterfallMusicAudio) {
      try {
        this._waterfallMusicAudio.pause();
        this._waterfallMusicAudio.currentTime = 0;
      } catch (e) {}
    }
    this.stopWaterfallStreamAmbient();
    if (resumeBgm && this._wasBgmPlayingBeforeWaterfall && !this.muted) {
      this._wasBgmPlayingBeforeWaterfall = false;
      this.toggleMantraMusic(true);
    }
  }
}

window.templeAudio = new TempleAudioEngine();
