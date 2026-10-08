(function (global) {
  'use strict';
  // All gameplay tuning belongs here. Coordinates are logical pixels, speeds px/s.
  global.COIN_PUSHER_CONFIG = {
    version: 'R7 · 2026.10.08',
    world: { width: 1000, height: 1080 },
    engine: { fixedStepMs: 1000 / 60, maxFrameMs: 80, maxSubSteps: 5, gravityY: 1, gravityScale: 0.001, positionIterations: 8, velocityIterations: 8, enableSleeping: true },
    token: { radius: 11, tableRadius: 14, density: 0.0012, friction: 0.05, restitution: 0.1, airFriction: 0.002, tableDrag: 0.11, maxCount: 150, sleepThreshold: 90 },
    board: { width: 720, height: 440, wall: 24, pegRadius: 5, pegRestitution: 0.42, pegStartX: 35, pegStartY: 202, pegGapX: 65, pegGapY: 35, pegRows: 6, channelY: 432 },
    wiper: { pivotX: 360, pivotY: 10, length: 96, gap: 30, railThickness: 8, minAngle: -1, maxAngle: 1, angleSpeed: 0.62, initialAngle: 0, swinging: false, spawnDistance: 32, spawnJitter: 5, launchSpeed: 1 },
    target: { y: 412, width: 96, height: 12, minX: 74, maxX: 646, speed: 115, cooldownMs: 400 },
    table: { width: 600, depth: 190, wall: 20, sideOpenAt: 75, frontSafeMargin: 195, sideSlotStartY: 133, sideSlotWidth: 150, exitMargin: 4, spawnY: 32, landingVelocity: 1.0, seedColumns: 19, seedRows: 5, seedStartX: 20, seedGapX: 31, seedStartY: 37, seedGapY: 29, seedJitter: 0.7 },
    layers: { thickness: 5, maxLevels: 3, landingHeight: 26, gravity: 360, carry: 0.92, supportRadius: 0.82, settlingEpsilon: 0.2, seedEvery: 7, seedOffsetX: 4, seedOffsetY: 3, tilt: 0.08 },
    pusher: { width: 560, height: 44, backY: -22, frontY: 30, speed: 22, pauseMs: 220, wakeDistance: 8 },
    input: { cooldownMs: 220, initialCredits: 100 },
    payout: { pointsPerCoin: 1, intervalMs: 150, hopHeight: 40, hopMs: 420 },
    reels: { spinMs: 1450, stopGapMs: 180, resultHoldMs: 900, flickerMs: 75, magicianWeight: 0.38, normalWeight: 1, jpRows: ['jp2', 'jp1', 'jp3'] },
    rewards: { jp1: 500, jp2: 1000, jp3: 2000, all: 3000, lineMultiplier: 3, diagonalMultiplier: 2, smallMaryMultiplier: 6 },
    stack: { chances: 6, timeoutMs: 30000, matchCount: 6, allSameMultiplier: 2 },
    spin: { maxQueue: 4 },
    symbols: [
      { key: 'fan', label: '彩扇', color: '#fa8558', base: 1 },
      { key: 'hat', label: '礼帽', color: '#69bdff', base: 1 },
      { key: 'box', label: '魔法盒', color: '#ffc65c', base: 1 },
      { key: 'orb', label: '水晶球', color: '#9fdd64', base: 1 },
      { key: 'gem', label: '宝石', color: '#d580fb', base: 1 },
      { key: 'umbrella', label: '雨伞', color: '#fc7cb7', base: 1 },
      { key: 'ring', label: '戒指', color: '#7edcde', base: 1 },
      { key: 'cups', label: '彩杯', color: '#a5d673', base: 1 }
    ],
    visual: {
      pixelRatioMax: 2, boardX: 140, boardY: 252,
      screen: { x: 265, y: 75, width: 375, height: 156 },
      table: { centerX: 500, topY: 752, bottomY: 958, backWidth: 658, frontWidth: 836 },
      coin: { rimTeeth: 48, embossText: 'MAGIC ARCADE', thickness: 3.5 },
      palette: { gold: '#d4ad62', light: '#fff1bd', green: '#225746', dark: '#07130f', steel: '#90a098', red: '#6a1522' },
      exitAnimationMs: 800, maxExitAnimations: 50, noticeMs: 2600
    }
  };
}(window));
