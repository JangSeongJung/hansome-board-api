/**
 * 방문 카운터 (영구 저장: Upstash Redis)
 * Vercel에서 Upstash Redis 연결 시 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 자동 주입.
 */
const KEY = 'hansome_board_visit_total';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let Redis;
  try {
    ({ Redis } = await import('@upstash/redis'));
  } catch (e) {
    return res.status(500).json({
      count: 0,
      error: '@upstash/redis 로드 실패. package.json dependencies 확인 후 재배포.',
    });
  }

  let redis;
  try {
    redis = Redis.fromEnv();
  } catch (e) {
    return res.status(500).json({
      count: 0,
      error: 'Redis 환경변수 없음. Vercel에서 Upstash Redis 연결했는지 확인.',
    });
  }

  try {
    if (req.method === 'POST') {
      const count = await redis.incr(KEY);
      return res.status(200).json({ count: Number(count) });
    }
    if (req.method === 'GET') {
      const v = await redis.get(KEY);
      const n = v == null ? 0 : Number(v);
      return res.status(200).json({ count: Number.isFinite(n) ? n : 0 });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ count: 0, error: e.message || 'Redis error' });
  }
};
