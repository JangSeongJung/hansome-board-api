/**
 * 방문 카운터 (Upstash Redis, Vercel)
 *
 * Vercel Storage 연동 시 주입되는 이름을 우선 사용:
 * - KV_REST_API_URL + KV_REST_API_TOKEN
 *
 * 직접 Upstash 콘솔만 쓸 때:
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 */
const KEY = 'hansome_board_visit_total';

function createRedis(Redis) {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const u = String(url).trim();
    if (!/^https?:\/\//i.test(u)) {
      throw new Error(
        'KV_REST_API_URL 이 잘못됨(https로 시작해야 함). Vercel Environment Variables 확인.'
      );
    }
    return new Redis({ url: u, token: String(token).trim() });
  }

  return Redis.fromEnv();
}

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
      error: '@upstash/redis 로드 실패. package.json dependencies 확인.',
    });
  }

  let redis;
  try {
    redis = createRedis(Redis);
  } catch (e) {
    return res.status(500).json({
      count: 0,
      error: e.message || 'Redis 환경변수 없음. Vercel Connect + 재배포 확인.',
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
