// Game Data: Characters, Mountain-to-Valley Good Deed Quests,
// 7 Buddhas, Offerings, Temple Architect Presets, and Personal Space Items

window.GAME_DATA = {
  // Winding River flowing from Mountain Summit (z = 110) down into the Temple Front River/Lake (z = 13.5)
  getRiverCenterX(z) {
    if (z <= 13.5) return 0;
    return Math.sin((z - 13.5) * (Math.PI / 22.5)) * 6.5;
  },

  getRiverHalfWidth(z) {
    if (z >= 10.6 && z <= 16.4) return 46.0; // Wide tranquil river crossing under the Red Arched Temple Bridge!
    if (z < 10.6) return 0;
    return 2.35 + Math.sin(z * 0.14) * 0.35;
  },

  // Curved Vermilion Arched Wooden Bridge at x in [-2.8, 2.8], z in [8.3, 18.7]
  getBridgeHeightAt(x, z) {
    if (Math.abs(x) <= 2.85 && z >= 8.2 && z <= 18.8) {
      const t = (z - 13.5) / 5.3;
      return 0.15 + 1.48 * Math.max(0, 1 - t * t);
    }
    return null;
  },

  // East Wisdom Bridge across the separating East River toward 文殊殿 (x in [25.5, 34.5], z in [1.2, 6.8])
  getWisdomBridgeHeightAt(x, z) {
    if (x >= 25.4 && x <= 34.6 && Math.abs(z - 4.0) <= 2.8) {
      const t = (x - 30.0) / 4.6;
      return 0.22 + 1.38 * Math.max(0, 1 - t * t);
    }
    return null;
  },

  // Smooth 3D Terrain Height Function for the Expanded Lush Misty Mountain Valley + 七佛山 (West) + 五台山文殊殿 (East)
  getTerrainHeight(x, z) {
    // 0. Grand Fo Guang Shan–style 大雄宝殿 Plaza
    if (x >= -25.2 && x <= 26.8 && z >= -46.0 && z <= 2.2) {
      return 0;
    }

    // Back Alpine Slope behind Grand 大雄宝殿 (z < -46, x in [-26, 26.8])
    if (x >= -26.0 && x <= 26.8 && z < -46.0) {
      return Math.min(24.0, ((-46.0 - z) / 26.0) * 24.0);
    }

    // 1. East Mountain across East River: 五台山文殊殿 (z ~ +4)
    if (x >= 24.0 && z >= -58.0 && z <= 46.0) {
      // Smooth blend along outer Z boundaries (z < -50 or z > 28) into alpine hillside
      const zOut = z < -50.0 ? Math.min(1, (-50.0 - z) / 8.0) : (z > 28.0 ? Math.min(1, (z - 28.0) / 18.0) : 0);

      // West bank before river (x in [24, 26.8]) -> level courtyard east bank at y = 0
      let eastH = 0;
      if (x >= 26.8 && x <= 33.2) {
        // Separating East Riverbed carving along x = 30.0
        const distR = Math.abs(x - 30.0) / 3.2;
        eastH = -0.68 * (1 - distR * distR);
      } else if (x > 33.2 && x < 114.0) {
        // Ascending Mount Wutai Slopes rising smoothly from y = 0.1 at x=34 to y = 16.5 at x=114
        const t = Math.max(0, Math.min(1, (x - 34.0) / 80.0));
        eastH = 0.1 + t * 16.4;
      } else if (x >= 114.0 && x <= 144.0) {
        // Flat Summit Plateau (文殊殿 at z ~ +4, y = 16.5)
        eastH = 16.5;
      } else if (x > 144.0) {
        // Snow-capped Alpine Ridge backing 文殊殿
        eastH = 16.5 + Math.min(26.0, ((x - 144.0) / 28.0) * 26.0);
      }

      // Flatten 7 White Stupa circular terraces & East trail Good Deed terraces
      const flatSpots = [...(this.WENSHU_STUPAS || []), { x: 50.5, z: 14.5 }, { x: 85.0, z: -10.0 }];
      for (const st of flatSpots) {
        const dSt = Math.hypot(x - st.x, z - st.z);
        if (dSt <= 5.6) {
          const stBaseH = 0.1 + Math.max(0, Math.min(1, (st.x - 34.0) / 80.0)) * 16.4;
          const blend = dSt <= 4.0 ? 1 : 1 - (dSt - 4.0) / 1.6;
          eastH = eastH * (1 - blend) + stBaseH * blend;
        }
      }

      // Gentle ridge border above/below the corridor
      if (zOut > 0) {
        eastH += zOut * (x > 34 ? 5.5 : 2.5);
      }
      return eastH;
    }

    // 2. West Seven-Buddha Mountain (七佛山) & Summit Plaza for Relocated 七佛殿 (x <= -24, z in [-48, 58])
    if (x <= -24.0 && z >= -48.0 && z <= 58.0) {
      let westH = 0;
      if (x > -26.0) {
        // Flat West courtyard transition bank at y = 0 (keeping front river moat along z in [10.4, 16.6])
        westH = 0;
        if (z >= 10.4 && z <= 16.6) {
          const dz = Math.abs(z - 13.5);
          if (dz < 2.9) {
            westH -= 0.58 * (1 - Math.pow(dz / 2.9, 2));
          }
        }
      } else if (x > -78.0) {
        // Ascending West Seven-Buddha Mountain Slope rising smoothly from y = 0.1 at x=-26 to y = 16.5 at x=-78
        const t = Math.max(0, Math.min(1, (-26.0 - x) / 52.0));
        westH = 0.1 + t * 16.4;
      } else if (x >= -136.0) {
        // Wide, open mountain-top summit plaza surrounding 七佛殿 at y = 16.5
        westH = 16.5;
      } else {
        // Gentle distant ridge far behind the open summit plateau (x < -136)
        westH = 16.5 + Math.min(20.0, ((-136.0 - x) / 30.0) * 20.0);
      }

      // Flatten level circular terraces along the climb so West Trail Deeds sit 100% level!
      const stations = [
        { x: -39.0, z: 18.0 },
        { x: -57.0, z: 18.0 },
        { x: -48.0, z: -14.0 }
      ];
      for (const st of stations) {
        const dSt = Math.hypot(x - st.x, z - st.z);
        if (dSt <= 5.8) {
          const stBaseH = 0.1 + Math.max(0, Math.min(1, (-26.0 - st.x) / 52.0)) * 16.4;
          const blend = dSt <= 4.2 ? 1 : 1 - (dSt - 4.2) / 1.6;
          westH = westH * (1 - blend) + stBaseH * blend;
        }
      }

      // Smooth outer Z edges only beyond z < -36 or z > 44 so nothing encroaches on the open summit plaza
      if (z < -36.0) {
        westH += Math.min(1, (-36.0 - z) / 12.0) * 4.5;
      } else if (z > 44.0) {
        westH += Math.min(1, (z - 44.0) / 14.0) * 5.0;
      }
      return westH;
    }

    let baseSlope = 0;
    if (z > 18.0) {
      baseSlope = Math.min(18.0, ((z - 18.0) / 86.0) * 18.0);
    }

    // Gentle valley amphitheater hills rising on far left/right (|x| > 28)
    let wallLift = 0;
    const absX = Math.abs(x);
    if (absX > 28 && z > 2) {
      wallLift = Math.pow((absX - 28) / 24, 1.45) * 10.5;
    }

    // Natural gentle ground undulation on outer meadows (kept flat on plazas/paths)
    const rolling = Math.abs(x) > 8 && z > 18 && z < 92
      ? Math.sin(x * 0.12) * Math.cos(z * 0.09) * 0.35
      : 0;

    let naturalH = baseSlope + wallLift + rolling;

    // 1. Mountain-Top Home Plateau (z in [91, 114], |x| <= 18) -> level scenic summit at y = 16.2
    const summitH = 16.2;
    if (z >= 91 && z <= 114 && absX <= 19.5) {
      const edgeX = absX > 15 ? (absX - 15) / 4.5 : 0;
      const edgeZ = z < 94 ? (94 - z) / 3.0 : (z > 110 ? (z - 110) / 4.0 : 0);
      const edge = Math.min(1, Math.max(edgeX, edgeZ));
      naturalH = summitH * (1 - edge) + naturalH * edge;
    }

    // 2. Smooth Shallow Riverbed Carving from Mountain Summit down to Temple Front Moat (z = 13.5)
    if (z >= 10.4 && z <= 112.0) {
      const rHalf = this.getRiverHalfWidth(z);
      if (z >= 10.4 && z <= 16.6) {
        // Horizontal temple river channel in front of courtyard (clipped neatly at x <= 26 before East bank)
        const dz = Math.abs(z - 13.5);
        if (dz < 2.9 && x < 24.5) {
          const factor = 1 - Math.pow(dz / 2.9, 2);
          naturalH -= 0.58 * factor;
        }
      } else {
        const rc = this.getRiverCenterX(z);
        const distR = Math.abs(x - rc);
        if (distR < rHalf + 1.0) {
          const factor = 1 - Math.pow(Math.min(1, distR / (rHalf + 1.0)), 2);
          naturalH -= 0.42 * factor;
        }
      }
    }

    return naturalH;
  },

  // Walkable surface height including 大雄宝殿 floor, Curved Red Arched Bridge, Wisdom Bridge, Relocated 七佛殿 & 文殊殿
  getSurfaceHeightAt(x, z) {
    if (Math.abs(x) < 24.0 && z >= -39.0 && z < 0.5) {
      return 0.41;
    }
    if (x >= -106.5 && x <= -85.5 && z >= -11.5 && z <= 19.5) {
      return 16.88;
    }
    if (x >= 116.0 && x <= 134.0 && z >= -8.0 && z <= 16.0) {
      return 16.82;
    }
    if (this.WENSHU_STUPAS && x > 33.0 && x < 114.0) {
      for (const st of this.WENSHU_STUPAS) {
        if (Math.hypot(x - st.x, z - st.z) <= 3.35) {
          const stBaseH = 0.1 + Math.max(0, Math.min(1, (st.x - 34.0) / 80.0)) * 16.4;
          return stBaseH + 0.06;
        }
      }
    }
    const bridgeY = this.getBridgeHeightAt(x, z);
    if (bridgeY !== null) {
      return Math.max(bridgeY, this.getTerrainHeight(x, z));
    }
    if (window.game && window.game.state && window.game.state.completedDeeds && window.game.state.completedDeeds['build_wisdom_bridge']) {
      const wbY = this.getWisdomBridgeHeightAt(x, z);
      if (wbY !== null) {
        return Math.max(wbY, this.getTerrainHeight(x, z));
      }
    }
    return this.getTerrainHeight(x, z);
  },

  // Dedicated Terrain Height for Stop #1 Map: 长寿殿 (Longevity Sanctuary Map)
  getChangshouMapBridgeHeightAt(x, z) {
    if (x >= 7.2 && x <= 16.8 && Math.abs(z - 4.0) <= 2.8) {
      const t = (x - 12.0) / 4.8;
      return 0.22 + 1.38 * Math.max(0, 1 - t * t);
    }
    return null;
  },

  getChangshouMapTerrainHeight(x, z) {
    let h = 0;
    if (x >= 14.8) {
      // Emerald arrival courtyard (y = 0)
      h = 0;
    } else if (x >= 9.2 && x < 14.8) {
      // Tranquil Lotus Stream channel around x = 12.0
      const distR = Math.abs(x - 12.0) / 2.8;
      h = -0.64 * (1 - distR * distR);
    } else if (x > -10.0 && x < 9.2) {
      // Flat west bank garden meadow
      h = 0;
    } else if (x > -48.0 && x <= -10.0) {
      // Smooth ascending Longevity Mountain flower avenue (y = 0.1 at x=-10 -> 16.5 at x=-48)
      const t = Math.max(0, Math.min(1, (-10.0 - x) / 38.0));
      h = 0.1 + t * 16.4;
    } else if (x >= -96.0 && x <= -48.0) {
      // Open summit plaza around 长寿殿 at y = 16.5
      h = 16.5;
    } else if (x < -96.0) {
      h = 16.5 + Math.min(22.0, ((-96.0 - x) / 30.0) * 22.0);
    }

    // Flatten level terraces for the 3 Flower Gardens & 4 Sacred Lotus Ponds along the ascent
    const stations = [
      ...(this.CHANGSHOU_FLOWER_GARDENS || []),
      ...(this.CHANGSHOU_LOTUS_PONDS || [])
    ];
    for (const st of stations) {
      const dSt = Math.hypot(x - st.x, z - st.z);
      if (dSt <= 5.2) {
        const stBaseH = 0.1 + Math.max(0, Math.min(1, (-10.0 - st.x) / 38.0)) * 16.4;
        const blend = dSt <= 3.6 ? 1 : 1 - (dSt - 3.6) / 1.6;
        h = h * (1 - blend) + stBaseH * blend;
      }
    }

    // Gentle outer Z hills framing the valley
    if (z < -26.0) {
      h += Math.min(1, (-26.0 - z) / 18.0) * 10.5;
    } else if (z > 34.0) {
      h += Math.min(1, (z - 34.0) / 18.0) * 10.5;
    }
    return h;
  },

  getChangshouMapSurfaceHeightAt(x, z) {
    if (x >= -75.5 && x <= -56.6 && z >= -8.2 && z <= 16.2) {
      return 16.92;
    }
    const bridgeY = this.getChangshouMapBridgeHeightAt(x, z);
    if (bridgeY !== null) {
      return Math.max(bridgeY, this.getChangshouMapTerrainHeight(x, z));
    }
    return this.getChangshouMapTerrainHeight(x, z);
  },

  // Game Designer Recommendation #1: Dharma Rank Titles unlocked as Virtue Points grow
  DHARMA_RANKS: [
    { minVP: 0, title: '🌱 Novice Traveler', zhTitle: '🌱 初行善信' },
    { minVP: 8, title: '🏡 Filial Child', zhTitle: '🏡 孝亲童子' },
    { minVP: 18, title: '🦌 Forest Protector', zhTitle: '🦌 护生行者' },
    { minVP: 35, title: '☸️ Stupa Pilgrim', zhTitle: '☸️ 绕塔行者' },
    { minVP: 65, title: '🪷 Lotus Practitioner', zhTitle: '🪷 莲池行者' },
    { minVP: 100, title: '🌟 Little Bodhisattva', zhTitle: '🌟 妙智小菩萨' }
  ],

  CHARACTERS: [
    {
      id: 'tibetan_lama',
      name: 'Tibetan Little Lama',
      shortName: 'Little Lama',
      zhName: '清净小沙弥',
      zhShortName: '小沙弥',
      emoji: '🙏',
      defaultRobe: '#8c1d18',
      saffronTrim: '#e8a825',
      defaultHat: 'none',
      defaultAura: 'lotus_orb',
      skinColor: '#ffdfc0'
    }
  ],

  BELL_PAVILION_POS: { x: -13.0, z: 6.2 },

  // Tranquil Sit & Contemplate spots styled after peaceful mountain-lake sanctuaries
  SCENIC_SEATS: [
    {
      id: 'lotus_pier',
      name: 'Lotus Pond Wooden Pier',
      zhName: '莲池木栈座',
      emoji: '🪷',
      x: 13.8,
      z: 4.8,
      rotY: -Math.PI * 0.52,
      camOffset: { x: -4.2, y: 2.3, z: 3.4 },
      lookAtOffset: { x: 2.5, y: 0.6, z: -1.5 },
      isPier: true
    },
    {
      id: 'bridge_bench',
      name: 'Riverside Red-Bridge Bench',
      zhName: '红桥临水座',
      emoji: '🌉',
      x: -6.2,
      z: 17.5,
      rotY: 0.35,
      camOffset: { x: 3.8, y: 2.4, z: 4.0 },
      lookAtOffset: { x: 0.8, y: 0.9, z: -5.0 },
      isPier: false
    },
    {
      id: 'stream_bench',
      name: 'Misty Stream Contemplation Seat',
      zhName: '清溪禅思座',
      emoji: '🌊',
      x: 6.8,
      z: 58.0,
      rotY: -1.15,
      camOffset: { x: 4.2, y: 2.4, z: 3.2 },
      lookAtOffset: { x: -5.5, y: 0.8, z: -1.0 },
      isPier: false
    },
    {
      id: 'summit_bench',
      name: 'Mountain-Top Valley Overlook',
      zhName: '山巅望谷座',
      emoji: '🏔️',
      x: 5.5,
      z: 96.5,
      rotY: Math.PI,
      camOffset: { x: 3.6, y: 2.6, z: 4.2 },
      lookAtOffset: { x: 0, y: -1.2, z: -14.0 },
      isPier: false
    }
  ],

  ROBE_COLORS: [
    { id: '#e67e22', name: 'Saffron Gold', zhName: '明黄僧袍' },
    { id: '#c0392b', name: 'Temple Crimson', zhName: '朱红法袍' },
    { id: '#e84393', name: 'Lotus Pink', zhName: '莲粉色' },
    { id: '#27ae60', name: 'Bamboo Green', zhName: '翠竹绿' },
    { id: '#2980b9', name: 'Sky Blue', zhName: '晴空蓝' },
    { id: '#8e44ad', name: 'Royal Purple', zhName: '瑞紫色' },
    { id: '#f5efe6', name: 'Moonlight White', zhName: '月白色' }
  ],

  HEADWEAR_OPTIONS: [
    { id: 'halo', name: '✨ Golden Halo', zhName: '✨ 金色佛光' },
    { id: 'lotus_crown', name: '🪷 Lotus Crown', zhName: '🪷 莲花冠' },
    { id: 'bamboo_hat', name: '👒 Bamboo Hat', zhName: '👒 行脚斗笠' },
    { id: 'mala', name: '📿 Mala Beads', zhName: '📿 菩提念珠' },
    { id: 'twin_buns', name: '🎀 Twin Buns', zhName: '🎀 童子发髻' },
    { id: 'none', name: '🙂 No Hat', zhName: '🙂 清净光头' }
  ],

  AURA_OPTIONS: [
    { id: 'lotus_orb', name: '🪷 Floating Lotus', zhName: '🪷 祥瑞金莲' },
    { id: 'firefly', name: '✨ Golden Firefly', zhName: '✨ 金色萤光' },
    { id: 'jade_bunny', name: '🐇 Jade Rabbit', zhName: '🐇 玉兔相伴' },
    { id: 'dove_light', name: '🕊️ Peace Light', zhName: '🕊️ 和平白鸽' }
  ],

  TEMPLE_STYLES: [
    {
      id: 'imperial_gold',
      name: 'Historic Grey-Tile & Crimson Timber Hall',
      zhName: '古风灰瓦红柱大殿',
      roofColor: 0x62676b,
      wallColor: 0x8b1e1e,
      pillarColor: 0xa12020,
      marbleColor: 0xe6e3da
    },
    {
      id: 'tang_wood',
      name: 'Tang Dynasty Rosewood & Peacock Tile',
      zhName: '盛唐古木·孔雀蓝琉璃',
      roofColor: 0x1d6a78,
      wallColor: 0xf4e8d1,
      pillarColor: 0x4a2511,
      marbleColor: 0xebe3d5
    },
    {
      id: 'pure_land_jade',
      name: 'Pure Land White Jade & Lotus Gold',
      zhName: '极乐白玉·金莲宝殿',
      roofColor: 0xe9b44c,
      wallColor: 0xfaf7f0,
      pillarColor: 0xc58b2b,
      marbleColor: 0xffffff
    },
    {
      id: 'zen_mountain',
      name: 'Ancient Mountain Zen Cedar & Bronze',
      zhName: '深山古刹·檀木青铜',
      roofColor: 0x3d405b,
      wallColor: 0xe6ccb2,
      pillarColor: 0x3b2314,
      marbleColor: 0xdcd6cc
    }
  ],

  BUDDHA_MATERIALS: [
    {
      id: 'gilded_gold',
      name: '24K Gilded Temple Gold',
      zhName: '纯金箔庄严法身',
      color: 0xffc72c,
      emissive: 0x3a2400,
      metalness: 0.85,
      roughness: 0.22
    },
    {
      id: 'antique_bronze',
      name: 'Ancient Sacred Bronze',
      zhName: '千年古铜法身',
      color: 0xb07d4f,
      emissive: 0x1d1208,
      metalness: 0.78,
      roughness: 0.38
    },
    {
      id: 'white_jade',
      name: 'Luminous Hetian White Jade',
      zhName: '羊脂白玉法身',
      color: 0xf7f5eb,
      emissive: 0x222620,
      metalness: 0.15,
      roughness: 0.18
    },
    {
      id: 'sandalwood',
      name: 'Carved Fragrant Sandalwood',
      zhName: '沉香木雕法身',
      color: 0x8c5327,
      emissive: 0x1f0f04,
      metalness: 0.2,
      roughness: 0.55
    }
  ],

  SKY_THEMES: [
    {
      id: 'morning_gold',
      name: '🌅 Morning Dew',
      zhName: '🌅 晨曦朝露',
      sky: 0xe6ebd8,
      fog: 0xe2e7d3,
      sunColor: 0xfff4d6,
      sunIntensity: 1.18,
      hemiSky: 0xfff8eb,
      hemiGround: 0x6b5b45,
      hemiIntensity: 0.88,
      fireflies: false
    },
    {
      id: 'daylight_clear',
      name: '☀️ Plateau Sunlight',
      zhName: '☀️ 清昼晴空',
      sky: 0xb8d8f8,
      fog: 0xcce4fa,
      sunColor: 0xffffff,
      sunIntensity: 1.24,
      hemiSky: 0xf0f8ff,
      hemiGround: 0x6b6452,
      hemiIntensity: 0.94,
      fireflies: false
    },
    {
      id: 'sunset_glow',
      name: '🌇 Dusk Golden Hour',
      zhName: '🌇 暮鼓金晖',
      sky: 0xf2ab78,
      fog: 0xe8a17a,
      sunColor: 0xffb36b,
      sunIntensity: 0.96,
      hemiSky: 0xffcfa4,
      hemiGround: 0x5c3b33,
      hemiIntensity: 0.72,
      fireflies: false
    },
    {
      id: 'candle_dusk',
      name: '🌙 Moonlit Fireflies',
      zhName: '🌙 静夜流萤',
      sky: 0x1e1838,
      fog: 0x282147,
      sunColor: 0xb5ccff,
      sunIntensity: 0.58,
      hemiSky: 0x6376b0,
      hemiGround: 0x241e38,
      hemiIntensity: 0.56,
      fireflies: true
    }
  ],

  // Mountain-to-Valley Good Deed Quests (English-Only Hints & Task Bars):
  // Starts at the Mountain-Top Family Home (z = 97), then flows down the misty river valley to the 7-Buddha Temple!
  GOOD_DEEDS: [
    // --- FAMILY HOME TASKS (At Mountain-Top Family Home near Starting Point: x = -11.5, z = 97.0) ---
    {
      id: 'clean_house',
      groupKey: 'family_home',
      title: '1. Clean the House',
      zhTitle: '1. 清扫庭院',
      emoji: '🧹',
      speakerEmoji: '🏡',
      points: 2,
      pos: { x: -11.5, z: 97.0 },
      landmarkName: 'Family Home (Step 1/4)',
      zhLandmarkName: '山顶家园 (第1步/共4步)',
      npcName: 'Mother & Father',
      zhNpcName: '父母亲',
      hintText: 'Mountain-Top Home (Near Start)',
      zhHintText: '山顶家园 (起点旁)',
      taskBoxText: '"Good morning, dear child! Before your mountain journey, can you help sweep the fallen leaves and dust in our yard?"',
      zhTaskBoxText: '“早安孩子！下山礼佛前，能帮爸爸妈妈把院子里的落叶和灰尘清扫干净吗？”',
      virtueLesson: 'Keeping our home clean brings peace and joy to our family.',
      zhVirtueLesson: '洒扫庭除，能让家庭清净和乐。',
      actionButtonLabel: '🧹 Clean the House',
      zhActionButtonLabel: '🧹 清扫庭院',
      celebrationMsg: '🧹 You swept the house clean and tidy for your parents! (+2 VP)',
      zhCelebrationMsg: '🧹 院子打扫得干干净净，父母真开心！(+2 功德)'
    },
    {
      id: 'care_parents',
      groupKey: 'family_home',
      title: '2. Care for Parents',
      zhTitle: '2. 奉茶孝亲',
      emoji: '🍵',
      speakerEmoji: '👵🏼',
      points: 2,
      pos: { x: -11.5, z: 97.0 },
      landmarkName: 'Family Home (Step 2/4)',
      zhLandmarkName: '山顶家园 (第2步/共4步)',
      npcName: 'Mother & Father',
      zhNpcName: '父母亲',
      hintText: 'Mountain-Top Home (Near Start)',
      zhHintText: '山顶家园 (起点旁)',
      taskBoxText: '"Thank you for sweeping! Our shoulders feel a little tired today. Would you pour us a cup of warm lotus tea?"',
      zhTaskBoxText: '“谢谢你打扫院子！今天肩膀有些酸了，能帮我们倒一杯温热的莲心茶吗？”',
      virtueLesson: 'Respecting and caring for our parents is the first great kindness.',
      zhVirtueLesson: '孝顺恭敬父母，是天下第一大善行。',
      actionButtonLabel: '🍵 Care for Parents',
      zhActionButtonLabel: '🍵 为父母奉茶',
      celebrationMsg: '🍵 You served warm tea and cared for your parents with love! (+2 VP)',
      zhCelebrationMsg: '🍵 恭敬奉上暖茶，悉心照料父母！(+2 功德)'
    },
    {
      id: 'cook_parents',
      groupKey: 'family_home',
      title: '3. Cook for Parents',
      zhTitle: '3. 为父母做饭',
      emoji: '🍳',
      speakerEmoji: '🍲',
      points: 2,
      pos: { x: -11.5, z: 97.0 },
      landmarkName: 'Family Home (Step 3/4)',
      zhLandmarkName: '山顶家园 (第3步/共4步)',
      npcName: 'Mother & Father',
      zhNpcName: '父母亲',
      hintText: 'Mountain-Top Home (Near Start)',
      zhHintText: '山顶家园 (起点旁)',
      taskBoxText: '"It is almost lunchtime! Can you cook a pot of warm vegetable soup on the stove so we have food while you are away?"',
      zhTaskBoxText: '“快到午饭时间了，能帮忙煮一锅温暖的蔬菜热汤，让我们在你出门时也能安心用餐吗？”',
      virtueLesson: 'Cooking with a loving heart nourishes the people we love.',
      zhVirtueLesson: '怀着感恩与慈心烹调，能温暖至亲的身心。',
      actionButtonLabel: '🍳 Cook for Parents',
      zhActionButtonLabel: '🍳 煮暖心素汤',
      celebrationMsg: '🍳 A steaming pot of delicious soup is ready for your parents! (+2 VP)',
      zhCelebrationMsg: '🍳 一锅热气腾腾的美味素汤已经做好啦！(+2 功德)'
    },
    {
      id: 'bye_parents',
      groupKey: 'family_home',
      title: '4. Say Bye to Parents',
      zhTitle: '4. 辞别父母',
      emoji: '👋',
      speakerEmoji: '🙏',
      points: 2,
      pos: { x: -11.5, z: 97.0 },
      landmarkName: 'Family Home (Step 4/4)',
      zhLandmarkName: '山顶家园 (第4步/共4步)',
      npcName: 'Mother & Father',
      zhNpcName: '父母亲',
      hintText: 'Mountain-Top Home (Near Start)',
      zhHintText: '山顶家园 (起点旁)',
      taskBoxText: '"You have helped so much at home! Come say goodbye to us before you walk down the mountain to the 7-Buddha Temple."',
      zhTaskBoxText: '“家里都被你照顾得真好！下山去七佛殿礼佛之前，来跟爸爸妈妈道个别吧。”',
      virtueLesson: 'Always greet and say goodbye to your parents with gratitude.',
      zhVirtueLesson: '出门必告、返必面，常怀感恩辞别双亲。',
      actionButtonLabel: '👋 Say Bye to Parents',
      zhActionButtonLabel: '👋 礼别父母',
      celebrationMsg: '👋 Father and Mother bless your journey down the mountain! (+2 VP)',
      zhCelebrationMsg: '👋 父母欢喜祝福你平安下山礼佛修学！(+2 功德)'
    },

    // --- GOOD DEEDS DISTRIBUTED ACROSS ALL FOUR MOUNTAIN TRAILS ---
    {
      id: 'save_animals',
      title: '5. Rescue Trapped Deer (Road to 文殊殿)',
      zhTitle: '5. 救护受困小鹿（文殊殿途中）',
      emoji: '🦌',
      speakerEmoji: '🦌',
      speakerImg: 'assets/cute_deer.png',
      points: 2,
      pos: { x: 50.5, z: 14.5 },
      landmarkName: 'Wutai Slope Pine Terrace',
      zhLandmarkName: '文殊山道松林',
      npcName: 'Little Spotted Deer',
      zhNpcName: '梅花小鹿',
      hintText: 'On the road up to 文殊殿 (Right side)',
      zhHintText: '登上文殊殿的半山松林',
      taskBoxText: '"Help! Help! I am locked inside this wooden cage on the mountain slope to Manjushri Hall. Can you open the latch for me?"',
      zhTaskBoxText: '“救命呀！我被困在文殊山道旁的木笼子里了，能帮我打开门闩放生吗？”',
      virtueLesson: 'Every living creature loves freedom and wants to be safe.',
      zhVirtueLesson: '一切众生皆惜生命、欢喜自在安稳。',
      actionButtonLabel: '🔓 Rescue the Deer',
      zhActionButtonLabel: '🔓 打开笼门救小鹿',
      celebrationMsg: '🦌 The rescued deer leaps out of the cage and joins you toward Manjushri Hall! (+2 VP)',
      zhCelebrationMsg: '🦌 小鹿欢快跃出木笼，成为你登山朝圣的好友！(+2 功德)'
    },
    {
      id: 'stop_hunter',
      title: '6. Free Captured Wildlife (Road to 七佛殿)',
      zhTitle: '6. 护生劝止猎人并放生（七佛殿途中）',
      emoji: '🏹',
      speakerEmoji: '🦊',
      speakerImg: 'assets/cute_fox.png',
      points: 2,
      pos: { x: -48.0, z: -14.0 },
      landmarkName: 'Seven-Buddha Slope Grove',
      zhLandmarkName: '七佛山道放生林',
      npcName: 'Cute Little Fox',
      zhNpcName: '可爱小狐狸',
      hintText: 'On the West mountain path up to 七佛殿',
      zhHintText: '西山七佛殿沿途放生林',
      taskBoxText: '"Oh no! That hunter is aiming his bow and net at me on the Seven-Buddha mountain path! Please ask him to be kind and set me free!"',
      zhTaskBoxText: '“不好啦！猎人正用弓箭和网对着我，请快劝他慈悲护生、放我回七佛山林吧！”',
      virtueLesson: 'Protecting and releasing animals brings peace and long life.',
      zhVirtueLesson: '戒杀放生、慈护群生，感召祥和与健康长寿。',
      actionButtonLabel: '🛡️ Stop Hunter & Free Wildlife',
      zhActionButtonLabel: '🛡️ 慈悲劝猎放生',
      celebrationMsg: '🏹 You gently persuaded the hunter! Wildlife is freed and the little fox follows you! (+2 VP)',
      zhCelebrationMsg: '🏹 猎人听劝放下弓箭放生万物，小狐狸欢喜随行！(+2 功德)'
    },
    {
      id: 'cover_rain',
      title: '7. Cover Rain for Animals (Road to 文殊殿)',
      zhTitle: '7. 为小动物撑伞遮雨（文殊殿途中）',
      emoji: '☔',
      speakerEmoji: '🐇',
      speakerImg: 'assets/cute_bunny.png',
      points: 2,
      pos: { x: 85.0, z: -10.0 },
      landmarkName: 'Misty Wutai Ledge',
      zhLandmarkName: '五台烟雨山台',
      npcName: 'Fluffy Little Bunnies',
      zhNpcName: '毛茸茸小白兔',
      hintText: 'Upper road to 文殊殿 (Left ridge)',
      zhHintText: '文殊殿高处山道',
      taskBoxText: '"Brrr! The mountain rain is so cold on our way up Mount Wutai! Could you open that big lotus umbrella to shelter us?"',
      zhTaskBoxText: '“好冷啊！山雨把我们的毛都淋湿了，能帮我们撑开那把大莲花伞遮雨吗？”',
      virtueLesson: 'Sheltering small and weak beings shows true compassion.',
      zhVirtueLesson: '庇护弱小众生，即是真诚慈悲心的流露。',
      actionButtonLabel: '☔ Cover Rain for Animals',
      zhActionButtonLabel: '☔ 撑莲花伞遮雨',
      celebrationMsg: '☔ The giant lotus umbrella shelters the cute fluffy bunnies from the rain! (+2 VP)',
      zhCelebrationMsg: '☔ 大莲花伞稳稳为小白兔们遮风挡雨！(+2 功德)'
    },
    {
      id: 'help_farmers',
      title: '8. Help Farmer Farm Land (Road to 七佛殿)',
      zhTitle: '8. 助农耕种麦田（七佛殿途中）',
      emoji: '🌾',
      speakerEmoji: '🧑🌾',
      points: 2,
      pos: { x: -39.0, z: 18.0 },
      landmarkName: 'Seven-Buddha Valley Farmland',
      zhLandmarkName: '七佛山谷良田',
      npcName: 'Uncle Lin the Farmer',
      zhNpcName: '农夫林伯伯',
      hintText: 'West trail toward 七佛殿 (Left valley)',
      zhHintText: '前往七佛殿的西山良田',
      taskBoxText: '"Phew, my back is sore on this West hillside toward Seven-Buddha Hall. Could you help me farm the land and plant seeds?"',
      zhTaskBoxText: '“哎呀腰好酸，七佛山坡这块田还没翻土播种呢，能帮伯伯一起耕田撒种吗？”',
      virtueLesson: 'Helping hardworking people lightens their burden and grows good harvests.',
      zhVirtueLesson: '随喜助人劳作，共结丰收善果。',
      actionButtonLabel: '🌾 Help Farmer Farm Land',
      zhActionButtonLabel: '🌾 帮伯伯耕田播种',
      celebrationMsg: '🌾 Golden wheat and fresh crops sprout along the Seven-Buddha Valley path! (+2 VP)',
      zhCelebrationMsg: '🌾 金黄麦苗与翠绿庄稼在七佛山道欣欣向荣！(+2 功德)'
    },
    {
      id: 'water_plants',
      title: '9. Water Thirsty Plants (Road to 七佛殿)',
      zhTitle: '9. 浇灌干渴花草（七佛殿途中）',
      emoji: '💧',
      speakerEmoji: '🌱',
      points: 2,
      pos: { x: -57.0, z: 18.0 },
      landmarkName: 'Seven-Buddha Spring Garden',
      zhLandmarkName: '七佛山泉花圃',
      npcName: 'Drooping Little Flowers',
      zhNpcName: '干渴的小花们',
      hintText: 'Upper West trail to 七佛殿',
      zhHintText: '七佛山高处泉水花圃',
      taskBoxText: '"We are so thirsty on the climb up Seven-Buddha Mountain! Please scoop cool spring water so our leaves and petals can bloom again."',
      zhTaskBoxText: '“七佛山坡晒得我们好口渴呀！请舀一瓢清凉山泉水浇灌，让我们重新绽放吧！”',
      virtueLesson: 'Caring for plants and nature keeps the whole world green and happy.',
      zhVirtueLesson: '爱护草木生机，大地常保青翠欢喜。',
      actionButtonLabel: '💧 Water the Plants',
      zhActionButtonLabel: '💧 舀山泉浇花木',
      celebrationMsg: '💧 Fresh spring water revives the saplings and colorful flowers along the climb! (+2 VP)',
      zhCelebrationMsg: '💧 清泉滋润下，树苗与百花在七佛山道灿烂绽放！(+2 功德)'
    },
    {
      id: 'cross_river',
      title: '10. Help People Cross River (To 大雄宝殿)',
      zhTitle: '10. 架桥助人过河（通往大雄宝殿）',
      emoji: '🌉',
      speakerEmoji: '👴🏼',
      points: 2,
      pos: { x: 0.0, z: 36.0 },
      landmarkName: 'Valley River Crossing',
      zhLandmarkName: '幽谷溪渡口',
      npcName: 'Grandpa & Little Child',
      zhNpcName: '老爷爷与小朋友',
      hintText: 'Center mountain trail to 大雄宝殿',
      zhHintText: '中路山溪渡口（前往大雄宝殿）',
      taskBoxText: '"The mountain river is flowing too fast for us to step across on the way to the Grand Hall! Can you lay the bridge planks?"',
      zhTaskBoxText: '“溪水太急过不去啦！能帮忙铺好木桥板，扶我们安全前往大雄宝殿吗？”',
      virtueLesson: 'Building bridges for others helps everyone reach safety together.',
      zhVirtueLesson: '铺桥修路利人行，共赴平安彼岸。',
      actionButtonLabel: '🌉 Help People Cross River',
      zhActionButtonLabel: '🌉 铺桥助人渡河',
      celebrationMsg: '🌉 A sturdy wooden bridge spans the river toward the Grand Mahavira Hall! (+2 VP)',
      zhCelebrationMsg: '🌉 坚固木桥架通溪流，众人都能平安前往大雄宝殿啦！(+2 功德)'
    },
    {
      id: 'cook_hungry',
      title: '11. Feed the Hungry & Poor (To 大雄宝殿)',
      zhTitle: '11. 施粥济助饥人（通往大雄宝殿）',
      emoji: '🍲',
      speakerEmoji: '🥣',
      points: 2,
      pos: { x: -14.5, z: 54.0 },
      landmarkName: 'Mountain Trail Charity Kitchen',
      zhLandmarkName: '山道施粥棚',
      npcName: 'Hungry Travelers',
      zhNpcName: '饥饿旅人',
      hintText: 'Upper mountain trail to 大雄宝殿 (Left)',
      zhHintText: '前往大雄宝殿的山道左侧',
      taskBoxText: '"We walked down the mountain all day and have no food left. Could you share some warm vegetarian porridge from the pot?"',
      zhTaskBoxText: '“我们赶了一天山路都没吃东西，能分我们一碗热腾腾的吉祥素粥吗？”',
      virtueLesson: 'Sharing food with hungry people fills the world with warmth.',
      zhVirtueLesson: '施食济贫，让世间处处洋溢温暖与欢喜。',
      actionButtonLabel: '🍲 Share Warm Food',
      zhActionButtonLabel: '🍲 盛暖粥布施',
      celebrationMsg: '🍲 Everyone enjoys steaming vegetarian porridge with grateful smiles! (+2 VP)',
      zhCelebrationMsg: '🍲 旅人们喝到温暖素粥，露出感恩的笑容！(+2 功德)'
    },
    {
      id: 'good_wishes',
      title: '12. Make Wishes at Bodhi Tree (Outside 大雄宝殿)',
      zhTitle: '12. 菩提树下发善愿（大雄宝殿前）',
      emoji: '🍃',
      speakerEmoji: '👧🏻',
      points: 2,
      pos: { x: 14.5, z: 20.5 },
      landmarkName: 'Vajrasana Bodhi Tree',
      zhLandmarkName: '金刚座菩提祈愿树',
      npcName: 'Friend Xiao An',
      zhNpcName: '小安善友',
      hintText: 'Bodhi Wishing Tree (Before 大雄宝殿 Bridge Right)',
      zhHintText: '大雄宝殿前红桥右侧·金刚座菩提树',
      taskBoxText: '"Look at the serene Bodhi Tree beside the Diamond Throne (Vajrasana)! Write your wish on a Bodhi leaf and watch it fly up into the swaying canopy!"',
      zhTaskBoxText: '“快看大雄宝殿前宛如金刚座旁的古老菩提树！让我们在菩提树叶上发下善愿，看金色菩提叶随微风飞上树梢！”',
      virtueLesson: 'Wishing others happiness makes your own heart shine brightly.',
      zhVirtueLesson: '诚心祝愿众生安乐，自心亦如菩提明灯发光。',
      actionButtonLabel: '🍃 Make Bodhi Leaf Wish',
      zhActionButtonLabel: '🍃 放飞菩提叶祈愿',
      celebrationMsg: '🍃 Your Bodhi leaf wish rises gently on the breeze into the sacred canopy! (+2 VP)',
      zhCelebrationMsg: '🍃 载着善愿的菩提树叶随微风轻盈飞上圣树！(+2 功德)'
    },
    {
      id: 'clean_hall',
      title: '13. Clean 大雄宝殿 Steps',
      zhTitle: '13. 扫净大雄宝殿石阶',
      emoji: '🧹',
      speakerEmoji: '🧑‍🦲',
      points: 2,
      pos: { x: -11.5, z: 6.5 },
      landmarkName: 'Grand Hall Stone Courtyard',
      zhLandmarkName: '大雄宝殿前庭石阶',
      npcName: 'Novice Sweeper Monk',
      zhNpcName: '扫地小师兄',
      hintText: 'Grand Mahavira Hall Courtyard (Past Red Bridge)',
      zhHintText: '大雄宝殿石阶前（过红桥）',
      taskBoxText: '"Welcome to the Grand Mahavira Hall (大雄宝殿)! Let’s sweep these fallen leaves clean before taking off our shoes to enter."',
      zhTaskBoxText: '“欢迎来到宏伟的大雄宝殿！让我们先扫净石阶落叶，再欢喜脱鞋入殿礼佛吧。”',
      virtueLesson: 'Cleaning the temple sweeps away messy thoughts in our own mind.',
      zhVirtueLesson: '清扫殿阶尘垢，亦是涤净心中的烦恼尘埃。',
      actionButtonLabel: '🧹 Sweep Temple Steps',
      zhActionButtonLabel: '🧹 清扫殿前石阶',
      celebrationMsg: '🧹 The Grand Hall stone courtyard is spotless! Take off your shoes at the rack to enter! (+2 VP)',
      zhCelebrationMsg: '🧹 宝殿石阶一尘不染！请在门口鞋架脱鞋，步入宏伟大雄宝殿礼佛！(+2 功德)'
    },
    {
      id: 'build_wisdom_bridge',
      title: '14. Build Wisdom Bridge (To 文殊殿)',
      zhTitle: '14. 修建文殊智慧桥（前往文殊殿）',
      emoji: '🌉',
      speakerEmoji: '👷',
      points: 5,
      pos: { x: 24.8, z: 4.0 },
      landmarkName: 'East River Bridge Site',
      zhLandmarkName: '东溪文殊智慧桥渡口',
      npcName: 'Bridge Master Lu',
      zhNpcName: '鲁班桥师',
      hintText: 'East Riverbank (Right of 大雄宝殿)',
      zhHintText: '东溪岸边（大雄宝殿右侧）',
      taskBoxText: '"Across this river rises Mount Wutai and 文殊殿 (Manjushri Hall)! Help me lay the timber planks to build the Wisdom Bridge!"',
      zhTaskBoxText: '“渡过这条东溪便是清凉五台山与文殊殿！快来帮我铺设木桥，搭建智慧大桥吧！”',
      virtueLesson: 'Building bridges helps everyone cross toward wisdom together.',
      zhVirtueLesson: '修筑智慧之桥，令大众皆能跨越彼岸、开启妙智。',
      actionButtonLabel: '🌉 Build Wisdom Bridge',
      zhActionButtonLabel: '🌉 搭建智慧桥',
      celebrationMsg: '🌉 The Wisdom Bridge is built! Cross the river to circle the 7 White Stupas and visit 文殊殿! (+5 VP)',
      zhCelebrationMsg: '🌉 智慧桥落成！过桥依次绕行七座白塔，直上五台山文殊殿！(+5 功德)'
    }
  ],

  // 8 Selectable Good Wishes for the Bodhi Wishing Tree (Task #12)
  EIGHT_GOOD_WISHES: [
    {
      id: 'wish_world_peace',
      emoji: '🌍',
      title: '1. Wishing for World Peace',
      zhTitle: '1. 祈愿世界和平',
      detail: 'May all countries and people live together in peace, kindness, and harmony.',
      zhDetail: '愿世界各国与人民和平共处、慈悲友爱、和谐安宁。'
    },
    {
      id: 'wish_parents_healthy',
      emoji: '🏡',
      title: '2. Wishing Parents Be Healthy',
      zhTitle: '2. 祈愿父母安康',
      detail: 'May Mom and Dad always stay healthy, strong, safe, and happy every day.',
      zhDetail: '愿爸爸妈妈身体健康、平安顺遂、每天欢喜快乐。'
    },
    {
      id: 'wish_friends_happy',
      emoji: '😊',
      title: '3. Wishing My Friends Be Happy',
      zhTitle: '3. 祈愿朋友欢喜',
      detail: 'May all my friends smile brightly, feel loved, and have joyful hearts.',
      zhDetail: '愿所有伙伴笑容灿烂、心怀暖意、每天开心自在。'
    },
    {
      id: 'wish_friends_healthy',
      emoji: '💪',
      title: '4. Wishing My Friends Be Healthy',
      zhTitle: '4. 祈愿朋友强健',
      detail: 'May my friends and classmates grow strong, energetic, and free from sickness.',
      zhDetail: '愿同学们茁壮成长、精力充沛、远离一切病痛。'
    },
    {
      id: 'wish_animals_full',
      emoji: '🦌',
      title: '5. Wishing Animals No Longer Hungry',
      zhTitle: '5. 祈愿动物饱足',
      detail: 'May every animal in the forest, sky, and ocean have plenty of food and safety.',
      zhDetail: '愿山林飞禽、走兽与水族生灵都能衣食饱足、平安无畏。'
    },
    {
      id: 'wish_hungry_fed',
      emoji: '🍲',
      title: '6. Wishing No One Goes Hungry',
      zhTitle: '6. 祈愿天下无饥',
      detail: 'May everyone in the world who is poor or hungry have warm food and shelter.',
      zhDetail: '愿世间一切贫困饥饿之人，皆得温饱与安稳居所。'
    },
    {
      id: 'wish_kids_wisdom',
      emoji: '📖',
      title: '7. Wishing Kids Grow in Wisdom',
      zhTitle: '7. 祈愿童子增慧',
      detail: 'May all children study well, speak kindly, and help others with a bright mind.',
      zhDetail: '愿所有孩童勤奋向学、口出爱语、以光明智慧帮助他人。'
    },
    {
      id: 'wish_all_beings_joy',
      emoji: '🪷',
      title: '8. Wishing All Beings Be Free from Worry',
      zhTitle: '8. 祈愿众生离忧',
      detail: 'May every living being let go of fear and sadness and find true peace.',
      zhDetail: '愿一切有情众生放下忧悲恐惧，得大清净与安乐。'
    }
  ],

  // Grand 大雄宝殿 Sanctuary: Western Three Saints (西方三圣: 南无大势至菩萨, 南无阿弥陀佛, 南无观音菩萨)
  DAXIONG_DATA: {
    name: 'Grand Mahavira Hall · Western Three Saints (大雄宝殿 · 西方三圣)',
    zhName: '大雄宝殿 · 西方三圣',
    subtitle: 'Western Three Saints: Mahasthamaprapta · Amitabha Buddha · Guanyin Bodhisattva',
    zhSubtitle: '西方三圣：南无大势至菩萨 · 南无阿弥陀佛 · 南无观音菩萨',
    shrineImg: 'assets/western_three_saints.jpg'
  },

  THREE_BUDDHAS_DATA: [
    {
      index: 0,
      id: 'dashizhi',
      name: 'Mahasthamaprapta Bodhisattva (Left)',
      cnName: '南无大势至菩萨（西方三圣左尊）',
      shortCnName: '南无大势至菩萨',
      img: 'assets/western_three_saints.jpg',
      altarX: -7.65,
      title: 'Bodhisattva of Great Strength & Wisdom Light (西方三圣 · 南无大势至菩萨)',
      zhTitle: '西方三圣 · 南无大势至菩萨（智慧光明遍照）',
      wishAndBenefit: 'May great wisdom light illuminate every step of your path, strengthening focus, courage, and mindful remembrance.',
      zhWishAndBenefit: '祈愿智慧光明遍照身心，得大精进与正念安住，开启清净无碍大智慧！',
      buddhaWish: 'He holds a blooming lotus and radiates pure wisdom light so all beings transcend confusion effortlessly.',
      zhBuddhaWish: '以清净念佛智慧之光摄受众生，令一切有情离苦得乐、明心增慧。',
      bowBenefit: 'Bowing to 南无大势至菩萨 awakens bright wisdom, focused strength, and steady peaceful mindfulness!'
    },
    {
      index: 1,
      id: 'amitabha',
      name: 'Amitabha Buddha (Center)',
      cnName: '南无阿弥陀佛（西方三圣中尊）',
      shortCnName: '南无阿弥陀佛',
      img: 'assets/western_three_saints.jpg',
      altarX: 0.0,
      title: 'Buddha of Infinite Light & Infinite Life (西方三圣 · 南无阿弥陀佛)',
      zhTitle: '西方三圣 · 南无阿弥陀佛（无量光寿佛）',
      wishAndBenefit: 'May your heart rest in boundless warmth, serene light, and infinite peace, welcoming all beings home.',
      zhWishAndBenefit: '愿汝身心清净吉祥、光明无量、寿命无量，常行善法、究竟离苦得乐！',
      buddhaWish: 'He extends His compassionate welcoming hand across golden lotus clouds to guide every sincere heart.',
      zhBuddhaWish: '金身垂手接引十方众生，愿一切善信同生极乐清净光明世界。',
      bowBenefit: 'Bowing to 南无阿弥陀佛 calms worries and fills your heart with warm, fearless serenity!'
    },
    {
      index: 2,
      id: 'guanyin',
      name: 'Guanyin Bodhisattva (Right)',
      cnName: '南无观音菩萨（西方三圣右尊 · 南无观世音菩萨）',
      shortCnName: '南无观音菩萨',
      img: 'assets/western_three_saints.jpg',
      altarX: 7.65,
      title: 'Bodhisattva of Great Compassion (西方三圣 · 南无观音菩萨)',
      zhTitle: '西方三圣 · 南无观音菩萨（大慈大悲寻声救苦）',
      wishAndBenefit: 'May gentle compassion fill your speech and actions, bringing safety, healing comfort, and harmony to family and friends.',
      zhWishAndBenefit: '祈愿慈悲甘露遍洒人心，令一切众生平安康泰、柔和善良、所求顺遂！',
      buddhaWish: 'She holds the pure nectar vase and willow branch to soothe every sorrow and protect all beings safely.',
      zhBuddhaWish: '手持净瓶杨枝遍洒清凉甘露，大慈大悲寻声救苦、护佑世间吉祥安康。',
      bowBenefit: 'Bowing to 南无观音菩萨 fills your heart with boundless kindness, safety, and gentle inner calm!'
    }
  ],

  // 10 Blessing Wishes for 大雄宝殿 Left & Right Lamp-Offering Walls (2 VP each, stays lit 24 hours)
  LAMP_WISHES: [
    { id: 'world_peace', emoji: '🌍', zh: '世界和平', en: 'World Peace', zhDetail: '愿世界各地祥和安宁，干戈永息，众生同享和平净土。', detail: 'May the world dwell in lasting peace and harmony.' },
    { id: 'kind_hearts', emoji: '💖', zh: '人心善良', en: 'Kind & Gentle Hearts', zhDetail: '愿世人内心柔和慈悲，常存善念，彼此关怀爱护。', detail: 'May all people cultivate warm kindness and pure virtue.' },
    { id: 'liberation', emoji: '🪷', zh: '祈求解脱', en: 'Inner Liberation', zhDetail: '愿自心远离烦恼执着，开启解脱自在之光。', detail: 'Praying for inner freedom, clarity, and liberation from sorrow.' },
    { id: 'grow_wisdom', emoji: '💡', zh: '祈求增长智慧', en: 'Grow in Wisdom', zhDetail: '愿破除无明暗蔽，学习通达明理，福慧日日增长。', detail: 'May bright Dharma wisdom shine clearly in every thought.' },
    { id: 'all_liberation', emoji: '🌟', zh: '祈求大家解脱', en: 'Universal Liberation', zhDetail: '愿一切有情众生共沐佛光，离苦得乐，同得圆满解脱。', detail: 'Praying that every living being awakens and attains true peace.' },
    { id: 'family_health', emoji: '💚', zh: '家人健康', en: 'Family Health', zhDetail: '愿父母亲友身体健康、延年益寿、免除一切病痛灾障。', detail: 'May parents and loved ones enjoy lasting health and strength.' },
    { id: 'smart_children', emoji: '🌱', zh: '孩子聪明', en: 'Wise & Bright Children', zhDetail: '愿孩子们耳聪目明、纯善勤学、仁爱明理、健康成长。', detail: 'May children grow bright, diligent, kind-hearted, and wise.' },
    { id: 'exam_100', emoji: '💯', zh: '考试100分', en: '100% Exam Success', zhDetail: '愿学业进步、沉着专注、文思泉涌，考试得心应手拿100分！', detail: 'Wishing calm focus, sharp memory, and 100% excellence on exams.' },
    { id: 'smooth_job', emoji: '💼', zh: '找工作顺利', en: 'Smooth Job Search', zhDetail: '愿事业与求职遇良缘贵人，所行顺遂、安稳发展、发挥所长。', detail: 'Wishing smooth opportunities, good mentors, and fulfilling work.' },
    { id: 'happy_harmony', emoji: '🏡', zh: '阖家吉祥平安', en: 'Family Joy & Safety', zhDetail: '愿家宅清净吉祥、出入平安、邻里和睦、万事如意圆满。', detail: 'May your home and community be filled with safety and harmony.' }
  ],

  // Traditional 7 Buddhas (Seven Buddhas of Antiquity) — Bilingual Simplified Chinese & English:
  SEVEN_BUDDHAS: [
    {
      index: 0,
      name: 'Vipassi Buddha',
      cnName: '毗婆尸佛',
      img: 'assets/buddha_1_vipassi.jpg',
      title: 'Buddha of Clear Eyes & Bright Mind',
      zhTitle: '净眼明心之佛',
      haloColor: 0xffd166,
      robeColor: 0xe89b1c,
      robeTrim: 0xc7770c,
      lotusColor: 0xf7d788,
      scale: 1.0,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing you a clear, honest heart to grow bright wisdom.',
      zhWishAndBenefit: '愿汝心怀清净诚实，开启光明智慧，学习通达无惑。',
      buddhaWish: 'He wishes for every child to see the world clearly with an honest, calm heart.',
      zhBuddhaWish: '愿一切行者以清净宁静之心明察世间真理。',
      bowBenefit: 'Bowing to Vipassi Buddha gives you bright wisdom and helps you learn clearly without confusion!',
      zhBowBenefit: '礼拜毗婆尸佛，令得光明智慧，思路清晰、勤学不惑！'
    },
    {
      index: 1,
      name: 'Sikhi Buddha',
      cnName: '尸弃佛',
      img: 'assets/buddha_2_sikhi.jpg',
      title: 'Buddha of Warm Courage Light',
      zhTitle: '无畏暖光之佛',
      haloColor: 0xff9f1c,
      robeColor: 0xe26b2c,
      robeTrim: 0xb84612,
      lotusColor: 0xf49eb4,
      scale: 1.0,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing warm light around you to make you brave and fearless.',
      zhWishAndBenefit: '愿慈光照耀周身，令汝勇敢无畏、安稳自在。',
      buddhaWish: 'He wishes to shine warm light like a gentle lamp so no child ever feels afraid in the dark.',
      zhBuddhaWish: '愿如温暖明灯般普照黑暗，令众生远离惊惶畏惧。',
      bowBenefit: 'Bowing to Sikhi Buddha makes you brave, confident, and safe from fear!',
      zhBowBenefit: '礼拜尸弃佛，令得坚毅勇气与自信安稳，永离恐惧！'
    },
    {
      index: 2,
      name: 'Vessabhu Buddha',
      cnName: '毗舍浮佛',
      img: 'assets/buddha_3_vessabhu.jpg',
      title: 'Buddha Who Protects All Animals & Beings',
      zhTitle: '慈护群生之佛',
      haloColor: 0x52b788,
      robeColor: 0x7c963c,
      robeTrim: 0x566e22,
      lotusColor: 0xdce6cc,
      scale: 1.0,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing peace for all beings to bring kind friends and good health.',
      zhWishAndBenefit: '愿万物生灵和平共处，感召良友相伴与身心康宁。',
      buddhaWish: 'He wishes for all people, birds, and forest animals to live together safely like one big family.',
      zhBuddhaWish: '愿人类与飞鸟走兽同处一林，和平安全如同一家。',
      bowBenefit: 'Bowing to Vessabhu Buddha brings you kind friends, good health, and a loving heart!',
      zhBowBenefit: '礼拜毗舍浮佛，感得善友围绕、健康平安与广博爱心！'
    },
    {
      index: 3,
      name: 'Kakusandha Buddha',
      cnName: '拘留孙佛',
      img: 'assets/buddha_4_kakusandha.jpg',
      title: 'Buddha Who Melts Away Worries',
      zhTitle: '融忧解恼之佛',
      haloColor: 0xffd166,
      robeColor: 0xf2a518,
      robeTrim: 0xc97b08,
      lotusColor: 0xffca4b,
      scale: 1.14,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing away worries and anger so you feel happy and peaceful.',
      zhWishAndBenefit: '愿消融一切烦恼嗔恚，常保欢喜祥和之心。',
      buddhaWish: 'He wishes to wash away anger, sadness, and worries so everyone can smile happily.',
      zhBuddhaWish: '愿涤除世间嗔恨、忧愁与烦恼，令大众展颜欢笑。',
      bowBenefit: 'Bowing to Kakusandha Buddha helps you let go of bad moods and feel happy and peaceful!',
      zhBowBenefit: '礼拜拘留孙佛，助你放下坏情绪，重获欢喜宁静！'
    },
    {
      index: 4,
      name: 'Konagamana Buddha',
      cnName: '拘那含牟尼佛',
      img: 'assets/buddha_5_konagamana.jpg',
      title: 'Golden Buddha of Generosity',
      zhTitle: '金色布施之佛',
      haloColor: 0x4cc9f0,
      robeColor: 0x2d6da3,
      robeTrim: 0x1b4b78,
      lotusColor: 0xbcd4e6,
      scale: 1.0,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing you a generous heart that brings joy and abundance.',
      zhWishAndBenefit: '愿修欢喜布施之心，感招丰足福报与法喜。',
      buddhaWish: 'He wishes for everyone to discover that a generous, sharing heart shines brighter than gold.',
      zhBuddhaWish: '愿众生皆知慷慨分享之心，比世间黄金更加璀璨生辉。',
      bowBenefit: 'Bowing to Konagamana Buddha brings blessings, abundance, and joy in sharing!',
      zhBowBenefit: '礼拜拘那含牟尼佛，增长福德资粮，常怀布施法喜！'
    },
    {
      index: 5,
      name: 'Kassapa Buddha',
      cnName: '迦叶佛',
      img: 'assets/buddha_6_kassapa.jpg',
      title: 'Buddha of Good Habits & Pure Light',
      zhTitle: '净行清光之佛',
      haloColor: 0xf4a261,
      robeColor: 0x8e5ba6,
      robeTrim: 0x663a7d,
      lotusColor: 0xe3b8dc,
      scale: 1.0,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing you good habits to grow strong focus and respect.',
      zhWishAndBenefit: '愿养成清净良习，增长定力专注与恭敬心。',
      buddhaWish: 'He wishes for children to keep good habits, be polite to parents, and always keep their promises.',
      zhBuddhaWish: '愿行者严守善行良习，敬重师长双亲、言行守信。',
      bowBenefit: 'Bowing to Kassapa Buddha gives you strong focus, good habits, and respect from others!',
      zhBowBenefit: '礼拜迦叶佛，赐予坚定专注力、良善习惯与众人敬爱！'
    },
    {
      index: 6,
      name: 'Sakyamuni Buddha',
      cnName: '释迦牟尼佛',
      img: 'assets/buddha_7_sakyamuni.jpg',
      title: 'Our Teacher of Kindness & Awakening',
      zhTitle: '大觉本师慈父',
      haloColor: 0xffd700,
      robeColor: 0xd63828,
      robeTrim: 0x9e1b12,
      lotusColor: 0xf4989c,
      scale: 1.0,
      mudra: 'standing_bowl',
      wishAndBenefit: 'Wishing your bright Buddha Heart to blossom with kindness and wisdom.',
      zhWishAndBenefit: '愿汝本具之清净佛心如莲绽放，慈悲智慧圆满增长。',
      buddhaWish: 'He wishes for every child to know they have a bright "Buddha Heart" inside them full of kindness and wisdom.',
      zhBuddhaWish: '愿一切有情皆识自心本具慈悲与智慧之光明佛性。',
      bowBenefit: 'Bowing to Sakyamuni Buddha awakens your inner kindness, wisdom, and greatest blessings!',
      zhBowBenefit: '礼拜释迦牟尼佛，唤醒内心慈悲智慧，获无上殊胜加持！'
    }
  ],

  // Collectible Virtue & 7-Buddha Sticker Passport
  STICKER_BADGES: [
    {
      id: 'filial_star',
      emoji: '🏡',
      title: 'Filial Home Star',
      zhTitle: '孝亲好儿女徽章',
      desc: 'Completed all 4 tasks for Mother & Father at home!',
      zhDesc: '完成山顶家园孝亲四项善行！',
      checkUnlocked: (st) =>
        st.completedDeeds &&
        st.completedDeeds['clean_house'] &&
        st.completedDeeds['care_parents'] &&
        st.completedDeeds['cook_parents'] &&
        st.completedDeeds['bye_parents']
    },
    {
      id: 'animal_hero',
      emoji: '🦌',
      title: 'Forest Animal Hero',
      zhTitle: '护生护林小英雄',
      desc: 'Rescued the trapped deer and saved the fox from the hunter!',
      zhDesc: '救出受困梅花鹿并劝止猎人护生！',
      checkUnlocked: (st) =>
        st.completedDeeds && st.completedDeeds['save_animals'] && st.completedDeeds['stop_hunter']
    },
    {
      id: 'stupa_pilgrim',
      emoji: '☸️',
      title: 'White Stupa Pilgrim',
      zhTitle: '白塔顺绕功德章',
      desc: 'Walked clockwise around the White Stupa!',
      zhDesc: '顺时针虔诚绕行白塔功德圆满！',
      checkUnlocked: (st) => (st.stupaLaps || 0) >= 1
    },
    {
      id: 'seven_buddhas_bowed',
      emoji: '🙏',
      title: '7-Buddha Bow Pilgrim',
      zhTitle: '七佛礼拜圆满章',
      desc: 'Bowed to all 7 Buddhas and acknowledged their Wishes & Benefits!',
      zhDesc: '圆满礼敬过去七佛并领受佛愿功德！',
      checkUnlocked: (st) => st.bowedBuddhas && Object.keys(st.bowedBuddhas).length >= 7
    },
    {
      id: 'triple_offering',
      emoji: '🪔',
      title: 'Bodhi Offering Master',
      zhTitle: '水花香三供圆满章',
      desc: 'Offered Golden Water Cups, Lotus Flowers, and Celadon Incense!',
      zhDesc: '圆满供养净水、妙莲华与清净檀香！',
      checkUnlocked: (st) =>
        st.offeringsMade && st.offeringsMade.water && st.offeringsMade.flower && st.offeringsMade.scent
    },
    {
      id: 'quiz_master',
      emoji: '🧠',
      title: '7-Buddha Quiz Master',
      zhTitle: '七佛智慧通达章',
      desc: 'Passed the 7-Buddha Wisdom Quiz Challenge!',
      zhDesc: '顺利通过七佛智慧问答挑战！',
      checkUnlocked: (st) => !!st.quizMasterUnlocked
    }
  ],

  OFFERINGS: [
    {
      id: 'water',
      name: 'Offer Pure Water',
      cnName: '供清净水',
      emoji: '💧',
      instruction: 'Place 7 clear water cups before the Buddhas.',
      zhInstruction: '于佛前敬献七杯澄澈净水。',
      benefit: 'Pure & calm mind',
      zhBenefit: '心得清净安宁',
      meaning: 'Pure & calm mind',
      toast: '💧 Benefit: Pure & calm mind (+10 VP)',
      zhToast: '💧 功德利益：心得清净安宁 (+10 功德)'
    },
    {
      id: 'flower',
      name: 'Offer Lotus Flowers',
      cnName: '供妙莲花',
      emoji: '🪷',
      instruction: 'Place lotus flowers before the Buddhas.',
      zhInstruction: '于佛前敬献庄严妙莲花。',
      benefit: 'Gentle beauty & joy',
      zhBenefit: '容颜祥和欢喜',
      meaning: 'Gentle beauty & joy',
      toast: '🪷 Benefit: Gentle beauty & joy (+10 VP)',
      zhToast: '🪷 功德利益：容颜祥和欢喜 (+10 功德)'
    },
    {
      id: 'scent',
      name: 'Offer Sacred Scent',
      cnName: '供清净檀香',
      emoji: '🪔',
      instruction: 'Light sandalwood incense before the Buddhas.',
      zhInstruction: '于佛前燃起清净戒定真香。',
      benefit: 'Kindness & good virtue',
      zhBenefit: '戒香德馨远播',
      meaning: 'Kindness & good virtue',
      toast: '🪔 Benefit: Kindness & good virtue (+10 VP)',
      zhToast: '🪔 功德利益：戒香德馨远播 (+10 功德)'
    }
  ],

  PERSONAL_SPACE_ITEMS: [
    { id: 'house', name: 'Peaceful Retreat House', zhName: '静修小屋', desc: 'A cozy wooden sanctuary cottage in your personal space.', zhDesc: '在个人空间建造温馨清净的木屋小筑。', emoji: '🏡', cost: 2 },
    { id: 'food', name: 'Pure Vegetarian Food', zhName: '素食斋饭', desc: 'Warm golden rice, pure vegetarian dishes, and fresh fruit.', zhDesc: '供养与享用的香米素斋与鲜果佳肴。', emoji: '🍚', cost: 2 },
    { id: 'seed', name: 'Sacred Seed to Plant', zhName: '菩提莲花良种', desc: 'Plant sacred seeds that sprout into a flourishing garden.', zhDesc: '在个人空间播下善根良种，生根发芽。', emoji: '🌱', cost: 2 },
    { id: 'flower', name: 'Sacred Offering Flower', zhName: '供佛鲜花', desc: 'Blooming lotus and celestial flowers for your space.', zhDesc: '庄严芳香的供佛莲花与四季花丛。', emoji: '🪷', cost: 2 },
    { id: 'water', name: 'Pure Offering Water', zhName: '清净供水', desc: 'Seven golden bowls of pure, cool offering water.', zhDesc: '清凉澄净的七杯八功德供水。', emoji: '💧', cost: 2 },
    { id: 'incense', name: 'Fragrant Temple Incense', zhName: '清净妙香', desc: 'Peaceful sandalwood and lotus incense with gentle smoke.', zhDesc: '袅袅升起清净檀香的宝鼎香炉。', emoji: '🪔', cost: 2 }
  ],

  // 7 Tibetan White Stupas (佛塔) ascending the Mount Wutai Path toward 文殊殿
  WENSHU_STUPAS: [
    {
      index: 0,
      name: '#1 · 1st White Stupa (Compassion)',
      zhName: '#1 · 第一尊白塔（慈悲塔）',
      label: '#1 · 1st White Stupa (Compassion)',
      zhLabel: '#1 · 第一尊白塔（慈悲塔）',
      x: 40.0,
      z: 15.0,
      scale: 0.42,
      wishAndBenefit: 'May your heart be filled with kindness and gentle peace.',
      zhWishAndBenefit: '愿汝心中充满慈悲柔顺与温和安宁。'
    },
    {
      index: 1,
      name: '#2 · 2nd White Stupa (Purity)',
      zhName: '#2 · 第二尊白塔（清净塔）',
      label: '#2 · 2nd White Stupa (Purity)',
      zhLabel: '#2 · 第二尊白塔（清净塔）',
      x: 51.0,
      z: -7.0,
      scale: 0.42,
      wishAndBenefit: 'Clears away worries and brings a pure, calm mind.',
      zhWishAndBenefit: '涤除烦恼杂念，成就清净平定之心。'
    },
    {
      index: 2,
      name: '#3 · 3rd White Stupa (Blessing & Wisdom)',
      zhName: '#3 · 第三尊白塔（福慧塔）',
      label: '#3 · 3rd White Stupa (Blessing & Wisdom)',
      zhLabel: '#3 · 第三尊白塔（福慧塔）',
      x: 62.0,
      z: 15.0,
      scale: 0.42,
      wishAndBenefit: 'Brings good health, joy, and love for learning.',
      zhWishAndBenefit: '赐予健康快乐与欢喜向学之智慧。'
    },
    {
      index: 3,
      name: '#4 · 4th White Stupa (Diligence)',
      zhName: '#4 · 第四尊白塔（精进塔）',
      label: '#4 · 4th White Stupa (Diligence)',
      zhLabel: '#4 · 第四尊白塔（精进塔）',
      x: 73.0,
      z: -7.0,
      scale: 0.42,
      wishAndBenefit: 'Gives you steady courage and cheerful focus every day.',
      zhWishAndBenefit: '令汝每日具足稳健勇气与欢喜专注力。'
    },
    {
      index: 4,
      name: '#5 · 5th White Stupa (Meditation)',
      zhName: '#5 · 第五尊白塔（禅定塔）',
      label: '#5 · 5th White Stupa (Meditation)',
      zhLabel: '#5 · 第五尊白塔（禅定塔）',
      x: 84.0,
      z: 15.0,
      scale: 0.42,
      wishAndBenefit: 'Helps you stay peaceful, patient, and free from anger.',
      zhWishAndBenefit: '助你安住平静、学会忍辱、远离嗔怒。'
    },
    {
      index: 5,
      name: '#6 · 6th White Stupa (Perfection)',
      zhName: '#6 · 第六尊白塔（圆满塔）',
      label: '#6 · 6th White Stupa (Perfection)',
      zhLabel: '#6 · 第六尊白塔（圆满塔）',
      x: 95.0,
      z: -7.0,
      scale: 0.42,
      wishAndBenefit: 'Fills your family and friends with harmony and blessings.',
      zhWishAndBenefit: '令亲友阖家和睦安乐，福泽绵长。'
    },
    {
      index: 6,
      name: '#7 · 7th White Stupa (Manjushri Wisdom)',
      zhName: '#7 · 第七尊白塔（文殊智塔）',
      label: '#7 · 7th White Stupa (Manjushri Wisdom)',
      zhLabel: '#7 · 第七尊白塔（文殊智塔）',
      x: 106.0,
      z: 15.0,
      scale: 0.42,
      wishAndBenefit: 'Awakens bright wisdom and opens the golden doors of Manjushri Hall!',
      zhWishAndBenefit: '开启光明大智，推开五台山文殊殿金色大门！'
    }
  ],

  // TWO STUDY TABLES ON THE WAY TO MOUNT WUTAI 文殊殿 (CONCISE 1-PARAGRAPH KID-FRIENDLY LESSONS)
  SUTRA_BOOKS: [
    {
      id: 'sutra_1',
      stationName: 'Study Table 1 · Empathy & Caring for Animals',
      zhStationName: '第一学习桌 · 学会换位思考，善待生命与弱小',
      subtitle: 'Study Table 1 · The Little Fox’s Only Coat',
      zhSubtitle: '第一学习桌 · 小狐狸《唯一的衣服》',
      bookTitle: 'Empathy & Caring for All Living Beings',
      zhBookTitle: '学会换位思考，善待生命与弱小',
      title: '1. Empathy & Kindness to Animals',
      zhTitle: '1. 学会换位思考，善待生命与弱小',
      x: 52.0,
      z: 10.8,
      rotY: 0.18,
      pages: [
        '🦊 Empathy & Kindness to Animals: A little fox has only one fur coat for its whole life and loses its life if it is taken away, while we already have closets full of clothes and plenty of healthy vegetables. Let us put ourselves in animals’ shoes and truly care for every living being!'
      ],
      zhPages: [
        '🦊 学会换位思考，善待生命与弱小：小狐狸一辈子只有一件美丽的毛皮衣裳，脱下就会失去生命；而我们衣橱满满、不穿皮毛也有暖衣，不吃动物肉也有丰富蔬果。让我们从自己做起，真心关爱所有的动物与小生命！'
      ]
    },
    {
      id: 'sutra_2',
      stationName: 'Study Table 2 · Respect Friends & No Nicknames',
      zhStationName: '第二学习桌 · 懂得尊重同伴，切莫随便给人“取外号”',
      subtitle: 'Study Table 2 · The Power of Kind Speech',
      zhSubtitle: '第二学习桌 · 语言的力量与真诚尊重',
      bookTitle: 'Respect Friends — Never Give Mean Nicknames',
      zhBookTitle: '懂得尊重同伴，切莫随便给人“取外号”',
      title: '2. Respect Friends & No Nicknames',
      zhTitle: '2. 尊重同伴，莫乱取外号',
      x: 82.0,
      z: -2.8,
      rotY: -0.18,
      pages: [
        '💬 Respect Friends & Never Give Mean Nicknames: Words have real power—one teasing remark can hurt a friend for a long time and bring bad results back to us. Always speak gently and warmly, appreciate your friends’ strengths, and never give unkind nicknames!'
      ],
      zhPages: [
        '💬 懂得尊重同伴，切莫随便给人“取外号”：语言是有力量的，一句嘲弄的话会让别人难过很久，也会给自己带来不好的后果；平时说话要学会温和友善，真诚欣赏同伴的长处，绝不随便给人起绰号！'
      ]
    }
  ],

  // 千佛殿 · 35 BUDDHAS REGISTRY (#1..#7 Linked to 7 Buddhas in Prayer Hall; #8..#35 Ready for Expansion)
  THIRTY_FIVE_BUDDHAS: [
    { index: 0, linkedSevenBuddhaIdx: 0, name: 'Vipassi Buddha', cnName: '毗婆尸佛' },
    { index: 1, linkedSevenBuddhaIdx: 1, name: 'Sikhi Buddha', cnName: '尸弃佛' },
    { index: 2, linkedSevenBuddhaIdx: 2, name: 'Vessabhu Buddha', cnName: '毗舍浮佛' },
    { index: 3, linkedSevenBuddhaIdx: 3, name: 'Kakusandha Buddha', cnName: '拘留孙佛' },
    { index: 4, linkedSevenBuddhaIdx: 4, name: 'Konagamana Buddha', cnName: '拘那含牟尼佛' },
    { index: 5, linkedSevenBuddhaIdx: 5, name: 'Kassapa Buddha', cnName: '迦叶佛' },
    { index: 6, linkedSevenBuddhaIdx: 6, name: 'Sakyamuni Buddha', cnName: '释迦牟尼佛' },
    { index: 7, linkedSevenBuddhaIdx: null, linkedKey: 'changshou', name: 'Amitayus (Longevity Buddha)', cnName: '长寿佛（无量寿佛）' },
    { index: 8, linkedSevenBuddhaIdx: null, name: 'Ratnarcis Buddha', cnName: '宝光佛' },
    { index: 9, linkedSevenBuddhaIdx: null, name: 'Nagesvararaja Buddha', cnName: '龙尊王佛' },
    { index: 10, linkedSevenBuddhaIdx: null, name: 'Virasena Buddha', cnName: '精进军佛' },
    { index: 11, linkedSevenBuddhaIdx: null, name: 'Viranandin Buddha', cnName: '精进喜佛' },
    { index: 12, linkedSevenBuddhaIdx: null, name: 'Ratnagni Buddha', cnName: '宝火佛' },
    { index: 13, linkedSevenBuddhaIdx: null, name: 'Ratnacandraprabha Buddha', cnName: '宝月光佛' },
    { index: 14, linkedSevenBuddhaIdx: null, name: 'Amoghadarsin Buddha', cnName: '现无愚佛' },
    { index: 15, linkedSevenBuddhaIdx: null, name: 'Ratnacandra Buddha', cnName: '宝月佛' },
    { index: 16, linkedSevenBuddhaIdx: null, name: 'Vimala Buddha', cnName: '无垢佛' },
    { index: 17, linkedSevenBuddhaIdx: null, name: 'Suradatta Buddha', cnName: '离垢佛' },
    { index: 18, linkedSevenBuddhaIdx: null, name: 'Brahman Buddha', cnName: '勇施佛' },
    { index: 19, linkedSevenBuddhaIdx: null, name: 'Brahmadatta Buddha', cnName: '清净佛' },
    { index: 20, linkedSevenBuddhaIdx: null, name: 'Varuna Buddha', cnName: '清净施佛' },
    { index: 21, linkedSevenBuddhaIdx: null, name: 'Varunadeva Buddha', cnName: '娑留那佛' },
    { index: 22, linkedSevenBuddhaIdx: null, name: 'Bhadrasri Buddha', cnName: '水天佛' },
    { index: 23, linkedSevenBuddhaIdx: null, name: 'Candanasri Buddha', cnName: '坚德佛' },
    { index: 24, linkedSevenBuddhaIdx: null, name: 'Anantatejas Buddha', cnName: '无量掬光佛' },
    { index: 25, linkedSevenBuddhaIdx: null, name: 'Prabhasasri Buddha', cnName: '光德佛' },
    { index: 26, linkedSevenBuddhaIdx: null, name: 'Asokasri Buddha', cnName: '无忧德佛' },
    { index: 27, linkedSevenBuddhaIdx: null, name: 'Narayana Buddha', cnName: '那罗延佛' },
    { index: 28, linkedSevenBuddhaIdx: null, name: 'Kusumasri Buddha', cnName: '功德华佛' },
    { index: 29, linkedSevenBuddhaIdx: null, name: 'Padmajyotir Buddha', cnName: '莲华光神通佛' },
    { index: 30, linkedSevenBuddhaIdx: null, name: 'Dhanasri Buddha', cnName: '财功德佛' },
    { index: 31, linkedSevenBuddhaIdx: null, name: 'Smrtisri Buddha', cnName: '德念佛' },
    { index: 32, linkedSevenBuddhaIdx: null, name: 'Suparikirtita Buddha', cnName: '善名称功德佛' },
    { index: 33, linkedSevenBuddhaIdx: null, name: 'Indraketudhvaja Buddha', cnName: '红焰帝幢王佛' },
    { index: 34, linkedSevenBuddhaIdx: null, name: 'Amitabha Buddha', cnName: '阿弥陀佛' }
  ],

  // 千佛殿 · 8 GREAT BODHISATTVAS REGISTRY (#1 Manjushri Linked to 文殊殿; #2..#8 Ready for Expansion)
  EIGHT_BODHISATTVAS: [
    { index: 0, linkedKey: 'manjushri', emoji: '🦁', name: 'Manjushri Bodhisattva', cnName: '文殊菩萨', desc: 'Great Wisdom (文殊殿)', zhDesc: '大智文殊师利 · 五台山文殊殿' },
    { index: 1, linkedKey: null, emoji: '🪷', name: 'Avalokiteshvara', cnName: '观世音菩萨', desc: 'Great Compassion (Future Hall)', zhDesc: '大悲观世音 · 后续殿堂开放' },
    { index: 2, linkedKey: null, emoji: '🐘', name: 'Samantabhadra', cnName: '普贤菩萨', desc: 'Great Practice (Future Hall)', zhDesc: '大行普贤王 · 后续殿堂开放' },
    { index: 3, linkedKey: null, emoji: '🏮', name: 'Ksitigarbha', cnName: '地藏王菩萨', desc: 'Great Vows (Future Hall)', zhDesc: '大愿地藏王 · 后续殿堂开放' },
    { index: 4, linkedKey: null, emoji: '😊', name: 'Maitreya Bodhisattva', cnName: '弥勒菩萨', desc: 'Loving Joy (Future Hall)', zhDesc: '大慈欢喜尊 · 后续殿堂开放' },
    { index: 5, linkedKey: null, emoji: '✨', name: 'Mahasthamaprapta', cnName: '大势至菩萨', desc: 'Wisdom Light (Future Hall)', zhDesc: '无边光智慧 · 后续殿堂开放' },
    { index: 6, linkedKey: null, emoji: '🌟', name: 'Akasagarbha', cnName: '虚空藏菩萨', desc: 'Treasury of Merit (Future Hall)', zhDesc: '无尽福智藏 · 后续殿堂开放' },
    { index: 7, linkedKey: null, emoji: '🕊️', name: 'Sarvanivarana', cnName: '除盖障菩萨', desc: 'Clearing Obstacles (Future Hall)', zhDesc: '清净除一切障 · 后续殿堂开放' }
  ],

  MANJUSHRI_DATA: {
    name: 'Manjushri Bodhisattva',
    cnName: '文殊菩萨',
    title: 'Bodhisattva of Great Wisdom',
    zhTitle: '大智文殊师利菩萨',
    wishAndBenefit: 'Wishing every child a bright, curious mind and clear wisdom to learn joyfully and help all beings.',
    zhWishAndBenefit: '愿一切行者皆具清净大智慧，欢喜修学正法，广利十方众生。',
    mantraName: 'Manjushri Mantra (文殊心咒)',
    zhMantraName: '文殊心咒（大智文殊菩萨心咒）',
    sanskritRoman: 'Om A Ra Pa Ca Na Dhih',
    zhPhonetic: '嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）',
    mantraText: 'Om A Ra Pa Ca Na Dhih — 嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）',
    zhMantraText: '梵文罗马拼音：Om A Ra Pa Ca Na Dhih · 汉字谐音：嗡 阿 喇 巴 札 那 谛（ōng ā rā bā zhá nà dì）',
    pos: { x: 129.4, z: 4.0 }
  },

  // PUBLIC TEMPLE WEST MOUNTAIN PATH TO 七佛殿: 4 PLANTABLE SACRED LOTUS FLOWER PONDS (+5 VP EACH)
  QIFO_LOTUS_PONDS: [
    {
      id: 'qifo_pond_1',
      x: -32.0,
      z: -3.4,
      pos: { x: -32.0, z: -3.4 },
      flowerType: 'utpala',
      img: 'assets/flower_1_utpala.jpg',
      lotusColor: 0x7c5cff,
      name: '1. Utpala Blue-Violet Lotus (优钵罗花)',
      zhName: '第一花池 · 优钵罗花',
      title: 'Pond 1 · Utpala (优钵罗花)',
      zhTitle: '第一花池 · 优钵罗花',
      desc: 'Plant sacred Utpala (优钵罗花) along the path to 7-Buddha Hall (+5 VP).',
      zhDesc: '于七佛殿前第一花池栽种「优钵罗花」（紫蓝星瓣青莲），清净庄严、智慧明澈（+5 功德）。',
      benefit: 'Planting Utpala flowers (优钵罗花) awakens serene clarity and boundless wisdom!',
      zhBenefit: '于第一花池种下「优钵罗花」，感得内心澄明清凉、福慧增长！'
    },
    {
      id: 'qifo_pond_2',
      x: -44.0,
      z: -3.4,
      pos: { x: -44.0, z: -3.4 },
      flowerType: 'padma',
      img: 'assets/flower_2_padma.jpg',
      lotusColor: 0xd9f07a,
      name: '2. Padma Golden-Green Lotus (波头摩)',
      zhName: '第二花池 · 波头摩',
      title: 'Pond 2 · Padma (波头摩)',
      zhTitle: '第二花池 · 波头摩',
      desc: 'Plant sacred Padma (波头摩) along the path to 7-Buddha Hall (+5 VP).',
      zhDesc: '于七佛殿前第二花池栽种「波头摩」（翠黄杯状圆瓣妙莲），吉祥瑞应、身心安康（+5 功德）。',
      benefit: 'Planting Padma lotuses (波头摩) brings radiant vitality, health, and harmonious peace!',
      zhBenefit: '于第二花池种下「波头摩」，祈愿家人身体健康、万事吉祥安康！'
    },
    {
      id: 'qifo_pond_3',
      x: -56.0,
      z: -3.4,
      pos: { x: -56.0, z: -3.4 },
      flowerType: 'pundarika',
      img: 'assets/flower_3_pundarika.jpg',
      lotusColor: 0xffffff,
      name: '3. Pundarika White Lotus (分陀利花)',
      zhName: '第三花池 · 分陀利花',
      title: 'Pond 3 · Pundarika (分陀利花)',
      zhTitle: '第三花池 · 分陀利花',
      desc: 'Plant sacred Pundarika (分陀利花) along the path to 7-Buddha Hall (+5 VP).',
      zhDesc: '于七佛殿前第三花池栽种「分陀利花」（纯白盛开百叶白莲），心地清净、远离灾障（+5 功德）。',
      benefit: 'Planting Pundarika white lotuses (分陀利花) purifies the heart and brings stainless peace!',
      zhBenefit: '于第三花池种下「分陀利花」，心净如百叶白莲，吉祥和平、福泽绵长！'
    },
    {
      id: 'qifo_pond_4',
      x: -68.0,
      z: -3.4,
      pos: { x: -68.0, z: -3.4 },
      flowerType: 'kumuda',
      img: 'assets/flower_4_kumuda.jpg',
      lotusColor: 0xf472b6,
      name: '4. Kumuda Rose-Pink Lotus (拘物头花)',
      zhName: '第四花池 · 拘物头花',
      title: 'Pond 4 · Kumuda (拘物头花)',
      zhTitle: '第四花池 · 拘物头花',
      desc: 'Plant sacred Kumuda (拘物头花) along the path to 7-Buddha Hall (+5 VP).',
      zhDesc: '于七佛殿前第四花池栽种「拘物头花」（娇艳粉红重瓣妙莲），慈悲喜悦、善缘圆满（+5 功德）。',
      benefit: 'Planting Kumuda rose-pink lotuses (拘物头花) fills your path to the Seven Buddhas with joy!',
      zhBenefit: '于第四花池种下「拘物头花」，满池芬芳生喜悦，七佛殿前善愿圆满！'
    }
  ],

  // LONGEVITY SANCTUARY MAP (Stop #1): 3 PLANTABLE FLOWER GARDENS ALONG THE PATH TO 长寿殿
  CHANGSHOU_FLOWER_GARDENS: [
    {
      id: 'flower_garden_1',
      x: -16.0,
      z: 9.2,
      pos: { x: -16.0, z: 9.2 },
      name: '1. Auspicious Peony Garden',
      zhName: '1. 牡丹吉祥花圃',
      title: '1. Auspicious Peony Garden',
      zhTitle: '1. 牡丹吉祥花圃',
      desc: 'Plant auspicious peonies along the path to Longevity Hall (+5 VP).',
      zhDesc: '在前往长寿殿的百花善园种下吉祥牡丹，愿行者心生欢喜（+5 功德）。',
      benefit: 'Planting peonies brings warmth, kindness, and joyful blessings to all travelers.',
      zhBenefit: '种下吉祥牡丹，愿往来行者皆得欢喜与温暖善缘。'
    },
    {
      id: 'flower_garden_2',
      x: -29.0,
      z: 9.2,
      pos: { x: -29.0, z: 9.2 },
      name: '2. Golden Marigold & Orchid Garden',
      zhName: '2. 金盏兰香花圃',
      title: '2. Golden Marigold & Orchid Garden',
      zhTitle: '2. 金盏兰香花圃',
      desc: 'Plant golden marigolds and fragrant orchids to nourish patience and kindness (+5 VP).',
      zhDesc: '种下金盏花与幽兰，涵养柔和耐心与清净心香（+5 功德）。',
      benefit: 'Planting golden marigolds and orchids cultivates patience and a gentle, fragrant heart.',
      zhBenefit: '种下金盏与兰花，涵养温和耐心、心香清净。'
    },
    {
      id: 'flower_garden_3',
      x: -42.0,
      z: 9.2,
      pos: { x: -42.0, z: 9.2 },
      name: '3. Seven-Gem Heavenly Flower Garden',
      zhName: '3. 七宝天华花圃',
      title: '3. Seven-Gem Heavenly Flower Garden',
      zhTitle: '3. 七宝天华花圃',
      desc: 'Plant seven-gem blossoms to adorn the summit approach to Longevity Hall (+5 VP).',
      zhDesc: '种下七宝妙华，庄严长寿殿胜境道场（+5 功德）。',
      benefit: 'Planting seven-gem blossoms adorns the path to Longevity Hall with pure vitality!',
      zhBenefit: '种下七宝妙华，庄严长寿佛道场，身心充满生机与安康！'
    }
  ],

  // LONGEVITY SANCTUARY MAP (Stop #1): 4 SACRED FLOWER PONDS ALONG THE PATH TO 长寿殿
  // In order: 优钵罗花 (Utpala), 波头摩 (Padma), 分陀利花 (Pundarika), 拘物头花 (Kumuda)
  CHANGSHOU_LOTUS_PONDS: [
    {
      id: 'lotus_pond_1',
      x: -14.0,
      z: -3.6,
      pos: { x: -14.0, z: -3.6 },
      flowerType: 'utpala',
      img: 'assets/flower_1_utpala.jpg',
      lotusColor: 0x7c5cff,
      name: '1. Utpala Blue-Violet Lotus (优钵罗花)',
      zhName: '第一花池 · 优钵罗花',
      title: 'Pond 1 · Utpala (优钵罗花)',
      zhTitle: '第一花池 · 优钵罗花',
      desc: 'Plant sacred Utpala (优钵罗花) — vibrant blue-violet star water lilies with golden hearts (+5 VP).',
      zhDesc: '于第一花池栽种「优钵罗花」（紫蓝星瓣青莲、金蕊紫尖），清净庄严、智慧明澈（+5 功德）。',
      benefit: 'Planting Utpala flowers (优钵罗花) awakens serene clarity and boundless wisdom.',
      zhBenefit: '于第一花池种下「优钵罗花」，感得内心澄明清凉、福慧增长！'
    },
    {
      id: 'lotus_pond_2',
      x: -24.5,
      z: -3.6,
      pos: { x: -24.5, z: -3.6 },
      flowerType: 'padma',
      img: 'assets/flower_2_padma.jpg',
      lotusColor: 0xd9f07a,
      name: '2. Padma Golden-Green Lotus (波头摩)',
      zhName: '第二花池 · 波头摩',
      title: 'Pond 2 · Padma (波头摩)',
      zhTitle: '第二花池 · 波头摩',
      desc: 'Plant sacred Padma (波头摩) — creamy yellow-green cupped lotuses with golden seed pods (+5 VP).',
      zhDesc: '于第二花池栽种「波头摩」（翠黄杯状圆瓣、金黄红点莲蓬），吉祥瑞应、身心安康（+5 功德）。',
      benefit: 'Planting Padma lotuses (波头摩) brings radiant vitality, health, and harmonious peace.',
      zhBenefit: '于第二花池种下「波头摩」，祈愿家人身体健康、万事吉祥安康！'
    },
    {
      id: 'lotus_pond_3',
      x: -35.0,
      z: -3.6,
      pos: { x: -35.0, z: -3.6 },
      flowerType: 'pundarika',
      img: 'assets/flower_3_pundarika.jpg',
      lotusColor: 0xffffff,
      name: '3. Pundarika White Lotus (分陀利花)',
      zhName: '第三花池 · 分陀利花',
      title: 'Pond 3 · Pundarika (分陀利花)',
      zhTitle: '第三花池 · 分陀利花',
      desc: 'Plant sacred Pundarika (分陀利花) — pure snow-white wide-open lotuses with green pods (+5 VP).',
      zhDesc: '于第三花池栽种「分陀利花」（纯白盛开百叶白莲、翠绿莲蓬金蕊），心地清净、远离灾障（+5 功德）。',
      benefit: 'Planting Pundarika white lotuses (分陀利花) purifies the heart and brings stainless peace.',
      zhBenefit: '于第三花池种下「分陀利花」，心净如百叶白莲，吉祥和平、福泽绵长！'
    },
    {
      id: 'lotus_pond_4',
      x: -45.5,
      z: -3.6,
      pos: { x: -45.5, z: -3.6 },
      flowerType: 'kumuda',
      img: 'assets/flower_4_kumuda.jpg',
      lotusColor: 0xf472b6,
      name: '4. Kumuda Rose-Pink Lotus (拘物头花)',
      zhName: '第四花池 · 拘物头花',
      title: 'Pond 4 · Kumuda (拘物头花)',
      zhTitle: '第四花池 · 拘物头花',
      desc: 'Plant sacred Kumuda (拘物头花) — rose-pink layered lotuses with golden hearts (+5 VP).',
      zhDesc: '于第四花池栽种「拘物头花」（娇艳粉红重瓣妙莲、明黄莲蓬），慈悲喜悦、善缘圆满（+5 功德）。',
      benefit: 'Planting Kumuda rose-pink lotuses (拘物头花) fills your path with loving-kindness and joy!',
      zhBenefit: '于第四花池种下「拘物头花」，满池芬芳生喜悦，长寿佛前福寿圆满！'
    }
  ],

  // STOP #1 SANCTUARY MAP: 长寿殿 (LONGEVITY HALL) & 长寿佛 (AMITAYUS BUDDHA)
  CHANGSHOU_DATA: {
    name: 'Amitayus · Longevity Buddha',
    cnName: '长寿佛（无量寿智如来）',
    title: 'Buddha of Infinite Life & Boundless Light',
    zhTitle: '无量寿智如来 · 吉祥长寿佛',
    wishAndBenefit: 'May spiritual teachers live long in the world, family members enjoy good health, world peace prevail, blessings and wisdom grow, severe illnesses and disasters cease, infectious diseases never harm us, and accidental loss of life be avoided.',
    zhWishAndBenefit: '善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。',
    mantraName: 'Longevity Buddha Mantra (长寿佛心咒)',
    zhMantraName: '长寿佛心咒',
    mantraText: '嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈',
    zhMantraText: '嗡格热阿耶色德吽舍 阿玛ra呢则万德耶索哈',
    mantraBenefit: 'May spiritual teachers live long in the world, family members enjoy good health, world peace prevail, blessings and wisdom grow, severe illnesses and disasters cease, infectious diseases never harm us, and accidental loss of life be avoided.',
    zhMantraBenefit: '善知识长久住世，家人身体健康，世界和平，福慧增上，息除恶疾，病灾，不受传染病侵害，避免意外身亡。',
    pos: { x: -71.4, y: 16.92, z: 4.0 }
  },

  PRAYER_SKILLS: {
    amitofo: {
      id: 'amitofo',
      emoji: '🪷',
      name: 'Nanmo Amitofo',
      zhName: '南无阿弥陀佛',
      sanskritRoman: 'Nanmo Amitofo',
      zhPhonetic: '南 无 阿 弥 陀 佛（nā mó ā mí tuó fó）',
      spokenZh: '南无阿弥陀佛',
      spokenEn: 'Nan mo, Ah mee to fo'
    },
    om_mani: {
      id: 'om_mani',
      emoji: '🤍',
      name: 'Om Mani Padme Hum (六字大明咒)',
      zhName: '六字大明咒 · 嗡嘛呢呗美吽',
      sanskritRoman: 'Om Mani Padme Hum',
      zhPhonetic: '嗡 嘛 呢 呗 美 吽（ōng mā ní bēi měi hōng）',
      spokenZh: '嗡 嘛 呢 呗 美 吽',
      spokenEn: 'Om, Ma ni, Pad me, Hum',
      vpReward: 10
    }
  },

  // 10-STOP BUDDHA DISCOVERY TASK MAP (Stop #1 = 长寿殿 Map; Stops #2-#10 reserved for future development)
  TASK_MAP_STOPS: [
    {
      index: 1,
      id: 'changshou_map',
      sceneId: 'changshou_map',
      locked: false,
      reqVP: 0,
      reqLP: 3,
      reqMainMapBowedAll: true,
      emoji: '🏺',
      shortName: 'Longevity Hall',
      zhShortName: '长寿殿',
      name: 'Stop 1 · Longevity Sanctuary Map (长寿殿)',
      zhName: '第 1 站 · 长寿佛圣境（长寿殿）',
      buddhaName: 'Amitayus · Longevity Buddha',
      zhBuddhaName: '无量寿智如来 · 长寿佛',
      desc: 'Unlock by earning ≥ 3 Liberation Points and bowing to all 11 Buddhas & Bodhisattvas in the Main Map!',
      zhDesc: '达成 ≥ 3 解脱功德，并礼拜主地图全部 11 尊佛菩萨（西方三圣·七佛·文殊菩萨）即可开启长寿殿新地图！'
    },
    {
      index: 2,
      id: 'stop_2',
      locked: true,
      reqVP: 100,
      reqLP: 20,
      emoji: '💊',
      shortName: 'Medicine',
      zhShortName: '药师佛',
      name: 'Stop 2 · Eastern Lapis Lazuli Pure Land',
      zhName: '第 2 站 · 东方净琉璃药师苑',
      buddhaName: 'Medicine Buddha (Bhaisajyaguru)',
      zhBuddhaName: '药师琉璃光如来',
      desc: 'Seek the healing azure light and twelve great vows of Medicine Buddha.',
      zhDesc: '寻访东方药师琉璃光如来，学习十二大愿、身心安康之道。'
    },
    {
      index: 3,
      id: 'stop_3',
      locked: true,
      reqVP: 150,
      reqLP: 30,
      emoji: '🌙',
      shortName: 'Guanyin',
      zhShortName: '观音菩萨',
      name: 'Stop 3 · Moonlight Compassion Grove',
      zhName: '第 3 站 · 大悲月光观音林',
      buddhaName: 'Avalokitesvara Bodhisattva',
      zhBuddhaName: '大慈大悲观世音菩萨',
      desc: 'Listen to the gentle sounds of the world and cultivate great compassion.',
      zhDesc: '寻访观世音菩萨清凉林苑，修习耳根圆通与大悲救苦行愿。'
    },
    {
      index: 4,
      id: 'stop_4',
      locked: true,
      reqVP: 200,
      reqLP: 40,
      emoji: '🐘',
      shortName: 'Samantabhadra',
      zhShortName: '普贤菩萨',
      name: 'Stop 4 · Mount Emei Ten-Vows Peak',
      zhName: '第 4 站 · 峨眉十大愿王普贤峰',
      buddhaName: 'Samantabhadra Bodhisattva',
      zhBuddhaName: '大行普贤菩萨',
      desc: 'Walk the path of Ten Great Vows and put kindness into action every day.',
      zhDesc: '登临银色世界，寻访大行普贤菩萨，修学礼敬、称赞、广修供养十大愿王。'
    },
    {
      index: 5,
      id: 'stop_5',
      locked: true,
      reqVP: 260,
      reqLP: 55,
      emoji: '🏮',
      shortName: 'Ksitigarbha',
      zhShortName: '地藏菩萨',
      name: 'Stop 5 · Nine-Flowers Great Vow Valley',
      zhName: '第 5 站 · 九华大愿地藏谷',
      buddhaName: 'Ksitigarbha Bodhisattva',
      zhBuddhaName: '大愿地藏王菩萨',
      desc: 'Honor filial piety and steadfast vows to help all beings find peace.',
      zhDesc: '寻访九华地藏王菩萨，学习孝亲报恩与坚固不动之菩提大愿。'
    },
    {
      index: 6,
      id: 'stop_6',
      locked: true,
      reqVP: 320,
      reqLP: 70,
      emoji: '☀️',
      shortName: 'Vairocana',
      zhShortName: '毗卢遮那佛',
      name: 'Stop 6 · Radiant Sunlight Treasury Hall',
      zhName: '第 6 站 · 无尽光明大日宝殿',
      buddhaName: 'Vairocana Buddha',
      zhBuddhaName: '毗卢遮那佛（大日如来）',
      desc: 'Realize universal illumination where every heart shines without shadow.',
      zhDesc: '寻访清净法身毗卢遮那佛，照破无明暗蔽，圆满法界光明。'
    },
    {
      index: 7,
      id: 'stop_7',
      locked: true,
      reqVP: 380,
      reqLP: 85,
      emoji: '💎',
      shortName: 'Aksobhya',
      zhShortName: '不动如来',
      name: 'Stop 7 · Unshakable Vajra Peak',
      zhName: '第 7 站 · 金刚不动如来峰',
      buddhaName: 'Aksobhya Buddha',
      zhBuddhaName: '阿閦佛（不动如来）',
      desc: 'Transform anger into crystal-clear mirror wisdom and calm patience.',
      zhDesc: '寻访东方妙喜世界不动如来，转瞋为大圆镜智、常住安忍不动。'
    },
    {
      index: 8,
      id: 'stop_8',
      locked: true,
      reqVP: 450,
      reqLP: 100,
      emoji: '🪙',
      shortName: 'Ratnasambhava',
      zhShortName: '宝生如来',
      name: 'Stop 8 · Jewel-Born Generosity Garden',
      zhName: '第 8 站 · 南方宝生施舍园',
      buddhaName: 'Ratnasambhava Buddha',
      zhBuddhaName: '宝生如来',
      desc: 'Discover boundless generosity and see the precious nature in all beings.',
      zhDesc: '寻访南方宝生如来，圆满布施波罗蜜与平等性智。'
    },
    {
      index: 9,
      id: 'stop_9',
      locked: true,
      reqVP: 520,
      reqLP: 120,
      emoji: '🪷',
      shortName: 'Amitabha',
      zhShortName: '阿弥陀佛',
      name: 'Stop 9 · Western Bliss Lotus Sea',
      zhName: '第 9 站 · 西方极乐净土莲海',
      buddhaName: 'Amitabha Buddha',
      zhBuddhaName: '南无阿弥陀佛（无量光佛）',
      desc: 'Enter the golden lotus sea of infinite light and joyful pure aspiration.',
      zhDesc: '寻访西方极乐世界阿弥陀佛，契入四十八大愿、九品莲华化生。'
    },
    {
      index: 10,
      id: 'stop_10',
      locked: true,
      reqVP: 600,
      reqLP: 150,
      emoji: '👑',
      shortName: 'Amoghasiddhi',
      zhShortName: '不空成就佛',
      name: 'Stop 10 · Northern All-Accomplishing Summit',
      zhName: '第 10 站 · 北方不空成就圆满巅',
      buddhaName: 'Amoghasiddhi Buddha',
      zhBuddhaName: '不空成就如来',
      desc: 'Complete the 10-stop journey with fearless wisdom and full Virtue & Liberation!',
      zhDesc: '圆满功德与解脱资粮，登临第 10 站寻访不空成就如来，成就成所作智！'
    }
  ]
};
