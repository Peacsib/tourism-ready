/**
 * API connectivity check for all services
 * Run: node scripts/check-apis.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env manually
const env = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=\s]+)\s*=\s*"?([^"\n]*)"?/);
  if (m) vars[m[1]] = m[2];
}

const SUPABASE_URL      = vars.SUPABASE_URL;
const SUPABASE_PUB_KEY  = vars.SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SVC_KEY  = vars.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY        = vars.OPENAI_API_KEY;
const SERPAPI_KEY       = vars.SERPAPI_API_KEY;       // events.server.ts
const SERPAPI_KEY2      = vars.SERPAPI_JOBS_API_KEY;  // jobs.server.ts
const ENRICH_KEY        = vars.ENRICH_API_KEY;

function tick(ok, label, detail = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`  ${icon}  ${label}${detail ? '  →  ' + detail : ''}`);
}

async function checkSupabase() {
  console.log('\n🔵 Supabase');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
      headers: { apikey: SUPABASE_PUB_KEY, Authorization: `Bearer ${SUPABASE_PUB_KEY}` },
    });
    tick(r.ok, `REST API (Publishable Key: ${r.status})`, r.ok ? 'reachable' : await r.text());

    // Auth endpoint
    const r2 = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUB_KEY },
    });
    tick(r2.ok, `Auth API (${r2.status})`, r2.ok ? 'reachable' : await r2.text());

    // Service Role / Admin client check
    if (SUPABASE_SVC_KEY) {
      const r3 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count&limit=1`, {
        headers: { apikey: SUPABASE_SVC_KEY, Authorization: `Bearer ${SUPABASE_SVC_KEY}` },
      });
      tick(r3.ok, `Service Role Admin API (${r3.status})`, r3.ok ? 'admin bypass verified' : await r3.text());
    } else {
      tick(false, 'Service Role Key', 'Missing');
    }

    // Realtime
    const wsUrl = SUPABASE_URL.replace('https', 'wss') + '/realtime/v1/websocket?vsn=1.0.0&apikey=' + SUPABASE_PUB_KEY;
    tick(true, 'Realtime URL', wsUrl.split('?')[0]);
  } catch (e) {
    tick(false, 'Supabase', e.message);
  }
}

async function checkOpenAI() {
  console.log('\n🟢 OpenAI');
  try {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    });
    const data = await r.json();
    if (r.ok) {
      const models = data.data?.map(m => m.id).filter(id => id.startsWith('gpt'));
      tick(true, `API key valid`, `${data.data?.length} models available`);
      tick(true, 'GPT models sample', models?.slice(0, 3).join(', '));
    } else {
      tick(false, `API key (${r.status})`, data.error?.message);
    }
  } catch (e) {
    tick(false, 'OpenAI', e.message);
  }
}

async function checkSerpAPI(key, label) {
  try {
    const url = `https://serpapi.com/account?api_key=${key}`;
    const r = await fetch(url);
    const data = await r.json();
    if (r.ok && !data.error) {
      tick(true, label, `${data.searches_per_month - (data.this_month_usage ?? 0)} searches remaining`);
    } else {
      tick(false, label, data.error ?? `HTTP ${r.status}`);
    }
  } catch (e) {
    tick(false, label, e.message);
  }
}

async function checkEnrich() {
  console.log('\n🟣 Enrich (Lead Finder)');
  try {
    if (!ENRICH_KEY) {
      tick(false, 'Enrich API key', 'Missing in .env');
      return;
    }
    const r = await fetch('https://dev.enrich.so/api/v3/lead-finder/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENRICH_KEY,
      },
      body: JSON.stringify({
        filters: { personHeadline: ['tourism'], countryName: 'Zimbabwe' },
        page: 1,
        pageSize: 1,
      }),
    });
    const data = await r.json();
    if (r.ok && (data.success || data.data)) {
      tick(true, `Enrich API valid (${r.status})`, `${data.data?.results?.length ?? 0} sample results retrieved`);
    } else {
      tick(false, `Enrich API (${r.status})`, data.message || JSON.stringify(data));
    }
  } catch (e) {
    tick(false, 'Enrich', e.message);
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  API Connectivity Check — Tourism Workforce 2031');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await checkSupabase();
  await checkOpenAI();

  console.log('\n🟡 SerpAPI');
  await checkSerpAPI(SERPAPI_KEY,  'SerpAPI Events key (SERPAPI_API_KEY)');
  await checkSerpAPI(SERPAPI_KEY2, 'SerpAPI Jobs key   (SERPAPI_JOBS_API_KEY)');

  await checkEnrich();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
