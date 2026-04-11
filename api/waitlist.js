// EntryPoint waitlist handler
// Uses the Supabase REST API via native fetch — no npm packages required.
// Env vars required: SUPABASE_URL, SUPABASE_ANON_KEY
// Optional:         MIN_WAITLIST_DISPLAY (default 37)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_COUNT = parseInt(process.env.MIN_WAITLIST_DISPLAY || '37', 10);

// ── In-memory rate limiter (best-effort, per warm instance) ───────────────────
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const rateLimitStore = new Map();

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimitStore.get(ip) || []).filter(function (t) {
    return now - t < RATE_LIMIT_WINDOW_MS;
  });
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  rateLimitStore.set(ip, hits);
  return false;
}

// ── Supabase REST helpers ─────────────────────────────────────────────────────
function sbHeaders(extra) {
  var key = process.env.SUPABASE_ANON_KEY;
  return Object.assign({
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
  }, extra || {});
}

async function getCount() {
  try {
    var res = await fetch(
      process.env.SUPABASE_URL + '/rest/v1/waitlist?select=id',
      {
        headers: sbHeaders({ 'Prefer': 'count=exact', 'Range': '0-0' }),
      }
    );
    // Content-Range: 0-0/42  →  total is 42
    var cr = res.headers.get('content-range');
    if (cr) {
      var total = cr.split('/')[1];
      if (total !== undefined) return parseInt(total, 10);
    }
  } catch (e) {
    console.error('getCount error:', e);
  }
  return null; // caller will floor to MIN_COUNT
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {

  // GET — page-load count fetch
  if (req.method === 'GET') {
    var count = await getCount();
    var realCount = count !== null ? count : 0;
    return res.status(200).json({
      success: true,
      count: realCount,
      displayCount: Math.max(MIN_COUNT, realCount),
    });
  }

  // All other non-POST methods
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate limit
  var ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  }

  // Validate email
  var email = ((req.body && req.body.email) || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  // Insert into Supabase
  var alreadyJoined = false;
  var insertRes = await fetch(
    process.env.SUPABASE_URL + '/rest/v1/waitlist',
    {
      method: 'POST',
      headers: sbHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify([{ email: email }]),
    }
  );

  if (!insertRes.ok) {
    var errBody = {};
    try { errBody = await insertRes.json(); } catch (_) {}
    // 23505 = Postgres unique_violation — email already on the list
    if (errBody.code === '23505' || insertRes.status === 409) {
      alreadyJoined = true;
    } else {
      console.error('Supabase insert error:', insertRes.status, errBody);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  // Return real count after insert
  var postCount = await getCount();
  var realCount = postCount !== null ? postCount : 0;

  return res.status(200).json({
    success: true,
    alreadyJoined: alreadyJoined,
    count: realCount,
    displayCount: Math.max(MIN_COUNT, realCount),
  });
};
