// High-Detail Procedural 3D Models:
// - Authentic Chinese Buddhist Palace Architecture (Double-Eave Roofs, Glazed Tiles, Marble Balustrades, Dragon Pillars)
// - Detailed Sculpted 7-Buddha Statues (24-Petal Lotus Throne, Draped Robes, Spiral Curls, Ushnisha, Mudras, Flame Mandorla)
// - 9 Rich 3D Good-Virtue Environments (Family Home with Parents, Pine & Bamboo Forest with Trapped Deer, Lotus Lake with Fisherman, etc.)

window.TempleModels3D = {
  // -------------------- Y-AXIS CAMERA-FACING BILLBOARD SYSTEM --------------------
  billboardGroups: [],

  registerYBillboard(group) {
    if (group) {
      group.userData.isYBillboard = true;
      this.billboardGroups.push(group);
    }
    return group;
  },

  updateBillboards(camera) {
    if (!camera || !this.billboardGroups.length) return;
    const camPos = camera.position;
    const worldPos = new THREE.Vector3();
    const parentQuat = new THREE.Quaternion();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    for (let i = this.billboardGroups.length - 1; i >= 0; i--) {
      const grp = this.billboardGroups[i];
      if (!grp || !grp.parent) {
        this.billboardGroups.splice(i, 1);
        continue;
      }
      grp.getWorldPosition(worldPos);
      const worldYaw = Math.atan2(camPos.x - worldPos.x, camPos.z - worldPos.z);
      grp.parent.getWorldQuaternion(parentQuat);
      euler.setFromQuaternion(parentQuat, 'YXZ');
      grp.rotation.set(0, worldYaw - euler.y, 0);
    }
  },

  createExactBillboardPortrait({
    imgPath,
    baseWidth = 3.2,
    baseHeight = 4.2,
    centerY = 2.45,
    frameColor = 0xd97706,
    plaqueTitle = null,
    plaqueY = 5.95,
    plaqueOptions = {}
  }) {
    const billboardGrp = this.registerYBillboard(new THREE.Group());
    const src = (window.INLINE_ASSETS && window.INLINE_ASSETS[imgPath]) || `${imgPath}?v=2`;

    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      emissive: 0x3a2000,
      emissiveIntensity: 0.25,
      metalness: 0.65,
      roughness: 0.28,
      side: THREE.DoubleSide
    });
    const framePad = 0.14;
    const frameMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(baseWidth + framePad, baseHeight + framePad),
      frameMat
    );
    frameMesh.position.set(0, centerY, -0.02);

    const picGeo = new THREE.PlaneGeometry(baseWidth, baseHeight);
    const picMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    const picMesh = new THREE.Mesh(picGeo, picMat);
    picMesh.position.set(0, centerY, 0);

    const tex = new THREE.TextureLoader().load(src, (loadedTex) => {
      if (loadedTex && loadedTex.image && loadedTex.image.width && loadedTex.image.height) {
        const aspect = loadedTex.image.width / loadedTex.image.height;
        const targetW = baseHeight * aspect;
        picMesh.scale.set(targetW / baseWidth, 1, 1);
        frameMesh.scale.set((targetW + framePad) / (baseWidth + framePad), 1, 1);
      }
    });
    picMat.map = tex;
    picMat.needsUpdate = true;

    billboardGrp.add(frameMesh, picMesh);

    if (plaqueTitle) {
      const plaque = this.createVerticalBuddhaPlaque(plaqueTitle, plaqueOptions);
      plaque.position.set(0, plaqueY, 0.02);
      billboardGrp.add(plaque);
    }

    return billboardGrp;
  },

  // -------------------- PROCEDURAL TEXTURES --------------------
  createRoofTileTexture(baseColorHex = 0xd48b17) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const c = new THREE.Color(baseColorHex);
    ctx.fillStyle = `rgb(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)})`;
    ctx.fillRect(0, 0, 256, 256);

    // Draw glazed semicylindrical roof tile ridges (琉璃瓦垄)
    for (let x = 0; x < 256; x += 16) {
      const grad = ctx.createLinearGradient(x, 0, x + 16, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0.35)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.28)');
      grad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 16, 256);
    }
    for (let y = 0; y < 256; y += 24) {
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 3);
    return tex;
  },

  createRealisticGroundTexture() {
    if (this._groundTex) return this._groundTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Soft earthy base so vertex colors blend smoothly like natural soil + moss
    ctx.fillStyle = '#dde0d2';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle organic mottled soil, moss & leaf-litter patches (Sansa-style realistic matte ground)
    for (let i = 0; i < 650; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 512;
      const y = (Math.sin(i * 78.233) * 29831.137 % 1 + 1) % 1 * 512;
      const r = 6 + (i % 18);
      const tone = i % 3 === 0 ? 'rgba(130, 145, 110, 0.14)' : (i % 3 === 1 ? 'rgba(175, 160, 128, 0.14)' : 'rgba(242, 240, 228, 0.10)');
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fine natural pebble & fallen blade speckles
    for (let i = 0; i < 1800; i++) {
      const x = (Math.abs(Math.sin(i * 3.17)) * 512) % 512;
      const y = (Math.abs(Math.cos(i * 5.43)) * 512) % 512;
      ctx.fillStyle = i % 4 === 0 ? 'rgba(95, 108, 78, 0.22)' : 'rgba(155, 138, 108, 0.18)';
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(34, 34);
    this._groundTex = tex;
    return tex;
  },

  createPlaqueTexture(text = '奉国七佛寺', subText = 'SEVEN BUDDHAS TEMPLE', opts = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    const bgColor = opts.bgColor || '#15397f'; // Royal cobalt blue
    const borderColor = opts.borderColor || '#e8c468';
    const textColor = opts.textColor || '#ffe89c';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 192);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 176);

    ctx.strokeStyle = '#c58b2b';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, 476, 156);

    // Golden Calligraphy
    ctx.fillStyle = textColor;
    ctx.font = 'bold 68px "KaiTi", "STKaiti", "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 220, 100, 0.55)';
    ctx.shadowBlur = 10;
    ctx.fillText(text, 256, 86);

    ctx.font = 'bold 19px sans-serif';
    ctx.fillStyle = '#f8d775';
    ctx.shadowBlur = 0;
    ctx.fillText(subText, 256, 148);

    return new THREE.CanvasTexture(canvas);
  },

  createCoupletTexture(chars = ['慈', '悲', '喜', '舍', '登', '彼', '岸']) {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#15397f';
    ctx.fillRect(0, 0, 96, 512);
    ctx.strokeStyle = '#e8c468';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, 88, 504);

    ctx.fillStyle = '#ffe999';
    ctx.font = 'bold 46px "KaiTi", "STKaiti", "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chars.forEach((ch, idx) => {
      const y = 46 + idx * (420 / Math.max(1, chars.length - 1));
      ctx.fillText(ch, 48, y);
    });
    return new THREE.CanvasTexture(canvas);
  },

  createVerticalBuddhaPlaque(cnName, opts = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = opts.bgColor || '#fffaf0';
    ctx.fillRect(0, 0, 160, 512);

    ctx.strokeStyle = opts.borderColor || '#c58b2b';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 144, 496);
    ctx.strokeStyle = '#e8c468';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, 124, 476);

    const chars = Array.from(cnName || '释迦牟尼佛');
    const step = 380 / Math.max(1, chars.length);
    const startY = 256 - ((chars.length - 1) * step) / 2;
    ctx.fillStyle = opts.textColor || '#4a1c08';
    ctx.font = `bold ${chars.length >= 6 ? 48 : 56}px "KaiTi", "STKaiti", "Microsoft YaHei", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chars.forEach((ch, i) => {
      ctx.fillText(ch, 80, startY + i * step);
    });

    const tex = new THREE.CanvasTexture(canvas);
    const group = new THREE.Group();
    const boardMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.15 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xe6b422, metalness: 0.65, roughness: 0.25 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.35, 0.08), [frameMat, frameMat, frameMat, frameMat, boardMat, frameMat]);
    // Decorative Lotus Crest on top of vertical plaque (Picture #3)
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), frameMat);
    crest.scale.set(1.2, 0.9, 0.5);
    crest.position.y = 1.28;
    group.add(board, crest);
    return group;
  },

  createFuDiamondTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#c81d25';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 116, 116);
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#2a0808';
    ctx.font = 'bold 74px "KaiTi", "STKaiti", "Microsoft JhengHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('福', 0, 2);
    ctx.restore();
    return new THREE.CanvasTexture(canvas);
  },

  // -------------------- DETAILED SCULPTED BUDDHA STATUE --------------------
  // -------------------- DETAILED 3D STANDING 7 BUDDHAS (PICTURE #3) --------------------
  createDetailedBuddhaStatue(bData, matPreset) {
    const g = new THREE.Group();

    const p = matPreset || window.GAME_DATA.BUDDHA_MATERIALS[0];
    const goldMat = new THREE.MeshStandardMaterial({
      color: p.color || 0xffd166,
      emissive: p.emissive || 0x3a2500,
      metalness: p.metalness !== undefined ? p.metalness : 0.65,
      roughness: p.roughness !== undefined ? p.roughness : 0.28
    });
    const lotusMat = new THREE.MeshStandardMaterial({
      color: (bData && bData.lotusColor) || 0xf48fb1,
      roughness: 0.34,
      metalness: 0.12
    });

    // Clean, low circular golden-lotus plinth so every viewing angle looks uniform
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.38, 0.24, 24), goldMat);
    plinth.position.y = 0.12;
    const lotusBand = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.24, 0.14, 24), lotusMat);
    lotusBand.position.y = 0.30;
    const lotusRim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.045, 8, 28), goldMat);
    lotusRim.rotation.x = Math.PI / 2;
    lotusRim.position.y = 0.37;
    g.add(plinth, lotusBand, lotusRim);

    // Exact flat Buddha picture in a camera-facing billboard (zero 3D warping, identical from every angle)
    const imgPath = (bData && bData.img) || 'assets/buddha_7_sakyamuni.jpg';
    const portraitBillboard = this.createExactBillboardPortrait({
      imgPath,
      baseWidth: 3.10,
      baseHeight: 4.10,
      centerY: 2.45,
      frameColor: p.color || 0xf59e0b
    });
    g.add(portraitBillboard);

    const sc = (bData && bData.scale) || 1.0;
    g.scale.set(sc, sc, sc);

    g.userData.buddhaMat = goldMat;

    return g;
  },

  // -------------------- CUTE 3D NPC BUILDER --------------------
  createNPC(options = {}) {
    const {
      robeColor = 0x457b9d,
      skinColor = 0xffdbb5,
      hairColor = 0x2d1b0e,
      scale = 1.0,
      hasBeard = false,
      hasHat = false,
      isSeated = false
    } = options;

    const g = new THREE.Group();
    const robeMat = new THREE.MeshLambertMaterial({ color: robeColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });

    const yOffset = isSeated ? -0.32 : 0;

    if (!isSeated) {
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.45, 8), hairMat);
      legL.position.set(-0.14, 0.22, 0);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.45, 8), hairMat);
      legR.position.set(0.14, 0.22, 0);
      g.add(legL, legR);
    }

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.85, 12), robeMat);
    torso.position.y = 0.82 + yOffset;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), skinMat);
    head.position.y = 1.48 + yOffset;
    g.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.335, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hair.position.y = 1.51 + yOffset;
    hair.rotation.x = -0.15;
    g.add(hair);

    if (hasBeard) {
      const beard = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.35, 8),
        new THREE.MeshLambertMaterial({ color: 0xeeeeee })
      );
      beard.rotation.x = Math.PI;
      beard.position.set(0, 1.24 + yOffset, 0.26);
      g.add(beard);
    }

    if (hasHat) {
      const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 0.28, 14),
        new THREE.MeshLambertMaterial({ color: 0xd4a373 })
      );
      hat.position.y = 1.78 + yOffset;
      g.add(hat);
    }

    g.scale.set(scale, scale, scale);
    return g;
  },

  // -------------------- 9 DESCRIPTIVE 3D GOOD VIRTUE ENVIRONMENTS --------------------
  buildDeedEnvironment(deedId) {
    const root = new THREE.Group();
    const afterEffectGroup = new THREE.Group(); // Appears once completed
    const beforeEffectGroup = new THREE.Group(); // Disappears or transforms once completed
    afterEffectGroup.visible = false;
    root.add(beforeEffectGroup, afterEffectGroup);

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x7f4f24 });
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x4a2c11 });
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xdcd6cc });
    const tileRoofMat = new THREE.MeshLambertMaterial({ color: 0x3d405b });
    const redMat = new THREE.MeshLambertMaterial({ color: 0x9b2226 });
    const goldMat = new THREE.MeshPhongMaterial({ color: 0xf4b942 });

    switch (deedId) {
      // 1. FAMILY HOME AT MOUNTAIN SUMMIT (DESIGNED AFTER PICTURE 5: Curved Grey-Taupe Barrel Roof, Twin Hanging Red Lanterns, Tan Brick Walls & Dark Brown Doors with Red "福" Diamonds!)
      case 'clean_house':
      case 'respect_parents': {
        const plinthMat = new THREE.MeshLambertMaterial({ color: 0xcdc4b8 });
        const peachWallMat = new THREE.MeshLambertMaterial({ color: 0xe3b995 });
        const brickAccentMat = new THREE.MeshLambertMaterial({ color: 0xc98f69 });
        const trimBeigeMat = new THREE.MeshLambertMaterial({ color: 0xd8c3b0 });
        const taupeRoofMat = new THREE.MeshLambertMaterial({ color: 0x9b918a });
        const taupeShadeMat = new THREE.MeshLambertMaterial({ color: 0x837973 });
        const doorWalnutMat = new THREE.MeshLambertMaterial({ color: 0x4c2d1b });
        const brassRingMat = new THREE.MeshPhongMaterial({ color: 0xf0c969, shininess: 90 });
        const redLanternMat = new THREE.MeshLambertMaterial({ color: 0xd93025 });

        // Raised Stone Courtyard Terrace extending forward so Tea Table, Stove & Parents sit naturally outside
        const foundation = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.42, 10.2), plinthMat);
        foundation.position.set(0, 0.21, 1.4);
        foundation.receiveShadow = true;
        root.add(foundation);

        // Front Step on Stone Plinth
        const frontStep = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 1.0), plinthMat);
        frontStep.position.set(0, 0.11, 6.8);
        root.add(frontStep);

        // Main House Cabin positioned on the back half (z around -1.4) matching Picture 5 silhouette
        const wallH = 3.8;
        const wallW = 7.8;
        const wallD = 4.6;
        const houseZ = -1.3;

        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(wallW, wallH, wallD), peachWallMat);
        mainBody.position.set(0, 0.42 + wallH / 2, houseZ);
        mainBody.castShadow = true;
        root.add(mainBody);

        // Scattered Brick Accents on Front Tan-Peach Wall (matching Picture 5 texture)
        [[-3.0, 2.9], [-2.5, 2.5], [-3.1, 1.4], [2.9, 3.0], [2.4, 2.3], [3.0, 1.3]].forEach(([bx, by]) => {
          const brick = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.08), brickAccentMat);
          brick.position.set(bx, by, houseZ + wallD / 2 + 0.02);
          root.add(brick);
        });

        // Smooth Cream-Beige Framing Columns & Upper Lintel Beam
        [-3.72, 3.72].forEach((px) => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, wallH + 0.15, 0.45), trimBeigeMat);
          col.position.set(px, 0.42 + wallH / 2, houseZ + wallD / 2 - 0.1);
          root.add(col);
        });
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(wallW + 0.35, 0.55, wallD + 0.25), trimBeigeMat);
        lintel.position.set(0, 0.42 + wallH, houseZ);
        root.add(lintel);

        // Dark Brown Double Doors + Bright Red "福" Diamonds & Brass Ring Knockers (matching Picture 5)
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.15, 0.2), new THREE.MeshLambertMaterial({ color: 0x3b2113 }));
        doorFrame.position.set(0, 2.0, houseZ + wallD / 2 + 0.02);
        root.add(doorFrame);

        const fuTex = this.createFuDiamondTexture();
        const fuMat = new THREE.MeshBasicMaterial({ map: fuTex });

        [-0.82, 0.82].forEach((dx, idx) => {
          const doorLeaf = new THREE.Group();
          doorLeaf.position.set(dx * 1.9, 1.98, houseZ + wallD / 2 + 0.1);
          // Swing slightly welcomingly ajar (~22 deg) so both doors display their 福 plaques clearly
          doorLeaf.rotation.y = idx === 0 ? -0.32 : 0.32;

          const leafOffset = idx === 0 ? 0.78 : -0.78;
          const panel = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.95, 0.12), doorWalnutMat);
          panel.position.set(leafOffset, 0, 0);

          // Red Diamond "福" Plaque
          const fuDiamond = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.05), fuMat);
          fuDiamond.position.set(leafOffset, 0.38, 0.08);
          fuDiamond.rotation.z = Math.PI / 4;

          // Circular Brass Ring Knocker
          const knockerPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12), brassRingMat);
          knockerPlate.rotation.x = Math.PI / 2;
          knockerPlate.position.set(leafOffset * 0.55, -0.18, 0.08);
          const knockerRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.032, 8, 16), brassRingMat);
          knockerRing.position.set(leafOffset * 0.55, -0.26, 0.10);

          doorLeaf.add(panel, fuDiamond, knockerPlate, knockerRing);
          root.add(doorLeaf);
        });

        // Curved Grey-Taupe Barrel-Tile Roof with Ribbed Barrel Tiles & Scalloped Round Endcaps (matching Picture 5!)
        const roofGroup = new THREE.Group();
        roofGroup.position.set(0, 4.35, houseZ);

        // Concave stepped roof base panels
        const roofBackSlope = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.25, 3.6), taupeRoofMat);
        roofBackSlope.position.set(0, 1.1, -1.35);
        roofBackSlope.rotation.x = -0.52;
        roofBackSlope.castShadow = true;

        const roofFrontSlope = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.25, 3.85), taupeRoofMat);
        roofFrontSlope.position.set(0, 1.05, 1.45);
        roofFrontSlope.rotation.x = 0.50;
        roofFrontSlope.castShadow = true;

        const roofRidge = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 10.2, 12), taupeShadeMat);
        roofRidge.rotation.z = Math.PI / 2;
        roofRidge.position.set(0, 2.05, 0);

        // Upturned Corner Ridge Horn Tips
        [-5.1, 5.1].forEach((hx) => {
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 8), taupeShadeMat);
          tip.position.set(hx, 2.28, 0);
          tip.rotation.z = hx < 0 ? 0.55 : -0.55;
          roofGroup.add(tip);
        });

        // Prominent Cylindrical Barrel Tile Rows + Scalloped Front Endcaps (瓦当) across the Front Roof!
        for (let tx = -4.5; tx <= 4.5; tx += 0.9) {
          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.9, 10), taupeShadeMat);
          barrel.rotation.x = Math.PI / 2 + 0.50;
          barrel.position.set(tx, 1.15, 1.48);
          roofGroup.add(barrel);

          const eaveCap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.14, 12), trimBeigeMat);
          eaveCap.rotation.x = Math.PI / 2 + 0.2;
          eaveCap.position.set(tx, 0.20, 3.22);
          roofGroup.add(eaveCap);
        }

        // Twin Hanging Red Festive Lantern Strings (2 stacked lanterns on each side under Eaves!)
        [-4.55, 4.55].forEach((lx) => {
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 6), trimBeigeMat);
          cord.position.set(lx, -0.75, 2.95);
          roofGroup.add(cord);

          [-0.45, -1.35].forEach((ly) => {
            const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), redLanternMat);
            lantern.scale.set(1.0, 0.88, 1.0);
            lantern.position.set(lx, ly, 2.95);
            const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), brassRingMat);
            capTop.position.set(lx, ly + 0.28, 2.95);
            const capBot = capTop.clone();
            capBot.position.set(lx, ly - 0.28, 2.95);
            const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.26, 8), redLanternMat);
            tassel.position.set(lx, ly - 0.44, 2.95);
            roofGroup.add(lantern, capTop, capBot, tassel);
          });
        });

        roofGroup.add(roofBackSlope, roofFrontSlope, roofRidge);
        root.add(roofGroup);

        // Open Front Stone Courtyard Table, Kitchen Stove & Seated Father/Mother so Home Tasks are clear & accessible!
        const teaTable = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.14, 18), darkWoodMat);
        teaTable.position.set(-1.3, 1.05, 3.6);
        const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.65, 12), darkWoodMat);
        tableLeg.position.set(-1.3, 0.7, 3.6);
        root.add(teaTable, tableLeg);

        const homeStove = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.4), plinthMat);
        homeStove.position.set(3.1, 0.85, 3.4);
        root.add(homeStove);

        const father = this.createNPC({ robeColor: 0x355070, hairColor: 0x4a4e69, hasBeard: true, isSeated: true });
        father.position.set(-2.75, 0.45, 3.4);
        father.rotation.y = 0.5;

        const mother = this.createNPC({ robeColor: 0xb56576, hairColor: 0x2b2d42, isSeated: true });
        mother.position.set(0.25, 0.45, 3.4);
        mother.rotation.y = -0.5;
        root.add(father, mother);

        // --- STEP 1 VISUAL (clean_house): Fallen leaves & dust on front stone yard + broom ---
        const homeDustGroup = new THREE.Group();
        const leafMat = new THREE.MeshLambertMaterial({ color: 0xd97724 });
        for (let i = 0; i < 12; i++) {
          const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.03, 6), leafMat);
          leaf.position.set((Math.random() - 0.5) * 6.0, 0.46, 4.4 + Math.random() * 1.8);
          homeDustGroup.add(leaf);
        }
        const broom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 8), darkWoodMat);
        broom.position.set(-3.8, 1.1, 5.2);
        broom.rotation.z = 0.3;
        homeDustGroup.add(broom);
        root.add(homeDustGroup);
        root.userData.homeDustGroup = homeDustGroup;

        // --- STEP 2 VISUAL (care_parents): Golden Teapot & 2 Tea Cups ---
        const homeTeaGroup = new THREE.Group();
        const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), goldMat);
        teapot.position.set(-1.3, 1.28, 3.6);
        const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.16, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        cup1.position.set(-1.75, 1.2, 3.6);
        const cup2 = cup1.clone();
        cup2.position.set(-0.85, 1.2, 3.6);
        homeTeaGroup.add(teapot, cup1, cup2);
        homeTeaGroup.visible = false;
        root.add(homeTeaGroup);
        root.userData.homeTeaGroup = homeTeaGroup;

        // --- STEP 3 VISUAL (cook_parents): Glowing Stove Fire + Steaming Soup Pot ---
        const homeCookGroup = new THREE.Group();
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.52, 0.42, 0.48, 16),
          new THREE.MeshStandardMaterial({ color: 0x2b2d42, metalness: 0.6 })
        );
        pot.position.set(3.1, 1.5, 3.4);
        const fireGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xff6b35 })
        );
        fireGlow.position.set(3.1, 0.65, 4.1);
        const steam = new THREE.Mesh(
          new THREE.SphereGeometry(0.38, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 })
        );
        steam.position.set(3.1, 2.05, 3.4);
        homeCookGroup.add(pot, fireGlow, steam);
        homeCookGroup.visible = false;
        root.add(homeCookGroup);
        root.userData.homeCookGroup = homeCookGroup;

        // --- STEP 4 VISUAL (bye_parents): Blessing Hearts above Parents ---
        const homeByeGroup = new THREE.Group();
        [-2.75, 0.25].forEach((hx) => {
          const heart = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.28, 0),
            new THREE.MeshBasicMaterial({ color: 0xff758f })
          );
          heart.position.set(hx, 2.45, 3.4);
          homeByeGroup.add(heart);
        });
        homeByeGroup.visible = false;
        root.add(homeByeGroup);
        root.userData.homeByeGroup = homeByeGroup;
        break;
      }

      case 'care_parents':
      case 'cook_parents':
      case 'bye_parents': {
        root.userData.isSubHomeDeed = true;
        break;
      }

      // 2. SAVE ANIMALS IN THE FOREST: Multi-tree Pine & Bamboo Forest + Trapped Spotted Deer in Cage!
      case 'save_animals': {
        // Forest Moss Ground Mound
        const forestFloor = new THREE.Mesh(
          new THREE.CylinderGeometry(6.8, 7.2, 0.22, 24),
          new THREE.MeshLambertMaterial({ color: 0x4f772d })
        );
        forestFloor.position.y = 0.1;
        root.add(forestFloor);

        // 10 Multi-Tiered Pine Trees & Bamboo Stalks forming a real mini-forest
        const treeOffsets = [
          [-4.8, -3.2, 1.2], [-2.5, -4.5, 1.4], [1.8, -4.8, 1.1], [4.6, -2.8, 1.3],
          [-5.2, 1.2, 1.0], [5.1, 1.5, 1.25], [-3.5, 3.8, 0.9], [3.8, 3.6, 1.1]
        ];
        treeOffsets.forEach(([tx, tz, sc]) => {
          const pine = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 2.2, 8), darkWoodMat);
          trunk.position.y = 1.1;
          const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 10), new THREE.MeshLambertMaterial({ color: 0x2d6a4f }));
          c1.position.y = 2.4;
          const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.9, 10), new THREE.MeshLambertMaterial({ color: 0x40916c }));
          c2.position.y = 3.5;
          const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 10), new THREE.MeshLambertMaterial({ color: 0x52b788 }));
          c3.position.y = 4.4;
          pine.add(trunk, c1, c2, c3);
          pine.position.set(tx, 0, tz);
          pine.scale.set(sc, sc, sc);
          root.add(pine);
        });

        // Tall Bamboo Stalks
        for (let b = 0; b < 8; b++) {
          const ang = (b / 8) * Math.PI * 2;
          const bamboo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 4.5, 8),
            new THREE.MeshLambertMaterial({ color: 0x74c69d })
          );
          bamboo.position.set(Math.cos(ang) * 4.2, 2.25, Math.sin(ang) * 4.2);
          root.add(bamboo);
        }

        // Cute 3D Chibi Spotted Forest Deer (小梅花鹿) sculpted from the user's deer picture!
        const deerGroup = this.createChibiSpottedDeerModel(1.12);
        deerGroup.position.set(0, 0.22, 0);
        deerGroup.rotation.y = -0.25;
        root.add(deerGroup);
        root.userData.deerGroup = deerGroup;

        // Little Blue Songbird on a rock
        const bird = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 10, 10),
          new THREE.MeshLambertMaterial({ color: 0x4cc9f0 })
        );
        bird.position.set(-1.5, 0.55, 0.8);
        root.add(bird);

        // BEFORE: Wooden Hunter's Cage trapping the Deer!
        const cageBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 1.85), darkWoodMat);
        cageBase.position.y = 0.16;
        const cageTop = cageBase.clone();
        cageTop.position.y = 2.25;
        beforeEffectGroup.add(cageBase, cageTop);

        for (let barX = -1.0; barX <= 1.0; barX += 0.5) {
          [-0.84, 0.84].forEach((barZ) => {
            const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.08, 6), darkWoodMat);
            bar.position.set(barX, 1.2, barZ);
            beforeEffectGroup.add(bar);
          });
        }

        // AFTER: Cage disappears, replaced by a blooming flower ring & happy heart!
        const freeRing = new THREE.Mesh(
          new THREE.RingGeometry(1.4, 1.65, 24),
          new THREE.MeshBasicMaterial({ color: 0x80ed99, side: THREE.DoubleSide })
        );
        freeRing.rotation.x = -Math.PI / 2;
        freeRing.position.y = 0.24;
        afterEffectGroup.add(freeRing);
        break;
      }

      // 2B. COVER THE RAIN FOR LITTLE ANIMALS DURING THE RAIN (山腰风雨栖息地：为小动物撑伞遮雨)
      case 'cover_rain': {
        // Mossy Mountain Rock Ledge
        const ledge = new THREE.Mesh(
          new THREE.CylinderGeometry(3.4, 3.8, 0.3, 18),
          new THREE.MeshLambertMaterial({ color: 0x6b705c })
        );
        ledge.position.y = 0.15;
        root.add(ledge);

        const boulder = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.1, 0),
          new THREE.MeshLambertMaterial({ color: 0x7f8c8d })
        );
        boulder.position.set(-1.4, 0.85, -0.8);
        root.add(boulder);

        // 3 Adorable Fluffy White 3D Bunnies (holding yellow flowers & pink ribbons) & 2 Baby Chicks
        [[-0.56, 0.25, 0.25], [0.54, 0.28, -0.22], [0.0, -0.45, 0.05]].forEach(([bx, bz, rotY]) => {
          const bunny = this.createFluffyWhiteBunnyModel(0.92);
          bunny.position.set(bx, 0.20, bz);
          bunny.rotation.y = rotY;
          root.add(bunny);
        });

        const chickMat = new THREE.MeshLambertMaterial({ color: 0xffd166 });
        [[-0.95, -0.18], [0.92, -0.12]].forEach(([cx, cz]) => {
          const chick = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), chickMat);
          chick.position.set(cx, 0.4, cz);
          root.add(chick);
        });

        // Dark Raincloud overhead & Falling Blue Raindrops (BEFORE)
        const cloudGroup = new THREE.Group();
        cloudGroup.position.set(0, 4.6, 0);
        const cloudMat = new THREE.MeshLambertMaterial({ color: 0x5c677d });
        [[-0.8, 0, 1.1], [0, 0.2, 1.3], [0.8, 0, 1.0]].forEach(([cx, cy, cr]) => {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 10), cloudMat);
          puff.position.set(cx, cy, 0);
          cloudGroup.add(puff);
        });
        root.add(cloudGroup);

        // 28 Raindrop streaks falling onto the animals before shelter is built
        const rainMat = new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.75 });
        for (let r = 0; r < 28; r++) {
          const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 4), rainMat);
          drop.position.set(
            (Math.random() - 0.5) * 2.6,
            0.9 + Math.random() * 3.1,
            (Math.random() - 0.5) * 2.2
          );
          beforeEffectGroup.add(drop);
        }

        // AFTER: Giant Warm Bamboo & Green Lotus Leaf Umbrella Canopy shielding the animals!
        const bambooStem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 10), woodMat);
        bambooStem.position.set(0, 1.65, -0.2);
        const lotusCanopy = new THREE.Mesh(
          new THREE.ConeGeometry(2.65, 0.85, 18),
          new THREE.MeshLambertMaterial({ color: 0x40916c })
        );
        lotusCanopy.position.set(0, 3.25, -0.2);
        const warmGlow = new THREE.Mesh(
          new THREE.RingGeometry(1.4, 2.0, 24),
          new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide })
        );
        warmGlow.rotation.x = -Math.PI / 2;
        warmGlow.position.y = 0.32;
        afterEffectGroup.add(bambooStem, lotusCanopy, warmGlow);
        break;
      }

      // 2C. SAVE ANIMAL FROM THE HUNTER (Western Forest Grove: Stop the Hunter & Save the Little Fox!)
      case 'stop_hunter': {
        const groveFloor = new THREE.Mesh(
          new THREE.CylinderGeometry(5.5, 5.9, 0.2, 24),
          new THREE.MeshLambertMaterial({ color: 0x4a7c36 })
        );
        groveFloor.position.y = 0.1;
        root.add(groveFloor);

        // Surrounding Forest Trees
        [[-3.8, -2.5, 1.15], [3.6, -2.8, 1.25], [-4.2, 2.0, 1.0], [3.9, 2.2, 1.1]].forEach(([tx, tz, sc]) => {
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.0, 8), darkWoodMat);
          trunk.position.y = 1.0;
          const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.1, 10), new THREE.MeshLambertMaterial({ color: 0x2d6a4f }));
          c1.position.y = 2.2;
          const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.7, 10), new THREE.MeshLambertMaterial({ color: 0x40916c }));
          c2.position.y = 3.3;
          tree.add(trunk, c1, c2);
          tree.position.set(tx, 0, tz);
          tree.scale.set(sc, sc, sc);
          root.add(tree);
        });

        // Adorable Chibi 3D Little Fox (Sculpted from User's Picture 2!)
        const foxGroup = this.createCuteChibiFoxModel(1.08);
        foxGroup.position.set(1.3, 0.14, 0);
        foxGroup.rotation.y = -Math.PI / 4;
        root.add(foxGroup);
        root.userData.foxGroup = foxGroup;

        // BEFORE: Hunter aiming a wooden bow & net trap at the frightened fox
        const hunterBefore = this.createNPC({ robeColor: 0x582f0e, hasHat: true, hasBeard: true });
        hunterBefore.position.set(-1.6, 0.15, 0);
        hunterBefore.rotation.y = Math.PI / 2;
        const bowArc = new THREE.Mesh(
          new THREE.TorusGeometry(0.55, 0.04, 8, 16, Math.PI),
          darkWoodMat
        );
        bowArc.position.set(-0.95, 1.2, 0);
        bowArc.rotation.z = -Math.PI / 2;
        const trapNet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 1.1, 0.85, 10, 1, true),
          new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true })
        );
        trapNet.position.set(1.3, 0.55, 0);
        beforeEffectGroup.add(hunterBefore, bowArc, trapNet);

        // AFTER: Reformed Hunter bowing respectfully + Glowing Golden Heart above the saved Fox!
        const hunterAfter = this.createNPC({ robeColor: 0x582f0e, hasHat: true, hasBeard: true });
        hunterAfter.position.set(-1.6, 0.15, 0);
        hunterAfter.rotation.y = 0.35;
        const savedHeart = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.32, 0),
          new THREE.MeshBasicMaterial({ color: 0xffd166 })
        );
        savedHeart.position.set(1.3, 1.65, 0);
        afterEffectGroup.add(hunterAfter, savedHeart);
        break;
      }

      // 3B. HELP POOR FARMERS TO FARM THE LAND (Moved to the left around the trees with spacious layout!)
      case 'help_farmers': {
        // Spacious Terraced Highland Soil Field
        const fieldBase = new THREE.Mesh(
          new THREE.BoxGeometry(8.6, 0.28, 6.2),
          new THREE.MeshLambertMaterial({ color: 0x6f4e37 })
        );
        fieldBase.position.y = 0.14;
        root.add(fieldBase);

        // Surrounding Ring of Lush Green Trees framing the spacious left-side farmland
        [[-5.4, -3.6, 1.2], [-5.6, 0.0, 1.35], [-5.2, 3.6, 1.15], [0.0, -4.4, 1.25], [4.8, -3.8, 1.1]].forEach(([tx, tz, sc]) => {
          const farmTree = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 8), darkWoodMat);
          trunk.position.y = 1.1;
          const crown = new THREE.Mesh(
            new THREE.SphereGeometry(1.45, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x388e3c })
          );
          crown.position.y = 2.6;
          farmTree.add(trunk, crown);
          farmTree.position.set(tx, 0, tz);
          farmTree.scale.set(sc, sc, sc);
          root.add(farmTree);
        });

        // Furrow ridges across the farmland
        for (let fz = -2.2; fz <= 2.2; fz += 1.1) {
          const furrow = new THREE.Mesh(
            new THREE.BoxGeometry(7.4, 0.14, 0.48),
            new THREE.MeshLambertMaterial({ color: 0x523620 })
          );
          furrow.position.set(0, 0.3, fz);
          root.add(furrow);
        }

        // Exhausted Poor Old Farmer NPC with a bamboo hat & hoe
        const farmer = this.createNPC({ robeColor: 0x6c584c, hasHat: true, hasBeard: true });
        farmer.position.set(-2.6, 0.25, 2.0);
        farmer.rotation.y = 0.65;
        const hoeStick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), darkWoodMat);
        hoeStick.position.set(-2.0, 1.0, 2.1);
        hoeStick.rotation.z = -0.35;
        root.add(farmer, hoeStick);

        // BEFORE: Dry rocks & weeds on the unplowed terrace
        for (let w = 0; w < 9; w++) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), stoneMat);
          rock.position.set((Math.random() - 0.5) * 5.8, 0.42, (Math.random() - 0.5) * 3.8);
          beforeEffectGroup.add(rock);
        }

        // AFTER: Lush Golden Highland Barley & Green Crops sprouting in neat rows!
        const barleyMat = new THREE.MeshLambertMaterial({ color: 0xf4b942 });
        const greenCropMat = new THREE.MeshLambertMaterial({ color: 0x52b788 });
        for (let fz = -2.2; fz <= 2.2; fz += 1.1) {
          for (let fx = -3.0; fx <= 3.0; fx += 0.85) {
            const stalk = new THREE.Mesh(
              new THREE.ConeGeometry(0.24, 0.9, 7),
              fz < 0 ? barleyMat : greenCropMat
            );
            stalk.position.set(fx, 0.72, fz);
            afterEffectGroup.add(stalk);
          }
        }
        break;
      }

      // 4B. HELP TO WATER THE THIRSTY PLANTS (山腰乾旱花木园：为乾枯的植物浇水)
      case 'water_plants': {
        // Stone-lined Garden Bed & Mountain Well with Wooden Bucket
        const gardenBed = new THREE.Mesh(
          new THREE.CylinderGeometry(3.6, 3.9, 0.3, 20),
          new THREE.MeshLambertMaterial({ color: 0x7f5539 })
        );
        gardenBed.position.y = 0.15;
        root.add(gardenBed);

        const wellRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.85, 0.9, 0.85, 16),
          stoneMat
        );
        wellRing.position.set(-2.1, 0.55, 1.2);
        const wellWater = new THREE.Mesh(
          new THREE.CylinderGeometry(0.72, 0.72, 0.1, 14),
          new THREE.MeshBasicMaterial({ color: 0x4cc9f0 })
        );
        wellWater.position.set(-2.1, 0.94, 1.2);
        root.add(wellRing, wellWater);

        // BEFORE: Drooping, yellowish-brown thirsty saplings
        const dryMat = new THREE.MeshLambertMaterial({ color: 0xc9a227 });
        [[-0.6, -0.8], [1.1, -0.6], [0.3, 0.9]].forEach(([sx, sz]) => {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.5, 8), darkWoodMat);
          trunk.position.set(sx, 0.85, sz);
          trunk.rotation.z = 0.22; // Drooping!
          const dryCrown = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 10), dryMat);
          dryCrown.position.set(sx - 0.2, 1.65, sz);
          beforeEffectGroup.add(trunk, dryCrown);
        });

        // AFTER: Tall, upright emerald-green trees with blooming pink & gold blossoms!
        const lushMat = new THREE.MeshLambertMaterial({ color: 0x2d6a4f });
        const blossomMat = new THREE.MeshLambertMaterial({ color: 0xff758f });
        [[-0.6, -0.8], [1.1, -0.6], [0.3, 0.9]].forEach(([sx, sz]) => {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.2, 8), darkWoodMat);
          trunk.position.set(sx, 1.15, sz);
          const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 12), lushMat);
          crown.position.set(sx, 2.45, sz);
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), blossomMat);
          flower.position.set(sx, 3.55, sz);
          afterEffectGroup.add(trunk, crown, flower);
        });
        break;
      }

      // 6B. HELP PEOPLE TO GO ACROSS THE RIVER (山谷急流渡口：搭桥帮助人们安全过河)
      case 'cross_river': {
        // Wide Rushing Blue Mountain Stream cutting across the valley!
        const riverStream = new THREE.Mesh(
          new THREE.BoxGeometry(46, 0.18, 4.6),
          new THREE.MeshPhongMaterial({ color: 0x219ebc, shininess: 95 })
        );
        riverStream.position.set(0, 0.06, 0);
        root.add(riverStream);

        // Riverbank stones along both banks
        for (let rx = -18; rx <= 18; rx += 3.0) {
          [-2.4, 2.4].forEach((rz) => {
            if (Math.abs(rx) > 3.2) {
              const bankRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), stoneMat);
              bankRock.scale.set(1.3, 0.65, 1.0);
              bankRock.position.set(rx, 0.25, rz);
              root.add(bankRock);
            }
          });
        }

        // BEFORE: Broken stepping stones in the rushing water & Stranded Grandma + Villager on South Bank
        const grandma = this.createNPC({ robeColor: 0x9b2226, scale: 0.9 });
        grandma.position.set(-2.2, 0.1, 3.0);
        const traveler = this.createNPC({ robeColor: 0x3a86ff });
        traveler.position.set(2.2, 0.1, 3.0);
        beforeEffectGroup.add(grandma, traveler);

        [-1.0, 0.8].forEach((sz) => {
          const wetStone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.24, 10), stoneMat);
          wetStone.position.set(0, 0.14, sz);
          beforeEffectGroup.add(wetStone);
        });

        // AFTER: Sturdy Red-and-Gold Wooden Arch Bridge spanning the river + Villagers safely across!
        const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.28, 6.2), woodMat);
        bridgeDeck.position.set(0, 0.42, 0);
        bridgeDeck.name = 'walkable_ground';
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.95, 6.2), redMat);
        railL.position.set(-2.15, 0.95, 0);
        const railR = railL.clone();
        railR.position.x = 2.15;
        const postFL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.35, 10), goldMat);
        postFL.position.set(-2.15, 1.1, 3.0);
        const postFR = postFL.clone();
        postFR.position.x = 2.15;

        const safeGrandma = this.createNPC({ robeColor: 0x9b2226, scale: 0.9 });
        safeGrandma.position.set(-2.6, 0.1, -3.2);
        const safeTraveler = this.createNPC({ robeColor: 0x3a86ff });
        safeTraveler.position.set(2.6, 0.1, -3.2);

        afterEffectGroup.add(bridgeDeck, railL, railR, postFL, postFR, safeGrandma, safeTraveler);
        break;
      }
      case 'stop_killing': {
        // Shimmering Blue Lake Basin
        const water = new THREE.Mesh(
          new THREE.CylinderGeometry(5.6, 5.8, 0.18, 28),
          new THREE.MeshPhongMaterial({ color: 0x2ec4b6, shininess: 90 })
        );
        water.position.y = 0.08;
        root.add(water);

        // Stone Shoreline Rocks
        for (let r = 0; r < 18; r++) {
          const ang = (r / 18) * Math.PI * 2;
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), stoneMat);
          rock.scale.set(1.2, 0.65, 1.0);
          rock.position.set(Math.cos(ang) * 5.6, 0.25, Math.sin(ang) * 5.6);
          root.add(rock);
        }

        // Floating Green Lily Pads & Pink Lotus Flowers on the Lake
        const padMat = new THREE.MeshLambertMaterial({ color: 0x38b000 });
        const flowerMat = new THREE.MeshLambertMaterial({ color: 0xff758f });
        [[-2.2, -1.5], [1.8, -2.0], [-1.5, 2.2], [2.4, 1.4], [0, -2.8]].forEach(([lx, lz]) => {
          const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 14), padMat);
          pad.position.set(lx, 0.19, lz);
          const lotus = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 8), flowerMat);
          lotus.position.set(lx, 0.35, lz);
          root.add(pad, lotus);
        });

        // Swimming Golden & Orange Koi Fish in the Lake
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2;
          const koi = new THREE.Mesh(
            new THREE.ConeGeometry(0.18, 0.65, 8),
            new THREE.MeshLambertMaterial({ color: k % 2 === 0 ? 0xff6b35 : 0xffbe0b })
          );
          koi.rotation.z = Math.PI / 2;
          koi.position.set(Math.cos(ang) * 1.8, 0.24, Math.sin(ang) * 1.8);
          root.add(koi);
        }

        // Fisherman NPC standing on the shore
        const fisherman = this.createNPC({ robeColor: 0x6c757d, hasHat: true });
        fisherman.position.set(-3.8, 0.15, 3.8);
        fisherman.rotation.y = 2.4;
        root.add(fisherman);

        // BEFORE: Fishing Pole & Net suspended over the Koi Fish
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 3.6, 6), woodMat);
        pole.position.set(-2.4, 1.8, 2.4);
        pole.rotation.z = -0.85;
        pole.rotation.y = -0.6;
        const net = new THREE.Mesh(
          new THREE.ConeGeometry(0.85, 1.1, 10, 1, true),
          new THREE.MeshBasicMaterial({ color: 0xdddddd, wireframe: true })
        );
        net.position.set(-1.1, 0.85, 1.1);
        beforeEffectGroup.add(pole, net);

        // AFTER: "Protect Life / No Fishing" Sanctuary Signboard
        const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), darkWoodMat);
        signPost.position.set(-2.8, 0.9, 3.8);
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.12), goldMat);
        signBoard.position.set(-2.8, 1.75, 3.8);
        afterEffectGroup.add(signPost, signBoard);
        break;
      }

      // 4. HELP POOR PEOPLE: Wayside Charity Pavilion with Poor Elderly Grandpa & Child
      case 'help_poor': {
        // Hexagonal Stone Pavilion Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 6), stoneMat);
        base.position.y = 0.15;
        root.add(base);

        // 6 Red Pavilion Pillars & Hexagonal Upturned Roof
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 3.2, 10), redMat);
          p.position.set(Math.cos(ang) * 3.0, 1.75, Math.sin(ang) * 3.0);
          root.add(p);
        }
        const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.8, 6), goldMat);
        roof.position.y = 4.1;
        root.add(roof);

        // Poor Elderly Grandpa & Grandchild NPCs
        const grandpa = this.createNPC({ robeColor: 0x7f6a54, hasBeard: true });
        grandpa.position.set(-0.9, 0.3, -0.5);
        const child = this.createNPC({ robeColor: 0x8d99ae, scale: 0.68 });
        child.position.set(0.8, 0.3, -0.5);
        root.add(grandpa, child);

        // Table in center
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 1.1), woodMat);
        table.position.set(0, 0.65, 0.6);
        root.add(table);

        // AFTER: Steaming Basket of White Buns & Pouch of Golden Coins
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.25, 14), new THREE.MeshLambertMaterial({ color: 0xe9c46a }));
        basket.position.set(-0.35, 1.15, 0.6);
        const coinPouch = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), goldMat);
        coinPouch.position.set(0.4, 1.2, 0.6);
        afterEffectGroup.add(basket, coinPouch);
        break;
      }

      // 5. MAKE FOOD FOR THE HUNGRY: Outdoor Brick Stove, Giant Wok Cauldron & Hungry Villagers
      case 'cook_hungry': {
        // Brick Hearth & Stove
        const stove = new THREE.Mesh(
          new THREE.BoxGeometry(2.6, 1.15, 2.2),
          new THREE.MeshLambertMaterial({ color: 0x9e473b })
        );
        stove.position.set(0, 0.58, -0.8);
        root.add(stove);

        // Glowing Firewood Embers inside Stove
        const fire = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xff5400 })
        );
        fire.position.set(0, 0.35, 0.2);
        root.add(fire);

        // Giant Black Iron Wok / Cauldron with Golden Congee
        const wok = new THREE.Mesh(
          new THREE.CylinderGeometry(1.05, 0.65, 0.65, 18),
          new THREE.MeshStandardMaterial({ color: 0x2b2d42, metalness: 0.7, roughness: 0.4 })
        );
        wok.position.set(0, 1.32, -0.8);
        const porridge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 0.95, 0.1, 18),
          new THREE.MeshBasicMaterial({ color: 0xffd166 })
        );
        porridge.position.set(0, 1.62, -0.8);
        root.add(wok, porridge);

        // Serving Table & 2 Hungry Villagers
        const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 1.0), woodMat);
        bench.position.set(0, 0.4, 1.4);
        const v1 = this.createNPC({ robeColor: 0x588157 });
        v1.position.set(-1.9, 0, 0.4);
        v1.rotation.y = 0.8;
        const v2 = this.createNPC({ robeColor: 0xbc6c25 });
        v2.position.set(1.9, 0, 0.4);
        v2.rotation.y = -0.8;
        root.add(bench, v1, v2);

        // AFTER: 4 Warm Bowls of Porridge on the serving table
        [-0.9, -0.3, 0.3, 0.9].forEach((bx) => {
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.22, 12), redMat);
          bowl.position.set(bx, 0.92, 1.4);
          afterEffectGroup.add(bowl);
        });
        break;
      }

      // 6. MAKE A VEGETARIAN MEAL: Fenced Organic Veggie Garden + Chef Table
      case 'veggie_meal': {
        // Soil Beds with Cabbages, Pumpkins & Carrots
        [-1.8, 1.8].forEach((bx) => {
          const bed = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.22, 3.6),
            new THREE.MeshLambertMaterial({ color: 0x5c3a21 })
          );
          bed.position.set(bx, 0.11, -1.2);
          root.add(bed);

          for (let rz = -2.4; rz <= 0; rz += 0.9) {
            const veg = new THREE.Mesh(
              new THREE.SphereGeometry(0.32, 10, 10),
              new THREE.MeshLambertMaterial({ color: bx < 0 ? 0x52b788 : 0xf77f00 })
            );
            veg.position.set(bx, 0.42, rz);
            root.add(veg);
          }
        });

        // Chef Auntie NPC & Feast Table
        const chef = this.createNPC({ robeColor: 0x2a9d8f });
        chef.position.set(0, 0, -1.6);
        const feastTable = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.85, 18), woodMat);
        feastTable.position.set(0, 0.42, 1.2);
        root.add(chef, feastTable);

        // AFTER: Colorful Vegetarian Dishes on the Feast Table
        [0x80ed99, 0xff9f1c, 0xf8f9fa, 0xe76f51].forEach((col, i) => {
          const ang = (i / 4) * Math.PI * 2;
          const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.15, 12), new THREE.MeshLambertMaterial({ color: col }));
          dish.position.set(Math.cos(ang) * 0.6, 0.92, 1.2 + Math.sin(ang) * 0.6);
          afterEffectGroup.add(dish);
        });
        break;
      }

      // 7. CLEAN THE PRAYER HALL STEPS: White Marble Steps with 18 Fallen Leaves & Sweeper Monk
      case 'clean_hall': {
        // Marble Terrace Platform
        const marblePlatform = new THREE.Mesh(
          new THREE.BoxGeometry(5.5, 0.22, 4.2),
          new THREE.MeshLambertMaterial({ color: 0xf7f5f0 })
        );
        marblePlatform.position.y = 0.11;
        root.add(marblePlatform);

        // Sweeper Novice Monk NPC with Bamboo Broom
        const sweeper = this.createNPC({ robeColor: 0xe67e22, scale: 0.88 });
        sweeper.position.set(-1.8, 0.2, -0.8);
        const broomStick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 8), woodMat);
        broomStick.position.set(-1.3, 0.95, -0.5);
        broomStick.rotation.z = -0.3;
        const broomHead = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 10), goldMat);
        broomHead.position.set(-1.1, 0.35, -0.5);
        root.add(sweeper, broomStick, broomHead);

        // BEFORE: 18 Fallen Autumn Leaves & Dust Piles scattered across the marble steps!
        const leafColors = [0xd97706, 0xb45309, 0xeab308, 0x9a3412];
        for (let l = 0; l < 18; l++) {
          const leaf = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.28, 0.04, 6),
            new THREE.MeshLambertMaterial({ color: leafColors[l % leafColors.length] })
          );
          leaf.position.set((Math.random() - 0.5) * 4.4, 0.24, (Math.random() - 0.5) * 3.2);
          leaf.rotation.y = Math.random() * Math.PI;
          beforeEffectGroup.add(leaf);
        }

        // AFTER: Sparkling Clean Golden Lotus Emblem on the Marble
        const cleanLotus = new THREE.Mesh(
          new THREE.RingGeometry(0.8, 1.3, 24),
          new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide })
        );
        cleanLotus.rotation.x = -Math.PI / 2;
        cleanLotus.position.y = 0.25;
        afterEffectGroup.add(cleanLotus);
        break;
      }

      // 8. SMILE WARMLY AT PEOPLE: South Village Welcome Archway (Paifang) & 3 Travelers
      case 'smile_people': {
        // Grand Village Welcome Archway
        [-3.4, 3.4].forEach((px) => {
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 5.2, 12), redMat);
          p.position.set(px, 2.6, 0);
          root.add(p);
        });
        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.65, 0.8), goldMat);
        topBeam.position.set(0, 5.1, 0);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.45, 1.6), tileRoofMat);
        roof.position.set(0, 5.6, 0);
        root.add(topBeam, roof);

        // 3 Village Travelers standing near the Archway
        const t1 = this.createNPC({ robeColor: 0x457b9d });
        t1.position.set(-2.0, 0, 1.2);
        const t2 = this.createNPC({ robeColor: 0xe07a5f });
        t2.position.set(2.0, 0, 1.2);
        const t3 = this.createNPC({ robeColor: 0x81b29a, scale: 0.78 });
        t3.position.set(2.8, 0, 1.8);
        root.add(t1, t2, t3);

        // AFTER: Glowing Golden Smile Halos above the Travelers
        [-2.0, 2.0, 2.8].forEach((hx) => {
          const smileOrb = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffe66d })
          );
          smileOrb.position.set(hx, 2.35, 1.2);
          afterEffectGroup.add(smileOrb);
        });
        break;
      }

      // 9. MAKE GOOD WISHES TO FRIENDS: Giant Ancient Bodhi Tree with Red Wishing Ribbons & Friend NPC
      case 'good_wishes': {
        // Circular Stone Tree Terrace
        const terrace = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.38, 20), stoneMat);
        terrace.position.y = 0.19;
        root.add(terrace);

        // Giant Multi-Branch Bodhi Tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 3.8, 12), darkWoodMat);
        trunk.position.y = 2.0;
        const crownMain = new THREE.Mesh(
          new THREE.SphereGeometry(2.9, 16, 14),
          new THREE.MeshLambertMaterial({ color: 0x52b788 })
        );
        crownMain.position.y = 4.8;
        const crownGold = new THREE.Mesh(
          new THREE.SphereGeometry(2.1, 14, 12),
          new THREE.MeshLambertMaterial({ color: 0xe9c46a })
        );
        crownGold.position.set(1.1, 5.4, 0.6);
        root.add(trunk, crownMain, crownGold);

        // Red Silk Wishing Ribbons hanging from branches
        for (let r = 0; r < 10; r++) {
          const ang = (r / 10) * Math.PI * 2;
          const ribbon = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 1.1, 0.03),
            new THREE.MeshBasicMaterial({ color: 0xe63946 })
          );
          ribbon.position.set(Math.cos(ang) * 2.2, 3.0, Math.sin(ang) * 2.2);
          root.add(ribbon);
        }

        // Childhood Friend Xiao An NPC
        const friend = this.createNPC({ robeColor: 0x9b5de5, scale: 0.88 });
        friend.position.set(-1.8, 0.38, 1.6);
        friend.rotation.y = 0.5;
        root.add(friend);

        // AFTER: Glowing Golden Sky Lanterns floating around the Bodhi Tree
        for (let l = 0; l < 5; l++) {
          const ang = (l / 5) * Math.PI * 2;
          const lantern = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.2, 0.48, 10),
            new THREE.MeshBasicMaterial({ color: 0xffd166 })
          );
          lantern.position.set(Math.cos(ang) * 2.5, 3.8 + (l % 2) * 0.6, Math.sin(ang) * 2.5);
          afterEffectGroup.add(lantern);
        }
        break;
      }

      // 14. BUILD WISDOM BRIDGE ACROSS EAST RIVER (Toward Mount Wutai & 文殊殿)
      case 'build_wisdom_bridge': {
        const masterLu = this.createNPC({ robeColor: 0x3b6978, scale: 0.92 });
        masterLu.position.set(0, 0, -1.6);
        masterLu.rotation.y = Math.PI / 2;
        root.add(masterLu);

        // BEFORE: Unassembled timber beams & blueprint post on west riverbank
        for (let b = 0; b < 3; b++) {
          const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.2, 2.2, 8),
            darkWoodMat
          );
          log.rotation.z = Math.PI / 2;
          log.position.set(-0.4, 0.22 + b * 0.22, 1.4 - b * 0.25);
          beforeEffectGroup.add(log);
        }
        const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.18), darkWoodMat);
        signPost.position.set(1.2, 0.9, 1.2);
        const signBoard = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.65, 0.1),
          new THREE.MeshLambertMaterial({ color: 0xe9c46a })
        );
        signBoard.position.set(1.2, 1.65, 1.2);
        beforeEffectGroup.add(signPost, signBoard);

        // AFTER: Glowing Golden Guide Lantern on completed riverbank
        const completedLantern = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.75, 10),
          goldMat
        );
        completedLantern.position.set(0.6, 1.2, 2.2);
        afterEffectGroup.add(completedLantern);
        break;
      }
    }

    // 3D Location Marker Ring & Floating Golden Beacon (marks the quest spot on the map)
    if (!root.userData.isSubHomeDeed) {
      const markerGroup = new THREE.Group();
      const markerRing = new THREE.Mesh(
        new THREE.RingGeometry(3.4, 3.85, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffd166,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.78
        })
      );
      markerRing.rotation.x = -Math.PI / 2;
      markerRing.position.y = 0.16;
      const markerCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.36, 0),
        new THREE.MeshBasicMaterial({ color: 0xffe66d })
      );
      markerCrystal.position.set(0, 3.6, 0);
      markerGroup.add(markerRing, markerCrystal);
      beforeEffectGroup.add(markerGroup);
      root.userData.markerCrystal = markerCrystal;
      root.userData.markerRing = markerRing;
    }

    root.userData.beforeEffectGroup = beforeEffectGroup;
    root.userData.afterEffectGroup = afterEffectGroup;
    return root;
  },

  // -------------------- 3D CHIBI SPOTTED DEER MODEL (SCULPTED FROM USER'S PICTURE) --------------------
  createChibiSpottedDeerModel(scale = 1.0) {
    const deer = new THREE.Group();

    const caramelFur = new THREE.MeshLambertMaterial({ color: 0xc97b42 });
    const darkBrown = new THREE.MeshLambertMaterial({ color: 0x5c3016 });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x3b1e0c });
    const creamWhite = new THREE.MeshLambertMaterial({ color: 0xfff8f0 });
    const spotWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const earPink = new THREE.MeshLambertMaterial({ color: 0xffa8b8 });
    const cheekBlush = new THREE.MeshBasicMaterial({ color: 0xff7b89 });
    const smilePink = new THREE.MeshBasicMaterial({ color: 0xff6b81 });

    // 1. Plump Chibi Body & White Belly/Chest
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), caramelFur);
    body.scale.set(0.92, 0.88, 1.18);
    body.position.set(0, 0.54, 0);
    body.castShadow = true;
    deer.add(body);

    const chestPatch = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), creamWhite);
    chestPatch.scale.set(0.82, 0.92, 0.65);
    chestPatch.position.set(0, 0.48, 0.28);
    deer.add(chestPatch);

    // Side Body White Fawn Spots (left & right flanks)
    [
      [0.34, 0.62, 0.06, 0.065],
      [0.36, 0.56, -0.10, 0.055],
      [0.33, 0.66, -0.18, 0.05],
      [0.35, 0.48, -0.02, 0.045],
      [0.31, 0.52, -0.24, 0.055]
    ].forEach(([sx, sy, sz, sr]) => {
      const spotR = new THREE.Mesh(new THREE.SphereGeometry(sr, 8, 8), spotWhite);
      spotR.scale.set(0.55, 1, 1);
      spotR.position.set(sx, sy, sz);
      const spotL = spotR.clone();
      spotL.position.x = -sx;
      deer.add(spotR, spotL);
    });

    // 2. Four Cute Legs with Dark Brown Hooves
    [
      [-0.17, 0.22],
      [0.17, 0.22],
      [-0.18, -0.22],
      [0.18, -0.22]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.34, 10), caramelFur);
      leg.position.set(lx, 0.20, lz);
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.09, 10), hoofMat);
      hoof.position.set(lx, 0.045, lz);
      deer.add(leg, hoof);
    });

    // 3. Cute Upturned Brown-and-White Tail
    const tailBrown = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 8), caramelFur);
    tailBrown.position.set(0, 0.68, -0.50);
    tailBrown.rotation.x = -0.65;
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), creamWhite);
    tailTip.position.set(0, 0.62, -0.49);
    deer.add(tailBrown, tailTip);

    // 4. Oversized Chibi Head Group (+Z forward)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.06, 0.24);

    // Rounded Chibi Cranium
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 18), caramelFur);
    cranium.scale.set(1.08, 0.96, 0.96);
    cranium.castShadow = true;
    headGroup.add(cranium);

    // Cream-White Face Mask (2 eye arches + wide snout/chin)
    const snoutPatch = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), creamWhite);
    snoutPatch.scale.set(1.12, 0.62, 0.56);
    snoutPatch.position.set(0, -0.13, 0.24);
    const leftEyeArch = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 12), creamWhite);
    leftEyeArch.scale.set(0.95, 1.15, 0.45);
    leftEyeArch.position.set(-0.17, 0.02, 0.31);
    const rightEyeArch = leftEyeArch.clone();
    rightEyeArch.position.x = 0.17;
    headGroup.add(snoutPatch, leftEyeArch, rightEyeArch);

    // Forehead White Fawn Spots between the ears
    [
      [0, 0.36, 0.28, 0.055],
      [-0.14, 0.32, 0.28, 0.045],
      [0.14, 0.32, 0.28, 0.045],
      [-0.08, 0.24, 0.35, 0.038],
      [0.08, 0.24, 0.35, 0.038],
      [0, 0.42, 0.14, 0.04]
    ].forEach(([fx, fy, fz, fr]) => {
      const fSpot = new THREE.Mesh(new THREE.SphereGeometry(fr, 8, 8), spotWhite);
      fSpot.scale.set(1, 0.85, 0.6);
      fSpot.position.set(fx, fy, fz);
      headGroup.add(fSpot);
    });

    // Happy Curved Smiling Eyes (^ ^) with Cute Eyelashes
    [-0.18, 0.18].forEach((ex) => {
      const eyeArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.085, 0.022, 8, 14, Math.PI),
        hoofMat
      );
      eyeArc.position.set(ex, 0.02, 0.41);
      headGroup.add(eyeArc);
    });

    // Rosy Pink Blush Cheeks
    [-0.27, 0.27].forEach((cx) => {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), cheekBlush);
      blush.scale.set(1.15, 0.82, 0.35);
      blush.position.set(cx, -0.10, 0.38);
      headGroup.add(blush);
    });

    // Little Black Nose & Happy Open Smile Tongue
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), hoofMat);
    nose.scale.set(1.25, 0.9, 0.9);
    nose.position.set(0, -0.05, 0.44);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), smilePink);
    mouth.scale.set(1.0, 1.15, 0.45);
    mouth.position.set(0, -0.14, 0.43);
    headGroup.add(nose, mouth);

    // Big Expressive Floppy Ears (Brown outer, Dark Brown tips, Pink inner, White fluff)
    [-1, 1].forEach((side) => {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.42, 0.20, 0.02);
      earPivot.rotation.z = -side * 0.58;
      earPivot.rotation.y = side * 0.18;

      const outerEar = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), caramelFur);
      outerEar.scale.set(0.68, 1.45, 0.36);
      outerEar.position.y = 0.22;
      const earTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), darkBrown);
      earTip.scale.set(0.72, 0.9, 0.38);
      earTip.position.y = 0.42;
      const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), earPink);
      innerEar.scale.set(0.65, 1.35, 0.25);
      innerEar.position.set(0, 0.20, 0.055);
      const earFluff = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), creamWhite);
      earFluff.position.set(-side * 0.03, 0.06, 0.06);

      earPivot.add(outerEar, earTip, innerEar, earFluff);
      headGroup.add(earPivot);
    });

    // Cute Little 3-Prong Baby Antlers on Top of Head
    [-0.16, 0.16].forEach((ax) => {
      const antler = new THREE.Group();
      antler.position.set(ax, 0.44, 0.05);
      antler.rotation.z = ax < 0 ? 0.24 : -0.24;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.22, 8), caramelFur);
      stem.position.y = 0.10;
      const prongL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.13, 7), caramelFur);
      prongL.position.set(-0.045, 0.18, 0);
      prongL.rotation.z = 0.65;
      const prongR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.12, 7), caramelFur);
      prongR.position.set(0.045, 0.19, 0);
      prongR.rotation.z = -0.65;

      antler.add(stem, prongL, prongR);
      headGroup.add(antler);
    });

    deer.add(headGroup);
    deer.scale.set(scale, scale, scale);
    return deer;
  },

  // -------------------- FLUFFY WHITE BABY BUNNY 3D MODEL (FROM USER ARTWORK) --------------------
  // Plump fluffy white baby bunny with peach inner ears, shiny black eyes, rosy cheeks,
  // holding a 5-petal golden-yellow flower with green leaf & pink ribbon bow
  createFluffyWhiteBunnyModel(scale = 1) {
    const bunny = new THREE.Group();
    const snowFur = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const softCream = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
    const innerEarPeach = new THREE.MeshLambertMaterial({ color: 0xffcbb8 });
    const blushPink = new THREE.MeshBasicMaterial({ color: 0xffb3c6 });
    const eyeBlack = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 95 });
    const sparkleWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const nosePink = new THREE.MeshLambertMaterial({ color: 0xd95f76 });
    const petalYellow = new THREE.MeshLambertMaterial({ color: 0xffca3a });
    const centerGold = new THREE.MeshLambertMaterial({ color: 0xf48c06 });
    const leafGreen = new THREE.MeshLambertMaterial({ color: 0x52b788 });
    const bowPink = new THREE.MeshLambertMaterial({ color: 0xff8fab });
    const bowDot = new THREE.MeshBasicMaterial({ color: 0xffe5ec });

    // 1. Plump Fluffy Sitting Body & Puffy Cheeks / Tail
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 14), snowFur);
    body.scale.set(1.05, 0.96, 1.0);
    body.position.set(0, 0.25, 0);
    body.castShadow = true;
    bunny.add(body);

    // Extra subtle fur puffs on lower sides & tail for ultra-fluffy silhouette
    const puffOffsets = [
      [-0.18, 0.22, 0.04, 0.13],
      [0.18, 0.22, 0.04, 0.13],
      [0, 0.16, -0.23, 0.12] // fluffy pom-pom tail
    ];
    puffOffsets.forEach(([px, py, pz, pr]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 10, 10), softCream);
      puff.position.set(px, py, pz);
      bunny.add(puff);
    });

    // Little seated feet
    [-0.12, 0.12].forEach((fx) => {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), snowFur);
      foot.scale.set(0.95, 0.65, 1.25);
      foot.position.set(fx, 0.055, 0.14);
      bunny.add(foot);
    });

    // 2. Big Round Fluffy Baby Bunny Head
    const head = new THREE.Group();
    head.position.set(0, 0.56, 0.03);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), snowFur);
    skull.scale.set(1.12, 0.96, 1.0);
    skull.castShadow = true;
    head.add(skull);

    // Fluffy chubby cheek tufts + head fur puffs
    [-0.19, 0.19].forEach((cx) => {
      const cheekTuft = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), snowFur);
      cheekTuft.scale.set(1.0, 0.88, 0.92);
      cheekTuft.position.set(cx, -0.05, 0.10);
      head.add(cheekTuft);

      // Soft pink blush
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), blushPink);
      blush.scale.set(1.15, 0.78, 0.4);
      blush.position.set(cx * 0.96, -0.04, 0.225);
      head.add(blush);
    });

    // Tiny fluffy tufts around face contour
    [[-0.25, 0.05, 0], [0.25, 0.05, 0], [0, 0.25, 0]].forEach(([tx, ty, tz]) => {
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), snowFur);
      tuft.position.set(tx, ty, tz);
      head.add(tuft);
    });

    // Glossy Black Button Eyes + Bright Catchlights
    [-0.12, 0.12].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 12), eyeBlack);
      eye.scale.set(0.95, 1.08, 0.75);
      eye.position.set(ex, 0.015, 0.245);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), sparkleWhite);
      glint.position.set(ex - 0.012, 0.032, 0.278);
      head.add(eye, glint);
    });

    // Cute tiny pink 'x' / Y nose & mouth
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), nosePink);
    nose.scale.set(1.2, 0.8, 0.8);
    nose.position.set(0, -0.03, 0.27);
    const mouthL = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.012), nosePink);
    mouthL.position.set(-0.014, -0.052, 0.268);
    mouthL.rotation.z = -0.55;
    const mouthR = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.012), nosePink);
    mouthR.position.set(0.014, -0.052, 0.268);
    mouthR.rotation.z = 0.55;
    head.add(nose, mouthL, mouthR);

    // 3. Soft Upright Rounded Bunny Ears with Warm Peach-Pink Inner Centers
    [-1, 1].forEach((side) => {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.15, 0.22, 0.01);
      earPivot.rotation.z = -side * 0.22;
      earPivot.rotation.x = 0.08;

      const outerEar = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), snowFur);
      outerEar.scale.set(0.86, 1.85, 0.58);
      outerEar.position.y = 0.12;
      outerEar.castShadow = true;

      const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), innerEarPeach);
      innerEar.scale.set(0.78, 1.65, 0.35);
      innerEar.position.set(0, 0.115, 0.038);

      earPivot.add(outerEar, innerEar);
      head.add(earPivot);
    });
    bunny.add(head);

    // 4. Tiny Paws Hugging the Flower Bouquet in Front
    [-0.11, 0.11].forEach((px) => {
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), snowFur);
      paw.scale.set(0.95, 0.85, 1.15);
      paw.position.set(px, 0.29, 0.23);
      bunny.add(paw);
    });

    // 5. Golden-Yellow 5-Petal Flower, Green Leaf & Pink Ribbon Bow
    const bouquet = new THREE.Group();
    bouquet.position.set(0.01, 0.31, 0.29);

    const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), centerGold);
    flowerCenter.position.set(0, 0, 0.015);
    bouquet.add(flowerCenter);

    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + 0.25;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), petalYellow);
      petal.scale.set(1.0, 1.0, 0.45);
      petal.position.set(Math.cos(ang) * 0.056, Math.sin(ang) * 0.056, 0.005);
      bouquet.add(petal);
    }

    // Fresh Emerald-Green Leaf on bottom-left
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), leafGreen);
    leaf.scale.set(1.45, 0.65, 0.24);
    leaf.position.set(-0.11, -0.05, -0.01);
    leaf.rotation.z = 0.42;
    bouquet.add(leaf);

    // Cute Pink Ribbon Bow below-right of the flower
    const ribbonKnot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), bowPink);
    ribbonKnot.position.set(0.06, -0.06, 0.01);
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.12, 0.016), bowPink);
    tailL.position.set(0.03, -0.13, 0.005);
    tailL.rotation.z = -0.28;
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.11, 0.016), bowPink);
    tailR.position.set(0.11, -0.105, 0.005);
    tailR.rotation.z = 0.45;
    const bowDotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), bowDot);
    bowDotMesh.position.set(0.06, -0.06, 0.032);
    bouquet.add(ribbonKnot, tailL, tailR, bowDotMesh);

    bunny.add(bouquet);
    bunny.scale.set(scale, scale, scale);
    return bunny;
  },

  // -------------------- 3D CUTE CHIBI FOX MODEL (SCULPTED FROM USER'S PICTURE 2) --------------------
  // Warm coral-orange fox with white fluffy lower cheeks & scalloped chest bib, big white-lined pointed ears,
  // happy crescent eyes ^^, black button nose + 'w' smile, brown-booted paws, and fluffy white-tipped curved tail
  createCuteChibiFoxModel(scale = 1) {
    const fox = new THREE.Group();
    const orangeFur = new THREE.MeshLambertMaterial({ color: 0xdf7c4e });
    const whiteFur = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const brownPaw = new THREE.MeshLambertMaterial({ color: 0x7a3e20 });
    const earRimDark = new THREE.MeshLambertMaterial({ color: 0x562814 });
    const blackFeature = new THREE.MeshBasicMaterial({ color: 0x151515 });
    const blushTint = new THREE.MeshBasicMaterial({ color: 0xe68a6e });

    // 1. Plump Seated Fox Body & White Fluffy Chest Bib (from Picture 2)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), orangeFur);
    body.scale.set(1.06, 1.05, 0.95);
    body.position.set(0, 0.34, 0);
    body.castShadow = true;
    fox.add(body);

    // Fluffy White Chest Bib (overlapping scalloped puffs on chest)
    const chestCenter = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), whiteFur);
    chestCenter.scale.set(1.15, 1.0, 0.72);
    chestCenter.position.set(0, 0.44, 0.22);
    fox.add(chestCenter);
    [[-0.12, 0.35, 0.23, 0.11], [0.12, 0.35, 0.23, 0.11], [0, 0.26, 0.23, 0.12]].forEach(([px, py, pz, pr]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 10, 10), whiteFur);
      puff.position.set(px, py, pz);
      fox.add(puff);
    });

    // 2. Front Legs & Back Tucked Paws with Chocolate-Brown Boots
    [-0.13, 0.13].forEach((lx) => {
      const frontLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.26, 10), orangeFur);
      frontLeg.position.set(lx, 0.19, 0.22);
      const frontBoot = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), brownPaw);
      frontBoot.scale.set(0.98, 0.72, 1.25);
      frontBoot.position.set(lx, 0.065, 0.25);
      fox.add(frontLeg, frontBoot);
    });
    [-0.29, 0.29].forEach((bx) => {
      const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), orangeFur);
      haunch.scale.set(0.85, 1.05, 1.1);
      haunch.position.set(bx, 0.17, 0.04);
      const rearBoot = new THREE.Mesh(new THREE.SphereGeometry(0.092, 12, 10), brownPaw);
      rearBoot.scale.set(0.95, 0.75, 1.28);
      rearBoot.position.set(bx * 0.96, 0.07, 0.15);
      fox.add(haunch, rearBoot);
    });

    // 3. Big Rounded Chibi Fox Head with Wide Flared White Lower Cheeks
    const head = new THREE.Group();
    head.position.set(0, 0.78, 0.05);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 16), orangeFur);
    skull.scale.set(1.18, 0.92, 0.96);
    skull.castShadow = true;
    head.add(skull);

    // Wide White Cheek Puffs + Chin + Flared Cheek Whisker Tufts
    const lowerCheek = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), whiteFur);
    lowerCheek.scale.set(1.42, 0.65, 0.96);
    lowerCheek.position.set(0, -0.10, 0.06);
    head.add(lowerCheek);

    [-0.38, 0.38].forEach((cx) => {
      const cheekFlare = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 8), whiteFur);
      cheekFlare.rotation.z = cx < 0 ? 1.25 : -1.25;
      cheekFlare.position.set(cx, -0.07, 0.05);
      const cheekTop = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 8), orangeFur);
      cheekTop.rotation.z = cx < 0 ? 1.15 : -1.15;
      cheekTop.position.set(cx * 0.95, -0.01, 0.03);
      head.add(cheekFlare, cheekTop);
    });

    // Cute 2 Little Top-Head Fur Tufts
    [-0.04, 0.05].forEach((tx, idx) => {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 6), orangeFur);
      tuft.position.set(tx, 0.34, 0.04);
      tuft.rotation.z = idx === 0 ? 0.32 : -0.25;
      head.add(tuft);
    });

    // Tall Pointed Fox Ears (Dark Brown Outer Rim + Orange Back + White Inner Triangle!)
    [-1, 1].forEach((side) => {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.25, 0.25, 0.0);
      earPivot.rotation.z = -side * 0.26;
      earPivot.rotation.x = 0.08;

      const outerEar = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 4), earRimDark);
      outerEar.rotation.y = Math.PI / 4;
      outerEar.scale.set(1.0, 1.0, 0.62);
      outerEar.position.y = 0.16;

      const innerWhite = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.28, 4), whiteFur);
      innerWhite.rotation.y = Math.PI / 4;
      innerWhite.scale.set(0.95, 0.95, 0.42);
      innerWhite.position.set(0, 0.14, 0.045);

      earPivot.add(outerEar, innerWhite);
      head.add(earPivot);
    });

    // Happy Crescent-Arc Smiling Black Eyes (^ ^) + Tiny Peach Cheek Blush Stripes
    [-0.165, 0.165].forEach((ex) => {
      const eyeArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.046, 0.018, 8, 12, Math.PI * 0.95),
        blackFeature
      );
      eyeArc.position.set(ex, -0.025, 0.335);
      head.add(eyeArc);

      // Pair of tiny angled cheek blush ticks
      [-0.018, 0.018].forEach((bxOff) => {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.045, 0.015), blushTint);
        tick.position.set(ex + (ex < 0 ? -0.065 : 0.065) + bxOff, -0.08, 0.33);
        tick.rotation.z = -0.38;
        head.add(tick);
      });
    });

    // Tiny Glossy Black Button Nose & Happy 'w' Mouth
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), blackFeature);
    nose.scale.set(1.2, 0.85, 0.85);
    nose.position.set(0, -0.068, 0.368);
    head.add(nose);

    [-0.025, 0.025].forEach((mx) => {
      const wArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.024, 0.011, 6, 10, Math.PI),
        blackFeature
      );
      wArc.rotation.z = Math.PI;
      wArc.position.set(mx, -0.095, 0.36);
      head.add(wArc);
    });

    fox.add(head);

    // 4. Big Plush Curved Bushy Fox Tail with White Jagged Tip!
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0.28, 0.24, -0.22);
    tailGroup.rotation.z = -0.58;
    tailGroup.rotation.y = 0.45;

    const tailBase = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), orangeFur);
    tailBase.scale.set(0.92, 1.35, 0.92);
    tailBase.position.y = 0.14;
    const tailMid = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), orangeFur);
    tailMid.scale.set(0.95, 1.25, 0.95);
    tailMid.position.set(0.05, 0.34, 0);
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.175, 0.36, 10), whiteFur);
    tailTip.position.set(0.10, 0.56, 0);
    tailTip.rotation.z = -0.35;
    tailGroup.add(tailBase, tailMid, tailTip);
    fox.add(tailGroup);

    fox.scale.set(scale, scale, scale);
    return fox;
  },

  // -------------------- RESCUED ANIMAL COMPANIONS (DEER & FOX) --------------------
  createCompanionAnimal(type) {
    let group;
    if (type === 'deer') {
      group = this.createChibiSpottedDeerModel(0.68);
    } else {
      group = this.createCuteChibiFoxModel(0.75);
    }
    // Tiny Golden Halo above grateful rescued companion
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.14, 0.19, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe66d, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = type === 'deer' ? 1.25 : 1.15;
    group.add(halo);
    return group;
  },

  // -------------------- CURVED VERMILION ARCH BRIDGE (DESIGNED AFTER PICTURE 3) --------------------
  // Sweeping Taikobashi-style arched wooden plank deck with vermilion curved railings, balusters & black diamond plates
  createCurvedVermilionBridgeModel() {
    const bridge = new THREE.Group();
    const plankMat = new THREE.MeshLambertMaterial({ color: 0xa58c73 });
    const plankDarkMat = new THREE.MeshLambertMaterial({ color: 0x87705a });
    const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xd64127, roughness: 0.38 });
    const blackMetalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.75, roughness: 0.35 });

    const halfLen = 5.3;
    const bridgeW = 5.5;
    const archHeight = 1.48;

    // 1. Curved Wooden Plank Deck Boards (matching Picture 3 weathered boardwalk!)
    const numPlanks = 26;
    for (let i = 0; i < numPlanks; i++) {
      const z = -halfLen + ((i + 0.5) / numPlanks) * (halfLen * 2);
      const t = z / halfLen;
      const y = 0.15 + archHeight * (1 - t * t);
      const slope = Math.atan((-2 * archHeight * z) / (halfLen * halfLen));

      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(bridgeW, 0.14, 0.37),
        i % 2 === 0 ? plankMat : plankDarkMat
      );
      plank.position.set(0, y - 0.05, z);
      plank.rotation.x = -slope;
      plank.receiveShadow = true;
      plank.castShadow = true;
      plank.name = 'walkable_ground';
      bridge.add(plank);
    }

    // 2. Curved Side Support Beams + Vermilion Arched Top Rails + Balusters + Black Diamond Accents
    const archSteps = 20;
    [-bridgeW / 2 - 0.08, bridgeW / 2 + 0.08].forEach((rx) => {
      for (let i = 0; i < archSteps; i++) {
        const z1 = -halfLen + (i / archSteps) * (halfLen * 2);
        const z2 = -halfLen + ((i + 1) / archSteps) * (halfLen * 2);
        const zm = (z1 + z2) / 2;
        const t1 = z1 / halfLen;
        const t2 = z2 / halfLen;
        const y1 = 0.15 + archHeight * (1 - t1 * t1);
        const y2 = 0.15 + archHeight * (1 - t2 * t2);
        const ym = (y1 + y2) / 2;
        const segLen = Math.hypot(z2 - z1, y2 - y1) + 0.04;
        const tilt = Math.atan2(y2 - y1, z2 - z1);

        // Lower arched beam
        const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, segLen), vermilionMat);
        lowerBeam.position.set(rx, ym - 0.12, zm);
        lowerBeam.rotation.x = -tilt;
        lowerBeam.castShadow = true;
        bridge.add(lowerBeam);

        // Middle horizontal rail
        const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, segLen), vermilionMat);
        midRail.position.set(rx, ym + 0.38, zm);
        midRail.rotation.x = -tilt;
        bridge.add(midRail);

        // Thick Rounded Top Vermilion Handrail
        const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, segLen, 10), vermilionMat);
        topRail.position.set(rx, ym + 0.96, zm);
        topRail.rotation.x = Math.PI / 2 - tilt;
        topRail.castShadow = true;
        bridge.add(topRail);
      }

      // Evenly spaced vertical balusters + Black diamond decorative plates (Picture 3)
      for (let p = 0; p <= 10; p++) {
        const zp = -halfLen + (p / 10) * (halfLen * 2);
        const tp = zp / halfLen;
        const yp = 0.15 + archHeight * (1 - tp * tp);
        const isMainPost = (p === 0 || p === 5 || p === 10);
        const postW = isMainPost ? 0.24 : 0.15;
        const postH = isMainPost ? 1.18 : 1.05;

        const post = new THREE.Mesh(new THREE.BoxGeometry(postW, postH, postW), vermilionMat);
        post.position.set(rx, yp + postH / 2 - 0.05, zp);
        post.castShadow = true;
        bridge.add(post);

        if (isMainPost) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), vermilionMat);
          cap.position.set(rx, yp + postH + 0.01, zp);
          bridge.add(cap);
        }

        // Black diamond ornament on side beam below each post
        const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.16), blackMetalMat);
        diamond.rotation.x = Math.PI / 4;
        diamond.position.set(rx + (rx > 0 ? 0.14 : -0.14), yp - 0.12, zp);
        bridge.add(diamond);
      }
    });

    return bridge;
  },

  // -------------------- TRADITIONAL SCULPTED CHINESE STONE GUARDIAN LION (DESIGNED AFTER PICTURE 4) --------------------
  createGuardianLionModel(side = 1) {
    const g = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xebe6db, roughness: 0.52 });
    const carvedTrim = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.6 });

    // 1. Multi-tier Carved Stone Pedestal Plinth (须弥石座)
    const baseLow = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.42, 2.3), carvedTrim);
    baseLow.position.y = 0.21;
    const baseWaist = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.58, 1.92), stoneMat);
    baseWaist.position.y = 0.71;
    const baseTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.34, 2.2), carvedTrim);
    baseTop.position.y = 1.17;
    baseLow.castShadow = true;
    baseTop.castShadow = true;
    g.add(baseLow, baseWaist, baseTop);

    // 2. Seated Majestic Lion Torso & Broad Carved Chest
    const lion = new THREE.Group();
    lion.position.set(0, 1.34, 0);

    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 12), stoneMat);
    torso.scale.set(0.95, 1.25, 1.15);
    torso.position.set(0, 0.72, -0.05);
    torso.castShadow = true;
    lion.add(torso);

    // Front muscular legs & paws
    [-0.36, 0.36].forEach((px, idx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.85, 10), stoneMat);
      leg.position.set(px, 0.44, 0.38);
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), carvedTrim);
      paw.scale.set(1.0, 0.65, 1.25);
      paw.position.set(px, 0.12, 0.48);
      lion.add(leg, paw);
      // Brocade ball under outer paw!
      if ((side < 0 && idx === 1) || (side > 0 && idx === 0)) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), carvedTrim);
        ball.position.set(px, 0.22, 0.65);
        lion.add(ball);
      }
    });

    // Proud Lion Head + Curly Mane Curls + Ears & Snout
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12), stoneMat);
    head.position.set(0, 1.56, 0.20);
    head.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.36), carvedTrim);
    snout.position.set(0, 1.44, 0.62);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), stoneMat);
    nose.position.set(0, 1.58, 0.72);
    lion.add(head, snout, nose);

    // Sculpted Curly Stone Mane Spirals around Head
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), carvedTrim);
      curl.position.set(Math.cos(ang) * 0.46, 1.56 + Math.sin(ang) * 0.44, 0.08 + (i % 2) * 0.06);
      lion.add(curl);
    }

    g.add(lion);
    return g;
  },

  // -------------------- GREAT WHITE STUPA (藏式覆钵式大白塔 - MATCHING REFERENCE PHOTO) --------------------
  createWhiteStupaModel(stupaNumber = 1) {
    const stupa = new THREE.Group();

    // Pure chalk-white limewashed stucco material (matching the bright white stupa in the photo)
    const whiteStuccoMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbf9,
      roughness: 0.48,
      metalness: 0.04
    });

    // Dark carved slate-grey stone frieze band at the base of the dome (matching photo bottom)
    const darkCarvedStoneMat = new THREE.MeshStandardMaterial({
      color: 0x52565e,
      roughness: 0.75,
      metalness: 0.1
    });

    // Ornate gilded bronze/gold for the top canopy umbrella, valance & finial
    const gildedBronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd89b28,
      emissive: 0x2a1800,
      metalness: 0.85,
      roughness: 0.24
    });

    const crimsonRimMat = new THREE.MeshStandardMaterial({
      color: 0x7a1c1c,
      roughness: 0.45,
      metalness: 0.3
    });

    // 1. Circular Clockwise Circumambulation Marble Path (顺时针绕塔白玉步道)
    const pathOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(7.6, 7.8, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.55 })
    );
    pathOuter.position.y = 0.07;
    pathOuter.receiveShadow = true;
    pathOuter.name = 'walkable_ground';
    stupa.add(pathOuter);

    // Golden Clockwise Direction Track Ring & 8 Clockwise Arrow Markers on the Ground
    const trackRing = new THREE.Mesh(
      new THREE.RingGeometry(5.2, 5.55, 48),
      new THREE.MeshBasicMaterial({ color: 0xf4b942, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    trackRing.rotation.x = -Math.PI / 2;
    trackRing.position.y = 0.16;
    stupa.add(trackRing);

    const arrowsGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      // Clockwise around +Y from top view means angle theta increases:
      // pos = (cos(theta)*R, sin(theta)*R), tangent = (-sin(theta), cos(theta))
      const theta = (i / 8) * Math.PI * 2;
      const r = 5.38;
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.65, 3),
        new THREE.MeshBasicMaterial({ color: 0xd97706 })
      );
      arrow.position.set(Math.cos(theta) * r, 0.18, Math.sin(theta) * r);
      // Point cone along clockwise tangent (-sin(theta), 0, cos(theta))
      const targetPos = new THREE.Vector3(
        Math.cos(theta) * r - Math.sin(theta),
        0.18,
        Math.sin(theta) * r + Math.cos(theta)
      );
      arrow.lookAt(targetPos);
      arrow.rotateX(Math.PI / 2);
      arrowsGroup.add(arrow);
    }
    stupa.add(arrowsGroup);
    stupa.userData.arrowsGroup = arrowsGroup;

    // 2. Stepped Sumeru Stone Pedestal & Dark Grey Carved Lotus Relief Base (塔基与深灰石雕莲瓣座)
    const baseOctagon = new THREE.Mesh(
      new THREE.CylinderGeometry(3.85, 4.1, 0.65, 16),
      new THREE.MeshStandardMaterial({ color: 0xdcd6cc, roughness: 0.6 })
    );
    baseOctagon.position.y = 0.325;
    baseOctagon.castShadow = true;
    baseOctagon.receiveShadow = true;
    stupa.add(baseOctagon);

    // Dark grey carved stone relief band seen at the bottom of the photo
    const darkCarvedBand = new THREE.Mesh(
      new THREE.CylinderGeometry(3.38, 3.62, 0.65, 32),
      darkCarvedStoneMat
    );
    darkCarvedBand.position.y = 0.95;
    stupa.add(darkCarvedBand);

    // Sculpted vertical lotus-petal reliefs around the dark stone band
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const relief = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.12), darkCarvedStoneMat);
      relief.position.set(Math.cos(ang) * 3.48, 0.95, Math.sin(ang) * 3.48);
      relief.rotation.y = -ang;
      stupa.add(relief);
    }

    // 3. Lathe-Sculpted White Bulbous Stupa Belly (覆钵式大白塔身)
    // Profile carefully traced from the reference photo:
    // - 3 stepped white horizontal molding rings at the bottom
    // - Smoothly curving, tall white bottle/vase belly widening slightly toward the upper shoulder
    // - Rounded inward dome shoulder
    const bellyPoints = [
      new THREE.Vector2(0.0, 1.25),
      new THREE.Vector2(3.42, 1.25),
      new THREE.Vector2(3.35, 1.45),
      new THREE.Vector2(3.22, 1.62),
      new THREE.Vector2(3.10, 1.82),
      new THREE.Vector2(2.96, 2.02),
      // Main smooth white belly rising and swelling gently at the shoulder
      new THREE.Vector2(2.92, 2.40),
      new THREE.Vector2(2.98, 3.20),
      new THREE.Vector2(3.08, 4.10),
      new THREE.Vector2(3.12, 4.85),
      new THREE.Vector2(3.04, 5.45),
      new THREE.Vector2(2.78, 5.92),
      new THREE.Vector2(2.30, 6.22),
      new THREE.Vector2(1.75, 6.38),
      new THREE.Vector2(0.0, 6.40)
    ];
    const bellyGeo = new THREE.LatheGeometry(bellyPoints, 40);
    const bellyMesh = new THREE.Mesh(bellyGeo, whiteStuccoMat);
    bellyMesh.castShadow = true;
    bellyMesh.receiveShadow = true;
    stupa.add(bellyMesh);

    // Three subtle white collar molding rings at the base of the belly
    [1.38, 1.62, 1.86].forEach((ry, idx) => {
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(3.32 - idx * 0.13, 0.08, 10, 36),
        whiteStuccoMat
      );
      collar.rotation.x = Math.PI / 2;
      collar.position.y = ry;
      stupa.add(collar);
    });

    // 4. Stepped Cruciform / Corbelled Harmika Neck (折角叠涩须弥塔颈)
    // Seen in the photo between the rounded white belly and the 13 rings
    const harmikaGroup = new THREE.Group();
    harmikaGroup.position.y = 6.35;
    for (let step = 0; step < 4; step++) {
      const w = 2.85 - step * 0.14;
      const y = step * 0.22;
      const box1 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, w), whiteStuccoMat);
      box1.position.y = y;
      // Cruciform Indented Corner Projections (亚字形折角)
      const box2 = new THREE.Mesh(new THREE.BoxGeometry(w * 1.12, 0.2, w * 0.72), whiteStuccoMat);
      box2.position.y = y;
      const box3 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.2, w * 1.12), whiteStuccoMat);
      box3.position.y = y;
      harmikaGroup.add(box1, box2, box3);
    }
    // Carved lotus bracket projections around the Harmika
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.32), whiteStuccoMat);
      bracket.position.set(Math.cos(ang) * 1.68, 0.45, Math.sin(ang) * 1.68);
      bracket.rotation.y = -ang;
      harmikaGroup.add(bracket);
    }
    stupa.add(harmikaGroup);

    // 5. The 13 Conical Dharma Wheel Rings (十三天相轮)
    // Tapering white cone ringed by 13 distinct horizontal rings
    const spireBaseY = 7.25;
    const spireHeight = 3.65;
    const coreCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 1.62, spireHeight, 32),
      whiteStuccoMat
    );
    coreCone.position.y = spireBaseY + spireHeight / 2;
    coreCone.castShadow = true;
    stupa.add(coreCone);

    for (let r = 0; r < 13; r++) {
      const t = r / 12;
      const ringRadius = 1.64 * (1 - t) + 0.90 * t;
      const ringY = spireBaseY + 0.12 + t * (spireHeight - 0.24);
      const wheelRing = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadius, 0.075, 10, 36),
        whiteStuccoMat
      );
      wheelRing.rotation.x = Math.PI / 2;
      wheelRing.position.y = ringY;
      stupa.add(wheelRing);
    }

    // 6. Ornate Gilded Bronze Canopy Umbrella with Hanging Tassels & Bells (鎏金华盖与流苏风铎)
    const canopyY = spireBaseY + spireHeight + 0.15; // ~11.05
    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = canopyY;

    // Wide Bronze Umbrella Disc
    const umbrellaDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.52, 1.68, 0.22, 32),
      gildedBronzeMat
    );
    canopyGroup.add(umbrellaDisc);

    // Crimson & Gold Ornamental Rim Band
    const rimBand = new THREE.Mesh(
      new THREE.CylinderGeometry(1.66, 1.66, 0.32, 32, 1, true),
      crimsonRimMat
    );
    rimBand.position.y = -0.12;
    canopyGroup.add(rimBand);

    // 24 Golden Valance Ornaments & Hanging Fringe Chains around the Canopy Perimeter (matching photo)
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const rx = Math.cos(ang) * 1.62;
      const rz = Math.sin(ang) * 1.62;

      // Golden boss stud on rim
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), gildedBronzeMat);
      boss.position.set(rx, -0.08, rz);
      canopyGroup.add(boss);

      // Delicate hanging golden chain/bell tassel
      const tasselLen = (i % 2 === 0) ? 0.78 : 0.55;
      const tassel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.028, tasselLen, 6),
        gildedBronzeMat
      );
      tassel.position.set(rx, -0.18 - tasselLen / 2, rz);
      canopyGroup.add(tassel);
    }
    stupa.add(canopyGroup);

    // 7. Pointed Golden Stupa Spire Finial on Top (鎏金宝顶塔刹)
    const finialBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.95, 0.35, 20),
      gildedBronzeMat
    );
    finialBase.position.y = canopyY + 0.25;
    const finialSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 1.15, 16),
      gildedBronzeMat
    );
    finialSpire.position.y = canopyY + 0.95;
    const topJewel = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe66d })
    );
    topJewel.position.y = canopyY + 1.55;
    stupa.add(finialBase, finialSpire, topJewel);

    // 8. High-Contrast 3D Golden Sequence Number Medallions (1–7) around the Stupa Belly
    const numCanvas = document.createElement('canvas');
    numCanvas.width = 160;
    numCanvas.height = 160;
    const nCtx = numCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#7a1c1c';
      nCtx.beginPath();
      nCtx.arc(80, 80, 74, 0, Math.PI * 2);
      nCtx.fill();
      nCtx.lineWidth = 10;
      nCtx.strokeStyle = '#f5c542';
      nCtx.stroke();
      nCtx.fillStyle = '#fff5cc';
      nCtx.font = '900 92px Georgia, "Segoe UI", sans-serif';
      nCtx.textAlign = 'center';
      nCtx.textBaseline = 'middle';
      nCtx.fillText(String(stupaNumber), 80, 84);
    }
    const numTex = new THREE.CanvasTexture(numCanvas);
    const numFaceMat = new THREE.MeshBasicMaterial({ map: numTex, side: THREE.DoubleSide });
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((ang) => {
      const badgeGroup = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.14, 24), gildedBronzeMat);
      rim.rotation.x = Math.PI / 2;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), numFaceMat);
      face.position.z = 0.08;
      badgeGroup.add(rim, face);
      badgeGroup.position.set(Math.sin(ang) * 3.16, 3.7, Math.cos(ang) * 3.16);
      badgeGroup.rotation.y = ang;
      stupa.add(badgeGroup);
    });

    return stupa;
  },

    // -------------------- SUNLIT MISTY VALLEY CANOPY TREE (Sansa-Inspired Natural Matte Foliage) --------------------
  createMistyValleyTree(scale = 1.0, hasPinkTop = true) {
    const tree = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4738, roughness: 0.92 });
    const greenDeep = new THREE.MeshStandardMaterial({ color: 0x3b6938, roughness: 0.86 });
    const greenBright = new THREE.MeshStandardMaterial({ color: 0x5c8b44, roughness: 0.84 });
    const amberAccent = new THREE.MeshStandardMaterial({ color: 0xc29848, roughness: 0.85 });
    const pinkCanopy = new THREE.MeshStandardMaterial({ color: 0xd9a7ad, roughness: 0.86 });

    // Main curved trunk & branching limbs
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.44, 2.9, 8), trunkMat);
    trunk.position.y = 1.45;
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    tree.add(trunk);

    const branchL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 7), trunkMat);
    branchL.position.set(-0.65, 2.75, 0);
    branchL.rotation.z = 0.58;
    const branchR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 7), trunkMat);
    branchR.position.set(0.65, 2.65, 0.18);
    branchR.rotation.z = -0.55;
    tree.add(branchL, branchR);

    // Broad layered chartreuse-emerald foliage clusters
    [
      [-1.1, 3.35, 0.0, 1.45, 0.72, 1.35, greenBright],
      [1.05, 3.25, 0.25, 1.35, 0.72, 1.35, greenDeep],
      [0.0, 3.65, -0.3, 1.65, 0.82, 1.5, greenBright]
    ].forEach(([cx, cy, cz, sx, sy, sz, mat]) => {
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), mat);
      canopy.scale.set(sx, sy, sz);
      canopy.position.set(cx, cy, cz);
      canopy.castShadow = true;
      tree.add(canopy);
    });

    // Soft Misty Pink Blossom or Autumn Amber Crown Tips (Sansa Sanctuary Palette)
    if (hasPinkTop) {
      const tipMat = scale > 1.38 ? amberAccent : pinkCanopy;
      [
        [0.0, 4.18, -0.1, 1.48, 0.62, 1.35],
        [-0.9, 3.78, 0.25, 1.05, 0.52, 0.98],
        [0.95, 3.72, -0.25, 1.0, 0.5, 0.95]
      ].forEach(([px, py, pz, sx, sy, sz]) => {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(1.0, 11, 9), tipMat);
        crown.scale.set(sx, sy, sz);
        crown.position.set(px, py, pz);
        tree.add(crown);
      });
    }

    tree.scale.set(scale, scale, scale);
    return tree;
  },

  // -------------------- EXPANDED LUSH MISTY VALLEY TERRAIN + MOUNTAIN RIVER + MOUNT WUTAI (东麓文殊山道) --------------------
  createSedaMountainValleyTerrain() {
    const valleyGroup = new THREE.Group();

    // 1. Expanded Subdivided 3D Mountain Valley Ground Mesh (360 x 250, x covers [-170, +190], z covers [-85, +165])
    const width = 360;
    const depth = 250;
    const segX = 170;
    const segZ = 120;
    const terrainGeo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = [];
    const mossBright = new THREE.Color(0x88a962); // Calm earthy moss grass (Sansa-style realism)
    const midForest = new THREE.Color(0x5b7f48);  // Natural olive-sage valley hillside
    const deepShade = new THREE.Color(0x3b5938);  // Shady misty pine slopes
    const riverBank = new THREE.Color(0x8c8770);  // Warm sand & mossy riverside stone
    const wutaiAutumn = new THREE.Color(0xb5915a); // Warm golden-ochre Mount Wutai monastery slopes
    const westJadeGarden = new THREE.Color(0x7aa36b); // Thangka-inspired emerald-sage Longevity Mountain meadow
    const westTealPeak = new THREE.Color(0x5a8c7a);   // Blue-green Thangka mountains behind 长寿殿 summit
    const snowAlpine = new THREE.Color(0xeef4fa);  // Snow-capped high mountain backdrop

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i) + 10; // x covers [-170, +190]
      const vz = posAttr.getZ(i) + 40; // z covers [-85, +165]
      posAttr.setX(i, vx);
      posAttr.setZ(i, vz);

      const h = window.GAME_DATA.getTerrainHeight(vx, vz);
      posAttr.setY(i, h - 0.05);

      const rc = window.GAME_DATA.getRiverCenterX(vz);
      const rHalf = window.GAME_DATA.getRiverHalfWidth(vz);
      const nearMainRiver = (vx > -24.5 && vx < 27.5 && vz >= 10.2 && vz <= 16.8) || (vz > 16.5 && vz <= 112 && Math.abs(vx - rc) < rHalf + 1.2);
      const nearEastRiver = (vz >= -24 && vz <= 44 && Math.abs(vx - 30.0) < 4.2);

      const c = new THREE.Color();
      if (nearMainRiver || nearEastRiver) {
        c.copy(riverBank);
      } else if (vx < -136 && vz >= -48 && vz <= 58) {
        c.lerpColors(westJadeGarden, westTealPeak, Math.min(1, Math.max(0, (h - 16.5) / 14.0)));
      } else if (vx <= -78 && vz >= -48 && vz <= 58) {
        c.copy(westJadeGarden).lerp(mossBright, 0.35);
      } else if (vx <= -20 && vz >= -48 && vz <= 58) {
        const slopeT = Math.min(1, Math.max(0, (-20 - vx) / 58));
        c.lerpColors(mossBright, westJadeGarden, slopeT * 0.85);
      } else if (vx > 144) {
        c.lerpColors(wutaiAutumn, snowAlpine, Math.min(1, Math.max(0, (h - 17.5) / 14.0)));
      } else if (vx > 33 && vz >= -24 && vz <= 44) {
        const slopeT = Math.min(1, Math.max(0, (vx - 33) / 80));
        c.lerpColors(mossBright, wutaiAutumn, slopeT * 0.72);
      } else if (h < 3.5) {
        c.lerpColors(mossBright, midForest, Math.max(0, h / 3.5) * 0.45);
      } else if (h < 13.0) {
        c.lerpColors(mossBright, midForest, (h - 3.5) / 9.5);
      } else {
        c.lerpColors(midForest, deepShade, Math.min(1, (h - 13.0) / 10.0));
      }
      colors.push(c.r, c.g, c.b);
    }

    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const groundTex = this.createRealisticGroundTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: groundTex,
      roughness: 0.92,
      metalness: 0.02
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.name = 'walkable_ground';
    valleyGroup.add(terrainMesh);

    // 2. Winding Flowing River from the Top of the Mountain (z = 112) down to the Temple Front Moat (z = 13.5)!
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x62a8bc,
      emissive: 0x163848,
      roughness: 0.10,
      metalness: 0.62,
      transparent: true,
      opacity: 0.88
    });

    // Build continuous custom ribbon geometry for the winding mountain stream (z from 16.2 to 112)
    const rVerts = [];
    const rIndices = [];
    const zStart = 16.0;
    const zEnd = 112.0;
    const rSteps = 96;
    for (let s = 0; s <= rSteps; s++) {
      const rz = zStart + (s / rSteps) * (zEnd - zStart);
      const rcx = window.GAME_DATA.getRiverCenterX(rz);
      const rhw = window.GAME_DATA.getRiverHalfWidth(rz);
      const leftH = window.GAME_DATA.getTerrainHeight(rcx - rhw, rz);
      const rightH = window.GAME_DATA.getTerrainHeight(rcx + rhw, rz);
      const waterY = Math.min(leftH, rightH) + 0.14;

      rVerts.push(rcx - rhw, waterY, rz);
      rVerts.push(rcx + rhw, waterY, rz);

      if (s < rSteps) {
        const b = s * 2;
        rIndices.push(b, b + 1, b + 2);
        rIndices.push(b + 1, b + 3, b + 2);
      }
    }
    const riverGeo = new THREE.BufferGeometry();
    riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(rVerts, 3));
    riverGeo.setIndex(rIndices);
    riverGeo.computeVertexNormals();
    const mountainRiverMesh = new THREE.Mesh(riverGeo, riverMat);
    valleyGroup.add(mountainRiverMesh);

    // Wide Reflecting River Basin across Temple Front (x = -24..27) + Separating East River (x = 30.0, z = -26..44)
    const templeFrontRiver = new THREE.Mesh(new THREE.PlaneGeometry(52, 5.8, 8, 4), riverMat);
    templeFrontRiver.rotation.x = -Math.PI / 2;
    templeFrontRiver.position.set(1.5, -0.05, 13.5);
    valleyGroup.add(templeFrontRiver);

    const eastSeparatingRiver = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 70, 6, 16), riverMat);
    eastSeparatingRiver.rotation.x = -Math.PI / 2;
    eastSeparatingRiver.position.set(30.0, -0.06, 9.0);
    valleyGroup.add(eastSeparatingRiver);

    // Mount Wutai Ascending Stone Stairway & Crimson Monastery Terrace Walls (Reference Photo Silhouette!)
    const wutaiStepMat = new THREE.MeshStandardMaterial({ color: 0xded4bf, roughness: 0.85 });
    const wutaiRedWallMat = new THREE.MeshStandardMaterial({ color: 0x992622, roughness: 0.80 });
    const wutaiAmberMat = new THREE.MeshStandardMaterial({ color: 0xcfa050, roughness: 0.85 });
    const wutaiPineMat = new THREE.MeshStandardMaterial({ color: 0x2d5432, roughness: 0.86 });

    // Connecting Plaza on West Bank to Bridge + East Bank to Ascending Mount Wutai Road
    const westApproach = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.14, 4.6), wutaiStepMat);
    westApproach.position.set(22.2, 0.04, 4.0);
    westApproach.receiveShadow = true;
    westApproach.name = 'walkable_ground';
    valleyGroup.add(westApproach);

    for (let sx = 34.5; sx <= 114.0; sx += 1.6) {
      const sy = window.GAME_DATA.getTerrainHeight(sx, 4.0);
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.18, 5.4), wutaiStepMat);
      step.position.set(sx, sy + 0.04, 4.0);
      step.rotation.z = 0.20;
      step.receiveShadow = true;
      step.name = 'walkable_ground';
      valleyGroup.add(step);
    }

    // Crimson monastery retaining walls & golden-autumn trees framing Mount Wutai steps
    [38, 52, 66, 80, 94, 108].forEach((wx, idx) => {
      const wy = window.GAME_DATA.getTerrainHeight(wx, 4.0);
      [-1, 1].forEach((sSide) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.45, 0.55), wutaiRedWallMat);
        wall.position.set(wx, wy + 0.65, 4.0 + sSide * 4.2);
        wall.castShadow = true;
        valleyGroup.add(wall);

        if (idx % 2 === 0) {
          const pineTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0x4f3a29, roughness: 0.9 }));
          pineTrunk.position.set(wx + 1.5, wy + 1.1, 4.0 + sSide * 13.5);
          const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.6, 8), idx === 0 ? wutaiAmberMat : wutaiPineMat);
          cone.position.set(wx + 1.5, wy + 3.2, 4.0 + sSide * 13.5);
          valleyGroup.add(pineTrunk, cone);
        }
      });
    });

    // Side Paths from main Mount Wutai Stairway to the 7 Stupas & Sutra Reading Stops
    (window.GAME_DATA.WENSHU_STUPAS || []).forEach((st) => {
      const sy = window.GAME_DATA.getTerrainHeight(st.x, st.z);
      const spurLen = Math.abs(st.z - 4.0);
      const spur = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, spurLen), wutaiStepMat);
      spur.position.set(st.x, sy + 0.03, (st.z + 4.0) / 2);
      spur.receiveShadow = true;
      spur.name = 'walkable_ground';
      valleyGroup.add(spur);
    });

    // Mossy Riverbank Stones & Pebbles bordering the Mountain Stream + Upper River Source Spring Pool
    const bankRockMat = new THREE.MeshLambertMaterial({ color: 0x7b8870 });
    for (let rz = 18; rz <= 110; rz += 3.2) {
      const rcx = window.GAME_DATA.getRiverCenterX(rz);
      const rhw = window.GAME_DATA.getRiverHalfWidth(rz);
      [-1, 1].forEach((side) => {
        if (Math.abs(rz - 36.0) < 3.0) return; // keep river crossing clear
        const rx = rcx + side * (rhw + 0.45 + Math.sin(rz * 1.3 + side) * 0.25);
        const ry = window.GAME_DATA.getTerrainHeight(rx, rz);
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + Math.abs(Math.cos(rz)) * 0.35, 0), bankRockMat);
        rock.scale.set(1.25, 0.58, 1.05);
        rock.position.set(rx, ry + 0.16, rz);
        rock.rotation.y = rz * 0.7;
        valleyGroup.add(rock);
      });
    }

    // Mountain Spring Headwaters Pool at the Top Peak (z = 112)
    const springPoolY = window.GAME_DATA.getTerrainHeight(window.GAME_DATA.getRiverCenterX(112), 112) + 0.18;
    const springPool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), riverMat);
    springPool.rotation.x = -Math.PI / 2;
    springPool.position.set(window.GAME_DATA.getRiverCenterX(112), springPoolY, 112);
    valleyGroup.add(springPool);

    // 3. Expanded Sloped Cobblestone Trail from Mountain-Top Home (z = 104) down to Red Bridge Approach (z = 18.5)
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xe3d8c3 });
    for (let pz = 19; pz <= 104; pz += 1.65) {
      const rcx = window.GAME_DATA.getRiverCenterX(pz);
      // Trail weaves warmly along the sunnier bank opposite or alongside the stream, converging at z = 36 & z = 18.5
      let px = rcx > 0 ? rcx - 5.2 : rcx + 5.2;
      if (Math.abs(pz - 36.0) < 5.5) px *= (Math.abs(pz - 36.0) / 5.5);
      if (pz < 24.0) px *= ((pz - 18.5) / 5.5);

      const py = window.GAME_DATA.getTerrainHeight(px, pz);
      const stepSlab = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 1.85), pathMat);
      stepSlab.position.set(px, py + 0.02, pz);
      stepSlab.rotation.x = 0.20;
      stepSlab.receiveShadow = true;
      stepSlab.name = 'walkable_ground';
      valleyGroup.add(stepSlab);
    }

    // Side Stone Paths connecting the Mountain Trail to every Good Deed Landmark
    const seenBranches = new Set();
    window.GAME_DATA.GOOD_DEEDS.forEach((deed) => {
      const key = `${deed.pos.x}_${deed.pos.z}`;
      if (seenBranches.has(key)) return;
      seenBranches.add(key);
      if (Math.abs(deed.pos.x) > 2 && deed.pos.z > 16) {
        const branchLen = Math.abs(deed.pos.x);
        const branchX = deed.pos.x / 2;
        const branchY = window.GAME_DATA.getTerrainHeight(branchX, deed.pos.z);
        const branch = new THREE.Mesh(new THREE.BoxGeometry(branchLen, 0.12, 3.0), pathMat);
        branch.position.set(branchX, branchY + 0.02, deed.pos.z);
        branch.name = 'walkable_ground';
        valleyGroup.add(branch);
      }
    });

    // Water-Moon Mirror Pond (水月镜池) inside the Courtyard Forecourt (x = 18.0, z = 6.5)
    const pondGroup = new THREE.Group();
    pondGroup.position.set(18.0, 0.02, 6.5);
    const pondRim = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 4.45, 32),
      new THREE.MeshLambertMaterial({ color: 0xd6d2c4, side: THREE.DoubleSide })
    );
    pondRim.rotation.x = -Math.PI / 2;
    pondRim.position.y = 0.08;
    const pondWater = new THREE.Mesh(
      new THREE.CircleGeometry(3.9, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1d4e89,
        emissive: 0x0b2545,
        roughness: 0.12,
        metalness: 0.75
      })
    );
    pondWater.rotation.x = -Math.PI / 2;
    pondWater.position.y = 0.06;
    const moonReflection = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe680, transparent: true, opacity: 0.85 })
    );
    moonReflection.rotation.x = -Math.PI / 2;
    moonReflection.position.set(0.3, 0.08, -0.2);
    const moonHalo = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.85, 28),
      new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
    );
    moonHalo.rotation.x = -Math.PI / 2;
    moonHalo.position.set(0.3, 0.075, -0.2);
    pondGroup.add(pondRim, pondWater, moonReflection, moonHalo);

    [[-1.6, 1.2], [1.8, 1.3], [-1.4, -1.5], [1.6, -1.4]].forEach(([lx, lz]) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 14), new THREE.MeshLambertMaterial({ color: 0x2d6a4f }));
      pad.position.set(lx, 0.09, lz);
      const flower = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 8), new THREE.MeshBasicMaterial({ color: 0xffb3c6 }));
      flower.position.set(lx, 0.22, lz);
      pondGroup.add(pad, flower);
    });
    valleyGroup.add(pondGroup);

    // Mountain Summit Welcome Archway at Top Trail Start (z = 107.5)
    const summitY = window.GAME_DATA.getTerrainHeight(0, 107.5);
    const summitArch = new THREE.Group();
    summitArch.position.set(0, summitY, 107.5);
    const redWood = new THREE.MeshLambertMaterial({ color: 0x9b2226 });
    const goldTrim = new THREE.MeshPhongMaterial({ color: 0xf4b942 });
    [-3.6, 3.6].forEach((px) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 4.8, 12), redWood);
      p.position.set(px, 2.4, 0);
      summitArch.add(p);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.65, 0.75), goldTrim);
    beam.position.set(0, 4.8, 0);
    summitArch.add(beam);
    valleyGroup.add(summitArch);

    // 4. Picture-1 Misty Canopy Trees (Lush Green + Pink Blossom Crowns) & Golden Diagonal Sunbeams!
    for (let z = -10; z <= 108; z += 7.2) {
      [-1, 1].forEach((side, sIdx) => {
        for (let tier = 0; tier < 2; tier++) {
          const x = side * (22.5 + tier * 11.5 + Math.sin(z * 0.7 + tier) * 3.8);
          if (Math.abs(z - 13.5) < 4.5 && Math.abs(x) < 30) continue;
          if (x > 22.5 && z > -18 && z < 38) continue;
          if (x < -19.5 && z > -42 && z < 50) continue;

          let tooClose = false;
          for (const d of window.GAME_DATA.GOOD_DEEDS) {
            if (Math.hypot(x - d.pos.x, z - d.pos.z) < 7.5) {
              tooClose = true;
              break;
            }
          }
          if (tooClose) continue;

          const y = window.GAME_DATA.getTerrainHeight(x, z);
          const sc = 1.1 + Math.abs(Math.sin(x * 0.41 + z * 0.23)) * 0.85;
          const tree = this.createMistyValleyTree(sc, (Math.floor(z) + tier + sIdx) % 3 !== 0);
          tree.position.set(x, y - 0.1, z);
          tree.rotation.y = (x + z) * 0.8;
          valleyGroup.add(tree);
        }
      });
    }

    // Soft Diagonal Sunlit Rays through Misty Valley Canopy (Picture 1 Atmosphere)
    const sunbeamMat = new THREE.MeshBasicMaterial({
      color: 0xfff8d6,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    [
      [-14, 18, 86], [12, 16, 68], [-10, 14, 48], [16, 12, 26], [0, 10, 14]
    ].forEach(([bx, by, bz], idx) => {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 5.2, 34, 10, 1, true), sunbeamMat);
      ray.position.set(bx, by, bz);
      ray.rotation.z = 0.36;
      ray.rotation.x = 0.18 + idx * 0.02;
      valleyGroup.add(ray);
    });

    // 5. Lush 3D Green Grass Tufts & Soft Meadow Shrubs across both Valley Hillsides
    const grassPositions = [];
    for (let z = -16; z <= 108; z += 3.2) {
      [-1, 1].forEach((side) => {
        for (let row = 0; row < 8; row++) {
          const x = side * (14.5 + row * 3.8 + Math.sin(z * 1.9 + row) * 1.2);
          if (x > 22.5 && z > -18 && z < 38) continue;
          if (x < -19.5 && z > -42 && z < 50) continue;
          if (Math.abs(z - 13.5) < 3.6) continue;
          if (Math.abs(x - window.GAME_DATA.getRiverCenterX(z)) < 3.4) continue;

          let nearDeed = false;
          for (const d of window.GAME_DATA.GOOD_DEEDS) {
            if (Math.hypot(x - d.pos.x, z - d.pos.z) < 6.4) {
              nearDeed = true;
              break;
            }
          }
          if (nearDeed) continue;

          const y = window.GAME_DATA.getTerrainHeight(x, z);
          const scale = 0.75 + ((Math.abs(Math.sin(x * 2.3 + z * 1.7))) * 0.65);
          grassPositions.push({ x, y, z, rotY: (x + z) * 0.7, scale });
        }
      });
    }

    const tuftGeo = new THREE.ConeGeometry(0.55, 1.15, 6);
    const tuftMat1 = new THREE.MeshStandardMaterial({ color: 0x4b7040, roughness: 0.92 });
    const tuftMat2 = new THREE.MeshStandardMaterial({ color: 0x62854b, roughness: 0.92 });
    const grassInst1 = new THREE.InstancedMesh(tuftGeo, tuftMat1, grassPositions.length);
    const grassInst2 = new THREE.InstancedMesh(tuftGeo, tuftMat2, grassPositions.length);

    const dummy = new THREE.Object3D();
    grassPositions.forEach((gp, idx) => {
      dummy.position.set(gp.x, gp.y + 0.42 * gp.scale, gp.z);
      dummy.rotation.set(0.12, gp.rotY, -0.1);
      dummy.scale.set(gp.scale, gp.scale, gp.scale);
      dummy.updateMatrix();
      grassInst1.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(gp.x + 0.32, gp.y + 0.35 * gp.scale, gp.z + 0.22);
      dummy.rotation.set(-0.1, gp.rotY + 1.1, 0.14);
      dummy.scale.set(gp.scale * 0.85, gp.scale * 0.9, gp.scale * 0.85);
      dummy.updateMatrix();
      grassInst2.setMatrixAt(idx, dummy.matrix);
    });
    valleyGroup.add(grassInst1, grassInst2);

    // 6. Majestic Misty Green Horizon Mountains encircling Valley + Snow-Capped Mount Wutai & West Thangka Backdrop Peaks!
    const mountainConfigs = [
      { x: -55, z: -68, r: 38, h: 42 },
      { x: 0, z: -74, r: 44, h: 48 },
      { x: 55, z: -68, r: 38, h: 40 },
      { x: -85, z: 108, r: 32, h: 38 },
      { x: 76, z: 68, r: 34, h: 38 },
      { x: -24, z: 132, r: 36, h: 44 },
      { x: 24, z: 132, r: 36, h: 44 }
    ];

    const greenMountainMat = new THREE.MeshLambertMaterial({ color: 0x3b7a3d });
    const mistPeakMat = new THREE.MeshLambertMaterial({ color: 0xb7d9bc });

    mountainConfigs.forEach((mc) => {
      const mGroup = new THREE.Group();
      const baseCone = new THREE.Mesh(new THREE.ConeGeometry(mc.r, mc.h, 12), greenMountainMat);
      baseCone.position.y = mc.h / 2 - 2;
      const mistCone = new THREE.Mesh(
        new THREE.ConeGeometry(mc.r * 0.42, mc.h * 0.42, 12),
        mistPeakMat
      );
      mistCone.position.y = mc.h * 0.80 - 2;
      mGroup.add(baseCone, mistCone);
      mGroup.position.set(mc.x, 0, mc.z);
      valleyGroup.add(mGroup);
    });

    // Distant Blue-Green Thangka Backdrop Peaks far behind the West Longevity Summit Plaza (non-encroaching)
    const westThangkaBaseMat = new THREE.MeshLambertMaterial({ color: 0x4b7d6e });
    const westThangkaMistMat = new THREE.MeshLambertMaterial({ color: 0xcbe8df });
    [
      { x: -168, z: -30, r: 40, h: 60 },
      { x: -174, z: 4, r: 46, h: 70 },
      { x: -166, z: 38, r: 40, h: 58 }
    ].forEach((wp) => {
      const wGroup = new THREE.Group();
      const base = new THREE.Mesh(new THREE.ConeGeometry(wp.r, wp.h, 14), westThangkaBaseMat);
      base.position.y = wp.h / 2 + 2;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(wp.r * 0.50, wp.h * 0.50, 14), westThangkaMistMat);
      cap.position.y = wp.h * 0.78 + 2;
      wGroup.add(base, cap);
      wGroup.position.set(wp.x, 0, wp.z);
      valleyGroup.add(wGroup);
    });

    // Snow-Capped Blue-Slate Alpine Ridges behind Mount Wutai 文殊殿 (Reference Photo!)
    const alpineSlateMat = new THREE.MeshLambertMaterial({ color: 0x5c6f8c });
    const snowCapMat = new THREE.MeshLambertMaterial({ color: 0xf4f8fc });
    [
      { x: 168, z: -32, r: 42, h: 64 },
      { x: 174, z: 6, r: 48, h: 74 },
      { x: 166, z: 42, r: 40, h: 62 }
    ].forEach((ap) => {
      const aGroup = new THREE.Group();
      const base = new THREE.Mesh(new THREE.ConeGeometry(ap.r, ap.h, 14), alpineSlateMat);
      base.position.y = ap.h / 2 + 2;
      const snow = new THREE.Mesh(new THREE.ConeGeometry(ap.r * 0.56, ap.h * 0.56, 14), snowCapMat);
      snow.position.y = ap.h * 0.78 + 2;
      aGroup.add(base, snow);
      aGroup.position.set(ap.x, 0, ap.z);
      valleyGroup.add(aGroup);
    });

    // 7. Sansa-Style Glowing Stone Floor Lanterns (石灯) along temple forecourt & mountain trail
    const lanternCoords = [
      [-5.2, 8.8], [5.2, 8.8], [-5.2, 18.2], [5.2, 18.2],
      [-5.6, 30.0], [5.4, 46.0], [-4.8, 66.0], [4.6, 84.0], [-5.2, 99.5]
    ];
    lanternCoords.forEach(([lx, lz]) => {
      const ly = window.GAME_DATA.getTerrainHeight(lx, lz);
      const lantern = this.createStoneLanternModel();
      lantern.position.set(lx, ly, lz);
      valleyGroup.add(lantern);
    });

    return valleyGroup;
  },

  // -------------------- SANSA-STYLE WARM STONE LANTERN (石灯) --------------------
  createStoneLanternModel() {
    const g = new THREE.Group();
    const granite = new THREE.MeshStandardMaterial({ color: 0x8f8a82, roughness: 0.90 });
    const darkRoof = new THREE.MeshStandardMaterial({ color: 0x615d57, roughness: 0.88 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd27d });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.68), granite);
    base.position.y = 0.12;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.32), granite);
    pillar.position.y = 0.60;
    const chamberFrame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.54), granite);
    chamberFrame.position.y = 1.18;
    const coreGlow = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.30, 0.34), glowMat);
    coreGlow.position.y = 1.18;
    const coreGlow2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.30, 0.56), glowMat);
    coreGlow2.position.y = 1.18;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.36, 4), darkRoof);
    cap.position.y = 1.58;
    cap.rotation.y = Math.PI / 4;
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), granite);
    finial.position.y = 1.80;

    g.add(base, pillar, chamberFrame, coreGlow, coreGlow2, cap, finial);
    return g;
  },

  // -------------------- GIANT BRONZE TEMPLE BELL PAVILION (Sansa-Inspired 钟楼) --------------------
  createBellPavilionModel() {
    const g = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.88 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x5c3018, roughness: 0.82 });
    const redTimberMat = new THREE.MeshStandardMaterial({ color: 0x8c231c, roughness: 0.78 });
    const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x454a4d, roughness: 0.75 });
    const bronzeBellMat = new THREE.MeshStandardMaterial({
      color: 0x4d6b56,
      emissive: 0x0c140e,
      metalness: 0.62,
      roughness: 0.42
    });

    // Raised granite platform with step
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.52, 6.6), stoneMat);
    plinth.position.y = 0.26;
    plinth.receiveShadow = true;
    plinth.castShadow = true;
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.26, 0.9), stoneMat);
    step.position.set(0, 0.13, 3.6);
    g.add(plinth, step);

    // 4 Red-Timber Corner Pillars
    [[-2.35, -2.35], [2.35, -2.35], [-2.35, 2.35], [2.35, 2.35]].forEach(([px, pz]) => {
      const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 0.22, 12), stoneMat);
      colBase.position.set(px, 0.62, pz);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 3.85, 14), redTimberMat);
      col.position.set(px, 2.55, pz);
      col.castShadow = true;
      g.add(colBase, col);
    });

    // Crossbeams supporting bell
    const beamX1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.26, 0.28), timberMat);
    beamX1.position.set(0, 4.35, 0);
    const beamZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 5.2), timberMat);
    beamZ1.position.set(0, 4.35, 0);
    g.add(beamX1, beamZ1);

    // Two-tier traditional dark tile pavilion roof
    const lowerEave = new THREE.Mesh(new THREE.ConeGeometry(4.9, 1.35, 4), roofTileMat);
    lowerEave.position.y = 5.10;
    lowerEave.rotation.y = Math.PI / 4;
    lowerEave.castShadow = true;
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.25, 4), roofTileMat);
    upperRoof.position.y = 5.95;
    upperRoof.rotation.y = Math.PI / 4;
    const ridgeJewel = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xd9a841, metalness: 0.7, roughness: 0.28 })
    );
    ridgeJewel.position.y = 6.65;
    g.add(lowerEave, upperRoof, ridgeJewel);

    // Suspended Patinated Green-Bronze Temple Bell
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 3.9, 0);
    const crownHook = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16), bronzeBellMat);
    crownHook.position.y = 0.35;
    const bellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.96, 1.75, 24), bronzeBellMat);
    bellBody.position.y = -0.62;
    bellBody.castShadow = true;
    const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 10, 28), bronzeBellMat);
    bellRim.rotation.x = Math.PI / 2;
    bellRim.position.y = -1.48;
    const strikerSpot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0xc29c4a, metalness: 0.65, roughness: 0.35 })
    );
    strikerSpot.rotation.x = Math.PI / 2;
    strikerSpot.position.set(0, -1.05, 0.88);
    bellGroup.add(crownHook, bellBody, bellRim, strikerSpot);
    g.add(bellGroup);

    // Hanging Wooden Striking Log (撞木) in front of the bell
    const strikerPivot = new THREE.Group();
    strikerPivot.position.set(0, 3.85, 1.95);
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.05, 8),
      new THREE.MeshStandardMaterial({ color: 0x9c825a, roughness: 0.9 })
    );
    rope.position.y = -0.52;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.0, 12), timberMat);
    log.rotation.x = Math.PI / 2;
    log.position.set(0, -1.05, 0.25);
    strikerPivot.add(rope, log);
    g.add(strikerPivot);

    g.userData.bellGroup = bellGroup;
    g.userData.strikerPivot = strikerPivot;
    g.userData.bellSwing = 0;
    return g;
  },

  // -------------------- SCENIC SIT & CONTEMPLATE PIER / BENCH --------------------
  createScenicBenchAndPier(seat) {
    const g = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c5334, roughness: 0.86 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4f321d, roughness: 0.88 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x9e2a22, roughness: 0.82 });
    const saffronTrim = new THREE.MeshStandardMaterial({ color: 0xe6a825, roughness: 0.72 });

    if (seat.isPier) {
      // Wooden Lakeside Meditation Pier jutting warmly toward the Lotus Mirror Pond
      const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 3.8), woodMat);
      deck.position.y = 0.16;
      deck.receiveShadow = true;
      deck.castShadow = true;
      g.add(deck);
      [[-1.4, -1.5], [1.4, -1.5], [-1.4, 1.5], [1.4, 1.5]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.9, 10), darkWoodMat);
        post.position.set(px, 0.2, pz);
        g.add(post);
      });
    } else {
      // Warm Cedar Viewing Bench with slatted seat & legs
      const plank1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.42), woodMat);
      plank1.position.set(0, 0.46, 0.16);
      plank1.castShadow = true;
      const plank2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.42), woodMat);
      plank2.position.set(0, 0.46, -0.26);
      plank2.castShadow = true;
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.36, 0.1), woodMat);
      backrest.position.set(0, 0.86, -0.46);
      backrest.rotation.x = -0.14;
      [-0.85, 0.85].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.88), darkWoodMat);
        leg.position.set(lx, 0.24, -0.05);
        g.add(leg);
      });
      g.add(plank1, plank2, backrest);
    }

    // Round Tibetan Meditation Cushion placed nicely on top
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.14, 18), cushionMat);
    cushion.position.set(0, seat.isPier ? 0.34 : 0.56, 0.04);
    const cushionRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.035, 8, 20), saffronTrim);
    cushionRim.rotation.x = Math.PI / 2;
    cushionRim.position.set(0, seat.isPier ? 0.36 : 0.58, 0.04);
    g.add(cushion, cushionRim);

    // Soft floating lotus lantern glow above bench when nearby
    const lotusGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.48, 0.58, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
    );
    lotusGlow.rotation.x = -Math.PI / 2;
    lotusGlow.position.set(0, 0.06, 0);
    g.add(lotusGlow);

    // Picture #4 Serenity Resting Aesthetic: White Concentric Ground Ripples + Overhanging White Blossom Branch
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0xf7f2ff, side: THREE.DoubleSide, transparent: true, opacity: 0.52 });
    [0.95, 1.32, 1.68].forEach((rr, ri) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.032, 32), rippleMat.clone());
      ring.material.opacity = 0.52 - ri * 0.12;
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.07 + ri * 0.005, 0.45);
      g.add(ring);
    });

    const blossomArch = new THREE.Group();
    const branchBarkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f24, roughness: 0.9 });
    const whitePetalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffeef8,
      emissiveIntensity: 0.35,
      roughness: 0.4
    });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8), branchBarkMat);
    trunk.position.set(-1.35, 1.6, -0.55);
    trunk.rotation.z = -0.18;
    const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 2.7, 7), branchBarkMat);
    bough.position.set(-0.25, 3.1, -0.15);
    bough.rotation.z = -1.25;
    blossomArch.add(trunk, bough);
    for (let b = 0; b < 11; b++) {
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.24 + (b % 3) * 0.08, 1),
        whitePetalMat
      );
      flower.position.set(-1.0 + b * 0.25, 2.85 + Math.sin(b * 1.1) * 0.28, -0.3 + (b % 2) * 0.36);
      flower.scale.set(1.2, 0.72, 1.1);
      blossomArch.add(flower);
    }
    g.add(blossomArch);

    return g;
  },

  // -------------------- SIMPLER CUTE CHIBI BABY MONK (Exact Sticker Style from User Image) --------------------
  // -------------------- PICTURE #2 CUTE GOLDEN-ROBED BUDDHA-CHILD CHARACTER --------------------
  createCuteRedTibetanMonkParts(THREE) {
    const group = new THREE.Group();

    const goldKasayaMat = new THREE.MeshLambertMaterial({ color: 0xf4c41c });
    const kasayaFoldMat = new THREE.MeshLambertMaterial({ color: 0xe3a008 });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffe0c4 });
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff9494, transparent: true, opacity: 0.65 });
    const featureMat = new THREE.MeshBasicMaterial({ color: 0x1e1b24 });
    const smileMat = new THREE.MeshBasicMaterial({ color: 0xa61d24 });
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });
    const navyHairMat = new THREE.MeshLambertMaterial({ color: 0x102a5c });
    const haloGlowMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.56
    });
    const haloRayMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });

    // Lower golden pleated kasaya robe & bare cute feet (Picture #2)
    const lowerBody = new THREE.Group();
    const robeSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.58, 18), goldKasayaMat);
    robeSkirt.position.y = 0.46;
    robeSkirt.castShadow = true;
    lowerBody.add(robeSkirt);

    for (let f = 0; f < 5; f++) {
      const ang = -0.7 + f * 0.35;
      const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.54, 6), kasayaFoldMat);
      pleat.position.set(Math.sin(ang) * 0.34, 0.46, Math.cos(ang) * 0.34);
      lowerBody.add(pleat);
    }

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.13, 0.18, 0);
    const lLegCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.14, 10), skinMat);
    lLegCyl.position.y = -0.06;
    const lFoot = new THREE.Mesh(new THREE.SphereGeometry(0.092, 12, 10), skinMat);
    lFoot.scale.set(0.95, 0.55, 1.35);
    lFoot.position.set(0, -0.13, 0.04);
    leftLeg.add(lLegCyl, lFoot);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.13, 0.18, 0);
    const rLegCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.14, 10), skinMat);
    rLegCyl.position.y = -0.06;
    const rFoot = new THREE.Mesh(new THREE.SphereGeometry(0.092, 12, 10), skinMat);
    rFoot.scale.set(0.95, 0.55, 1.35);
    rFoot.position.set(0, -0.13, 0.04);
    rightLeg.add(rLegCyl, rFoot);

    lowerBody.add(leftLeg, rightLeg);
    group.add(lowerBody);

    // Sitting white concentric light ripples (Picture #4 - shown when seated)
    const rippleGroup = new THREE.Group();
    [0.62, 0.85, 1.08].forEach((r, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.025, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.72 - idx * 0.18 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04 + idx * 0.004;
      rippleGroup.add(ring);
    });
    rippleGroup.visible = false;
    group.add(rippleGroup);

    // Upper body: One-shoulder golden kasaya + diagonal folds + bare right shoulder (-X)
    const upperBody = new THREE.Group();
    upperBody.position.y = 0.74;
    group.add(upperBody);

    const bareTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.48, 16), skinMat);
    bareTorso.position.y = 0.25;
    bareTorso.castShadow = true;
    upperBody.add(bareTorso);

    const lowerWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.30, 0.34, 16), goldKasayaMat);
    lowerWrap.position.y = 0.16;
    lowerWrap.castShadow = true;
    upperBody.add(lowerWrap);

    const shoulderFold = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.072, 10, 22), kasayaFoldMat);
    shoulderFold.position.set(0.03, 0.30, 0.01);
    shoulderFold.rotation.set(0.45, 0.15, 0.62);
    const secondFold = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.036, 8, 20), goldKasayaMat);
    secondFold.position.set(0.02, 0.21, 0.015);
    secondFold.rotation.set(0.42, 0.15, 0.58);
    upperBody.add(shoulderFold, secondFold);

    // Joyful outstretched bare right arm (-X) & covered golden left arm (+X)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.30, 0.43, 0);
    const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), skinMat);
    const rArmCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.34, 10), skinMat);
    rArmCyl.position.y = -0.17;
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), skinMat);
    rHand.position.y = -0.36;
    leftArm.add(rShoulder, rArmCyl, rHand);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.30, 0.43, 0);
    const lSleeve = new THREE.Mesh(new THREE.ConeGeometry(0.135, 0.34, 12), goldKasayaMat);
    lSleeve.position.y = -0.14;
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), skinMat);
    lHand.position.y = -0.36;
    rightArm.add(lSleeve, lHand);
    upperBody.add(leftArm, rightArm);

    // Picture #2 Head: Chibi face, navy sculpted hair + round topknot bun, red urna dot, ^_^ happy eyes, open red smile & luminous radial sky halo!
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.90, 0);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.415, 24, 20), skinMat);
    headMesh.scale.set(1.03, 0.98, 0.96);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    const navyCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.428, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.54),
      navyHairMat
    );
    navyCap.scale.set(1.03, 0.98, 0.98);
    navyCap.position.set(0, 0.03, -0.035);
    navyCap.rotation.x = -0.22;
    const topKnotBun = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 14), navyHairMat);
    topKnotBun.scale.set(1.08, 0.85, 1.0);
    topKnotBun.position.set(0, 0.43, -0.05);
    headGroup.add(navyCap, topKnotBun);

    [-0.41, 0.41].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), skinMat);
      ear.scale.set(0.55, 1.25, 0.70);
      ear.position.set(ex, -0.04, -0.01);
      headGroup.add(ear);
    });

    // Red Forehead Urna Dot
    const urnaDot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), dotMat);
    urnaDot.position.set(0, 0.165, 0.398);
    headGroup.add(urnaDot);

    // Curved Happy Smiling Eyes (^_^) + Rosy Cheeks
    [-0.145, 0.145].forEach((ex) => {
      const happyEye = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.017, 6, 14, Math.PI), featureMat);
      happyEye.position.set(ex, 0.005, 0.378);
      happyEye.rotation.z = ex < 0 ? 0.08 : -0.08;

      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.072, 14), cheekMat);
      blush.scale.set(1.25, 0.72, 1);
      blush.position.set(ex * 1.48, -0.08, 0.348);
      blush.rotation.y = ex < 0 ? -0.35 : 0.35;
      headGroup.add(happyEye, blush);
    });

    // Bright Cheerful Red Open Smile
    const happySmile = new THREE.Mesh(new THREE.CircleGeometry(0.065, 14, Math.PI, Math.PI), smileMat);
    happySmile.position.set(0, -0.078, 0.388);
    headGroup.add(happySmile);

    // Radiant Sky-Blue & White Striped Halo behind head with Star Sparkles
    const headHalo = new THREE.Group();
    headHalo.position.set(0, 0.10, -0.26);
    const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), haloGlowMat);
    const haloRim = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.74, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    headHalo.add(haloDisc, haloRim);
    for (let s = 0; s < 12; s++) {
      const ang = (s / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 0.66), haloRayMat);
      spoke.position.set(Math.cos(ang) * 0.36, Math.sin(ang) * 0.36, 0.01);
      spoke.rotation.z = ang + Math.PI / 2;
      headHalo.add(spoke);
    }
    [[-0.45, 0.45], [0.48, 0.38], [0.05, 0.66], [-0.52, -0.15]].forEach(([sx, sy]) => {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      star.scale.set(1, 1, 0.25);
      star.position.set(sx, sy, 0.04);
      headHalo.add(star);
    });
    headGroup.add(headHalo);

    upperBody.add(headGroup);

    group.userData = {
      lowerBody,
      robeSkirt,
      upperBody,
      headGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      headHalo,
      rippleGroup
    };
    return group;
  },

  // -------------------- WISDOM BRIDGE ACROSS EAST RIVER (x = 25.5..34.5, z = 4.0) --------------------
  createWisdomBridgeModel(isBuilt) {
    const bridgeGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb9b09f, roughness: 0.88 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x8f552d, roughness: 0.78 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.65 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.65, roughness: 0.3 });

    // West & East stone bank abutments always present
    [25.6, 34.4].forEach((bx) => {
      const abt = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 5.8), stoneMat);
      abt.position.set(bx, 0.32, 4.0);
      abt.receiveShadow = true;
      bridgeGroup.add(abt);
    });

    if (!isBuilt) {
      // Unbuilt state: timber planks neatly stacked on west bank awaiting the Wisdom Bridge quest
      for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 8), timberMat);
        log.rotation.z = Math.PI / 2;
        log.position.set(24.0, 0.25 + (i % 2) * 0.22, 1.5 + Math.floor(i / 2) * 0.35);
        bridgeGroup.add(log);
      }
      return bridgeGroup;
    }

    // Arched vermilion & golden-capped Wisdom Bridge spanning East River (x: 25.5..34.5, z: 4.0)
    const plankCount = 15;
    for (let i = 0; i <= plankCount; i++) {
      const t = i / plankCount;
      const px = 25.4 + t * 9.2;
      const archY = 0.24 + Math.sin(t * Math.PI) * 1.15;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 4.9), timberMat);
      plank.position.set(px, archY, 4.0);
      plank.rotation.z = Math.cos(t * Math.PI) * 0.22;
      plank.castShadow = true;
      plank.receiveShadow = true;
      plank.name = 'walkable_ground';
      bridgeGroup.add(plank);
    }

    // Side vermilion railings & posts with golden lotus finials
    [-2.35, 2.35].forEach((rz) => {
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const px = 25.5 + t * 9.0;
        const py = 0.30 + Math.sin(t * Math.PI) * 1.15;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.05, 0.24), redMat);
        post.position.set(px, py + 0.52, 4.0 + rz);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), goldMat);
        cap.position.set(px, py + 1.12, 4.0 + rz);
        bridgeGroup.add(post, cap);
      }
      // Curved rail segments
      for (let i = 0; i < 10; i++) {
        const t0 = i / 10;
        const t1 = (i + 1) / 10;
        const x0 = 25.5 + t0 * 9.0;
        const x1 = 25.5 + t1 * 9.0;
        const y0 = 1.24 + Math.sin(t0 * Math.PI) * 1.15;
        const y1 = 1.24 + Math.sin(t1 * Math.PI) * 1.15;
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.14, 0.18), redMat);
        beam.position.set((x0 + x1) / 2, (y0 + y1) / 2, 4.0 + rz);
        beam.rotation.z = Math.atan2(y1 - y0, x1 - x0);
        bridgeGroup.add(beam);
      }
    });

    return bridgeGroup;
  },

  // -------------------- SUTRA BOOK DECORATION & CHILL CHAIR STATION --------------------
  createSutraReadingStationModel(bookData) {
    const group = new THREE.Group();
    const stoneBase = new THREE.MeshStandardMaterial({ color: 0xd9d2c5, roughness: 0.88 });
    const teakMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.72 });
    const maroonCloth = new THREE.MeshStandardMaterial({ color: 0x8f221d, roughness: 0.85 });
    const goldCover = new THREE.MeshStandardMaterial({ color: 0xf4b942, roughness: 0.38, metalness: 0.35 });
    const paperMat = new THREE.MeshLambertMaterial({ color: 0xfff8e7 });
    const wrapMat = new THREE.MeshStandardMaterial({ color: 0xc26a19, roughness: 0.78 });

    // Circular flagstone rest pad
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.14, 18), stoneBase);
    pad.position.y = 0.07;
    pad.receiveShadow = true;
    pad.name = 'walkable_ground';
    group.add(pad);

    // Ornate carved wooden reading desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.95), teakMat);
    deskTop.position.set(0, 0.92, -0.35);
    deskTop.castShadow = true;
    group.add(deskTop);
    [[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.02], [0.72, 0.02]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.86, 0.1), teakMat);
      leg.position.set(lx, 0.45, lz - 0.02);
      group.add(leg);
    });

    // Open golden-bordered Sutra book on the desk + stacked sutra volumes beside it
    const openLeft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.56), paperMat);
    openLeft.position.set(-0.22, 1.01, -0.35);
    openLeft.rotation.z = 0.12;
    const openRight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.56), paperMat);
    openRight.position.set(0.22, 1.01, -0.35);
    openRight.rotation.z = -0.12;
    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.6), goldCover);
    bookCover.position.set(0, 0.99, -0.35);
    group.add(bookCover, openLeft, openRight);

    // Stack of wrapped sutras on desk side
    [0, 1, 2].forEach((s) => {
      const vol = new THREE.Mesh(
        new THREE.BoxGeometry(0.42 - s * 0.03, 0.08, 0.24),
        s % 2 === 0 ? wrapMat : maroonCloth
      );
      vol.position.set(-0.62, 1.02 + s * 0.085, -0.35);
      vol.rotation.y = (s - 1) * 0.15;
      group.add(vol);
    });

    // Rolled Lotus-Sutra Scroll + Glowing Wisdom Orb on right side of desk
    const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.48, 10), goldCover);
    scroll.rotation.z = Math.PI / 2;
    scroll.rotation.y = 0.35;
    scroll.position.set(0.58, 1.03, -0.32);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    orb.position.set(0, 1.48, -0.35);
    group.add(scroll, orb);

    // Cozy Wooden Meditation Chair with Plush Maroon Cushion (for sitting to read)
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.10, 0.85), teakMat);
    chairSeat.position.set(0, 0.52, 0.85);
    const chairCushion = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.10, 0.72), maroonCloth);
    chairCushion.position.set(0, 0.62, 0.85);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 0.10), teakMat);
    chairBack.position.set(0, 0.90, 1.24);
    [[-0.4, 0.48], [0.4, 0.48], [-0.4, 1.2], [0.4, 1.2]].forEach(([cx, cz]) => {
      const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), teakMat);
      cLeg.position.set(cx, 0.25, cz);
      group.add(cLeg);
    });
    group.add(chairSeat, chairCushion, chairBack);

    // Decorative Sutra Lantern Post beside desk
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.75, 8), teakMat);
    post.position.set(1.35, 0.88, -0.35);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.34, 0.30),
      new THREE.MeshBasicMaterial({ color: 0xffe49c })
    );
    lamp.position.set(1.35, 1.85, -0.35);
    group.add(post, lamp);

    group.userData = { bookData, orb };
    return group;
  },

  // -------------------- SHARED PRAYER-HALL-STYLE ALTAR TABLE (7 WATER CUPS CENTER, FLOWER LEFT, INCENSE RIGHT) --------------------
  createHallAltarTableWithOfferings(leftSign = -1) {
    const offerTable = new THREE.Group();
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x7b1818, roughness: 0.42 });
    const goldTrim = new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.8, roughness: 0.24 });
    const cushionRed = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.72 });

    // Altar Table Base, Carved Rim & Imperial Gold Trim (centered at z = 0, facing along local X axis)
    const tblBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.02, 9.2), darkWood);
    tblBody.position.y = 0.51;
    tblBody.castShadow = true;
    const tblTop = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.16, 9.45), goldTrim);
    tblTop.position.y = 1.06;
    const tblCloth = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.62, 4.4), cushionRed);
    tblCloth.position.y = 0.68;
    offerTable.add(tblBody, tblTop, tblCloth);

    const surfaceY = 1.14;

    // 1. MIDDLE (centered at z = 0): 7 Ornate Golden Pedestal Water Cups (七杯供水, matching Prayer Hall)
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

    [-1.8, -1.2, -0.6, 0.0, 0.6, 1.2, 1.8].forEach((wz) => {
      const cup = new THREE.Group();
      cup.position.set(0, surfaceY, wz);

      const footBase = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.145, 0.12, 16), goldCupMat);
      footBase.position.y = 0.06;
      const footBeadRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 18), goldReliefMat);
      footBeadRing.rotation.x = Math.PI / 2;
      footBeadRing.position.y = 0.02;
      const stemRing = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.014, 8, 18), goldReliefMat);
      stemRing.rotation.x = Math.PI / 2;
      stemRing.position.y = 0.12;
      cup.add(footBase, footBeadRing, stemRing);

      const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.105, 0.20, 20), goldCupMat);
      belly.position.y = 0.22;
      cup.add(belly);

      for (let d = 0; d < 4; d++) {
        const ang = (d / 4) * Math.PI * 2;
        const medallion = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.072, 0.024), goldReliefMat);
        medallion.position.set(Math.cos(ang) * 0.15, 0.22, Math.sin(ang) * 0.15);
        medallion.rotation.y = -ang + Math.PI / 2;
        medallion.rotation.z = Math.PI / 4;
        cup.add(medallion);
      }

      const flaredLip = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.185, 0.04, 20), goldReliefMat);
      flaredLip.position.y = 0.33;
      const rimTorus = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 20), goldReliefMat);
      rimTorus.rotation.x = Math.PI / 2;
      rimTorus.position.y = 0.35;
      cup.add(flaredLip, rimTorus);

      const waterSurface = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.014, 18), pureWaterMat);
      waterSurface.position.y = 0.325;
      cup.add(waterSurface);

      waterGroup.add(cup);
    });
    waterGroup.visible = false;

    // 2. LEFT OF THE WATER (z = leftSign * 3.0 & leftSign * 3.8): Flower Offering (2 White Jade Lotus Vases)
    const flowerGroup = new THREE.Group();
    [leftSign * 3.75, leftSign * 2.95].forEach((fz) => {
      const vaseGroup = new THREE.Group();
      vaseGroup.position.set(0, surfaceY, fz);

      const vase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 0.52, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.2 })
      );
      vase.position.y = 0.26;
      vaseGroup.add(vase);

      for (let lf = 0; lf < 5; lf++) {
        const ang = (lf / 5) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.38, 6),
          new THREE.MeshLambertMaterial({ color: 0x2e8b57 })
        );
        leaf.position.set(Math.cos(ang) * 0.20, 0.58, Math.sin(ang) * 0.20);
        leaf.rotation.z = -Math.cos(ang) * 0.55;
        leaf.rotation.x = Math.sin(ang) * 0.55;
        vaseGroup.add(leaf);
      }

      const lotusCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0xffd166 })
      );
      lotusCore.position.y = 0.74;
      vaseGroup.add(lotusCore);

      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2;
        const petal = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.38, 6),
          new THREE.MeshLambertMaterial({ color: 0xff758f })
        );
        petal.position.set(Math.cos(ang) * 0.20, 0.74, Math.sin(ang) * 0.20);
        petal.rotation.z = -Math.cos(ang) * 0.42;
        petal.rotation.x = Math.sin(ang) * 0.42;
        vaseGroup.add(petal);
      }

      flowerGroup.add(vaseGroup);
    });
    flowerGroup.visible = false;

    // 3. RIGHT OF THE WATER (z = -leftSign * 3.35): Celadon Lotus Incense Holder & Upright Incense Stick (matching Prayer Hall)
    const scentGroup = new THREE.Group();
    scentGroup.position.set(0, surfaceY, -leftSign * 3.35);

    const celadonMat = new THREE.MeshStandardMaterial({
      color: 0x97c1a9,
      roughness: 0.2,
      metalness: 0.08
    });

    const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.29, 0.09, 20), celadonMat);
    lotusBase.position.y = 0.045;
    scentGroup.add(lotusBase);

    const ringConfigs = [
      { count: 8, radius: 0.145, tilt: 0.35, h: 0.30, r: 0.085, y: 0.16 },
      { count: 10, radius: 0.27, tilt: 0.68, h: 0.38, r: 0.10, y: 0.14 },
      { count: 12, radius: 0.39, tilt: 1.05, h: 0.41, r: 0.105, y: 0.11 }
    ];
    ringConfigs.forEach((rc, rIdx) => {
      for (let i = 0; i < rc.count; i++) {
        const ang = (i / rc.count) * Math.PI * 2 + rIdx * 0.25;
        const petal = new THREE.Mesh(new THREE.ConeGeometry(rc.r, rc.h, 5), celadonMat);
        petal.scale.set(1.0, 1.0, 0.52);
        petal.position.set(Math.cos(ang) * rc.radius, rc.y, Math.sin(ang) * rc.radius);
        petal.rotation.y = -ang + Math.PI / 2;
        petal.rotation.x = rc.tilt;
        scentGroup.add(petal);
      }
    });

    const incenseStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.015, 1.15, 8),
      new THREE.MeshLambertMaterial({ color: 0xc8b58a })
    );
    incenseStick.position.set(0, 0.65, 0);
    const charTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.016, 0.08, 8),
      new THREE.MeshBasicMaterial({ color: 0x2b2b2b })
    );
    charTip.position.set(0, 1.24, 0);
    const emberGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6b35 })
    );
    emberGlow.position.set(0, 1.29, 0);
    scentGroup.add(incenseStick, charTip, emberGlow);

    for (let s = 0; s < 5; s++) {
      const puff = new THREE.Mesh(
        new THREE.TorusGeometry(0.055 + s * 0.03, 0.015, 8, 14),
        new THREE.MeshBasicMaterial({ color: 0xf8f9fa, transparent: true, opacity: 0.44 - s * 0.07 })
      );
      puff.position.set(Math.sin(s) * 0.04, 1.40 + s * 0.20, 0);
      puff.rotation.x = Math.PI / 3;
      scentGroup.add(puff);
    }
    scentGroup.visible = false;

    offerTable.add(waterGroup, flowerGroup, scentGroup);
    offerTable.userData = { waterGroup, flowerGroup, scentGroup };
    return offerTable;
  },

  // Smooth C1 cosine dome & annular ring relief height helpers for 3D high-relief sacred sculptures
  _reliefDome(u, v, u0, v0, rx, ry) {
    const d = Math.hypot((u - u0) / rx, (v - v0) / ry);
    if (d >= 1) return 0;
    return 0.5 + 0.5 * Math.cos(d * Math.PI);
  },

  _reliefPlatform(u, v, u0, v0, rx, ry, flatRatio = 0.82) {
    const d = Math.hypot((u - u0) / rx, (v - v0) / ry);
    if (d >= 1) return 0;
    if (d <= flatRatio) return 1;
    return 0.5 + 0.5 * Math.cos(((d - flatRatio) / (1 - flatRatio)) * Math.PI);
  },

  _reliefRing(u, v, u0, v0, rx, ry, innerRatio, outerRatio) {
    const d = Math.hypot((u - u0) / rx, (v - v0) / ry);
    if (d < innerRatio || d > outerRatio) return 0;
    return Math.sin(((d - innerRatio) / (outerRatio - innerRatio)) * Math.PI);
  },

  // -------------------- MOUNT WUTAI SUMMIT 文殊殿 (MANJUSHRI HALL, 3D HIGH-RELIEF STATUE, CHILL AREA & OFFERINGS) --------------------
  createManjushriHallAndStatueModel() {
    const hall = new THREE.Group();
    const stonePlinth = new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.85 });
    const crimsonWall = new THREE.MeshStandardMaterial({ color: 0x8f201b, roughness: 0.78 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.75 });
    const goldTrim = new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.7, roughness: 0.25 });
    const goldBody = new THREE.MeshStandardMaterial({
      color: 0xf7c948,
      emissive: 0x4a2f00,
      metalness: 0.68,
      roughness: 0.22
    });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.75 });
    const cushionRed = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.85 });

    // Summit Palace Granite Plinth (Width X=19, Depth Z=25)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.7, 25.0), stonePlinth);
    plinth.position.y = 0.0;
    plinth.receiveShadow = true;
    plinth.name = 'walkable_ground';
    hall.add(plinth);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.14, 24.0), floorMat);
    floor.position.y = 0.36;
    floor.receiveShadow = true;
    floor.name = 'walkable_ground';
    hall.add(floor);

    // West Front Entry Steps leading up from the 7th Stupa Path
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 7.6), stonePlinth);
      step.position.set(-10.1 - s * 0.75, 0.25 - s * 0.16, 0);
      step.name = 'walkable_ground';
      hall.add(step);
    }

    // Back (East), North, South, and West Front-Flank Crimson Monastery Walls
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 24.4), crimsonWall);
    eastWall.position.set(9.1, 3.7, 0);
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 6.8, 0.7), crimsonWall);
    northWall.position.set(0, 3.7, -12.0);
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 6.8, 0.7), crimsonWall);
    southWall.position.set(0, 3.7, 12.0);
    hall.add(eastWall, northWall, southWall);

    // Front (West) walls & roofs placed inside frontRoofCutaway so camera fades them out when inside 文殊殿
    const frontRoofCutaway = new THREE.Group();
    hall.add(frontRoofCutaway);

    const westWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 8.6), crimsonWall);
    westWallNorth.position.set(-9.1, 3.7, -7.8);
    const westWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 8.6), crimsonWall);
    westWallSouth.position.set(-9.1, 3.7, 7.8);
    const westHeader = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 8.0), crimsonWall);
    westHeader.position.set(-9.1, 6.2, 0);
    frontRoofCutaway.add(westWallNorth, westWallSouth, westHeader);

    // Gold "文殊殿" Signboard above West Doors
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.15, 4.4), darkWood);
    plaque.position.set(-9.55, 6.2, 0);
    const plaqueBorder = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.3, 4.6), goldTrim);
    plaqueBorder.position.set(-9.50, 6.2, 0);
    frontRoofCutaway.add(plaqueBorder, plaque);

    // Animated West Double Doors (open after circling all 7 White Stupas!)
    const doorLeftPivot = new THREE.Group();
    doorLeftPivot.position.set(-9.1, 0.42, -3.5);
    const doorLeftLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 3.45), crimsonWall);
    doorLeftLeaf.position.set(0, 2.6, 1.72);
    const ringL = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), goldTrim);
    ringL.rotation.y = Math.PI / 2;
    ringL.position.set(-0.20, 2.4, 3.0);
    doorLeftPivot.add(doorLeftLeaf, ringL);

    const doorRightPivot = new THREE.Group();
    doorRightPivot.position.set(-9.1, 0.42, 3.5);
    const doorRightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 3.45), crimsonWall);
    doorRightLeaf.position.set(0, 2.6, -1.72);
    const ringR = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), goldTrim);
    ringR.rotation.y = Math.PI / 2;
    ringR.position.set(-0.20, 2.4, -3.0);
    doorRightPivot.add(doorRightLeaf, ringR);
    frontRoofCutaway.add(doorLeftPivot, doorRightPivot);

    // Golden Tibetan-Style Double Tiered Roof & Dharma Wheel Finial (Reference Photo Style)
    const lowerRoof = new THREE.Mesh(new THREE.BoxGeometry(21.5, 0.55, 27.2), goldTrim);
    lowerRoof.position.set(0, 7.25, 0);
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(13.5, 3.4, 4), goldTrim);
    upperRoof.position.set(0, 9.2, 0);
    upperRoof.rotation.y = Math.PI / 4;
    const roofJewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), goldBody);
    roofJewel.position.set(0, 11.2, 0);
    frontRoofCutaway.add(lowerRoof, upperRoof, roofJewel);

    // Red-lacquered interior pillars
    [[-6.5, -9.2], [-6.5, 9.2], [6.5, -9.2], [6.5, 9.2], [0, -9.2], [0, 9.2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 6.8, 12), crimsonWall);
      col.position.set(px, 3.7, pz);
      hall.add(col);
    });

    // --- CENTERPIECE: FLAT CAMERA-FACING MANJUSHRI BODHISATTVA (文殊菩萨) USING EXACT ATTACHED PICTURE at local (5.4, 0.42, 0) ---
    const statueGroup = new THREE.Group();
    statueGroup.position.set(5.4, 0.42, 0);
    statueGroup.rotation.y = -Math.PI / 2; // faces West toward incoming player

    const jadeMidMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.45, metalness: 0.12 });

    // Clean, circular emerald-gold pedestal base (y = 0 to 0.56) so it looks uniform from every angle
    const sumeruCircle = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.78, 0.36, 32), stonePlinth);
    sumeruCircle.position.y = 0.18;
    const jadeRim = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.56, 0.18, 32), jadeMidMat);
    jadeRim.position.y = 0.45;
    const goldTopRing = new THREE.Mesh(new THREE.TorusGeometry(1.44, 0.05, 8, 32), goldTrim);
    goldTopRing.rotation.x = Math.PI / 2;
    goldTopRing.position.y = 0.55;
    statueGroup.add(sumeruCircle, jadeRim, goldTopRing);

    // Exact flat picture of 文殊菩萨 in a Y-axis billboard (zero 3D warping, identical from every angle)
    const wenshuBillboard = this.createExactBillboardPortrait({
      imgPath: 'assets/wenshu_bodhisattva_ref.jpg',
      baseWidth: 4.30,
      baseHeight: 4.70,
      centerY: 2.98,
      frameColor: 0xfacc15,
      plaqueTitle: '文殊菩萨',
      plaqueY: 5.98,
      plaqueOptions: { bgColor: '#fffbeb', borderColor: '#d97706' }
    });
    statueGroup.add(wenshuBillboard);

    statueGroup.traverse((c) => {
      c.userData.manjushriStatue = true;
    });
    hall.add(statueGroup);

    // --- WENSHU OFFERING ALTAR TABLE at local (2.2, 0.42, 0) -> World (126.2, 16.92, 4.0) ---
    // Facing East (+X): Middle = 7 water cups (z=0), Left = Flower (z < 0, leftSign = -1), Right = Incense (z > 0)
    const offerTable = this.createHallAltarTableWithOfferings(-1);
    offerTable.position.set(2.2, 0.42, 0);
    const { waterGroup, flowerGroup, scentGroup } = offerTable.userData;
    hall.add(offerTable);

    // --- 20 ORNATE MEDITATION SEATS (蒲团) IN 4x5 FORMATION FACING MANJUSHRI (EAST) ---
    const seatRowsX = [-1.2, -3.2, -5.2, -7.2];
    const seatColsZ = [-6.8, -3.4, 0.0, 3.4, 6.8];
    const brocadeGoldMat = new THREE.MeshStandardMaterial({ color: 0xe09f3e, roughness: 0.55 });
    const seatPositions = [];
    let seatIdx = 0;

    seatRowsX.forEach((lx) => {
      seatColsZ.forEach((lz) => {
        const seatGroup = new THREE.Group();
        seatGroup.position.set(lx, 0.42, lz);

        const baseCushion = new THREE.Mesh(
          new THREE.CylinderGeometry(0.66, 0.74, 0.22, 20),
          brocadeGoldMat
        );
        baseCushion.position.y = 0.11;
        baseCushion.receiveShadow = true;

        const topPad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.54, 0.62, 0.07, 20),
          cushionRed
        );
        topPad.position.y = 0.24;

        const lotusRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.62, 0.025, 8, 20),
          goldTrim
        );
        lotusRing.rotation.x = Math.PI / 2;
        lotusRing.position.y = 0.21;

        seatGroup.add(baseCushion, topPad, lotusRing);
        const curIdx = seatIdx;
        seatGroup.traverse((child) => {
          child.userData.wenshuSeatIdx = curIdx;
        });
        hall.add(seatGroup);
        seatPositions.push({ idx: curIdx, lx, lz, mesh: seatGroup });
        seatIdx++;
      });
    });

    hall.userData = {
      doorLeftPivot,
      doorRightPivot,
      frontRoofCutaway,
      seatPositions,
      offeringMeshes: {
        water: waterGroup,
        flower: flowerGroup,
        scent: scentGroup
      }
    };
    return hall;
  },

  // -------------------- FLOATING WHITE CLOUDS AROUND MOUNT WUTAI SUMMIT --------------------
  createSummitFloatingClouds() {
    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88
    });

    const cloudConfigs = [
      { x: 108, y: 19.8, z: -12, scale: 1.35, speed: 0.35 },
      { x: 120, y: 21.6, z: 19, scale: 1.55, speed: 0.28 },
      { x: 134, y: 23.0, z: -9, scale: 1.45, speed: 0.42 },
      { x: 128, y: 18.8, z: 24, scale: 1.25, speed: 0.31 },
      { x: 144, y: 24.5, z: 8, scale: 1.75, speed: 0.25 },
      { x: -84, y: 19.6, z: -14, scale: 1.35, speed: 0.32 },
      { x: -98, y: 21.8, z: 22, scale: 1.50, speed: 0.27 },
      { x: -116, y: 22.8, z: -12, scale: 1.45, speed: 0.38 },
      { x: -112, y: 19.0, z: 24, scale: 1.25, speed: 0.29 },
      { x: -128, y: 24.0, z: 6, scale: 1.70, speed: 0.24 }
    ];

    cloudConfigs.forEach((cfg, idx) => {
      const puffGroup = new THREE.Group();
      const puffs = [
        [0, 0, 0, 2.2],
        [-1.8, -0.25, 0.4, 1.6],
        [1.9, -0.2, -0.3, 1.7],
        [0.4, 0.45, 0.5, 1.4]
      ];
      puffs.forEach(([px, py, pz, r]) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r * cfg.scale, 12, 10), cloudMat);
        s.scale.set(1.3, 0.62, 1.05);
        s.position.set(px * cfg.scale, py * cfg.scale, pz * cfg.scale);
        puffGroup.add(s);
      });
      puffGroup.position.set(cfg.x, cfg.y, cfg.z);
      puffGroup.userData = { baseX: cfg.x, baseZ: cfg.z, baseY: cfg.y, speed: cfg.speed, phase: idx * 1.4 };
      cloudsGroup.add(puffGroup);
    });

    return cloudsGroup;
  },

  // -------------------- WEST MOUNTAIN STAIRWAY & OPEN SUMMIT PLAZA (长寿山道与山顶广场) --------------------
  createWestGardenWalkwayModel() {
    const pathGroup = new THREE.Group();
    const slabMat = new THREE.MeshStandardMaterial({ color: 0xe7dfd1, roughness: 0.78 });
    const goldBorderMat = new THREE.MeshStandardMaterial({ color: 0xd4a348, roughness: 0.5 });

    // Courtyard West Connector up to start of the ascending mountain stairway (x = -24)
    const entryApproach = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.14, 5.2), slabMat);
    entryApproach.position.set(-20.8, 0.04, 2.8);
    entryApproach.receiveShadow = true;
    entryApproach.name = 'walkable_ground';
    pathGroup.add(entryApproach);

    // Ascending Stone Stairway rising West from x = -24 (y=0.1) to Open Summit Plaza x = -78 (y=16.5)
    for (let sx = -24.0; sx >= -78.0; sx -= 1.6) {
      const sy = window.GAME_DATA.getTerrainHeight(sx, 2.8);
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.18, 5.4), slabMat);
      step.position.set(sx, sy + 0.04, 2.8);
      step.rotation.z = -0.28;
      step.receiveShadow = true;
      step.name = 'walkable_ground';
      pathGroup.add(step);
    }

    // Ornate stone-and-gold lantern pillars flanking the ascending Longevity Mountain stairway
    for (let sx = -26; sx >= -76; sx -= 8.0) {
      const sy = window.GAME_DATA.getTerrainHeight(sx, 2.8);
      [-2.85, 2.85].forEach((sz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.95, 0.42), slabMat);
        post.position.set(sx, sy + 0.47, 2.8 + sz);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), goldBorderMat);
        cap.position.set(sx, sy + 1.05, 2.8 + sz);
        pathGroup.add(post, cap);
      });
    }

    // Side Spur Paths connecting the mountain stairway (z=2.8) to each Flower Garden (z=7.6) & Lotus Pond (z=-3.8)
    const gardenSpurs = window.GAME_DATA.CHANGSHOU_FLOWER_GARDENS || [];
    const pondSpurs = window.GAME_DATA.CHANGSHOU_LOTUS_PONDS || [];
    [...gardenSpurs, ...pondSpurs].forEach((sp) => {
      const sy = window.GAME_DATA.getTerrainHeight(sp.x, sp.z);
      const spurLen = Math.abs(sp.z - 2.8);
      const spur = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, spurLen), slabMat);
      spur.position.set(sp.x, sy + 0.03, (sp.z + 2.8) / 2);
      spur.receiveShadow = true;
      spur.name = 'walkable_ground';
      pathGroup.add(spur);
    });

    // Wide Open Mountain-Top Summit Plaza (y = 16.5) surrounding 长寿殿 (x in [-120, -78], z in [-20, 28])
    const summitPlaza = new THREE.Mesh(new THREE.BoxGeometry(42.0, 0.10, 48.0), slabMat);
    summitPlaza.position.set(-99.0, 16.51, 4.0);
    summitPlaza.receiveShadow = true;
    summitPlaza.name = 'walkable_ground';
    pathGroup.add(summitPlaza);

    // Low ornamental white-jade & gold balustrade posts bordering the outer scenic overlook edges (open sky view!)
    const plazaY = 16.55;
    for (let px = -119.6; px <= -80.0; px += 6.6) {
      [-19.6, 27.6].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 0.45), slabMat);
        post.position.set(px, plazaY + 0.5, pz);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), goldBorderMat);
        cap.position.set(px, plazaY + 1.1, pz);
        pathGroup.add(post, cap);
      });
    }
    for (let pz = -14.0; pz <= 22.0; pz += 6.0) {
      const postW = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 0.45), slabMat);
      postW.position.set(-119.6, plazaY + 0.5, pz);
      const capW = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), goldBorderMat);
      capW.position.set(-119.6, plazaY + 1.1, pz);
      pathGroup.add(postW, capW);
    }

    return pathGroup;
  },

  createWestFlowerGardenBedModel(gardenData, idx = 0) {
    const group = new THREE.Group();
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xd9cdb8, roughness: 0.75 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.95 });
    const greenMat = new THREE.MeshLambertMaterial({ color: 0x2d8a4e });
    const palette = [0xf472b6, 0xfbbf24, 0xfb7185, 0xc084fc, 0xffffff, 0xf97316];

    // Raised octagonal-style stone border & rich garden soil bed
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.36, 3.4), borderMat);
    outerFrame.position.y = 0.18;
    outerFrame.receiveShadow = true;
    const soil = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.39, 2.85), soilMat);
    soil.position.y = 0.18;
    group.add(outerFrame, soil);

    // Unplanted state: tiny green seedlings & golden watering pot waiting to be planted
    const unplantedGroup = new THREE.Group();
    for (let i = -2; i <= 2; i++) {
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 6), greenMat);
      sprout.position.set(i * 1.05, 0.52, (i % 2) * 0.45);
      unplantedGroup.add(sprout);
    }
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: 0xe6a135, metalness: 0.5, roughness: 0.35 })
    );
    potBody.position.set(-2.35, 0.58, 0.95);
    unplantedGroup.add(potBody);
    group.add(unplantedGroup);

    // Planted state: Lush blooming 3D Peonies, Marigolds, Orchids & Fragrant Blossoms!
    const plantedGroup = new THREE.Group();
    for (let row = -1; row <= 1; row++) {
      for (let col = -3; col <= 3; col++) {
        const fx = col * 0.78 + (row % 2) * 0.18;
        const fz = row * 0.78;
        const h = 0.48 + ((Math.abs(col + row + idx) % 3) * 0.18);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 6), greenMat);
        stem.position.set(fx, 0.38 + h / 2, fz);
        plantedGroup.add(stem);

        const leafL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), greenMat);
        leafL.scale.set(1.4, 0.35, 0.8);
        leafL.position.set(fx - 0.14, 0.48, fz + 0.08);
        plantedGroup.add(leafL);

        const colorHex = palette[(Math.abs(col * 3 + row * 2 + idx)) % palette.length];
        const petalMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.38 });
        const bloom = new THREE.Group();
        bloom.position.set(fx, 0.38 + h + 0.08, fz);

        const center = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        bloom.add(center);
        for (let p = 0; p < 5; p++) {
          const ang = (p / 5) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), petalMat);
          petal.scale.set(1.1, 0.55, 1.1);
          petal.position.set(Math.cos(ang) * 0.13, 0, Math.sin(ang) * 0.13);
          bloom.add(petal);
        }
        plantedGroup.add(bloom);
      }
    }
    plantedGroup.visible = false;
    group.add(plantedGroup);

    group.traverse((child) => {
      child.userData.flowerGardenId = gardenData.id;
    });
    group.userData = { unplantedGroup, plantedGroup, gardenData };
    return group;
  },

  // -------------------- WEST FLOWER POND MODEL (优钵罗花 · 波头摩 · 分陀利花 · 拘物头花) --------------------
  createWestLotusPondModel(pondData) {
    const pond = new THREE.Group();
    const jadeStoneMat = new THREE.MeshStandardMaterial({ color: 0xe5e0d5, roughness: 0.65 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x227c9d,
      emissive: 0x0b3b49,
      roughness: 0.14,
      metalness: 0.48,
      transparent: true,
      opacity: 0.90
    });
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2e8b3d, roughness: 0.60 });
    const padDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e6f2c, roughness: 0.64 });
    const flowerType = pondData.flowerType || 'pundarika';

    // Sculpted circular white-jade rim + tranquil water basin
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.34, 12, 32), jadeStoneMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.22;
    rim.receiveShadow = true;

    const basinWall = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.7, 0.36, 32), jadeStoneMat);
    basinWall.position.y = 0.18;

    const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(3.25, 32), waterMat);
    waterDisc.rotation.x = -Math.PI / 2;
    waterDisc.position.y = 0.32;
    pond.add(basinWall, rim, waterDisc);

    // Unplanted state: two resting lily pads awaiting planting
    const unplantedGroup = new THREE.Group();
    [[-1.1, 0.6], [1.2, -0.8]].forEach(([lx, lz]) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 14, 1, false, 0, Math.PI * 1.85), padMat);
      pad.position.set(lx, 0.35, lz);
      unplantedGroup.add(pad);
    });
    pond.add(unplantedGroup);

    // Build a 3D bloom faithfully styled after the corresponding attached reference photo
    const buildSacredPondFlower = (type, scale = 1.0) => {
      const fGroup = new THREE.Group();
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x3b7a2a, roughness: 0.75 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 0.42, 8), stemMat);
      stem.position.y = -0.02;
      fGroup.add(stem);

      const addSeedPodAndStamens = ({ podTopColor, podSideColor, dotColor, stamenColor, podRadius = 0.135, podHeight = 0.15, dotCount = 10 }) => {
        const pod = new THREE.Mesh(
          new THREE.CylinderGeometry(podRadius, podRadius * 0.48, podHeight, 16),
          new THREE.MeshStandardMaterial({ color: podSideColor, roughness: 0.42 })
        );
        pod.position.y = 0.17 + podHeight * 0.5;
        const podTop = new THREE.Mesh(
          new THREE.CircleGeometry(podRadius * 0.96, 16),
          new THREE.MeshStandardMaterial({ color: podTopColor, roughness: 0.38 })
        );
        podTop.rotation.x = -Math.PI / 2;
        podTop.position.y = 0.17 + podHeight + 0.002;
        fGroup.add(pod, podTop);

        const dotMat = new THREE.MeshBasicMaterial({ color: dotColor });
        for (let d = 0; d < dotCount; d++) {
          const rDot = d === 0 ? 0 : (d <= 4 ? podRadius * 0.38 : podRadius * 0.70);
          const angDot = d === 0 ? 0 : (d * 2.39996);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), dotMat);
          dot.position.set(Math.cos(angDot) * rDot, 0.17 + podHeight + 0.006, Math.sin(angDot) * rDot);
          fGroup.add(dot);
        }

        const stMat = new THREE.MeshBasicMaterial({ color: stamenColor });
        for (let stIdx = 0; stIdx < 24; stIdx++) {
          const ang = (stIdx / 24) * Math.PI * 2 + (stIdx % 2) * 0.12;
          const rS = 0.14 + (stIdx % 3) * 0.022;
          const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.14, 5), stMat);
          fil.position.set(Math.cos(ang) * rS, 0.21, Math.sin(ang) * rS);
          fil.rotation.y = -ang + Math.PI / 2;
          fil.rotation.x = 0.45;
          fGroup.add(fil);
        }
      };

      if (type === 'utpala') {
        // Photo #1: 优钵罗花 — Blue-violet narrow star petals + golden center + violet-tipped erect stamens
        const innerMat = new THREE.MeshStandardMaterial({ color: 0x9b82ff, emissive: 0x2e1065, emissiveIntensity: 0.22, roughness: 0.34 });
        const midMat = new THREE.MeshStandardMaterial({ color: 0x7c5cff, emissive: 0x2e1065, emissiveIntensity: 0.18, roughness: 0.36 });
        const outerMat = new THREE.MeshStandardMaterial({ color: 0x6244db, emissive: 0x1e1b4b, emissiveIntensity: 0.16, roughness: 0.38 });

        const goldBowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.17, 0.09, 0.08, 16),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        goldBowl.position.y = 0.17;
        fGroup.add(goldBowl);

        // Central tuft of deep violet erect stamens + outer ring of yellow filaments with purple anthers
        const violetTipMat = new THREE.MeshBasicMaterial({ color: 0x7e22ce });
        const yellowFilMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const innerSpike = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.011, 0.15, 5), violetTipMat);
          innerSpike.position.set(Math.cos(ang) * 0.045, 0.24, Math.sin(ang) * 0.045);
          innerSpike.rotation.y = -ang + Math.PI / 2;
          innerSpike.rotation.x = -0.22;
          fGroup.add(innerSpike);
        }
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2 + (i % 2) * 0.1;
          const rS = 0.105 + (i % 2) * 0.032;
          const holder = new THREE.Group();
          holder.position.set(Math.cos(ang) * rS, 0.20, Math.sin(ang) * rS);
          holder.rotation.y = -ang + Math.PI / 2;
          holder.rotation.x = 0.22;
          const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.008, 0.16, 5), yellowFilMat);
          fil.position.y = 0.06;
          const anther = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), violetTipMat);
          anther.position.y = 0.145;
          holder.add(fil, anther);
          fGroup.add(holder);
        }

        const rings = [
          { count: 8, dist: 0.21, y: 0.23, tilt: 0.56, len: 0.38, w: 0.068, mat: innerMat },
          { count: 10, dist: 0.30, y: 0.19, tilt: 0.92, len: 0.44, w: 0.072, mat: midMat },
          { count: 12, dist: 0.37, y: 0.14, tilt: 1.26, len: 0.48, w: 0.075, mat: outerMat }
        ];
        rings.forEach((rg, rIdx) => {
          for (let p = 0; p < rg.count; p++) {
            const ang = (p / rg.count) * Math.PI * 2 + rIdx * 0.28;
            const petal = new THREE.Mesh(new THREE.ConeGeometry(rg.w, rg.len, 5), rg.mat);
            petal.scale.set(1.0, 1.0, 0.34);
            petal.position.set(Math.cos(ang) * rg.dist, rg.y, Math.sin(ang) * rg.dist);
            petal.rotation.y = -ang + Math.PI / 2;
            petal.rotation.x = rg.tilt;
            fGroup.add(petal);
          }
        });
      } else if (type === 'padma') {
        // Photo #2: 波头摩 — Soft creamy yellow-green cupped rounded petals + raised golden red-dot seed pod + orange stamens
        const innerMat = new THREE.MeshStandardMaterial({ color: 0xeef7a8, roughness: 0.34 });
        const midMat = new THREE.MeshStandardMaterial({ color: 0xddf07c, roughness: 0.36 });
        const sepalMat = new THREE.MeshStandardMaterial({ color: 0x8cc63f, roughness: 0.42 });

        addSeedPodAndStamens({
          podTopColor: 0xfde047,
          podSideColor: 0xeab308,
          dotColor: 0xb91c1c,
          stamenColor: 0xf59e0b,
          podRadius: 0.145,
          podHeight: 0.18,
          dotCount: 11
        });

        const cupRings = [
          { count: 6, dist: 0.24, y: 0.31, tilt: 0.24, sx: 0.135, sy: 0.22, mat: innerMat },
          { count: 7, dist: 0.32, y: 0.26, tilt: 0.44, sx: 0.155, sy: 0.25, mat: midMat },
          { count: 6, dist: 0.35, y: 0.18, tilt: 0.72, sx: 0.14, sy: 0.21, mat: sepalMat }
        ];
        cupRings.forEach((rg, rIdx) => {
          for (let p = 0; p < rg.count; p++) {
            const ang = (p / rg.count) * Math.PI * 2 + rIdx * 0.42;
            const petal = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), rg.mat);
            petal.scale.set(rg.sx, rg.sy, 0.042);
            petal.position.set(Math.cos(ang) * rg.dist, rg.y, Math.sin(ang) * rg.dist);
            petal.rotation.y = -ang + Math.PI / 2;
            petal.rotation.x = rg.tilt;
            fGroup.add(petal);
          }
        });
      } else if (type === 'pundarika') {
        // Photo #3: 分陀利花 — Pure snow-white wide-open lotus + chartreuse-green seed pod + golden stamens
        const whiteInnerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfefce8, emissiveIntensity: 0.14, roughness: 0.26 });
        const whiteOuterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xf1f5f9, emissiveIntensity: 0.10, roughness: 0.30 });

        addSeedPodAndStamens({
          podTopColor: 0xa3d943,
          podSideColor: 0x84cc16,
          dotColor: 0x365314,
          stamenColor: 0xfbbf24,
          podRadius: 0.135,
          podHeight: 0.155,
          dotCount: 10
        });

        const rings = [
          { count: 6, dist: 0.23, y: 0.26, tilt: 0.46, w: 0.135, len: 0.38, mat: whiteInnerMat },
          { count: 8, dist: 0.33, y: 0.21, tilt: 0.86, w: 0.15, len: 0.44, mat: whiteInnerMat },
          { count: 10, dist: 0.40, y: 0.15, tilt: 1.20, w: 0.155, len: 0.46, mat: whiteOuterMat }
        ];
        rings.forEach((rg, rIdx) => {
          for (let p = 0; p < rg.count; p++) {
            const ang = (p / rg.count) * Math.PI * 2 + rIdx * 0.32;
            const petal = new THREE.Mesh(new THREE.ConeGeometry(rg.w, rg.len, 6), rg.mat);
            petal.scale.set(1.0, 1.0, 0.36);
            petal.position.set(Math.cos(ang) * rg.dist, rg.y, Math.sin(ang) * rg.dist);
            petal.rotation.y = -ang + Math.PI / 2;
            petal.rotation.x = rg.tilt;
            fGroup.add(petal);
          }
        });
      } else {
        // Photo #4: 拘物头花 — Rich rose-pink layered pointed petals with soft golden-yellow center & seed pod
        const pinkInnerMat = new THREE.MeshStandardMaterial({ color: 0xf9a8d4, emissive: 0x831843, emissiveIntensity: 0.16, roughness: 0.30 });
        const pinkMidMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x831843, emissiveIntensity: 0.18, roughness: 0.32 });
        const pinkOuterMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, emissive: 0x500724, emissiveIntensity: 0.16, roughness: 0.35 });

        addSeedPodAndStamens({
          podTopColor: 0xfde047,
          podSideColor: 0xfacc15,
          dotColor: 0xb45309,
          stamenColor: 0xfef08a,
          podRadius: 0.13,
          podHeight: 0.15,
          dotCount: 10
        });

        const rings = [
          { count: 6, dist: 0.22, y: 0.28, tilt: 0.38, w: 0.125, len: 0.38, mat: pinkInnerMat },
          { count: 8, dist: 0.31, y: 0.23, tilt: 0.72, w: 0.145, len: 0.43, mat: pinkMidMat },
          { count: 10, dist: 0.38, y: 0.17, tilt: 1.08, w: 0.15, len: 0.45, mat: pinkOuterMat }
        ];
        rings.forEach((rg, rIdx) => {
          for (let p = 0; p < rg.count; p++) {
            const ang = (p / rg.count) * Math.PI * 2 + rIdx * 0.30;
            const petal = new THREE.Mesh(new THREE.ConeGeometry(rg.w, rg.len, 6), rg.mat);
            petal.scale.set(1.0, 1.0, 0.36);
            petal.position.set(Math.cos(ang) * rg.dist, rg.y, Math.sin(ang) * rg.dist);
            petal.rotation.y = -ang + Math.PI / 2;
            petal.rotation.x = rg.tilt;
            fGroup.add(petal);
          }
        });
      }

      fGroup.scale.setScalar(scale);
      return fGroup;
    };

    // Planted state: 9 distinctive 3D flowers + broad notched floating lily pads!
    const plantedGroup = new THREE.Group();
    const padCoords = [
      [0, 0], [-1.5, 0.7], [1.4, 0.8], [-1.3, -1.2], [1.5, -1.0],
      [0.2, 1.85], [-0.4, -1.9], [-2.2, -0.15], [2.2, 0.2]
    ];
    padCoords.forEach(([lx, lz], i) => {
      const padR = 0.50 + (i % 3) * 0.13;
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(padR, padR, 0.04, 18, 1, false, i * 0.8, Math.PI * 1.84),
        i % 2 === 0 ? padMat : padDarkMat
      );
      pad.position.set(lx, 0.35, lz);
      plantedGroup.add(pad);

      const bloomScale = i === 0 ? 1.32 : (i < 5 ? 1.08 : 0.96);
      const flower = buildSacredPondFlower(flowerType, bloomScale);
      flower.position.set(lx + (i % 2 === 0 ? 0.08 : -0.08), i === 0 ? 0.49 : 0.45, lz);
      flower.rotation.y = i * 0.72;
      plantedGroup.add(flower);
    });
    plantedGroup.visible = false;
    pond.add(plantedGroup);

    pond.traverse((child) => {
      child.userData.lotusPondId = pondData.id;
    });
    pond.userData = { unplantedGroup, plantedGroup, pondData };
    return pond;
  },

  // -------------------- WEST SANCTUARY: 长寿殿 (LONGEVITY HALL) + 3D 长寿佛 (AMITAYUS) + 20 SEATS + OFFERINGS --------------------
  createChangshouHallAndStatueModel() {
    const hall = new THREE.Group();
    const stonePlinth = new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.82 });
    const crimsonWall = new THREE.MeshStandardMaterial({ color: 0x9b2226, roughness: 0.72 });
    const jadeWallMat = new THREE.MeshStandardMaterial({ color: 0x1e6b52, roughness: 0.68 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x4a2511, roughness: 0.75 });
    const goldTrim = new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.75, roughness: 0.24 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x9e7346, roughness: 0.72 });
    const cushionRed = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.85 });

    // Hall Plinth & Polished Hardwood Floor (19 x 25, matching 文殊殿 spaciousness for 20 seats)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.7, 25.0), stonePlinth);
    plinth.position.y = 0.0;
    plinth.receiveShadow = true;
    plinth.name = 'walkable_ground';
    hall.add(plinth);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.14, 24.0), floorMat);
    floor.position.y = 0.36;
    floor.receiveShadow = true;
    floor.name = 'walkable_ground';
    hall.add(floor);

    // East Front Entry Steps leading in from the Flower Garden & 3 Lotus Ponds avenue (+X side)
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 7.6), stonePlinth);
      step.position.set(10.1 + s * 0.75, 0.25 - s * 0.16, 0);
      step.name = 'walkable_ground';
      hall.add(step);
    }

    // Back (West), North, and South Walls
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 24.4), crimsonWall);
    westWall.position.set(-9.1, 3.7, 0);
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 6.8, 0.7), crimsonWall);
    northWall.position.set(0, 3.7, -12.0);
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 6.8, 0.7), crimsonWall);
    southWall.position.set(0, 3.7, 12.0);
    hall.add(westWall, northWall, southWall);

    // Front (East) Facade & Roofs inside frontRoofCutaway so view inside 长寿殿 is completely clear!
    const frontRoofCutaway = new THREE.Group();
    hall.add(frontRoofCutaway);

    const eastWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 8.6), crimsonWall);
    eastWallNorth.position.set(9.1, 3.7, -7.8);
    const eastWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.8, 8.6), crimsonWall);
    eastWallSouth.position.set(9.1, 3.7, 7.8);
    const eastHeader = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 8.0), crimsonWall);
    eastHeader.position.set(9.1, 6.2, 0);
    frontRoofCutaway.add(eastWallNorth, eastWallSouth, eastHeader);

    // Gold "长寿殿" Signboard above East Doors
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.15, 4.4), darkWood);
    plaque.position.set(9.55, 6.2, 0);
    const plaqueBorder = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.3, 4.6), goldTrim);
    plaqueBorder.position.set(9.50, 6.2, 0);
    frontRoofCutaway.add(plaqueBorder, plaque);

    // Open Welcoming East Double Doors (angled wide open)
    const doorLeftPivot = new THREE.Group();
    doorLeftPivot.position.set(9.1, 0.42, -3.5);
    doorLeftPivot.rotation.y = -1.35;
    const doorLeftLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 3.45), crimsonWall);
    doorLeftLeaf.position.set(0, 2.6, 1.72);
    doorLeftPivot.add(doorLeftLeaf);

    const doorRightPivot = new THREE.Group();
    doorRightPivot.position.set(9.1, 0.42, 3.5);
    doorRightPivot.rotation.y = 1.35;
    const doorRightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.2, 3.45), crimsonWall);
    doorRightLeaf.position.set(0, 2.6, -1.72);
    doorRightPivot.add(doorRightLeaf);
    frontRoofCutaway.add(doorLeftPivot, doorRightPivot);

    // Emerald-Jade & Gold Double-Tiered Longevity Roof + Golden Longevity Vase Finial
    const lowerRoof = new THREE.Mesh(new THREE.BoxGeometry(21.5, 0.55, 27.2), jadeWallMat);
    lowerRoof.position.set(0, 7.25, 0);
    const lowerRoofTrim = new THREE.Mesh(new THREE.BoxGeometry(21.7, 0.22, 27.4), goldTrim);
    lowerRoofTrim.position.set(0, 7.55, 0);
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(13.5, 3.4, 4), goldTrim);
    upperRoof.position.set(0, 9.2, 0);
    upperRoof.rotation.y = Math.PI / 4;
    const roofVase = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 14), goldTrim);
    roofVase.scale.set(0.85, 1.35, 0.85);
    roofVase.position.set(0, 11.4, 0);
    frontRoofCutaway.add(lowerRoof, lowerRoofTrim, upperRoof, roofVase);

    // Interior crimson & emerald-accent pillars
    [[-6.5, -9.2], [-6.5, 9.2], [6.5, -9.2], [6.5, 9.2], [0, -9.2], [0, 9.2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 6.8, 12), crimsonWall);
      col.position.set(px, 3.7, pz);
      hall.add(col);
    });

    // Pastel Pink & Turquoise Thangka Auspicious Clouds around 长寿殿 Roof & Back Wall (matching attached picture!)
    const pinkCloudMat = new THREE.MeshLambertMaterial({ color: 0xf9a8d4, transparent: true, opacity: 0.90 });
    const tealCloudMat = new THREE.MeshLambertMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.88 });
    [
      { x: -7.5, y: 6.2, z: -8.5, mat: tealCloudMat },
      { x: -7.5, y: 6.0, z: 8.5, mat: pinkCloudMat },
      { x: -10.2, y: 8.8, z: -11.0, mat: pinkCloudMat },
      { x: -10.2, y: 9.2, z: 10.8, mat: tealCloudMat }
    ].forEach((cl) => {
      const cg = new THREE.Group();
      cg.position.set(cl.x, cl.y, cl.z);
      [[0, 0, 0, 0.72], [-0.6, -0.1, 0.2, 0.5], [0.6, -0.1, -0.2, 0.52]].forEach(([cx, cy, cz, cr]) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 8), cl.mat);
        s.scale.set(1.2, 0.65, 1.35);
        s.position.set(cx, cy, cz);
        cg.add(s);
      });
      hall.add(cg);
    });

    // --- CENTERPIECE: 3D HIGH-RELIEF 长寿佛 (AMITAYUS BUDDHA) USING EXACT ATTACHED PICTURE at local (-5.4, 0.42, 0) ---
    const statueGroup = new THREE.Group();
    statueGroup.position.set(-5.4, 0.42, 0);
    statueGroup.rotation.y = Math.PI / 2; // faces East (+X) toward incoming player

    // Clean circular golden-teal lotus pedestal base (y = 0 to 0.56) so it looks uniform from every angle
    const sumeruStone = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 });
    const tealAccent = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 });
    const pedestalCircle = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.78, 0.36, 32), sumeruStone);
    pedestalCircle.position.y = 0.18;
    const pedestalTeal = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.56, 0.18, 32), tealAccent);
    pedestalTeal.position.y = 0.45;
    const goldTopRim = new THREE.Mesh(new THREE.TorusGeometry(1.44, 0.05, 8, 32), goldTrim);
    goldTopRim.rotation.x = Math.PI / 2;
    goldTopRim.position.y = 0.55;
    statueGroup.add(pedestalCircle, pedestalTeal, goldTopRim);

    // Exact flat picture of 长寿佛 in a Y-axis billboard (zero 3D warping, identical from every angle)
    const changshouBillboard = this.createExactBillboardPortrait({
      imgPath: 'assets/changshou_buddha_ref.jpg',
      baseWidth: 3.70,
      baseHeight: 5.00,
      centerY: 3.12,
      frameColor: 0xfacc15,
      plaqueTitle: '长寿佛',
      plaqueY: 6.28,
      plaqueOptions: { bgColor: '#fff5f5', borderColor: '#d97706' }
    });
    statueGroup.add(changshouBillboard);

    statueGroup.traverse((c) => {
      c.userData.changshouStatue = true;
    });
    hall.add(statueGroup);

    // --- 长寿殿 OFFERING ALTAR TABLE at local (-2.2, 0.42, 0) -> World (-98.2, 0.84, 4.0) ---
    // Facing West (-X): Middle = 7 water cups (z=0), Left = Flower (z > 0, leftSign = 1), Right = Incense (z < 0)
    const offerTable = this.createHallAltarTableWithOfferings(1);
    offerTable.position.set(-2.2, 0.42, 0);
    const { waterGroup, flowerGroup, scentGroup } = offerTable.userData;
    hall.add(offerTable);

    // --- 20 ORNATE MEDITATION MATS (20座蒲团) IN 4x5 FORMATION FACING 长寿佛 (WEST) ---
    const seatRowsX = [1.2, 3.2, 5.2, 7.2];
    const seatColsZ = [-6.8, -3.4, 0.0, 3.4, 6.8];
    const brocadeGoldMat = new THREE.MeshStandardMaterial({ color: 0xe09f3e, roughness: 0.55 });
    const seatPositions = [];
    let seatIdx = 0;

    seatRowsX.forEach((lx) => {
      seatColsZ.forEach((lz) => {
        const seatGroup = new THREE.Group();
        seatGroup.position.set(lx, 0.42, lz);

        const baseCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.74, 0.22, 20), brocadeGoldMat);
        baseCushion.position.y = 0.11;
        baseCushion.receiveShadow = true;

        const topPad = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.62, 0.07, 20), cushionRed);
        topPad.position.y = 0.24;

        const lotusRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 20), goldTrim);
        lotusRing.rotation.x = Math.PI / 2;
        lotusRing.position.y = 0.21;

        seatGroup.add(baseCushion, topPad, lotusRing);
        const curIdx = seatIdx;
        seatGroup.traverse((child) => {
          child.userData.changshouSeatIdx = curIdx;
        });
        hall.add(seatGroup);
        seatPositions.push({ idx: curIdx, lx, lz, mesh: seatGroup });
        seatIdx++;
      });
    });

    hall.userData = {
      doorLeftPivot,
      doorRightPivot,
      frontRoofCutaway,
      seatPositions,
      offeringMeshes: {
        water: waterGroup,
        flower: flowerGroup,
        scent: scentGroup
      }
    };
    return hall;
  }
};
