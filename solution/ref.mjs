// Reference implementation (kept outside the agent workspace).
// Usage: node solution/ref.mjs environment/casos  -> prints { <caso>: <saida> }
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const POINTS = { FS01: 40, FS02: 3, FS03: 40, FS04: 25, FS05: 20, FS06: 15, FS07: 10, FS08: 3, FS09: 10, FS10: 5, FS11: 8 };
const CRITICAL = new Set(['FS01', 'FS03']);
const PUBLIC_ROLES = new Set(['anon', 'usuario']);
const SOURCES = ['location.hash', 'location.search', 'location.href', 'document.URL', 'document.referrer', 'window.name', 'event.data'];

const walk = (root, rel = '') => {
  const out = [];
  for (const name of readdirSync(join(root, rel)).sort()) {
    const r = rel ? `${rel}/${name}` : name;
    if (statSync(join(root, r)).isDirectory()) out.push(...walk(root, r));
    else out.push(r);
  }
  return out;
};

const decodeRole = (payload) => {
  const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return json.role;
};

const segmentAfter = (line, end) => {
  const semi = line.indexOf(';', end);
  return line.slice(end, semi === -1 ? line.length : semi);
};

const firstArgIsLiteral = (line, parenEnd) => {
  const rest = line.slice(parenEnd).trimStart();
  return rest[0] === '"' || rest[0] === "'";
};

function scanLine(line, isHtml, isJs, dist, file) {
  const found = [];
  if (/pf_live_[A-Za-z0-9]{24,}/.test(line) || /nvm_sec_[0-9a-f]{32}/.test(line)) found.push('FS01');
  if (/pf_test_[A-Za-z0-9]{24,}/.test(line)) found.push('FS02');
  for (const m of line.matchAll(/eyJ[A-Za-z0-9_-]*\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
    if (!PUBLIC_ROLES.has(decodeRole(m[1]))) found.push('FS03');
  }
  for (const m of line.matchAll(/\.(?:innerHTML|outerHTML)\s*\+?=(?!=)|document\.write\(|\.insertAdjacentHTML\(/g)) {
    const seg = segmentAfter(line, m.index + m[0].length);
    if (SOURCES.some((s) => seg.includes(s))) found.push('FS04');
  }
  for (const m of line.matchAll(/(?<![A-Za-z0-9_$])eval\(|new Function\(/g)) {
    if (!firstArgIsLiteral(line, m.index + m[0].length)) found.push('FS05');
  }
  for (const m of line.matchAll(/localStorage\.setItem\(\s*(["'])(.*?)\1/g)) {
    if (/token|jwt|sessao/i.test(m[2])) found.push('FS07');
  }
  if (isHtml) {
    if (/<script\b[^>]*\bsrc="http:\/\//.test(line)) found.push('FS06');
    for (const m of line.matchAll(/<a\b[^>]*>/g)) {
      if (!m[0].includes('target="_blank"')) continue;
      const rel = m[0].match(/\brel="([^"]*)"/);
      const words = rel ? rel[1].split(/\s+/) : [];
      if (!words.includes('noopener') && !words.includes('noreferrer')) found.push('FS08');
    }
  }
  if (isJs) {
    const m = line.match(/\/\/# sourceMappingURL=(\S+)/);
    if (m) {
      const target = m[1];
      const dir = posix.dirname(file);
      if (target.startsWith('data:') || existsSync(join(dist, posix.normalize(posix.join(dir, target))))) found.push('FS11');
    }
  }
  return found;
}

export function resolver(dir) {
  const dist = join(dir, 'dist');
  const keys = new Set();
  for (const file of walk(dist)) {
    const isHtml = file.endsWith('.html');
    const isJs = file.endsWith('.js');
    if (!isHtml && !isJs) continue;
    readFileSync(join(dist, file), 'utf8').split('\n').forEach((line, i) => {
      for (const regra of scanLine(line, isHtml, isJs, dist, file)) keys.add(`${regra}|${file}|${i + 1}`);
    });
  }
  const raw = JSON.parse(readFileSync(join(dir, 'headers.json'), 'utf8'));
  const headers = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
  const csp = headers['content-security-policy'];
  let cspBad = true;
  if (csp !== undefined) {
    const directives = Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
      const [name, ...values] = d.split(/\s+/);
      return [name.toLowerCase(), values];
    }));
    const eff = directives['script-src'] ?? directives['default-src'];
    cspBad = !eff || eff.some((t) => t === '*' || t === "'unsafe-inline'" || t === "'unsafe-eval'");
  }
  if (cspBad) keys.add('FS09|headers.json|0');
  const hsts = headers['strict-transport-security'];
  const maxAge = hsts && hsts.match(/max-age=(\d+)/i);
  if (!maxAge || Number(maxAge[1]) < 31536000) keys.add('FS10|headers.json|0');

  const achados = [...keys].map((k) => {
    const [regra, arquivo, linha] = k.split('|');
    return { regra, arquivo, linha: Number(linha) };
  }).sort((a, b) => (a.arquivo < b.arquivo ? -1 : a.arquivo > b.arquivo ? 1 : a.linha - b.linha || (a.regra < b.regra ? -1 : a.regra > b.regra ? 1 : 0)));
  const pontos = achados.reduce((s, a) => s + POINTS[a.regra], 0);
  let nota;
  if (achados.some((a) => CRITICAL.has(a.regra))) nota = 'F';
  else if (pontos === 0) nota = 'A';
  else if (pontos <= 15) nota = 'B';
  else if (pontos <= 35) nota = 'C';
  else if (pontos <= 59) nota = 'D';
  else nota = 'F';
  return { achados, pontos, nota };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const base = process.argv[2];
  const all = {};
  for (const c of readdirSync(base).sort()) all[c] = resolver(join(base, c));
  console.log(JSON.stringify(all, null, 2));
}
