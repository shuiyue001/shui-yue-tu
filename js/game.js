// Main 3D Game Engine:
// - Authentic Palace Temple Architecture + Temple Architect Designer Studio + .GLB Model Importer
// - Sculpted 7-Buddha Statues with 24-Petal Lotus Thrones & Flame Mandorlas
// - 9 Rich 3D Good-Virtue Environments (Family Home with Parents, Pine/Bamboo Forest with Trapped Deer, Lotus Lake, etc.)
// - True Exploration Gameplay with 3D Golden Compass Arrow & Hints (no sidebar auto-complete!)

class BuddhistPracticeGame {
  constructor() {
    this.state = {
      lang: 'zh',
      playerName: '小沙弥',
      charId: 'tibetan_lama',
      robeColor: '#8c1d18',
      headwear: 'none',
      aura: 'lotus_orb',
      templeStyleId: 'imperial_gold',
      buddhaMatId: 'gilded_gold',
      skyThemeId: 'morning_gold',
      virtuePoints: 0,
      liberationPoints: 0,
      prayerHallUnlocked: false,
      completedDeeds: {}, // { deedId: true }
      offeringsMade: { water: false, flower: false, scent: false },
      bowedBuddhas: {}, // { 0: true .. 6: true } (+10 VP each after clicking Acknowledge!)
      wishesSelected: {}, // { wishId: true }
      quizMasterUnlocked: false,
      amitofoUnlocked: false,
      activePrayerSkillId: 'amitofo',
      beadCount: 0,
      bowCount: 0,
      completedBow25: false,
      amitofoCount: 0,
      stupaLaps: 0,
      circledStupas: {}, // { 0..6: true } on path to Mount Wutai 文殊殿
      wenshuHallUnlocked: false,
      bowedManjushri: false,
      wenshuOfferings: { water: false, flower: false, scent: false },
      wenshuMantraCount: 0,
      plantedFlowerGardens: {}, // { flower_garden_1..3: true }
      plantedLotusPonds: {}, // { lotus_pond_1..3: true }
      bowedChangshou: false,
      changshouOfferings: { water: false, flower: false, scent: false },
      changshouPrayerCount: 0,
      readSutras: {}, // { sutra_1: true ... }
      personalItems: {}
    };

    this.loadSavedState();
    // Default Simplified Chinese; user can toggle between 中文 and EN anytime from top HUD
    if (this.state.lang !== 'en' && this.state.lang !== 'zh') {
      this.state.lang = 'zh';
    }
    // Buddhist non-differentiation: every player shares the single unified cute Red Tibetan monk
    this.state.charId = 'tibetan_lama';
    this.state.robeColor = '#8c1d18';
    if (!this.state.playerName || this.state.playerName === 'Little Lotus') {
      this.state.playerName = this.state.lang === 'zh' ? '小沙弥' : 'Little Lama';
    }
    if (!this.state.bowedBuddhas) this.state.bowedBuddhas = {};
    if (!this.state.wishesSelected) this.state.wishesSelected = {};
    if (!this.state.circledStupas) this.state.circledStupas = {};
    if (!this.state.wenshuOfferings) this.state.wenshuOfferings = { water: false, flower: false, scent: false };
    if (!this.state.plantedFlowerGardens) this.state.plantedFlowerGardens = {};
    if (!this.state.plantedLotusPonds) this.state.plantedLotusPonds = {};
    if (!this.state.changshouOfferings) this.state.changshouOfferings = { water: false, flower: false, scent: false };
    if (!this.state.readSutras) this.state.readSutras = {};
    if (!['amitofo', 'wenshu', 'changshou'].includes(this.state.activePrayerSkillId)) {
      this.state.activePrayerSkillId = 'amitofo';
    }
    this._isPrayerChanting = false;
    this._activeChantingSkillId = null;
    if (Object.keys(this.state.circledStupas).length >= 7) {
      this.state.wenshuHallUnlocked = true;
    }
    if (typeof this.state.liberationPoints !== 'number') this.state.liberationPoints = 0;
    if (this.state.virtuePoints >= 10 && Object.keys(this.state.completedDeeds || {}).length >= 5) {
      this.state.prayerHallUnlocked = true;
    }
    this._isHuixiangOpen = false;
    this.poseMode = 'idle'; // 'idle' | 'palms' | 'bow_hold' | 'sit'
    this.seatedScenic = null;
    this.bellPavilion = null;
    this._nearBell = false;
    this._nearbySeat = null;

    // Runtime Scene & Movement State
    this.currentScene = 'public_temple';
    this.isSeatedOnMat = false;
    this.activePractice = null;
    this.bowAnimTimer = 0;
    this.isBowing25 = false;
    this.bow25Current = 0;
    this.bow25Total = 25;
    this.bow25CycleTimer = 0;
    this._lastBowBuddhaIdx = -1;
    this.incenseSmokePuffs = [];
    this.activeHintDeedId = 'clean_house'; // Start at Family Home right near the starting point!

    // Gate Opening Pink Sky Lotus & Confetti Celebration State
    this.gateSkyLotus = null;
    this.gateSkyLotusAge = 0;
    this.gateConfetti = [];
    this.buddhaSpotlight = null;
    this._lastSpokenPromptId = null;
    this._nearbyBuddhaIdx = null;
    this.cutsceneState = null;

    // Game Designer Enhancements State:
    this.lotusFootprints = [];
    this._footprintTimer = 0;
    this.companionMeshes = {};
    this.skyLanterns = [];
    // Enhancement #3: 3D Wandering Distraction Mist Clouds & Mindful Breath [Q] Wave
    this.distractionClouds = [];
    this.breathWaves = [];
    this.breathCooldown = 0;
    this.slowDebuffTimer = 0;
    this._minigameRAF = null;

    // 7 White Stupas Ascending Path to Mount Wutai 文殊殿 + East Bridge + Sutras + Manjushri Summit Hall
    this.stupaList = [];
    this.activeStupaIdx = 0;
    this.stupaLabels = [];
    const firstStupa = (window.GAME_DATA.WENSHU_STUPAS || [])[0] || { x: 40.0, z: 15.0 };
    const stupaY = window.GAME_DATA.getTerrainHeight(firstStupa.x, firstStupa.z);
    this.stupaPos = new THREE.Vector3(firstStupa.x, stupaY, firstStupa.z);
    this.stupaMesh = null;
    this.wisdomBridgeGroup = null;
    this.sutraStations = [];
    this.wenshuHallGroup = null;
    this.flowerGardenStations = [];
    this.lotusPondStations = [];
    this.changshouHallGroup = null;
    this.changshouSeats = [];
    this.activeChangshouSeatIdx = null;
    this.summitClouds = null;
    this._nearbySutraId = null;
    this._nearManjushri = false;
    this._nearHallTeleportStart = false;
    this._nearChangshou = false;
    this._nearOfferingTableHall = null;
    this._offeringActiveUntil = 0;
    this._nearbyChangshouSeatIdx = null;
    this._nearbyFlowerGardenId = null;
    this._nearbyLotusPondId = null;
    this.lastStupaAngle = null;
    this.stupaClockwiseAngle = 0;
    this.isAutoCirclingStupa = false;
    this.autoStupaTargetAngle = 0;
    this._ccwWarnTime = 0;

    // Input & Roblox-Style 3D Camera / Jump Physics
    this.keys = {};
    this.dpadVec = { x: 0, z: 0 };
    this.walkTarget = null;
    this.walkCallback = null;
    this.walkWaypoints = [];
    this.cameraAngle = 0;
    this.cameraPitch = 0.30;
    this.cameraDistance = 8.4;
    this.isDraggingCam = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.playerVelY = 0;
    this.isGrounded = true;
    this._splashTimer = 0;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.dirLight = null;
    this.clock = new THREE.Clock();

    // World Groups
    this.publicTempleGroup = new THREE.Group();
    this.templeBuildingGroup = new THREE.Group();
    this.sevenBuddhasGroup = new THREE.Group();
    this.personalSpaceGroup = new THREE.Group();
    this.playerGroup = new THREE.Group();
    this.charParts = {};
    this.compassArrow = null;

    // Interactive Registries
    this.deedStations = [];
    this.buddhaStatues = [];
    this.offeringMeshes = { water: null, flower: null, scent: null };
    this.doorLeftPivot = null;
    this.doorRightPivot = null;
    this.meditationMats = [];
    this.personalBuiltGroup = new THREE.Group();
    this.worldLabelItems = [];
    this.bilingualLabels = [];
    this.smokeParticles = [];

    this.initThree();
    this.buildPublicTempleScene();
    this.buildPersonalSpaceScene();
    this.buildPlayerCharacter();
    this.applySkyTheme();
    this.initControls();
    this.initUI();
    this.selectNextUnfinishedHint();
    this.applyLanguageToDOM();
    this.refreshAllWorldLabelsLanguage();
    this.updateHUD();
    this.initMultiplayer();
    this.animate();
  }

  // -------------------- PERSISTENCE --------------------
  loadSavedState() {
    try {
      if (window.location.search.includes('reset')) {
        localStorage.removeItem('little_lotus_save_v2');
      }
      const raw = localStorage.getItem('little_lotus_save_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = Object.assign(this.state, parsed);
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    }
  }

  resetProgress() {
    try {
      localStorage.removeItem('little_lotus_save_v2');
    } catch (e) {}
    window.location.href = window.location.pathname;
  }

  saveState() {
    try {
      localStorage.setItem('little_lotus_save_v2', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  }

  // -------------------- VIRTUE & GATE LOGIC --------------------
  getCompletedDeedCount() {
    return Object.keys(this.state.completedDeeds).length;
  }

  canEnterPrayerHall() {
    return !!this.state.prayerHallUnlocked || (this.state.virtuePoints >= 10 && this.getCompletedDeedCount() >= 5);
  }

  getCircledStupaCount() {
    return Object.keys(this.state.circledStupas || {}).length;
  }

  getNextUncircledStupaIdx() {
    const total = (window.GAME_DATA.WENSHU_STUPAS || []).length || 7;
    for (let i = 0; i < total; i++) {
      if (!(this.state.circledStupas && this.state.circledStupas[i])) return i;
    }
    return -1;
  }

  canCrossEastRiver() {
    return !!(this.state.completedDeeds && this.state.completedDeeds['build_wisdom_bridge']);
  }

  canEnterWenshuHall() {
    return !!this.state.wenshuHallUnlocked || this.getCircledStupaCount() >= 7;
  }

  isInsideWenshuHall() {
    if (this.currentScene !== 'public_temple') return false;
    const p = this.playerGroup.position;
    return p.x > 114.8 && p.x < 134.5 && p.z > -8.6 && p.z < 16.6;
  }

  isInsideChangshouHall() {
    if (this.currentScene !== 'public_temple') return false;
    const p = this.playerGroup.position;
    return p.x < -86.6 && p.x > -105.4 && p.z > -8.4 && p.z < 16.4;
  }

  rebuildWisdomBridge() {
    if (!this.publicTempleGroup) return;
    if (this.wisdomBridgeGroup) {
      this.publicTempleGroup.remove(this.wisdomBridgeGroup);
      this.wisdomBridgeGroup = null;
    }
    this.wisdomBridgeGroup = window.TempleModels3D.createWisdomBridgeModel(this.canCrossEastRiver());
    this.publicTempleGroup.add(this.wisdomBridgeGroup);
  }

  selectNextUnfinishedHint() {
    const nextDeed = window.GAME_DATA.GOOD_DEEDS.find((d) => !this.state.completedDeeds[d.id]);
    this.activeHintDeedId = nextDeed ? nextDeed.id : null;
  }

  addVirtuePoints(amount, reasonText, worldPos = null) {
    const prevUnlocked = this.state.amitofoUnlocked;
    const prevCanEnter = this.canEnterPrayerHall();

    this.state.virtuePoints += amount;
    if (this.state.virtuePoints >= 10 && this.getCompletedDeedCount() >= 5) {
      this.state.prayerHallUnlocked = true;
    }
    if (this.state.virtuePoints >= 100) {
      this.state.amitofoUnlocked = true;
    }

    const nowCanEnter = this.canEnterPrayerHall();
    if (!prevCanEnter && nowCanEnter) {
      setTimeout(() => {
        window.templeAudio.playGateOpenFanfare();
        this.triggerGateOpenSkyLotusAndConfetti();
        this.showToast(this.t(
          '🪷🎉 10 Virtue Points Reached! A Giant Lotus blooms in the sky with confetti as the 7-Buddha Hall Gate opens!',
          '🪷🎉 功德已满 10 点！空中金莲盛开、彩花飞舞，七佛宝殿大门敞开！'
        ));
      }, 350);
    }

    if (!prevUnlocked && this.state.amitofoUnlocked) {
      setTimeout(() => {
        window.templeAudio.playOfferingSound();
        this.showToast(this.t(
          '🪷🎉 100 Virtue Points Reached! Prayer Skill "Nanmo Amitofo" (+5 VP) UNLOCKED!',
          '🪷🎉 功德圆满 100 点！解锁「南无阿弥陀佛」念佛技能（+5 功德）！'
        ));
      }, 650);
    }

    this.saveState();
    this.updateHUD();

    const pos = worldPos || this.playerGroup.position.clone().add(new THREE.Vector3(0, 2.6, 0));
    this.spawnFloatingText(reasonText || `+${amount} Virtue Points ✨`, pos);
  }

  // -------------------- GRAND GATE OPENING PINK SKY LOTUS BLOOM (OPENS & THEN DISAPPEARS) & CONFETTI SHOWER --------------------
  triggerGateOpenSkyLotusAndConfetti() {
    // 1. Remove previous sky lotus if re-triggered
    if (this.gateSkyLotus) {
      this.publicTempleGroup.remove(this.gateSkyLotus);
      this.gateSkyLotus = null;
    }

    const skyLotus = new THREE.Group();
    skyLotus.position.set(0, 1.8, 1.5); // Emerges from the Prayer Hall gate, opens in the sky, then disappears!

    // Soft Pink & Golden Seed Pod Center
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd1dc, transparent: true, opacity: 1.0 });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 16), coreMat);
    core.scale.set(1, 0.65, 1);
    skyLotus.add(core);

    // Radiant Pink Lotus Aura Halo
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff80b5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78
    });
    const auraRing = new THREE.Mesh(new THREE.RingGeometry(1.4, 3.8, 32), auraMat);
    auraRing.rotation.x = -Math.PI / 2;
    auraRing.position.y = -0.25;
    skyLotus.add(auraRing);

    // 2 Concentric Rings of 20 Sculpted PINK Lotus Petals that unfold open in the sky and then fade away!
    const petalPivots = [];
    const innerMat = new THREE.MeshLambertMaterial({
      color: 0xff5c97,
      emissive: 0x6b1435,
      transparent: true,
      opacity: 1.0
    });
    const outerMat = new THREE.MeshLambertMaterial({
      color: 0xff9ec4,
      emissive: 0x521028,
      transparent: true,
      opacity: 1.0
    });

    [
      { count: 8, radius: 0.65, len: 2.15, w: 0.58, startTilt: 0.12, endTilt: 0.82, mat: innerMat },
      { count: 12, radius: 0.98, len: 2.75, w: 0.68, startTilt: 0.18, endTilt: 1.28, mat: outerMat }
    ].forEach((ring) => {
      for (let i = 0; i < ring.count; i++) {
        const ang = (i / ring.count) * Math.PI * 2;
        const pivot = new THREE.Group();
        pivot.position.set(Math.cos(ang) * ring.radius, 0, Math.sin(ang) * ring.radius);
        pivot.rotation.y = -ang + Math.PI / 2;
        pivot.rotation.x = ring.startTilt; // Starts closed like a pink lotus bud!

        const petalMesh = new THREE.Mesh(new THREE.ConeGeometry(ring.w, ring.len, 6), ring.mat);
        petalMesh.scale.set(1.0, 1.0, 0.38);
        petalMesh.position.y = ring.len * 0.45;
        pivot.add(petalMesh);
        skyLotus.add(pivot);

        petalPivots.push({ pivot, startTilt: ring.startTilt, endTilt: ring.endTilt });
      }
    });

    skyLotus.userData.petalPivots = petalPivots;
    skyLotus.userData.fadeMaterials = [coreMat, auraMat, innerMat, outerMat];
    this.publicTempleGroup.add(skyLotus);
    this.gateSkyLotus = skyLotus;
    this.gateSkyLotusAge = 0;

    // 2. Burst 90+ Pink, Golden, Jade & Sky-Blue Confetti Petals in the Sky above the Gate!
    const confettiColors = [0xffd166, 0xff758f, 0x80ed99, 0x4cc9f0, 0xffe66d, 0xff9f1c];
    for (let c = 0; c < 90; c++) {
      const conf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.36, 0.22),
        new THREE.MeshBasicMaterial({
          color: confettiColors[c % confettiColors.length],
          side: THREE.DoubleSide
        })
      );
      conf.position.set(
        (Math.random() - 0.5) * 14,
        6.5 + Math.random() * 8.5,
        1.2 + (Math.random() - 0.5) * 8
      );
      conf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.publicTempleGroup.add(conf);
      this.gateConfetti.push({
        mesh: conf,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -1.1 - Math.random() * 1.4,
        vz: (Math.random() - 0.5) * 2.0,
        rx: (Math.random() - 0.5) * 5,
        ry: (Math.random() - 0.5) * 5,
        age: 0
      });
    }
  }

  // -------------------- THREE.JS INITIALIZATION --------------------
  initThree() {
    const container = document.getElementById('game-canvas-container');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd9ecd9);
    this.scene.fog = new THREE.FogExp2(0xd8ebd8, 0.0036);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 460);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xfff8eb, 0x6b5b45, 0.88);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff4d6, 1.25);
    this.dirLight.position.set(28, 48, 34);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    const d = 55;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Warm Golden Altar Point Lights inside the 7-Buddha Hall
    const altarLightCenter = new THREE.PointLight(0xffcf56, 1.5, 38);
    altarLightCenter.position.set(0, 7, -18);
    this.publicTempleGroup.add(altarLightCenter);

    this.publicTempleGroup.add(this.templeBuildingGroup);
    this.publicTempleGroup.add(this.sevenBuddhasGroup);
    this.scene.add(this.publicTempleGroup);
    this.scene.add(this.personalSpaceGroup);
    this.personalSpaceGroup.visible = false;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  applySkyTheme() {
    const theme = window.GAME_DATA.SKY_THEMES.find((t) => t.id === this.state.skyThemeId) || window.GAME_DATA.SKY_THEMES[0];
    if (this.currentScene === 'public_temple') {
      this.scene.background.setHex(theme.sky);
      this.scene.fog.color.setHex(theme.fog);
    }
    if (this.dirLight) {
      this.dirLight.intensity = theme.sunIntensity;
    }
  }

  // -------------------- SCENE 1: SEDA MOUNTAIN VALLEY, WHITE STUPA & 7-BUDDHA TEMPLE --------------------
  buildPublicTempleScene() {
    // 1. Seda-Inspired Sloped Mountain Valley Terrain, Winding Trail, 260+ Crimson Cabins & Snow Peaks
    const valleyTerrain = window.TempleModels3D.createSedaMountainValleyTerrain();
    this.publicTempleGroup.add(valleyTerrain);

    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xdedad0 });
    // Central Lower Flat Monastery Courtyard Plaza (z in [0, 10.6], y = 0) connecting the Red Arched Bridge & Temple Steps
    const forecourt = new THREE.Mesh(new THREE.BoxGeometry(46, 0.10, 10.6), stoneMat);
    forecourt.position.set(0, 0, 5.3);
    forecourt.receiveShadow = true;
    forecourt.name = 'walkable_ground';
    this.publicTempleGroup.add(forecourt);

    // Curved Vermilion Wooden Arch Bridge (Picture 3 Taikobashi) spanning the Temple River at (0, 0, 13.5)
    const templeBridge = window.TempleModels3D.createCurvedVermilionBridgeModel();
    templeBridge.position.set(0, 0, 13.5);
    this.publicTempleGroup.add(templeBridge);

    this.addWorldLabel(
      '🌉 Vermilion Temple Bridge',
      new THREE.Vector3(0, 3.6, 13.5),
      'public_temple',
      () => this.walkToAndTrigger(new THREE.Vector3(0, 0.2, 8.6), () => this.showToast(this.t('🌉 Crossed the Vermilion Arched Bridge to the Temple Courtyard!', '🌉 已走过朱红拱桥，来到七佛宝殿前庭！'))),
      '🌉 朱红拱桥'
    );

    // 2. Authentic Traditional 7-Buddha Palace Architecture
    this.rebuildTempleArchitecture();

    // 3. The 7 Sculpted Buddhas on the Grand Sumeru Altar
    this.rebuildSevenBuddhasAltar();

    // 4. Sacred Offering Table (Water, Flower, Scent)
    this.buildOfferingTable();

    // 5. Woven Meditation Mats (蒲团)
    this.buildMeditationMats();

    // 6. The 9 Detailed 3D Good-Virtue Environments (Home, Forest, Lake, Pavilion, Kitchen, etc.)
    this.buildGoodDeedEnvironments();

    // 7. Grand Courtyard Bronze Incense Burner, Guardian Lions & Personal Space Portal
    this.buildCourtyardMonuments();

    // 8. Sansa-Inspired Giant Bronze Temple Bell Pavilion (钟楼) & Scenic Sit/Contemplate Benches
    const bellPos = window.GAME_DATA.BELL_PAVILION_POS;
    if (bellPos) {
      const by = window.GAME_DATA.getTerrainHeight(bellPos.x, bellPos.z);
      const pavilion = window.TempleModels3D.createBellPavilionModel();
      pavilion.position.set(bellPos.x, by, bellPos.z);
      this.publicTempleGroup.add(pavilion);
      this.bellPavilion = pavilion;
    }

    (window.GAME_DATA.SCENIC_SEATS || []).forEach((seat) => {
      const sy = window.GAME_DATA.getTerrainHeight(seat.x, seat.z);
      const seatMesh = window.TempleModels3D.createScenicBenchAndPier(seat);
      seatMesh.position.set(seat.x, sy, seat.z);
      seatMesh.rotation.y = seat.rotY;
      this.publicTempleGroup.add(seatMesh);
    });
  }

  // -------------------- AUTHENTIC CHINESE PALACE TEMPLE ARCHITECTURE --------------------
  rebuildTempleArchitecture() {
    while (this.templeBuildingGroup.children.length > 0) {
      this.templeBuildingGroup.remove(this.templeBuildingGroup.children[0]);
    }

    const style = window.GAME_DATA.TEMPLE_STYLES.find((s) => s.id === this.state.templeStyleId) || window.GAME_DATA.TEMPLE_STYLES[0];
    const marbleMat = new THREE.MeshStandardMaterial({ color: style.marbleColor, roughness: 0.4, metalness: 0.05 });
    const wallMat = new THREE.MeshStandardMaterial({ color: style.wallColor, roughness: 0.6 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: style.pillarColor, roughness: 0.32, metalness: 0.15 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.82, roughness: 0.22 });
    const roofTileTex = window.TempleModels3D.createRoofTileTexture(style.roofColor);
    const roofMat = new THREE.MeshStandardMaterial({ map: roofTileTex, roughness: 0.35, metalness: 0.25 });

    // 1. Broad Pale Grey Stone Courtyard Platform & Approach Steps (matching Picture 4 Plaza!)
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(38, 0.45, 28), marbleMat);
    terrace.position.set(0, 0.1, -13);
    terrace.receiveShadow = true;
    terrace.name = 'walkable_ground';
    this.templeBuildingGroup.add(terrace);

    const frontApron = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.25, 2.2), marbleMat);
    frontApron.position.set(0, 0.08, 1.4);
    frontApron.name = 'walkable_ground';
    this.templeBuildingGroup.add(frontApron);

    const interiorFloor = new THREE.Mesh(
      new THREE.BoxGeometry(34.5, 0.12, 25.5),
      new THREE.MeshStandardMaterial({ color: 0xc9934b, roughness: 0.35 })
    );
    interiorFloor.position.set(0, 0.34, -13);
    interiorFloor.receiveShadow = true;
    interiorFloor.name = 'walkable_ground';
    this.templeBuildingGroup.add(interiorFloor);

    // Royal Crimson & Gold Lotus Carpet Runner leading to the 7 Buddhas
    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 0.14, 19),
      new THREE.MeshLambertMaterial({ color: 0x8e1b1b })
    );
    carpet.position.set(0, 0.35, -10.5);
    carpet.name = 'walkable_ground';
    this.templeBuildingGroup.add(carpet);

    // Low Dark Metal/Stone Perimeter Courtyard Railing (matching Picture 4 front courtyard fencing!)
    const darkFenceMat = new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.55, roughness: 0.5 });
    [-16.5, -12.5, -8.5, -4.5, 4.5, 8.5, 12.5, 16.5].forEach((bx) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.16), darkFenceMat);
      post.position.set(bx, 0.52, 2.2);
      this.templeBuildingGroup.add(post);
    });
    [-10.5, 10.5].forEach((fx) => {
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.08, 0.1), darkFenceMat);
      topRail.position.set(fx, 0.98, 2.2);
      const midRail = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.06, 0.08), darkFenceMat);
      midRail.position.set(fx, 0.52, 2.2);
      this.templeBuildingGroup.add(topRail, midRail);
    });

    // 2. Palace Walls, Grey-Brick Lower Skirt & Red Wooden Lattice Windows (Picture 4!)
    const greyBrickMat = new THREE.MeshStandardMaterial({ color: 0x80858a, roughness: 0.78 });
    const darkLatticeMat = new THREE.MeshLambertMaterial({ color: 0x4b1212 });
    const dougongTealMat = new THREE.MeshLambertMaterial({ color: 0x2a6f75 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(35, 9.6, 0.8), wallMat);
    backWall.position.set(0, 5.1, -26);
    backWall.castShadow = true;
    this.templeBuildingGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.2, 26), wallMat);
    leftWall.position.set(-17.2, 4.9, -13);
    const rightWall = leftWall.clone();
    rightWall.position.set(17.2, 4.9, -13);
    this.templeBuildingGroup.add(leftWall, rightWall);

    // Front Cutaway Group (Front facade wall, front lattice windows, front eaves & plaque) — auto-hidden when camera/player is inside Prayer Hall!
    this.templeFrontCutawayGroup = new THREE.Group();
    this.templeBuildingGroup.add(this.templeFrontCutawayGroup);

    // Front Crimson Wooden Facade + Grey Brick Lower Wall Skirt (裙墙)
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(12.2, 8.2, 0.6), wallMat);
    frontWallL.position.set(-10.6, 4.4, 0);
    const frontWallR = frontWallL.clone();
    frontWallR.position.set(10.6, 4.4, 0);
    const skirtL = new THREE.Mesh(new THREE.BoxGeometry(12.3, 2.1, 0.66), greyBrickMat);
    skirtL.position.set(-10.6, 1.35, 0);
    const skirtR = skirtL.clone();
    skirtR.position.set(10.6, 1.35, 0);
    this.templeFrontCutawayGroup.add(frontWallL, frontWallR, skirtL, skirtR);

    // Traditional Wooden Lattice Grid Windows along Left & Right Front Bays (Picture 4!)
    [-14.2, -10.6, -7.0, 7.0, 10.6, 14.2].forEach((wx) => {
      const winPanel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.8, 0.14), darkLatticeMat);
      winPanel.position.set(wx, 4.45, 0.34);
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.85, 3.95, 0.08), pillarMat);
      winFrame.position.set(wx, 4.45, 0.28);
      this.templeFrontCutawayGroup.add(winFrame, winPanel);
      // Crisp wooden muntin bars
      [-0.7, 0, 0.7].forEach((gx) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.7, 0.18), pillarMat);
        bar.position.set(wx + gx, 4.45, 0.35);
        this.templeFrontCutawayGroup.add(bar);
      });
    });

    // Flanking Lower Grey-Brick & Clay-Tile Side Wings (耳房 - Picture 4 silhouette!)
    [-21.2, 21.2].forEach((sx) => {
      const wingWall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.2, 11.0), greyBrickMat);
      wingWall.position.set(sx, 2.6, -5.2);
      wingWall.castShadow = true;
      const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.7, 12.2), roofMat);
      wingRoof.position.set(sx, 5.5, -5.2);
      const wingRidge = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.38, 0.42), greyBrickMat);
      wingRidge.position.set(sx, 6.0, -5.2);
      this.templeBuildingGroup.add(wingWall, wingRoof, wingRidge);
    });

    // Colonnade Pillars with Stone Drum Bases & Intricate Painted Dou-gong Bracket Clusters (斗拱)
    const pillarCoords = [
      [-16.5, 0.9], [-11, 0.9], [-4.2, 0.9], [4.2, 0.9], [11, 0.9], [16.5, 0.9],
      [-16.5, -8], [16.5, -8], [-16.5, -16], [16.5, -16], [-16.5, -25.5], [16.5, -25.5]
    ];
    pillarCoords.forEach(([px, pz]) => {
      const pDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.5, 16), marbleMat);
      pDrum.position.set(px, 0.55, pz);
      const pShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.50, 8.6, 18), pillarMat);
      pShaft.position.set(px, 4.7, pz);
      pShaft.castShadow = true;
      const dgRed = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 1.15), pillarMat);
      dgRed.position.set(px, 8.85, pz);
      const dgTeal = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.36, 1.45), dougongTealMat);
      dgTeal.position.set(px, 9.22, pz);
      const dgTop = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.28, 1.68), goldMat);
      dgTop.position.set(px, 9.52, pz);
      const targetParent = pz > 0 ? this.templeFrontCutawayGroup : this.templeBuildingGroup;
      targetParent.add(pDrum, pShaft, dgRed, dgTeal, dgTop);
    });

    // 3. Historic Xieshan Grey-Tile Palace Roof with Chiwen Scroll Finials (鸱吻 - matching Picture 4!)
    const frontEaveBeam = new THREE.Mesh(new THREE.BoxGeometry(36.5, 1.0, 1.4), pillarMat);
    frontEaveBeam.position.set(0, 9.0, 0.7);
    const paintedArchitrave = new THREE.Mesh(new THREE.BoxGeometry(36.6, 0.52, 1.5), dougongTealMat);
    paintedArchitrave.position.set(0, 8.35, 0.72);
    this.templeFrontCutawayGroup.add(frontEaveBeam, paintedArchitrave);

    const ridgeStoneMat = new THREE.MeshStandardMaterial({ color: 0x767b80, roughness: 0.5 });

    // Front sloping grey clay-tile eave
    const lowerFrontRoof = new THREE.Mesh(new THREE.BoxGeometry(38.8, 0.85, 5.2), roofMat);
    lowerFrontRoof.position.set(0, 10.2, 1.3);
    lowerFrontRoof.rotation.x = 0.26;
    lowerFrontRoof.castShadow = true;
    this.templeFrontCutawayGroup.add(lowerFrontRoof);

    // Xieshan Upper Gable Roof + Long Grey Main Ridge + Curled Chiwen Dragon-Scroll Finials (Picture 4!)
    const upperFrontRoof = new THREE.Mesh(new THREE.BoxGeometry(32.0, 1.05, 5.2), roofMat);
    upperFrontRoof.position.set(0, 12.1, 0.5);
    upperFrontRoof.rotation.x = 0.24;
    this.templeFrontCutawayGroup.add(upperFrontRoof);

    const mainRoofRidge = new THREE.Mesh(new THREE.BoxGeometry(31.8, 0.75, 0.65), ridgeStoneMat);
    mainRoofRidge.position.set(0, 13.0, -0.45);
    this.templeFrontCutawayGroup.add(mainRoofRidge);

    // Curled Carved Chiwen Finials at Both Ends of Main Roof Ridge + Sweeping Corner Beasts (Picture 4!)
    [-15.9, 15.9].forEach((cx) => {
      const chiwen = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.26, 8, 14, Math.PI * 1.45), ridgeStoneMat);
      chiwen.position.set(cx, 13.75, -0.45);
      chiwen.rotation.y = cx < 0 ? 0.25 : -0.25;
      chiwen.rotation.z = cx < 0 ? -0.4 : 2.5;
      this.templeFrontCutawayGroup.add(chiwen);
    });
    [-19.2, 19.2].forEach((ex) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.2, 8), roofMat);
      horn.position.set(ex, 10.65, 3.2);
      horn.rotation.z = ex < 0 ? 0.68 : -0.68;
      horn.rotation.x = -0.35;
      const beast = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), ridgeStoneMat);
      beast.position.set(ex * 0.96, 11.2, 2.9);
      this.templeFrontCutawayGroup.add(horn, beast);
    });

    // Back Sanctuary Roof over the 7 Buddhas (keeping central atrium clear for unobstructed 3rd-person view!)
    const backSanctuaryRoof = new THREE.Mesh(new THREE.BoxGeometry(39, 1.8, 6.5), roofMat);
    backSanctuaryRoof.position.set(0, 10.4, -24.5);
    backSanctuaryRoof.rotation.x = 0.18;
    const backRidge = new THREE.Mesh(new THREE.BoxGeometry(38.8, 0.65, 0.55), ridgeStoneMat);
    backRidge.position.set(0, 11.5, -25.5);
    this.templeBuildingGroup.add(backSanctuaryRoof, backRidge);

    // 4. Royal Cobalt-Blue Name Plaque ("奉国七佛寺") & Twin Vertical Blue Couplets (matching Picture 4!)
    const plaqueTex = window.TempleModels3D.createPlaqueTexture('奉国七佛寺', 'SEVEN BUDDHAS TEMPLE');
    const plaqueMesh = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 2.3, 0.35),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaqueMesh.position.set(0, 9.25, 2.3);
    plaqueMesh.rotation.x = 0.10;
    this.templeFrontCutawayGroup.add(plaqueMesh);

    const coupletL = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 4.8, 0.16),
      new THREE.MeshBasicMaterial({ map: window.TempleModels3D.createCoupletTexture(['慈', '悲', '喜', '舍', '登', '彼', '岸']) })
    );
    coupletL.position.set(-4.2, 4.7, 1.48);
    const coupletR = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 4.8, 0.16),
      new THREE.MeshBasicMaterial({ map: window.TempleModels3D.createCoupletTexture(['清', '净', '庄', '严', '见', '如', '来']) })
    );
    coupletR.position.set(4.2, 4.7, 1.48);
    this.templeFrontCutawayGroup.add(coupletL, coupletR);

    // 5. Grand Double Palace Doors with Golden Door-Studs (铺首门钉)
    this.doorLeftPivot = new THREE.Group();
    this.doorLeftPivot.position.set(-4.0, 0.35, 0);
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(3.95, 7.6, 0.36), pillarMat);
    doorL.position.set(1.975, 3.8, 0);
    const doorFrameL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.2, 0.42), goldMat);
    doorFrameL.position.set(1.975, 5.2, 0);
    this.doorLeftPivot.add(doorL, doorFrameL);
    this.templeBuildingGroup.add(this.doorLeftPivot);

    this.doorRightPivot = new THREE.Group();
    this.doorRightPivot.position.set(4.0, 0.35, 0);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(3.95, 7.6, 0.36), pillarMat);
    doorR.position.set(-1.975, 3.8, 0);
    const doorFrameR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.2, 0.42), goldMat);
    doorFrameR.position.set(-1.975, 5.2, 0);
    this.doorRightPivot.add(doorR, doorFrameR);
    this.templeBuildingGroup.add(this.doorRightPivot);

    // 6. Hanging Silk Dhvaja Banners (庄严幢幡) & Palace Lanterns inside the Hall
    [-12, -6.5, 6.5, 12].forEach((lx) => {
      const lantern = this.createLanternMesh();
      lantern.position.set(lx, 7.2, -6);
      this.templeBuildingGroup.add(lantern);

      // Embroidered Silk Hanging Banner (幢幡)
      const banner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 4.2, 8),
        new THREE.MeshLambertMaterial({ color: 0xe9c46a })
      );
      banner.position.set(lx, 5.8, -14.5);
      const bannerTop = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.55, 8), new THREE.MeshLambertMaterial({ color: 0x9b2226 }));
      bannerTop.position.set(lx, 8.0, -14.5);
      this.templeBuildingGroup.add(banner, bannerTop);
    });
  }

  createLanternMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xff4d3b })
    );
    body.scale.set(1, 1.28, 1);
    const capTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.7 })
    );
    capTop.position.y = 0.72;
    const tassel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.14, 0.65, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    tassel.position.y = -0.9;
    g.add(body, capTop, tassel);
    return g;
  }

  // -------------------- THE 7 SCULPTED BUDDHAS ON THE GRAND ALTAR --------------------
  rebuildSevenBuddhasAltar() {
    while (this.sevenBuddhasGroup.children.length > 0) {
      this.sevenBuddhasGroup.remove(this.sevenBuddhasGroup.children[0]);
    }
    this.buddhaStatues = [];

    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0.35, -21.8);

    // Ornate 2-Tiered Carved Sumeru Altar Platform (须弥座大佛坛)
    const basePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(30.5, 1.55, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x6b1414, roughness: 0.45 })
    );
    basePlatform.position.set(0, 0.78, 0);
    basePlatform.receiveShadow = true;
    altarGroup.add(basePlatform);

    const goldCornice = new THREE.Mesh(
      new THREE.BoxGeometry(31.0, 0.28, 4.85),
      new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.8, roughness: 0.22 })
    );
    goldCornice.position.set(0, 1.58, 0);
    altarGroup.add(goldCornice);

    const matPreset = window.GAME_DATA.BUDDHA_MATERIALS.find((m) => m.id === this.state.buddhaMatId) || window.GAME_DATA.BUDDHA_MATERIALS[0];
    const spacing = 4.1;

    window.GAME_DATA.SEVEN_BUDDHAS.forEach((bData, idx) => {
      const bx = (idx - 3) * spacing;
      const statue = window.TempleModels3D.createDetailedBuddhaStatue(bData, matPreset);
      statue.position.set(bx, 1.65, 0);
      statue.traverse((c) => {
        c.userData.buddhaIdx = idx;
      });
      altarGroup.add(statue);

      this.buddhaStatues.push({
        idx,
        bx,
        data: bData,
        mesh: statue,
        pos: new THREE.Vector3(bx, 0, -21.8),
        worldPos: new THREE.Vector3(bx, 0, -21.8)
      });
    });

    // Golden Blessing Spotlight Beam (shines on each Buddha 1..7 during Bows!)
    const spotBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 2.2, 7.5, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe66d,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      })
    );
    spotBeam.position.set(0, 4.8, 0.5);
    spotBeam.visible = false;
    altarGroup.add(spotBeam);
    this.buddhaSpotlight = spotBeam;

    // Ensure labels are added once (Formatted cleanly as "1. 毗婆尸佛" .. "7. 释迦牟尼佛")
    if (!this._buddhaLabelsCreated) {
      this._buddhaLabelsCreated = true;
      window.GAME_DATA.SEVEN_BUDDHAS.forEach((bData, idx) => {
        const bx = (idx - 3) * spacing;
        const labelEl = this.addWorldLabel(
          `🙏 ${idx + 1}. ${bData.cnName || bData.name}`,
          new THREE.Vector3(bx, idx === 3 ? 8.8 : 7.8, -21.8),
          'public_temple',
          () => this.bowToSpecificBuddhaQuest(idx)
        );
        labelEl.classList.add('buddha-label');
        labelEl.id = `buddha-world-label-${idx}`;
      });
    }

    this.sevenBuddhasGroup.add(altarGroup);
  }

  // -------------------- COURTYARD MONUMENTS (GUARDIAN LIONS & GRAND INCENSE BURNER) --------------------
  buildCourtyardMonuments() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xede6d6, roughness: 0.45 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x8c6239, metalness: 0.78, roughness: 0.32 });

    // Pair of Majestic Sculpted Stone Guardian Lions flanking the Courtyard (守门石狮 - Picture 4!)
    [-6.8, 6.8].forEach((lx) => {
      const lionGroup = window.TempleModels3D.createGuardianLionModel(lx);
      lionGroup.position.set(lx, 0, 5.4);
      this.publicTempleGroup.add(lionGroup);
    });

    // Grand Courtyard Bronze Tripod Censer (大雄宝鼎香炉) at (0, 0, 8.2)
    const censerGroup = new THREE.Group();
    censerGroup.position.set(0, 0, 8.2);
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.35, 16), stoneMat);
    cBase.position.y = 0.175;
    const cBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.95, 1.35, 20), bronzeMat);
    cBody.position.y = 1.15;
    const cRoof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.9, 8), bronzeMat);
    cRoof.position.y = 2.45;
    censerGroup.add(cBase, cBody, cRoof);
    this.publicTempleGroup.add(censerGroup);

    // Label on the Grand Gate + Teleport to Starting Point in front of Prayer Hall
    this.addWorldLabel(
      '⛩️ 7-Buddha Prayer Hall',
      new THREE.Vector3(0, 6.2, 0.8),
      'public_temple',
      () => this.handleGateInteraction(),
      '⛩️ 七佛宝殿'
    );
    this.addWorldLabel(
      '⛰️ Teleport to Starting Point',
      new THREE.Vector3(0, 3.0, 5.2),
      'public_temple',
      () => this.teleportToStartingPoint(),
      '⛰️ 传送回起点'
    );

    // 1. Wisdom Bridge across the East River (builds when quest 'build_wisdom_bridge' finishes)
    this.rebuildWisdomBridge();

    // 2. 7 White Stupas (七座白佛塔) along the Path to Mount Wutai Summit 文殊殿
    this.stupaList = [];
    this.stupaLabels = [];
    (window.GAME_DATA.WENSHU_STUPAS || []).forEach((sp, idx) => {
      const sy = window.GAME_DATA.getTerrainHeight(sp.x, sp.z);
      const mesh = window.TempleModels3D.createWhiteStupaModel(idx + 1);
      const sc = sp.scale || 0.42;
      mesh.scale.set(sc, sc, sc);
      mesh.position.set(sp.x, sy, sp.z);
      mesh.traverse((child) => {
        child.userData.isStupa = true;
        child.userData.stupaIdx = idx;
      });
      this.publicTempleGroup.add(mesh);
      if (idx === 0) this.stupaMesh = mesh;

      const stupaPosVec = new THREE.Vector3(sp.x, sy, sp.z);
      this.stupaList.push({ idx, data: sp, pos: stupaPosVec, mesh });

      const isDone = !!(this.state.circledStupas && this.state.circledStupas[idx]);
      const lbl = this.addWorldLabel(
        `${isDone ? '✅' : '☸️'} ${sp.label}`,
        new THREE.Vector3(sp.x, sy + 4.4, sp.z),
        'public_temple',
        () => this.startClockwiseStupaWalk(idx)
      );
      if (isDone) lbl.classList.add('completed');
      this.stupaLabels.push(lbl);
    });

    // 3. Sutra Book Reading & Chair Stops along the Mount Wutai Ascent
    this.sutraStations = [];
    (window.GAME_DATA.SUTRA_BOOKS || []).forEach((bk) => {
      const by = window.GAME_DATA.getTerrainHeight(bk.x, bk.z);
      const station = window.TempleModels3D.createSutraReadingStationModel(bk);
      station.position.set(bk.x, by, bk.z);
      station.rotation.y = -Math.PI * 0.25;
      station.traverse((child) => {
        child.userData.sutraId = bk.id;
      });
      this.publicTempleGroup.add(station);

      const isRead = !!(this.state.readSutras && this.state.readSutras[bk.id]);
      const lbl = this.addWorldLabel(
        `${isRead ? '✅' : '📖'} ${bk.title}`,
        new THREE.Vector3(bk.x, by + 2.8, bk.z),
        'public_temple',
        () => this.visitAndReadSutra(bk.id)
      );
      if (isRead) lbl.classList.add('completed');
      this.sutraStations.push({ book: bk, group: station, labelEl: lbl, pos: new THREE.Vector3(bk.x, by, bk.z) });
    });

    // 4. Mount Wutai Summit 文殊殿 (Manjushri Hall, Blue Lion, 20 Meditation Seats, Chill Sutra Tea Corner & Offerings Altar)
    const wenshuY = 16.5;
    this.wenshuHallGroup = window.TempleModels3D.createManjushriHallAndStatueModel();
    this.wenshuHallGroup.position.set(124.0, wenshuY, 4.0);
    const wo = this.state.wenshuOfferings || {};
    if (this.wenshuHallGroup.userData && this.wenshuHallGroup.userData.offeringMeshes) {
      ['water', 'flower', 'scent'].forEach((k) => {
        const grp = this.wenshuHallGroup.userData.offeringMeshes[k];
        if (grp) grp.visible = !!wo[k];
      });
    }
    this.wenshuSeats = ((this.wenshuHallGroup.userData && this.wenshuHallGroup.userData.seatPositions) || []).map((sp) => ({
      idx: sp.idx,
      x: 124.0 + sp.lx,
      y: wenshuY + 0.42,
      z: 4.0 + sp.lz,
      mesh: sp.mesh
    }));
    this.publicTempleGroup.add(this.wenshuHallGroup);

    this.addWorldLabel(
      '🦁 Manjushri Hall',
      new THREE.Vector3(115.0, wenshuY + 7.2, 4.0),
      'public_temple',
      () => this.teleportToWenshuHallInterior(),
      '🦁 五台山 · 文殊殿'
    );
    this.addWorldLabel(
      '🧘 20 Meditation Seats',
      new THREE.Vector3(119.8, wenshuY + 1.9, 4.0),
      'public_temple',
      () => this.handlePrayerHallAction(1),
      '🧘 文殊殿禅坐垫 (20座)'
    );
    this.addWorldLabel(
      '🪔 Manjushri Offering Table',
      new THREE.Vector3(126.2, wenshuY + 2.8, 4.0),
      'public_temple',
      () => this.showToast(this.t(
        '🙏 Use 3. Offer Water, 4. Offer Flower, or 5. Offer Scent from the Hall action bar below (+10 VP each)',
        '🙏 请在下方文殊殿动作栏选择：3. 佛前供水、4. 佛前供花 或 5. 佛前供香（每项 +10 功德）'
      )),
      '🪔 文殊殿供佛案桌'
    );
    this.addWorldLabel(
      '🦁 Manjushri Bodhisattva',
      new THREE.Vector3(129.4, wenshuY + 6.0, 4.0),
      'public_temple',
      () => this.bowToManjushriQuest(),
      '🦁 大智文殊菩萨'
    );
    this.addWorldLabel(
      '⛰️ Teleport to Starting Point',
      new THREE.Vector3(113.5, wenshuY + 3.0, 4.0),
      'public_temple',
      () => this.teleportToStartingPoint(),
      '⛰️ 传送回起点'
    );

    // 5. Floating White Summit Clouds around Mount Wutai Peak
    this.summitClouds = window.TempleModels3D.createSummitFloatingClouds();
    this.publicTempleGroup.add(this.summitClouds);

    // Water-Moon Mirror Pond Label
    this.addWorldLabel(
      '🌙 Water-Moon Mirror Pond',
      new THREE.Vector3(18.0, 1.8, 6.5),
      'public_temple',
      () => {
        this.spawnSkyLantern(new THREE.Vector3(18.0, 0.5, 6.5));
        window.templeAudio.playMeditationTone();
        this.showToast(this.t('🌙 Like the full moon reflected in calm water, a peaceful mind reflects wisdom and kindness.', '🌙 水清月现，心静则生慈悲与光明智慧。'));
      },
      '🌙 水月明镜池'
    );

    // Scalable Phase 2 Portal: Player's Personal Space Portal (South-West Forecourt edge, keeping West Avenue open)
    const portalGroup = new THREE.Group();
    portalGroup.position.set(-18.5, 0, 10.2);
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.2, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.8 })
    );
    arch.position.y = 1.9;
    const portalDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.55, 24),
      new THREE.MeshBasicMaterial({ color: 0x80ed99, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    portalDisc.position.y = 1.9;
    portalGroup.add(arch, portalDisc);
    this.publicTempleGroup.add(portalGroup);

    this.addWorldLabel(
      '🌱 Personal Sanctuary Space',
      new THREE.Vector3(-18.5, 4.1, 10.2),
      'public_temple',
      () => this.switchScene('personal_space'),
      '🌱 个人清净道场'
    );

    // 6. West Longevity Sanctuary Avenue: Flower Gardens (百花善园), 3 Lotus Ponds (三座莲花池) & 长寿殿 (Longevity Hall)
    const westWalkway = window.TempleModels3D.createWestGardenWalkwayModel();
    this.publicTempleGroup.add(westWalkway);

    this.flowerGardenStations = [];
    (window.GAME_DATA.CHANGSHOU_FLOWER_GARDENS || []).forEach((gd, idx) => {
      const gy = window.GAME_DATA.getTerrainHeight(gd.x, gd.z);
      const mesh = window.TempleModels3D.createWestFlowerGardenBedModel(gd, idx);
      mesh.position.set(gd.x, gy, gd.z);
      const isPlanted = !!(this.state.plantedFlowerGardens && this.state.plantedFlowerGardens[gd.id]);
      if (mesh.userData.unplantedGroup) mesh.userData.unplantedGroup.visible = !isPlanted;
      if (mesh.userData.plantedGroup) mesh.userData.plantedGroup.visible = isPlanted;
      this.publicTempleGroup.add(mesh);

      const enText = isPlanted ? `✅ ${gd.name}` : `🌸 ${gd.name}`;
      const zhText = isPlanted ? `✅ ${gd.zhName}` : `🌸 ${gd.zhName}`;
      const lbl = this.addWorldLabel(enText, new THREE.Vector3(gd.x, gy + 2.3, gd.z), 'public_temple', () => this.plantFlowerGarden(gd.id), zhText);
      if (isPlanted) lbl.classList.add('completed');
      this.flowerGardenStations.push({ garden: gd, group: mesh, labelEl: lbl });
    });

    this.lotusPondStations = [];
    (window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || []).forEach((pd) => {
      const py = window.GAME_DATA.getTerrainHeight(pd.x, pd.z);
      const mesh = window.TempleModels3D.createWestLotusPondModel(pd);
      mesh.position.set(pd.x, py, pd.z);
      const isPlanted = !!(this.state.plantedLotusPonds && this.state.plantedLotusPonds[pd.id]);
      if (mesh.userData.unplantedGroup) mesh.userData.unplantedGroup.visible = !isPlanted;
      if (mesh.userData.plantedGroup) mesh.userData.plantedGroup.visible = isPlanted;
      this.publicTempleGroup.add(mesh);

      const enText = isPlanted ? `✅ ${pd.name}` : `🪷 ${pd.name}`;
      const zhText = isPlanted ? `✅ ${pd.zhName}` : `🪷 ${pd.zhName}`;
      const lbl = this.addWorldLabel(enText, new THREE.Vector3(pd.x, py + 2.4, pd.z), 'public_temple', () => this.plantLotusPond(pd.id), zhText);
      if (isPlanted) lbl.classList.add('completed');
      this.lotusPondStations.push({ pond: pd, group: mesh, labelEl: lbl });
    });

    // 长寿殿 (Longevity Hall) atop West Longevity Mountain Summit (y = 16.5, matching 文殊殿) facing East (+X)
    const changshouY = 16.5;
    this.changshouHallGroup = window.TempleModels3D.createChangshouHallAndStatueModel();
    this.changshouHallGroup.position.set(-96.0, changshouY, 4.0);
    const co = this.state.changshouOfferings || {};
    if (this.changshouHallGroup.userData && this.changshouHallGroup.userData.offeringMeshes) {
      ['water', 'flower', 'scent'].forEach((k) => {
        const grp = this.changshouHallGroup.userData.offeringMeshes[k];
        if (grp) grp.visible = !!co[k];
      });
    }
    this.changshouSeats = ((this.changshouHallGroup.userData && this.changshouHallGroup.userData.seatPositions) || []).map((sp) => ({
      idx: sp.idx,
      x: -96.0 + sp.lx,
      y: changshouY + 0.42,
      z: 4.0 + sp.lz,
      mesh: sp.mesh
    }));
    this.publicTempleGroup.add(this.changshouHallGroup);

    this.addWorldLabel(
      '🏺 Longevity Hall (长寿殿)',
      new THREE.Vector3(-87.0, changshouY + 7.2, 4.0),
      'public_temple',
      () => this.teleportToChangshouHallInterior(),
      '🏺 长寿山巅 · 长寿殿'
    );
    this.addWorldLabel(
      '🧘 20 Meditation Mats',
      new THREE.Vector3(-91.8, changshouY + 1.9, 4.0),
      'public_temple',
      () => this.handlePrayerHallAction(1),
      '🧘 长寿殿禅坐垫 (20座)'
    );
    this.addWorldLabel(
      '🪔 Changshou Offering Table',
      new THREE.Vector3(-98.2, changshouY + 2.8, 4.0),
      'public_temple',
      () => this.showToast(this.t(
        '🙏 Use 3. Offer Water, 4. Offer Flower, or 5. Offer Scent from the Hall action bar below (+10 VP each)',
        '🙏 请在下方长寿殿动作栏选择：3. 佛前供水、4. 佛前供花 或 5. 佛前供香（每项 +10 功德）'
      )),
      '🪔 长寿殿供佛案桌'
    );
    this.addWorldLabel(
      '🏺 Amitayus · Longevity Buddha',
      new THREE.Vector3(-101.4, changshouY + 6.0, 4.0),
      'public_temple',
      () => this.bowToChangshouQuest(),
      '🏺 无量寿智如来 · 长寿佛'
    );
    this.addWorldLabel(
      '⛰️ Teleport to Starting Point',
      new THREE.Vector3(-85.5, changshouY + 3.0, 4.0),
      'public_temple',
      () => this.teleportToStartingPoint(),
      '⛰️ 传送回起点'
    );
  }

  // -------------------- OFFERING TABLE (CENTER: 7 GOLDEN WATER CUPS, LEFT: FLOWER, RIGHT: CELADON LOTUS INCENSE) --------------------
  buildOfferingTable() {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0.35, -15.4);

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 1.3, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x7b1818, roughness: 0.4 })
    );
    tableTop.position.y = 0.65;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    const tableTrim = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 0.2, 2.65),
      new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.8, roughness: 0.25 })
    );
    tableTrim.position.y = 1.32;
    tableGroup.add(tableTrim);

    // 1. CENTER: 7 Ornate Golden Pedestal Water Cups (七杯供水 — Modeled after Photo 1!)
    // Flared pedestal foot + rounded embossed golden cup with 4 diamond relief medallions + wide flared rim + clear water
    const waterGroup = new THREE.Group();
    const goldCupMat = new THREE.MeshStandardMaterial({
      color: 0xe8b944,
      emissive: 0x2c1d00,
      metalness: 0.88,
      roughness: 0.22
    });
    const goldReliefMat = new THREE.MeshStandardMaterial({
      color: 0xffd966,
      emissive: 0x3b2600,
      metalness: 0.92,
      roughness: 0.16
    });
    const pureWaterMat = new THREE.MeshBasicMaterial({
      color: 0x8be9fd,
      transparent: true,
      opacity: 0.85
    });

    [-2.4, -1.6, -0.8, 0.0, 0.8, 1.6, 2.4].forEach((wx) => {
      const cup = new THREE.Group();
      cup.position.set(wx, 1.42, 0.15);

      // Tapered Flared Pedestal Foot (高足底座)
      const footBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.14, 20), goldCupMat);
      footBase.position.y = 0.07;
      const footBeadRing = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.018, 8, 20), goldReliefMat);
      footBeadRing.rotation.x = Math.PI / 2;
      footBeadRing.position.y = 0.02;
      const stemRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.016, 8, 20), goldReliefMat);
      stemRing.rotation.x = Math.PI / 2;
      stemRing.position.y = 0.14;
      cup.add(footBase, footBeadRing, stemRing);

      // Rounded Golden Bowl Belly (金盏杯身)
      const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.125, 0.24, 24), goldCupMat);
      belly.position.y = 0.26;
      cup.add(belly);

      // 4 Diamond-Shaped Embossed Relief Medallions around the Bowl Belly (菱形浮雕宝相花纹, matching Photo 1)
      for (let d = 0; d < 4; d++) {
        const ang = (d / 4) * Math.PI * 2;
        const medallion = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.028), goldReliefMat);
        medallion.position.set(Math.cos(ang) * 0.18, 0.26, Math.sin(ang) * 0.18);
        medallion.rotation.y = -ang + Math.PI / 2;
        medallion.rotation.z = Math.PI / 4; // 45-degree diamond orientation
        cup.add(medallion);
      }

      // Wide Flared Lip Rim at Top (敞口鎏金边)
      const flaredLip = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.225, 0.045, 24), goldReliefMat);
      flaredLip.position.y = 0.39;
      const rimTorus = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.018, 10, 24), goldReliefMat);
      rimTorus.rotation.x = Math.PI / 2;
      rimTorus.position.y = 0.41;
      cup.add(flaredLip, rimTorus);

      // Pure Shimmering Water Surface Inside Cup
      const waterSurface = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.015, 20), pureWaterMat);
      waterSurface.position.y = 0.385;
      cup.add(waterSurface);

      waterGroup.add(cup);
    });
    waterGroup.visible = !!this.state.offeringsMade.water;
    this.offeringMeshes.water = waterGroup;
    tableGroup.add(waterGroup);

    // 2. LEFT OF THE WATER: Flower Offering (供妙莲花 — Placed on the LEFT of the 7 water cups!)
    const flowerGroup = new THREE.Group();
    [-4.7, -3.7].forEach((fx) => {
      const vaseGroup = new THREE.Group();
      vaseGroup.position.set(fx, 1.42, 0.0);

      // White Jade Vase
      const vase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.28, 0.58, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.2 })
      );
      vase.position.y = 0.29;
      vaseGroup.add(vase);

      // Green Lotus Leaves
      for (let lf = 0; lf < 5; lf++) {
        const ang = (lf / 5) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.42, 6),
          new THREE.MeshLambertMaterial({ color: 0x2e8b57 })
        );
        leaf.position.set(Math.cos(ang) * 0.22, 0.65, Math.sin(ang) * 0.22);
        leaf.rotation.z = -Math.cos(ang) * 0.55;
        leaf.rotation.x = Math.sin(ang) * 0.55;
        vaseGroup.add(leaf);
      }

      // Blooming Multi-Petal Pink & Golden Lotus Flowers
      const lotusCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0xffd166 })
      );
      lotusCore.position.y = 0.82;
      vaseGroup.add(lotusCore);

      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2;
        const petal = new THREE.Mesh(
          new THREE.ConeGeometry(0.14, 0.42, 6),
          new THREE.MeshLambertMaterial({ color: 0xff758f })
        );
        petal.position.set(Math.cos(ang) * 0.22, 0.82, Math.sin(ang) * 0.22);
        petal.rotation.z = -Math.cos(ang) * 0.42;
        petal.rotation.x = Math.sin(ang) * 0.42;
        vaseGroup.add(petal);
      }

      flowerGroup.add(vaseGroup);
    });
    flowerGroup.visible = !!this.state.offeringsMade.flower;
    this.offeringMeshes.flower = flowerGroup;
    tableGroup.add(flowerGroup);

    // 3. RIGHT OF THE WATER: Celadon Lotus Incense Holder & Upright Incense Stick (供香 — Modeled after Photo 2!)
    const scentGroup = new THREE.Group();
    scentGroup.position.set(4.1, 1.42, 0.1);

    // Smooth Celadon Green Porcelain Glaze Material (青瓷釉色, matching Photo 2)
    const celadonMat = new THREE.MeshStandardMaterial({
      color: 0x97c1a9,
      roughness: 0.2,
      metalness: 0.08
    });

    // Flat Lotus Base Disc
    const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.1, 20), celadonMat);
    lotusBase.position.y = 0.05;
    scentGroup.add(lotusBase);

    // 3 Concentric Rings of Pointed Celadon Lotus Petals (30 sculpted celadon petals, matching Photo 2!)
    const ringConfigs = [
      { count: 8, radius: 0.16, tilt: 0.35, h: 0.34, r: 0.095, y: 0.18 },
      { count: 10, radius: 0.30, tilt: 0.68, h: 0.42, r: 0.11, y: 0.16 },
      { count: 12, radius: 0.44, tilt: 1.05, h: 0.46, r: 0.115, y: 0.12 }
    ];
    ringConfigs.forEach((rc, rIdx) => {
      for (let i = 0; i < rc.count; i++) {
        const ang = (i / rc.count) * Math.PI * 2 + rIdx * 0.25;
        const petal = new THREE.Mesh(new THREE.ConeGeometry(rc.r, rc.h, 5), celadonMat);
        petal.scale.set(1.0, 1.0, 0.52); // Flattened pointed lotus petal
        petal.position.set(Math.cos(ang) * rc.radius, rc.y, Math.sin(ang) * rc.radius);
        // Tilt outward from center
        petal.rotation.y = -ang + Math.PI / 2;
        petal.rotation.x = rc.tilt;
        scentGroup.add(petal);
      }
    });

    // Single Upright Burning Incense Stick in the Center of the Celadon Lotus (matching Photo 2!)
    const incenseStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.016, 1.25, 8),
      new THREE.MeshLambertMaterial({ color: 0xc8b58a })
    );
    incenseStick.position.set(0, 0.72, 0);
    scentGroup.add(incenseStick);

    // Dark Charred Ash Tip & Glowing Ember at the Top of the Incense Stick
    const charTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.018, 0.09, 8),
      new THREE.MeshBasicMaterial({ color: 0x2b2b2b })
    );
    charTip.position.set(0, 1.36, 0);
    const emberGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6b35 })
    );
    emberGlow.position.set(0, 1.41, 0);
    scentGroup.add(charTip, emberGlow);

    // Gentle Curling White Smoke Wisps above the Incense Tip
    this.incenseSmokePuffs = [];
    for (let s = 0; s < 5; s++) {
      const puff = new THREE.Mesh(
        new THREE.TorusGeometry(0.06 + s * 0.035, 0.018, 8, 16),
        new THREE.MeshBasicMaterial({
          color: 0xf8f9fa,
          transparent: true,
          opacity: 0.45 - s * 0.07
        })
      );
      puff.position.set(Math.sin(s) * 0.05, 1.52 + s * 0.22, 0);
      puff.rotation.x = Math.PI / 3;
      scentGroup.add(puff);
      this.incenseSmokePuffs.push(puff);
    }

    scentGroup.visible = !!this.state.offeringsMade.scent;
    this.offeringMeshes.scent = scentGroup;
    tableGroup.add(scentGroup);

    this.addWorldLabel(
      '🪔 Bodhi Offering Table',
      new THREE.Vector3(0, 3.2, -15.4),
      'public_temple',
      () => this.showToast(this.t('🙏 Select 3. Offer Water, 4. Offer Flower, or 5. Offer Incense from the Hall menu below (+10 VP each)', '🙏 请在下方佛殿动作栏选择：3. 供水、4. 供花 或 5. 供香（每次+10功德）')),
      '🪔 菩提供佛案桌'
    );

    this.publicTempleGroup.add(tableGroup);
  }

  // -------------------- 9 MEDITATION MATS IN THE PRAYER HALL --------------------
  buildMeditationMats() {
    this.meditationMats = [];
    const matPositions = [
      // Front Row facing the 7 Buddhas (5 Mats)
      { x: -8.0, z: -10.2 },
      { x: -4.0, z: -10.2 },
      { x: 0.0, z: -10.2, label: '🧘 Meditation Mats' },
      { x: 4.0, z: -10.2 },
      { x: 8.0, z: -10.2 },
      // Second Row (4 Mats)
      { x: -6.0, z: -6.8 },
      { x: -2.0, z: -6.8 },
      { x: 2.0, z: -6.8 },
      { x: 6.0, z: -6.8 }
    ];

    matPositions.forEach((mp) => {
      const matGroup = new THREE.Group();
      matGroup.position.set(mp.x, 0.35, mp.z);

      const cushion = new THREE.Mesh(
        new THREE.CylinderGeometry(1.12, 1.22, 0.28, 24),
        new THREE.MeshLambertMaterial({ color: 0xe09f3e })
      );
      cushion.position.y = 0.14;
      cushion.receiveShadow = true;
      matGroup.add(cushion);

      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 1.02, 0.08, 24),
        new THREE.MeshLambertMaterial({ color: 0x9e2a2b })
      );
      top.position.y = 0.3;
      matGroup.add(top);

      this.meditationMats.push({ pos: new THREE.Vector3(mp.x, 0.35, mp.z), mesh: matGroup });
      this.publicTempleGroup.add(matGroup);

      if (mp.label) {
        this.addWorldLabel(
          mp.label,
          new THREE.Vector3(mp.x, 1.8, mp.z),
          'public_temple',
          () => this.handlePrayerHallAction(1),
          '🧘 禅坐拜垫'
        );
      }
    });
  }

  // -------------------- 13 GOOD DEED TASKS ACROSS 10 3D ENVIRONMENTS --------------------
  getNextFamilyHomeDeed() {
    const homeIds = ['clean_house', 'care_parents', 'cook_parents', 'bye_parents'];
    for (const id of homeIds) {
      if (!this.state.completedDeeds[id]) {
        return window.GAME_DATA.GOOD_DEEDS.find((d) => d.id === id);
      }
    }
    return null;
  }

  updateFamilyHomeVisuals() {
    if (!this.familyHomeGroup) return;
    const ud = this.familyHomeGroup.userData;
    const d1 = !!this.state.completedDeeds['clean_house'];
    const d2 = !!this.state.completedDeeds['care_parents'];
    const d3 = !!this.state.completedDeeds['cook_parents'];
    const d4 = !!this.state.completedDeeds['bye_parents'];

    if (ud.homeDustGroup) ud.homeDustGroup.visible = !d1;
    if (ud.homeTeaGroup) ud.homeTeaGroup.visible = d2;
    if (ud.homeCookGroup) ud.homeCookGroup.visible = d3;
    if (ud.homeByeGroup) ud.homeByeGroup.visible = d4;

    const allHomeDone = d1 && d2 && d3 && d4;
    if (ud.beforeEffectGroup) ud.beforeEffectGroup.visible = !allHomeDone;

    if (this.familyHomeLabel) {
      const doneHomeCount = [d1, d2, d3, d4].filter(Boolean).length;
      const nextHome = this.getNextFamilyHomeDeed();
      if (allHomeDone) {
        this.familyHomeLabel.innerHTML = this.t('✅ Family Home (4/4 Done)', '✅ 山顶家园 (4/4 圆满)');
        this.familyHomeLabel.classList.add('completed');
      } else if (nextHome) {
        const nextTitle = this.dField(nextHome, 'title', 'zhTitle');
        this.familyHomeLabel.innerHTML = this.t(
          `📍 ${nextHome.emoji} Family Home (${doneHomeCount}/4): ${nextTitle}`,
          `📍 ${nextHome.emoji} 山顶家园 (${doneHomeCount}/4): ${nextTitle}`
        );
        this.familyHomeLabel.classList.remove('completed');
      }
    }
  }

  buildGoodDeedEnvironments() {
    window.GAME_DATA.GOOD_DEEDS.forEach((deed) => {
      const terrainY = window.GAME_DATA.getTerrainHeight(deed.pos.x, deed.pos.z);

      // The 4 sequential Family Home tasks share a single 3D Family Home building & label at (-7.5, 56.5)
      if (deed.groupKey === 'family_home') {
        if (deed.id === 'clean_house') {
          const envGroup = window.TempleModels3D.buildDeedEnvironment('clean_house');
          envGroup.position.set(deed.pos.x, terrainY, deed.pos.z);
          envGroup.traverse((child) => {
            child.userData.deedId = 'family_home';
          });
          this.familyHomeGroup = envGroup;

          const labelEl = this.addWorldLabel(
            '📍 🏡 Family Home',
            new THREE.Vector3(deed.pos.x, terrainY + 4.3, deed.pos.z),
            'public_temple',
            () => {
              const nextHome = this.getNextFamilyHomeDeed() || deed;
              const dist = Math.hypot(
                this.playerGroup.position.x - deed.pos.x,
                this.playerGroup.position.z - deed.pos.z
              );
              if (dist < 7.8) {
                this.performGoodDeed(nextHome.id);
              } else {
                this.activeHintDeedId = nextHome.id;
                this.updateHUD();
                this.walkToAndTrigger(
                  new THREE.Vector3(deed.pos.x, terrainY, deed.pos.z + 2.2),
                  () => this.performGoodDeed(nextHome.id)
                );
              }
            }
          );
          this.familyHomeLabel = labelEl;
          this.publicTempleGroup.add(envGroup);
        }

        this.deedStations.push({
          deed,
          group: this.familyHomeGroup,
          labelEl: this.familyHomeLabel
        });
        return;
      }

      const envGroup = window.TempleModels3D.buildDeedEnvironment(deed.id);
      envGroup.position.set(deed.pos.x, terrainY, deed.pos.z);
      envGroup.traverse((child) => {
        child.userData.deedId = deed.id;
      });

      const isDone = !!this.state.completedDeeds[deed.id];
      if (isDone) {
        envGroup.userData.beforeEffectGroup.visible = false;
        envGroup.userData.afterEffectGroup.visible = true;
      }

      const labelEl = this.addWorldLabel(
        `${isDone ? '✅' : '📍 ' + deed.emoji} ${deed.landmarkName}`,
        new THREE.Vector3(deed.pos.x, terrainY + 4.1, deed.pos.z),
        'public_temple',
        () => {
          const dist = Math.hypot(
            this.playerGroup.position.x - deed.pos.x,
            this.playerGroup.position.z - deed.pos.z
          );
          if (dist < 7.8) {
            this.performGoodDeed(deed.id);
          } else {
            this.activeHintDeedId = deed.id;
            this.updateHUD();
            this.walkToAndTrigger(
              new THREE.Vector3(deed.pos.x, terrainY, deed.pos.z + 2.2),
              () => this.performGoodDeed(deed.id)
            );
          }
        }
      );
      if (isDone) labelEl.classList.add('completed');

      this.deedStations.push({
        deed,
        group: envGroup,
        labelEl
      });

      this.publicTempleGroup.add(envGroup);
    });

    this.updateFamilyHomeVisuals();

    // Restore Rescued Animal Companions if already rescued in saved state (Game Designer Recommendation #2)
    if (this.state.completedDeeds['save_animals']) {
      this.spawnRescuedCompanion('deer');
    }
    if (this.state.completedDeeds['stop_hunter']) {
      this.spawnRescuedCompanion('fox');
    }

    // Restore any Good Wishes already hung on the Bodhi Wishing Tree so they are visible on the tree!
    this.rebuildWishingTreePlaques();
  }

  // -------------------- SCENE 2: SCALABLE PERSONAL SPACE --------------------
  buildPersonalSpaceScene() {
    const islandGeo = new THREE.CylinderGeometry(20, 15, 2.5, 32);
    const islandMat = new THREE.MeshLambertMaterial({ color: 0x88c977 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, -1.25, 0);
    island.receiveShadow = true;
    island.name = 'walkable_ground';
    this.personalSpaceGroup.add(island);

    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.ConeGeometry(3.8, 7, 5),
        new THREE.MeshLambertMaterial({ color: 0xf48fb1 })
      );
      petal.position.set(Math.cos(ang) * 19.5, 0.2, Math.sin(ang) * 19.5);
      petal.rotation.x = Math.sin(ang) * 0.45;
      petal.rotation.z = -Math.cos(ang) * 0.45;
      this.personalSpaceGroup.add(petal);
    }

    const backPortal = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.16, 12, 24),
      new THREE.MeshPhongMaterial({ color: 0xf4b942 })
    );
    backPortal.position.set(0, 1.7, 12);
    this.personalSpaceGroup.add(backPortal);

    this.addWorldLabel(
      '⛩️ Return to Public 7-Buddha Temple',
      new THREE.Vector3(0, 3.6, 12),
      'personal_space',
      () => this.switchScene('public_temple'),
      '⛩️ 返回公共七佛宝殿'
    );

    this.addWorldLabel(
      '🏪 Personal Space Store (2 VP)',
      new THREE.Vector3(0, 2.2, 0),
      'personal_space',
      () => this.openPersonalBuilderModal(),
      '🏪 个人空间商城 (每项 2 功德)'
    );

    this.personalSpaceGroup.add(this.personalBuiltGroup);
    this.rebuildPersonalItems3D();
  }

  rebuildPersonalItems3D() {
    while (this.personalBuiltGroup.children.length > 0) {
      this.personalBuiltGroup.remove(this.personalBuiltGroup.children[0]);
    }

    const items = this.state.personalItems || {};

    // 1. House (静修小屋)
    if (items.house || items.home_shrine) {
      const hGrp = new THREE.Group();
      hGrp.position.set(0, 0, -9.5);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.78 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.62 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.38, metalness: 0.25 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 5.4), new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 }));
      base.position.y = 0.175;
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 4.2), wallMat);
      body.position.y = 1.95;
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.1, 0.12), woodMat);
      door.position.set(0, 1.40, 2.12);
      [-1.55, 1.55].forEach((wx) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.12), new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.35 }));
        win.position.set(wx, 2.05, 2.12);
        hGrp.add(win);
      });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.1, 4), roofMat);
      roof.position.y = 4.55;
      roof.rotation.y = Math.PI / 4;
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }));
      finial.position.y = 5.65;
      hGrp.add(base, body, door, roof, finial);
      this.personalBuiltGroup.add(hGrp);
    }

    // 2. Food (素食斋饭)
    if (items.food) {
      const fGrp = new THREE.Group();
      fGrp.position.set(-5.5, 0, -2.2);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.55 });
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.14, 24), woodMat);
      top.position.y = 1.05;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.42, 1.0, 16), woodMat);
      ped.position.y = 0.50;
      fGrp.add(top, ped);
      [[-0.52, 0.35], [0.52, 0.35], [0, -0.52]].forEach(([bx, bz], idx) => {
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.14, 0.16, 16),
          new THREE.MeshStandardMaterial({ color: idx === 0 ? 0xfacc15 : 0xfef3c7, roughness: 0.3 })
        );
        bowl.position.set(bx, 1.20, bz);
        const rice = new THREE.Mesh(
          new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
          new THREE.MeshStandardMaterial({ color: idx === 1 ? 0x4ade80 : (idx === 2 ? 0xfb923c : 0xffffff), roughness: 0.6 })
        );
        rice.position.set(bx, 1.25, bz);
        fGrp.add(bowl, rice);
      });
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.3 }));
      pot.position.set(0, 1.28, 0.08);
      fGrp.add(pot);
      this.personalBuiltGroup.add(fGrp);
    }

    // 3. Seed to plant (菩提莲花良种)
    if (items.seed || items.bodhi_sapling) {
      const sGrp = new THREE.Group();
      sGrp.position.set(6.2, 0, -3.8);
      const borderMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.72 });
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
      const bed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.36, 2.4), borderMat);
      bed.position.y = 0.18;
      const soil = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.38, 2.1), soilMat);
      soil.position.y = 0.20;
      sGrp.add(bed, soil);
      for (let sx = -1.0; sx <= 1.0; sx += 0.65) {
        for (let sz = -0.5; sz <= 0.5; sz += 1.0) {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.42, 8), new THREE.MeshLambertMaterial({ color: 0x16a34a }));
          stem.position.set(sx, 0.56, sz);
          const leafL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshLambertMaterial({ color: 0x4ade80 }));
          leafL.scale.set(1.4, 0.35, 0.7);
          leafL.position.set(sx - 0.11, 0.76, sz);
          const leafR = leafL.clone();
          leafR.position.set(sx + 0.11, 0.76, sz);
          sGrp.add(stem, leafL, leafR);
        }
      }
      const treeEnv = window.TempleModels3D.buildDeedEnvironment('good_wishes');
      treeEnv.scale.set(0.55, 0.55, 0.55);
      treeEnv.position.set(0.2, 0, -2.5);
      sGrp.add(treeEnv);
      this.personalBuiltGroup.add(sGrp);
    }

    // 4. Flower (供佛鲜花)
    if (items.flower || items.lotus_pond) {
      const pond = window.TempleModels3D.buildDeedEnvironment('stop_killing');
      pond.userData.beforeEffectGroup.visible = false;
      pond.position.set(-7.0, 0, -6.2);
      pond.scale.set(0.68, 0.68, 0.68);
      this.personalBuiltGroup.add(pond);

      [-1.0, 1.0].forEach((vx) => {
        const vaseGrp = new THREE.Group();
        vaseGrp.position.set(-4.8 + vx * 0.8, 0, -5.8);
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.75, 16), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 }));
        stand.position.y = 0.375;
        const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.55, 16), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.25 }));
        vase.position.y = 1.02;
        const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x831843, emissiveIntensity: 0.2 }));
        bloom.position.y = 1.38;
        vaseGrp.add(stand, vase, bloom);
        this.personalBuiltGroup.add(vaseGrp);
      });
    }

    // 5. Water (清净供水 - 7 Golden Water Bowls on Offering Stand)
    if (items.water) {
      const wGrp = new THREE.Group();
      wGrp.position.set(-2.3, 0, -4.5);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.52 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.72, roughness: 0.24 });
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.25, roughness: 0.15 });
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 0.95), tableMat);
      table.position.y = 1.05;
      [-1.35, 1.35].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.02, 0.75), tableMat);
        leg.position.set(lx, 0.51, 0);
        wGrp.add(leg);
      });
      for (let i = 0; i < 7; i++) {
        const cx = -1.2 + i * 0.40;
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.14, 14), goldMat);
        bowl.position.set(cx, 1.20, 0);
        const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(0.115, 14), waterMat);
        waterDisc.rotation.x = -Math.PI / 2;
        waterDisc.position.set(cx, 1.272, 0);
        wGrp.add(bowl, waterDisc);
      }
      wGrp.add(table);
      this.personalBuiltGroup.add(wGrp);
    }

    // 6. Incense (清净妙香)
    if (items.incense || items.stone_lantern) {
      const iGrp = new THREE.Group();
      iGrp.position.set(2.3, 0, -4.5);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.55 });
      const jadeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.35, roughness: 0.35 });
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.0, 16), standMat);
      stand.position.y = 0.50;
      const censer = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.42, 20), jadeMat);
      censer.position.y = 1.21;
      const ash = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshLambertMaterial({ color: 0xd6d3d1 }));
      ash.rotation.x = -Math.PI / 2;
      ash.position.y = 1.425;
      iGrp.add(stand, censer, ash);
      [-0.09, 0, 0.09].forEach((ix) => {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 6), new THREE.MeshStandardMaterial({ color: 0x92400e }));
        stick.position.set(ix, 1.66, 0);
        const ember = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfb923c }));
        ember.position.set(ix, 1.93, 0);
        const plume = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.48 }));
        plume.position.set(ix, 2.25 + Math.abs(ix) * 1.5, 0);
        iGrp.add(stick, ember, plume);
      });
      this.personalBuiltGroup.add(iGrp);
    }
  }

  // -------------------- 3D UNIFIED CUTE RED TIBETAN BUDDHIST MONK CHARACTER --------------------
  buildPlayerCharacter() {
    while (this.playerGroup.children.length > 0) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }

    const monkModel = window.TempleModels3D.createCuteRedTibetanMonkParts(THREE);
    const parts = monkModel.userData || {};
    this.charParts = {
      bodyPivot: monkModel,
      lowerBody: parts.lowerBody,
      robeSkirt: parts.robeSkirt,
      upperBody: parts.upperBody,
      headGroup: parts.headGroup,
      leftArm: parts.leftArm,
      rightArm: parts.rightArm,
      leftLeg: parts.leftLeg,
      rightLeg: parts.rightLeg,
      headHalo: parts.headHalo,
      rippleGroup: parts.rippleGroup
    };
    this.playerGroup.add(monkModel);

    // Warm Golden Firefly Companion Sphere
    const auraOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe082, transparent: true, opacity: 0.78 })
    );
    auraOrb.position.set(0.75, 1.55, 0);
    this.playerGroup.add(auraOrb);
    this.charParts.auraOrb = auraOrb;

    // Meditation Lotus Aura Ring
    const meditationRing = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.35, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffd700,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      })
    );
    meditationRing.rotation.x = -Math.PI / 2;
    meditationRing.position.y = 0.08;
    this.playerGroup.add(meditationRing);
    this.charParts.meditationRing = meditationRing;

    // 3D Golden Exploration Compass Arrow at the player's feet pointing to the selected Hint!
    const compassGroup = new THREE.Group();
    const arrowCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.75, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd700 })
    );
    arrowCone.rotation.x = Math.PI / 2;
    arrowCone.position.set(0, 0.25, 1.55);
    compassGroup.add(arrowCone);
    this.compassArrow = compassGroup;
    this.playerGroup.add(compassGroup);

    if (this.playerGroup.position.lengthSq() === 0) {
      const startY = window.GAME_DATA.getTerrainHeight(0, 105);
      this.playerGroup.position.set(0, startY, 105);
      this.playerGroup.rotation.y = Math.PI;
    }
    this.scene.add(this.playerGroup);
  }

  // -------------------- GAME DESIGNER RECOMMENDATIONS: COMPANIONS, SKY LANTERNS & LOTUS FOOTPRINTS --------------------
  spawnRescuedCompanion(type) {
    if (this.companionMeshes[type]) return;
    const comp = window.TempleModels3D.createCompanionAnimal(type);
    const pPos = this.playerGroup.position;
    comp.position.set(pPos.x + (type === 'deer' ? -1.4 : 1.4), pPos.y, pPos.z + 1.2);
    this.publicTempleGroup.add(comp);
    this.companionMeshes[type] = comp;
  }

  spawnSkyLantern(worldPos) {
    const lantern = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.22, 0.56, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.92 })
    );
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    core.position.y = -0.1;
    lantern.add(body, core);
    lantern.position.copy(worldPos);
    lantern.position.y += 1.5;
    this.publicTempleGroup.add(lantern);
    this.skyLanterns.push({ mesh: lantern, age: 0 });
  }

  dropLotusFootprint() {
    if (this.currentScene !== 'public_temple') return;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.36, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffd166,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(
      this.playerGroup.position.x,
      this.playerGroup.position.y + 0.04,
      this.playerGroup.position.z
    );
    this.publicTempleGroup.add(ring);
    this.lotusFootprints.push({ mesh: ring, age: 0 });
  }

  // -------------------- DESCRIPTIVE ON-SITE GOOD DEED EXECUTION & SKILL MINI-CHALLENGES --------------------
  performGoodDeed(deedId) {
    if (deedId === 'family_home') {
      const nextHome = this.getNextFamilyHomeDeed();
      if (!nextHome) {
        this.showToast('✅ You already completed all 4 Family Home tasks! Time to walk down the mountain trail.');
        return;
      }
      deedId = nextHome.id;
    }

    const deed = window.GAME_DATA.GOOD_DEEDS.find((d) => d.id === deedId);
    if (!deed) return;

    const terrainY = window.GAME_DATA.getTerrainHeight(deed.pos.x, deed.pos.z);

    // Verify player walked near the landmark (or walk there automatically if clicked in 3D)
    const dist = Math.hypot(
      this.playerGroup.position.x - deed.pos.x,
      this.playerGroup.position.z - deed.pos.z
    );
    if (dist > 8.2) {
      this.activeHintDeedId = deed.id;
      this.updateHUD();
      this.walkToAndTrigger(
        new THREE.Vector3(deed.pos.x, terrainY, deed.pos.z + 2.2),
        () => this.performGoodDeed(deed.id)
      );
      return;
    }

    // Special Case: Bodhi Wishing Tree ("good_wishes") -> Always open the 8 Good Wishes Selector!
    if (deedId === 'good_wishes') {
      this.openWishingTreeModal();
      return;
    }

    if (this.state.completedDeeds[deedId]) {
      this.showToast(`✅ You already completed "${deed.title}"! Each good deed is counted once.`);
      return;
    }

    // Complete the good deed directly when clicked or when Enter is pressed!
    this.completeGoodDeedReward(deed);
  }

  completeGoodDeedReward(deed, customFloatText = null) {
    const deedId = deed.id;
    const alreadyDone = !!this.state.completedDeeds[deedId];
    const terrainY = window.GAME_DATA.getTerrainHeight(deed.pos.x, deed.pos.z);

    this.state.completedDeeds[deedId] = true;
    window.templeAudio.playGoodDeedChime();
    this.bowAnimTimer = 1.4;

    if (deed.groupKey === 'family_home') {
      this.updateFamilyHomeVisuals();
    } else {
      // Trigger 3D Before -> After Visual Transformation of the Landmark!
      const st = this.deedStations.find((s) => s.deed.id === deedId);
      if (st) {
        st.group.userData.beforeEffectGroup.visible = false;
        st.group.userData.afterEffectGroup.visible = true;
        st.labelEl.innerHTML = `✅ ${this.dField(deed, 'landmarkName', 'zhLandmarkName')}`;
        st.labelEl.classList.add('completed');
      }
    }

    // Rebuild Wisdom Bridge across the East River immediately upon completing the Bridge Quest!
    if (deedId === 'build_wisdom_bridge') {
      this.rebuildWisdomBridge();
    }

    // Rescued Animal Companions join the player!
    if (deedId === 'save_animals') {
      this.spawnRescuedCompanion('deer');
    } else if (deedId === 'stop_hunter') {
      this.spawnRescuedCompanion('fox');
    }

    // Release a rising Golden Wishing Sky Lantern!
    this.spawnSkyLantern(new THREE.Vector3(deed.pos.x, terrainY + 1.5, deed.pos.z));

    this.selectNextUnfinishedHint();
    const dTitle = this.dField(deed, 'title', 'zhTitle');
    const dCel = this.dField(deed, 'celebrationMsg', 'zhCelebrationMsg');
    const dLesson = this.dField(deed, 'virtueLesson', 'zhVirtueLesson');
    if (!alreadyDone) {
      this.addVirtuePoints(
        deed.points,
        customFloatText || `${deed.emoji} ${dTitle} +${deed.points} ${this.t('VP!', '功德!')}`,
        new THREE.Vector3(deed.pos.x, terrainY + 3.2, deed.pos.z)
      );
      this.showToast(dCel);
    } else if (customFloatText) {
      this.spawnFloatingText(customFloatText, new THREE.Vector3(deed.pos.x, terrainY + 3.2, deed.pos.z));
    }

    // Play a short 3D Story Cutscene for every quest EXCEPT the Bodhi Wishing Tree ("good_wishes")!
    if (deedId !== 'good_wishes') {
      const cleanTitle = dTitle.replace(/^\d+\.\s*/, '');
      this.startCutscene({
        emoji: deed.emoji,
        imgSrc: deed.speakerImg || null,
        title: `${deed.emoji} ${cleanTitle}`,
        subtitle: dCel || dLesson || this.t('Good Deed Completed!', '善行功德圆满！'),
        targetPos: new THREE.Vector3(deed.pos.x, terrainY + 1.4, deed.pos.z),
        camDistance: 9.2,
        camHeight: 4.4,
        baseAngle: 0.35,
        orbitSpeed: 0.42,
        duration: 2.5
      });
    }
  }

  // -------------------- BODHI WISHING TREE: SELECT & HANG WISHES ON THE TREE (VISIBLE TO OTHERS!) --------------------
  createWishPlaqueTexture(emoji, shortTitle, authorName) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Crimson & Gold Wooden Wish Plaque Background
    const grad = ctx.createLinearGradient(0, 0, 0, 384);
    grad.addColorStop(0, '#a81c24');
    grad.addColorStop(1, '#6e0f15');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 384);

    // Ornate Gold Border
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 236, 364);

    // Top Gold Header Bar
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(16, 16, 224, 52);
    ctx.fillStyle = '#5a1010';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌟 BODHI WISH', 128, 50);

    // Wish Emoji
    ctx.font = '64px sans-serif';
    ctx.fillText(emoji || '🌟', 128, 145);

    // Wrapped Wish Title
    ctx.fillStyle = '#fff8dc';
    ctx.font = 'bold 25px sans-serif';
    const words = (shortTitle || '').split(' ');
    let line = '';
    let y = 205;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > 205 && i > 0) {
        ctx.fillText(line.trim(), 128, y);
        line = words[i] + ' ';
        y += 32;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), 128, y);
    }

    // Author Footer ("By: PlayerName")
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`— ${authorName || 'Little Lotus'} —`, 128, 348);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  rebuildWishingTreePlaques() {
    const treeStation = this.deedStations.find((s) => s.deed.id === 'good_wishes');
    if (!treeStation) return;

    if (!this.wishingTreePlaquesGroup) {
      this.wishingTreePlaquesGroup = new THREE.Group();
      treeStation.group.add(this.wishingTreePlaquesGroup);
    }

    while (this.wishingTreePlaquesGroup.children.length > 0) {
      this.wishingTreePlaquesGroup.remove(this.wishingTreePlaquesGroup.children[0]);
    }

    // Remove previous hanging wish ribbon DOM tags
    if (this.wishingTreeLabelItems && this.wishingTreeLabelItems.length > 0) {
      this.wishingTreeLabelItems.forEach((item) => {
        if (item.el && item.el.parentNode) item.el.parentNode.removeChild(item.el);
        const idx = this.worldLabelItems.indexOf(item);
        if (idx !== -1) this.worldLabelItems.splice(idx, 1);
      });
    }
    this.wishingTreeLabelItems = [];

    const wishes = window.GAME_DATA.EIGHT_GOOD_WISHES || [];
    const selectedMap = this.state.wishesSelected || {};
    const hungWishes = wishes.filter((w) => !!selectedMap[w.id]);

    const deedPos = treeStation.deed.pos;
    const terrainY = window.GAME_DATA.getTerrainHeight(deedPos.x, deedPos.z);

    // Update the main Bodhi Wishing Tree label to show how many wishes are hanging on the tree
    if (treeStation.labelEl) {
      if (hungWishes.length > 0) {
        treeStation.labelEl.innerHTML = `🌳 Bodhi Wishing Tree (${hungWishes.length} ${hungWishes.length === 1 ? 'Wish' : 'Wishes'} Hung ✨)`;
        treeStation.labelEl.classList.add('completed');
      }
    }

    // Branch anchor positions around the Bodhi Tree canopy so each of the 8 wishes hangs visibly on its own branch!
    const branchSlots = [
      { angle: -0.95, radius: 2.55, y: 3.35, labelLift: 0.55 },
      { angle: -0.32, radius: 2.65, y: 3.85, labelLift: 1.05 },
      { angle: 0.32, radius: 2.65, y: 3.45, labelLift: 0.65 },
      { angle: 0.95, radius: 2.55, y: 3.95, labelLift: 1.15 },
      { angle: 1.58, radius: 2.50, y: 3.50, labelLift: 0.70 },
      { angle: 2.22, radius: 2.55, y: 4.05, labelLift: 1.25 },
      { angle: 2.85, radius: 2.60, y: 3.55, labelLift: 0.75 },
      { angle: -1.58, radius: 2.50, y: 4.10, labelLift: 1.30 }
    ];

    const goldCordMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const tasselMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const woodEdgeMat = new THREE.MeshLambertMaterial({ color: 0xd4941c });

    hungWishes.forEach((wish, i) => {
      const slot = branchSlots[i % branchSlots.length];
      const bx = Math.sin(slot.angle) * slot.radius;
      const bz = Math.cos(slot.angle) * slot.radius;

      const plaquePivot = new THREE.Group();
      plaquePivot.position.set(bx, slot.y, bz);
      plaquePivot.rotation.y = slot.angle;

      // Golden Silk Hanging Cord tied to branch
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 6), goldCordMat);
      cord.position.y = -0.32;
      plaquePivot.add(cord);

      // 3D Wooden & Gold Wish Plaque with Canvas Texture on Front & Back
      const shortTitle = wish.title.replace(/^\d+\.\s*/, '');
      const author = (typeof selectedMap[wish.id] === 'string' && selectedMap[wish.id]) ? selectedMap[wish.id] : this.state.playerName;
      const plaqueTex = this.createWishPlaqueTexture(wish.emoji, shortTitle, author);
      const faceMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
      const plaqueMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.98, 0.06),
        [woodEdgeMat, woodEdgeMat, woodEdgeMat, woodEdgeMat, faceMat, faceMat]
      );
      plaqueMesh.position.y = -0.82;
      plaquePivot.add(plaqueMesh);

      // Swaying Red Silk Tassel under the Plaque
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 8), tasselMat);
      tassel.position.y = -1.48;
      plaquePivot.add(tassel);

      // Subtle glowing golden aura sphere around the hung wish
      const glowOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe66d })
      );
      glowOrb.position.y = -0.22;
      plaquePivot.add(glowOrb);

      plaquePivot.userData.swayPhase = i * 0.9;
      this.wishingTreePlaquesGroup.add(plaquePivot);

      // Add a visible floating Wish Ribbon Tag in 3D space on the tree so other players/viewers can read the wish!
      const worldTagPos = new THREE.Vector3(
        deedPos.x + bx,
        terrainY + slot.y - 0.55,
        deedPos.z + bz
      );
      const tagEl = this.addWorldLabel(
        `${wish.emoji} ${shortTitle} <span style="opacity:0.85;font-weight:700;">(${author})</span>`,
        worldTagPos,
        'public_temple',
        () => {
          window.templeAudio.speakText(`${shortTitle}, wished by ${author}. ${wish.detail}`, true);
          this.showToast(`🌳🌟 Wish on Bodhi Tree by ${author}: "${shortTitle}" — "${wish.detail}"`);
        }
      );
      tagEl.classList.add('wish-ribbon-tag');
      const labelItem = this.worldLabelItems[this.worldLabelItems.length - 1];
      if (labelItem) {
        labelItem.maxDist = 34.0; // Visible from across the courtyard so others can see all wishes on the tree!
        this.wishingTreeLabelItems.push(labelItem);
      }
    });
  }

  hangWishById(wishId, closeAfter = false) {
    const wishes = window.GAME_DATA.EIGHT_GOOD_WISHES || [];
    const chosen = wishes.find((w) => w.id === wishId) || wishes[0];
    if (!chosen) return;

    this._selectedWishId = chosen.id;
    this.state.wishesSelected[chosen.id] = this.state.playerName || 'Little Lotus';

    const deed = window.GAME_DATA.GOOD_DEEDS.find((d) => d.id === 'good_wishes');
    if (deed) {
      const firstTime = !this.state.completedDeeds['good_wishes'];
      this.completeGoodDeedReward(
        deed,
        firstTime ? `${chosen.emoji} ${chosen.title} (+2 VP)!` : `${chosen.emoji} Hung on Tree!`
      );
      this.rebuildWishingTreePlaques();
      this.saveState();
      this.showToast(
        `🌳🌟 Hung "${chosen.title.replace(/^\d+\.\s*/, '')}" (by ${this.state.playerName}) on the Bodhi Wishing Tree for everyone to see!`
      );
    }

    if (closeAfter) {
      const modal = document.getElementById('wishing-tree-modal');
      if (modal) modal.classList.add('hidden');
    }
  }

  openWishingTreeModal() {
    const modal = document.getElementById('wishing-tree-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const grid = document.getElementById('wishes-grid-container');
    const previewEl = document.getElementById('selected-wish-preview');
    const confirmBtn = document.getElementById('btn-confirm-hang-wish');
    const wishes = window.GAME_DATA.EIGHT_GOOD_WISHES || [];

    if (!this._selectedWishId) {
      this._selectedWishId = wishes[0] ? wishes[0].id : null;
    }

    const renderWishes = () => {
      grid.innerHTML = '';
      const hungCount = wishes.filter((w) => !!(this.state.wishesSelected && this.state.wishesSelected[w.id])).length;

      wishes.forEach((w) => {
        const isSel = this._selectedWishId === w.id;
        const alreadyHung = !!(this.state.wishesSelected && this.state.wishesSelected[w.id]);
        const shortName = this.isZh()
          ? (w.zhTitle || w.title).replace(/^\d+\.\s*/, '')
          : w.title.replace(/^\d+\.\s*Wishing\s*(for\s*)?/i, '');
        const detailText = this.dField(w, 'detail', 'zhDetail');
        const card = document.createElement('div');
        card.className = `wish-card ${isSel ? 'selected' : ''} ${alreadyHung ? 'hung-on-tree' : ''}`;
        card.innerHTML = `
          <div class="wish-emoji">${w.emoji}</div>
          <h4>${shortName}</h4>
          <span class="wish-hung-badge">${alreadyHung ? this.t('✓ Hung', '✓ 已挂树上') : this.t('🎋 Hang', '🎋 挂祈愿牌')}</span>
        `;
        card.addEventListener('click', () => {
          this._selectedWishId = w.id;
          window.templeAudio.speakText(`${shortName}. ${detailText}`, true);
          this.hangWishById(w.id, false);
          renderWishes();
        });
        grid.appendChild(card);
      });

      if (previewEl) {
        previewEl.textContent =
          hungCount > 0
            ? this.t(`🌳 ${hungCount} / 8 Wishes Hung on Tree`, `🌳 已在菩提树挂上 ${hungCount} / 8 个善愿`)
            : this.t(`🎋 Click a plaque to hang it`, `🎋 请点击上方善愿牌挂到菩提树上`);
      }
      if (confirmBtn) {
        confirmBtn.textContent = hungCount > 0
          ? this.t(`🌳 Done (${hungCount})`, `🌳 完成 (${hungCount})`)
          : this.t('🎋 Hang Wish (+2 VP)', '🎋 挂祈愿牌 (+2 功德)');
      }
    };

    renderWishes();
  }

  confirmHangSelectedWish() {
    const wishes = window.GAME_DATA.EIGHT_GOOD_WISHES || [];
    const hungCount = wishes.filter((w) => !!(this.state.wishesSelected && this.state.wishesSelected[w.id])).length;
    if (hungCount === 0) {
      const chosen = wishes.find((w) => w.id === this._selectedWishId) || wishes[0];
      if (chosen) {
        this.hangWishById(chosen.id, true);
        return;
      }
    }
    const modal = document.getElementById('wishing-tree-modal');
    if (modal) modal.classList.add('hidden');
  }

  // -------------------- GAME DESIGNER ENHANCEMENT #1: INTERACTIVE SKILL MINI-CHALLENGES FOR GOOD DEEDS --------------------
  openDeedMiniChallenge(deed) {
    const modal = document.getElementById('minigame-modal');
    const titleEl = document.getElementById('minigame-title');
    const bodyEl = document.getElementById('minigame-body');
    if (!modal || !bodyEl) {
      this.completeGoodDeedReward(deed);
      return;
    }

    if (this._minigameRAF) {
      cancelAnimationFrame(this._minigameRAF);
      this._minigameRAF = null;
    }

    modal.classList.remove('hidden');
    const deedTitle = this.dField(deed, 'title', 'zhTitle');
    titleEl.textContent = this.t(`🎯 Skill Challenge: ${deedTitle}`, `🎯 善行小挑战：${deedTitle}`);

    // Mode 1: Precision Compassion Timing Bar (Rescue Deer, Stop Hunter, Cross River, Cover Rain)
    if (['save_animals', 'stop_hunter', 'cross_river', 'cover_rain'].includes(deed.id)) {
      let hits = 0;
      const neededHits = 3;
      let cursorPos = 10;
      let dir = 1;
      let zoneLeft = 36;
      let zoneWidth = 24;
      let active = true;

      bodyEl.innerHTML = `
        <p style="font-size:14.5px; font-weight:800; color:#4a2508; text-align:center;">
          ${deed.emoji} ${this.t(
            'Time your action carefully! Click <strong>🎯 Strike Green Zone!</strong> (or press <strong>Space</strong>) when the golden bar is inside the green target zone <strong>3 times</strong>!',
            '把握当下善机！当金色游标进入绿色区域时，点击 <strong>🎯 对准绿色区域！</strong>（或按 <strong>空格键</strong>）命中 <strong>3 次</strong>！'
          )}
        </p>
        <div class="minigame-arena">
          <div style="font-size:16px; font-weight:900; color:#7a1c1c;" id="mg-timing-score">
            ${this.t(`🎯 Successful Hits: 0 / ${neededHits}`, `🎯 命中次数：0 / ${neededHits}`)}
          </div>
          <div class="timing-bar-track">
            <div class="timing-bar-zone" id="mg-zone" style="left:${zoneLeft}%; width:${zoneWidth}%;"></div>
            <div class="timing-bar-cursor" id="mg-cursor" style="left:10%;"></div>
          </div>
          <button class="primary-gold-btn" id="mg-strike-btn" style="padding:12px 28px; font-size:16px;">
            ${this.t('🎯 Strike Green Zone! (Space)', '🎯 对准绿色区域！(空格)')}
          </button>
        </div>
      `;

      const cursorEl = document.getElementById('mg-cursor');
      const zoneEl = document.getElementById('mg-zone');
      const scoreEl = document.getElementById('mg-timing-score');
      const strikeBtn = document.getElementById('mg-strike-btn');

      const stepBar = () => {
        if (!active || modal.classList.contains('hidden')) return;
        const speed = 1.35 + hits * 0.45;
        cursorPos += dir * speed;
        if (cursorPos >= 96) {
          cursorPos = 96;
          dir = -1;
        } else if (cursorPos <= 2) {
          cursorPos = 2;
          dir = 1;
        }
        if (cursorEl) cursorEl.style.left = `${cursorPos}%`;
        this._minigameRAF = requestAnimationFrame(stepBar);
      };
      this._minigameRAF = requestAnimationFrame(stepBar);

      const tryStrike = () => {
        if (!active) return;
        if (cursorPos >= zoneLeft - 3 && cursorPos <= zoneLeft + zoneWidth + 3) {
          hits += 1;
          window.templeAudio.playWoodblock();
          if (scoreEl) scoreEl.textContent = this.t(`🎯 Great Timing! Hits: ${hits} / ${neededHits}`, `🎯 太棒了！命中：${hits} / ${neededHits}`);
          if (hits >= neededHits) {
            active = false;
            modal.classList.add('hidden');
            this.completeGoodDeedReward(deed);
            return;
          }
          zoneWidth = Math.max(16, 24 - hits * 3);
          zoneLeft = 15 + Math.floor(Math.random() * 62);
          if (zoneEl) {
            zoneEl.style.left = `${zoneLeft}%`;
            zoneEl.style.width = `${zoneWidth}%`;
          }
        } else {
          if (scoreEl) {
            scoreEl.textContent = this.t(
              `⚠️ Missed the green zone! Try again (${hits} / ${neededHits})`,
              `⚠️ 偏了一点点，再试一次！(${hits} / ${neededHits})`
            );
          }
        }
      };

      if (strikeBtn) strikeBtn.addEventListener('click', tryStrike);
      return;
    }

    // Mode 2: Mindful Vegetarian Recipe & Tea Sorting Challenge
    if (['cook_parents', 'care_parents', 'cook_hungry'].includes(deed.id)) {
      const goodItems = [
        { label: this.t('🥬 Fresh Greens', '🥬 新鲜时蔬'), good: true },
        { label: this.t('🍄 Sweet Mushroom', '🍄 香甜鲜菇'), good: true },
        { label: this.t('🥕 Mountain Carrot', '🥕 红萝卜'), good: true },
        { label: this.t('🍚 Golden Rice & Tea', '🍚 香米暖茶'), good: true }
      ];
      const badItems = [
        { label: this.t('🪨 River Stone', '🪨 河滩石块'), good: false },
        { label: this.t('🦴 Meat Bone (Not Veg!)', '🦴 荤腥骨头（非素食！）'), good: false },
        { label: this.t('🌶️ Burning Pepper', '🌶️ 辛辣辣椒'), good: false }
      ];
      const allItems = [...goodItems, ...badItems].sort(() => Math.random() - 0.5);
      let pickedCount = 0;

      bodyEl.innerHTML = `
        <p style="font-size:14.5px; font-weight:800; color:#4a2508; text-align:center;">
          ${deed.emoji} ${this.t(
            'Pick only the <strong>4 Pure Vegetarian & Wholesome Ingredients</strong>! Avoid stones, meat bones, or burning peppers!',
            '请挑选 <strong>4 样清净纯净的素食食材</strong>！不要选石块、荤腥骨头或辛辣料哦！'
          )}
        </p>
        <div class="minigame-arena">
          <div style="font-size:16px; font-weight:900; color:#216337;" id="mg-cook-score">
            ${this.t('🍲 Pure Ingredients Added: 0 / 4', '🍲 已选素食食材：0 / 4')}
          </div>
          <div class="minigame-items-row" id="mg-cook-items"></div>
        </div>
      `;

      const rowEl = document.getElementById('mg-cook-items');
      const scoreEl = document.getElementById('mg-cook-score');
      allItems.forEach((item) => {
        const btn = document.createElement('button');
        btn.className = 'minigame-target-item';
        btn.textContent = item.label;
        btn.addEventListener('click', () => {
          if (item.good) {
            btn.classList.add('done');
            pickedCount += 1;
            window.templeAudio.playWoodblock();
            if (scoreEl) scoreEl.textContent = this.t(`🍲 Pure Ingredients Added: ${pickedCount} / 4`, `🍲 已选素食食材：${pickedCount} / 4`);
            if (pickedCount >= 4) {
              modal.classList.add('hidden');
              this.completeGoodDeedReward(deed);
            }
          } else {
            btn.style.background = '#f8d7da';
            btn.style.borderColor = '#dc3545';
            if (scoreEl) {
              scoreEl.textContent = this.t(
                `⚠️ Oops! "${item.label}" does not belong in a pure vegetarian meal! (${pickedCount}/4)`,
                `⚠️ 哎呀！「${item.label}」不适合加入清净素斋哦 (${pickedCount}/4)`
              );
            }
          }
        });
        rowEl.appendChild(btn);
      });
      return;
    }

    // Mode 3: Ordered Step-by-Step Action Sequence
    const totalSteps = 5;
    let nextNum = 1;
    const nums = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

    bodyEl.innerHTML = `
      <p style="font-size:14.5px; font-weight:800; color:#4a2508; text-align:center;">
        ${deed.emoji} ${this.t(
          `Mindful Order Challenge! Click the <strong>5 Action Targets in exact order from 1 to 5</strong> to complete "${deedTitle}"!`,
          `专注按序挑战！请按 <strong>从 1 到 5 的顺序</strong>依次点击以下动作，完成「${deedTitle}」！`
        )}
      </p>
      <div class="minigame-arena">
        <div style="font-size:16px; font-weight:900; color:#7a1c1c;" id="mg-seq-score">
          ${this.t(`✨ Click Target #1 Next! (0 / ${totalSteps})`, `✨ 请先点击 第 1 步！(0 / ${totalSteps})`)}
        </div>
        <div class="minigame-items-row" id="mg-seq-items"></div>
      </div>
    `;

    const rowEl = document.getElementById('mg-seq-items');
    const scoreEl = document.getElementById('mg-seq-score');
    nums.forEach((n) => {
      const btn = document.createElement('button');
      btn.className = 'minigame-target-item';
      btn.textContent = `${deed.emoji} ${this.t(`Step #${n}`, `第 ${n} 步`)}`;
      btn.addEventListener('click', () => {
        if (n === nextNum) {
          btn.classList.add('done');
          window.templeAudio.playWoodblock();
          nextNum += 1;
          if (nextNum > totalSteps) {
            modal.classList.add('hidden');
            this.completeGoodDeedReward(deed);
          } else if (scoreEl) {
            scoreEl.textContent = this.t(
              `✨ Great! Now click Step #${nextNum}! (${nextNum - 1} / ${totalSteps})`,
              `✨ 很棒！请点击 第 ${nextNum} 步！(${nextNum - 1} / ${totalSteps})`
            );
          }
        } else if (scoreEl) {
          scoreEl.textContent = `⚠️ Mindful focus! Please click Step #${nextNum} first!`;
        }
      });
      rowEl.appendChild(btn);
    });
  }

  // -------------------- QUEST TO BOW TO EACH OF THE 7 BUDDHAS (+10 VP EACH + WISH & BENEFIT ACKNOWLEDGMENT CARD) --------------------
  getBowedBuddhaCount() {
    return Object.keys(this.state.bowedBuddhas || {}).length;
  }

  bowToSpecificBuddhaQuest(buddhaIdx) {
    if (!this.canEnterPrayerHall()) {
      this.showToast('🔒 Complete at least 5 Good Deeds (10 VP) on the mountain trail to enter the 7-Buddha Hall!');
      return;
    }

    const buddhas = window.GAME_DATA.SEVEN_BUDDHAS || [];
    const cur = buddhas[buddhaIdx];
    if (!cur) return;

    // Close the general 7-Buddha info modal if open so the Bow Acknowledgment Card is front and center
    const infoModal = document.getElementById('buddha-modal');
    if (infoModal) infoModal.classList.add('hidden');

    if (this.currentScene !== 'public_temple') {
      this.switchScene('public_temple');
    }
    if (this.isSeatedOnMat) {
      this.standUpFromMat();
    }

    const bx = (buddhaIdx - 3) * 4.1;
    const standPos = new THREE.Vector3(bx, 0.35, -17.2);
    const dist = Math.hypot(
      this.playerGroup.position.x - standPos.x,
      this.playerGroup.position.z - standPos.z
    );

    const performBowAndShowCard = () => {
      this.playerGroup.position.set(standPos.x, 0.35, standPos.z);
      this.playerGroup.rotation.y = Math.PI; // Face the Buddha statue
      this.bowAnimTimer = 2.2; // Slow, reverent bow
      window.templeAudio.playBowingBell();

      if (this.buddhaSpotlight) {
        this.buddhaSpotlight.position.set(bx, 4.4, 0.6);
        this.buddhaSpotlight.visible = true;
      }

      const displayNumName = `${buddhaIdx + 1}. ${cur.name}`;
      this.startCutscene({
        emoji: '🙏',
        title: `Bowing to ${displayNumName}`,
        subtitle: `"${cur.buddhaWish}"`,
        targetPos: new THREE.Vector3(bx, 2.3, -19.8),
        camDistance: 7.4,
        camHeight: 2.8,
        baseAngle: 0.25,
        orbitSpeed: -0.25,
        duration: 2.2,
        onComplete: () => {
          this.openBuddhaBowAcknowledgeModal(buddhaIdx);
        }
      });
    };

    if (dist > 3.5 && this.playerGroup.position.z < 1.0) {
      // Walk around the solid Offering Table (x in [-6.65, 6.65], z in [-17.0, -13.8]) rather than through it
      if (this.playerGroup.position.z > -16.9) {
        const sideX = (this.playerGroup.position.x + standPos.x) >= 0 ? 7.9 : -7.9;
        this.walkToPath([new THREE.Vector3(sideX, 0.35, -15.4), standPos], performBowAndShowCard);
      } else {
        this.walkToAndTrigger(standPos, performBowAndShowCard);
      }
    } else {
      performBowAndShowCard();
    }
  }

  openBuddhaBowAcknowledgeModal(buddhaIdx) {
    const buddhas = window.GAME_DATA.SEVEN_BUDDHAS || [];
    const cur = buddhas[buddhaIdx];
    if (!cur) return;

    const modal = document.getElementById('buddha-bow-ack-modal');
    const titleEl = document.getElementById('ack-buddha-title');
    const bodyEl = document.getElementById('ack-buddha-body');
    if (!modal || !bodyEl) return;

    const displayNumName = `${buddhaIdx + 1}. ${this.isZh() ? (cur.cnName || cur.name) : cur.name}`;
    const alreadyBowed = !!(this.state.bowedBuddhas && this.state.bowedBuddhas[buddhaIdx]);
    const summarySentence = this.isZh()
      ? (cur.zhWishAndBenefit || `${cur.zhBuddhaWish} ${cur.zhBowBenefit}`)
      : (cur.wishAndBenefit || `${cur.buddhaWish} ${cur.bowBenefit}`);
    const buddhaTitle = this.dField(cur, 'title', 'zhTitle');
    const spokenText = `${displayNumName}. ${summarySentence}`;

    modal.classList.remove('hidden');
    if (titleEl) {
      titleEl.textContent = `🙏 ${displayNumName} (${this.t('+10 VP', '+10 功德')})`;
    }

    const buddhaImgSrc = cur.img
      ? ((window.INLINE_ASSETS && window.INLINE_ASSETS[cur.img]) || cur.img)
      : '';

    bodyEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:14px; font-weight:800; color:#7a1c1c;">
          ✨ ${buddhaTitle} (${this.isZh() ? cur.name : cur.cnName})
        </div>
        <button class="listen-voice-btn" id="btn-ack-speak">${this.t('🔊 Listen', '🔊 朗读')}</button>
      </div>

      <!-- Single Concise Wish & Benefit Information Box -->
      <div style="background:linear-gradient(135deg, #fffaf0, #ffefc2); border:2.5px solid #d4941c; border-radius:14px; padding:16px 18px; box-shadow:0 4px 12px rgba(192,57,43,0.10); display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
        ${buddhaImgSrc ? `<img src="${buddhaImgSrc}" alt="${displayNumName}" style="width:92px; height:124px; object-fit:contain; background:#ffffff; border-radius:10px; border:2px solid #d4941c; flex-shrink:0;" />` : ''}
        <div style="flex:1; min-width:200px;">
          <div style="font-size:12px; font-weight:900; text-transform:uppercase; color:#8b1e1e; margin-bottom:6px; letter-spacing:0.5px;">
            ${this.t("🌟 Buddha's Wish & Benefit", '🌟 佛陀本愿与礼佛功德')}
          </div>
          <div style="font-size:17px; font-weight:900; color:#3a1606; line-height:1.45;">
            "${summarySentence}"
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:center; margin-top:4px;">
        <button class="primary-gold-btn" id="btn-confirm-buddha-ack" style="padding:12px 28px; font-size:16px; width:100%; max-width:440px;">
          ${alreadyBowed ? this.t('✅ Acknowledge', '✅ 欢喜顶礼') : this.t('✅ Acknowledge (+10 VP)', '✅ 至诚顶礼 (+10 功德)')}
        </button>
      </div>
    `;

    const speakBtn = document.getElementById('btn-ack-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => window.templeAudio.speakText(spokenText, true));
    }

    const ackBtn = document.getElementById('btn-confirm-buddha-ack');
    if (ackBtn) {
      ackBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (!this.state.bowedBuddhas[buddhaIdx]) {
          this.state.bowedBuddhas[buddhaIdx] = true;
          const labelEl = document.getElementById(`buddha-world-label-${buddhaIdx}`);
          if (labelEl) {
            labelEl.innerHTML = `✅ ${displayNumName}`;
          }
          window.templeAudio.playGoodDeedChime();
          const bx = (buddhaIdx - 3) * 4.1;
          this.addVirtuePoints(
            10,
            this.t(`🙏 Bowed to ${displayNumName} +10 VP!`, `🙏 礼拜${displayNumName} +10 功德!`),
            new THREE.Vector3(bx, 4.2, -20.5)
          );
          const count = this.getBowedBuddhaCount();
          this.showToast(
            this.t(
              `🙏 You acknowledged ${displayNumName}'s Wish & Benefit! (+10 VP · ${count}/7 Buddhas Bowed)`,
              `🙏 礼拜并领受 ${displayNumName} 慈愿功德！(+10 功德 · ${count}/7 尊)`
            )
          );
        } else {
          window.templeAudio.playGoodDeedChime();
          this.showToast(this.t(`🙏 You bowed with gratitude to ${displayNumName}!`, `🙏 再次至诚顶礼 ${displayNumName}！`));
        }
        this.saveState();
        this.updateHUD();
      });
    }

    window.templeAudio.speakText(spokenText, false);
  }

  // -------------------- GAME DESIGNER ENHANCEMENT #2: 7-BUDDHA WISDOM MASTER QUIZ (+30 VP) --------------------
  openBuddhaQuizModal() {
    const modal = document.getElementById('buddha-quiz-modal');
    const bodyEl = document.getElementById('buddha-quiz-body');
    if (!modal || !bodyEl) return;
    modal.classList.remove('hidden');

    const buddhas = window.GAME_DATA.SEVEN_BUDDHAS || [];
    const questions = this.isZh()
      ? [
          {
            q: '1. 哪一尊佛被称为「净眼明心之佛」，愿一切孩童以清净诚实之心开启光明智慧？',
            options: ['1. 毗婆尸佛 (Vipassi)', '3. 毗舍浮佛 (Vessabhu)', '6. 迦叶佛 (Kassapa)'],
            correct: 0
          },
          {
            q: '2. 礼拜第二尊「尸弃佛（无畏暖光之佛）」有什么殊胜功德？',
            options: [
              '赐予坚毅勇气与自信安稳，远离一切恐惧！',
              '让素汤煮得更快。',
              '逆时针绕白塔。'
            ],
            correct: 0
          },
          {
            q: '3. 哪一尊佛祈愿世间众生与森林动物和平安乐、像一家人一样相处？',
            options: ['5. 拘那含牟尼佛', '3. 毗舍浮佛 (Vessabhu)', '1. 毗婆尸佛 (Vipassi)'],
            correct: 1
          },
          {
            q: '4. 礼拜本师「释迦牟尼佛」能获得什么殊胜利益？',
            options: [
              '唤醒内心本具的慈悲智慧，得无上加持！',
              '让山谷下起大雨。',
              '藏起七净水杯。'
            ],
            correct: 0
          }
        ]
      : [
          {
            q: '1. Which Buddha is the "Buddha of Clear Eyes & Bright Mind" who wishes for every child to see the world clearly with an honest heart?',
            options: ['1. Vipassi Buddha', '3. Vessabhu Buddha', '6. Kassapa Buddha'],
            correct: 0
          },
          {
            q: '2. What is the Benefit of bowing to "2. Sikhi Buddha" (the Buddha of Warm Courage Light)?',
            options: [
              'It makes you brave, confident, and safe from fear!',
              'It helps you cook vegetable soup faster.',
              'It lets you walk counter-clockwise around the Stupa.'
            ],
            correct: 0
          },
          {
            q: '3. Which Buddha wishes for all people, birds, and forest animals to live together safely like one big family?',
            options: ['5. Konagamana Buddha', '3. Vessabhu Buddha', '1. Vipassi Buddha'],
            correct: 1
          },
          {
            q: '4. What is the Benefit of bowing to "7. Sakyamuni Buddha" (Our Teacher of Kindness & Awakening)?',
            options: [
              'It awakens your inner kindness, wisdom, and greatest blessings!',
              'It makes it rain on the mountain.',
              'It hides the 7 water cups.'
            ],
            correct: 0
          }
        ];

    let curQ = 0;
    const renderQuestion = () => {
      if (curQ >= questions.length) {
        const firstTime = !this.state.quizMasterUnlocked;
        this.state.quizMasterUnlocked = true;
        this.saveState();
        window.templeAudio.playGateOpenFanfare();
        if (firstTime) {
          this.addVirtuePoints(30, this.t('🧠👑 7-Buddha Quiz Master +30 VP!', '🧠👑 七佛智慧通达 +30 功德!'));
        }
        bodyEl.innerHTML = `
          <div style="text-align:center; padding:18px;">
            <div style="font-size:52px; margin-bottom:8px;">👑🧠🪷</div>
            <h3 style="font-size:20px; color:#7a1c1c; margin-bottom:8px;">
              ${this.t('Congratulations! You Passed the 7-Buddha Wisdom Quiz!', '随喜赞叹！恭喜通关七佛智慧问答！')}
            </h3>
            <p style="font-size:15px; font-weight:800; color:#2b1608; margin-bottom:14px;">
              ${firstTime
                ? this.t('You earned +30 Virtue Points and unlocked the "7-Buddha Quiz Master" Golden Sticker!', '获得 +30 功德值，并解锁「七佛智慧通达章」金色徽章！')
                : this.t('You truly remember the Wishes and Benefits of the Seven Buddhas!', '你已熟记过去七佛的本愿与殊胜利益！')}
            </p>
            <button class="primary-gold-btn" onclick="document.getElementById('buddha-quiz-modal').classList.add('hidden')" style="padding:10px 26px; font-size:15px;">
              ${this.t('✨ Awesome!', '✨ 太棒了！')}
            </button>
          </div>
        `;
        return;
      }

      const item = questions[curQ];
      bodyEl.innerHTML = `
        <div style="font-size:12.5px; font-weight:900; color:#8b3a1e; text-transform:uppercase;">
          ${this.t(`Question ${curQ + 1} of ${questions.length}`, `第 ${curQ + 1} 题 / 共 ${questions.length} 题`)}
        </div>
        <div style="font-size:16.5px; font-weight:900; color:#241306; line-height:1.45; margin-bottom:8px;">
          ${item.q}
        </div>
        <div id="quiz-options-list"></div>
        <div id="quiz-feedback" style="font-size:13.5px; font-weight:800; min-height:22px;"></div>
      `;

      const listEl = document.getElementById('quiz-options-list');
      const fbEl = document.getElementById('quiz-feedback');
      item.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = optText;
        btn.addEventListener('click', () => {
          if (idx === item.correct) {
            btn.classList.add('correct');
            window.templeAudio.playGoodDeedChime();
            if (fbEl) {
              fbEl.style.color = '#155724';
              fbEl.textContent = this.t('✅ Correct! Moving to next question...', '✅ 回答正确！进入下一题...');
            }
            setTimeout(() => {
              curQ += 1;
              renderQuestion();
            }, 650);
          } else {
            btn.classList.add('wrong');
            if (fbEl) {
              fbEl.style.color = '#721c24';
              fbEl.textContent = this.t('💡 Not quite! Tip: Check the 7 Buddhas Wishes & Benefits card and try another answer!', '💡 再想一想！提示：可以点击「认识七佛」查看佛愿哦！');
            }
          }
        });
        listEl.appendChild(btn);
      });
    };

    renderQuestion();
  }

  // -------------------- PRAYER HALL 5-ACTION SELECTION MENU (ALL TASKS = +10 VIRTUE POINTS) --------------------
  getNearestMeditationMatPos() {
    let bestMat = new THREE.Vector3(0, 0.35, -10.2);
    let minDist = Infinity;
    for (const mat of this.meditationMats) {
      const d = Math.hypot(
        this.playerGroup.position.x - mat.pos.x,
        this.playerGroup.position.z - mat.pos.z
      );
      if (d < minDist) {
        minDist = d;
        bestMat = mat.pos;
      }
    }
    return bestMat;
  }

  handlePrayerHallAction(actionNum) {
    // When inside Mount Wutai 文殊殿, route the Hall Actions to Manjushri Hall quests!
    // Facing East (+X): Middle = 7 water cups (z=0), Left = Flower (z=-2.95), Right = Incense (z=2.95)
    if (this.isInsideWenshuHall()) {
      if (actionNum === 1) {
        this.meditateInWenshuHall(this.activeWenshuSeatIdx);
      } else if (actionNum === 2) {
        this.bowToManjushriQuest();
      } else if (actionNum === 3) {
        this.walkToWenshuAltarAndOffer('water', 0);
      } else if (actionNum === 4) {
        this.walkToWenshuAltarAndOffer('flower', -2.95);
      } else if (actionNum === 5) {
        this.walkToWenshuAltarAndOffer('scent', 2.95);
      }
      return;
    }

    // When inside West 长寿殿 (Longevity Hall), route Hall Actions to Amitayus Longevity Hall quests!
    // Facing West (-X): Middle = 7 water cups (z=0), Left = Flower (z=2.95), Right = Incense (z=-2.95)
    if (this.isInsideChangshouHall()) {
      if (actionNum === 1) {
        this.meditateInChangshouHall(this.activeChangshouSeatIdx);
      } else if (actionNum === 2) {
        this.bowToChangshouQuest();
      } else if (actionNum === 3) {
        this.walkToChangshouAltarAndOffer('water', 0);
      } else if (actionNum === 4) {
        this.walkToChangshouAltarAndOffer('flower', 2.95);
      } else if (actionNum === 5) {
        this.walkToChangshouAltarAndOffer('scent', -2.95);
      }
      return;
    }

    if (!this.canEnterPrayerHall()) {
      this.showToast('🔒 Complete at least 5 Good Deeds (10 VP) on the mountain trail to unlock the 7-Buddha Prayer Hall!');
      return;
    }

    if (this.currentScene !== 'public_temple') {
      this.switchScene('public_temple');
    }

    // 1. Meditate (+10 VP) — Walk to a mat and sit down
    if (actionNum === 1) {
      this.isBowing25 = false;
      const targetMat = this.getNearestMeditationMatPos();
      const dist = Math.hypot(
        this.playerGroup.position.x - targetMat.x,
        this.playerGroup.position.z - targetMat.z
      );
      if (this.isSeatedOnMat || dist < 1.2) {
        this.sitOnMeditationMat(targetMat, 'meditate');
      } else {
        this.walkToAndTrigger(targetMat, () => {
          this.sitOnMeditationMat(targetMat, 'meditate');
        });
      }
      return;
    }

    // 2. Bow 25 Times on the Mat (+10 VP, calm sound counting each bow 1..25)
    if (actionNum === 2) {
      const targetMat = this.getNearestMeditationMatPos();
      const dist = Math.hypot(
        this.playerGroup.position.x - targetMat.x,
        this.playerGroup.position.z - targetMat.z
      );
      if (this.isSeatedOnMat || dist < 1.2) {
        this.sitOnMeditationMat(targetMat, 'bow25');
      } else {
        this.walkToAndTrigger(targetMat, () => {
          this.sitOnMeditationMat(targetMat, 'bow25');
        });
      }
      return;
    }

    // 3. Offer 7 Water Cups (+10 VP)
    if (actionNum === 3) {
      this.walkToAltarAndOffer('water', 0);
      return;
    }

    // 4. Offer Flower on Left of Water (+10 VP)
    if (actionNum === 4) {
      this.walkToAltarAndOffer('flower', -3.6);
      return;
    }

    // 5. Offer Incense on Right of Water (+10 VP)
    if (actionNum === 5) {
      this.walkToAltarAndOffer('scent', 3.6);
      return;
    }
  }

  areHallOfferingsComplete(hallKey) {
    const src = hallKey === 'wenshu'
      ? (this.state.wenshuOfferings || {})
      : hallKey === 'changshou'
        ? (this.state.changshouOfferings || {})
        : (this.state.offeringsMade || {});
    return !!(src.water && src.flower && src.scent);
  }

  renderHallOfferingTablePrompt(promptEl, hallKey) {
    if (!promptEl) return;
    const src = hallKey === 'wenshu'
      ? (this.state.wenshuOfferings || {})
      : hallKey === 'changshou'
        ? (this.state.changshouOfferings || {})
        : (this.state.offeringsMade || {});
    const hallLabel = hallKey === 'wenshu'
      ? this.t('Manjushri Altar Table', '文殊殿供桌')
      : hallKey === 'changshou'
        ? this.t('Longevity Altar Table', '长寿殿供桌')
        : this.t('Prayer Hall Altar Table', '七佛宝殿供桌');
    const mkBtn = (done, actNum, icon, en, zh) => `
      <button class="hud-btn ${done ? '' : 'primary-red'}" onclick="window.game.handlePrayerHallAction(${actNum})" style="padding:7px 12px; font-size:12.5px; font-weight:800; opacity:${done ? '0.78' : '1'};">
        ${done ? `✅ ${this.t(en, zh)}` : `${icon} ${this.t(en, zh)}`}
      </button>
    `;
    promptEl.style.display = 'flex';
    promptEl.innerHTML = `
      <div class="quest-box-1" style="padding:10px 14px;">
        <div class="talk-portrait-col"><div class="talk-avatar-frame">🪔</div><div class="talk-speaker-badge">${hallLabel}</div></div>
        <div class="talk-bubble-body">
          <div class="box-title" style="font-size:14px; margin-bottom:8px;">
            ${this.t('Make Water, Flower & Incense offerings at the table:', '请在供桌敬献清净水、鲜花与妙香：')}
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${mkBtn(!!src.water, 3, '💧', 'Offer Water', '供水')}
            ${mkBtn(!!src.flower, 4, '🪷', 'Offer Flower', '供花')}
            ${mkBtn(!!src.scent, 5, '🪔', 'Offer Incense', '供香')}
          </div>
        </div>
      </div>
    `;
  }

  walkToAltarAndOffer(type, targetX = 0) {
    if (this.isSeatedOnMat) {
      this.standUpFromMat();
    }
    this.isBowing25 = false;
    this._offeringActiveUntil = Date.now() + 2200;
    const dist = Math.hypot(
      this.playerGroup.position.x - targetX,
      this.playerGroup.position.z - (-13.2)
    );
    if (dist < 2.2) {
      this.playerGroup.rotation.y = Math.PI;
      this.makeOffering(type);
    } else {
      this.walkToAndTrigger(new THREE.Vector3(targetX, 0.35, -13.2), () => {
        this.playerGroup.rotation.y = Math.PI;
        this.makeOffering(type);
      });
    }
  }

  // Offerings execute immediately and display their concise benefit in the info box (no acknowledgement needed)
  openOfferingQuestModal(type) {
    this.makeOffering(type);
  }

  isInsidePrayerHall() {
    return (
      this.currentScene === 'public_temple' &&
      Math.abs(this.playerGroup.position.x) < 17.5 &&
      this.playerGroup.position.z < 0.2
    );
  }

  maybePromptHuixiangThen(exitCallback) {
    if (this.isInsidePrayerHall()) {
      this.promptHuixiangBeforeExit(exitCallback);
    } else {
      exitCallback();
    }
  }

  // 「回向」 (Merit Dedication) right before leaving the Prayer Hall
  promptHuixiangBeforeExit(exitCallback) {
    if (this._isHuixiangOpen) return;
    const modal = document.getElementById('huixiang-modal');
    const bodyEl = document.getElementById('huixiang-modal-body');
    if (!modal || !bodyEl) {
      exitCallback();
      return;
    }

    this._isHuixiangOpen = true;
    this.walkTarget = null;
    if (this.isSeatedOnMat) this.standUpFromMat();

    const closeAndRun = (cb) => {
      modal.classList.add('hidden');
      this._isHuixiangOpen = false;
      if (cb) cb();
    };

    const renderStep1 = () => {
      bodyEl.innerHTML = `
        <div class="offering-info-box">
          <div class="offering-info-label">${this.t('🙏 Before Leaving the Prayer Hall', '🙏 离殿前善心回向')}</div>
          <div class="offering-info-text">
            ${this.t(
              `Would you like to offer <strong>「Hui Xiang」 (Merit Dedication)</strong> with your current Virtue Points (<strong>${this.state.virtuePoints} VP</strong>)?`,
              `离殿前，是否愿意将您当前的功德值（<strong>${this.state.virtuePoints} 功德</strong>）诚心<strong>「回向」</strong>给一切众生？`
            )}
          </div>
        </div>
        <div style="font-size:13.5px; color:#5a3214; font-weight:700; line-height:1.5; background:#fffaf0; padding:10px 12px; border-radius:10px; border:1px dashed #d4941c;">
          ${this.t(
            `• <strong>Yes:</strong> Choose who to dedicate your merit to — Virtue Points return to <strong>0</strong> and your <strong>Liberation Point</strong> increases by <strong>+1</strong>.<br>• <strong>No:</strong> Keep your Virtue Points (<strong>${this.state.virtuePoints} VP</strong>) and step outside the Prayer Hall.`,
            `• <strong>诚心回向：</strong>选择回向善愿后，当前功德值归 <strong>0</strong>，<strong>解脱功德（Liberation Point）+1</strong>。<br>• <strong>暂不回向：</strong>保留当前功德值（<strong>${this.state.virtuePoints} 功德</strong>），直接走出佛殿。`
          )}
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px; flex-wrap:wrap;">
          <button class="hud-btn" id="btn-huixiang-no" style="padding:10px 18px; font-size:14.5px;">${this.t('No, Leave Hall', '暂不回向，离殿')}</button>
          <button class="primary-gold-btn" id="btn-huixiang-yes" style="padding:10px 22px; font-size:14.5px;">${this.t('Yes, Do 「Hui Xiang」 ✨', '诚心「回向」 ✨')}</button>
        </div>
      `;
      modal.classList.remove('hidden');
      window.templeAudio.speakText(this.t(
        'Before leaving the Prayer Hall, would you like to perform Hui Xiang merit dedication?',
        '离殿前，请问是否愿意将所修功德诚心回向法界众生？'
      ));

      document.getElementById('btn-huixiang-no').addEventListener('click', () => {
        closeAndRun(exitCallback);
      });
      document.getElementById('btn-huixiang-yes').addEventListener('click', () => {
        renderStep2();
      });
    };

    const renderStep2 = () => {
      const options = [
        { id: 'world_peace', label: this.t('🌍 1. World peace', '🌍 1. 祈愿世界和平安宁') },
        { id: 'people_healthy', label: this.t('💚 2. People healthy', '💚 2. 祈愿亲友及大众健康长寿') },
        { id: 'pure_land', label: this.t('🪷 3. Reborn in Pure Land', '🪷 3. 愿生西方极乐净土') },
        { id: 'free_from_pain', label: this.t('😊 4. All beings happy and free from pain', '😊 4. 愿一切众生离苦得乐') }
      ];
      bodyEl.innerHTML = `
        <div style="font-size:14.5px; font-weight:800; color:#5a250a;">
          ${this.t('Select one or more wishes for your <strong>「Hui Xiang」</strong> dedication:', '请勾选一项或多项<strong>「回向」</strong>善愿：')}
        </div>
        <div class="huixiang-options-grid">
          ${options.map((opt) => `
            <label class="huixiang-option-card">
              <input type="checkbox" class="huixiang-checkbox" value="${opt.id}" />
              <span>${opt.label}</span>
            </label>
          `).join('')}
        </div>
        <div id="huixiang-error-msg" style="color:#b22222; font-size:13px; font-weight:800; display:none;">
          ${this.t('Please select at least one dedication wish!', '请至少选择一项回向善愿！')}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:4px; flex-wrap:wrap;">
          <button class="hud-btn" id="btn-huixiang-back" style="padding:9px 16px;">${this.t('← Back', '← 返回')}</button>
          <button class="primary-gold-btn" id="btn-huixiang-confirm" style="padding:10px 22px; font-size:14.5px;">
            ${this.t('✨ Confirm 「Hui Xiang」 (Liberation +1)', '✨ 确认回向（解脱功德 +1）')}
          </button>
        </div>
      `;

      bodyEl.querySelectorAll('.huixiang-checkbox').forEach((cb) => {
        cb.addEventListener('change', () => {
          cb.closest('.huixiang-option-card').classList.toggle('selected', cb.checked);
          document.getElementById('huixiang-error-msg').style.display = 'none';
        });
      });

      document.getElementById('btn-huixiang-back').addEventListener('click', renderStep1);
      document.getElementById('btn-huixiang-confirm').addEventListener('click', () => {
        const checked = Array.from(bodyEl.querySelectorAll('.huixiang-checkbox:checked')).map((el) => el.value);
        if (!checked.length) {
          document.getElementById('huixiang-error-msg').style.display = 'block';
          return;
        }
        this.state.virtuePoints = 0;
        this.state.liberationPoints = (this.state.liberationPoints || 0) + 1;
        this.state.prayerHallUnlocked = true; // Door remains permanently open even when VP is 0
        this.saveState();
        this.updateHUD();
        window.templeAudio.playHuixiangBlessing();
        window.templeAudio.speakText(this.t(
          `Merit dedicated. Your Liberation Point is now ${this.state.liberationPoints}.`,
          `功德回向圆满！您的解脱功德现为 ${this.state.liberationPoints}。`
        ));
        this.showToast(this.t(
          `✨🙏 「Hui Xiang」 Complete! Virtue Points reset to 0 & Liberation Point is now ${this.state.liberationPoints}!`,
          `✨🙏 回向圆满！功德值归零清净，解脱功德现为 ${this.state.liberationPoints}！`
        ));
        closeAndRun(exitCallback);
      });
    };

    renderStep1();
  }

  // -------------------- SACRED OFFERINGS (WATER, FLOWER, SCENT -> +10 VP EACH) --------------------
  makeOffering(type) {
    if (!this.canEnterPrayerHall()) {
      this.showToast(this.t(
        '🔒 Complete at least 5 Good Deeds (10 VP) on the mountain trail to unlock the 7-Buddha Prayer Hall!',
        '🔒 请先在山林善行途中完成至少 5 项善行（10 功德）开启七佛宝殿！'
      ));
      return;
    }

    if (this.state.offeringsMade[type]) {
      const names = this.isZh()
        ? { water: '七杯清净水', flower: '妙莲花', scent: '清净檀香' }
        : { water: '7 Golden Water Cups', flower: 'Sacred Lotus Flowers', scent: 'Celadon Lotus Incense' };
      this.showToast(this.t(
        `✨ You have already offered the ${names[type]} on the Bodhi table!`,
        `✨ 您已在供桌敬献过 ${names[type]} 啦！`
      ));
      return;
    }

    this.state.offeringsMade[type] = true;
    if (this.offeringMeshes[type]) {
      this.offeringMeshes[type].visible = true;
    }

    this._offeringActiveUntil = Date.now() + 2200;
    window.templeAudio.playOfferingSound();
    this.bowAnimTimer = 1.1;

    const offeringData = (window.GAME_DATA.OFFERINGS || []).find((o) => o.id === type);
    const benefitText = offeringData ? this.dField(offeringData, 'benefit', 'zhBenefit') : this.t('Pure peace', '清净安宁');
    const offName = offeringData ? this.dField(offeringData, 'name', 'cnName') : type;
    const actionLabels = {
      water: {
        title: `💧 ${benefitText}`,
        pos: new THREE.Vector3(0, 3.4, -15.4),
        toast: `💧 ${this.t('Benefit', '供养利益')}: ${benefitText}`
      },
      flower: {
        title: `🪷 ${benefitText}`,
        pos: new THREE.Vector3(-4.2, 3.4, -15.4),
        toast: `🪷 ${this.t('Benefit', '供养利益')}: ${benefitText}`
      },
      scent: {
        title: `🪔 ${benefitText}`,
        pos: new THREE.Vector3(4.1, 3.4, -15.4),
        toast: `🪔 ${this.t('Benefit', '供养利益')}: ${benefitText}`
      }
    };

    const info = actionLabels[type];
    this.addVirtuePoints(10, info.title, info.pos);
    this.showToast(info.toast);
    window.templeAudio.speakText(info.toast, false);

    // Display Offering Benefit directly inside the Prayer Hall Information Box (just the benefit, no VP text)
    const bannerEl = document.getElementById('bow-blessing-banner');
    if (bannerEl && offeringData) {
      bannerEl.style.display = 'flex';
      bannerEl.innerHTML = `
        <div class="bow-buddha-icon">${offeringData.emoji}</div>
        <div class="bow-buddha-text">
          <div class="bow-buddha-header">${offName}</div>
          <div class="bow-buddha-benefit">✨ ${this.t('Benefit', '供养利益')}: ${benefitText}</div>
        </div>
      `;
      clearTimeout(this._offeringBannerTimer);
      this._offeringBannerTimer = setTimeout(() => {
        if (!this.isBowing25 && bannerEl) bannerEl.style.display = 'none';
      }, 6500);
    }
  }

  // -------------------- MOUNT WUTAI 文殊殿: 20 SEATS, OFFERINGS, MANJUSHRI BOW, CHILL SEAT & SUTRA BOOKS --------------------
  getNearestWenshuSeat(seatIdx = null) {
    const seats = this.wenshuSeats || [];
    if (seatIdx !== null && seatIdx !== undefined && seats[seatIdx]) {
      return seats[seatIdx];
    }
    let best = seats[0] || { idx: 0, x: 122.8, y: 16.92, z: 4.0 };
    let minD = Infinity;
    for (const s of seats) {
      const d = Math.hypot(this.playerGroup.position.x - s.x, this.playerGroup.position.z - s.z);
      if (d < minD) {
        minD = d;
        best = s;
      }
    }
    return best;
  }

  sitOnWenshuSeat(seatObj) {
    if (!this.canCrossEastRiver() || !this.canEnterWenshuHall()) {
      this.showToast(this.t(
        '🔒 Build the Wisdom Bridge and circle all 7 White Stupas first to enter Manjushri Hall!',
        '🔒 请先修建智慧桥并依次顺绕七座白塔，方能进入文殊殿！'
      ));
      return;
    }
    const targetSeat = seatObj || this.getNearestWenshuSeat();
    this.walkTarget = null;
    this.isBowing25 = false;
    this.isSeatedOnMat = true;
    this.activeWenshuSeatIdx = targetSeat.idx;
    this.activePractice = 'meditate';
    this.setPoseMode('sit');
    this.playerGroup.position.set(targetSeat.x, (targetSeat.y || 16.92) + 0.24, targetSeat.z);
    this.playerGroup.rotation.y = Math.PI / 2; // Face East toward Manjushri Bodhisattva
    this.cameraAngle = -Math.PI / 2;

    document.querySelectorAll('.mat-btn[data-hall-action]').forEach((btn) => {
      btn.classList.toggle('active-practice', btn.dataset.hallAction === '1');
    });
    const leaveBtn = document.getElementById('btn-leave-mat');
    if (leaveBtn) leaveBtn.style.display = 'inline-flex';

    window.templeAudio.playMeditationTone();
    if (this.charParts.meditationRing) this.charParts.meditationRing.material.opacity = 0.82;
    this.addVirtuePoints(
      10,
      this.t(`🧘 Manjushri Seat #${targetSeat.idx + 1} +10 VP!`, `🧘 文殊殿第 ${targetSeat.idx + 1} 号蒲团禅坐 +10 功德!`),
      new THREE.Vector3(targetSeat.x, 19.2, targetSeat.z)
    );
    this.showToast(this.t(
      `🧘 Sitting on Meditation Seat #${targetSeat.idx + 1}/20 in Manjushri Hall — serene wisdom! (+10 VP)`,
      `🧘 在文殊殿第 ${targetSeat.idx + 1}/20 号禅坐垫静修 — 清净生大智慧！(+10 功德)`
    ));
  }

  meditateInWenshuHall(seatIdx = null) {
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    const targetSeat = this.getNearestWenshuSeat(seatIdx);
    const dist = Math.hypot(this.playerGroup.position.x - targetSeat.x, this.playerGroup.position.z - targetSeat.z);
    if ((this.isSeatedOnMat && this.activeWenshuSeatIdx === targetSeat.idx) || dist < 1.2) {
      this.sitOnWenshuSeat(targetSeat);
    } else {
      this.walkToAndTrigger(new THREE.Vector3(targetSeat.x, 16.92, targetSeat.z), () => {
        this.sitOnWenshuSeat(targetSeat);
      });
    }
  }

  walkToWenshuAltarAndOffer(type, zOffset = 0) {
    if (!this.canCrossEastRiver() || !this.canEnterWenshuHall()) {
      this.showToast(this.t(
        '🔒 Build the Wisdom Bridge and circle all 7 White Stupas first to enter Manjushri Hall!',
        '🔒 请先修建智慧桥并依次顺绕七座白塔，方能进入文殊殿！'
      ));
      return;
    }
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.isBowing25 = false;
    this._offeringActiveUntil = Date.now() + 2200;
    const altarApproach = new THREE.Vector3(124.6, 16.92, 4.0 + zOffset);
    const dist = Math.hypot(
      this.playerGroup.position.x - altarApproach.x,
      this.playerGroup.position.z - altarApproach.z
    );
    if (dist < 2.2) {
      this.playerGroup.rotation.y = Math.PI / 2;
      this.makeWenshuOffering(type);
    } else {
      this.walkToAndTrigger(altarApproach, () => {
        this.playerGroup.rotation.y = Math.PI / 2;
        this.makeWenshuOffering(type);
      });
    }
  }

  makeWenshuOffering(type) {
    if (!this.canCrossEastRiver() || !this.canEnterWenshuHall()) {
      this.showToast(this.t(
        '🔒 Build the Wisdom Bridge and circle all 7 White Stupas first to enter Manjushri Hall!',
        '🔒 请先修建智慧桥并依次顺绕七座白塔，方能进入文殊殿！'
      ));
      return;
    }

    if (!this.state.wenshuOfferings) this.state.wenshuOfferings = { water: false, flower: false, scent: false };
    const firstTime = !this.state.wenshuOfferings[type];
    this.state.wenshuOfferings[type] = true;
    const meshes = this.wenshuHallGroup && this.wenshuHallGroup.userData && this.wenshuHallGroup.userData.offeringMeshes;
    if (meshes && meshes[type]) {
      meshes[type].visible = true;
    }

    this._offeringActiveUntil = Date.now() + 2200;
    window.templeAudio.playOfferingSound();
    this.bowAnimTimer = 1.2;

    const offeringData = (window.GAME_DATA.OFFERINGS || []).find((o) => o.id === type);
    const benefitText = offeringData ? this.dField(offeringData, 'benefit', 'zhBenefit') : this.t('Pure peace & wisdom', '清净与智慧');
    const offName = offeringData ? this.dField(offeringData, 'name', 'cnName') : type;
    const zPos = type === 'flower' ? 4.0 - 2.95 : (type === 'scent' ? 4.0 + 2.95 : 4.0);
    const worldPos = new THREE.Vector3(126.2, 18.8, zPos);
    if (firstTime) {
      this.addVirtuePoints(10, `${offeringData ? offeringData.emoji : '✨'} ${benefitText}`, worldPos);
    } else {
      this.saveState();
      this.updateHUD();
      this.spawnFloatingText(`${offeringData ? offeringData.emoji : '✨'} ${benefitText}`, worldPos);
    }
    this.showToast(`${offeringData ? offeringData.emoji : '✨'} ${this.t('Benefit', '供养利益')}: ${benefitText}`);
    window.templeAudio.speakText(this.t(`Offering to Manjushri. Benefit: ${benefitText}`, `文殊殿供养功德：${benefitText}`), false);

    const bannerEl = document.getElementById('bow-blessing-banner');
    if (bannerEl && offeringData) {
      bannerEl.style.display = 'flex';
      bannerEl.innerHTML = `
        <div class="bow-buddha-icon">${offeringData.emoji}</div>
        <div class="bow-buddha-text">
          <div class="bow-buddha-header">${offName} · ${this.t('Manjushri Hall', '文殊殿')}</div>
          <div class="bow-buddha-benefit">✨ ${this.t('Benefit', '供养利益')}: ${benefitText}</div>
        </div>
      `;
      clearTimeout(this._offeringBannerTimer);
      this._offeringBannerTimer = setTimeout(() => {
        if (!this.isBowing25 && bannerEl) bannerEl.style.display = 'none';
      }, 6500);
    }
  }

  bowToManjushriQuest() {
    if (!this.canCrossEastRiver() || !this.canEnterWenshuHall()) {
      this.showToast(this.t(
        `🔒 Circle all 7 White Stupas (${this.getCircledStupaCount()}/7 done) to unlock Manjushri Hall!`,
        `🔒 请先顺绕七座白塔 (${this.getCircledStupaCount()}/7 圆满)，方能进入文殊殿！`
      ));
      return;
    }
    const mData = window.GAME_DATA.MANJUSHRI_DATA || {};
    const modal = document.getElementById('buddha-bow-ack-modal');
    const titleEl = document.getElementById('ack-buddha-title');
    const bodyEl = document.getElementById('ack-buddha-body');
    if (!modal || !bodyEl) return;

    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    if (this.isSeatedOnMat) this.standUpFromMat();

    this.playerGroup.position.set(124.2, 16.92, 4.0);
    this.playerGroup.rotation.y = Math.PI / 2; // Face East toward Manjushri statue
    this.cameraAngle = -Math.PI / 2;
    this.bowAnimTimer = 2.0;
    window.templeAudio.playBowingBell();

    modal.classList.remove('hidden');
    const mName = this.dField(mData, 'name', 'cnName') || this.t('Manjushri Bodhisattva', '文殊菩萨');
    if (titleEl) titleEl.textContent = `🦁 ${mName} (${this.t('+10 VP', '+10 功德')})`;

    const already = !!this.state.bowedManjushri;
    const mTitle = this.dField(mData, 'title', 'zhTitle') || this.t('Bodhisattva of Great Wisdom', '大智文殊师利菩萨');
    const wishText = this.dField(mData, 'wishAndBenefit', 'zhWishAndBenefit') || this.t(
      'Wishing you bright wisdom and gentle joy to help all beings.',
      '愿一切行者皆得清净大智慧，欢喜修学，广利众生。'
    );
    const mantraPhonetics = this.dField(mData, 'mantraText', 'zhMantraText')
      || 'Om A Ra Pa Ca Na Dhih · 嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）';
    const wenshuRefSrc = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/wenshu_bodhisattva_ref.jpg'])
      || 'assets/wenshu_bodhisattva_ref.jpg?v=2';

    bodyEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:14.5px; font-weight:800; color:#7a1c1c;">
          ✨ ${mTitle}
        </div>
        <button class="listen-voice-btn" id="btn-ack-speak">${this.t('🔊 Listen', '🔊 朗读')}</button>
      </div>
      <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap; background:linear-gradient(135deg, #fffaf0, #ffefc2); border:2.5px solid #d4941c; border-radius:14px; padding:14px 16px;">
        <img src="${wenshuRefSrc}" alt="文殊菩萨" style="width:120px; height:132px; object-fit:cover; border-radius:10px; border:2px solid #b45309; flex-shrink:0;" />
        <div style="flex:1; min-width:190px;">
          <div style="font-size:12px; font-weight:900; color:#8b1e1e; margin-bottom:4px; letter-spacing:0.4px;">
            ${this.t('🦁 Manjushri Mantra (文殊心咒)', '🦁 文殊心咒')}
          </div>
          <div style="font-size:14.5px; font-weight:900; color:#7a1c1c; background:#fff8e1; border:1px solid #e6b85c; border-radius:8px; padding:6px 10px; margin-bottom:8px;">
            ${mantraPhonetics}
          </div>
          <div style="font-size:12px; font-weight:900; text-transform:uppercase; color:#8b1e1e; margin-bottom:4px; letter-spacing:0.4px;">
            ${this.t("🦁 Manjushri's Wish & Benefit", '🦁 文殊菩萨大愿与礼敬功德')}
          </div>
          <div style="font-size:16px; font-weight:800; color:#3a1606; line-height:1.45;">
            "${wishText}"
          </div>
        </div>
      </div>
      <div style="display:flex; justify-content:center; margin-top:4px;">
        <button class="primary-gold-btn" id="btn-confirm-buddha-ack" style="padding:12px 28px; font-size:16px; width:100%; max-width:440px;">
          ${already ? this.t('✅ Acknowledge', '✅ 欢喜顶礼') : this.t('✅ Acknowledge (+10 VP)', '✅ 至诚顶礼 (+10 功德)')}
        </button>
      </div>
    `;

    const speakBtn = document.getElementById('btn-ack-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => window.templeAudio.speakText(wishText, true));
    }

    const ackBtn = document.getElementById('btn-confirm-buddha-ack');
    if (ackBtn) {
      ackBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (!this.state.bowedManjushri) {
          this.state.bowedManjushri = true;
          this.state.activePrayerSkillId = 'wenshu';
          this.addVirtuePoints(10, this.t('🦁 Bowed to Manjushri +10 VP!', '🦁 礼敬文殊菩萨 +10 功德!'), new THREE.Vector3(129.4, 20.5, 4.0));
          this.showToast(this.t(
            '🦁 Unlocked 文殊心咒 (Om A Ra Pa Ca Na Dhih)! Press [L] to chant anytime, or switch prayers in Skills!',
            '🦁 礼敬文殊菩萨圆满！已解锁「文殊心咒」（嗡阿喇巴札那谛），按快捷键 [L] 即可发声持诵！'
          ));
        } else {
          window.templeAudio.playGoodDeedChime();
          this.showToast(this.t('🦁 Bowed with gratitude to Manjushri Bodhisattva!', '🦁 再次至诚顶礼大智文殊师利菩萨！'));
        }
        this.saveState();
        this.updateHUD();
      });
    }
  }

  visitAndReadSutra(bookId) {
    const bk = (window.GAME_DATA.SUTRA_BOOKS || []).find((b) => b.id === bookId);
    if (!bk) return;
    if (!this.canCrossEastRiver()) {
      this.showToast(this.t('🪵 Speak to Bridge Master Lu first to build the Wisdom Bridge across the East River!', '🪵 请先找东溪岸边的鲁班桥师修建智慧桥！'));
      return;
    }
    const targetY = window.GAME_DATA.getTerrainHeight(bk.x, bk.z);
    const seatPos = new THREE.Vector3(bk.x, targetY, bk.z + 0.85);
    const dist = Math.hypot(this.playerGroup.position.x - bk.x, this.playerGroup.position.z - bk.z);

    const sitAndOpen = () => {
      this.playerGroup.position.set(seatPos.x, targetY + 0.45, seatPos.z);
      this.playerGroup.rotation.y = Math.PI;
      this.setPoseMode('sit');
      const bkTitle = this.dField(bk, 'title', 'zhTitle');
      if (!this.state.readSutras[bk.id]) {
        this.state.readSutras[bk.id] = true;
        const st = (this.sutraStations || []).find((s) => s.book.id === bk.id);
        if (st && st.labelEl) {
          st.labelEl.innerHTML = `✅ ${bkTitle}`;
          st.labelEl.classList.add('completed');
        }
        window.templeAudio.playGoodDeedChime();
        this.addVirtuePoints(5, this.t(`📖 Studied ${bkTitle} +5 VP!`, `📖 认真学习《${bkTitle}》 +5 功德!`));
        this.saveState();
        this.updateHUD();
      }
      this.openSutraBookModal(bk);
    };

    if (dist < 6.0) {
      sitAndOpen();
    } else {
      this.walkToAndTrigger(seatPos, sitAndOpen);
    }
  }

  openSutraBookModal(bookData) {
    const modal = document.getElementById('sutra-book-modal');
    const titleEl = document.getElementById('sutra-modal-title');
    const bodyEl = document.getElementById('sutra-book-body');
    if (!modal || !bodyEl) return;

    modal.classList.remove('hidden');
    const bkTitle = this.dField(bookData, 'title', 'zhTitle');
    const bkSub = this.dField(bookData, 'subtitle', 'zhSubtitle') || this.t('Mount Wutai Sutra Reading Corner', '五台山读经亭');
    const pagesArr = this.isZh() ? (bookData.zhPages || bookData.pages || []) : (bookData.pages || []);
    if (titleEl) titleEl.textContent = `📖 ${bkTitle}`;
    const alreadyRead = !!(this.state.readSutras && this.state.readSutras[bookData.id]);
    const pagesHtml = pagesArr.map(
      (p) => `<div style="background:#fffaf0; border:1.5px solid #e6c67c; border-radius:12px; padding:12px 14px; font-size:15px; line-height:1.55; font-weight:700; color:#3a1f0d;">${p}</div>`
    ).join('');

    bodyEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:13px; font-weight:800; color:#8b3a1e;">
          🪷 ${bkSub}
        </div>
        <button class="listen-voice-btn" id="btn-sutra-speak">${this.t('🔊 Listen', '🔊 朗读故事')}</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px; max-height:48vh; overflow-y:auto;">
        ${pagesHtml}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="font-size:12px; font-weight:700; color:#6b4c35;">${this.t('🌱 Little Bodhi Heart · Kindness Every Day', '🌱 小小菩提心 · 日日学慈悲与尊重')}</span>
        <div style="display:flex; gap:8px;">
          <button class="hud-btn" id="btn-sutra-stand-close">${this.t('Stand & Continue', '起身续行')}</button>
          <button class="primary-gold-btn" id="btn-sutra-finish-read" style="padding:9px 18px; font-size:14px;">
            ${alreadyRead ? this.t('✅ Read Again', '✅ 再次温习') : this.t('📖 Finish Reading (+5 VP)', '📖 恭读完毕 (+5 功德)')}
          </button>
        </div>
      </div>
    `;

    const speakSutraBtn = document.getElementById('btn-sutra-speak');
    if (speakSutraBtn) {
      speakSutraBtn.addEventListener('click', () => {
        const speech = `${bkTitle}。${pagesArr.join(' ')}`;
        window.templeAudio.speakText(speech, true);
      });
    }

    const finishBtn = document.getElementById('btn-sutra-finish-read');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        if (!this.state.readSutras[bookData.id]) {
          this.state.readSutras[bookData.id] = true;
          const st = this.sutraStations.find((s) => s.book.id === bookData.id);
          if (st && st.labelEl) {
            st.labelEl.innerHTML = `✅ ${bkTitle}`;
            st.labelEl.classList.add('completed');
          }
          window.templeAudio.playGoodDeedChime();
          this.addVirtuePoints(5, this.t(`📖 Read ${bkTitle} +5 VP!`, `📖 恭读《${bkTitle}》 +5 功德!`));
        } else {
          this.showToast(this.t(`📖 Reflected peacefully on "${bkTitle}"!`, `📖 静心温习《${bkTitle}》！`));
        }
        this.saveState();
        this.updateHUD();
        modal.classList.add('hidden');
        this.setPoseMode('idle');
      });
    }
    const standBtn = document.getElementById('btn-sutra-stand-close');
    if (standBtn) {
      standBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        this.setPoseMode('idle');
      });
    }
  }

  teleportToWenshuHallInterior() {
    if (!this.canCrossEastRiver()) {
      this.showToast(this.t('🪵 Build the Wisdom Bridge at the East River first! Click Master Lu near x=25.', '🪵 请先在东溪边找鲁班桥师搭建智慧桥！'));
      return;
    }
    if (!this.canEnterWenshuHall()) {
      this.showToast(this.t(
        `☸️ Circle all 7 White Stupas ascending Mount Wutai to unlock Manjushri Hall! (${this.getCircledStupaCount()} / 7 done)`,
        `☸️ 请按顺序顺绕七座白塔，方能推开五台山文殊殿大门！(${this.getCircledStupaCount()} / 7 圆满)`
      ));
      return;
    }
    if (this.currentScene !== 'public_temple') {
      this.switchScene('public_temple');
    }
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.isAutoCirclingStupa = false;
    this.playerGroup.position.set(118.0, 16.92, 4.0);
    this.playerGroup.rotation.y = Math.PI / 2;
    this.cameraAngle = -Math.PI / 2;
    this._wasInWenshuHallCamera = true;
    this.showToast(this.t(
      '🦁 Welcome inside Mount Wutai Manjushri Hall! Bow to Manjushri Bodhisattva or make water, flower & incense offerings!',
      '🦁 欢迎来到五台山顶文殊殿！可礼敬文殊菩萨或供水、供花、供香！'
    ));
  }

  // -------------------- WEST FLOWER GARDENS, 3 LOTUS PONDS & 长寿殿 (LONGEVITY HALL) --------------------
  plantFlowerGarden(gardenId) {
    const gd = (window.GAME_DATA.CHANGSHOU_FLOWER_GARDENS || []).find((g) => g.id === gardenId);
    if (!gd) return;
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    const st = (this.flowerGardenStations || []).find((s) => s.garden.id === gardenId);
    const dist = Math.hypot(this.playerGroup.position.x - gd.x, this.playerGroup.position.z - gd.z);
    const gy = window.GAME_DATA.getTerrainHeight(gd.x, gd.z);

    const doPlant = () => {
      if (!this.state.plantedFlowerGardens) this.state.plantedFlowerGardens = {};
      const firstTime = !this.state.plantedFlowerGardens[gd.id];
      this.state.plantedFlowerGardens[gd.id] = true;
      if (st && st.group && st.group.userData) {
        if (st.group.userData.unplantedGroup) st.group.userData.unplantedGroup.visible = false;
        if (st.group.userData.plantedGroup) st.group.userData.plantedGroup.visible = true;
      }
      const gName = this.dField(gd, 'name', 'zhName');
      const gBen = this.dField(gd, 'benefit', 'zhBenefit');
      if (st && st.labelEl) {
        st.labelEl.innerHTML = `✅ ${gName}`;
        st.labelEl.classList.add('completed');
      }
      window.templeAudio.playOfferingSound();
      this.bowAnimTimer = 1.2;
      const worldPos = new THREE.Vector3(gd.x, gy + 2.5, gd.z);
      if (firstTime) {
        this.addVirtuePoints(5, `🌸 ${gName} +5 ${this.t('VP!', '功德!')}`, worldPos);
      } else {
        this.spawnFloatingText(`🌸 ${gName}`, worldPos);
      }
      this.saveState();
      this.updateHUD();
      this.showToast(`🌸 ${gName}: ${gBen}`);
      window.templeAudio.speakText(gBen, false);
    };

    if (dist < 6.5) {
      doPlant();
    } else {
      this.walkToAndTrigger(new THREE.Vector3(gd.x, gy, gd.z - 2.3), doPlant);
    }
  }

  plantLotusPond(pondId) {
    const pd = (window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || []).find((p) => p.id === pondId);
    if (!pd) return;
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    const st = (this.lotusPondStations || []).find((s) => s.pond.id === pondId);
    const dist = Math.hypot(this.playerGroup.position.x - pd.x, this.playerGroup.position.z - pd.z);
    const py = window.GAME_DATA.getTerrainHeight(pd.x, pd.z);

    const doPlantLotus = () => {
      if (!this.state.plantedLotusPonds) this.state.plantedLotusPonds = {};
      const firstTime = !this.state.plantedLotusPonds[pd.id];
      this.state.plantedLotusPonds[pd.id] = true;
      if (st && st.group && st.group.userData) {
        if (st.group.userData.unplantedGroup) st.group.userData.unplantedGroup.visible = false;
        if (st.group.userData.plantedGroup) st.group.userData.plantedGroup.visible = true;
      }
      const pName = this.dField(pd, 'name', 'zhName');
      const pBen = this.dField(pd, 'benefit', 'zhBenefit');
      if (st && st.labelEl) {
        st.labelEl.innerHTML = `✅ ${pName}`;
        st.labelEl.classList.add('completed');
      }
      window.templeAudio.playOfferingSound();
      this.bowAnimTimer = 1.2;
      const plantedCount = Object.keys(this.state.plantedLotusPonds || {}).length;
      const worldPos = new THREE.Vector3(pd.x, py + 2.6, pd.z);
      if (firstTime) {
        this.addVirtuePoints(5, `🪷 ${pName} +5 ${this.t('VP!', '功德!')}`, worldPos);
      } else {
        this.spawnFloatingText(`🪷 ${pName}`, worldPos);
      }
      this.saveState();
      this.updateHUD();
      const totalPonds = (window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || []).length || 4;
      this.showToast(`🪷 (${plantedCount}/${totalPonds}) ${pName}: ${pBen}`);
      window.templeAudio.speakText(pBen, false);
    };

    if (dist < 6.8) {
      doPlantLotus();
    } else {
      this.walkToAndTrigger(new THREE.Vector3(pd.x, py, pd.z + 4.1), doPlantLotus);
    }
  }

  teleportToChangshouHallInterior() {
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.isAutoCirclingStupa = false;
    this.playerGroup.position.set(-90.0, 16.92, 4.0);
    this.playerGroup.rotation.y = -Math.PI / 2; // Face West toward 长寿佛
    this.cameraAngle = Math.PI / 2;
    this._wasInChangshouHallCamera = true;
    this.showToast(this.t(
      '🏺 Welcome to Longevity Hall (长寿殿)! Bow to Amitayus Buddha, plant 4 sacred flower ponds, meditate on 20 mats, or make offerings!',
      '🏺 欢迎登上西山之巅长寿殿！可礼敬长寿佛（解锁长寿佛心咒）、20座蒲团禅修或水花香供养！'
    ));
  }

  getNearestChangshouSeat(seatIdx = null) {
    const seats = this.changshouSeats || [];
    if (seatIdx !== null && seatIdx !== undefined && seats[seatIdx]) {
      return seats[seatIdx];
    }
    let best = seats[0] || { idx: 0, x: -94.8, y: 16.92, z: 4.0 };
    let minD = Infinity;
    for (const s of seats) {
      const d = Math.hypot(this.playerGroup.position.x - s.x, this.playerGroup.position.z - s.z);
      if (d < minD) {
        minD = d;
        best = s;
      }
    }
    return best;
  }

  sitOnChangshouSeat(seatObj) {
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    const targetSeat = seatObj || this.getNearestChangshouSeat();
    this.walkTarget = null;
    this.isBowing25 = false;
    this.isSeatedOnMat = true;
    this.activeChangshouSeatIdx = targetSeat.idx;
    this.activePractice = 'meditate';
    this.setPoseMode('sit');
    this.playerGroup.position.set(targetSeat.x, (targetSeat.y || 16.92) + 0.24, targetSeat.z);
    this.playerGroup.rotation.y = -Math.PI / 2; // Face West toward 长寿佛
    this.cameraAngle = Math.PI / 2;

    document.querySelectorAll('.mat-btn[data-hall-action]').forEach((btn) => {
      btn.classList.toggle('active-practice', btn.dataset.hallAction === '1');
    });
    const leaveBtn = document.getElementById('btn-leave-mat');
    if (leaveBtn) leaveBtn.style.display = 'inline-flex';

    window.templeAudio.playMeditationTone();
    if (this.charParts.meditationRing) this.charParts.meditationRing.material.opacity = 0.82;
    this.addVirtuePoints(
      10,
      this.t(`🧘 Longevity Seat #${targetSeat.idx + 1} +10 VP!`, `🧘 长寿殿第 ${targetSeat.idx + 1} 号蒲团禅坐 +10 功德!`),
      new THREE.Vector3(targetSeat.x, 19.3, targetSeat.z)
    );
    this.showToast(this.t(
      `🧘 Sitting on Meditation Mat #${targetSeat.idx + 1}/20 in Longevity Hall — radiant peace & health! (+10 VP)`,
      `🧘 在长寿殿第 ${targetSeat.idx + 1}/20 号禅坐垫静修 — 身心康泰安和！(+10 功德)`
    ));
  }

  meditateInChangshouHall(seatIdx = null) {
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    const targetSeat = this.getNearestChangshouSeat(seatIdx);
    const dist = Math.hypot(this.playerGroup.position.x - targetSeat.x, this.playerGroup.position.z - targetSeat.z);
    if ((this.isSeatedOnMat && this.activeChangshouSeatIdx === targetSeat.idx) || dist < 1.4) {
      this.sitOnChangshouSeat(targetSeat);
    } else {
      this.walkToAndTrigger(new THREE.Vector3(targetSeat.x, 16.92, targetSeat.z), () => {
        this.sitOnChangshouSeat(targetSeat);
      });
    }
  }

  walkToChangshouAltarAndOffer(type, zOffset = 0) {
    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.isBowing25 = false;
    this._offeringActiveUntil = Date.now() + 2200;
    const altarApproach = new THREE.Vector3(-96.4, 16.92, 4.0 + zOffset);
    const dist = Math.hypot(
      this.playerGroup.position.x - altarApproach.x,
      this.playerGroup.position.z - altarApproach.z
    );
    if (dist < 2.2) {
      this.playerGroup.rotation.y = -Math.PI / 2;
      this.makeChangshouOffering(type);
    } else {
      this.walkToAndTrigger(altarApproach, () => {
        this.playerGroup.rotation.y = -Math.PI / 2;
        this.makeChangshouOffering(type);
      });
    }
  }

  makeChangshouOffering(type) {
    if (!this.state.changshouOfferings) this.state.changshouOfferings = { water: false, flower: false, scent: false };
    const firstTime = !this.state.changshouOfferings[type];
    this.state.changshouOfferings[type] = true;
    const meshes = this.changshouHallGroup && this.changshouHallGroup.userData && this.changshouHallGroup.userData.offeringMeshes;
    if (meshes && meshes[type]) {
      meshes[type].visible = true;
    }

    this._offeringActiveUntil = Date.now() + 2200;
    window.templeAudio.playOfferingSound();
    this.bowAnimTimer = 1.2;

    const offeringData = (window.GAME_DATA.OFFERINGS || []).find((o) => o.id === type);
    const benefitText = offeringData ? this.dField(offeringData, 'benefit', 'zhBenefit') : this.t('Health & longevity peace', '健康长寿清净安乐');
    const offName = offeringData ? this.dField(offeringData, 'name', 'cnName') : type;
    const zPos = type === 'flower' ? 4.0 + 2.95 : (type === 'scent' ? 4.0 - 2.95 : 4.0);
    const worldPos = new THREE.Vector3(-98.2, 19.3, zPos);
    if (firstTime) {
      this.addVirtuePoints(10, `${offeringData ? offeringData.emoji : '✨'} ${benefitText}`, worldPos);
    } else {
      this.saveState();
      this.updateHUD();
      this.spawnFloatingText(`${offeringData ? offeringData.emoji : '✨'} ${benefitText}`, worldPos);
    }
    this.showToast(`${offeringData ? offeringData.emoji : '✨'} ${this.t('Benefit', '供养利益')}: ${benefitText}`);
    window.templeAudio.speakText(this.t(`Offering to Amitayus Buddha. Benefit: ${benefitText}`, `长寿殿供养功德：${benefitText}`), false);

    const bannerEl = document.getElementById('bow-blessing-banner');
    if (bannerEl && offeringData) {
      bannerEl.style.display = 'flex';
      bannerEl.innerHTML = `
        <div class="bow-buddha-icon">${offeringData.emoji}</div>
        <div class="bow-buddha-text">
          <div class="bow-buddha-header">${offName} · ${this.t('Longevity Hall (长寿殿)', '长寿殿')}</div>
          <div class="bow-buddha-benefit">✨ ${this.t('Benefit', '供养利益')}: ${benefitText}</div>
        </div>
      `;
      clearTimeout(this._offeringBannerTimer);
      this._offeringBannerTimer = setTimeout(() => {
        if (!this.isBowing25 && bannerEl) bannerEl.style.display = 'none';
      }, 6500);
    }
  }

  bowToChangshouQuest() {
    const cData = window.GAME_DATA.CHANGSHOU_DATA || {};
    const modal = document.getElementById('buddha-bow-ack-modal');
    const titleEl = document.getElementById('ack-buddha-title');
    const bodyEl = document.getElementById('ack-buddha-body');
    if (!modal || !bodyEl) return;

    if (this.currentScene !== 'public_temple') this.switchScene('public_temple');
    if (this.isSeatedOnMat) this.standUpFromMat();

    this.playerGroup.position.set(-96.2, 16.92, 4.0);
    this.playerGroup.rotation.y = -Math.PI / 2; // Face West toward 长寿佛 statue
    this.cameraAngle = Math.PI / 2;
    this.bowAnimTimer = 2.0;
    window.templeAudio.playBowingBell();

    modal.classList.remove('hidden');
    const cName = this.dField(cData, 'name', 'cnName') || this.t('Amitayus · Longevity Buddha', '长寿佛');
    if (titleEl) titleEl.textContent = `🏺 ${cName} (${this.t('+10 VP', '+10 功德')})`;

    const already = !!this.state.bowedChangshou;
    const cTitle = this.dField(cData, 'title', 'zhTitle') || this.t('Buddha of Infinite Life', '无量寿智如来');
    const mantraText = cData.zhMantraText || '嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈';
    const wishText = this.dField(cData, 'mantraBenefit', 'zhMantraBenefit') || this.dField(cData, 'wishAndBenefit', 'zhWishAndBenefit') || this.t(
      'May spiritual teachers live long, family members enjoy good health, world peace prevail, blessings & wisdom grow, illnesses & disasters cease, and accidental harm be avoided.',
      '善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。'
    );
    const refSrc = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/changshou_buddha_ref.jpg'])
      || 'assets/changshou_buddha_ref.jpg?v=2';

    bodyEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:14.5px; font-weight:800; color:#7a1c1c;">
          ✨ ${cTitle}
        </div>
        <button class="listen-voice-btn" id="btn-ack-speak">${this.t('🔊 Listen', '🔊 朗读')}</button>
      </div>
      <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap; background:linear-gradient(135deg, #fffaf0, #ffefc2); border:2.5px solid #d4941c; border-radius:14px; padding:14px 16px;">
        <img src="${refSrc}" alt="长寿佛" style="width:120px; height:150px; object-fit:cover; border-radius:10px; border:2px solid #b45309; flex-shrink:0;" />
        <div style="flex:1; min-width:190px;">
          <div style="font-size:12px; font-weight:900; color:#8b1e1e; margin-bottom:4px; letter-spacing:0.4px;">
            ${this.t('🏺 Longevity Buddha Mantra (长寿佛心咒)', '🏺 长寿佛心咒')}
          </div>
          <div style="font-size:16px; font-weight:900; color:#7a1c1c; background:#fff8e1; border:1px solid #e6b85c; border-radius:8px; padding:6px 10px; margin-bottom:8px;">
            ${mantraText}
          </div>
          <div style="font-size:12px; font-weight:900; color:#8b1e1e; margin-bottom:4px; letter-spacing:0.4px;">
            ${this.t('✨ Mantra Benefit (长寿佛心咒功德利益)', '✨ 长寿佛心咒利益')}
          </div>
          <div style="font-size:15.5px; font-weight:800; color:#3a1606; line-height:1.45;">
            "${wishText}"
          </div>
        </div>
      </div>
      <div style="display:flex; justify-content:center; margin-top:4px;">
        <button class="primary-gold-btn" id="btn-confirm-buddha-ack" style="padding:12px 28px; font-size:16px; width:100%; max-width:440px;">
          ${already ? this.t('✅ Acknowledge', '✅ 欢喜顶礼') : this.t('✅ Acknowledge (+10 VP & Unlock 长寿佛心咒)', '✅ 至诚顶礼 (+10 功德并解锁长寿佛心咒)')}
        </button>
      </div>
    `;

    const speakBtn = document.getElementById('btn-ack-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => window.templeAudio.speakText(`${cData.spokenZh || mantraText}。${wishText}`, true));
    }

    const ackBtn = document.getElementById('btn-confirm-buddha-ack');
    if (ackBtn) {
      ackBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (!this.state.bowedChangshou) {
          this.state.bowedChangshou = true;
          this.state.activePrayerSkillId = 'changshou';
          this.addVirtuePoints(10, this.t('🏺 Bowed to Amitayus +10 VP!', '🏺 礼敬长寿佛 +10 功德!'), new THREE.Vector3(-101.4, 21.7, 4.0));
          this.showToast(this.t(
            '🏺 Unlocked 长寿佛心咒 (嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈)! Press [L] to chant!',
            '🏺 礼敬长寿佛圆满！已点亮千佛殿「长寿佛」并解锁「长寿佛心咒」（按 [L] 持诵）！'
          ));
        } else {
          window.templeAudio.playGoodDeedChime();
          this.showToast(this.t('🏺 Bowed with gratitude to Amitayus · Longevity Buddha!', '🏺 再次至诚顶礼无量寿智如来·长寿佛！'));
        }
        this.saveState();
        this.updateHUD();
      });
    }
  }

  isPrayerSkillUnlocked(skillId) {
    if (skillId === 'amitofo') {
      return !!(this.state.amitofoUnlocked || this.state.virtuePoints >= 100 || (this.state.amitofoCount || 0) > 0);
    }
    if (skillId === 'wenshu') return !!this.state.bowedManjushri;
    if (skillId === 'changshou') return !!this.state.bowedChangshou;
    return false;
  }

  getActivePrayerSkillId() {
    const cur = this.state.activePrayerSkillId || 'amitofo';
    if (this.isPrayerSkillUnlocked(cur)) return cur;
    for (const id of ['amitofo', 'wenshu', 'changshou']) {
      if (this.isPrayerSkillUnlocked(id)) return id;
    }
    return 'amitofo';
  }

  setActivePrayerSkill(skillId) {
    if (!['amitofo', 'wenshu', 'changshou'].includes(skillId)) return;
    if (!this.isPrayerSkillUnlocked(skillId)) {
      if (skillId === 'amitofo') {
        this.showToast(this.t(
          '🔒 Reach 100 VP to unlock Nanmo Amitofo skill first!',
          '🔒 功德满 100 即可解锁第一技能「南无阿弥陀佛」！'
        ));
      } else if (skillId === 'wenshu') {
        this.showToast(this.t(
          '🔒 Bow to Manjushri Bodhisattva in 文殊殿 to unlock 文殊心咒 first!',
          '🔒 请先前往文殊殿礼敬文殊菩萨，解锁「文殊心咒」！'
        ));
      } else {
        this.showToast(this.t(
          '🔒 Bow to Longevity Buddha in 长寿殿 to unlock 长寿佛心咒 first!',
          '🔒 请先前往长寿殿礼敬长寿佛，解锁「长寿佛心咒」！'
        ));
      }
      return;
    }
    this.state.activePrayerSkillId = skillId;
    this.saveState();
    this.updateHUD();
    const skillInfo = (window.GAME_DATA.PRAYER_SKILLS || {})[skillId];
    const dispName = skillInfo ? this.dField(skillInfo, 'name', 'zhName') : skillId;
    this.showToast(this.t(
      `⌨️ Switched shortcut [L] to: ${dispName}`,
      `⌨️ 已切换快捷键 [L] 为：「${dispName}」`
    ));
    const capModal = document.getElementById('skills-capability-modal');
    if (capModal && !capModal.classList.contains('hidden')) {
      this.openSkillsCapabilityModal(this._activeCapTab || 'all');
    }
  }

  castActivePrayerSkill(fromButtonClick = false) {
    if (this._isPrayerChanting) {
      this.showToast(this.t(
        '⏳ Please wait until the current prayer finishes before praying again!',
        '⏳ 正在恭敬念诵，请听完本遍祈祷后再继续念诵！'
      ));
      return false;
    }
    const activeId = this.getActivePrayerSkillId();
    if (!this.isPrayerSkillUnlocked(activeId) && !fromButtonClick) {
      this.showToast(this.t(
        '🔒 Unlock a Prayer Skill first (100 VP for Nanmo Amitofo, or bow to 文殊菩萨 for 文殊心咒) to use key [L]!',
        '🔒 请先解锁祈祷技能（满100功德解锁「南无阿弥陀佛」或礼敬文殊菩萨解锁「文殊心咒」），即可按快捷键 [L] 念诵！'
      ));
      return false;
    }
    if (activeId === 'wenshu') return this.castWenshuMantra();
    if (activeId === 'changshou') return this.castChangshouPrayer();
    return this.castNanmoAmitofo();
  }

  _startPrayerChantLock(skillId) {
    this._isPrayerChanting = true;
    this._activeChantingSkillId = skillId;
    this.updateHUD();
    const capModalOpen = document.getElementById('skills-capability-modal');
    if (capModalOpen && !capModalOpen.classList.contains('hidden')) {
      this.openSkillsCapabilityModal(this._activeCapTab || 'all');
    }
    window.templeAudio.pronouncePrayer(skillId, this.state.lang, () => {
      this._isPrayerChanting = false;
      this._activeChantingSkillId = null;
      this.updateHUD();
      const capModal = document.getElementById('skills-capability-modal');
      if (capModal && !capModal.classList.contains('hidden')) {
        this.openSkillsCapabilityModal(this._activeCapTab || 'all');
      }
    });
  }

  castWenshuMantra() {
    if (!this.state.bowedManjushri) {
      this.showToast(this.t(
        '🔒 Bow to Manjushri Bodhisattva in 文殊殿 first to unlock Manjushri Mantra (文殊心咒)!',
        '🔒 请先前往文殊殿礼敬文殊菩萨，即可解锁修行技能「文殊心咒」！'
      ));
      return false;
    }
    if (this._isPrayerChanting) {
      this.showToast(this.t(
        '⏳ Please wait until the current prayer finishes before praying again!',
        '⏳ 正在恭敬念诵，请听完本遍祈祷后再继续念诵！'
      ));
      return false;
    }
    this._startPrayerChantLock('wenshu');
    this.state.wenshuMantraCount = (this.state.wenshuMantraCount || 0) + 1;
    if (this.charParts.meditationRing) {
      this.charParts.meditationRing.material.opacity = 0.95;
    }
    this.bowAnimTimer = 2.4;
    const cnt = this.state.wenshuMantraCount;
    this.addVirtuePoints(
      5,
      this.t(`🦁✨ Om A Ra Pa Ca Na Dhih (#${cnt}) +5 VP!`, `🦁✨ 嗡 阿 喇 巴 札 那 谛 (${cnt}) +5 功德!`),
      this.playerGroup.position.clone().add(new THREE.Vector3(0, 3.0, 0))
    );
    this.showToast(this.t(
      `🦁🔊 Om A Ra Pa Ca Na Dhih · 嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì） (Chanted: ${cnt})`,
      `🦁🔊 持诵「文殊心咒」：嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）· Om A Ra Pa Ca Na Dhih (第 ${cnt} 遍)`
    ));
    this.saveState();
    this.updateHUD();
    const capModal = document.getElementById('skills-capability-modal');
    if (capModal && !capModal.classList.contains('hidden')) {
      this.openSkillsCapabilityModal(this._activeCapTab || 'all');
    }
    return true;
  }

  castChangshouPrayer() {
    if (!this.state.bowedChangshou) {
      this.showToast(this.t(
        '🔒 Bow to Amitayus · Longevity Buddha in 长寿殿 first to unlock 长寿佛心咒!',
        '🔒 请先前往西侧长寿殿礼敬长寿佛，即可解锁修行技能「长寿佛心咒」！'
      ));
      return false;
    }
    if (this._isPrayerChanting) {
      this.showToast(this.t(
        '⏳ Please wait until the current prayer finishes before praying again!',
        '⏳ 正在恭敬念诵，请听完本遍祈祷后再继续念诵！'
      ));
      return false;
    }
    this._startPrayerChantLock('changshou');
    this.state.changshouPrayerCount = (this.state.changshouPrayerCount || 0) + 1;
    if (this.charParts.meditationRing) {
      this.charParts.meditationRing.material.opacity = 0.95;
    }
    this.bowAnimTimer = 2.3;
    const cnt = this.state.changshouPrayerCount;
    const cSkill = (window.GAME_DATA.PRAYER_SKILLS || {}).changshou || {};
    const cBenefit = this.dField(cSkill, 'benefit', 'zhBenefit') || '善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。';
    this.addVirtuePoints(
      5,
      this.t(`🏺✨ 长寿佛心咒 (#${cnt}) +5 VP!`, `🏺✨ 嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈 (${cnt}) +5 功德!`),
      this.playerGroup.position.clone().add(new THREE.Vector3(0, 3.0, 0))
    );
    this.showToast(this.t(
      `🏺🔊 长寿佛心咒: 嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈 — ${cBenefit} (Chanted: ${cnt})`,
      `🏺🔊 持诵「长寿佛心咒」：嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈（第 ${cnt} 遍）`
    ));
    const bannerEl = document.getElementById('bow-blessing-banner');
    if (bannerEl) {
      bannerEl.style.display = 'flex';
      bannerEl.innerHTML = `
        <div class="bow-buddha-icon">🏺</div>
        <div class="bow-buddha-text">
          <div class="bow-buddha-header">${this.t('Longevity Buddha Mantra (长寿佛心咒)', '长寿佛心咒')} · 嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈</div>
          <div class="bow-buddha-benefit">✨ ${this.t('Mantra Benefit', '长寿佛心咒利益')}: ${cBenefit}</div>
        </div>
      `;
      clearTimeout(this._offeringBannerTimer);
      this._offeringBannerTimer = setTimeout(() => {
        if (!this.isBowing25 && bannerEl) bannerEl.style.display = 'none';
      }, 6500);
    }
    this.saveState();
    this.updateHUD();
    const capModal = document.getElementById('skills-capability-modal');
    if (capModal && !capModal.classList.contains('hidden')) {
      this.openSkillsCapabilityModal(this._activeCapTab || 'all');
    }
    return true;
  }

  // -------------------- MEDITATION MAT & 25-BOW SEQUENCE --------------------
  sitOnMeditationMat(matPos = new THREE.Vector3(0, 0.35, -10.2), mode = 'meditate') {
    if (!this.canEnterPrayerHall()) {
      this.showToast(this.t(
        '🔒 Accumulate 10 Virtue Points (5 Good Deeds) to enter the 7-Buddha Prayer Hall!',
        '🔒 请先完成至少 5 项善行（10 功德）开启七佛宝殿！'
      ));
      return;
    }

    this.walkTarget = null;
    this.isSeatedOnMat = true;
    this.setPoseMode('sit');
    this.playerGroup.position.set(matPos.x, 0.55, matPos.z);
    this.playerGroup.rotation.y = Math.PI; // Face the 7 Buddhas

    const leaveBtn = document.getElementById('btn-leave-mat');
    if (leaveBtn) leaveBtn.style.display = 'inline-flex';

    if (mode === 'bow25') {
      this.startTwentyFiveBows();
    } else {
      this.startMeditationOnMat();
    }
  }

  standUpFromMat() {
    this.isSeatedOnMat = false;
    this.isBowing25 = false;
    this.activePractice = null;
    this.activeWenshuSeatIdx = null;
    this.activeChangshouSeatIdx = null;
    this.closeChairRestBlossomOverlay();
    this.setPoseMode('idle');
    if (this.isInsideWenshuHall()) {
      this.playerGroup.position.y = 16.92;
    } else if (this.isInsideChangshouHall()) {
      this.playerGroup.position.y = 16.92;
    } else {
      this.playerGroup.position.y = this.playerGroup.position.z < 0.5 ? 0.35 : 0;
    }
    if (this.charParts.upperBody) this.charParts.upperBody.rotation.x = 0;
    if (this.charParts.meditationRing) this.charParts.meditationRing.material.opacity = 0;
    if (this.buddhaSpotlight) this.buddhaSpotlight.visible = false;
    const blessingBanner = document.getElementById('bow-blessing-banner');
    if (blessingBanner) blessingBanner.style.display = 'none';
    const leaveBtn = document.getElementById('btn-leave-mat');
    if (leaveBtn) leaveBtn.style.display = 'none';
    const statusEl = document.getElementById('hall-status-text');
    if (statusEl) {
      statusEl.textContent = this.isInsideWenshuHall()
        ? this.t('🦁 Manjushri Hall (+10 VP)', '🦁 文殊殿修行 (+10 功德)')
        : (this.isInsideChangshouHall()
          ? this.t('🏺 Longevity Hall (+10 VP)', '🏺 长寿殿修行 (+10 功德)')
          : this.t('🏮 Prayer Hall (+10 VP)', '🏮 佛殿修行 (+10 功德)'));
    }
    const bowBtn = document.getElementById('btn-hall-bow25');
    if (bowBtn) {
      bowBtn.textContent = this.isInsideWenshuHall()
        ? this.t('2. 🙏 Bow', '2. 🙏 礼敬文殊')
        : (this.isInsideChangshouHall()
          ? this.t('2. 🙏 Bow', '2. 🙏 礼敬长寿佛')
          : this.t('2. 🙏 Bow 25x', '2. 🙏 礼佛25拜'));
    }
    document.querySelectorAll('.mat-btn[data-hall-action]').forEach((b) => b.classList.remove('active-practice'));
  }

  startMeditationOnMat() {
    this.isBowing25 = false;
    this.activePractice = 'meditate';
    if (this.buddhaSpotlight) this.buddhaSpotlight.visible = false;
    const blessingBanner = document.getElementById('bow-blessing-banner');
    if (blessingBanner) blessingBanner.style.display = 'none';
    document.querySelectorAll('.mat-btn[data-hall-action]').forEach((btn) => {
      btn.classList.toggle('active-practice', btn.dataset.hallAction === '1');
    });

    window.templeAudio.playMeditationTone();
    if (this.charParts.meditationRing) this.charParts.meditationRing.material.opacity = 0.82;
    const statusEl = document.getElementById('hall-status-text');
    if (statusEl) {
      statusEl.textContent = this.t('🧘 Meditating peacefully on the mat (Calm & Mindful)', '🧘 正在宝殿蒲团安详禅坐（静心明慧）');
    }
    this.addVirtuePoints(
      10,
      this.t('🧘 Mindful Meditation +10 VP!', '🧘 静心禅坐 +10 功德!'),
      this.playerGroup.position.clone().add(new THREE.Vector3(0, 2.8, 0))
    );
    this.showToast(this.t('🧘 You sit on the mat and meditate peacefully! (+10 VP)', '🧘 端坐蒲团安详禅修，身心清净！(+10 功德)'));
  }

  startTwentyFiveBows() {
    this.activePractice = 'bow25';
    document.querySelectorAll('.mat-btn[data-hall-action]').forEach((btn) => {
      btn.classList.toggle('active-practice', btn.dataset.hallAction === '2');
    });
    if (this.charParts.meditationRing) this.charParts.meditationRing.material.opacity = 0.85;

    this.isBowing25 = true;
    this.bow25Current = 0;
    this.bow25Total = 25;
    this.bow25CycleTimer = 0; // Triggers Bow #1 immediately in updatePlayerMovement
    this.showToast('🔔 Starting 25 Reverent Bows to the 7 Buddhas on the mat (with a calm bell & Buddha blessing for each bow)...');
  }

  // -------------------- SKILL: 'Nanmo Amitofo' (+5 VP per pray · 100x Sky Vision) --------------------
  castNanmoAmitofo() {
    if (this._isPrayerChanting) {
      this.showToast(this.t(
        '⏳ Please wait until the current prayer finishes before praying again!',
        '⏳ 正在恭敬念诵，请听完本遍祈祷后再继续念诵！'
      ));
      return false;
    }
    this._startPrayerChantLock('amitofo');
    this.state.amitofoCount = (this.state.amitofoCount || 0) + 1;
    if (this.charParts.meditationRing) {
      this.charParts.meditationRing.material.opacity = 0.95;
    }
    this.bowAnimTimer = 2.2;

    const cyc = this.state.amitofoCount % 100 || 100;
    this.addVirtuePoints(
      5,
      this.t(`🪷🔊 Nanmo Amitofo (${cyc}/100) +5 VP!`, `🪷🔊 南无阿弥陀佛 (${cyc}/100) +5 功德!`),
      this.playerGroup.position.clone().add(new THREE.Vector3(0, 3.0, 0))
    );

    if (this.state.amitofoCount > 0 && this.state.amitofoCount % 100 === 0) {
      this.triggerAmitofo100SkyVision(this.state.playerName || this.t('Pilgrim', '善信'), true);
    } else {
      const rem = 100 - (this.state.amitofoCount % 100);
      this.showToast(this.t(
        `🪷🔊 Nanmo Amitofo! (${this.state.amitofoCount} prayed · ${rem} more for 100x Sky Vision)`,
        `🪷🔊 南无阿弥陀佛！(已念 ${this.state.amitofoCount} 声 · 再念 ${rem} 声显现百念圣境)`
      ));
    }
    this.state.amitofoUnlocked = true;
    this.saveState();
    this.updateHUD();
    const capModal = document.getElementById('skills-capability-modal');
    if (capModal && !capModal.classList.contains('hidden')) {
      this.openSkillsCapabilityModal(this._activeCapTab || 'all');
    }
    return true;
  }

  // -------------------- SCENE SWITCHING --------------------
  handleGateInteraction() {
    if (!this.canEnterPrayerHall()) {
      const neededDeeds = Math.max(0, 5 - this.getCompletedDeedCount());
      const neededVP = Math.max(0, 10 - this.state.virtuePoints);
      this.showToast(this.t(
        `🔒 Complete ${neededDeeds} more Good Deeds (${neededVP} more VP) along the mountain trail to open the 7-Buddha Hall!`,
        `🔒 请再完成 ${neededDeeds} 项善行（还需 ${neededVP} 功德）开启七佛宝殿大门！`
      ));
      return;
    }
    window.templeAudio.playGateOpenFanfare();
    this.triggerGateOpenSkyLotusAndConfetti();
    this.walkToAndTrigger(new THREE.Vector3(0, 0.35, -6), () => {
      this.showToast(this.t(
        '🪷🎉 A Golden Lotus blooms in the sky with confetti! Welcome inside the 7-Buddha Prayer Hall!',
        '🪷🎉 金莲虚空绽放、天雨宝华！欢迎步入庄严七佛宝殿！'
      ));
    });
  }

  switchScene(targetScene) {
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.walkTarget = null;
    this.currentScene = targetScene;

    if (targetScene === 'public_temple') {
      this.publicTempleGroup.visible = true;
      this.personalSpaceGroup.visible = false;
      this.applySkyTheme();
      const startY = window.GAME_DATA.getTerrainHeight(0, 105);
      this.playerGroup.position.set(0, startY, 105);
      this.playerGroup.rotation.y = Math.PI;
    } else if (targetScene === 'personal_space') {
      this.publicTempleGroup.visible = false;
      this.personalSpaceGroup.visible = true;
      this.scene.background.setHex(0xd8f3dc);
      this.playerGroup.position.set(0, 0, 6);
      this.showToast(this.t(
        '🌱 Welcome to your Personal Sanctuary Space! Click "Customize Personal Sanctuary" to build.',
        '🌱 欢迎来到您的个人清净道场！点击“布置个人道场”即可随喜庄严建设。'
      ));
    }

    this.updateHUD();
  }

  teleportToStartingPoint() {
    this.maybePromptHuixiangThen(() => {
      this.isAutoCirclingStupa = false;
      this.switchScene('public_temple');
      const startY = window.GAME_DATA.getTerrainHeight(0, 105);
      this.playerGroup.position.set(0, startY, 105);
      this.playerGroup.rotation.y = Math.PI;
      this.showToast(this.t(
        '⛰️ Back at the Mountain-Top Starting Point! Complete Home tasks, then follow the misty river valley down.',
        '⛰️ 已传送回山顶起点！完成孝亲善行后，可顺着溪流山谷漫步礼佛。'
      ));
    });
  }

  teleportToPrayerHallInterior() {
    if (!this.canEnterPrayerHall()) {
      this.handleGateInteraction();
      return;
    }
    if (this.currentScene !== 'public_temple') {
      this.switchScene('public_temple');
    }
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.isAutoCirclingStupa = false;
    this.playerGroup.position.set(0, 0.35, -6);
    this.playerGroup.rotation.y = Math.PI;
    this.showToast(this.t(
      '🙏 Inside the 7-Buddha Prayer Hall! Select an action from the Hall menu below.',
      '🙏 已步入七佛宝殿！请在下方动作栏选择禅坐、礼拜或供养。'
    ));
  }

  // -------------------- 7 WHITE STUPAS CLOCKWISE CIRCUMAMBULATION --------------------
  startClockwiseStupaWalk(stupaIdx = null) {
    if (this.currentScene !== 'public_temple') {
      this.switchScene('public_temple');
    }
    if (this.isSeatedOnMat) this.standUpFromMat();
    if (!this.canCrossEastRiver()) {
      this.showToast(this.t('🪵 Speak to Bridge Master Lu (near x=25) to build the Wisdom Bridge first!', '🪵 请先找东溪边的鲁班桥师修建智慧桥！'));
      return;
    }

    const list = this.stupaList || [];
    if (list.length === 0) return;

    const nextReqIdx = this.getNextUncircledStupaIdx();
    if (nextReqIdx === -1) {
      this.showToast(this.t('🦁 All 7 White Stupas are complete! Guiding you to Manjushri Hall!', '🦁 七座白塔悉数绕行圆满！正在前往五台山文殊殿！'));
      this.teleportToWenshuHallInterior();
      return;
    }

    let chosenIdx = stupaIdx !== null && stupaIdx !== undefined ? stupaIdx : nextReqIdx;
    if (chosenIdx !== nextReqIdx) {
      if (this.state.circledStupas && this.state.circledStupas[chosenIdx]) {
        this.showToast(this.t(
          `✅ Stupa #${chosenIdx + 1} is already circled! Moving to Stupa #${nextReqIdx + 1} next...`,
          `✅ 第 ${chosenIdx + 1} 座白塔已绕行完成！前往下一座第 ${nextReqIdx + 1} 座...`
        ));
      } else {
        this.showToast(this.t(
          `☸️ Please circle the 7 Stupas one by one in order! Moving to Stupa #${nextReqIdx + 1} first...`,
          `☸️ 请按顺序依次绕行 1–7 号白塔！先前往第 ${nextReqIdx + 1} 座...`
        ));
      }
      chosenIdx = nextReqIdx;
    }

    const targetStupa = list[chosenIdx] || list[0];
    this.activeStupaIdx = targetStupa.idx;
    this.stupaPos.copy(targetStupa.pos);

    const dist = Math.hypot(
      this.playerGroup.position.x - this.stupaPos.x,
      this.playerGroup.position.z - this.stupaPos.z
    );

    const radius = 2.45;
    const spLabel = this.dField(targetStupa.data, 'label', 'zhLabel');
    if (dist > 3.2) {
      const entryPoint = new THREE.Vector3(this.stupaPos.x, this.stupaPos.y, this.stupaPos.z + radius);
      this.showToast(this.t(`☸️ Walking to ${spLabel}...`, `☸️ 正在前往 ${spLabel}...`));
      this.walkToAndTrigger(entryPoint, () => {
        this.beginOneClockwiseStupaLap();
      });
    } else {
      this.beginOneClockwiseStupaLap();
    }
  }

  beginOneClockwiseStupaLap() {
    this.walkTarget = null;
    const rx = this.playerGroup.position.x - this.stupaPos.x;
    const rz = this.playerGroup.position.z - this.stupaPos.z;
    this.autoStupaCurrentAngle = Math.atan2(rz, rx);
    this.autoStupaRemainingAngle = Math.PI * 2 + 0.08;
    this.lastStupaAngle = this.autoStupaCurrentAngle;
    this.stupaClockwiseAngle = 0;
    this.isAutoCirclingStupa = true;
    window.templeAudio.playBowingBell();
    this.showToast(this.t(
      `☸️ Circling Stupa #${this.activeStupaIdx + 1} CLOCKWISE (${this.getCircledStupaCount()}/7 unlocked)...`,
      `☸️ 正在顺时针绕行第 ${this.activeStupaIdx + 1} 座白塔 (${this.getCircledStupaCount()}/7 圆满)...`
    ));
  }

  // -------------------- CONTROLS & INPUT --------------------
  initControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        this.walkTarget = null;
        this.isAutoCirclingStupa = false;
        if (this.isSeatedOnMat) this.standUpFromMat();
      }
      // Number keys 1..6 trigger Hall actions inside 7-Buddha Hall, 文殊殿, or 长寿殿
      const inHall =
        this.currentScene === 'public_temple' &&
        Math.abs(this.playerGroup.position.x) < 17.5 &&
        this.playerGroup.position.z < 0.8;
      if (inHall || this.isInsideWenshuHall() || this.isInsideChangshouHall()) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') this.handlePrayerHallAction(1);
        if (e.code === 'Digit2' || e.code === 'Numpad2') this.handlePrayerHallAction(2);
        if (e.code === 'Digit3' || e.code === 'Numpad3') this.handlePrayerHallAction(3);
        if (e.code === 'Digit4' || e.code === 'Numpad4') this.handlePrayerHallAction(4);
        if (e.code === 'Digit5' || e.code === 'Numpad5') this.handlePrayerHallAction(5);
        if (e.code === 'Digit6' || e.code === 'Numpad6') {
          this.castActivePrayerSkill(true);
        }
      }

      // Keyboard Shortcut [L]: Activate the equipped Prayer Skill (once unlocked)
      if (e.code === 'KeyL' && !e.repeat) {
        const ae = document.activeElement;
        const isTyping = ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName);
        if (!isTyping) {
          this.castActivePrayerSkill(false);
        }
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') {
        // Prevent focused top HUD buttons (especially language toggle) from firing on Enter/Space
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.id === 'hud-lang-toggle-btn' || activeEl.closest('#top-hud'))) {
          activeEl.blur();
          if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            e.preventDefault();
          }
        }
        // If Timing Mini-Game is active, Space/Enter strikes the green bar!
        const mgModal = document.getElementById('minigame-modal');
        const strikeBtn = document.getElementById('mg-strike-btn');
        if (mgModal && !mgModal.classList.contains('hidden') && strikeBtn) {
          e.preventDefault();
          strikeBtn.click();
          return;
        }
        // If Buddha Bow Acknowledgment Card is open, Enter/Space clicks Acknowledge!
        const ackModal = document.getElementById('buddha-bow-ack-modal');
        const ackBtn = document.getElementById('btn-confirm-buddha-ack');
        if (ackModal && !ackModal.classList.contains('hidden') && ackBtn) {
          e.preventDefault();
          ackBtn.click();
          return;
        }

        // Roblox-Style Spacebar 3D Jump when exploring!
        if (e.code === 'Space') {
          const openModal = document.querySelector('.modal-backdrop:not(.hidden)');
          if (!openModal && !this.cutsceneState) {
            e.preventDefault();
            if (this.isSeatedOnMat) this.standUpFromMat();
            if (this.isGrounded) {
              this.playerVelY = 10.6;
              this.isGrounded = false;
              window.templeAudio.playBeadClick(3);
            }
          }
          return;
        }

        if (this._nearOfferingTableHall) {
          const src = this._nearOfferingTableHall === 'wenshu'
            ? (this.state.wenshuOfferings || {})
            : this._nearOfferingTableHall === 'changshou'
              ? (this.state.changshouOfferings || {})
              : (this.state.offeringsMade || {});
          const nextAct = !src.water ? 3 : (!src.flower ? 4 : 5);
          this.handlePrayerHallAction(nextAct);
        } else if (this._nearbyBuddhaIdx !== null && this._nearbyBuddhaIdx !== undefined) {
          this.bowToSpecificBuddhaQuest(this._nearbyBuddhaIdx);
        } else if (this._nearManjushri) {
          this.bowToManjushriQuest();
        } else if (this._nearChangshou) {
          this.bowToChangshouQuest();
        } else if (this._nearHallTeleportStart) {
          this.teleportToStartingPoint();
        } else if (this._nearbyWenshuSeatIdx !== null && this._nearbyWenshuSeatIdx !== undefined) {
          this.meditateInWenshuHall(this._nearbyWenshuSeatIdx);
        } else if (this._nearbyChangshouSeatIdx !== null && this._nearbyChangshouSeatIdx !== undefined) {
          this.meditateInChangshouHall(this._nearbyChangshouSeatIdx);
        } else if (this._nearbyFlowerGardenId) {
          this.plantFlowerGarden(this._nearbyFlowerGardenId);
        } else if (this._nearbyLotusPondId) {
          this.plantLotusPond(this._nearbyLotusPondId);
        } else if (this._nearbySutraId) {
          this.visitAndReadSutra(this._nearbySutraId);
        } else if (this._nearBell) {
          this.ringTempleBell();
        } else if (this._nearbySeat) {
          this.toggleSitScenicSpot(this._nearbySeat);
        } else if (this._nearStupa) {
          this.startClockwiseStupaWalk(this.activeStupaIdx);
        } else if (this._nearbyDeedId) {
          this.performGoodDeed(this._nearbyDeedId);
        } else {
          for (const mat of this.meditationMats) {
            if (this.playerGroup.position.distanceTo(mat.pos) < 2.6) {
              this.handlePrayerHallAction(1);
              break;
            }
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    document.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = btn.dataset.dir;
      const startMove = (ev) => {
        ev.preventDefault();
        this.walkTarget = null;
        this.isAutoCirclingStupa = false;
        if (this.isSeatedOnMat) this.standUpFromMat();
        if (dir === 'up') this.dpadVec.z = -1;
        if (dir === 'down') this.dpadVec.z = 1;
        if (dir === 'left') this.dpadVec.x = -1;
        if (dir === 'right') this.dpadVec.x = 1;
      };
      const endMove = () => {
        this.dpadVec.x = 0;
        this.dpadVec.z = 0;
      };
      btn.addEventListener('mousedown', startMove);
      btn.addEventListener('touchstart', startMove, { passive: false });
      btn.addEventListener('mouseup', endMove);
      btn.addEventListener('mouseleave', endMove);
      btn.addEventListener('touchend', endMove);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const canvas = this.renderer.domElement;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      this.isDraggingCam = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(5.8, Math.min(26.0, this.cameraDistance + e.deltaY * 0.012));
    }, { passive: false });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingCam) {
        const dx = e.clientX - this.prevMouseX;
        const dy = e.clientY - this.prevMouseY;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
        this.cameraAngle -= dx * 0.0068;
        this.cameraPitch = Math.max(0.16, Math.min(1.15, this.cameraPitch + dy * 0.0052));
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.isDraggingCam = false;
      const distMoved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (distMoved < 6) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);

        const activeGroup = this.currentScene === 'public_temple' ? this.publicTempleGroup : this.personalSpaceGroup;
        const hits = raycaster.intersectObjects(activeGroup.children, true);
        const changshouSeatHit = hits.find(
          (h) => h.object.userData && h.object.userData.changshouSeatIdx !== undefined
        );
        if (changshouSeatHit) {
          this.meditateInChangshouHall(changshouSeatHit.object.userData.changshouSeatIdx);
          return;
        }
        const changshouStatueHit = hits.find(
          (h) => h.object.userData && h.object.userData.changshouStatue
        );
        if (changshouStatueHit) {
          this.bowToChangshouQuest();
          return;
        }
        const manjushriStatueHit = hits.find(
          (h) => h.object.userData && h.object.userData.manjushriStatue
        );
        if (manjushriStatueHit) {
          this.bowToManjushriQuest();
          return;
        }
        const wenshuSeatHit = hits.find(
          (h) => h.object.userData && h.object.userData.wenshuSeatIdx !== undefined
        );
        if (wenshuSeatHit) {
          this.meditateInWenshuHall(wenshuSeatHit.object.userData.wenshuSeatIdx);
          return;
        }
        const flowerGardenHit = hits.find(
          (h) => h.object.userData && h.object.userData.flowerGardenId
        );
        if (flowerGardenHit) {
          this.plantFlowerGarden(flowerGardenHit.object.userData.flowerGardenId);
          return;
        }
        const lotusPondHit = hits.find(
          (h) => h.object.userData && h.object.userData.lotusPondId
        );
        if (lotusPondHit) {
          this.plantLotusPond(lotusPondHit.object.userData.lotusPondId);
          return;
        }
        const buddhaHit = hits.find(
          (h) => h.object.userData && h.object.userData.buddhaIdx !== undefined
        );
        if (buddhaHit) {
          this.bowToSpecificBuddhaQuest(buddhaHit.object.userData.buddhaIdx);
          return;
        }
        const stupaHit = hits.find((h) => h.object.userData && h.object.userData.isStupa);
        if (stupaHit) {
          this.startClockwiseStupaWalk(stupaHit.object.userData.stupaIdx);
          return;
        }
        const sutraHit = hits.find((h) => h.object.userData && h.object.userData.sutraId);
        if (sutraHit) {
          this.visitAndReadSutra(sutraHit.object.userData.sutraId);
          return;
        }
        const deedHit = hits.find((h) => h.object.userData && h.object.userData.deedId);
        if (deedHit) {
          const clickedDeedId = deedHit.object.userData.deedId;
          this.performGoodDeed(clickedDeedId);
          return;
        }
        const groundHit = hits.find((h) => h.object.name === 'walkable_ground');
        if (groundHit) {
          if (this.isSeatedOnMat) this.standUpFromMat();
          this.isAutoCirclingStupa = false;
          this.walkToAndTrigger(groundHit.point, null);
        }
      }
    });
  }

  walkToAndTrigger(targetVec3, callback) {
    if (this.isSeatedOnMat) this.standUpFromMat();
    this.walkWaypoints = [];
    this.walkTarget = new THREE.Vector3(targetVec3.x, 0, targetVec3.z);
    this.walkCallback = callback;
  }

  walkToPath(points, callback) {
    if (!points || !points.length) return;
    if (this.isSeatedOnMat) this.standUpFromMat();
    const copy = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
    this.walkTarget = copy.shift();
    this.walkWaypoints = copy;
    this.walkCallback = callback;
  }

  // -------------------- UI BINDINGS & MODALS --------------------
  initUI() {
    const sidePanel = document.getElementById('side-panel');
    const rightPanel = document.getElementById('right-panel');
    document.getElementById('toggle-deeds-btn').addEventListener('click', () => {
      sidePanel.classList.toggle('collapsed');
    });
    const menuDrawerBtn = document.getElementById('btn-toggle-menu-drawer');
    if (menuDrawerBtn && rightPanel) {
      menuDrawerBtn.addEventListener('click', () => {
        rightPanel.classList.toggle('collapsed');
      });
    }
    const closeRightPanelBtn = document.getElementById('close-right-panel');
    if (closeRightPanelBtn && rightPanel) {
      closeRightPanelBtn.addEventListener('click', () => {
        rightPanel.classList.add('collapsed');
      });
    }
    const closeSutraModalBtn = document.getElementById('close-sutra-modal');
    if (closeSutraModalBtn) {
      closeSutraModalBtn.addEventListener('click', () => {
        document.getElementById('sutra-book-modal').classList.add('hidden');
        this.setPoseMode('idle');
      });
    }
    const resetBtn = document.getElementById('reset-deeds-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetProgress());
    }
    const topResetBtn = document.getElementById('top-reset-btn');
    if (topResetBtn) {
      topResetBtn.addEventListener('click', () => this.resetProgress());
    }
    const hudTopResetBtn = document.getElementById('hud-top-reset-btn');
    if (hudTopResetBtn) {
      hudTopResetBtn.addEventListener('click', () => this.resetProgress());
    }
    // Prevent top HUD buttons from holding keyboard focus so Enter/Space never accidentally re-clicks them
    document.querySelectorAll('#top-hud button').forEach((btn) => {
      btn.addEventListener('click', () => btn.blur());
    });
    const hudLangToggleBtn = document.getElementById('hud-lang-toggle-btn');
    if (hudLangToggleBtn) {
      ['keydown', 'keyup'].forEach((evtName) => {
        hudLangToggleBtn.addEventListener(evtName, (ev) => {
          if (ev.code === 'Enter' || ev.code === 'NumpadEnter' || ev.code === 'Space') {
            ev.preventDefault();
          }
        });
      });
      hudLangToggleBtn.addEventListener('click', (ev) => {
        // Ignore synthetic keyboard-activated clicks (ev.detail === 0 when Enter/Space triggers click)
        if (ev.detail === 0) {
          ev.preventDefault();
          hudLangToggleBtn.blur();
          return;
        }
        hudLangToggleBtn.blur();
        this.toggleLanguage();
      });
    }

    document.getElementById('tab-courtyard').addEventListener('click', () => {
      this.teleportToStartingPoint();
    });
    const tabStupa = document.getElementById('tab-stupa');
    if (tabStupa) {
      tabStupa.addEventListener('click', () => {
        this.maybePromptHuixiangThen(() => {
          if (this.currentScene !== 'public_temple') {
            this.switchScene('public_temple');
          }
          if (this.isSeatedOnMat) this.standUpFromMat();
          if (!this.canCrossEastRiver()) {
            const bridgeApproachY = window.GAME_DATA.getTerrainHeight(22.5, 4.0);
            this.playerGroup.position.set(22.5, bridgeApproachY, 4.0);
            this.playerGroup.rotation.y = Math.PI / 2;
            this.showToast(this.t('🪵 Talk to Bridge Master Lu first to build the Wisdom Bridge across the river!', '🪵 请先找鲁班桥师修建跨溪智慧桥！'));
            return;
          }
          const nextIdx = Math.max(0, (this.stupaList || []).findIndex((_, i) => !this.state.circledStupas[i]));
          const targetStupa = (this.stupaList || [])[nextIdx] || { idx: 0, pos: this.stupaPos };
          this.activeStupaIdx = targetStupa.idx;
          this.stupaPos.copy(targetStupa.pos);
          this.playerGroup.position.set(targetStupa.pos.x, targetStupa.pos.y, targetStupa.pos.z + 4.8);
          this.playerGroup.rotation.y = -Math.PI / 2;
          this.lastStupaAngle = Math.PI / 2;
          this.showToast(this.t(
            `☸️ Arrived at White Stupa #${targetStupa.idx + 1}/7! Walk CLOCKWISE to unlock Manjushri Hall!`,
            `☸️ 抵达第 ${targetStupa.idx + 1}/7 座白塔！顺时针绕塔一周开启文殊殿！`
          ));
        });
      });
    }
    document.getElementById('tab-prayer-hall').addEventListener('click', () => {
      this.teleportToPrayerHallInterior();
    });
    const tabWenshu = document.getElementById('tab-wenshu-hall');
    if (tabWenshu) {
      tabWenshu.addEventListener('click', () => {
        this.maybePromptHuixiangThen(() => {
          this.teleportToWenshuHallInterior();
        });
      });
    }
    const tabChangshou = document.getElementById('tab-changshou-hall');
    if (tabChangshou) {
      tabChangshou.addEventListener('click', () => {
        this.maybePromptHuixiangThen(() => {
          this.teleportToChangshouHallInterior();
        });
      });
    }
    document.getElementById('tab-personal-space').addEventListener('click', () => {
      if (rightPanel) rightPanel.classList.add('collapsed');
      this.maybePromptHuixiangThen(() => {
        this.switchScene('personal_space');
      });
    });

    const closeOfferingModal = document.getElementById('close-offering-modal');
    if (closeOfferingModal) {
      closeOfferingModal.addEventListener('click', () => {
        document.getElementById('offering-quest-modal').classList.add('hidden');
      });
    }

    const muteBtn = document.getElementById('btn-audio-toggle');
    muteBtn.addEventListener('click', () => {
      const muted = window.templeAudio.toggleMute();
      muteBtn.textContent = muted ? this.t('🔇 Muted', '🔇 静音') : this.t('🔊 Sound', '🔊 音效');
    });

    const skipCutsceneBtn = document.getElementById('btn-skip-cutscene');
    if (skipCutsceneBtn) {
      skipCutsceneBtn.addEventListener('click', () => this.endCutscene(true));
    }

    const voiceBtn = document.getElementById('btn-voice-toggle');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        const enabled = window.templeAudio.toggleVoice();
        voiceBtn.textContent = enabled ? this.t('🗣️ Voice: ON', '🗣️ 语音: 开') : this.t('🗣️ Voice: OFF', '🗣️ 语音: 关');
        this.showToast(
          enabled
            ? this.t('🗣️ Voice Storyteller ON! Tasks and Buddha wishes will be read aloud.', '🗣️ 语音朗读已开启，任务与佛愿将会轻声诵读。')
            : this.t('🗣️ Voice Storyteller OFF.', '🗣️ 语音朗读已关闭。')
        );
      });
    }

    // Unified Red Tibetan Monk (no Character Picker — all players equal)
    const openDesignerBtn = document.getElementById('btn-open-designer');
    if (openDesignerBtn) {
      openDesignerBtn.addEventListener('click', () => this.openCharacterDesignerModal());
    }
    const closeCharBtn = document.getElementById('close-char-modal');
    if (closeCharBtn) {
      closeCharBtn.addEventListener('click', () => document.getElementById('char-modal').classList.add('hidden'));
    }
    const saveCharBtn = document.getElementById('save-char-btn');
    if (saveCharBtn) {
      saveCharBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('input-player-name').value.trim();
        if (nameInput) this.state.playerName = nameInput;
        this.saveState();
        this.buildPlayerCharacter();
        this.updateHUD();
        document.getElementById('char-modal').classList.add('hidden');
      });
    }

    // Sansa-Inspired Ambient Nature, Pure Scenery View & Bottom Sanctuary Dock
    const natureBtn = document.getElementById('btn-nature-toggle');
    if (natureBtn) {
      natureBtn.addEventListener('click', () => {
        const playing = window.templeAudio.toggleNatureAmbient();
        natureBtn.textContent = playing ? this.t('🍃 Nature: ON', '🍃 自然音: 开') : this.t('🍃 Nature: OFF', '🍃 自然音: 关');
        this.showToast(playing
          ? this.t('🍃 Gentle mountain breeze & stream soundscape ON', '🍃 山间清风溪水自然音效已开启')
          : this.t('🍃 Ambient nature sound OFF', '🍃 自然环境音效已关闭'));
      });
    }

    const setPureView = (on) => {
      document.body.classList.toggle('pure-view', on);
      const exitBtn = document.getElementById('pure-view-exit-btn');
      if (exitBtn) exitBtn.classList.toggle('hidden', !on);
    };
    const pureViewBtn = document.getElementById('btn-pure-view');
    const pureExitBtn = document.getElementById('pure-view-exit-btn');
    if (pureViewBtn) {
      pureViewBtn.addEventListener('click', () => {
        if (rightPanel) rightPanel.classList.add('collapsed');
        setPureView(true);
      });
    }
    if (pureExitBtn) pureExitBtn.addEventListener('click', () => setPureView(false));

    const dockPalms = document.getElementById('dock-btn-palms');
    const dockBow = document.getElementById('dock-btn-bow');
    const dockSit = document.getElementById('dock-btn-sit');
    const dockAmitofo = document.getElementById('dock-btn-amitofo');
    const dockMuyu = document.getElementById('dock-btn-muyu');
    const dockQuests = document.getElementById('dock-btn-quests');

    if (dockPalms) {
      dockPalms.addEventListener('click', () => {
        this.setPoseMode(this.poseMode === 'palms' ? 'idle' : 'palms');
      });
    }
    if (dockBow) {
      dockBow.addEventListener('click', () => {
        this.bowAnimTimer = 2.0;
        window.templeAudio.playSingingBowl();
        this.setPoseMode('palms');
        this.showToast(this.t('🙇 Bowing with deepest gratitude to all Buddhas and Bodhisattvas', '🙇 至诚礼拜十方诸佛菩萨'));
      });
    }
    if (dockSit) {
      dockSit.addEventListener('click', () => {
        if (this.isSeatedOnMat) {
          this.standUpFromMat();
        } else if (this.seatedScenic || this.poseMode === 'sit') {
          this.toggleSitScenicSpot(this.seatedScenic || null);
        } else if (this._nearbySeat) {
          this.toggleSitScenicSpot(this._nearbySeat);
        } else {
          this.setPoseMode('sit');
          this.openChairRestBlossomOverlay(this.t('🌸 Mindful Rest Beneath White Blossoms', '🌸 花下禅坐静休'));
          this.showToast(this.t('🧘 Sitting cross-legged in stillness under gentle white blossoms', '🧘 就地盘腿静坐，白花微风拂面'));
        }
      });
    }
    if (dockAmitofo) {
      dockAmitofo.addEventListener('click', () => this.castActivePrayerSkill(true));
    }
    const btnBlossom3dView = document.getElementById('btn-blossom-3d-view');
    if (btnBlossom3dView) {
      btnBlossom3dView.addEventListener('click', () => {
        this.closeChairRestBlossomOverlay();
        this.showToast(this.t('🌸 Switched to 3D Blossom Meditation view — drag to admire!', '🌸 已切换至 3D 白花禅座实景，可转动视角欣赏！'));
      });
    }
    const btnBlossomStandUp = document.getElementById('btn-blossom-stand-up');
    if (btnBlossomStandUp) {
      btnBlossomStandUp.addEventListener('click', () => {
        if (this.isSeatedOnMat) {
          this.standUpFromMat();
        } else {
          this.toggleSitScenicSpot(this.seatedScenic || null, false);
        }
      });
    }
    if (dockMuyu) {
      dockMuyu.addEventListener('click', () => {
        window.templeAudio.playBeadClick(0);
        dockMuyu.classList.add('active');
        setTimeout(() => dockMuyu.classList.remove('active'), 180);
      });
    }
    if (dockQuests) {
      dockQuests.addEventListener('click', () => {
        const sp = document.getElementById('side-panel');
        if (sp) {
          sp.classList.toggle('collapsed');
          dockQuests.classList.toggle('active', !sp.classList.contains('collapsed'));
        }
      });
    }

    // Temple Architect & Buddha Designer Studio Modal
    document.getElementById('btn-open-temple-designer').addEventListener('click', () => {
      this.openTempleDesignerModal();
    });
    document.getElementById('close-temple-modal').addEventListener('click', () => {
      document.getElementById('temple-modal').classList.add('hidden');
    });
    document.getElementById('apply-temple-design-btn').addEventListener('click', () => {
      this.saveState();
      this.rebuildTempleArchitecture();
      this.rebuildSevenBuddhasAltar();
      this.applySkyTheme();
      document.getElementById('temple-modal').classList.add('hidden');
      this.showToast('🏯✨ Temple Architecture & 7-Buddha Statues updated!');
    });

    // Custom .GLB / .GLTF 3D Model File Importer
    const glbInput = document.getElementById('glb-file-input');
    if (glbInput) {
      glbInput.addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        this.importCustomGLBModel(file);
      });
    }

    // 7-Buddha Wisdom & Bow Quest Modal
    document.getElementById('btn-open-buddhas').addEventListener('click', () => {
      this.openBuddhaModal(0);
    });
    const rightBowBuddhasBtn = document.getElementById('btn-right-bow-buddhas');
    if (rightBowBuddhasBtn) {
      rightBowBuddhasBtn.addEventListener('click', () => {
        this.openBuddhaModal(0);
      });
    }
    const hallLearnBuddhasBtn = document.getElementById('btn-hall-learn-buddhas');
    if (hallLearnBuddhasBtn) {
      hallLearnBuddhasBtn.addEventListener('click', () => {
        this.openBuddhaModal(0);
      });
    }
    const hallTeleportStartBtn = document.getElementById('btn-hall-teleport-start');
    if (hallTeleportStartBtn) {
      hallTeleportStartBtn.addEventListener('click', () => {
        this.teleportToStartingPoint();
      });
    }
    document.getElementById('close-buddha-modal').addEventListener('click', () => {
      document.getElementById('buddha-modal').classList.add('hidden');
    });

    // Bodhi Wishing Tree 8-Wishes Modal
    const closeWishModalBtn = document.getElementById('close-wishing-tree-modal');
    if (closeWishModalBtn) {
      closeWishModalBtn.addEventListener('click', () => {
        document.getElementById('wishing-tree-modal').classList.add('hidden');
      });
    }
    const confirmWishBtn = document.getElementById('btn-confirm-hang-wish');
    if (confirmWishBtn) {
      confirmWishBtn.addEventListener('click', () => {
        this.confirmHangSelectedWish();
      });
    }

    // Interactive Skill Mini-Challenge Modal
    const closeMinigameBtn = document.getElementById('close-minigame-modal');
    if (closeMinigameBtn) {
      closeMinigameBtn.addEventListener('click', () => {
        if (this._minigameRAF) {
          cancelAnimationFrame(this._minigameRAF);
          this._minigameRAF = null;
        }
        document.getElementById('minigame-modal').classList.add('hidden');
      });
    }

    // 7-Buddha Wisdom Master Quiz Modal
    ['btn-open-quiz', 'btn-right-quiz', 'btn-hall-quiz'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => this.openBuddhaQuizModal());
      }
    });
    const closeQuizBtn = document.getElementById('close-quiz-modal');
    if (closeQuizBtn) {
      closeQuizBtn.addEventListener('click', () => {
        document.getElementById('buddha-quiz-modal').classList.add('hidden');
      });
    }

    // Mindful Breath [Key Q] Button
    const breathBtn = document.getElementById('btn-mindful-breath');
    if (breathBtn) {
      breathBtn.addEventListener('click', () => this.triggerMindfulBreathWave());
    }

    // Collectible Sticker Book Modal
    const openStickersBtn = document.getElementById('btn-open-stickers');
    if (openStickersBtn) {
      openStickersBtn.addEventListener('click', () => {
        this.openStickerBookModal();
      });
    }
    const closeStickersBtn = document.getElementById('close-sticker-modal');
    if (closeStickersBtn) {
      closeStickersBtn.addEventListener('click', () => {
        document.getElementById('sticker-modal').classList.add('hidden');
      });
    }

    // Personal Space Store & Task Map Modals
    document.getElementById('close-personal-modal').addEventListener('click', () => {
      document.getElementById('personal-modal').classList.add('hidden');
    });
    const openStoreFromUI = () => {
      if (rightPanel) rightPanel.classList.add('collapsed');
      this.openPersonalBuilderModal();
    };
    const topStoreBtn = document.getElementById('btn-top-store');
    if (topStoreBtn) topStoreBtn.addEventListener('click', openStoreFromUI);
    const menuStoreBtn = document.getElementById('btn-menu-store');
    if (menuStoreBtn) menuStoreBtn.addEventListener('click', openStoreFromUI);

    const openTaskMapFromUI = () => {
      if (rightPanel) rightPanel.classList.add('collapsed');
      this.openTaskMapModal();
    };
    const topTaskMapBtn = document.getElementById('btn-top-task-map');
    if (topTaskMapBtn) topTaskMapBtn.addEventListener('click', openTaskMapFromUI);
    const menuTaskMapBtn = document.getElementById('btn-menu-task-map');
    if (menuTaskMapBtn) menuTaskMapBtn.addEventListener('click', openTaskMapFromUI);
    const closeTaskMapBtn = document.getElementById('close-task-map-modal');
    if (closeTaskMapBtn) {
      closeTaskMapBtn.addEventListener('click', () => {
        document.getElementById('task-map-modal').classList.add('hidden');
      });
    }

    // Offering Pills in Right Panel (works inside 7-Buddha Hall, 文殊殿, or 长寿殿)
    document.querySelectorAll('.offering-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const type = pill.dataset.offering;
        const mapAction = { water: 3, flower: 4, scent: 5 };
        if (rightPanel) rightPanel.classList.add('collapsed');
        if (this.isInsideWenshuHall()) {
          const wZ = type === 'flower' ? -2.95 : (type === 'scent' ? 2.95 : 0);
          this.walkToWenshuAltarAndOffer(type, wZ);
          return;
        }
        if (this.isInsideChangshouHall()) {
          const cZ = type === 'flower' ? 2.95 : (type === 'scent' ? -2.95 : 0);
          this.walkToChangshouAltarAndOffer(type, cZ);
          return;
        }
        if (!this.canEnterPrayerHall()) {
          this.showToast('🔒 Complete at least 5 Good Deeds (10 VP) on the mountain trail to enter the 7-Buddha Prayer Hall!');
          return;
        }
        if (this.currentScene !== 'public_temple' || this.playerGroup.position.z > 0.5) {
          this.teleportToPrayerHallInterior();
        }
        this.handlePrayerHallAction(mapAction[type] || 3);
      });
    });

    // 'Nanmo Amitofo' Skill Button & Skills / 千佛殿 Capability Window
    document.getElementById('btn-skill-amitofo').addEventListener('click', () => {
      this.castNanmoAmitofo();
    });
    document.getElementById('mat-btn-amitofo').addEventListener('click', () => {
      this.castActivePrayerSkill(true);
    });

    const qianfoTopBtn = document.getElementById('hud-btn-qianfodian');
    if (qianfoTopBtn) {
      qianfoTopBtn.addEventListener('click', () => {
        this.openSkillsCapabilityModal('all');
      });
    }
    const openSkillsWinBtn = document.getElementById('btn-open-skills-window');
    if (openSkillsWinBtn) {
      openSkillsWinBtn.addEventListener('click', () => {
        if (rightPanel) rightPanel.classList.add('collapsed');
        this.openSkillsCapabilityModal('all');
      });
    }
    const closeCapBtn = document.getElementById('close-skills-capability-modal');
    if (closeCapBtn) {
      closeCapBtn.addEventListener('click', () => {
        document.getElementById('skills-capability-modal').classList.add('hidden');
      });
    }
    document.querySelectorAll('.cap-tab-btn[data-cap-tab]').forEach((tBtn) => {
      tBtn.addEventListener('click', () => {
        this.openSkillsCapabilityModal(tBtn.dataset.capTab || 'all');
      });
    });

    // Prayer Hall 5-Action Selection Box Buttons (1. Meditate, 2. Bow 25x, 3. Water, 4. Flower, 5. Incense)
    document.querySelectorAll('.mat-btn[data-hall-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const actNum = parseInt(btn.dataset.hallAction, 10);
        this.handlePrayerHallAction(actNum);
      });
    });
    document.getElementById('btn-leave-mat').addEventListener('click', () => {
      this.standUpFromMat();
    });
    const toggleMatBarBtn = document.getElementById('btn-toggle-mat-bar');
    if (toggleMatBarBtn) {
      toggleMatBarBtn.addEventListener('click', () => {
        const bar = document.getElementById('meditation-mat-bar');
        if (!bar) return;
        const isCollapsed = bar.classList.toggle('mat-bar-collapsed');
        toggleMatBarBtn.textContent = isCollapsed
          ? this.t('▴ Actions', '▴ 展开修持')
          : this.t('▾ Hide', '▾ 收起');
      });
    }
  }

  openTempleDesignerModal() {
    const modal = document.getElementById('temple-modal');
    modal.classList.remove('hidden');

    // 1. Temple Architectural Styles
    const styleRow = document.getElementById('temple-style-row');
    styleRow.innerHTML = '';
    window.GAME_DATA.TEMPLE_STYLES.forEach((st) => {
      const pill = document.createElement('div');
      pill.className = `opt-pill ${this.state.templeStyleId === st.id ? 'selected' : ''}`;
      pill.textContent = this.dField(st, 'name', 'zhName');
      pill.addEventListener('click', () => {
        this.state.templeStyleId = st.id;
        this.openTempleDesignerModal();
      });
      styleRow.appendChild(pill);
    });

    // 2. Buddha Materials
    const matRow = document.getElementById('buddha-material-row');
    matRow.innerHTML = '';
    window.GAME_DATA.BUDDHA_MATERIALS.forEach((bm) => {
      const pill = document.createElement('div');
      pill.className = `opt-pill ${this.state.buddhaMatId === bm.id ? 'selected' : ''}`;
      pill.textContent = this.dField(bm, 'name', 'zhName');
      pill.addEventListener('click', () => {
        this.state.buddhaMatId = bm.id;
        this.openTempleDesignerModal();
      });
      matRow.appendChild(pill);
    });

    // 3. Sky Themes
    const skyRow = document.getElementById('sky-theme-row');
    skyRow.innerHTML = '';
    window.GAME_DATA.SKY_THEMES.forEach((sk) => {
      const pill = document.createElement('div');
      pill.className = `opt-pill ${this.state.skyThemeId === sk.id ? 'selected' : ''}`;
      pill.textContent = this.dField(sk, 'name', 'zhName');
      pill.addEventListener('click', () => {
        this.state.skyThemeId = sk.id;
        this.openTempleDesignerModal();
      });
      skyRow.appendChild(pill);
    });
  }

  importCustomGLBModel(file) {
    const statusEl = document.getElementById('glb-upload-status');
    if (!THREE.GLTFLoader) {
      statusEl.textContent = '⚠️ GLTFLoader not available.';
      return;
    }
    statusEl.textContent = `⏳ Loading ${file.name}...`;
    const url = URL.createObjectURL(file);
    const loader = new THREE.GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 4.2 / maxDim;
        model.scale.set(scale, scale, scale);
        model.position.set(0, 1.8, -21.5);
        this.publicTempleGroup.add(model);
        statusEl.textContent = `✅ Imported ${file.name} into the Temple Altar!`;
        this.showToast(`🙏 Custom 3D Model "${file.name}" placed in the Temple!`);
      },
      undefined,
      (err) => {
        console.error(err);
        statusEl.textContent = '❌ Failed to load .glb file.';
      }
    );
  }

  // Character Designer Modal: ONLY keep the name in English, no description needed!
  openCharacterDesignerModal() {
    const modal = document.getElementById('char-modal');
    modal.classList.remove('hidden');

    document.getElementById('input-player-name').value = this.state.playerName;

    const charGrid = document.getElementById('char-archetype-grid');
    charGrid.innerHTML = '';
    window.GAME_DATA.CHARACTERS.forEach((ch) => {
      const card = document.createElement('div');
      card.className = `char-card ${this.state.charId === ch.id ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="char-icon">${ch.emoji}</div>
        <h4>${ch.name}</h4>
      `;
      card.addEventListener('click', () => {
        this.state.charId = ch.id;
        this.state.robeColor = ch.defaultRobe;
        this.state.headwear = ch.defaultHat;
        this.state.aura = ch.defaultAura;
        this.openCharacterDesignerModal();
      });
      charGrid.appendChild(card);
    });

    const swatchRow = document.getElementById('robe-swatch-row');
    swatchRow.innerHTML = '';
    window.GAME_DATA.ROBE_COLORS.forEach((rc) => {
      const sw = document.createElement('div');
      sw.className = `color-swatch ${this.state.robeColor === rc.id ? 'selected' : ''}`;
      sw.style.background = rc.id;
      sw.title = rc.name;
      sw.addEventListener('click', () => {
        this.state.robeColor = rc.id;
        this.openCharacterDesignerModal();
      });
      swatchRow.appendChild(sw);
    });

    const hatRow = document.getElementById('headwear-options-row');
    hatRow.innerHTML = '';
    window.GAME_DATA.HEADWEAR_OPTIONS.forEach((hw) => {
      const pill = document.createElement('div');
      pill.className = `opt-pill ${this.state.headwear === hw.id ? 'selected' : ''}`;
      pill.textContent = hw.name;
      pill.addEventListener('click', () => {
        this.state.headwear = hw.id;
        this.openCharacterDesignerModal();
      });
      hatRow.appendChild(pill);
    });

    const auraRow = document.getElementById('aura-options-row');
    auraRow.innerHTML = '';
    window.GAME_DATA.AURA_OPTIONS.forEach((au) => {
      const pill = document.createElement('div');
      pill.className = `opt-pill ${this.state.aura === au.id ? 'selected' : ''}`;
      pill.textContent = au.name;
      pill.addEventListener('click', () => {
        this.state.aura = au.id;
        this.openCharacterDesignerModal();
      });
      auraRow.appendChild(pill);
    });
  }

  // Straightforward, concise 7 Buddhas instruction for kids:
  // Cleanly displays "1. Vipassi Buddha" .. "7. Sakyamuni Buddha" (no "1.1"!)
  // Shows: 1. Name of the Buddha, 2. The Buddha's Wish, 3. Benefit of Bowing, and Bow Quest button (+10 VP)
  openBuddhaModal(selectedIndex = 0) {
    this._activeBuddhaTabIdx = selectedIndex;
    const modal = document.getElementById('buddha-modal');
    modal.classList.remove('hidden');

    const tabsContainer = document.getElementById('buddha-tabs-container');
    const detailContainer = document.getElementById('buddha-detail-container');

    tabsContainer.innerHTML = '';
    window.GAME_DATA.SEVEN_BUDDHAS.forEach((b, idx) => {
      const bowed = !!(this.state.bowedBuddhas && this.state.bowedBuddhas[idx]);
      const bName = this.isZh() ? (b.cnName || b.name) : b.name;
      const btn = document.createElement('button');
      btn.className = `buddha-tab-btn ${idx === selectedIndex ? 'active' : ''}`;
      btn.textContent = `${idx + 1}. ${bName}${bowed ? ' ✅' : ''}`;
      btn.addEventListener('click', () => this.openBuddhaModal(idx));
      tabsContainer.appendChild(btn);
    });

    const cur = window.GAME_DATA.SEVEN_BUDDHAS[selectedIndex];
    const displayNumName = `${selectedIndex + 1}. ${this.isZh() ? (cur.cnName || cur.name) : cur.name}`;
    const curTitle = this.dField(cur, 'title', 'zhTitle');
    const alreadyBowed = !!(this.state.bowedBuddhas && this.state.bowedBuddhas[selectedIndex]);
    const summarySentence = this.isZh()
      ? (cur.zhWishAndBenefit || `${cur.zhBuddhaWish} ${cur.zhBowBenefit}`)
      : (cur.wishAndBenefit || `${cur.buddhaWish} ${cur.bowBenefit}`);
    const spokenText = `${displayNumName}. ${summarySentence}`;

    const buddhaImgSrc = cur.img
      ? ((window.INLINE_ASSETS && window.INLINE_ASSETS[cur.img]) || cur.img)
      : '';

    detailContainer.innerHTML = `
      <div class="buddha-detail-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${buddhaImgSrc ? `<img src="${buddhaImgSrc}" alt="${displayNumName}" style="width:68px; height:92px; object-fit:contain; background:#ffffff; border-radius:10px; border:2px solid #d4af37; flex-shrink:0;" />` : ''}
            <div>
              <h3 style="margin-bottom:2px;">🙏 ${displayNumName} ${alreadyBowed ? '✅' : ''}</h3>
              <div class="sanskrit" style="margin-bottom:0;">✨ ${curTitle}</div>
            </div>
          </div>
          <button id="btn-speak-buddha" class="listen-voice-btn" style="padding:6px 14px; font-size:12.5px;">${this.t('🔊 Listen', '🔊 朗读')}</button>
        </div>

        <div style="background:linear-gradient(135deg, #fffaf0, #ffefc2); border:2px solid #d4af37; border-radius:12px; padding:14px 16px; margin-bottom:12px;">
          <div style="font-size:11.5px; font-weight:900; text-transform:uppercase; color:#8b3a1e; letter-spacing:0.6px; margin-bottom:5px;">
            ${this.t('🌟 Wish & Benefit', '🌟 佛陀本愿与功德利益')}
          </div>
          <div style="font-size:16px; font-weight:800; color:#3a1606; line-height:1.45;">
            "${summarySentence}"
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span style="font-size:12.5px; font-weight:800; color:#6b4c35;">
            ${this.t(`🙏 Bow Quest: ${this.getBowedBuddhaCount()} / 7 (+10 VP each)`, `🙏 七佛礼拜进度：${this.getBowedBuddhaCount()} / 7 尊（每尊 +10 功德）`)}
          </span>
          <button id="btn-bow-this-buddha" class="primary-gold-btn" style="padding:10px 20px; font-size:14px;">
            ${alreadyBowed ? this.t('🙏 Bow Again', '🙏 再次礼拜') : this.t('🙏 Bow (+10 VP)', '🙏 顶礼七佛 (+10 功德)')}
          </button>
        </div>
      </div>
    `;

    // Highlight this Buddha with the 3D golden spotlight if inside the temple
    if (this.buddhaSpotlight && this.buddhaStatues[selectedIndex]) {
      const bx = this.buddhaStatues[selectedIndex].bx;
      this.buddhaSpotlight.position.set(bx, 4.4, 0.6);
      this.buddhaSpotlight.visible = true;
    }

    const speakBtn = document.getElementById('btn-speak-buddha');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        window.templeAudio.speakText(spokenText, true);
      });
    }
    const bowThisBtn = document.getElementById('btn-bow-this-buddha');
    if (bowThisBtn) {
      bowThisBtn.addEventListener('click', () => {
        this.bowToSpecificBuddhaQuest(selectedIndex);
      });
    }

    window.templeAudio.speakText(spokenText, false);
  }

  // Game Designer Recommendation #3: Collectible Virtue & 7-Buddha Sticker Book
  openStickerBookModal() {
    const modal = document.getElementById('sticker-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const grid = document.getElementById('sticker-grid-container');
    const summaryEl = document.getElementById('sticker-progress-summary');
    grid.innerHTML = '';

    const stickers = window.GAME_DATA.STICKER_BADGES || [];
    let unlockedCount = 0;

    stickers.forEach((st) => {
      let isUnlocked = false;
      try {
        isUnlocked = !!st.checkUnlocked(this.state);
      } catch (e) {
        isUnlocked = false;
      }
      if (isUnlocked) unlockedCount++;

      const card = document.createElement('div');
      card.className = `sticker-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <span class="sticker-status-pill">${isUnlocked ? this.t('★ Unlocked', '★ 已获得') : this.t('🔒 Locked', '🔒 待解锁')}</span>
        <div class="sticker-emoji">${st.emoji}</div>
        <h4>${this.dField(st, 'title', 'zhTitle')}</h4>
        <p>${this.dField(st, 'desc', 'zhDesc')}</p>
      `;
      grid.appendChild(card);
    });

    if (summaryEl) {
      summaryEl.textContent = this.t(
        `🌟 Collected ${unlockedCount} / ${stickers.length} Golden Stickers!`,
        `🌟 已收集 ${unlockedCount} / ${stickers.length} 枚金色功德徽章！`
      );
    }
  }

  openSkillsCapabilityModal(tab = 'all') {
    const modal = document.getElementById('skills-capability-modal');
    const bodyEl = document.getElementById('skills-capability-body');
    const titleEl = document.getElementById('skills-capability-title');
    if (!modal || !bodyEl) return;

    this._activeCapTab = tab || 'all';
    modal.classList.remove('hidden');

    if (titleEl) {
      titleEl.textContent = this.t(
        '🏮 Prayer Skills & Thousand-Buddha Hall (千佛殿)',
        '🏮 修行技能与千佛殿 (Skills & 千佛殿)'
      );
    }

    // Update tab button labels and active state
    document.querySelectorAll('.cap-tab-btn[data-cap-tab]').forEach((b) => {
      const k = b.dataset.capTab;
      b.classList.toggle('active', k === this._activeCapTab);
      if (k === 'all') b.textContent = this.t('✨ Overview', '✨ 全部总览');
      if (k === 'skills') b.textContent = this.t('🙏 Prayer Skills', '🙏 修行技能');
      if (k === 'qianfodian') b.textContent = this.t('🏮 千佛殿 (35 · 8)', '🏮 千佛殿 (35佛 · 8菩萨)');
    });

    const isAmitofoUnlocked = !!(
      this.state.amitofoUnlocked ||
      this.state.virtuePoints >= 100 ||
      (this.state.amitofoCount || 0) > 0
    );
    const count = this.state.amitofoCount || 0;
    const cycleCount = count > 0 && count % 100 === 0 ? 100 : count % 100;

    const thirtyFive = window.GAME_DATA.THIRTY_FIVE_BUDDHAS || [];
    const eightBodhisattvas = window.GAME_DATA.EIGHT_BODHISATTVAS || [];

    const filledBuddhaCount = thirtyFive.filter(
      (b) =>
        (b.linkedKey === 'changshou' && !!this.state.bowedChangshou) ||
        (b.linkedSevenBuddhaIdx !== null && b.linkedSevenBuddhaIdx !== undefined &&
          this.state.bowedBuddhas && this.state.bowedBuddhas[b.linkedSevenBuddhaIdx])
    ).length;

    const filledBodhisattvaCount = eightBodhisattvas.filter(
      (bo) => bo.linkedKey === 'manjushri' && !!this.state.bowedManjushri
    ).length;

    const showSkills = this._activeCapTab === 'all' || this._activeCapTab === 'skills';
    const showQianfodian = this._activeCapTab === 'all' || this._activeCapTab === 'qianfodian';

    const wenshuRefSrc = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/wenshu_bodhisattva_ref.jpg'])
      || 'assets/wenshu_bodhisattva_ref.jpg?v=2';
    const changshouRefSrc = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/changshou_buddha_ref.jpg'])
      || 'assets/changshou_buddha_ref.jpg?v=2';

    let html = '';

    if (showSkills) {
      const isWenshuUnlocked = !!this.state.bowedManjushri;
      const wenshuCount = this.state.wenshuMantraCount || 0;
      const isChangshouUnlocked = !!this.state.bowedChangshou;
      const changshouCount = this.state.changshouPrayerCount || 0;
      const unlockedSkillsTotal = (isAmitofoUnlocked ? 1 : 0) + (isWenshuUnlocked ? 1 : 0) + (isChangshouUnlocked ? 1 : 0);
      const activePrayerId = this.getActivePrayerSkillId();
      const chantingNow = !!this._isPrayerChanting;
      const chantingId = this._activeChantingSkillId;

      const makeSwitchBtn = (id, unlocked) => {
        if (!unlocked) {
          return `<span class="cap-count-badge" style="opacity:0.75;">🔒 ${this.t('Locked', '未解锁')}</span>`;
        }
        const isActive = activePrayerId === id;
        return `<button type="button" class="hud-btn ${isActive ? 'primary-red' : ''}" data-switch-prayer="${id}" style="padding:5px 10px; font-size:11.5px; font-weight:800;">
          ${isActive ? this.t('🌟 Active [Key L]', '🌟 当前快捷键 [L]') : this.t('🔄 Switch to [Key L]', '🔄 切换为快捷键 [L]')}
        </button>`;
      };

      html += `
        <div class="cap-section-card">
          <div class="cap-section-head">
            <h3>🙏 ${this.t('Prayer Skill Window', '念佛修行技能栏')}</h3>
            <span class="cap-count-badge">${this.t(`Unlocked: ${unlockedSkillsTotal} / 3 · Active: [L]`, `已解锁：${unlockedSkillsTotal} / 3 · 快捷键：[L]`)}</span>
          </div>
          <div style="background:#fffbeb; border:1.5px solid #f59e0b; border-radius:10px; padding:8px 12px; margin-bottom:10px; font-size:12px; font-weight:800; color:#78350f; line-height:1.45;">
            ${this.t(
              '⌨️ Shortcut [L]: Once a prayer is unlocked, press L on your keyboard to listen & pray! Switch between unlocked prayers below. Please wait for each prayer to finish pronouncing before praying again.',
              '⌨️ 快捷键 [L] 说明：技能解锁后，按键盘 L 键即可发声念诵当前法门！下方可随时切换快捷键 [L] 对应的经咒；每次念诵请聆听完毕后再进行下一次祈祷。'
            )}
          </div>
          <div class="skill-hero-card ${isAmitofoUnlocked ? 'unlocked-glow' : ''}">
            <div style="flex:1; min-width:220px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:15px; font-weight:900; color:#7a1c1c;">
                  🪷 ${this.t('Skill 1: 南无阿弥陀佛 · Nanmo Amitofo', '第一技能：南无阿弥陀佛（念佛法门）')}
                </span>
                ${makeSwitchBtn('amitofo', isAmitofoUnlocked)}
              </div>
              <div style="font-size:12.5px; font-weight:700; color:#5b3416; margin-top:4px; line-height:1.45;">
                ${this.t(
                  `Pronunciation: 南无阿弥陀佛 (Nan mo Ah mee to fo). +5 VP each · 100 prayers summon golden Sky Vision! (Progress: ${cycleCount}/100 · Total: ${count})`,
                  `发声念诵：南 无 阿 弥 陀 佛（nā mó ā mí tuó fó）。每次功德 +5；满 100 声显现虚空圣境！（进度：${cycleCount}/100 · 总计：${count} 声）`
                )}
              </div>
            </div>
            <button class="primary-gold-btn" id="cap-btn-cast-amitofo" ${chantingNow ? 'disabled' : ''} style="padding:10px 18px; font-size:13.5px; white-space:nowrap;">
              ${chantingNow && chantingId === 'amitofo'
                ? this.t('🔊 Pronouncing...', '🔊 正在念诵…')
                : `🪷 ${this.t(`Pray [L] (${cycleCount}/100)`, `🔊 念诵 (${cycleCount}/100)`)}`}
            </button>
          </div>

          <div class="skill-hero-card ${isWenshuUnlocked ? 'unlocked-glow' : ''}" style="margin-top:10px;">
            <img src="${wenshuRefSrc}" alt="文殊菩萨" style="width:48px; height:48px; object-fit:cover; border-radius:10px; border:1.5px solid #d4941c; flex-shrink:0;" />
            <div style="flex:1; min-width:220px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:15px; font-weight:900; color:#7a1c1c;">
                  🦁 ${this.t('Skill 2: 文殊心咒 · Manjushri Mantra', '第二技能：文殊心咒（大智文殊菩萨）')}
                </span>
                ${makeSwitchBtn('wenshu', isWenshuUnlocked)}
              </div>
              <div style="font-size:12.5px; font-weight:700; color:#5b3416; margin-top:5px; line-height:1.5;">
                <div>• ${this.t('Sanskrit Romanization: Om A Ra Pa Ca Na Dhih', '梵文罗马拼音：Om A Ra Pa Ca Na Dhih')}</div>
                <div>• ${this.t('Chinese Phonetics: 嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）', '汉字谐音读法：嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）')}</div>
                <div style="margin-top:2px; opacity:0.9;">
                  ${this.t(
                    `Unlocked once you bow to 文殊菩萨! Grants +5 VP & wisdom light (Chanted: ${wenshuCount}).`,
                    `于山顶文殊殿礼敬文殊菩萨即可解锁！每次发声持诵功德 +5（已持诵：${wenshuCount} 遍）。`
                  )}
                </div>
              </div>
            </div>
            <button class="primary-gold-btn" id="cap-btn-cast-wenshu" ${chantingNow && isWenshuUnlocked ? 'disabled' : ''} style="padding:10px 18px; font-size:13.5px; white-space:nowrap; ${isWenshuUnlocked ? '' : 'opacity:0.86;'}">
              ${isWenshuUnlocked
                ? (chantingNow && chantingId === 'wenshu'
                  ? this.t('🔊 Pronouncing...', '🔊 正在持诵…')
                  : `🦁 ${this.t(`Chant Mantra (${wenshuCount})`, `🔊 念诵心咒 (${wenshuCount})`)}`)
                : `🔒 ${this.t('Bow to 文殊菩萨', '礼敬文殊菩萨解锁')}`}
            </button>
          </div>

          <div class="skill-hero-card ${isChangshouUnlocked ? 'unlocked-glow' : ''}" style="margin-top:10px;">
            <img src="${changshouRefSrc}" alt="长寿佛" style="width:48px; height:48px; object-fit:cover; border-radius:10px; border:1.5px solid #d4941c; flex-shrink:0;" />
            <div style="flex:1; min-width:220px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:15px; font-weight:900; color:#7a1c1c;">
                  🏺 ${this.t('Skill 3: 长寿佛心咒 · Longevity Buddha Mantra', '第三技能：长寿佛心咒（无量寿佛加持）')}
                </span>
                ${makeSwitchBtn('changshou', isChangshouUnlocked)}
              </div>
              <div style="font-size:12.5px; font-weight:700; color:#5b3416; margin-top:5px; line-height:1.5;">
                <div>• ${this.t('Mantra: 嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈', '心咒：嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈')}</div>
                <div>• ${this.t(
                  'Benefit: 善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。',
                  '长寿佛心咒利益：善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。'
                )}</div>
                <div style="margin-top:2px; opacity:0.9;">
                  ${this.t(
                    `Unlocked by bowing to 长寿佛! +5 VP each (Chanted: ${changshouCount}).`,
                    `于西苑长寿殿礼敬长寿佛即可解锁！每次祈愿功德 +5（已持诵：${changshouCount} 遍）。`
                  )}
                </div>
              </div>
            </div>
            <button class="primary-gold-btn" id="cap-btn-cast-changshou" ${chantingNow && isChangshouUnlocked ? 'disabled' : ''} style="padding:10px 18px; font-size:13.5px; white-space:nowrap; ${isChangshouUnlocked ? '' : 'opacity:0.86;'}">
              ${isChangshouUnlocked
                ? (chantingNow && chantingId === 'changshou'
                  ? this.t('🔊 Pronouncing...', '🔊 正在祈愿…')
                  : `🏺 ${this.t(`Chant Mantra (${changshouCount})`, `🔊 念诵心咒 (${changshouCount})`)}`)
                : `🔒 ${this.t('Bow to 长寿佛', '礼敬长寿佛解锁')}`}
            </button>
          </div>

          <div style="margin-top:8px; font-size:11.5px; font-weight:700; color:#8c6a43;">
            ${this.t('🌱 More practice skills will unlock as new sanctuary halls open!', '🌱 更多修行法门技能将于后续新殿堂开放时陆续解锁。')}
          </div>
        </div>
      `;
    }

    if (showQianfodian) {
      const buddhaTilesHtml = thirtyFive.map((b) => {
        const isChangshouTile = b.linkedKey === 'changshou';
        const isFilled =
          (isChangshouTile && !!this.state.bowedChangshou) ||
          (b.linkedSevenBuddhaIdx !== null &&
            b.linkedSevenBuddhaIdx !== undefined &&
            !!(this.state.bowedBuddhas && this.state.bowedBuddhas[b.linkedSevenBuddhaIdx]));
        const dispName = this.isZh()
          ? (b.cnName || b.name)
          : `<span style="display:block;font-weight:900;color:#7a1c1c;">${b.cnName || ''}</span><span style="display:block;font-size:10px;opacity:0.85;">${b.name}</span>`;
        const badgeText = isFilled
          ? this.t('★ Lit', '★ 已礼敬')
          : (isChangshouTile
            ? this.t('🏺 长寿殿', '🏺 长寿殿')
            : (b.linkedSevenBuddhaIdx !== null && b.linkedSevenBuddhaIdx !== undefined
              ? this.t('🙏 Prayer Hall', '🙏 七佛宝殿')
              : this.t('🌱 Future', '🌱 待扩展')));
        const linkedSevenB = (b.linkedSevenBuddhaIdx !== null && b.linkedSevenBuddhaIdx !== undefined)
          ? (window.GAME_DATA.SEVEN_BUDDHAS || [])[b.linkedSevenBuddhaIdx]
          : null;
        const sevenBuddhaImgSrc = (linkedSevenB && linkedSevenB.img)
          ? ((window.INLINE_ASSETS && window.INLINE_ASSETS[linkedSevenB.img]) || linkedSevenB.img)
          : '';
        const tileIconHtml = (isChangshouTile && isFilled)
          ? `<img src="${changshouRefSrc}" alt="长寿佛" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1.5px solid #d4941c; display:block; margin:2px auto;" />`
          : (sevenBuddhaImgSrc && isFilled
            ? `<img src="${sevenBuddhaImgSrc}" alt="${b.cnName || b.name}" style="width:48px; height:60px; object-fit:contain; background:#ffffff; border-radius:8px; border:1.5px solid #d4941c; display:block; margin:2px auto;" />`
            : `<div class="deity-tile-icon">${isFilled ? (isChangshouTile ? '🏺' : '🪷') : '☸️'}</div>`);
        return `
          <div class="deity-tile buddha ${isFilled ? 'filled' : 'unlit'}" data-buddha-cap-idx="${b.index}">
            <div class="deity-tile-num">#${b.index + 1}</div>
            ${tileIconHtml}
            <div class="deity-tile-name">${dispName}</div>
            <div class="deity-tile-status">${badgeText}</div>
          </div>
        `;
      }).join('');

      const bodhisattvaTilesHtml = eightBodhisattvas.map((bo) => {
        const isManjushriTile = bo.linkedKey === 'manjushri';
        const isFilled = isManjushriTile && !!this.state.bowedManjushri;
        const dispName = this.isZh()
          ? (bo.cnName || bo.name)
          : `<span style="display:block;font-weight:900;color:#7a1c1c;">${bo.cnName || ''}</span><span style="display:block;font-size:10px;opacity:0.85;">${bo.name}</span>`;
        const dispDesc = this.dField(bo, 'desc', 'zhDesc');
        const badgeText = isFilled
          ? this.t('★ Visited', '★ 已朝礼')
          : (isManjushriTile ? this.t('🏔️ 文殊殿', '🏔️ 文殊殿') : this.t('🌱 Future', '🌱 待扩展'));
        const boIconHtml = (isManjushriTile && isFilled)
          ? `<img src="${wenshuRefSrc}" alt="文殊菩萨" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1.5px solid #d4941c; display:block; margin:2px auto;" />`
          : `<div class="deity-tile-icon">${bo.emoji || '🙏'}</div>`;
        return `
          <div class="deity-tile bodhisattva ${isFilled ? 'filled' : 'unlit'}" data-bodhisattva-cap-idx="${bo.index}">
            <div class="deity-tile-num">#${bo.index + 1}</div>
            ${boIconHtml}
            <div class="deity-tile-name">${dispName}</div>
            <div style="font-size:10px; opacity:0.85;">${dispDesc}</div>
            <div class="deity-tile-status">${badgeText}</div>
          </div>
        `;
      }).join('');

      html += `
        <div class="cap-section-card">
          <div class="cap-section-head">
            <h3>🏮 ${this.t('千佛殿 · 35 Buddhas Hall', '千佛殿 · 三十五佛金像殿')}</h3>
            <span class="cap-count-badge">${this.t(`Lit: ${filledBuddhaCount} / 35 Buddhas`, `已点亮：${filledBuddhaCount} / 35 尊佛`)}</span>
          </div>
          <div style="font-size:12px; font-weight:700; color:#6b4c35; margin-bottom:8px;">
            ${this.t(
              'Visit & bow to the 7 Buddhas in the Prayer Hall (#1–#7) and 长寿佛 in Longevity Hall (#8) to illuminate them here!',
              '前往七佛宝殿礼拜过去七佛 (#1–#7)，或前往西苑长寿殿礼拜长寿佛 (#8)，即可点亮对应佛像；其余佛位预留未来扩展！'
            )}
          </div>
          <div class="deity-grid-35">${buddhaTilesHtml}</div>
        </div>

        <div class="cap-section-card">
          <div class="cap-section-head">
            <h3>🌺 ${this.t('千佛殿 · 8 Great Bodhisattvas', '千佛殿 · 八大菩萨殿')}</h3>
            <span class="cap-count-badge">${this.t(`Visited: ${filledBodhisattvaCount} / 8`, `已朝礼：${filledBodhisattvaCount} / 8 尊菩萨`)}</span>
          </div>
          <div style="font-size:12px; font-weight:700; color:#6b4c35; margin-bottom:8px;">
            ${this.t(
              'Visit & bow to Manjushri Bodhisattva atop Mount Wutai (文殊殿) to fill Manjushri here. Slots #2–#8 await future expansion!',
              '登上五台山文殊殿礼敬文殊菩萨，即可在此点亮并上色文殊菩萨金像；其余 7 尊菩萨位预留后续扩展！'
            )}
          </div>
          <div class="deity-grid-8">${bodhisattvaTilesHtml}</div>
        </div>
      `;
    }

    bodyEl.innerHTML = html;

    bodyEl.querySelectorAll('[data-switch-prayer]').forEach((swBtn) => {
      swBtn.addEventListener('click', () => {
        this.setActivePrayerSkill(swBtn.dataset.switchPrayer);
      });
    });

    const castBtn = document.getElementById('cap-btn-cast-amitofo');
    if (castBtn) {
      castBtn.addEventListener('click', () => {
        this.castNanmoAmitofo();
        this.openSkillsCapabilityModal(this._activeCapTab || 'all');
      });
    }
    const castWenshuBtn = document.getElementById('cap-btn-cast-wenshu');
    if (castWenshuBtn) {
      castWenshuBtn.addEventListener('click', () => {
        if (this.state.bowedManjushri) {
          this.castWenshuMantra();
          this.openSkillsCapabilityModal(this._activeCapTab || 'all');
        } else {
          modal.classList.add('hidden');
          this.teleportToWenshuHallInterior();
        }
      });
    }
    const castChangshouBtn = document.getElementById('cap-btn-cast-changshou');
    if (castChangshouBtn) {
      castChangshouBtn.addEventListener('click', () => {
        if (this.state.bowedChangshou) {
          this.castChangshouPrayer();
          this.openSkillsCapabilityModal(this._activeCapTab || 'all');
        } else {
          modal.classList.add('hidden');
          this.teleportToChangshouHallInterior();
        }
      });
    }

    bodyEl.querySelectorAll('[data-buddha-cap-idx]').forEach((tile) => {
      tile.addEventListener('click', () => {
        const idx = parseInt(tile.dataset.buddhaCapIdx, 10);
        const item = thirtyFive[idx];
        if (!item) return;
        if (item.linkedKey === 'changshou') {
          modal.classList.add('hidden');
          if (this.isInsideChangshouHall()) {
            this.bowToChangshouQuest();
          } else {
            this.teleportToChangshouHallInterior();
          }
        } else if (item.linkedSevenBuddhaIdx !== null && item.linkedSevenBuddhaIdx !== undefined) {
          modal.classList.add('hidden');
          this.openBuddhaModal(item.linkedSevenBuddhaIdx);
        } else {
          const bName = this.isZh() ? item.cnName : `${item.cnName} · ${item.name}`;
          this.showToast(this.t(
            `🌱 ${bName} (#${idx + 1}/35) is reserved for future hall expansion!`,
            `🌱 「${bName}」（第 ${idx + 1}/35 尊）预留予后续千佛殿扩展开放！`
          ));
        }
      });
    });

    bodyEl.querySelectorAll('[data-bodhisattva-cap-idx]').forEach((tile) => {
      tile.addEventListener('click', () => {
        const idx = parseInt(tile.dataset.bodhisattvaCapIdx, 10);
        const bo = eightBodhisattvas[idx];
        if (!bo) return;
        const boName = this.isZh() ? bo.cnName : bo.name;
        if (bo.linkedKey === 'manjushri') {
          modal.classList.add('hidden');
          if (this.canCrossEastRiver() && this.canEnterWenshuHall()) {
            this.bowToManjushriQuest();
          } else {
            this.showToast(this.t(
              '🦁 Build the Wisdom Bridge & circle the 7 White Stupas to visit Manjushri in 文殊殿!',
              '🦁 请先修建智慧桥并依次顺绕七座白塔，进入文殊殿礼敬文殊菩萨即可点亮！'
            ));
          }
        } else {
          this.showToast(this.t(
            `🌱 ${boName} (#${idx + 1}/8) is reserved for future temple expansion!`,
            `🌱 「${boName}」（第 ${idx + 1}/8 尊）预留予后续殿堂扩展开放！`
          ));
        }
      });
    });
  }

  openPersonalBuilderModal() {
    const modal = document.getElementById('personal-modal');
    modal.classList.remove('hidden');
    const inSpace = this.currentScene === 'personal_space';
    const vp = this.state.virtuePoints || 0;
    const lp = this.state.liberationPoints || 0;

    const banner = document.getElementById('store-space-banner');
    if (banner) {
      if (inSpace) {
        banner.innerHTML = `
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
            <span>🏡 ${this.t(
              `In Your Personal Space · Each Store item costs 2 Virtue Points (Balance: ${vp} VP · ${lp} LP)`,
              `已进入个人道场 · 商城每件法物/物品均需 2 点功德购买（当前功德：${vp} 点 · 解脱点：${lp} 点）`
            )}</span>
            <span style="font-weight:800; color:#2e7d32;">✅ ${this.t('Ready to Purchase', '可直接购买')}</span>
          </div>
        `;
      } else {
        banner.innerHTML = `
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
            <span>🔒 ${this.t(
              `Enter your Personal Space to purchase Store items (2 VP each · Balance: ${vp} VP).`,
              `进入「个人道场」后即可购买商城全部物品（每件 2 功德 · 当前功德：${vp} 点）。`
            )}</span>
            <button id="btn-enter-space-for-store" class="deed-action-btn" style="background:linear-gradient(135deg,#2e7d32,#43a047); color:#fff; border:none;">
              ${this.t('🌱 Enter My Space', '🌱 立即进入个人道场')}
            </button>
          </div>
        `;
        const enterBtn = document.getElementById('btn-enter-space-for-store');
        if (enterBtn) {
          enterBtn.addEventListener('click', () => {
            this.maybePromptHuixiangThen(() => {
              this.switchScene('personal_space');
              this.openPersonalBuilderModal();
            });
          });
        }
      }
    }

    const list = document.getElementById('personal-items-list');
    list.innerHTML = '';

    (window.GAME_DATA.PERSONAL_SPACE_ITEMS || []).forEach((item) => {
      const owned = !!(this.state.personalItems && this.state.personalItems[item.id]);
      const itemName = this.dField(item, 'name', 'zhName');
      const itemDesc = (item.desc || item.zhDesc) ? this.dField(item, 'desc', 'zhDesc') : '';
      const row = document.createElement('div');
      row.className = `store-item-card deed-item ${owned ? 'done' : ''}`;
      row.innerHTML = `
        <div class="deed-info">
          <div class="deed-emoji">${item.emoji || '🎁'}</div>
          <div class="deed-text">
            <h4>${itemName}</h4>
            ${itemDesc ? `<p style="margin-bottom:3px;">${itemDesc}</p>` : ''}
            <p>${owned
              ? this.t('Owned & placed in your Personal Space!', '已购买并庄严安置于个人道场！')
              : this.t(`Price: ${item.cost} Virtue Points`, `售价：${item.cost} 功德点`)}</p>
          </div>
        </div>
        <button class="deed-action-btn" ${owned ? 'disabled' : ''}>${owned
          ? this.t('✓ Owned', '✓ 已购买')
          : (inSpace
            ? this.t(`🛒 Buy (${item.cost} VP)`, `🛒 购买 (${item.cost} 功德)`)
            : this.t('🔒 Enter Space', '🔒 先入道场'))}</button>
      `;
      if (!owned) {
        row.querySelector('button').addEventListener('click', () => {
          if (this.currentScene !== 'personal_space') {
            this.showToast(this.t(
              '🌱 Enter your Personal Space first to purchase items from the Store!',
              '🌱 请先进入「个人道场」，即可使用 2 功德点购买商城物品！'
            ));
            return;
          }
          if (this.state.virtuePoints < item.cost) {
            this.showToast(this.t(
              `Need ${item.cost} Virtue Points to purchase ${itemName}!`,
              `需要 ${item.cost} 点功德方能购买「${itemName}」！`
            ));
            return;
          }
          this.state.virtuePoints -= item.cost;
          if (!this.state.personalItems) this.state.personalItems = {};
          this.state.personalItems[item.id] = true;
          this.saveState();
          this.rebuildPersonalItems3D();
          this.updateHUD();
          this.openPersonalBuilderModal();
          window.templeAudio.playGoodDeedChime();
          this.showToast(this.t(
            `🛒 Purchased & placed ${itemName} in your Personal Space!`,
            `🛒 已花费 ${item.cost} 功德购买并安放「${itemName}」！`
          ));
        });
      }
      list.appendChild(row);
    });
  }

  openTaskMapModal() {
    const modal = document.getElementById('task-map-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const titleEl = document.getElementById('task-map-modal-title');
    if (titleEl) {
      titleEl.textContent = this.t('🗺️ 10-Stop Map', '🗺️ 十站寻佛地图');
    }

    const bodyEl = document.getElementById('task-map-modal-body');
    if (!bodyEl) return;

    const vp = this.state.virtuePoints || 0;
    const lp = this.state.liberationPoints || 0;
    const stops = window.GAME_DATA.TASK_MAP_STOPS || [];
    const firstRow = stops.slice(0, 5);
    const secondRow = stops.slice(5, 10);

    bodyEl.innerHTML = `
      <div class="task-map-summary">
        <span style="font-weight:900; color:#7a1c1c; font-size:13.5px;">
          ${this.t('🚩 Gather VP & LP along 10 sacred stops (Coming Soon)', '🚩 攒够功德与解脱点 · 逐站拜访新佛陀（即将开放）')}
        </span>
        <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:12.5px; font-weight:900;">
          <span style="background:#fff; border:1.5px solid #d97706; border-radius:999px; padding:3px 10px; color:#8b1e1e;">🪷 ${this.t(`VP: ${vp}`, `功德 ${vp}`)}</span>
          <span style="background:#ecfdf5; border:1.5px solid #16a34a; border-radius:999px; padding:3px 10px; color:#14532d;">✨ ${this.t(`LP: ${lp}`, `解脱 ${lp}`)}</span>
        </div>
      </div>
      <div class="task-map-board">
        <div class="task-map-row row-forward" id="task-map-row-1"></div>
        <div style="text-align:center; font-size:12px; font-weight:900; color:#b45309;">
          ⬇️ ${this.t('Stop #5 ➔ Stop #6', '第 5 站 ➔ 第 6 站')}
        </div>
        <div class="task-map-row row-return" id="task-map-row-2"></div>
      </div>
    `;

    const buildNode = (stop, idx, container) => {
      const stopNum = stop.index || stop.stop || (idx + 1);
      const shortLabel = (stop.shortName || stop.zhShortName)
        ? this.dField(stop, 'shortName', 'zhShortName')
        : this.dField(stop, 'buddhaName', 'zhBuddhaName');
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'task-map-node';
      node.innerHTML = `
        <div class="task-map-node-top">
          <span>#${stopNum}</span>
          <span>🔒</span>
        </div>
        <div class="task-map-node-icon">${stop.emoji || '🪷'}</div>
        <div class="task-map-node-name">${shortLabel}</div>
        <div class="task-map-node-req">🪷${stop.reqVP || 0} · ✨${stop.reqLP || 0}</div>
      `;
      node.addEventListener('click', () => {
        this.showToast(this.t(
          `🔒 Stop #${stopNum} (${shortLabel}) unlocks in a future update!`,
          `🔒 第 ${stopNum} 站「${shortLabel}」暂未解锁，敬请期待！`
        ));
      });
      container.appendChild(node);
    };

    const row1El = document.getElementById('task-map-row-1');
    const row2El = document.getElementById('task-map-row-2');
    firstRow.forEach((s, i) => buildNode(s, i, row1El));
    secondRow.forEach((s, i) => buildNode(s, i + 5, row2El));
  }

  // -------------------- BILINGUAL I18N (SIMPLIFIED CHINESE <-> ENGLISH) --------------------
  isZh() {
    return !this.state || this.state.lang !== 'en';
  }

  t(enText, zhText) {
    return this.isZh() ? zhText : enText;
  }

  dField(obj, enKey, zhKey) {
    if (!obj) return '';
    return this.isZh() ? (obj[zhKey] || obj[enKey] || '') : (obj[enKey] || obj[zhKey] || '');
  }

  setLanguage(lang) {
    const next = lang === 'en' ? 'en' : 'zh';
    this.state.lang = next;
    if (next === 'en' && this.state.playerName === '小沙弥') {
      this.state.playerName = 'Little Lama';
    } else if (next === 'zh' && this.state.playerName === 'Little Lama') {
      this.state.playerName = '小沙弥';
    }
    this.saveState();
    this.applyLanguageToDOM();
    this.refreshAllWorldLabelsLanguage();
    this.updateHUD();
    this._lastSpokenPromptId = null;

    // Live-refresh open panels/modals if visible
    const buddhaModal = document.getElementById('buddha-modal');
    if (buddhaModal && !buddhaModal.classList.contains('hidden')) {
      this.openBuddhaModal(this._activeBuddhaTabIdx || 0);
    }
    const templeModal = document.getElementById('temple-modal');
    if (templeModal && !templeModal.classList.contains('hidden')) {
      this.openTempleDesignerModal();
    }
    const stickerModal = document.getElementById('sticker-modal');
    if (stickerModal && !stickerModal.classList.contains('hidden')) {
      this.openStickerBookModal();
    }
    const personalModal = document.getElementById('personal-modal');
    if (personalModal && !personalModal.classList.contains('hidden')) {
      this.openPersonalBuilderModal();
    }
    const wishingModal = document.getElementById('wishing-tree-modal');
    if (wishingModal && !wishingModal.classList.contains('hidden')) {
      this.openWishingTreeModal();
    }
    const skillsCapModal = document.getElementById('skills-capability-modal');
    if (skillsCapModal && !skillsCapModal.classList.contains('hidden')) {
      this.openSkillsCapabilityModal(this._activeCapTab || 'all');
    }
    const taskMapModal = document.getElementById('task-map-modal');
    if (taskMapModal && !taskMapModal.classList.contains('hidden')) {
      this.openTaskMapModal();
    }

    this.showToast(next === 'zh' ? '🌐 已切换为简体中文界面' : '🌐 Switched game language to English');
  }

  toggleLanguage() {
    this.setLanguage(this.isZh() ? 'en' : 'zh');
  }

  applyLanguageToDOM() {
    const zh = this.isZh();
    document.documentElement.lang = zh ? 'zh-CN' : 'en';

    const setText = (sel, en, cn) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = zh ? cn : en;
    };
    const setTitle = (sel, en, cn) => {
      const el = document.querySelector(sel);
      if (el) el.setAttribute('title', zh ? cn : en);
    };

    // Top Language & Action Buttons
    const langBtn = document.getElementById('hud-lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = zh ? '🌐 中文 · EN' : '🌐 EN · 中文';
      langBtn.title = zh ? 'Switch to English' : '切换为简体中文';
    }
    setText('#label-virtue-point', 'Virtue Point', '功德值 VP');
    setText('#label-liberation-point', 'Liberation Point', '解脱功德');
    setText('#tab-courtyard', '⛰️ Start', '⛰️ 起点');
    setText('#tab-changshou-hall', '🏺 Longevity', '🏺 长寿殿');
    setText('#hud-btn-qianfodian', '🏮 Skills', '🏮 技能·千佛');
    setTitle('#hud-btn-qianfodian', 'Skills & Thousand-Buddha Hall (35 Buddhas · 8 Bodhisattvas)', '打开修行技能与千佛殿（35佛 · 8菩萨）');
    setText('#btn-top-store', '🏪 Store', '🏪 商城');
    setTitle('#btn-top-store', 'Store (Buy items in My Space for 2 VP each)', '功德商城（进入个人道场后每件 2 功德购买）');
    setText('#btn-top-task-map', '🗺️ Map', '🗺️ 地图');
    setTitle('#btn-top-task-map', '10-Stop Buddha Map (Coming Soon)', '十站寻佛地图（敬请期待）');
    setText('#btn-menu-store', '🏪 Store', '🏪 商城');
    setText('#btn-menu-task-map', '🗺️ Quest Map', '🗺️ 寻佛地图');
    setText('#btn-pure-view', '👁️ Pure View', '👁️ 纯净视角');
    setTitle('#btn-pure-view', 'Pure Scenery View', '纯净禅意视角');
    setText('#btn-toggle-menu-drawer', '☰ Menu', '☰ 菜单');
    setText('#pure-view-exit-btn', '👁️ Show UI', '👁️ 显示界面');

    // Online Pilgrims pill
    const pill = document.getElementById('online-pilgrims-pill');
    const countSpan = document.getElementById('online-pilgrims-count');
    if (pill && countSpan) {
      const n = countSpan.textContent || '1';
      pill.innerHTML = zh
        ? `👥 在线 <span id="online-pilgrims-count">${n}</span>`
        : `👥 Online <span id="online-pilgrims-count">${n}</span>`;
    }

    // Left Side Panel (Good Deed Hints)
    setText('#side-panel h2', '🧭 Good Deed Hints', '🧭 善行任务指南');
    setTitle('#reset-deeds-btn', 'Reset Progress', '重置进度');

    // Right Sanctuary Menu Drawer (Kid-Friendly 2 Cards)
    setText('#right-panel .panel-header h2', '📜 Quick Menu', '📜 快捷菜单');
    const rightCardsH3 = document.querySelectorAll('#right-panel .right-card h3');
    if (rightCardsH3[0]) rightCardsH3[0].textContent = zh ? '🎒 百宝箱' : '🎒 Treasure Box';
    if (rightCardsH3[1]) rightCardsH3[1].textContent = zh ? '⚙️ 声音与设置' : '⚙️ Sound & Settings';

    setText('#btn-open-skills-window', '✨ Skills', '✨ 技能·千佛');
    setText('#tab-personal-space', '🌱 My Space', '🌱 个人道场');
    setText('#btn-open-temple-designer', '🏯 Temple', '🏯 殿宇样式');
    setText('#btn-open-buddhas', '📖 7 Buddhas', '📖 认识七佛');
    setText('#btn-open-quiz', '🧠 Quiz', '🧠 智慧问答');
    setText('#btn-open-stickers', '🎖️ Stickers', '🎖️ 功德徽章');
    if (window.templeAudio) {
      const natPlaying = !!(window.templeAudio.natureGain || window.templeAudio.isNaturePlaying);
      setText('#btn-nature-toggle', natPlaying ? '🍃 Nature: ON' : '🍃 Nature: OFF', natPlaying ? '🍃 自然音: 开' : '🍃 自然音: 关');
      setText('#btn-voice-toggle', window.templeAudio.voiceEnabled ? '🗣️ Voice: ON' : '🗣️ Voice: OFF', window.templeAudio.voiceEnabled ? '🗣️ 语音: 开' : '🗣️ 语音: 关');
      setText('#btn-audio-toggle', window.templeAudio.muted ? '🔇 Muted' : '🔊 Sound', window.templeAudio.muted ? '🔇 静音' : '🔊 音效');
    }
    const shareLink = document.querySelector('#right-panel a[download]');
    if (shareLink) shareLink.textContent = zh ? '📥 分享版' : '📥 Share';
    setText('#top-reset-btn', '🔄 Reset Progress', '🔄 重置进度');

    // Bottom Prayer Hall Action Bar (Concise labels)
    setText('#hall-status-text', '🏮 Hall Practice (+10 VP)', '🏮 殿内修行 (+10 功德)');
    setText('#btn-hall-learn-buddhas', '🙏 7 Buddhas', '🙏 七佛');
    setText('#btn-hall-quiz', '🧠 Quiz', '🧠 问答');
    setText('#btn-leave-mat', '🚶 Stand', '🚶 起身');
    setText('#btn-hall-teleport-start', '⛰️ Start', '⛰️ 回起点');
    const hallBarEl = document.getElementById('meditation-mat-bar');
    const toggleMatBarBtn = document.getElementById('btn-toggle-mat-bar');
    if (toggleMatBarBtn) {
      const isCol = !!(hallBarEl && hallBarEl.classList.contains('mat-bar-collapsed'));
      toggleMatBarBtn.textContent = isCol
        ? this.t('▴ Open', '▴ 展开')
        : this.t('▾ Hide', '▾ 收起');
    }
    setText('.mat-btn[data-hall-action="1"]', '1. 🧘 Sit', '1. 🧘 打坐');
    setText('#btn-hall-bow25', '2. 🙏 Bow 25x', '2. 🙏 礼佛25拜');
    setText('.mat-btn[data-hall-action="3"]', '3. 💧 Water', '3. 💧 供水');
    setText('.mat-btn[data-hall-action="4"]', '4. 🪷 Flower', '4. 🪷 供花');
    setText('.mat-btn[data-hall-action="5"]', '5. 🪔 Incense', '5. 🪔 供香');

    // Bottom Sanctuary Dock
    setText('#dock-btn-palms small', 'Palms', '合掌');
    setText('#dock-btn-bow small', 'Bow', '礼拜');
    const isSittingNow = !!(this.seatedScenic || this.poseMode === 'sit' || this.isSeatedOnMat);
    setText('#dock-sit-label', isSittingNow ? 'Stand' : 'Sit', isSittingNow ? '起身' : '静坐');
    const amitofoEl = document.querySelector('#dock-btn-amitofo small');
    const amitofoCountSpan = document.getElementById('dock-amitofo-count');
    if (amitofoEl && amitofoCountSpan) {
      const cVal = amitofoCountSpan.textContent || '0';
      amitofoEl.innerHTML = zh
        ? `念佛 <span id="dock-amitofo-count">${cVal}</span>/100`
        : `Pray <span id="dock-amitofo-count">${cVal}</span>/100`;
    }
    setText('#dock-btn-muyu small', 'Muyu', '木鱼');
    setText('#dock-btn-quests small', 'Quests', '任务');

    const controlsHint = document.querySelector('.controls-hint');
    if (controlsHint) {
      controlsHint.innerHTML = zh
        ? '🎮 WASD / 方向键：移动 &nbsp;·&nbsp; 🦘 空格：跳跃 &nbsp;·&nbsp; ⏎ E：互动 &nbsp;·&nbsp; 🙏 L：念佛 &nbsp;·&nbsp; 🖱️ 拖动：视角'
        : '🎮 WASD / Arrows: Move &nbsp;·&nbsp; 🦘 Space: Jump &nbsp;·&nbsp; ⏎ E: Interact &nbsp;·&nbsp; 🙏 L: Pray &nbsp;·&nbsp; 🖱️ Drag: Orbit';
    }

    // Modal Headers & Static Text
    setText('#char-modal .modal-header h2', '🎨 Character Design', '🎨 角色装扮设定');
    setText('#save-char-btn', '✨ Save Character', '✨ 保存设置');
    setText('#temple-modal .modal-header h2', '🏯 Temple & Buddha Studio', '🏯 佛殿建筑与佛像材质工坊');
    setText('#apply-temple-design-btn', '✨ Apply Temple Design', '✨ 应用殿宇样式');
    setText('#buddha-modal .modal-header h2', '🙏 Meet the Seven Buddhas (Name, Wish & Benefit)', '🙏 礼敬与认识过去七佛（佛号、本愿与功德）');
    setText('#personal-modal .modal-header h2', '🏪 Personal Space Store (2 VP Each)', '🏪 个人道场商城（每件物品仅需 2 功德）');
    setText('#task-map-modal-title', '🗺️ 10-Stop Map', '🗺️ 十站寻佛地图');
    setText('#sticker-modal .modal-header h2', '🎖️ My Virtue & 7-Buddha Sticker Book', '🎖️ 我的善行与七佛功德徽章册');
    setText('#wishing-tree-modal .modal-header h2', '🎋 Bodhi Wishing Tree', '🎋 菩提祈愿树');
    setText('#btn-confirm-hang-wish', '🌳 Done', '🌳 完成挂牌');
    setText('#buddha-quiz-modal .modal-header h2', '🧠 7-Buddha Wisdom Master Quiz (+30 VP & Golden Crown!)', '🧠 七佛智慧问答挑战 (+30 功德与金冠!)');
    setText('#huixiang-modal .modal-header h2', '🪷 Merit Dedication — 「Hui Xiang」', '🪷 功德圆满 · 礼佛「回向」');

    // Overlays
    setText('.sky-vision-badge', '✨ Shared Sky Vision (5s)', '✨ 圣境圆满 · 全服共赏 (5秒)');
    setText('.sky-vision-footer', '🪷 100 Recitations of Nanmo Amitofo Complete — Golden Lotus & Clouds Shine Across All Realms!', '🪷 南无阿弥陀佛功德圆满百声 · 金莲祥云遍照十方，同游诸善信皆得瞻仰！');
    setText('#blossom-rest-title', '🌸 Mindful Rest Beneath White Blossoms', '🌸 花下静坐息心');
    setText('#blossom-rest-desc', 'Feel the cool breeze beneath white blossoms, set aside all worries, and rest in peaceful joy.', '微风轻拂白花繁枝，万缘放下，静心体会清净法喜。');
    setText('#btn-blossom-3d-view', '👁️ 3D View', '👁️ 3D 实景');
    setText('#btn-blossom-stand-up', '🚶 Stand Up', '🚶 起身续行');
  }

  refreshAllWorldLabelsLanguage() {
    const zh = this.isZh();
    // 1. Registered static world labels
    (this.bilingualLabels || []).forEach((item) => {
      if (item && item.el) {
        item.el.innerHTML = zh ? item.zhText : item.enText;
      }
    });

    // 2. 7 Buddhas inside Prayer Hall
    (window.GAME_DATA.SEVEN_BUDDHAS || []).forEach((bData, idx) => {
      const el = document.getElementById(`buddha-world-label-${idx}`);
      if (el) {
        const bName = zh ? (bData.cnName || bData.name) : bData.name;
        el.innerHTML = `🙏 ${idx + 1}. ${bName}`;
      }
    });

    // 3. 7 White Stupas on Mount Wutai
    (window.GAME_DATA.WENSHU_STUPAS || []).forEach((sp, idx) => {
      const lbl = this.stupaLabels && this.stupaLabels[idx];
      if (lbl) {
        const isDone = !!(this.state.circledStupas && this.state.circledStupas[idx]);
        const spName = this.dField(sp, 'label', 'zhLabel');
        lbl.innerHTML = `${isDone ? '✅' : '☸️'} ${spName}`;
      }
    });

    // 4. Sutra Book Reading Stops
    (this.sutraStations || []).forEach((st) => {
      if (st && st.labelEl && st.book) {
        const isRead = !!(this.state.readSutras && this.state.readSutras[st.book.id]);
        const bkTitle = this.dField(st.book, 'title', 'zhTitle');
        st.labelEl.innerHTML = `${isRead ? '✅' : '📖'} ${bkTitle}`;
      }
    });

    // 5. Family Home + Valley Good Deed Landmarks
    this.updateFamilyHomeVisuals();
    (this.deedStations || []).forEach((st) => {
      if (!st || !st.deed || !st.labelEl || st.deed.groupKey === 'family_home') return;
      const isDone = !!(this.state.completedDeeds && this.state.completedDeeds[st.deed.id]);
      const lm = this.dField(st.deed, 'landmarkName', 'zhLandmarkName');
      st.labelEl.innerHTML = `${isDone ? '✅' : '📍 ' + st.deed.emoji} ${lm}`;
    });
  }

  getCurrentDharmaRank() {
    const ranks = window.GAME_DATA.DHARMA_RANKS || [];
    let current = ranks[0] || { title: '🌱 Novice Traveler', zhTitle: '🌱 初行善信' };
    for (const r of ranks) {
      if (this.state.virtuePoints >= r.minVP) {
        current = r;
      }
    }
    return current;
  }

  updateHUD() {
    const avatarEl = document.getElementById('hud-avatar');
    if (avatarEl && !avatarEl.querySelector('img')) {
      avatarEl.innerHTML = '<img src="assets/little_monk_avatar.jpg" alt="Little Monk" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    }
    const dispName = (this.state.playerName === 'Little Lama' || this.state.playerName === '小沙弥')
      ? this.t('Little Lama', '小沙弥')
      : this.state.playerName;
    document.getElementById('hud-player-name').textContent = dispName;
    const rank = this.getCurrentDharmaRank();
    document.getElementById('hud-char-title').textContent = this.dField(rank, 'title', 'zhTitle');
    document.getElementById('hud-virtue-points').textContent = this.state.virtuePoints;

    const libBox = document.getElementById('liberation-counter-box');
    const libVal = document.getElementById('hud-liberation-points');
    if (libBox && libVal) {
      const lp = this.state.liberationPoints || 0;
      libVal.textContent = lp;
      libBox.classList.remove('hidden');
    }

    const canEnter = this.canEnterPrayerHall();
    const tabHall = document.getElementById('tab-prayer-hall');
    tabHall.textContent = canEnter ? this.t('🏮 Hall', '🏮 佛殿') : this.t('🔒 Hall', '🔒 佛殿');
    tabHall.classList.toggle('locked', !canEnter);

    const circledCount = this.getCircledStupaCount();
    const canWenshu = this.canEnterWenshuHall();
    const tabStupaEl = document.getElementById('tab-stupa');
    if (tabStupaEl) {
      tabStupaEl.textContent = circledCount >= 7
        ? this.t('✅ 7 Stupas', '✅ 七佛塔')
        : this.t(`☸️ Stupas (${circledCount}/7)`, `☸️ 七佛塔 (${circledCount}/7)`);
    }
    const tabWenshuEl = document.getElementById('tab-wenshu-hall');
    if (tabWenshuEl) {
      tabWenshuEl.textContent = canWenshu
        ? this.t('🦁 Manjushri', '🦁 文殊殿')
        : this.t(`🔒 Manjushri (${circledCount}/7)`, `🔒 文殊殿 (${circledCount}/7)`);
      tabWenshuEl.classList.toggle('locked', !canWenshu);
    }
    const tabChangshouEl = document.getElementById('tab-changshou-hall');
    if (tabChangshouEl) {
      tabChangshouEl.textContent = this.state.bowedChangshou
        ? this.t('✅ Longevity Hall', '✅ 长寿殿')
        : this.t('🏺 Longevity Hall', '🏺 长寿殿');
    }

    const doneCount = this.getCompletedDeedCount();
    const totalDeeds = window.GAME_DATA.GOOD_DEEDS.length;
    document.getElementById('deeds-progress-text').textContent = this.t(
      `${doneCount} / ${totalDeeds} Deeds`,
      `${doneCount} / ${totalDeeds} 善行`
    );
    document.getElementById('hall-unlock-status').textContent = canEnter
      ? this.t('✅ Hall Unlocked', '✅ 佛殿已开启')
      : this.t(`Need ${Math.max(0, 5 - doneCount)} more for Hall`, `再完成 ${Math.max(0, 5 - doneCount)} 项入佛殿`);

    const pct = Math.min(100, (doneCount / totalDeeds) * 100);
    document.getElementById('deeds-progress-fill').style.width = `${pct}%`;

    // Populate Left Hint Panel
    const deedsListEl = document.getElementById('deeds-list-container');
    deedsListEl.innerHTML = '';
    window.GAME_DATA.GOOD_DEEDS.forEach((deed) => {
      const isDone = !!this.state.completedDeeds[deed.id];
      const isTracking = this.activeHintDeedId === deed.id && !isDone;
      const dTitle = this.dField(deed, 'title', 'zhTitle');
      const dLandmark = this.dField(deed, 'landmarkName', 'zhLandmarkName');
      const dHint = this.dField(deed, 'hintText', 'zhHintText');
      const item = document.createElement('div');
      item.className = `deed-item ${isDone ? 'done' : ''}`;
      if (isTracking) {
        item.style.borderColor = '#c0392b';
        item.style.background = '#fff3d6';
      }
      item.innerHTML = `
        <div class="deed-info">
          <div class="deed-emoji">${deed.emoji}</div>
          <div class="deed-text">
            <h4>${dTitle}</h4>
          </div>
        </div>
        <button class="deed-action-btn">${isDone ? '✓' : (isTracking ? this.t('🧭 Guide', '🧭 指引') : '🧭')}</button>
      `;
      if (!isDone) {
        item.addEventListener('click', () => {
          this.activeHintDeedId = deed.id;
          this.updateHUD();
          this.showToast(this.t(`🧭 Guiding to: ${dLandmark} — ${dHint}`, `🧭 正在指引前往：${dLandmark}（${dHint}）`));
        });
      }
      deedsListEl.appendChild(item);
    });

    // Also list the 7-Buddha Bow Quest items (+10 VP each)
    const bowedCount = this.getBowedBuddhaCount();
    const bowProgressEl = document.getElementById('buddha-bow-quest-progress');
    if (bowProgressEl) {
      bowProgressEl.textContent =
        bowedCount >= 7
          ? this.t('✅ All 7 Buddhas Bowed! (+70 VP)', '✅ 已圆满礼拜七尊古佛！(+70 功德)')
          : this.t(`Bowed: ${bowedCount} / 7 Buddhas (+10 VP ea)`, `已礼拜：${bowedCount} / 7 尊古佛（每尊 +10 功德）`);
    }

    (window.GAME_DATA.SEVEN_BUDDHAS || []).forEach((b, idx) => {
      const isBowed = !!(this.state.bowedBuddhas && this.state.bowedBuddhas[idx]);
      const displayNumName = `${idx + 1}. ${this.isZh() ? (b.cnName || b.name) : b.name}`;
      const bItem = document.createElement('div');
      bItem.className = `deed-item ${isBowed ? 'done' : ''}`;
      bItem.innerHTML = `
        <div class="deed-info">
          <div class="deed-emoji">🙏</div>
          <div class="deed-text">
            <h4>${this.t(`Bow: ${displayNumName}`, `礼拜：${displayNumName}`)}</h4>
          </div>
        </div>
        <button class="deed-action-btn">${isBowed ? '✓' : this.t('+10 VP', '+10 功德')}</button>
      `;
      bItem.addEventListener('click', () => {
        this.bowToSpecificBuddhaQuest(idx);
      });
      deedsListEl.appendChild(bItem);
    });

    // Mount Wutai Mountaintop Side-Quest Items
    const circledWutai = this.getCircledStupaCount();
    const stupasItem = document.createElement('div');
    stupasItem.className = `deed-item ${circledWutai >= 7 ? 'done' : ''}`;
    stupasItem.innerHTML = `
      <div class="deed-info">
        <div class="deed-emoji">☸️</div>
        <div class="deed-text"><h4>${this.t(`Circle 7 White Stupas (${circledWutai}/7)`, `顺绕七座白塔 (${circledWutai}/7)`)}</h4></div>
      </div>
      <button class="deed-action-btn">${circledWutai >= 7 ? '✓' : this.t('Go', '前往')}</button>
    `;
    stupasItem.addEventListener('click', () => {
      const sp = document.getElementById('side-panel');
      if (sp) sp.classList.add('collapsed');
      const btn = document.getElementById('tab-stupa');
      if (btn) btn.click();
    });
    deedsListEl.appendChild(stupasItem);

    const manjushriItem = document.createElement('div');
    manjushriItem.className = `deed-item ${this.state.bowedManjushri ? 'done' : ''}`;
    manjushriItem.innerHTML = `
      <div class="deed-info">
        <div class="deed-emoji">🦁</div>
        <div class="deed-text"><h4>${this.t('Bow to Manjushri (Summit)', '礼敬文殊菩萨 (山顶文殊殿)')}</h4></div>
      </div>
      <button class="deed-action-btn">${this.state.bowedManjushri ? '✓' : this.t('+10 VP', '+10 功德')}</button>
    `;
    manjushriItem.addEventListener('click', () => {
      this.bowToManjushriQuest();
    });
    deedsListEl.appendChild(manjushriItem);

    // West Longevity Corridor & 长寿殿 Quests
    const gardensTotal = (window.GAME_DATA.CHANGSHOU_FLOWER_GARDENS || []).length || 3;
    const plantedGardenCount = Object.values(this.state.plantedFlowerGardens || {}).filter(Boolean).length;
    const gardenItem = document.createElement('div');
    gardenItem.className = `deed-item ${plantedGardenCount >= gardensTotal ? 'done' : ''}`;
    gardenItem.innerHTML = `
      <div class="deed-info">
        <div class="deed-emoji">🌸</div>
        <div class="deed-text"><h4>${this.t(`Plant West Flower Gardens (${plantedGardenCount}/${gardensTotal})`, `西苑百花园植花 (${plantedGardenCount}/${gardensTotal})`)}</h4></div>
      </div>
      <button class="deed-action-btn">${plantedGardenCount >= gardensTotal ? '✓' : this.t('Go', '前往')}</button>
    `;
    gardenItem.addEventListener('click', () => {
      const sp = document.getElementById('side-panel');
      if (sp) sp.classList.add('collapsed');
      const nextGarden = (window.GAME_DATA.CHANGSHOU_FLOWER_GARDENS || []).find(
        (g) => !(this.state.plantedFlowerGardens && this.state.plantedFlowerGardens[g.id])
      ) || (window.GAME_DATA.CHANGSHOU_FLOWER_GARDENS || [])[0];
      if (nextGarden) {
        const gy = window.GAME_DATA.getTerrainHeight(nextGarden.x, 2.8);
        this.walkToAndTrigger(new THREE.Vector3(nextGarden.x, gy, 2.8), () => {
          this.plantFlowerGarden(nextGarden.id);
        });
      }
    });
    deedsListEl.appendChild(gardenItem);

    const pondsTotal = (window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || []).length || 4;
    const plantedPondCount = Object.values(this.state.plantedLotusPonds || {}).filter(Boolean).length;
    const pondItem = document.createElement('div');
    pondItem.className = `deed-item ${plantedPondCount >= pondsTotal ? 'done' : ''}`;
    pondItem.innerHTML = `
      <div class="deed-info">
        <div class="deed-emoji">🪷</div>
        <div class="deed-text"><h4>${this.t(`Plant 4 Sacred Flower Ponds (${plantedPondCount}/${pondsTotal})`, `四座圣花池植花 (${plantedPondCount}/${pondsTotal})`)}</h4></div>
      </div>
      <button class="deed-action-btn">${plantedPondCount >= pondsTotal ? '✓' : this.t('Go', '前往')}</button>
    `;
    pondItem.addEventListener('click', () => {
      const sp = document.getElementById('side-panel');
      if (sp) sp.classList.add('collapsed');
      const nextPond = (window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || []).find(
        (p) => !(this.state.plantedLotusPonds && this.state.plantedLotusPonds[p.id])
      ) || (window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || [])[0];
      if (nextPond) {
        const py = window.GAME_DATA.getTerrainHeight(nextPond.x, 2.8);
        this.walkToAndTrigger(new THREE.Vector3(nextPond.x, py, 2.8), () => {
          this.plantLotusPond(nextPond.id);
        });
      }
    });
    deedsListEl.appendChild(pondItem);

    const changshouItem = document.createElement('div');
    changshouItem.className = `deed-item ${this.state.bowedChangshou ? 'done' : ''}`;
    changshouItem.innerHTML = `
      <div class="deed-info">
        <div class="deed-emoji">🏺</div>
        <div class="deed-text"><h4>${this.t('Bow to Amitayus (长寿殿)', '礼敬长寿佛（西苑长寿殿）')}</h4></div>
      </div>
      <button class="deed-action-btn">${this.state.bowedChangshou ? '✓' : this.t('+10 VP', '+10 功德')}</button>
    `;
    changshouItem.addEventListener('click', () => {
      this.bowToChangshouQuest();
    });
    deedsListEl.appendChild(changshouItem);

    // Offerings Status
    const offerSrc = this.isInsideWenshuHall()
      ? (this.state.wenshuOfferings || {})
      : this.isInsideChangshouHall()
        ? (this.state.changshouOfferings || {})
        : this.state.offeringsMade;
    ['water', 'flower', 'scent'].forEach((type) => {
      const pill = document.querySelector(`.offering-pill[data-offering="${type}"]`);
      if (pill) {
        pill.classList.toggle('offered', !!offerSrc[type]);
      }
    });

    // 'Nanmo Amitofo' Prayer Skill (Skill #1 · Shortcut [L] · 100x Sky Vision)
    const count = this.state.amitofoCount || 0;
    const cycleCount = count > 0 && count % 100 === 0 ? 100 : count % 100;
    const isAmitofoUnlocked = this.isPrayerSkillUnlocked('amitofo');
    const activePrayerId = this.getActivePrayerSkillId();
    const chantingNow = !!this._isPrayerChanting;
    const chantingId = this._activeChantingSkillId;

    const skillBox = document.getElementById('skill-status-box');
    const skillBadge = document.getElementById('skill-unlock-badge');
    const skillBtn = document.getElementById('btn-skill-amitofo');
    const matSkillBtn = document.getElementById('mat-btn-amitofo');
    const skillLabel = document.getElementById('skill-progress-label');
    const dockAmitofoBtn = document.getElementById('dock-btn-amitofo');
    const dockAmitofoCount = document.getElementById('dock-amitofo-count');

    if (skillBox) skillBox.classList.toggle('unlocked', isAmitofoUnlocked);
    if (skillBadge) {
      skillBadge.textContent = isAmitofoUnlocked
        ? (activePrayerId === 'amitofo'
          ? this.t('🌟 Active [Key L]', '🌟 当前快捷键 [L]')
          : this.t('🌟 Unlocked · Skill 1', '🌟 已解锁 · 第一技能'))
        : this.t('🔒 100 VP Unlock', '🔒 100功德解锁');
    }
    if (skillBtn) {
      skillBtn.disabled = chantingNow;
      skillBtn.textContent = chantingNow && chantingId === 'amitofo'
        ? this.t('🔊 Pronouncing...', '🔊 正在念诵…')
        : isAmitofoUnlocked
          ? this.t(`🪷 Nanmo Amitofo (${cycleCount}/100)`, `🪷 南无阿弥陀佛 (${cycleCount}/100)`)
          : this.t(`🙏 Pray Nanmo Amitofo (${cycleCount}/100)`, `🙏 念诵南无阿弥陀佛 (${cycleCount}/100)`);
    }
    if (matSkillBtn) {
      matSkillBtn.disabled = chantingNow;
      const isPhoneView = window.innerWidth <= 768;
      if (chantingNow) {
        matSkillBtn.textContent = this.t('🔊Chanting', '🔊念诵中');
      } else if (activePrayerId === 'wenshu') {
        matSkillBtn.textContent = isPhoneView
          ? this.t('🦁Mantra', '🦁文殊咒')
          : this.t(`🦁 Mantra [L] (${this.state.wenshuMantraCount || 0})`, `🦁 文殊心咒 [L] (${this.state.wenshuMantraCount || 0})`);
      } else if (activePrayerId === 'changshou') {
        matSkillBtn.textContent = isPhoneView
          ? this.t('🏺Pray', '🏺长寿咒')
          : this.t(`🏺 Longv [L] (${this.state.changshouPrayerCount || 0})`, `🏺 长寿咒 [L] (${this.state.changshouPrayerCount || 0})`);
      } else {
        matSkillBtn.textContent = isPhoneView
          ? this.t('📿Pray', '📿念佛')
          : this.t(`✨ Pray [L] (${cycleCount}/100)`, `✨ 念佛 [L] (${cycleCount}/100)`);
      }
    }
    if (skillLabel) {
      skillLabel.textContent = isAmitofoUnlocked
        ? this.t(
          `⌨️ Press [L] to chant when equipped · Total: ${count}`,
          `⌨️ 设为当前技能后按 [L] 发声念诵（总计: ${count} 声）`
        )
        : this.t(
          `✨ Reach 100 VP to unlock [L] (Total: ${count})`,
          `✨ 满100功德解锁 [L] 快捷键 (总计: ${count} 声)`
        );
    }
    if (dockAmitofoBtn) {
      const iconSpan = dockAmitofoBtn.querySelector('span');
      const labelEl = dockAmitofoBtn.querySelector('small');
      if (iconSpan) {
        iconSpan.textContent = activePrayerId === 'wenshu' ? '🦁' : activePrayerId === 'changshou' ? '🏺' : '🪷';
      }
      if (labelEl) {
        if (chantingNow) {
          labelEl.innerHTML = `${this.t('Chanting…', '念诵中…')}<span id="dock-amitofo-count" style="display:none;">${cycleCount}</span>`;
        } else if (activePrayerId === 'wenshu') {
          const wC = this.state.wenshuMantraCount || 0;
          labelEl.innerHTML = `${this.t('Mantra[L]', '文殊[L]')} <span id="dock-amitofo-count">${wC}</span>`;
        } else if (activePrayerId === 'changshou') {
          const cC = this.state.changshouPrayerCount || 0;
          labelEl.innerHTML = `${this.t('Longv[L]', '长寿[L]')} <span id="dock-amitofo-count">${cC}</span>`;
        } else {
          labelEl.innerHTML = `${this.t('Pray[L]', '念佛[L]')} <span id="dock-amitofo-count">${cycleCount}</span>/100`;
        }
      }
    } else if (dockAmitofoCount) {
      dockAmitofoCount.textContent = String(cycleCount);
    }

    // Extra Prayer Skills (#2 文殊心咒, #3 长寿祈愿咒) inside Right Sanctuary Drawer + Quick [L] Switch
    const extraSkillsEl = document.getElementById('right-extra-skills-container');
    if (extraSkillsEl) {
      const wUnlocked = !!this.state.bowedManjushri;
      const wCnt = this.state.wenshuMantraCount || 0;
      const cUnlocked = !!this.state.bowedChangshou;
      const cCnt = this.state.changshouPrayerCount || 0;
      extraSkillsEl.innerHTML = `
        ${isAmitofoUnlocked && activePrayerId !== 'amitofo' ? `
          <button type="button" id="btn-equip-amitofo" class="hud-btn" style="width:100%; justify-content:center; font-size:11px; padding:4px 8px;">
            🔄 ${this.t('Switch [L] to Nanmo Amitofo', '切换快捷键 [L] 为「南无阿弥陀佛」')}
          </button>
        ` : ''}
        <div class="skill-status-box ${wUnlocked ? 'unlocked' : ''}" style="padding:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:12px; font-weight:900; color:#7a1c1c;">🦁 ${this.t('2. 文殊心咒', '2. 文殊心咒')}</span>
            <span class="skill-badge">${wUnlocked ? (activePrayerId === 'wenshu' ? this.t('🌟 Key [L]', '🌟 当前 [L]') : this.t('🌟 Unlocked', '🌟 已解锁')) : this.t('🔒 Bow Manjushri', '🔒 礼敬文殊解锁')}</span>
          </div>
          <div style="font-size:10.5px; color:#5b3416; line-height:1.35; margin-bottom:5px;">
            Om A Ra Pa Ca Na Dhih<br>嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）
          </div>
          <div style="display:flex; gap:5px;">
            <button type="button" id="btn-skill-wenshu" class="secondary-btn" ${chantingNow && wUnlocked ? 'disabled' : ''} style="flex:1; font-size:11.5px; padding:6px 6px;">
              ${wUnlocked
                ? (chantingNow && chantingId === 'wenshu' ? this.t('🔊 Pronouncing...', '🔊 正在持诵…') : this.t(`🔊 Chant (${wCnt})`, `🔊 持诵 (${wCnt})`))
                : this.t('🔒 Go to 文殊殿', '🔒 前往文殊殿')}
            </button>
            ${wUnlocked && activePrayerId !== 'wenshu' ? `<button type="button" id="btn-equip-wenshu" class="hud-btn" style="font-size:11px; padding:5px 7px;">[L]</button>` : ''}
          </div>
        </div>
        <div class="skill-status-box ${cUnlocked ? 'unlocked' : ''}" style="padding:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:12px; font-weight:900; color:#7a1c1c;">🏺 ${this.t('3. 长寿佛心咒', '3. 长寿佛心咒')}</span>
            <span class="skill-badge">${cUnlocked ? (activePrayerId === 'changshou' ? this.t('🌟 Key [L]', '🌟 当前 [L]') : this.t('🌟 Unlocked', '🌟 已解锁')) : this.t('🔒 Bow 长寿佛', '🔒 礼敬长寿佛解锁')}</span>
          </div>
          <div style="font-size:10.5px; color:#5b3416; line-height:1.35; margin-bottom:5px;">
            嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈<br>
            ${this.t('Benefit: 善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。', '利益：善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。')}
          </div>
          <div style="display:flex; gap:5px;">
            <button type="button" id="btn-skill-changshou" class="secondary-btn" ${chantingNow && cUnlocked ? 'disabled' : ''} style="flex:1; font-size:11.5px; padding:6px 6px;">
              ${cUnlocked
                ? (chantingNow && chantingId === 'changshou' ? this.t('🔊 Pronouncing...', '🔊 正在祈愿…') : this.t(`🔊 Chant (${cCnt})`, `🔊 持诵 (${cCnt})`))
                : this.t('🔒 Go to 长寿殿', '🔒 前往长寿殿')}
            </button>
            ${cUnlocked && activePrayerId !== 'changshou' ? `<button type="button" id="btn-equip-changshou" class="hud-btn" style="font-size:11px; padding:5px 7px;">[L]</button>` : ''}
          </div>
        </div>
      `;
      const eqA = document.getElementById('btn-equip-amitofo');
      if (eqA) eqA.addEventListener('click', () => this.setActivePrayerSkill('amitofo'));
      const eqW = document.getElementById('btn-equip-wenshu');
      if (eqW) eqW.addEventListener('click', () => this.setActivePrayerSkill('wenshu'));
      const eqC = document.getElementById('btn-equip-changshou');
      if (eqC) eqC.addEventListener('click', () => this.setActivePrayerSkill('changshou'));

      const btnW = document.getElementById('btn-skill-wenshu');
      if (btnW) {
        btnW.addEventListener('click', () => {
          if (this.state.bowedManjushri) this.castWenshuMantra();
          else this.teleportToWenshuHallInterior();
        });
      }
      const btnC = document.getElementById('btn-skill-changshou');
      if (btnC) {
        btnC.addEventListener('click', () => {
          if (this.state.bowedChangshou) this.castChangshouPrayer();
          else this.teleportToChangshouHallInterior();
        });
      }
    }
  }

  // -------------------- FLOATING 3D LABELS & FX --------------------
  addWorldLabel(text, pos3D, sceneFilter, onClick, zhText = null) {
    const container = document.getElementById('world-labels');
    const el = document.createElement('div');
    el.className = 'world-label';
    el.innerHTML = zhText ? this.t(text, zhText) : text;
    if (zhText) {
      this.bilingualLabels.push({ el, enText: text, zhText });
    }
    if (onClick) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
    }
    container.appendChild(el);
    this.worldLabelItems.push({ el, pos3D, sceneFilter });
    return el;
  }

  updateWorldLabels() {
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    const pPos = this.playerGroup.position;
    const playerInCourtyard = pPos.z > 2.0;

    this.worldLabelItems.forEach((item) => {
      if (item.sceneFilter !== this.currentScene) {
        item.el.style.display = 'none';
        return;
      }
      // Hide interior Prayer Hall labels when outside in courtyard
      if (
        this.currentScene === 'public_temple' &&
        playerInCourtyard &&
        Math.abs(item.pos3D.x) < 17.5 &&
        item.pos3D.z < -2
      ) {
        item.el.style.display = 'none';
        return;
      }
      // Only surface location markers when the character approaches (Wish ribbons on the Bodhi Tree stay visible up to 34m!)
      const maxVisibleDist = item.maxDist || 15.0;
      const horizDist = Math.hypot(pPos.x - item.pos3D.x, pPos.z - item.pos3D.z);
      if (horizDist > maxVisibleDist) {
        item.el.style.display = 'none';
        return;
      }
      const v = item.pos3D.clone().project(this.camera);
      if (v.z > 1) {
        item.el.style.display = 'none';
        return;
      }
      item.el.style.display = 'block';
      const x = v.x * halfW + halfW;
      const y = -v.y * halfH + halfH;
      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
    });
  }

  spawnFloatingText(text, worldPos) {
    const layer = document.getElementById('floating-fx-layer');
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;

    const v = worldPos.clone().project(this.camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    layer.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  showToast(msg) {
    const banner = document.getElementById('toast-banner');
    banner.textContent = msg;
    banner.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => banner.classList.remove('show'), 4500);
  }

  // -------------------- MAIN GAME LOOP --------------------
  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.updatePlayerMovement(dt, elapsed);
    this.updateDoorsAndAnimations(dt, elapsed);
    this.updateMultiplayer(dt, elapsed);
    this.updateCamera(dt);
    if (window.TempleModels3D && window.TempleModels3D.updateBillboards && this.camera) {
      window.TempleModels3D.updateBillboards(this.camera);
    }
    this.updateWorldLabels();
    this.checkProximityPrompt();

    this.renderer.render(this.scene, this.camera);
  }

  applySeatedMeditationPose(elapsed, palmsPressed = false) {
    if (!this.charParts) return;
    if (this.charParts.rippleGroup) {
      this.charParts.rippleGroup.visible = true;
      const s = 1 + Math.sin(elapsed * 2.2) * 0.04;
      this.charParts.rippleGroup.scale.set(s, 1, s);
    }
    if (this.charParts.meditationRing && this.isSeatedOnMat) {
      this.charParts.meditationRing.material.opacity = 0.85;
    }
    if (this.charParts.leftLeg && this.charParts.rightLeg) {
      this.charParts.leftLeg.position.set(-0.16, 0.16, 0.08);
      this.charParts.rightLeg.position.set(0.16, 0.16, 0.08);
      this.charParts.leftLeg.rotation.set(-1.42, 0.52, 0.48);
      this.charParts.rightLeg.rotation.set(-1.42, -0.52, -0.48);
    }
    if (this.charParts.lowerBody) this.charParts.lowerBody.position.y = -0.24;
    if (this.charParts.upperBody) this.charParts.upperBody.position.y = 0.50 + Math.sin(elapsed * 1.8) * 0.012;
    if (this.charParts.robeSkirt) this.charParts.robeSkirt.scale.set(1.32, 0.65, 1.32);
    if (this.charParts.bodyPivot) this.charParts.bodyPivot.position.y = 0;
    if (this.charParts.leftArm && this.charParts.rightArm) {
      if (palmsPressed) {
        this.charParts.leftArm.rotation.set(-1.12, 0.35, -0.45);
        this.charParts.rightArm.rotation.set(-1.12, -0.35, 0.45);
      } else {
        // Serene Meditation Mudra (Dhyana / 禅定印) resting in the lap
        this.charParts.leftArm.rotation.set(-0.88, 0.48, -0.56);
        this.charParts.rightArm.rotation.set(-0.88, -0.48, 0.56);
      }
    }
  }

  updatePlayerMovement(dt, elapsed) {
    if (this.isSeatedOnMat) {
      this.applySeatedMeditationPose(elapsed, this.isBowing25 || this.bowAnimTimer > 0 || this.poseMode === 'palms');
      if (this.isBowing25) {
        const bowCycleDur = 1.70; // Slow, peaceful, reverent bow pace (~1.7 seconds per bow)
        if (this.bow25CycleTimer <= 0) {
          if (this.bow25Current < this.bow25Total) {
            this.bow25Current += 1;
            this.bow25CycleTimer = bowCycleDur;
            window.templeAudio.playBowingBell();

            // Game Designer Recommendation #2: Spotlight each of the 7 Buddhas in turn during the 25 Bows
            // and display that Buddha's Name, Wish, and Benefit of Bowing!
            const buddhas = window.GAME_DATA.SEVEN_BUDDHAS || [];
            const bIdx = Math.min(buddhas.length - 1, Math.floor((this.bow25Current - 1) / 3.6));
            const curBuddha = buddhas[bIdx];

            if (curBuddha) {
              if (this.buddhaSpotlight && this.buddhaStatues[bIdx]) {
                const bx = this.buddhaStatues[bIdx].bx;
                this.buddhaSpotlight.position.set(bx, 4.4, 0.6);
                this.buddhaSpotlight.visible = true;
              }
              const blessingBanner = document.getElementById('bow-blessing-banner');
              if (blessingBanner) {
                const summary = this.dField(curBuddha, 'wishAndBenefit', 'zhWishAndBenefit')
                  || this.dField(curBuddha, 'buddhaWish', 'zhBuddhaWish');
                const bName = this.dField(curBuddha, 'name', 'cnName');
                blessingBanner.style.display = 'flex';
                blessingBanner.innerHTML = `
                  <div class="bow-buddha-header">
                    <span>${this.t(`🔔 Bow ${this.bow25Current} / ${this.bow25Total}`, `🔔 第 ${this.bow25Current} / ${this.bow25Total} 拜`)} — ${bIdx + 1}. ${bName}</span>
                    <span>${this.t('🙏 Blessing', '🙏 佛愿加持')}</span>
                  </div>
                  <div class="bow-buddha-benefit">✨ ${summary}</div>
                `;
              }
            }

            const statusEl = document.getElementById('hall-status-text');
            if (statusEl) {
              statusEl.textContent = this.t(
                `🔔 Reverent Bowing to the 7 Buddhas: Bow ${this.bow25Current} / ${this.bow25Total}`,
                `🔔 至诚礼拜过去七佛：第 ${this.bow25Current} / ${this.bow25Total} 拜`
              );
            }
            const bowBtn = document.getElementById('btn-hall-bow25');
            if (bowBtn) {
              bowBtn.textContent = this.t(`2. 🔔 Bow (${this.bow25Current}/25)`, `2. 🔔 礼佛 (${this.bow25Current}/25)`);
            }
            this.spawnFloatingText(
              this.t(`🔔 Bow ${this.bow25Current} / 25`, `🔔 礼拜第 ${this.bow25Current} / 25 拜`),
              this.playerGroup.position.clone().add(new THREE.Vector3(0, 2.5, 0))
            );
          } else {
            this.isBowing25 = false;
            this.state.completedBow25 = true;
            this.saveState();
            if (this.charParts.upperBody) {
              this.charParts.upperBody.rotation.x = 0;
            }
            if (this.buddhaSpotlight) {
              this.buddhaSpotlight.visible = false;
            }
            const statusEl = document.getElementById('hall-status-text');
            if (statusEl) {
              statusEl.textContent = this.t('🙏 Completed all 25 Bows to the 7 Buddhas! (+10 VP)', '🙏 至诚礼拜七佛二十五拜圆满！(+10 功德)');
            }
            const bowBtn = document.getElementById('btn-hall-bow25');
            if (bowBtn) {
              bowBtn.textContent = this.t('2. 🙏 Bow 25x', '2. 🙏 礼佛25拜');
            }
            window.templeAudio.playGoodDeedChime();
            this.addVirtuePoints(
              10,
              this.t('🙏 Completed 25 Bows +10 VP!', '🙏 二十五拜圆满 +10 功德!'),
              this.playerGroup.position.clone().add(new THREE.Vector3(0, 2.9, 0))
            );
            this.showToast(this.t('🙏🎖️ You completed all 25 Bows to the 7 Buddhas! (+10 VP)', '🙏🎖️ 至诚礼拜过去七佛二十五拜圆满！(+10 功德)'));
          }
        } else {
          this.bow25CycleTimer -= dt;
          const progress = 1 - Math.max(0, this.bow25CycleTimer) / bowCycleDur;
          const bowAngle = Math.sin(progress * Math.PI) * 1.18;
          if (this.charParts.upperBody) {
            this.charParts.upperBody.rotation.x = Math.max(0, bowAngle);
          }
        }
      } else if (this.bowAnimTimer > 0) {
        this.bowAnimTimer -= dt;
        const progress = 1 - Math.max(0, this.bowAnimTimer) / 2.0;
        const bowAngle = Math.sin(progress * Math.PI) * 1.15;
        if (this.charParts.upperBody) {
          this.charParts.upperBody.rotation.x = Math.max(0, bowAngle);
        }
      } else if (this.charParts.upperBody) {
        this.charParts.upperBody.rotation.x = Math.sin(elapsed * 2) * 0.04;
      }
      return;
    }

    if (this.breathCooldown > 0) this.breathCooldown = Math.max(0, this.breathCooldown - dt);
    if (this.slowDebuffTimer > 0) this.slowDebuffTimer = Math.max(0, this.slowDebuffTimer - dt);

    let moveX = this.dpadVec.x;
    let moveZ = this.dpadVec.z;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const baseSpeed = this.slowDebuffTimer > 0 ? 3.8 : 6.8;
    const speed = isSprinting ? baseSpeed * 1.65 : baseSpeed;
    let isMoving = false;

    // Stand up smoothly if player taps movement while seated or holding a meditation pose
    if ((moveX !== 0 || moveZ !== 0) && (this.poseMode === 'sit' || this.seatedScenic)) {
      this.toggleSitScenicSpot(this.seatedScenic || null, false);
    }

    // Guided Clockwise Stupa Circumambulation Mode
    if (this.isAutoCirclingStupa && this.currentScene === 'public_temple') {
      const orbitRadius = 2.45;
      const angularSpeed = 1.65; // radians/sec (clockwise = increasing theta)
      const stepAngle = Math.min(this.autoStupaRemainingAngle, angularSpeed * dt);
      this.autoStupaCurrentAngle += stepAngle;
      this.autoStupaRemainingAngle -= stepAngle;

      const nextX = this.stupaPos.x + Math.cos(this.autoStupaCurrentAngle) * orbitRadius;
      const nextZ = this.stupaPos.z + Math.sin(this.autoStupaCurrentAngle) * orbitRadius;
      const dx = nextX - this.playerGroup.position.x;
      const dz = nextZ - this.playerGroup.position.z;

      this.tryMovePlayer(dx, dz);
      // Face along clockwise tangent (-sin(theta), cos(theta))
      const tanX = -Math.sin(this.autoStupaCurrentAngle);
      const tanZ = Math.cos(this.autoStupaCurrentAngle);
      this.playerGroup.rotation.y = Math.atan2(tanX, tanZ);
      isMoving = true;

      if (this.autoStupaRemainingAngle <= 0.001) {
        this.isAutoCirclingStupa = false;
      }
    } else if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      const sin = Math.sin(this.cameraAngle);
      const cos = Math.cos(this.cameraAngle);
      const worldDX = moveX * cos + moveZ * sin;
      const worldDZ = -moveX * sin + moveZ * cos;

      this.tryMovePlayer(worldDX * speed * dt, worldDZ * speed * dt);
      isMoving = true;
    } else if (this.walkTarget) {
      const diff = new THREE.Vector3().subVectors(this.walkTarget, this.playerGroup.position);
      diff.y = 0;
      const dist = diff.length();
      if (dist < 0.55) {
        if (this.walkWaypoints && this.walkWaypoints.length > 0) {
          this.walkTarget = this.walkWaypoints.shift();
        } else {
          this.walkTarget = null;
          if (this.walkCallback) {
            const cb = this.walkCallback;
            this.walkCallback = null;
            cb();
          }
        }
      } else {
        diff.normalize();
        this.tryMovePlayer(diff.x * speed * dt, diff.z * speed * dt);
        isMoving = true;
      }
    }

    // 3D Vertical Jump & Gravity Physics + Terrain/Bridge Surface Tracking (Roblox-style feel!)
    const px = this.playerGroup.position.x;
    const pz = this.playerGroup.position.z;
    const groundY =
      this.currentScene === 'public_temple'
        ? window.GAME_DATA.getSurfaceHeightAt(px, pz)
        : 0;

    if (!this.isGrounded || this.playerVelY > 0 || this.playerGroup.position.y > groundY + 0.04) {
      this.playerVelY -= 26.5 * dt;
      this.playerGroup.position.y += this.playerVelY * dt;
      if (this.playerGroup.position.y <= groundY) {
        this.playerGroup.position.y = groundY;
        this.playerVelY = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerGroup.position.y = groundY;
      this.playerVelY = 0;
      this.isGrounded = true;
    }

    this._lastIsMoving = !!isMoving;

    // Water splash shimmer when walking/wading along the mountain river!
    if (isMoving && this.isGrounded && this.currentScene === 'public_temple' && pz > 16.5 && pz < 112) {
      const rcx = window.GAME_DATA.getRiverCenterX(pz);
      const rhw = window.GAME_DATA.getRiverHalfWidth(pz);
      if (Math.abs(px - rcx) < rhw) {
        this._splashTimer = (this._splashTimer || 0) + dt;
        if (this._splashTimer >= 0.22) {
          this._splashTimer = 0;
          const ripple = new THREE.Mesh(
            new THREE.RingGeometry(0.18, 0.32, 16),
            new THREE.MeshBasicMaterial({ color: 0xe0f7ff, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
          );
          ripple.rotation.x = -Math.PI / 2;
          ripple.position.set(px, groundY + 0.18, pz);
          this.publicTempleGroup.add(ripple);
          this.lotusFootprints.push({ mesh: ripple, age: 0.8 });
        }
      }
    }

    // Game Designer Recommendation #1: Golden Lotus Footprints (步步生莲) behind the walking player!
    if (isMoving && this.isGrounded) {
      this._footprintTimer += dt;
      if (this._footprintTimer >= 0.28) {
        this._footprintTimer = 0;
        this.dropLotusFootprint();
      }
    }

    const isSitting = this.poseMode === 'sit' || !!this.seatedScenic || this.isSeatedOnMat;
    if (isSitting) {
      this.applySeatedMeditationPose(elapsed, this.poseMode === 'palms' || this.bowAnimTimer > 0);
    } else {
      if (this.charParts.rippleGroup) this.charParts.rippleGroup.visible = false;
      if (this.charParts.leftLeg && this.charParts.rightLeg) {
        this.charParts.leftLeg.position.set(-0.13, 0.18, 0);
        this.charParts.rightLeg.position.set(0.13, 0.18, 0);
        if (this.charParts.lowerBody) this.charParts.lowerBody.position.y = 0;
        if (this.charParts.upperBody) this.charParts.upperBody.position.y = 0.78;
        if (this.charParts.robeSkirt) this.charParts.robeSkirt.scale.set(1, 1, 1);

        if (!this.isGrounded) {
          this.charParts.leftLeg.rotation.set(0.45, 0, 0);
          this.charParts.rightLeg.rotation.set(-0.35, 0, 0);
          this.charParts.bodyPivot.position.y = 0.05;
        } else if (isMoving) {
          const animSpeed = isSprinting ? 14 : 9.2;
          this.charParts.leftLeg.rotation.set(Math.sin(elapsed * animSpeed) * 0.42, 0, 0);
          this.charParts.rightLeg.rotation.set(-Math.sin(elapsed * animSpeed) * 0.42, 0, 0);
          this.charParts.bodyPivot.position.y = Math.abs(Math.sin(elapsed * animSpeed)) * 0.055;
        } else {
          this.charParts.leftLeg.rotation.set(0, 0, 0);
          this.charParts.rightLeg.rotation.set(0, 0, 0);
          this.charParts.bodyPivot.position.y = Math.sin(elapsed * 1.8) * 0.012;
        }
      }

      // Smooth Sansa-style arm swing & palms-pressed (Anjali) posture
      if (this.charParts.leftArm && this.charParts.rightArm) {
        if (this.poseMode === 'palms' || this.bowAnimTimer > 0) {
          this.charParts.leftArm.rotation.set(-1.12, 0.35, -0.45);
          this.charParts.rightArm.rotation.set(-1.12, -0.35, 0.45);
        } else if (isMoving) {
          const animSpeed = isSprinting ? 14 : 9.2;
          this.charParts.leftArm.rotation.set(-Math.sin(elapsed * animSpeed) * 0.36, 0, -0.12);
          this.charParts.rightArm.rotation.set(Math.sin(elapsed * animSpeed) * 0.36, 0, 0.12);
        } else {
          this.charParts.leftArm.rotation.set(Math.sin(elapsed * 1.5) * 0.04, 0, -0.12);
          this.charParts.rightArm.rotation.set(-Math.sin(elapsed * 1.5) * 0.04, 0, 0.12);
        }
      }
    }

    if (this.bowAnimTimer > 0 && this.charParts.upperBody) {
      this.bowAnimTimer -= dt;
      const bowAngle = Math.sin(Math.max(0, 1 - this.bowAnimTimer / 1.8) * Math.PI) * 0.85;
      this.charParts.upperBody.rotation.x = Math.max(0, bowAngle);
    } else if (this.charParts.upperBody) {
      this.charParts.upperBody.rotation.x = isSitting ? Math.sin(elapsed * 1.4) * 0.025 : 0;
    }
  }

  tryMovePlayer(dx, dz) {
    const prevX = this.playerGroup.position.x;
    const prevZ = this.playerGroup.position.z;
    let nextX = prevX + dx;
    let nextZ = prevZ + dz;

    if (this.currentScene === 'public_temple') {
      // 1. 7 WHITE STUPAS CLOCKWISE-ONLY CONSTRAINT & 360° CIRCLE TRACKING (PATH TO 文殊殿)
      if (!this.isAutoCirclingStupa && this.stupaList && this.stupaList.length > 0) {
        let bestIdx = 0;
        let minSDist = Infinity;
        this.stupaList.forEach((st, idx) => {
          const d = Math.hypot(prevX - st.pos.x, prevZ - st.pos.z);
          if (d < minSDist) {
            minSDist = d;
            bestIdx = idx;
          }
        });
        if (minSDist < 6.0) {
          this.activeStupaIdx = bestIdx;
          this.stupaPos.copy(this.stupaList[bestIdx].pos);
        }
      }

      const rx = nextX - this.stupaPos.x;
      const rz = nextZ - this.stupaPos.z;
      const distToStupa = Math.hypot(rx, rz);

      const prevRX = prevX - this.stupaPos.x;
      const prevRZ = prevZ - this.stupaPos.z;
      const prevDist = Math.hypot(prevRX, prevRZ) || 0.001;
      const solidR = 1.95;

      // When near any of the 7 White Stupas (dist < 4.5), enforce CLOCKWISE-ONLY movement on flat ground
      if (distToStupa < 4.5 || prevDist < 4.5) {
        // Clockwise unit tangent around Stupa: T_cw = (-rz/r, +rx/r)
        const cwTanX = -prevRZ / prevDist;
        const cwTanZ = prevRX / prevDist;
        const stepX = nextX - prevX;
        const stepZ = nextZ - prevZ;
        const cwDot = stepX * cwTanX + stepZ * cwTanZ;

        if (!this.isAutoCirclingStupa && cwDot < -0.003) {
          nextX = prevX;
          nextZ = prevZ;
          this.walkTarget = null;
          const now = performance.now();
          if (now - this._ccwWarnTime > 2200) {
            this._ccwWarnTime = now;
            this.showToast(`☸️ Near White Stupa #${this.activeStupaIdx + 1}, please walk CLOCKWISE!`);
          }
        } else if (!this.isAutoCirclingStupa && cwDot > 0.005 && prevDist < 4.0) {
          const moveMag = Math.hypot(stepX, stepZ);
          const curTheta = Math.atan2(prevRZ, prevRX);
          const targetR = 2.45;
          const newR = prevDist + (targetR - prevDist) * 0.18;
          const newTheta = curTheta + (moveMag / newR);
          nextX = this.stupaPos.x + Math.cos(newTheta) * newR;
          nextZ = this.stupaPos.z + Math.sin(newTheta) * newR;
        }

        // Solid Stupa Base Collision
        const updatedRX = nextX - this.stupaPos.x;
        const updatedRZ = nextZ - this.stupaPos.z;
        const updatedDist = Math.hypot(updatedRX, updatedRZ);
        if (updatedDist < solidR && updatedDist > 0.001) {
          nextX = this.stupaPos.x + (updatedRX / updatedDist) * solidR;
          nextZ = this.stupaPos.z + (updatedRZ / updatedDist) * solidR;
        }

        // Track Clockwise Angular Progress ONE BY ONE (1 circle per Stupa -> 7 total to open 文殊殿)
        const finalRX = nextX - this.stupaPos.x;
        const finalRZ = nextZ - this.stupaPos.z;
        const curAngle = Math.atan2(finalRZ, finalRX);
        if (this.lastStupaAngle !== null) {
          let dTheta = curAngle - this.lastStupaAngle;
          if (dTheta > Math.PI) dTheta -= Math.PI * 2;
          if (dTheta < -Math.PI) dTheta += Math.PI * 2;

          if (dTheta > 0) {
            const stIdx = this.activeStupaIdx || 0;
            const nextReqIdx = this.getNextUncircledStupaIdx();

            if (this.state.circledStupas && this.state.circledStupas[stIdx]) {
              // Already completed this Stupa — guide to the next one instead of recounting
              this.isAutoCirclingStupa = false;
              this.stupaClockwiseAngle = 0;
            } else if (nextReqIdx !== -1 && stIdx !== nextReqIdx) {
              // Out of order — remind player to circle one by one from 1 to 7
              this.isAutoCirclingStupa = false;
              this.stupaClockwiseAngle = 0;
              const nowWarn = performance.now();
              if (nowWarn - (this._stupaOrderWarnTime || 0) > 2400) {
                this._stupaOrderWarnTime = nowWarn;
                this.showToast(this.t(
                  `☸️ Please circle Stupa #${nextReqIdx + 1} first (one by one from 1 to 7)!`,
                  `☸️ 请按顺序依次绕行！请先绕行第 ${nextReqIdx + 1} 座白塔（1–7号）！`
                ));
              }
            } else if (nextReqIdx !== -1) {
              this.stupaClockwiseAngle += dTheta;
              if (this.stupaClockwiseAngle >= Math.PI * 2 - 0.04) {
                this.stupaClockwiseAngle = 0;
                this.isAutoCirclingStupa = false;
                if (!this.state.circledStupas) this.state.circledStupas = {};
                this.state.circledStupas[stIdx] = true;
                this.state.stupaLaps = this.getCircledStupaCount();

                const spData = (window.GAME_DATA.WENSHU_STUPAS || [])[stIdx] || {
                  name: `White Stupa #${stIdx + 1}`,
                  zhName: `第 ${stIdx + 1} 尊白塔`,
                  wishAndBenefit: 'Brings pure wisdom and gentle peace to your heart.',
                  zhWishAndBenefit: '愿得清净智慧与内心祥和安宁。'
                };
                const spLabel = this.dField(spData, 'label', 'zhLabel') || this.dField(spData, 'name', 'zhName');
                const spName = this.dField(spData, 'name', 'zhName');
                const spBenefit = this.dField(spData, 'wishAndBenefit', 'zhWishAndBenefit');
                if (this.stupaLabels && this.stupaLabels[stIdx]) {
                  this.stupaLabels[stIdx].innerHTML = `✅ ${spLabel}`;
                  this.stupaLabels[stIdx].classList.add('completed');
                }

                const circledTotal = this.getCircledStupaCount();
                const prevUnlockedWenshu = !!this.state.wenshuHallUnlocked;
                if (circledTotal >= 7) this.state.wenshuHallUnlocked = true;

                window.templeAudio.playOfferingSound();
                this.addVirtuePoints(
                  5,
                  `☸️ ${spName} ${this.t('Complete!', '圆满!')}`,
                  new THREE.Vector3(this.stupaPos.x, this.stupaPos.y + 4.8, this.stupaPos.z)
                );

                // Display Concise Wish & Benefit Banner for the Circled Stupa!
                const bannerEl = document.getElementById('bow-blessing-banner');
                if (bannerEl) {
                  bannerEl.style.display = 'flex';
                  bannerEl.innerHTML = `
                    <div class="bow-buddha-icon">☸️</div>
                    <div class="bow-buddha-text">
                      <div class="bow-buddha-header">✅ ${spName} (${circledTotal} / 7 ${this.t('Complete', '圆满')})</div>
                      <div class="bow-buddha-benefit">✨ ${spBenefit}</div>
                    </div>
                  `;
                  clearTimeout(this._offeringBannerTimer);
                  this._offeringBannerTimer = setTimeout(() => {
                    if (!this.isBowing25 && bannerEl) bannerEl.style.display = 'none';
                  }, 7000);
                }
                window.templeAudio.speakText(spBenefit, false);

                if (!prevUnlockedWenshu && this.state.wenshuHallUnlocked) {
                  setTimeout(() => {
                    window.templeAudio.playGateOpenFanfare();
                    this.showToast(this.t(
                      '🦁🎉 All 7 White Stupas circled! The golden doors of Mount Wutai Manjushri Hall have swung open!',
                      '🦁🎉 七座白塔悉数顺绕圆满！五台山顶文殊殿金色大门已敞开！'
                    ));
                  }, 400);
                } else {
                  this.showToast(`✅ ${this.t(`Stupa #${stIdx + 1}`, `第 ${stIdx + 1} 尊白塔`)} (${circledTotal}/7): ${spBenefit}`);
                }
              }
            }
          }
        }
        this.lastStupaAngle = curAngle;
      } else {
        this.lastStupaAngle = null;
      }

      // 1B. EAST RIVER & WISDOM BRIDGE CROSSING GATE (x in [26.4, 33.8], bridge deck at z in [1.4, 6.6])
      if (nextX > 26.4 && nextX < 33.8) {
        if (!this.canCrossEastRiver()) {
          nextX = 26.4;
          this.walkTarget = null;
          const now = performance.now();
          if (now - (this._bridgeWarnTime || 0) > 2000) {
            this._bridgeWarnTime = now;
            this.showToast(this.t(
              '🪵 Talk to Bridge Master Lu nearby (x=24.8) to build the Wisdom Bridge across the river!',
              '🪵 请先找旁边（x=24.8）的鲁班桥师修建东溪智慧桥！'
            ));
          }
        } else if (Math.abs(prevZ - 4.0) < 2.75 && Math.abs(nextZ - 4.0) > 2.45) {
          // Keep feet safely inside the Wisdom Bridge railings!
          nextZ = nextZ > 4.0 ? 6.45 : 1.55;
        } else if (Math.abs(nextZ - 4.0) > 2.8) {
          // Block walking into the river water off the bridge
          nextX = prevX <= 26.4 ? 26.4 : (prevX >= 33.8 ? 33.8 : prevX);
        }
      }

      // 2. PRAYER HALL WALL & GATE COLLISION (Hall occupies x in [-17.5, +17.5], z in [-26, 0])
      if (Math.abs(nextX) < 17.5) {
        if (!this.canEnterPrayerHall() && nextZ < 0.8) {
          nextZ = 0.8;
          this.handleGateInteraction();
        }
        if (nextZ < 0.45 && nextZ > -0.45 && Math.abs(nextX) > 3.5) {
          nextZ = prevZ;
        }
        // Prompt 「回向」 right before exiting the Prayer Hall doorway (walking from inside z < 0.2 out to z >= 0.2)
        if (prevZ < 0.2 && nextZ >= 0.2 && Math.abs(prevX) < 17.5) {
          nextX = prevX;
          nextZ = prevZ;
          this.walkTarget = null;
          this.promptHuixiangBeforeExit(() => {
            this.playerGroup.position.set(0, 0.25, 1.8);
            this.playerGroup.rotation.y = 0;
          });
        }
        if (nextZ < 0) {
          nextX = Math.max(-15.8, Math.min(15.8, nextX));
          nextZ = Math.max(-18.8, nextZ);

          // Solid Prayer Hall Offering Table Collision (table at x in [-6.65, 6.65], z in [-17.0, -13.8])
          // Player CANNOT walk across or through the table and must walk around either side!
          const tHalfW = 6.65;
          const tMinZ = -17.0;
          const tMaxZ = -13.8;
          if (Math.abs(nextX) < tHalfW && nextZ > tMinZ && nextZ < tMaxZ) {
            const pushLeft = nextX + tHalfW;
            const pushRight = tHalfW - nextX;
            const pushFront = tMaxZ - nextZ;
            const pushBack = nextZ - tMinZ;
            const minPen = Math.min(pushLeft, pushRight, pushFront, pushBack);
            if (minPen === pushLeft) {
              nextX = -tHalfW;
            } else if (minPen === pushRight) {
              nextX = tHalfW;
            } else if (minPen === pushFront) {
              nextZ = tMaxZ;
            } else {
              nextZ = tMinZ;
            }
          }

          // Solid 7-Buddha Grand Altar Platform Collision (z < -18.9)
          if (Math.abs(nextX) < 15.6 && nextZ < -18.8) {
            nextZ = -18.8;
          }
        }
      } else {
        // Prevent walking through the exterior East/West side walls of the Prayer Hall from outside
        if (nextZ < 0.4 && nextZ > -26.5 && Math.abs(nextX) < 18.2) {
          nextX = nextX > 0 ? 18.2 : -18.2;
        }
      }

      // 3. Solid Courtyard Guardian Lions (x = ±6.8, z = 5.4) & Bronze Tripod Censer (0, 8.2)
      [-6.8, 6.8].forEach((lx) => {
        const ldx = nextX - lx;
        const ldz = nextZ - 5.4;
        const lDist = Math.hypot(ldx, ldz);
        if (lDist < 1.45 && lDist > 0.001) {
          nextX = lx + (ldx / lDist) * 1.45;
          nextZ = 5.4 + (ldz / lDist) * 1.45;
        }
      });
      const cdx = nextX - 0;
      const cdz = nextZ - 8.2;
      const cDist = Math.hypot(cdx, cdz);
      if (cDist < 1.75 && cDist > 0.001) {
        nextX = (cdx / cDist) * 1.75;
        nextZ = 8.2 + (cdz / cDist) * 1.75;
      }

      // Guard Curved Vermilion Bridge Side Railings when crossing (|x| <= 2.45 for z in [8.4, 18.6])
      if (prevZ >= 8.4 && prevZ <= 18.6 && Math.abs(prevX) < 2.65 && Math.abs(nextX) > 2.42) {
        nextX = nextX > 0 ? 2.42 : -2.42;
      }

      // 4. MOUNT WUTAI SUMMIT 文殊殿 WALLS, GATED DOOR (7 STUPAS) & OFFERING TABLE COLLISION
      if (nextZ > -8.6 && nextZ < 16.6) {
        if (prevX <= 114.6 && nextX > 114.6) {
          const inDoorGap = Math.abs(nextZ - 4.0) < 3.4;
          if (!inDoorGap || !this.canEnterWenshuHall()) {
            nextX = 114.6;
            if (inDoorGap && !this.canEnterWenshuHall()) {
              const now = performance.now();
              if (now - (this._wenshuWarnTime || 0) > 2000) {
                this._wenshuWarnTime = now;
                this.showToast(this.t(
                  `🔒 Circle all 7 White Stupas (${this.getCircledStupaCount()}/7) to open the doors of Manjushri Hall!`,
                  `🔒 请先顺绕七座白塔 (${this.getCircledStupaCount()}/7 圆满)，方能推开文殊殿大门！`
                ));
              }
            }
          }
        }
        // Inside 文殊殿: clamp to interior bounds & keep offering table & altar solid!
        if (nextX > 115.2) {
          nextX = Math.min(132.4, nextX);
          nextZ = Math.max(-7.5, Math.min(15.5, nextZ));
          if (nextX > 114.7 && nextX < 115.6 && Math.abs(nextZ - 4.0) >= 3.4) {
            nextX = prevX < 115.0 ? 114.6 : 115.7;
          }
          // Solid Manjushri Offering Altar Table (x in [125.1, 127.1], z in [1.1, 6.9])
          if (nextX > 125.1 && nextX < 127.1 && nextZ > 1.1 && nextZ < 6.9) {
            const pL = nextX - 125.1;
            const pR = 127.1 - nextX;
            const pF = nextZ - 1.1;
            const pB = 6.9 - nextZ;
            const mP = Math.min(pL, pR, pF, pB);
            if (mP === pL) nextX = 125.1;
            else if (mP === pR) nextX = 127.1;
            else if (mP === pF) nextZ = 1.1;
            else nextZ = 6.9;
          }
          // Solid Manjushri Statue Pedestal (x > 127.1, z in [1.4, 6.6])
          if (nextX > 127.1 && nextZ > 1.4 && nextZ < 6.6) {
            nextX = 127.1;
          }
        }
      }

      // 4B. WEST LONGEVITY HALL (长寿殿) OPEN SUMMIT PLAZA, INTERIOR WALLS, OFFERING TABLE & STATUE PEDESTAL COLLISION
      const wasInChangshou = prevX < -86.6 && prevX > -105.4 && prevZ > -8.4 && prevZ < 16.4;
      if (wasInChangshou) {
        nextX = Math.max(-104.2, nextX);
        nextZ = Math.max(-7.5, Math.min(15.5, nextZ));
        if (nextX > -87.4 && Math.abs(nextZ - 4.0) >= 3.4) {
          nextX = -87.4;
        }
        // Solid 长寿殿 Offering Altar Table (x in [-99.1, -97.1], z in [1.1, 6.9])
        if (nextX > -99.1 && nextX < -97.1 && nextZ > 1.1 && nextZ < 6.9) {
          const pL = nextX - (-99.1);
          const pR = -97.1 - nextX;
          const pF = nextZ - 1.1;
          const pB = 6.9 - nextZ;
          const mP = Math.min(pL, pR, pF, pB);
          if (mP === pL) nextX = -99.1;
          else if (mP === pR) nextX = -97.1;
          else if (mP === pF) nextZ = 1.1;
          else nextZ = 6.9;
        }
        // Solid 长寿佛 Statue Pedestal (x < -99.1, z in [1.4, 6.6])
        if (nextX < -99.1 && nextZ > 1.4 && nextZ < 6.6) {
          nextX = -99.1;
        }
      } else if (nextX > -105.5 && nextX < -86.4 && nextZ > -8.5 && nextZ < 16.5) {
        const inDoorGap = Math.abs(nextZ - 4.0) < 3.4 && prevX >= -86.6;
        if (!inDoorGap) {
          const pE = -86.4 - nextX;
          const pW = nextX - (-105.5);
          const pN = nextZ - (-8.5);
          const pS = 16.5 - nextZ;
          const mP = Math.min(pE, pW, pN, pS);
          if (mP === pE) nextX = -86.4;
          else if (mP === pW) nextX = -105.5;
          else if (mP === pN) nextZ = -8.5;
          else nextZ = 16.5;
        }
      }

      // Expanded World Outer Boundaries (West Open Summit Plaza x=-120 -> Mount Wutai 文殊殿 x=138, North peak z=114 -> z=-20)
      nextX = Math.max(-120, Math.min(138, nextX));
      nextZ = Math.max(-20, Math.min(114, nextZ));
    } else {
      const r = Math.hypot(nextX, nextZ);
      if (r > 16.5) {
        nextX *= 16.5 / r;
        nextZ *= 16.5 / r;
      }
    }

    const actualDX = nextX - prevX;
    const actualDZ = nextZ - prevZ;
    if (Math.hypot(actualDX, actualDZ) > 0.001 && !this.isAutoCirclingStupa) {
      const targetRot = Math.atan2(actualDX, actualDZ);
      let diffRot = targetRot - this.playerGroup.rotation.y;
      while (diffRot > Math.PI) diffRot -= Math.PI * 2;
      while (diffRot < -Math.PI) diffRot += Math.PI * 2;
      this.playerGroup.rotation.y += diffRot * 0.22;
    }

    this.playerGroup.position.x = nextX;
    this.playerGroup.position.z = nextZ;
  }

  setPoseMode(mode) {
    this.poseMode = mode;
    const dockPalms = document.getElementById('dock-btn-palms');
    const dockSit = document.getElementById('dock-btn-sit');
    const sitLabel = document.getElementById('dock-sit-label');
    if (dockPalms) dockPalms.classList.toggle('active', mode === 'palms');
    const sitting = mode === 'sit' || !!this.seatedScenic || this.isSeatedOnMat;
    if (dockSit) dockSit.classList.toggle('active', sitting);
    if (sitLabel) sitLabel.textContent = sitting ? this.t('Stand', '起身') : this.t('Sit', '静坐');
  }

  toggleSitScenicSpot(seat, forceSit) {
    const shouldSit = typeof forceSit === 'boolean' ? forceSit : !(this.poseMode === 'sit' || this.seatedScenic);
    if (!shouldSit) {
      this.seatedScenic = null;
      this.closeChairRestBlossomOverlay();
      this.setPoseMode('idle');
      return;
    }
    if (seat) {
      this.seatedScenic = seat;
      const sy = window.GAME_DATA.getTerrainHeight(seat.x, seat.z) + (seat.isPier ? 0.36 : 0.62);
      this.playerGroup.position.set(seat.x, sy, seat.z);
      this.playerGroup.rotation.y = seat.rotY;
      this.walkTarget = null;
      const sName = this.dField(seat, 'name', 'zhName');
      this.openChairRestBlossomOverlay(`${seat.emoji || '🌸'} ${sName}`);
      this.showToast(this.t(
        `${seat.emoji} Resting peacefully under white blossoms at ${sName}.`,
        `${seat.emoji} 在 ${sName} 花下禅坐静休，心平气和。`
      ));
    } else {
      this.openChairRestBlossomOverlay(this.t('🌸 Mindful Rest Beneath White Blossoms', '🌸 花下禅坐静休'));
    }
    this.setPoseMode('sit');
  }

  ringTempleBell() {
    window.templeAudio.playGiantTempleBell();
    if (this.bellPavilion) {
      this.bellPavilion.userData.bellSwing = 1.0;
    }
    this.bowAnimTimer = 1.6;
    this.showToast(this.t(
      '🔔 The deep resonance of the bronze bell spreads peace across the valley.',
      '🔔 悠远清越的铜钟声传遍清凉山谷，令人心安自在。'
    ));
  }

  updateDoorsAndAnimations(dt, elapsed) {
    // Animate Giant Bronze Temple Bell Pavilion Striker & Bell Pendulum
    if (this.bellPavilion && this.bellPavilion.userData.bellSwing > 0) {
      this.bellPavilion.userData.bellSwing = Math.max(0, this.bellPavilion.userData.bellSwing - dt * 0.28);
      const sw = this.bellPavilion.userData.bellSwing;
      if (this.bellPavilion.userData.strikerPivot) {
        this.bellPavilion.userData.strikerPivot.rotation.x = Math.sin(elapsed * 5.5) * 0.26 * sw;
      }
      if (this.bellPavilion.userData.bellGroup) {
        this.bellPavilion.userData.bellGroup.rotation.x = Math.sin(elapsed * 4.2) * 0.08 * sw;
      }
    }

    // Swing open the Grand Temple Doors once 10 Virtue Points (5 Good Deeds) are reached
    if (this.doorLeftPivot && this.doorRightPivot) {
      const targetAngle = this.canEnterPrayerHall() ? 1.48 : 0;
      this.doorLeftPivot.rotation.y += (targetAngle - this.doorLeftPivot.rotation.y) * 4 * dt;
      this.doorRightPivot.rotation.y += (-targetAngle - this.doorRightPivot.rotation.y) * 4 * dt;
    }

    // Swing open the Mount Wutai 文殊殿 Golden Doors once all 7 White Stupas are circled!
    if (this.wenshuHallGroup && this.wenshuHallGroup.userData) {
      const wTarget = this.canEnterWenshuHall() ? 1.48 : 0;
      const dL = this.wenshuHallGroup.userData.doorLeftPivot;
      const dR = this.wenshuHallGroup.userData.doorRightPivot;
      if (dL && dR) {
        dL.rotation.y += (wTarget - dL.rotation.y) * 4 * dt;
        dR.rotation.y += (-wTarget - dR.rotation.y) * 4 * dt;
      }
    }

    // Gently float Mount Wutai summit white clouds
    if (this.summitClouds) {
      this.summitClouds.children.forEach((cl) => {
        const ud = cl.userData || {};
        cl.position.x = (ud.baseX || 90) + Math.sin(elapsed * (ud.speed || 0.3) + (ud.phase || 0)) * 3.2;
        cl.position.y = (ud.baseY || 20) + Math.cos(elapsed * 0.55 + (ud.phase || 0)) * 0.4;
      });
    }

    // Spin glowing Sutra reading orbs gently
    (this.sutraStations || []).forEach((st, idx) => {
      if (st.group && st.group.userData && st.group.userData.orb) {
        st.group.userData.orb.rotation.y = elapsed * 1.8 + idx;
        st.group.userData.orb.position.y = 1.48 + Math.sin(elapsed * 2.4 + idx) * 0.08;
      }
    });

    // Rotate Spirit Companion Aura
    if (this.charParts.auraOrb) {
      this.charParts.auraOrb.position.x = Math.cos(elapsed * 2.2) * 0.85;
      this.charParts.auraOrb.position.z = Math.sin(elapsed * 2.2) * 0.85;
      this.charParts.auraOrb.position.y = 1.65 + Math.sin(elapsed * 4) * 0.12;
    }

    // Update 3D Golden Exploration Compass Arrow to point toward the active Hint Landmark!
    if (this.compassArrow) {
      const targetDeed = window.GAME_DATA.GOOD_DEEDS.find(
        (d) => d.id === this.activeHintDeedId && !this.state.completedDeeds[d.id]
      );
      if (targetDeed && this.currentScene === 'public_temple' && this.playerGroup.position.z > 0) {
        this.compassArrow.visible = true;
        const dx = targetDeed.pos.x - this.playerGroup.position.x;
        const dz = targetDeed.pos.z - this.playerGroup.position.z;
        const worldAngle = Math.atan2(dx, dz);
        this.compassArrow.rotation.y = worldAngle - this.playerGroup.rotation.y;
      } else {
        this.compassArrow.visible = false;
      }
    }

    // Animate 3D Location Markers (rotating golden beacon crystals at uncompleted quest spots)
    this.deedStations.forEach((st, idx) => {
      if (!this.state.completedDeeds[st.deed.id] && st.group.userData.markerCrystal) {
        st.group.userData.markerCrystal.rotation.y = elapsed * 2.2 + idx;
        st.group.userData.markerCrystal.position.y = 3.5 + Math.sin(elapsed * 3.0 + idx) * 0.28;
      }
    });

    // Animate rescued forest deer & fox in their groves once saved!
    const forestSt = this.deedStations.find((s) => s.deed.id === 'save_animals');
    if (forestSt && this.state.completedDeeds['save_animals'] && forestSt.group.userData.deerGroup) {
      forestSt.group.userData.deerGroup.position.y = 0.22 + Math.abs(Math.sin(elapsed * 5)) * 0.45;
      forestSt.group.userData.deerGroup.rotation.y = elapsed * 1.2;
    }
    const hunterSt = this.deedStations.find((s) => s.deed.id === 'stop_hunter');
    if (hunterSt && this.state.completedDeeds['stop_hunter'] && hunterSt.group.userData.foxGroup) {
      hunterSt.group.userData.foxGroup.position.y = Math.abs(Math.sin(elapsed * 5.5)) * 0.38;
      hunterSt.group.userData.foxGroup.rotation.y = -elapsed * 1.3;
    }

    // Game Designer Recommendation #1: Fade out Golden Lotus Footprints
    for (let i = this.lotusFootprints.length - 1; i >= 0; i--) {
      const fp = this.lotusFootprints[i];
      fp.age += dt;
      if (fp.age >= 2.2) {
        this.publicTempleGroup.remove(fp.mesh);
        this.lotusFootprints.splice(i, 1);
      } else {
        const s = 1 + fp.age * 0.35;
        fp.mesh.scale.set(s, s, 1);
        fp.mesh.material.opacity = 0.65 * (1 - fp.age / 2.2);
      }
    }

    // Game Designer Recommendation #2: Rescued Animal Companions (Deer & Fox) happily follow the player!
    ['deer', 'fox'].forEach((type, idx) => {
      const comp = this.companionMeshes[type];
      if (!comp) return;
      const offsetAngle = this.playerGroup.rotation.y + Math.PI + (idx === 0 ? -0.55 : 0.55);
      const targetX = this.playerGroup.position.x + Math.sin(offsetAngle) * 1.65;
      const targetZ = this.playerGroup.position.z + Math.cos(offsetAngle) * 1.65;
      comp.position.x += (targetX - comp.position.x) * Math.min(1, dt * 4.5);
      comp.position.z += (targetZ - comp.position.z) * Math.min(1, dt * 4.5);
      const baseH = window.GAME_DATA.getSurfaceHeightAt(comp.position.x, comp.position.z);
      comp.position.y = baseH + Math.abs(Math.sin(elapsed * 6 + idx)) * 0.12;
      comp.rotation.y = this.playerGroup.rotation.y;
    });

    // Game Designer Recommendation #3: Animate Rising Golden Sky Lanterns
    for (let i = this.skyLanterns.length - 1; i >= 0; i--) {
      const sl = this.skyLanterns[i];
      sl.age += dt;
      sl.mesh.position.y += dt * 1.85;
      sl.mesh.position.x += Math.sin(elapsed * 1.5 + i) * dt * 0.3;
      if (sl.age > 9.0) {
        this.publicTempleGroup.remove(sl.mesh);
        this.skyLanterns.splice(i, 1);
      }
    }

    // Gently pulse the 7 Buddhas' flame mandorla halos
    this.buddhaStatues.forEach((b, idx) => {
      if (b.mesh.userData.haloRing) {
        const s = 1 + Math.sin(elapsed * 2.2 + idx) * 0.04;
        b.mesh.userData.haloRing.scale.set(s, s, 1);
      }
    });

    // Animate the Giant Blooming PINK 3D Sky Lotus rising from the Prayer Hall Gate:
    // It emerges from the gate, opens its pink petals in the sky, and then FADES & DISAPPEARS!
    if (this.gateSkyLotus) {
      this.gateSkyLotusAge = (this.gateSkyLotusAge || 0) + dt;
      const age = this.gateSkyLotusAge;
      const totalDur = 4.6;

      if (age >= totalDur) {
        // Completely remove the Pink Lotus so it does NOT stay on top of the gate!
        this.publicTempleGroup.remove(this.gateSkyLotus);
        this.gateSkyLotus = null;
      } else {
        // Phase 1 (0 -> 2.1s): Rise from gate and unfold pink petals open
        const openProgress = Math.min(1, age / 2.1);
        const easeOut = 1 - Math.pow(1 - openProgress, 3);
        this.gateSkyLotus.position.y = 1.8 + easeOut * 9.0 + Math.sin(elapsed * 2.0) * 0.18;
        this.gateSkyLotus.rotation.y = elapsed * 0.55;

        const pivots = this.gateSkyLotus.userData.petalPivots || [];
        pivots.forEach((pv) => {
          pv.pivot.rotation.x = pv.startTilt + (pv.endTilt - pv.startTilt) * easeOut;
        });

        // Phase 2 (3.2 -> 4.6s): Smoothly fade out and shrink away so it disappears!
        let fadeAlpha = 1.0;
        let fadeScale = 0.35 + easeOut * 0.85;
        if (age > 3.2) {
          const fadeT = Math.min(1, (age - 3.2) / (totalDur - 3.2));
          fadeAlpha = Math.max(0, 1 - fadeT);
          fadeScale *= Math.max(0.05, 1 - fadeT * 0.65);
        }
        this.gateSkyLotus.scale.set(fadeScale, fadeScale, fadeScale);
        const mats = this.gateSkyLotus.userData.fadeMaterials || [];
        mats.forEach((m) => {
          m.opacity = fadeAlpha;
        });
      }
    }

    // Gently sway the 3D Hanging Wish Plaques on the Bodhi Wishing Tree branches
    if (this.wishingTreePlaquesGroup && this.wishingTreePlaquesGroup.children.length > 0) {
      this.wishingTreePlaquesGroup.children.forEach((plaquePivot, idx) => {
        const phase = plaquePivot.userData.swayPhase || idx;
        plaquePivot.rotation.z = Math.sin(elapsed * 2.1 + phase) * 0.1;
        plaquePivot.rotation.x = Math.cos(elapsed * 1.7 + phase) * 0.06;
      });
    }

    // Animate 90+ Festive Confetti Particles showering in the sky above the Prayer Hall Gate!
    for (let i = this.gateConfetti.length - 1; i >= 0; i--) {
      const cf = this.gateConfetti[i];
      cf.age += dt;
      cf.mesh.position.x += cf.vx * dt;
      cf.mesh.position.y += cf.vy * dt;
      cf.mesh.position.z += cf.vz * dt;
      cf.vy -= 2.6 * dt; // Gentle gravity so confetti floats in the sky
      cf.mesh.rotation.x += cf.rx * dt;
      cf.mesh.rotation.y += cf.ry * dt;
      cf.mesh.rotation.z += cf.rz * dt;
      if (cf.age > 6.5 || cf.mesh.position.y < 0.2) {
        this.publicTempleGroup.remove(cf.mesh);
        this.gateConfetti.splice(i, 1);
      }
    }

    // Animate rising white smoke above the Celadon Lotus Incense Stick (when offered)
    if (this.state.offeringsMade.scent && this.incenseSmokePuffs && this.incenseSmokePuffs.length > 0) {
      this.incenseSmokePuffs.forEach((puff, idx) => {
        const cycle = (elapsed * 0.55 + idx * 0.2) % 1;
        puff.position.y = 1.44 + cycle * 1.15;
        puff.position.x = Math.sin(elapsed * 2.0 + idx * 1.3) * 0.09;
        const s = 0.7 + cycle * 1.1;
        puff.scale.set(s, s, s);
        puff.material.opacity = (1 - cycle) * 0.45;
      });
    }
  }

  startCutscene({
    emoji = '🪷',
    imgSrc = null,
    title = 'Story Moment',
    subtitle = '',
    targetPos,
    camDistance = 8.5,
    camHeight = 3.6,
    baseAngle = 0.25,
    orbitSpeed = 0.35,
    duration = 2.4,
    onComplete = null
  }) {
    this.cutsceneState = {
      targetPos: targetPos.clone(),
      camDistance,
      camHeight,
      baseAngle,
      orbitSpeed,
      duration,
      age: 0,
      onComplete
    };
    const overlay = document.getElementById('cutscene-overlay');
    const emojiEl = document.getElementById('cutscene-emoji');
    const titleEl = document.getElementById('cutscene-title');
    const subEl = document.getElementById('cutscene-subtitle');
    if (emojiEl) {
      if (imgSrc) {
        const resolvedImgSrc = (window.INLINE_ASSETS && window.INLINE_ASSETS[imgSrc]) || imgSrc;
        emojiEl.innerHTML = `<img src="${resolvedImgSrc}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      } else {
        emojiEl.textContent = emoji;
      }
    }
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    if (overlay) overlay.classList.remove('hidden');
  }

  endCutscene(runCallback = true) {
    if (!this.cutsceneState) return;
    const cb = this.cutsceneState.onComplete;
    this.cutsceneState = null;
    const overlay = document.getElementById('cutscene-overlay');
    if (overlay) overlay.classList.add('hidden');
    if (runCallback && typeof cb === 'function') {
      cb();
    }
  }

  updateCamera(dt) {
    if (this.cutsceneState) {
      this.cutsceneState.age += dt;
      const cs = this.cutsceneState;
      const angle = cs.baseAngle + cs.age * cs.orbitSpeed;
      const desiredPos = new THREE.Vector3(
        cs.targetPos.x + Math.sin(angle) * cs.camDistance,
        cs.targetPos.y + cs.camHeight,
        cs.targetPos.z + Math.cos(angle) * cs.camDistance
      );
      this.camera.position.lerp(desiredPos, Math.min(1, dt * 5.5));
      this.camera.lookAt(cs.targetPos);
      if (cs.age >= cs.duration) {
        this.endCutscene(true);
      }
      return;
    }

    const pPos = this.playerGroup.position;

    if (this.seatedScenic && this.currentScene === 'public_temple') {
      const seat = this.seatedScenic;
      const desiredPos = new THREE.Vector3(
        pPos.x + (seat.camOffset ? seat.camOffset.x : -4.0),
        pPos.y + (seat.camOffset ? seat.camOffset.y : 2.2),
        pPos.z + (seat.camOffset ? seat.camOffset.z : 3.6)
      );
      const lookTarget = new THREE.Vector3(
        pPos.x + (seat.lookAtOffset ? seat.lookAtOffset.x : 0),
        pPos.y + (seat.lookAtOffset ? seat.lookAtOffset.y : 0.8),
        pPos.z + (seat.lookAtOffset ? seat.lookAtOffset.z : -3.0)
      );
      this.camera.position.lerp(desiredPos, Math.min(1, dt * 3.5));
      this.camera.lookAt(lookTarget);
      if (this.dirLight) {
        this.dirLight.position.set(pPos.x + 28, pPos.y + 48, pPos.z + 34);
        this.dirLight.target.position.copy(pPos);
        this.dirLight.target.updateMatrixWorld();
      }
      return;
    }

    const inPrayerHall =
      this.currentScene === 'public_temple' &&
      Math.abs(pPos.x) < 17.5 &&
      pPos.z < 0.2;
    const inWenshuHall = this.isInsideWenshuHall();
    const inChangshouHall = this.isInsideChangshouHall();

    if (inWenshuHall && !this._wasInWenshuHallCamera) {
      this.cameraAngle = -Math.PI / 2;
      if (!this.isSeatedOnMat) this.playerGroup.rotation.y = Math.PI / 2;
    }
    if (inChangshouHall && !this._wasInChangshouHallCamera) {
      this.cameraAngle = Math.PI / 2;
      if (!this.isSeatedOnMat) this.playerGroup.rotation.y = -Math.PI / 2;
    }
    this._wasInWenshuHallCamera = inWenshuHall;
    this._wasInChangshouHallCamera = inChangshouHall;

    // Auto-hide front hall facade & overhang eaves when player is inside so view is never blocked!
    if (this.templeFrontCutawayGroup) {
      this.templeFrontCutawayGroup.visible = !inPrayerHall;
    }
    if (this.wenshuHallGroup && this.wenshuHallGroup.userData && this.wenshuHallGroup.userData.frontRoofCutaway) {
      this.wenshuHallGroup.userData.frontRoofCutaway.visible = !inWenshuHall;
    }
    if (this.changshouHallGroup && this.changshouHallGroup.userData && this.changshouHallGroup.userData.frontRoofCutaway) {
      this.changshouHallGroup.userData.frontRoofCutaway.visible = !inChangshouHall;
    }

    const nearStupa =
      !inPrayerHall &&
      !inWenshuHall &&
      !inChangshouHall &&
      this.currentScene === 'public_temple' &&
      Math.hypot(pPos.x - this.stupaPos.x, pPos.z - this.stupaPos.z) < 7.5;

    let target;
    let desiredPos;

    if (inPrayerHall) {
      // Frame all 7 Standing Buddhas' full bodies, lotus thrones, and overhead vertical plaques!
      target = new THREE.Vector3(
        pPos.x * 0.45,
        pPos.y + 4.45,
        Math.min(pPos.z - 6.5, -18.5)
      );
      const camDist = this.isSeatedOnMat ? 11.4 : Math.max(12.8, Math.min(this.cameraDistance, 15.2));
      desiredPos = new THREE.Vector3(
        Math.max(-13.8, Math.min(13.8, pPos.x + Math.sin(this.cameraAngle) * camDist)),
        pPos.y + 2.35,
        Math.min(-0.55, Math.max(-15.0, pPos.z + Math.cos(this.cameraAngle) * camDist))
      );
    } else if (inWenshuHall) {
      // Center camera straight on Manjushri Bodhisattva (whole body + Blue Lion + lotus throne + overhead plaque), matching Prayer Hall!
      const dzFromCenter = pPos.z - 4.0;
      target = new THREE.Vector3(
        Math.max(pPos.x + 6.5, 129.4),
        pPos.y + 3.45,
        4.0 + dzFromCenter * 0.35
      );
      const camDist = this.isSeatedOnMat ? 10.2 : Math.max(11.4, Math.min(this.cameraDistance, 13.8));
      const angleOffset = this.cameraAngle - (-Math.PI / 2);
      desiredPos = new THREE.Vector3(
        Math.max(111.5, Math.min(125.0, pPos.x - Math.cos(angleOffset) * camDist)),
        pPos.y + 2.25,
        Math.max(-6.8, Math.min(14.8, 4.0 + dzFromCenter * 0.55 + Math.sin(angleOffset) * camDist))
      );
    } else if (inChangshouHall) {
      // Center camera straight on Amitayus Longevity Buddha (whole body + throne + attendant deities + Thangka + plaque), matching Prayer Hall!
      const dzFromCenter = pPos.z - 4.0;
      target = new THREE.Vector3(
        Math.min(pPos.x - 6.5, -101.4),
        pPos.y + 3.45,
        4.0 + dzFromCenter * 0.35
      );
      const camDist = this.isSeatedOnMat ? 10.2 : Math.max(11.4, Math.min(this.cameraDistance, 13.8));
      const angleOffset = this.cameraAngle - (Math.PI / 2);
      desiredPos = new THREE.Vector3(
        Math.min(-83.5, Math.max(-97.0, pPos.x + Math.cos(angleOffset) * camDist)),
        pPos.y + 2.25,
        Math.max(-6.8, Math.min(14.8, 4.0 + dzFromCenter * 0.55 - Math.sin(angleOffset) * camDist))
      );
    } else {
      const lookHeight = this.isSeatedOnMat ? 2.1 : nearStupa ? 3.2 : 1.75;
      target = pPos.clone().add(new THREE.Vector3(0, lookHeight, 0));

      const camDist = this.isSeatedOnMat
        ? 7.2
        : nearStupa
          ? Math.max(this.cameraDistance, 11.5)
          : this.cameraDistance;
      const pitch = this.isSeatedOnMat ? 0.30 : this.cameraPitch;
      const horizDist = camDist * Math.cos(pitch);
      const camHeight = camDist * Math.sin(pitch) + 0.85;

      desiredPos = new THREE.Vector3(
        target.x + Math.sin(this.cameraAngle) * horizDist,
        target.y + camHeight,
        target.z + Math.cos(this.cameraAngle) * horizDist
      );
    }

    // Keep shadow-casting sunlight centered around the player across the giant mountain valley
    if (this.dirLight) {
      this.dirLight.position.set(pPos.x + 28, pPos.y + 48, pPos.z + 34);
      this.dirLight.target.position.copy(pPos);
      this.dirLight.target.updateMatrixWorld();
    }

    this.camera.position.lerp(desiredPos, Math.min(1, dt * 8.5));
    this.camera.lookAt(target);
  }

  checkProximityPrompt() {
    const promptEl = document.getElementById('proximity-prompt');
    const hallBarEl = document.getElementById('meditation-mat-bar');

    if (this.currentScene !== 'public_temple') {
      document.body.classList.remove('in-sacred-hall');
      this._wasInsideAnyHall = false;
      promptEl.style.display = 'none';
      if (hallBarEl) hallBarEl.style.display = 'none';
      this._nearStupa = false;
      this._nearbyDeedId = null;
      this._nearbyBuddhaIdx = null;
      this._nearOfferingTableHall = null;
      this._lastSpokenPromptId = null;
      return;
    }

    const pPos = this.playerGroup.position;
    const insidePrayerHall = Math.abs(pPos.x) < 17.5 && pPos.z < 0.8;
    const insideWenshu = this.isInsideWenshuHall();
    const insideChangshou = this.isInsideChangshouHall();
    const insideAnyHall = Boolean(insidePrayerHall || insideWenshu || insideChangshou || this.isSeatedOnMat);
    const isMobile = window.innerWidth <= 768;
    this._nearOfferingTableHall = null;
    document.body.classList.toggle('in-sacred-hall', insideAnyHall);
    if (insideAnyHall && !this._wasInsideAnyHall && isMobile) {
      const sp = document.getElementById('side-panel');
      const rp = document.getElementById('right-panel');
      if (sp) sp.classList.add('collapsed');
      if (rp) rp.classList.add('collapsed');
    }
    this._wasInsideAnyHall = insideAnyHall;

    const configureHallBar = (mode) => {
      const hdr = document.getElementById('hall-status-text');
      const b1 = document.querySelector('.mat-btn[data-hall-action="1"]');
      const b2 = document.getElementById('btn-hall-bow25');
      const b3 = document.querySelector('.mat-btn[data-hall-action="3"]');
      const b4 = document.querySelector('.mat-btn[data-hall-action="4"]');
      const b5 = document.querySelector('.mat-btn[data-hall-action="5"]');
      const b6 = document.getElementById('mat-btn-amitofo');
      const learnBtn = document.getElementById('btn-hall-learn-buddhas');
      const quizBtn = document.getElementById('btn-hall-quiz');
      const teleStartBtn = document.getElementById('btn-hall-teleport-start');
      const updateHallPrayerBtn = (phoneMode) => {
        if (!b6) return;
        const chantingNow = !!this._isPrayerChanting;
        const activeId = this.getActivePrayerSkillId();
        b6.disabled = chantingNow;
        if (chantingNow) {
          b6.textContent = phoneMode ? this.t('🔊Chant', '🔊念诵中') : this.t('🔊 Pronouncing...', '🔊 正在念诵…');
          return;
        }
        if (activeId === 'wenshu') {
          b6.textContent = phoneMode
            ? this.t('🦁Mantra', '🦁文殊咒')
            : this.t(`🦁 Mantra [L] (${this.state.wenshuMantraCount || 0})`, `🦁 文殊咒 [L] (${this.state.wenshuMantraCount || 0})`);
        } else if (activeId === 'changshou') {
          b6.textContent = phoneMode
            ? this.t('🏺Pray', '🏺长寿咒')
            : this.t(`🏺 Longv [L] (${this.state.changshouPrayerCount || 0})`, `🏺 长寿咒 [L] (${this.state.changshouPrayerCount || 0})`);
        } else {
          const pCnt = this.state.amitofoCount || 0;
          const cyc = pCnt > 0 && pCnt % 100 === 0 ? 100 : pCnt % 100;
          b6.textContent = phoneMode
            ? this.t('📿Pray', '📿念佛')
            : this.t(`✨ Pray [L] (${cyc}/100)`, `✨ 念佛 [L] (${cyc}/100)`);
        }
      };

      if (isMobile) {
        if (hdr) {
          if (mode === true || mode === 'wenshu') {
            hdr.textContent = this.isSeatedOnMat
              ? this.t('🧘 Meditating · Manjushri', '🧘 文殊殿 · 打坐中')
              : this.t('🦁 Manjushri Hall', '🦁 文殊殿');
          } else if (mode === 'changshou') {
            hdr.textContent = this.isSeatedOnMat
              ? this.t('🧘 Meditating · Longevity', '🧘 长寿殿 · 打坐中')
              : this.t('🏺 Longevity Hall', '🏺 长寿殿');
          } else {
            hdr.textContent = this.t('🏮 Prayer Hall', '🏮 七佛宝殿');
          }
        }
        if (b1) b1.textContent = this.t('🧘Sit', '🧘打坐');
        if (b2) b2.textContent = this.t('🙏Bow', '🙏礼佛');
        if (b3) b3.textContent = this.t('💧Water', '💧供水');
        if (b4) b4.textContent = this.t('🪷Flower', '🪷供花');
        if (b5) b5.textContent = this.t('🪔Scent', '🪔供香');
        updateHallPrayerBtn(true);
        const showPrayerExtras = !(mode === true || mode === 'wenshu' || mode === 'changshou');
        if (learnBtn) {
          learnBtn.style.display = showPrayerExtras ? 'inline-flex' : 'none';
          if (showPrayerExtras) learnBtn.textContent = this.t('🙏7 Buddhas', '🙏七佛');
        }
        if (quizBtn) {
          quizBtn.style.display = showPrayerExtras ? 'inline-flex' : 'none';
          if (showPrayerExtras) quizBtn.textContent = this.t('🧠Quiz', '🧠问答');
        }
        if (teleStartBtn) teleStartBtn.textContent = this.t('⛰️Start', '⛰️起点');
        return;
      }
      if (teleStartBtn) teleStartBtn.textContent = this.t('⛰️ Start', '⛰️ 回起点');
      if (mode === true || mode === 'wenshu') {
        if (hdr) {
          hdr.textContent = this.isSeatedOnMat
            ? this.t('🧘 Meditating in Manjushri Hall', '🧘 文殊殿静坐禅修中')
            : this.t('🦁 Manjushri Hall (+10 VP)', '🦁 文殊殿修行 (+10 功德)');
        }
        if (b1) b1.textContent = this.t('1. 🧘 Sit', '1. 🧘 打坐');
        if (b2) b2.textContent = this.t('2. 🙏 Bow', '2. 🙏 礼敬文殊');
        if (b3) b3.textContent = this.t('3. 💧 Water', '3. 💧 供水');
        if (b4) b4.textContent = this.t('4. 🪷 Flower', '4. 🪷 供花');
        if (b5) b5.textContent = this.t('5. 🪔 Incense', '5. 🪔 供香');
        updateHallPrayerBtn(false);
        if (learnBtn) learnBtn.style.display = 'none';
        if (quizBtn) quizBtn.style.display = 'none';
      } else if (mode === 'changshou') {
        if (hdr) {
          hdr.textContent = this.isSeatedOnMat
            ? this.t('🧘 Meditating in Longevity Hall', '🧘 长寿殿静坐禅修中')
            : this.t('🏺 Longevity Hall (+10 VP)', '🏺 长寿殿修行 (+10 功德)');
        }
        if (b1) b1.textContent = this.t('1. 🧘 Sit', '1. 🧘 打坐');
        if (b2) b2.textContent = this.t('2. 🙏 Bow', '2. 🙏 礼敬长寿佛');
        if (b3) b3.textContent = this.t('3. 💧 Water', '3. 💧 供水');
        if (b4) b4.textContent = this.t('4. 🪷 Flower', '4. 🪷 供花');
        if (b5) b5.textContent = this.t('5. 🪔 Incense', '5. 🪔 供香');
        updateHallPrayerBtn(false);
        if (learnBtn) learnBtn.style.display = 'none';
        if (quizBtn) quizBtn.style.display = 'none';
      } else {
        if (hdr) hdr.textContent = this.t('🏮 Prayer Hall (+10 VP)', '🏮 佛殿修行 (+10 功德)');
        if (b1) b1.textContent = this.t('1. 🧘 Sit', '1. 🧘 打坐');
        if (b2) b2.textContent = this.t('2. 🙏 Bow 25x', '2. 🙏 礼佛25拜');
        if (b3) b3.textContent = this.t('3. 💧 Water', '3. 💧 供水');
        if (b4) b4.textContent = this.t('4. 🪷 Flower', '4. 🪷 供花');
        if (b5) b5.textContent = this.t('5. 🪔 Incense', '5. 🪔 供香');
        updateHallPrayerBtn(false);
        if (learnBtn) {
          learnBtn.style.display = 'inline-flex';
          learnBtn.textContent = this.t('🙏 7 Buddhas', '🙏 七佛');
        }
        if (quizBtn) {
          quizBtn.style.display = 'inline-flex';
          quizBtn.textContent = this.t('🧠 Quiz', '🧠 问答');
        }
      }
    };

    // Inside Mount Wutai Summit 文殊殿
    if (insideWenshu) {
      if (hallBarEl) {
        hallBarEl.style.display = 'flex';
        configureHallBar(true);
      }
      this._nearStupa = false;
      this._nearbyDeedId = null;
      this._nearbyBuddhaIdx = null;
      this._nearbySutraId = null;
      this._nearbyWenshuSeatIdx = null;

      if (!this.isSeatedOnMat && pPos.x > 123.2 && Math.abs(pPos.z - 4.0) < 4.2) {
        if (!this.areHallOfferingsComplete('wenshu')) {
          this._nearManjushri = false;
          this._nearOfferingTableHall = 'wenshu';
          this.renderHallOfferingTablePrompt(promptEl, 'wenshu');
          return;
        }
        if ((this._offeringActiveUntil || 0) > Date.now()) {
          this._nearManjushri = false;
          this._nearOfferingTableHall = null;
          promptEl.style.display = 'none';
          return;
        }
        this._nearOfferingTableHall = null;
        this._nearManjushri = true;
        const mData = window.GAME_DATA.MANJUSHRI_DATA || {};
        const mName = this.dField(mData, 'name', 'cnName') || this.t('Manjushri', '文殊菩萨');
        const mTitle = this.dField(mData, 'title', 'zhTitle') || this.t('Bodhisattva of Great Wisdom', '大智文殊师利菩萨');
        const mWish = this.dField(mData, 'wishAndBenefit', 'zhWishAndBenefit') || this.t('May clear wisdom light up every step.', '愿清净大智慧照亮前路。');
        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1">
            <div class="talk-portrait-col"><div class="talk-avatar-frame">🦁</div><div class="talk-speaker-badge">${mName}</div></div>
            <div class="talk-bubble-body">
              <div class="box-tag"><span>✨ ${mTitle}</span></div>
              <div class="box-title">✨ "${mWish}"</div>
            </div>
          </div>
          <div class="quest-box-2">
            <div class="box-tag"><span>${this.t('🦁 Manjushri Quest', '🦁 礼敬文殊菩萨')}</span><span>${this.state.bowedManjushri ? this.t('✅ Done', '✅ 已完成') : this.t('+10 VP', '+10 功德')}</span></div>
            <button class="quest-enter-btn" onclick="window.game.bowToManjushriQuest()">
              <span>${this.t('🙏 Bow to Manjushri', '🙏 礼敬文殊菩萨')}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }
      this._nearManjushri = false;


      if (!this.isSeatedOnMat && this.wenshuSeats && this.wenshuSeats.length > 0) {
        let bestSeatIdx = -1;
        let bestSeatDist = Infinity;
        this.wenshuSeats.forEach((s) => {
          const d = Math.hypot(pPos.x - s.x, pPos.z - s.z);
          if (d < bestSeatDist) {
            bestSeatDist = d;
            bestSeatIdx = s.idx;
          }
        });
        if (bestSeatIdx >= 0 && bestSeatDist < 1.45) {
          this._nearbyWenshuSeatIdx = bestSeatIdx;
          if (!isMobile) {
            promptEl.style.display = 'flex';
            promptEl.innerHTML = `
              <div class="quest-box-1" style="padding:10px 14px;">
                <div class="talk-portrait-col"><div class="talk-avatar-frame">🧘</div><div class="talk-speaker-badge">${this.t(`Seat #${bestSeatIdx + 1}/20`, `第 ${bestSeatIdx + 1}/20 座`)}</div></div>
                <div class="talk-bubble-body">
                  <div class="box-title">${this.t('Sit and meditate peacefully (+10 VP).', '面向文殊菩萨安坐打坐（+10 功德）。')}</div>
                </div>
              </div>
              <div class="quest-box-2">
                <button class="quest-enter-btn" onclick="window.game.meditateInWenshuHall(${bestSeatIdx})">
                  <span>${this.t('🧘 Sit & Meditate', '🧘 打坐静修')}</span>
                  <span class="enter-key-badge">⏎ E</span>
                </button>
              </div>
            `;
            return;
          }
        }
      }

      promptEl.style.display = 'none';
      return;
    }
    this._nearManjushri = false;
    this._nearHallTeleportStart = false;
    this._nearbyWenshuSeatIdx = null;

    // Inside West Sanctuary 长寿殿 (Amitayus Longevity Hall)
    if (insideChangshou) {
      if (hallBarEl) {
        hallBarEl.style.display = 'flex';
        configureHallBar('changshou');
      }
      this._nearStupa = false;
      this._nearbyDeedId = null;
      this._nearbyBuddhaIdx = null;
      this._nearbySutraId = null;
      this._nearbyFlowerGardenId = null;
      this._nearbyLotusPondId = null;
      this._nearbyChangshouSeatIdx = null;

      if (!this.isSeatedOnMat && pPos.x < -94.4 && Math.abs(pPos.z - 4.0) < 4.2) {
        if (!this.areHallOfferingsComplete('changshou')) {
          this._nearChangshou = false;
          this._nearOfferingTableHall = 'changshou';
          this.renderHallOfferingTablePrompt(promptEl, 'changshou');
          return;
        }
        if ((this._offeringActiveUntil || 0) > Date.now()) {
          this._nearChangshou = false;
          this._nearOfferingTableHall = null;
          promptEl.style.display = 'none';
          return;
        }
        this._nearOfferingTableHall = null;
        this._nearChangshou = true;
        const cData = window.GAME_DATA.CHANGSHOU_DATA || {};
        const cName = this.dField(cData, 'name', 'cnName') || this.t('Amitayus Buddha', '长寿佛');
        const cTitle = this.dField(cData, 'title', 'zhTitle') || this.t('Buddha of Infinite Life', '南无无量寿佛');
        const cWish = this.dField(cData, 'wishAndBenefit', 'zhWishAndBenefit') || this.t('May all beings enjoy long life and peace.', '愿诸众生健康长寿、福慧圆满。');
        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1">
            <div class="talk-portrait-col"><div class="talk-avatar-frame">🏺</div><div class="talk-speaker-badge">${cName}</div></div>
            <div class="talk-bubble-body">
              <div class="box-tag"><span>✨ ${cTitle}</span></div>
              <div class="box-title">✨ "${cWish}"</div>
            </div>
          </div>
          <div class="quest-box-2">
            <div class="box-tag"><span>${this.t('🏺 Longevity Quest', '🏺 礼敬长寿佛')}</span><span>${this.state.bowedChangshou ? this.t('✅ Done', '✅ 已完成') : this.t('+10 VP', '+10 功德')}</span></div>
            <button class="quest-enter-btn" onclick="window.game.bowToChangshouQuest()">
              <span>${this.t('🙏 Bow to 长寿佛', '🙏 礼敬长寿佛')}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }
      this._nearChangshou = false;

      if (!this.isSeatedOnMat && this.changshouSeats && this.changshouSeats.length > 0) {
        let bestSeatIdx = -1;
        let bestSeatDist = Infinity;
        this.changshouSeats.forEach((s) => {
          const d = Math.hypot(pPos.x - s.x, pPos.z - s.z);
          if (d < bestSeatDist) {
            bestSeatDist = d;
            bestSeatIdx = s.idx;
          }
        });
        if (bestSeatIdx >= 0 && bestSeatDist < 1.45) {
          this._nearbyChangshouSeatIdx = bestSeatIdx;
          if (!isMobile) {
            promptEl.style.display = 'flex';
            promptEl.innerHTML = `
              <div class="quest-box-1" style="padding:10px 14px;">
                <div class="talk-portrait-col"><div class="talk-avatar-frame">🧘</div><div class="talk-speaker-badge">${this.t(`Seat #${bestSeatIdx + 1}/20`, `第 ${bestSeatIdx + 1}/20 座`)}</div></div>
                <div class="talk-bubble-body">
                  <div class="box-title">${this.t('Sit and meditate peacefully (+10 VP).', '面向长寿佛安坐打坐（+10 功德）。')}</div>
                </div>
              </div>
              <div class="quest-box-2">
                <button class="quest-enter-btn" onclick="window.game.meditateInChangshouHall(${bestSeatIdx})">
                  <span>${this.t('🧘 Sit & Meditate', '🧘 打坐静修')}</span>
                  <span class="enter-key-badge">⏎ E</span>
                </button>
              </div>
            `;
            return;
          }
        }
      }

      promptEl.style.display = 'none';
      return;
    }
    this._nearChangshou = false;
    this._nearbyChangshouSeatIdx = null;

    // When the user enters the 7-Buddha Prayer Hall, show the 5-Action Selection Box!
    if (insidePrayerHall || this.isSeatedOnMat) {
      if (hallBarEl) {
        hallBarEl.style.display = 'flex';
        configureHallBar(false);
      }
      this._nearStupa = false;
      this._nearbyDeedId = null;

      // Near 7-Buddha Altar Table (z < -11.8): show offerings first, then Bow to Buddhas once all 3 offerings are complete
      if (!this.isSeatedOnMat && pPos.z < -11.8 && this.buddhaStatues.length > 0) {
        if (!this.areHallOfferingsComplete('prayer')) {
          this._nearbyBuddhaIdx = null;
          this._nearOfferingTableHall = 'prayer';
          this.renderHallOfferingTablePrompt(promptEl, 'prayer');
          return;
        }
        if ((this._offeringActiveUntil || 0) > Date.now()) {
          this._nearbyBuddhaIdx = null;
          this._nearOfferingTableHall = null;
          promptEl.style.display = 'none';
          return;
        }
        this._nearOfferingTableHall = null;
        let bestIdx = 0;
        let minD = Infinity;
        this.buddhaStatues.forEach((bs, idx) => {
          const d = Math.abs(pPos.x - bs.bx);
          if (d < minD) {
            minD = d;
            bestIdx = idx;
          }
        });
        this._nearbyBuddhaIdx = bestIdx;
        const curB = window.GAME_DATA.SEVEN_BUDDHAS[bestIdx];
        const displayNumName = `${bestIdx + 1}. ${this.isZh() ? (curB.cnName || curB.name) : curB.name}`;
        const curTitle = this.dField(curB, 'title', 'zhTitle');
        const curWish = this.isZh() ? (curB.zhWishAndBenefit || curB.zhBuddhaWish) : (curB.wishAndBenefit || curB.buddhaWish);
        const alreadyBowed = !!(this.state.bowedBuddhas && this.state.bowedBuddhas[bestIdx]);

        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1">
            <div class="talk-portrait-col">
              <div class="talk-avatar-frame">🙏</div>
              <div class="talk-speaker-badge">${displayNumName}</div>
            </div>
            <div class="talk-bubble-body">
              <div class="box-tag">
                <span>✨ ${curTitle}</span>
              </div>
              <div class="box-title">✨ ${curWish}</div>
            </div>
          </div>
          <div class="quest-box-2">
            <div class="box-tag"><span>${this.t('🙏 7-Buddha Bow', '🙏 礼拜七佛')}</span><span>${alreadyBowed ? this.t('✅ Done', '✅ 已完成') : this.t('+10 VP', '+10 功德')}</span></div>
            <button class="quest-enter-btn" onclick="window.game.bowToSpecificBuddhaQuest(${bestIdx})">
              <span>${this.t(`🙏 Bow ${displayNumName}`, `🙏 礼拜 ${displayNumName}`)}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }

      this._nearbyBuddhaIdx = null;
      promptEl.style.display = 'none';
      this._lastSpokenPromptId = null;
      return;
    } else if (hallBarEl) {
      hallBarEl.style.display = 'none';
    }
    this._nearbyBuddhaIdx = null;

    // 0. Near any of the 7 White Stupas on Mount Wutai Path!
    let closestStupaIdx = -1;
    let closestStupaDist = Infinity;
    (this.stupaList || []).forEach((st, idx) => {
      const d = Math.hypot(pPos.x - st.pos.x, pPos.z - st.pos.z);
      if (d < closestStupaDist) {
        closestStupaDist = d;
        closestStupaIdx = idx;
      }
    });
    if (closestStupaIdx >= 0 && closestStupaDist < 5.6) {
      const stObj = this.stupaList[closestStupaIdx];
      this.activeStupaIdx = closestStupaIdx;
      this.stupaPos.copy(stObj.pos);
      this._nearStupa = true;
      this._nearbyDeedId = null;
      this._nearbySutraId = null;
      const pct = Math.min(100, Math.round((this.stupaClockwiseAngle / (Math.PI * 2)) * 100));
      const circledCnt = this.getCircledStupaCount();
      const nextReqIdx = this.getNextUncircledStupaIdx();
      const alreadyCircled = !!(this.state.circledStupas && this.state.circledStupas[closestStupaIdx]);
      const stBenefit = this.dField(stObj.data, 'wishAndBenefit', 'zhWishAndBenefit') || this.t('Brings calm wisdom and opens Manjushri Hall.', '成就清净智慧，开启文殊殿大门。');
      const stLabel = this.dField(stObj.data, 'label', 'zhLabel') || this.dField(stObj.data, 'name', 'zhName');

      let btnLabel = this.t(`☸️ Circle Stupa #${closestStupaIdx + 1} Clockwise (1/1)`, `☸️ 顺时针绕第 ${closestStupaIdx + 1} 座白塔一圈`);
      let statusBadge = this.t(`In Order (${circledCnt}/7)`, `按序绕塔 (${circledCnt}/7)`);
      if (alreadyCircled) {
        statusBadge = this.t('✅ Circled', '✅ 已圆满');
        btnLabel = nextReqIdx === -1
          ? this.t('🦁 Enter Manjushri Hall', '🦁 进入文殊殿')
          : this.t(`➡️ Go to Next: Stupa #${nextReqIdx + 1}`, `➡️ 前往下一座：第 ${nextReqIdx + 1} 座白塔`);
      } else if (nextReqIdx !== -1 && closestStupaIdx !== nextReqIdx) {
        statusBadge = this.t(`Next is #${nextReqIdx + 1}`, `下一座为第 ${nextReqIdx + 1} 座`);
        btnLabel = this.t(`☸️ Go to Stupa #${nextReqIdx + 1} (In Order)`, `☸️ 请先按序绕第 ${nextReqIdx + 1} 座白塔`);
      }

      const stupaSpeech = this.t(`White Stupa #${closestStupaIdx + 1}: ${stBenefit}`, `第 ${closestStupaIdx + 1} 座白塔功德：${stBenefit}`);
      if (this._lastSpokenPromptId !== `stupa_${closestStupaIdx}`) {
        this._lastSpokenPromptId = `stupa_${closestStupaIdx}`;
        window.templeAudio.speakText(stupaSpeech, false);
      }

      promptEl.style.display = 'flex';
      promptEl.innerHTML = `
        <div class="quest-box-1">
          <div class="talk-portrait-col">
            <div class="talk-avatar-frame">☸️</div>
            <div class="talk-speaker-badge">${this.t(`Stupa #${closestStupaIdx + 1}/7`, `白塔 #${closestStupaIdx + 1}/7`)}</div>
          </div>
          <div class="talk-bubble-body">
            <div class="box-tag">
              <span class="quest-instruction-pill">📍 ${stLabel} (${pct}% · ${circledCnt}/7)</span>
              <button class="listen-voice-btn" onclick="window.templeAudio.speakText('${stupaSpeech.replace(/'/g, "\\'")}', true)">${this.t('🔊 Listen', '🔊 朗读')}</button>
            </div>
            <div class="box-title">✨ "${stBenefit}"</div>
          </div>
        </div>
        <div class="quest-box-2">
          <div class="box-tag"><span>${this.t('✨ Stupa Benefit', '✨ 绕塔功德利益')}</span><span>${statusBadge}</span></div>
          <button class="quest-enter-btn" onclick="window.game.startClockwiseStupaWalk(${closestStupaIdx})">
            <span>${btnLabel}</span>
            <span class="enter-key-badge">⏎ ${this.t('Enter', '绕塔')}</span>
          </button>
        </div>
      `;
      return;
    }
    this._nearStupa = false;

    // 0B. Near any Sutra Book Reading Chair Station ascending Mount Wutai!
    this._nearbySutraId = null;
    for (const st of (this.sutraStations || [])) {
      if (Math.hypot(pPos.x - st.pos.x, pPos.z - st.pos.z) < 4.2) {
        this._nearbySutraId = st.book.id;
        const isRead = !!(this.state.readSutras && this.state.readSutras[st.book.id]);
        const bkTitle = this.dField(st.book, 'title', 'zhTitle');
        const onePara = (this.isZh()
          ? (st.book.zhPages && st.book.zhPages[0])
          : (st.book.pages && st.book.pages[0])) || bkTitle;
        const cleanSpeech = String(onePara).replace(/['"\\]/g, '');
        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1">
            <div class="talk-portrait-col"><div class="talk-avatar-frame">📖</div><div class="talk-speaker-badge">${bkTitle}</div></div>
            <div class="talk-bubble-body">
              <div class="box-tag">
                <span>${this.t('✨ Study Table', '✨ 五台山学习桌')} · ${isRead ? this.t('✅ Done', '✅ 已学') : this.t('+5 VP', '+5 功德')}</span>
                <button class="listen-voice-btn" onclick="window.templeAudio.speakText('${cleanSpeech}', true)">${this.t('🔊 Listen', '🔊 朗读')}</button>
              </div>
              <div class="box-title" style="font-size:16.5px; line-height:1.45;">${onePara}</div>
            </div>
          </div>
          <div class="quest-box-2">
            <button class="quest-enter-btn" onclick="window.game.visitAndReadSutra('${st.book.id}')">
              <span>${isRead ? this.t('📖 Review Study', '📖 再次温习') : this.t('📖 Sit & Study', '📖 坐下学习')}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }
    }

    // 0C. Near any West Flower Garden (floriculture along avenue to 长寿殿)
    this._nearbyFlowerGardenId = null;
    for (const st of (this.flowerGardenStations || [])) {
      const gPos = st.garden ? st.garden.pos : (st.group ? st.group.position : null);
      if (gPos && Math.hypot(pPos.x - gPos.x, pPos.z - gPos.z) < 4.8) {
        this._nearbyFlowerGardenId = st.garden.id;
        const isPlanted = !!(this.state.plantedFlowerGardens && this.state.plantedFlowerGardens[st.garden.id]);
        const gTitle = this.dField(st.garden, 'title', 'zhTitle');
        const gDesc = this.dField(st.garden, 'desc', 'zhDesc');
        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1">
            <div class="talk-portrait-col"><div class="talk-avatar-frame">🌸</div><div class="talk-speaker-badge">${this.t('Flower Garden', '西苑百花园')}</div></div>
            <div class="talk-bubble-body">
              <div class="box-tag"><span>✨ ${gTitle}</span><span>${isPlanted ? this.t('✅ Bloomed', '✅ 鲜花盛开') : this.t('+5 VP', '+5 功德')}</span></div>
              <div class="box-title">${gDesc}</div>
            </div>
          </div>
          <div class="quest-box-2">
            <button class="quest-enter-btn" onclick="window.game.plantFlowerGarden('${st.garden.id}')">
              <span>${isPlanted ? this.t('🌺 Admire Blossoms', '🌺 欣赏百花盛开') : this.t('🌱 Plant Flowers (+5 VP)', '🌱 亲手种下鲜花 (+5 功德)')}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }
    }

    // 0D. Near any of the 4 West Sacred Flower Ponds (优钵罗花 · 波头摩 · 分陀利花 · 拘物头花)
    this._nearbyLotusPondId = null;
    for (const st of (this.lotusPondStations || [])) {
      const lPos = st.pond ? st.pond.pos : (st.group ? st.group.position : null);
      if (lPos && Math.hypot(pPos.x - lPos.x, pPos.z - lPos.z) < 5.2) {
        this._nearbyLotusPondId = st.pond.id;
        const isPlanted = !!(this.state.plantedLotusPonds && this.state.plantedLotusPonds[st.pond.id]);
        const pTitle = this.dField(st.pond, 'title', 'zhTitle');
        const pDesc = this.dField(st.pond, 'desc', 'zhDesc');
        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1">
            <div class="talk-portrait-col"><div class="talk-avatar-frame">🪷</div><div class="talk-speaker-badge">${this.t('Flower Pond', '圣花宝池')}</div></div>
            <div class="talk-bubble-body">
              <div class="box-tag"><span>✨ ${pTitle}</span><span>${isPlanted ? this.t('✅ Blooming', '✅ 圣花盛绽') : this.t('+5 VP', '+5 功德')}</span></div>
              <div class="box-title">${pDesc}</div>
            </div>
          </div>
          <div class="quest-box-2">
            <button class="quest-enter-btn" onclick="window.game.plantLotusPond('${st.pond.id}')">
              <span>${isPlanted ? this.t('🪷 Admire Sacred Flowers', '🪷 瞻仰圣花宝池') : this.t('🪷 Plant Sacred Flowers (+5 VP)', '🪷 池中栽种圣花 (+5 功德)')}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }
    }

    // Near any Uncompleted Good Deed Location (or the Bodhi Wishing Tree anytime!)
    this._nearbyDeedId = null;
    for (const st of this.deedStations) {
      const isWishingTree = st.deed.id === 'good_wishes';
      if (!this.state.completedDeeds[st.deed.id] || isWishingTree) {
        const d = Math.hypot(pPos.x - st.deed.pos.x, pPos.z - st.deed.pos.z);
        if (d < 8.2) {
          this._nearbyDeedId = st.deed.id;
          const dNpc = this.dField(st.deed, 'npcName', 'zhNpcName') || this.t('Friend', '善友');
          const dLandmark = this.dField(st.deed, 'landmarkName', 'zhLandmarkName');
          const dTaskText = this.dField(st.deed, 'taskBoxText', 'zhTaskBoxText');
          const dLesson = this.dField(st.deed, 'virtueLesson', 'zhVirtueLesson') || this.t('Virtue: Kindness & Compassion', '善心：慈悲与利他');
          const dActionLabel = this.dField(st.deed, 'actionButtonLabel', 'zhActionButtonLabel');
          const cleanSpeech = (dTaskText || '').replace(/["“”]/g, '');
          const escapedForAttr = cleanSpeech.replace(/'/g, "\\'");

          if (this._lastSpokenPromptId !== st.deed.id) {
            this._lastSpokenPromptId = st.deed.id;
            window.templeAudio.speakText(this.t(`${dNpc} says: ${cleanSpeech}`, `${dNpc}说：${cleanSpeech}`), false);
          }

          const speakerImgSrc = st.deed.speakerImg
            ? ((window.INLINE_ASSETS && window.INLINE_ASSETS[st.deed.speakerImg]) || st.deed.speakerImg)
            : '';
          const avatarHtml = speakerImgSrc
            ? `<img src="${speakerImgSrc}" alt="${dNpc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : (st.deed.speakerEmoji || st.deed.emoji);

          promptEl.style.display = 'flex';
          promptEl.innerHTML = `
            <div class="quest-box-1">
              <div class="talk-portrait-col">
                <div class="talk-avatar-frame">${avatarHtml}</div>
                <div class="talk-speaker-badge">${dNpc}</div>
              </div>
              <div class="talk-bubble-body">
                <div class="box-tag">
                  <span class="quest-instruction-pill">${this.t('📜 QUEST INSTRUCTION', '📜 善行任务说明')} · 📍 ${dLandmark}</span>
                  <button class="listen-voice-btn" onclick="window.templeAudio.speakText('${escapedForAttr}', true)">${this.t('🔊 Listen', '🔊 朗读')}</button>
                </div>
                <div class="box-title">${dTaskText}</div>
                <div class="talk-lesson-pill">🌟 ${dLesson}</div>
              </div>
            </div>
            <div class="quest-box-2">
              <div class="box-tag"><span>✨ ${isWishingTree ? this.t('8 Good Wishes', '八大善愿挂牌') : this.t('Good Deed Quest', '行善积德任务')}</span><span>+${st.deed.points} ${this.t('VP', '功德')}</span></div>
              <button class="quest-enter-btn" onclick="window.game.performGoodDeed('${st.deed.id}')">
                <span>${isWishingTree ? this.t('🌳 Choose 8 Wishes', '🌳 选择挂祈愿牌') : dActionLabel}</span>
                <span class="enter-key-badge">⏎ ${this.t('Enter', '执行')}</span>
              </button>
            </div>
          `;
          return;
        }
      }
    }

    // Near the Giant Bronze Temple Bell Pavilion
    this._nearBell = false;
    const bellPos = window.GAME_DATA.BELL_PAVILION_POS;
    if (bellPos && Math.hypot(pPos.x - bellPos.x, pPos.z - bellPos.z) < 6.4) {
      this._nearBell = true;
      promptEl.style.display = 'flex';
      promptEl.innerHTML = `
        <div class="quest-box-1" style="padding:10px 14px;">
          <div class="talk-portrait-col"><div class="talk-avatar-frame">🔔</div><div class="talk-speaker-badge">${this.t('Bell Pavilion', '梵钟宝亭')}</div></div>
          <div class="talk-bubble-body">
            <div class="box-title">${this.t('"Strike the sacred bronze bell softly and listen as peace fills the mountain valley."', '“轻叩寺院铜钟，聆听洪亮梵音回荡清凉山谷。”')}</div>
          </div>
        </div>
        <div class="quest-box-2">
          <button class="quest-enter-btn" onclick="window.game.ringTempleBell()">
            <span>${this.t('🔔 Ring Temple Bell', '🔔 撞响寺院大钟')}</span>
            <span class="enter-key-badge">⏎ E</span>
          </button>
        </div>
      `;
      return;
    }

    // Near a Scenic Sit & Contemplate Pier or River Bench
    this._nearbySeat = null;
    for (const seat of (window.GAME_DATA.SCENIC_SEATS || [])) {
      if (Math.hypot(pPos.x - seat.x, pPos.z - seat.z) < 3.6) {
        this._nearbySeat = seat;
        const alreadySeated = this.seatedScenic && this.seatedScenic.id === seat.id;
        const seatName = this.dField(seat, 'name', 'zhName');
        promptEl.style.display = 'flex';
        promptEl.innerHTML = `
          <div class="quest-box-1" style="padding:10px 14px;">
            <div class="talk-portrait-col"><div class="talk-avatar-frame">${seat.emoji}</div><div class="talk-speaker-badge">${seatName}</div></div>
            <div class="talk-bubble-body">
              <div class="box-title">${alreadySeated ? this.t('"Breathe gently and enjoy the quiet waters and mountain breeze."', '“调匀呼吸，静赏池水清风与白花禅意。”') : this.t(`"A quiet meditation seat awaits at ${seatName}."`, `“${seatName} 备有清净禅座，可供静坐小憩。”`)}</div>
            </div>
          </div>
          <div class="quest-box-2">
            <button class="quest-enter-btn" onclick="window.game.toggleSitScenicSpot(window.GAME_DATA.SCENIC_SEATS.find(s => s.id === '${seat.id}'))">
              <span>${alreadySeated ? this.t('🚶 Stand Up', '🚶 起身离座') : this.t('🧘 Sit & Enjoy View', '🧘 花下禅坐静休')}</span>
              <span class="enter-key-badge">⏎ E</span>
            </button>
          </div>
        `;
        return;
      }
    }

    // In front of Prayer Hall, 文殊殿, or 长寿佛殿: Teleport back to Starting Point
    const hp = this.playerGroup.position;
    const inFrontOfPrayerHall = Math.abs(hp.x) < 5.5 && hp.z >= 0.0 && hp.z < 11.2;
    const inFrontOfWenshuHall = hp.x > 106.5 && hp.x < 116.5 && Math.abs(hp.z - 4.0) < 5.5;
    const inFrontOfChangshouHall = hp.x < -78.5 && hp.x > -88.5 && Math.abs(hp.z - 4.0) < 5.5;
    this._nearHallTeleportStart = !this.isSeatedOnMat
      && this.currentScene === 'public_temple'
      && (inFrontOfPrayerHall || inFrontOfWenshuHall || inFrontOfChangshouHall);
    if (this._nearHallTeleportStart) {
      const hallLabel = inFrontOfWenshuHall
        ? this.t('In Front of Manjushri Hall', '文殊殿前')
        : (inFrontOfChangshouHall
          ? this.t('In Front of Longevity Hall', '长寿佛殿前')
          : this.t('In Front of 7-Buddha Prayer Hall', '七佛宝殿前'));
      promptEl.style.display = 'flex';
      promptEl.innerHTML = `
        <div class="quest-box-1" style="padding:10px 14px;">
          <div class="talk-portrait-col"><div class="talk-avatar-frame">⛰️</div><div class="talk-speaker-badge">${hallLabel}</div></div>
          <div class="talk-bubble-body">
            <div class="box-title">${this.t('Teleport directly back to the mountain-top Starting Point (Home Trailhead).', '点击或按 [E] 键，即可直接传送回山顶家园起点。')}</div>
          </div>
        </div>
        <div class="quest-box-2">
          <button class="quest-enter-btn" onclick="window.game.teleportToStartingPoint()">
            <span>${this.t('⛰️ Teleport to Start', '⛰️ 传送回起点')}</span>
            <span class="enter-key-badge">⏎ E</span>
          </button>
        </div>
      `;
      return;
    }

    this._lastSpokenPromptId = null;
    promptEl.style.display = 'none';
  }

  // -------------------- PICTURE #4 CHAIR REST BLOSSOM OVERLAY --------------------
  openChairRestBlossomOverlay(spotLabel) {
    const overlay = document.getElementById('chair-rest-blossom-overlay');
    if (!overlay) return;
    const titleEl = document.getElementById('blossom-rest-title');
    if (titleEl) titleEl.textContent = spotLabel || this.t('🌸 Mindful Rest Beneath White Blossoms', '🌸 花下静坐息心');
    const imgEl = document.getElementById('chair-rest-blossom-img');
    if (imgEl && window.INLINE_ASSETS && window.INLINE_ASSETS['assets/chair_rest_blossom.jpg']) {
      imgEl.src = window.INLINE_ASSETS['assets/chair_rest_blossom.jpg'];
    }
    overlay.classList.remove('hidden');
  }

  closeChairRestBlossomOverlay() {
    const overlay = document.getElementById('chair-rest-blossom-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // -------------------- 100x AMITOFO 5-SECOND SHARED SKY VISION --------------------
  triggerAmitofo100SkyVision(speakerName, shouldBroadcast = false) {
    const dispSpeaker = speakerName || this.t('Pilgrim', '善信');
    const overlay = document.getElementById('amitofo-sky-quest-overlay');
    const tagEl = document.getElementById('sky-vision-player-tag');
    const imgEl = document.getElementById('amitofo-sky-vision-img');
    const imgSrc = (window.INLINE_ASSETS && window.INLINE_ASSETS['assets/amitofo_sky_vision.jpg']) || 'assets/amitofo_sky_vision.jpg';

    if (imgEl && imgEl.getAttribute('src') !== imgSrc) {
      imgEl.src = imgSrc;
    }
    if (tagEl) {
      tagEl.textContent = this.t(
        `🙏 ${dispSpeaker} chanted 100× "Nanmo Amitofo" · Shared Across All Realms`,
        `🙏 ${dispSpeaker} 念满 100 声「南无阿弥陀佛」· 十方共瞻`
      );
    }
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.animation = 'none';
      void overlay.offsetWidth;
      overlay.style.animation = '';
    }

    // Also project Picture #1 in the 3D Sky above the sanctuary for 5 seconds!
    if (this._skyVisionMesh) {
      this.scene.remove(this._skyVisionMesh);
      this._skyVisionMesh = null;
    }
    if (!this._skyVisionTex) {
      this._skyVisionTex = new THREE.TextureLoader().load(imgSrc);
    }
    const skyPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 24),
      new THREE.MeshBasicMaterial({
        map: this._skyVisionTex,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    const pPos = this.playerGroup ? this.playerGroup.position : new THREE.Vector3(0, 0, 20);
    skyPlane.position.set(pPos.x, Math.max(24, pPos.y + 18), pPos.z - 28);
    this.scene.add(skyPlane);
    this._skyVisionMesh = skyPlane;

    window.templeAudio.playGateOpenFanfare();
    this.showToast(this.t(
      `✨ ${dispSpeaker} reached 100 prayers of Nanmo Amitofo — Sky Vision appears for 5s!`,
      `✨ ${dispSpeaker} 念满 100 声南无阿弥陀佛，天现祥瑞圣境 (5秒)！`
    ));

    clearTimeout(this._skyVisionTimer);
    this._skyVisionTimer = setTimeout(() => {
      if (overlay) overlay.classList.add('hidden');
      if (this._skyVisionMesh) {
        this.scene.remove(this._skyVisionMesh);
        this._skyVisionMesh = null;
      }
    }, 5000);

    if (shouldBroadcast) {
      const ts = Date.now();
      this._seenMpEvents.add(`${this.mpClientId}:${ts}`);
      this.broadcastMultiplayerEvent({
        type: 'amitofo100',
        id: this.mpClientId,
        name: dispSpeaker,
        ts
      });
    }
  }

  // -------------------- MULTI-USER REALTIME PRESENCE (DISABLED FOR NOW) --------------------
  initMultiplayer() {
    this._multiplayerEnabled = false;
    this.mpClientId = `p_${Math.random().toString(36).slice(2, 10)}`;
    this.remotePlayers = {};
    this._seenMpEvents = new Set();
    this._mpBroadcastTimer = 0;
    this._mpPollTimer = 0;
    this._presenceApiSupported = false;
    this._mqttRxBuf = new Uint8Array(0);
    this._mqttReady = false;
    this._mqttKeepaliveTimer = 0;

    const pill = document.getElementById('online-pilgrims-pill');
    if (pill) pill.style.display = 'none';
    if (!this._multiplayerEnabled) return;

    const hostKey = (window.location.host || 'local').replace(/[^a-zA-Z0-9_-]/g, '_');
    this._mqttTopic = `shuiyuetu/sanctuary/${hostKey}/presence`;

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this._bc = new BroadcastChannel(`shuiyuetu_sync_${hostKey}`);
        this._bc.onmessage = (ev) => {
          if (ev && ev.data) this.handleRemotePresenceMessage(ev.data);
        };
      } catch (e) {
        this._bc = null;
      }
    }

    this._connectMqttSocket([
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ], 0);
    this.updateOnlinePilgrimsCount();
  }

  _mqttEncodeStr(str) {
    const bytes = new TextEncoder().encode(str);
    const out = new Uint8Array(2 + bytes.length);
    out[0] = (bytes.length >> 8) & 0xff;
    out[1] = bytes.length & 0xff;
    out.set(bytes, 2);
    return out;
  }

  _mqttBuildPacket(typeByte, parts) {
    let bodyLen = 0;
    parts.forEach((p) => { bodyLen += p.length; });
    const rem = [];
    let len = bodyLen;
    do {
      let b = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) b |= 0x80;
      rem.push(b);
    } while (len > 0);
    const pkt = new Uint8Array(1 + rem.length + bodyLen);
    pkt[0] = typeByte;
    rem.forEach((b, i) => { pkt[1 + i] = b; });
    let off = 1 + rem.length;
    parts.forEach((p) => {
      pkt.set(p, off);
      off += p.length;
    });
    return pkt;
  }

  _connectMqttSocket(urls, idx) {
    if (!urls || idx >= urls.length || typeof WebSocket === 'undefined') return;
    if (window.location.protocol === 'file:') return;
    try {
      const ws = new WebSocket(urls[idx], 'mqtt');
      ws.binaryType = 'arraybuffer';
      this._mqttWs = ws;
      this._mqttReady = false;
      let opened = false;

      ws.onopen = () => {
        opened = true;
        const vh = new Uint8Array([0x00, 0x04, 77, 81, 84, 84, 0x04, 0x02, 0x00, 60]);
        const cid = this._mqttEncodeStr(`syt_${this.mpClientId}`);
        ws.send(this._mqttBuildPacket(0x10, [vh, cid]));
      };

      ws.onmessage = (ev) => {
        const chunk = new Uint8Array(ev.data);
        const merged = new Uint8Array(this._mqttRxBuf.length + chunk.length);
        merged.set(this._mqttRxBuf, 0);
        merged.set(chunk, this._mqttRxBuf.length);
        this._mqttRxBuf = merged;

        while (this._mqttRxBuf.length >= 2) {
          let mult = 1;
          let remLen = 0;
          let pos = 1;
          let byte = 0;
          let completeHeader = true;
          do {
            if (pos >= this._mqttRxBuf.length) {
              completeHeader = false;
              break;
            }
            byte = this._mqttRxBuf[pos++];
            remLen += (byte & 0x7f) * mult;
            mult *= 128;
          } while ((byte & 0x80) !== 0);
          if (!completeHeader || this._mqttRxBuf.length < pos + remLen) break;

          const pktType = (this._mqttRxBuf[0] >> 4) & 0x0f;
          const pktFlags = this._mqttRxBuf[0] & 0x0f;
          const body = this._mqttRxBuf.slice(pos, pos + remLen);
          this._mqttRxBuf = this._mqttRxBuf.slice(pos + remLen);

          if (pktType === 2) {
            this._mqttReady = true;
            const pid = new Uint8Array([0x00, 0x01]);
            const topicFilter = this._mqttEncodeStr(this._mqttTopic);
            ws.send(this._mqttBuildPacket(0x82, [pid, topicFilter, new Uint8Array([0x00])]));
            this.broadcastPresenceState(true);
          } else if (pktType === 3 && body.length >= 2) {
            const tLen = (body[0] << 8) | body[1];
            const qos = (pktFlags >> 1) & 0x03;
            const pStart = 2 + tLen + (qos > 0 ? 2 : 0);
            if (pStart < body.length) {
              try {
                const txt = new TextDecoder().decode(body.slice(pStart));
                const msg = JSON.parse(txt);
                this.handleRemotePresenceMessage(msg);
              } catch (e) { /* ignore malformed remote payload */ }
            }
          }
        }
      };

      ws.onerror = () => {
        this._mqttReady = false;
      };
      ws.onclose = () => {
        this._mqttReady = false;
        if (!opened && idx + 1 < urls.length) {
          this._connectMqttSocket(urls, idx + 1);
        }
      };
    } catch (e) {
      this._mqttReady = false;
    }
  }

  _mqttPublishObj(obj) {
    if (!this._mqttReady || !this._mqttWs || this._mqttWs.readyState !== 1) return;
    try {
      const topicBytes = this._mqttEncodeStr(this._mqttTopic);
      const payloadBytes = new TextEncoder().encode(JSON.stringify(obj));
      this._mqttWs.send(this._mqttBuildPacket(0x30, [topicBytes, payloadBytes]));
    } catch (e) { /* ignore send errors */ }
  }

  broadcastMultiplayerEvent(payload) {
    if (!this._multiplayerEnabled) return;
    if (this._bc) {
      try { this._bc.postMessage(payload); } catch (e) { /* ignore */ }
    }
    this._mqttPublishObj(payload);
    if (this._presenceApiSupported) {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then((res) => {
        if (res.status === 404 || res.status === 405) this._presenceApiSupported = false;
      }).catch(() => {});
    }
  }

  broadcastPresenceState(forceEventOnly = false) {
    if (!this._multiplayerEnabled || !this.playerGroup || !this.mpClientId) return;
    const p = this.playerGroup.position;
    const msg = {
      type: 'pos',
      id: this.mpClientId,
      name: this.state.playerName || '善信',
      x: Math.round(p.x * 100) / 100,
      y: Math.round(p.y * 100) / 100,
      z: Math.round(p.z * 100) / 100,
      ry: Math.round(this.playerGroup.rotation.y * 100) / 100,
      scene: this.currentScene || 'public_temple',
      pose: this.poseMode || 'idle',
      moving: !!this._lastIsMoving && !forceEventOnly,
      ts: Date.now()
    };
    this.broadcastMultiplayerEvent(msg);
  }

  handleRemotePresenceMessage(msg) {
    if (!this._multiplayerEnabled) return;
    if (!msg || !msg.id || msg.id === this.mpClientId) return;
    if (msg.type === 'amitofo100') {
      const key = `${msg.id}:${msg.ts || 0}`;
      if (!this._seenMpEvents.has(key)) {
        this._seenMpEvents.add(key);
        this.triggerAmitofo100SkyVision(msg.name || '同游行者', false);
      }
      return;
    }

    let rp = this.remotePlayers[msg.id];
    if (!rp) {
      const mesh = window.TempleModels3D.createCuteRedTibetanMonkParts(THREE);
      mesh.position.set(msg.x || 0, msg.y || 0, msg.z || 105);
      this.scene.add(mesh);
      const labelPos = mesh.position.clone().add(new THREE.Vector3(0, 2.25, 0));
      const labelEl = this.addWorldLabel(`🧘 ${msg.name || '善信'}`, labelPos, msg.scene || 'public_temple');
      labelEl.classList.add('remote-player-label');
      rp = {
        id: msg.id,
        name: msg.name || '善信',
        mesh,
        parts: mesh.userData || {},
        targetPos: new THREE.Vector3(msg.x || 0, msg.y || 0, msg.z || 105),
        targetRotY: msg.ry || 0,
        scene: msg.scene || 'public_temple',
        pose: msg.pose || 'idle',
        moving: !!msg.moving,
        labelEl,
        labelPos,
        lastSeen: performance.now()
      };
      this.remotePlayers[msg.id] = rp;
      this.updateOnlinePilgrimsCount();
    } else {
      rp.name = msg.name || rp.name;
      rp.targetPos.set(msg.x || 0, msg.y || 0, msg.z || 0);
      rp.targetRotY = msg.ry || 0;
      rp.scene = msg.scene || 'public_temple';
      rp.pose = msg.pose || 'idle';
      rp.moving = !!msg.moving;
      rp.lastSeen = performance.now();
      if (rp.labelEl) rp.labelEl.textContent = `🧘 ${rp.name}`;
    }
  }

  updateOnlinePilgrimsCount() {
    const el = document.getElementById('online-pilgrims-count');
    if (el) el.textContent = String(1 + Object.keys(this.remotePlayers || {}).length);
  }

  updateMultiplayer(dt, elapsed) {
    // Keep 3D sky vision billboard facing active camera while visible
    if (this._skyVisionMesh && this.camera) {
      this._skyVisionMesh.lookAt(this.camera.position);
    }
    if (!this._multiplayerEnabled || !this.mpClientId) return;

    // Periodic presence publish (~6 Hz when moving, 2.5s heartbeat when still)
    this._mpBroadcastTimer += dt;
    const interval = this._lastIsMoving ? 0.16 : 2.5;
    if (this._mpBroadcastTimer >= interval) {
      this._mpBroadcastTimer = 0;
      this.broadcastPresenceState();
    }

    // MQTT keepalive ping every 35s
    if (this._mqttReady && this._mqttWs && this._mqttWs.readyState === 1) {
      this._mqttKeepaliveTimer += dt;
      if (this._mqttKeepaliveTimer >= 35) {
        this._mqttKeepaliveTimer = 0;
        try { this._mqttWs.send(new Uint8Array([0xC0, 0x00])); } catch (e) { /* ignore */ }
      }
    }

    // Poll /api/presence on servers that support it (local dev / dynamic backend)
    if (this._presenceApiSupported) {
      this._mpPollTimer += dt;
      if (this._mpPollTimer >= 0.45) {
        this._mpPollTimer = 0;
        fetch(`/api/presence?self=${encodeURIComponent(this.mpClientId)}`)
          .then((res) => {
            if (res.status === 404 || res.status === 405) {
              this._presenceApiSupported = false;
              return null;
            }
            return res.ok ? res.json() : null;
          })
          .then((data) => {
            if (!data) return;
            (data.peers || []).forEach((p) => this.handleRemotePresenceMessage(p));
            (data.events || []).forEach((ev) => this.handleRemotePresenceMessage(ev));
          })
          .catch(() => {});
      }
    }

    // Interpolate and animate all remote characters + expire disconnected peers
    const now = performance.now();
    let changed = false;
    Object.keys(this.remotePlayers).forEach((pid) => {
      const rp = this.remotePlayers[pid];
      if (now - rp.lastSeen > 18000) {
        this.scene.remove(rp.mesh);
        if (rp.labelEl && rp.labelEl.parentNode) rp.labelEl.parentNode.removeChild(rp.labelEl);
        this.worldLabelItems = this.worldLabelItems.filter((item) => item.el !== rp.labelEl);
        delete this.remotePlayers[pid];
        changed = true;
        return;
      }

      const visibleInScene = rp.scene === this.currentScene;
      rp.mesh.visible = visibleInScene;
      rp.mesh.position.lerp(rp.targetPos, Math.min(1, dt * 10));
      let dRot = rp.targetRotY - rp.mesh.rotation.y;
      while (dRot > Math.PI) dRot -= Math.PI * 2;
      while (dRot < -Math.PI) dRot += Math.PI * 2;
      rp.mesh.rotation.y += dRot * Math.min(1, dt * 10);
      rp.labelPos.set(rp.mesh.position.x, rp.mesh.position.y + 2.25, rp.mesh.position.z);

      const parts = rp.parts;
      const isSit = rp.pose === 'sit';
      if (parts.rippleGroup) parts.rippleGroup.visible = isSit;
      if (parts.leftLeg && parts.rightLeg) {
        if (isSit) {
          parts.leftLeg.rotation.set(-1.35, 0.42, 0.35);
          parts.rightLeg.rotation.set(-1.35, -0.42, -0.35);
          if (parts.lowerBody) parts.lowerBody.position.y = -0.22;
          if (parts.upperBody) parts.upperBody.position.y = 0.56;
          if (parts.robeSkirt) parts.robeSkirt.scale.set(1.25, 0.72, 1.25);
        } else {
          if (parts.lowerBody) parts.lowerBody.position.y = 0;
          if (parts.upperBody) parts.upperBody.position.y = 0.74;
          if (parts.robeSkirt) parts.robeSkirt.scale.set(1, 1, 1);
          if (rp.moving) {
            parts.leftLeg.rotation.set(Math.sin(elapsed * 9.2) * 0.4, 0, 0);
            parts.rightLeg.rotation.set(-Math.sin(elapsed * 9.2) * 0.4, 0, 0);
          } else {
            parts.leftLeg.rotation.set(0, 0, 0);
            parts.rightLeg.rotation.set(0, 0, 0);
          }
        }
      }
      if (parts.leftArm && parts.rightArm) {
        if (rp.pose === 'palms') {
          parts.leftArm.rotation.set(-1.12, 0.35, -0.45);
          parts.rightArm.rotation.set(-1.12, -0.35, 0.45);
        } else if (isSit) {
          parts.leftArm.rotation.set(-0.55, 0.25, -0.18);
          parts.rightArm.rotation.set(-0.55, -0.25, 0.18);
        } else if (rp.moving) {
          parts.leftArm.rotation.set(-Math.sin(elapsed * 9.2) * 0.36, 0, -0.12);
          parts.rightArm.rotation.set(Math.sin(elapsed * 9.2) * 0.36, 0, 0.12);
        } else {
          parts.leftArm.rotation.set(Math.sin(elapsed * 1.5) * 0.04, 0, -0.12);
          parts.rightArm.rotation.set(-Math.sin(elapsed * 1.5) * 0.04, 0, 0.12);
        }
      }
    });
    if (changed) this.updateOnlinePilgrimsCount();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new BuddhistPracticeGame();
});
