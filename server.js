import http from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const rooms = new Map();
const clients = new Map();
const GAME_MS = 5 * 60 * 1000;
const rewards = [
  { id: 'take1', text: '抽对方 1 张牌', kind: 'take', amount: 1 },
  { id: 'take3', text: '抽对方 3 张牌', kind: 'take', amount: 3 },
  { id: 'take5', text: '抽对方 5 张牌', kind: 'take', amount: 5 },
  { id: 'give1', text: '给对方 1 张牌', kind: 'give', amount: 1 },
  { id: 'give3', text: '给对方 3 张牌', kind: 'give', amount: 3 },
  { id: 'give5', text: '给对方 5 张牌', kind: 'give', amount: 5 }
];

function id(prefix = '') { return prefix + randomBytes(8).toString('hex'); }
function roomCode() { let code; do code = String(randomInt(100000, 1000000)); while (rooms.has(code)); return code; }
function card(rank, suit = '') { return { id: id('c_'), rank, suit }; }
function buildDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const suit of suits) for (const rank of ranks) deck.push(card(rank, suit));
  deck.push(card('小王', '🃏'), card('大王', '🃏'));
  return deck;
}
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) { const j = randomInt(i + 1); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}
function otherPlayer(room, playerId) { return room.players.find(p => p.id !== playerId); }
function publicState(room, viewerId) {
  const players = room.players.map(p => ({ id: p.id, name: p.name, handCount: p.hand.length, errors: p.errors, rps: room.phase === 'rps' && p.id !== viewerId ? null : p.rps, hasChosen: !!p.rps }));
  const viewer = room.players.find(p => p.id === viewerId);
  return {
    roomCode: room.code,
    phase: room.phase,
    players,
    you: viewer ? { id: viewer.id, name: viewer.name, handCount: viewer.hand.length, errors: viewer.errors } : null,
    turnPlayerId: room.turnPlayerId,
    table: room.table.map(c => ({ rank: c.rank, suit: c.suit })),
    pending: room.pending ? { type: room.pending.type, startIndex: room.pending.startIndex } : null,
    rpsResult: room.rpsResult,
    winnerId: room.winnerId,
    winnerName: room.players.find(p => p.id === room.winnerId)?.name || null,
    rewardOptions: room.phase === 'reward' && room.winnerId === viewerId ? room.rewardOptions.map((r, i) => ({ slot: i + 1 })) : [],
    rewardResult: room.rewardResult,
    endsAt: room.endsAt,
    message: room.message || ''
  };
}
function emit(room) {
  scheduleBot(room);
  for (const p of room.players) {
    const set = clients.get(p.id); if (!set) continue;
    const payload = `data: ${JSON.stringify(publicState(room, p.id))}\n\n`;
    for (const res of set) res.write(payload);
  }
}
function broadcastMessage(room, message) { room.message = message; emit(room); }
function ensureRoom(code) { const room = rooms.get(code); if (!room) throw new Error('房间不存在'); return room; }
function ensurePlayer(room, playerId) { const p = room.players.find(x => x.id === playerId); if (!p) throw new Error('你不在这个房间里'); return p; }
function startRps(room) {
  room.phase = 'rps'; room.message = '两位玩家请选择石头、剪刀或布'; emit(room);
}
function resolveRps(room) {
  const [a, b] = room.players;
  if (!a.rps || !b.rps) return;
  if (a.rps === b.rps) { room.rpsResult = '平局，请重新出拳'; a.rps = b.rps = null; emit(room); return; }
  const win = (a.rps === 'rock' && b.rps === 'scissors') || (a.rps === 'scissors' && b.rps === 'paper') || (a.rps === 'paper' && b.rps === 'rock');
  room.turnPlayerId = win ? a.id : b.id;
  room.rpsResult = `${win ? a.name : b.name} 获得先手`;
  room.phase = 'active'; room.endsAt = Date.now() + GAME_MS; room.message = '游戏开始，先手玩家出牌'; emit(room);
}
function startGame(room) {
  const deck = shuffle(buildDeck());
  room.players[0].hand = deck.slice(0, 27); room.players[1].hand = deck.slice(27);
  room.table = []; room.pending = null; room.rewardOptions = shuffle([...rewards]).slice(0, 3); room.rewardResult = null; room.winnerId = null;
  startRps(room);
}
function finish(room, reason) {
  if (room.phase === 'finished' || room.phase === 'reward') return;
  const [a, b] = room.players;
  let winner = a.hand.length >= b.hand.length ? a : b;
  if (a.hand.length === b.hand.length) { room.winnerId = null; room.phase = 'finished'; room.endsAt = null; room.message = `${reason} 双方牌数相同，本局平局。`; emit(room); return; }
  room.winnerId = winner.id; room.phase = 'reward'; room.endsAt = null; room.message = `${reason} ${winner.name} 获胜，请选择一张奖励卡`;
  emit(room);
}
function maybeFinish(room) {
  if (room.phase !== 'active') return;
  if (Date.now() >= room.endsAt) return finish(room, '时间到。');
  if (room.players.some(p => p.hand.length === 0)) return finish(room, '一方牌组耗尽。');
}
// One cancellable action per bot: react only to the current, public table.
function scheduleBot(room) {
  clearTimeout(room.botTimer);
  const bot = room.players.find(p => p.bot);
  if (!bot) return;
  let action, delay = 1400;
  if (room.phase === 'rps' && !bot.rps) action = () => {
    bot.rps = ['rock', 'paper', 'scissors'][randomInt(3)];
    emit(room); resolveRps(room);
  };
  else if (room.phase === 'active') {
    if (room.pending) action = () => ring(room, bot.id);
    else if (room.turnPlayerId === bot.id) action = () => draw(room, bot.id);
  } else if (room.phase === 'reward' && room.winnerId === bot.id) {
    action = () => chooseReward(room, bot.id, randomInt(1, 4));
  }
  if (action) room.botTimer = setTimeout(action, delay);
}
function draw(room, playerId) {
  maybeFinish(room); if (room.phase !== 'active') return;
  if (room.turnPlayerId !== playerId) throw new Error('还没轮到你出牌');
  const p = ensurePlayer(room, playerId);
  if (!p.hand.length) return finish(room, '一方牌组耗尽。');
  room.pending = null;
  const index = randomInt(p.hand.length); const c = p.hand.splice(index, 1)[0];
  const previous = room.table.length - 1;
  room.table.push(c);
  let pending = null;
  if (['J', '小王', '大王'].includes(c.rank)) pending = { type: 'special', startIndex: 0 };
  else {
    for (let i = previous; i >= 0; i--) if (room.table[i].rank === c.rank) { pending = { type: 'pair', startIndex: i }; break; }
  }
  room.pending = pending; room.message = pending ? '出现机会！按铃抢牌' : `${p.name} 出牌，轮到对方`;
  room.turnPlayerId = otherPlayer(room, playerId).id;
  emit(room); maybeFinish(room);
}
function ring(room, playerId) {
  maybeFinish(room); if (room.phase !== 'active') return;
  const p = ensurePlayer(room, playerId);
  if (!room.pending || room.table.length === 0) {
    const opponent = otherPlayer(room, playerId); const amount = Math.min(p.errors + 1, 3); p.errors = amount;
    const take = Math.min(amount, p.hand.length); for (let i = 0; i < take; i++) opponent.hand.push(p.hand.splice(randomInt(p.hand.length), 1)[0]);
    room.message = `${p.name} 按错铃，给对手 ${take} 张牌（惩罚 ${amount}/3）`;
    emit(room); maybeFinish(room); return;
  }
  const start = room.pending.type === 'special' ? 0 : room.pending.startIndex;
  const captured = room.table.splice(start);
  p.hand.push(...captured); room.pending = null; room.turnPlayerId = p.id; room.message = `${p.name} 抢铃成功，收走 ${captured.length} 张牌，继续出牌`;
  emit(room); maybeFinish(room);
}
function chooseReward(room, playerId, slot) {
  if (room.phase !== 'reward' || room.winnerId !== playerId) throw new Error('只有获胜者可以翻奖励卡');
  const reward = room.rewardOptions[Number(slot) - 1]; if (!reward) throw new Error('奖励卡不存在');
  const winner = ensurePlayer(room, playerId), loser = otherPlayer(room, playerId);
  const amount = Math.min(reward.amount, reward.kind === 'take' ? loser.hand.length : winner.hand.length);
  if (reward.kind === 'take') for (let i = 0; i < amount; i++) winner.hand.push(loser.hand.splice(randomInt(loser.hand.length), 1)[0]);
  else for (let i = 0; i < amount; i++) loser.hand.push(winner.hand.splice(randomInt(winner.hand.length), 1)[0]);
  room.rewardResult = `${winner.name} 翻开了奖励：${reward.text}（实际转移 ${amount} 张）`; room.phase = 'finished'; room.message = room.rewardResult; emit(room);
}
function json(res, status, data) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)); }
async function body(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
async function api(req, res, url) {
  try {
    const data = await body(req);
    if (url.pathname === '/api/local' && req.method === 'POST') {
      const playerId = id('p_'), botId = id('p_'), code = roomCode();
      const room = { code, players: [{ id: playerId, name: String(data.name || '玩家1').slice(0, 12), hand: [], errors: 0, rps: null }, { id: botId, name: '电脑玩家', hand: [], errors: 0, rps: null, bot: true }], phase: 'active', table: [], pending: null, turnPlayerId: playerId, endsAt: Date.now() + GAME_MS, rewardOptions: [], rewardResult: null, winnerId: null, message: '电脑试玩模式：轮到你出牌' };
      rooms.set(code, room); startGame(room); json(res, 200, { code, playerId }); return;
    }
    if (url.pathname === '/api/create' && req.method === 'POST') {
      const playerId = id('p_'), code = roomCode(); const room = { code, players: [{ id: playerId, name: String(data.name || '玩家1').slice(0, 12), hand: [], errors: 0, rps: null }], phase: 'waiting', table: [], pending: null, turnPlayerId: null, endsAt: null, rewardOptions: [], rewardResult: null, message: '等待另一位玩家加入' };
      rooms.set(code, room); json(res, 200, { code, playerId }); return;
    }
    if (url.pathname === '/api/join' && req.method === 'POST') {
      const room = ensureRoom(String(data.code)); if (room.players.length >= 2) throw new Error('房间已满'); const playerId = id('p_'); room.players.push({ id: playerId, name: String(data.name || '玩家2').slice(0, 12), hand: [], errors: 0, rps: null }); startGame(room); json(res, 200, { code: room.code, playerId }); return;
    }
    const code = String(data.code || url.searchParams.get('code') || ''); const playerId = String(data.playerId || url.searchParams.get('playerId') || ''); const room = ensureRoom(code); ensurePlayer(room, playerId);
    if (url.pathname === '/api/rps' && req.method === 'POST') { if (room.phase !== 'rps') throw new Error('当前不能出拳'); const p = ensurePlayer(room, playerId); if (p.rps) throw new Error('已经出拳，等待对方'); if (!['rock','paper','scissors'].includes(data.choice)) throw new Error('无效出拳'); p.rps = data.choice; room.message = `${p.name} 已出拳，等待对方`; emit(room); resolveRps(room); json(res, 200, { ok: true }); return; }
    if (url.pathname === '/api/draw' && req.method === 'POST') { draw(room, playerId); json(res, 200, { ok: true }); return; }
    if (url.pathname === '/api/ring' && req.method === 'POST') { ring(room, playerId); json(res, 200, { ok: true }); return; }
    if (url.pathname === '/api/reward' && req.method === 'POST') { chooseReward(room, playerId, data.slot); json(res, 200, { ok: true }); return; }
    if (url.pathname === '/api/state' && req.method === 'GET') { json(res, 200, publicState(room, playerId)); return; }
    throw new Error('接口不存在');
  } catch (e) { json(res, 400, { error: e.message || '请求失败' }); }
}
function serve(req, res, url) {
  let pathname = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^\.\.(\/|\\|$)/, '');
  const file = join(ROOT, 'public', pathname);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  readFile(file).then(data => { res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }); res.end(data); }).catch(() => { res.writeHead(404); res.end('Not found'); });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  if (url.pathname === '/events') {
    const playerId = url.searchParams.get('playerId'), code = url.searchParams.get('code'), room = rooms.get(code);
    if (!room || !room.players.some(p => p.id === playerId)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' }); res.write(`data: ${JSON.stringify(publicState(room, playerId))}\n\n`);
    if (!clients.has(playerId)) clients.set(playerId, new Set()); clients.get(playerId).add(res); req.on('close', () => clients.get(playerId)?.delete(res)); return;
  }
  serve(req, res, url);
});
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
setInterval(() => { for (const room of rooms.values()) { if (room.phase === 'active') maybeFinish(room); } }, 1000);
server.listen(PORT, () => console.log(`扑克牌钓鱼运行于 http://localhost:${PORT}`));

}
export { startGame, publicState, draw, ring, resolveRps, finish, chooseReward };
