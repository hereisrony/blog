// Writes the static side of rony.blog from the POSTS in index.html:
// a real page per post and language, sitemap.xml, robots.txt, feed.xml.
// Run from the repo root:  node tools/build.mjs
import fs from 'fs';
import vm from 'vm';

const SITE = 'https://rony.blog';
const AUTHOR = { '@type': 'Person', name: 'Rony Efrat', jobTitle: 'Writer', url: 'https://www.ronyefrat.work/', sameAs: ['https://www.ronyefrat.work/'] };
const TAGLINE = 'Essays, poems, prose and notes, in English and French.';
const LEGACY = { interruptions: 'whittaker', 'shortest-passage': 'ai-art', 'incroyable-talent': 'talent' };

let src = fs.readFileSync('index.html', 'utf8');

// ---- load the data the page itself uses
const a = src.indexOf("const M = '/media/';");
const b = src.indexOf('  // Words the reader sees');
const c = src.indexOf('  function localize(');
const d = src.indexOf('  let lang = ');
const code = `(function(){ ${src.slice(a, b)}\n${src.slice(c, d)}\n return { POSTS, TR, localize }; })()`;
const { POSTS, localize } = vm.runInNewContext(code, { URL: { createObjectURL: () => '' }, Blob: class {} });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = h => (h || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const clip = (t, n) => t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
const NAME = { en: 'English', fr: 'French' }, NAME_FR = { en: 'anglais', fr: 'français' };
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateLabel = (iso, lg) => { const [y, m, dd] = iso.split('-').map(Number); return lg === 'fr' ? `${y}_${dd} ${MONTHS_FR[m - 1]}` : `${y}_${MONTHS_EN[m - 1]} ${dd}`; };
const path = (id, lg, orig) => '/' + id + (lg === orig ? '' : '/' + lg);

const pages = [];   // { id, lang, orig, p (localized), path }
for (const p0 of POSTS) {
  const orig = p0.lang || 'en';
  const first = localize(p0, orig);
  for (const lg of first.langs) pages.push({ p0, lang: lg, orig, p: localize(p0, lg), path: path(p0.id, lg, orig) });
}

const bodyText = p => p.slides.flatMap(s => s.t ? [].concat(s.t) : s.poem ? [[].concat(s.poem).join(' / ')] : []).map(plain);
const descOf = p => clip(plain(p.dek) || bodyText(p).join(' ').trim() || plain(p.title), 158);

function article(pg) {
  const { p, p0, orig, lang } = pg, kind = p.kind;
  let h = `<article class="post" lang="${lang}">\n<p><a href="/">rony.blog</a></p>\n<p class="when"><time datetime="${p.date}">${dateLabel(p.date, lang)}</time></p>\n`;
  h += kind === 'note' ? '' : `<h1>${p.title}</h1>\n`;
  if (p.dek) h += `<p class="dek">${p.dek}</p>\n`;
  if (p.auto) {
    const o = '/' + p.id;
    h += lang === 'fr'
      ? `<p class="auto">Traduction automatique de l’${NAME_FR[orig]}. <a href="${o}">Lire l’original</a>.</p>\n`
      : `<p class="auto">Translated automatically from ${NAME[orig]}. <a href="${o}">Read the original</a>.</p>\n`;
  }
  for (const s of p.slides) {
    if (s.t) h += [].concat(s.t).map(t => `<p>${t}</p>`).join('\n') + '\n';
    else if (s.h) h += `<h2>${[].concat(s.h).join(" ")}</h2>\n`;
    else if (s.poem) h += `<p>${[].concat(s.poem).join('<br>\n')}</p>\n`;
    else if (s.i) h += `<figure><img src="/media/${s.i}" alt="${esc(plain(s.alt))}" loading="lazy">${s.caption ? `<figcaption>${s.caption}</figcaption>` : ''}</figure>\n`;
  }
  if (p.also) h += `<p class="also">${p.also.map(x => `<a href="${x.href}" rel="noopener">${esc(x.label)}</a>`).join(', ')}</p>\n`;
  return h + '</article>';
}

function head(pg) {
  if (!pg) {
    const ld = [
      { '@context': 'https://schema.org', '@type': 'Blog', name: 'rony.blog', url: SITE + '/', description: TAGLINE, inLanguage: ['en', 'fr'], author: AUTHOR },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'rony.blog', url: SITE + '/', inLanguage: ['en', 'fr'], publisher: AUTHOR },
      { '@context': 'https://schema.org', ...AUTHOR, mainEntityOfPage: 'https://www.ronyefrat.work/', workExample: { '@type': 'Blog', url: SITE + '/' } }
    ];
    return `<title>rony.blog</title>
<meta name="description" content="${TAGLINE}">
<meta name="author" content="Rony Efrat">
<link rel="author" href="https://www.ronyefrat.work/">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${SITE}/">
<link rel="alternate" type="application/rss+xml" title="rony.blog" href="/feed.xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="rony.blog">
<meta property="og:title" content="rony.blog">
<meta property="og:description" content="${TAGLINE}">
<meta property="og:image" content="${SITE}/icon-512.png">
<meta property="og:url" content="${SITE}/">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  }
  const { p, p0, lang, orig } = pg, url = SITE + pg.path, t = plain(p.title), desc = descOf(p);
  const alts = pages.filter(x => x.p0 === p0);
  const hreflang = alts.map(x => `<link rel="alternate" hreflang="${x.lang}" href="${SITE + x.path}">`).join('\n') +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE}/${p.id}">`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: clip(t, 110), description: desc, url,
    mainEntityOfPage: url, datePublished: p.date, dateModified: p.date, inLanguage: lang, genre: p.kind,
    image: `${SITE}/media/og-${p.id}.png`, author: AUTHOR, publisher: AUTHOR,
    isPartOf: { '@type': 'Blog', name: 'rony.blog', url: SITE + '/' }
  };
  if (p.auto) { ld.translator = { '@type': 'Organization', name: 'Automatic translation' }; ld.translationOfWork = { '@type': 'CreativeWork', url: `${SITE}/${p.id}`, inLanguage: orig }; }
  return `<title>${esc(t)} · rony.blog</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Rony Efrat">
<link rel="author" href="https://www.ronyefrat.work/">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
${hreflang}
<meta property="og:type" content="article">
<meta property="og:site_name" content="rony.blog">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_GB'}">
<meta property="og:image" content="${SITE}/media/og-${p.id}.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="article:published_time" content="${p.date}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="rony.blog" href="/feed.xml">
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ---- the template is index.html with its seo and feed regions swapped
const region = (s, name, inner) => s.replace(new RegExp(`(<!--${name}:start-->)[\\s\\S]*?(<!--${name}:end-->)`), `$1\n${inner}\n$2`);
const listing = () => '<nav aria-label="posts"><ul>\n' + [...POSTS].sort((x, y) => y.date.localeCompare(x.date)).map(p => {
  const l = localize(p, p.lang || 'en');
  return `<li><time datetime="${p.date}">${dateLabel(p.date, l.lang)}</time> <a href="/${p.id}">${plain(l.title)}</a></li>`;
}).join('\n') + '\n</ul></nav>';

if (!src.includes('<!--seo:start-->')) throw new Error('index.html needs the <!--seo--> and <!--feed--> markers');
src = region(src, 'seo', head(null));
src = region(src, 'feed', listing());
fs.writeFileSync('index.html', src);

const write = (f, s) => { fs.mkdirSync(f.replace(/\/[^/]*$/, '') || '.', { recursive: true }); fs.writeFileSync(f, s); };
for (const id of new Set(POSTS.map(p => p.id))) for (const lg of ['en', 'fr']) fs.rmSync(`${id}/${lg}`, { recursive: true, force: true });
for (const pg of pages) {
  let s = region(src, 'seo', head(pg));
  s = region(s, 'feed', article(pg));
  s = s.replace(/<html lang="[a-z]+">/, `<html lang="${pg.lang}">`);
  write(pg.path.slice(1) + '/index.html', s);
}

// ---- the first addresses, forwarded
for (const [old, now] of Object.entries(LEGACY)) {
  for (const sub of ['', 'en/', 'fr/']) {
    const to = `/${now}${sub ? '/' + sub.slice(0, 2) : ''}`;
    const known = pages.some(x => x.path === to);
    write(`${old}/${sub}index.html`, `<!doctype html>
<html><head><meta charset="utf-8"><title>rony.blog</title>
<meta http-equiv="refresh" content="0; url=${known ? to : '/' + now}">
<link rel="canonical" href="${SITE}${known ? to : '/' + now}">
<meta name="robots" content="noindex">
<script>location.replace('${known ? to : '/' + now}')</script></head>
<body><a href="${known ? to : '/' + now}">rony.blog</a></body></html>
`);
  }
}

// ---- sitemap, robots, feed
const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url><loc>${SITE}/</loc></url>
${pages.map(pg => `<url><loc>${SITE + pg.path}</loc><lastmod>${pg.p.date}</lastmod>\n${pages.filter(x => x.p0 === pg.p0).map(x => `  <xhtml:link rel="alternate" hreflang="${x.lang}" href="${SITE + x.path}"/>`).join('\n')}\n</url>`).join('\n')}
</urlset>
`;
fs.writeFileSync('sitemap.xml', sm);
fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const rfc = iso => new Date(iso + 'T12:00:00Z').toUTCString();
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>rony.blog</title><link>${SITE}/</link><description>${TAGLINE}</description><language>en</language>
<atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${pages.filter(x => x.lang === x.orig).sort((x, y) => y.p.date.localeCompare(x.p.date)).map(pg => `<item><title>${esc(plain(pg.p.title))}</title><link>${SITE + pg.path}</link><guid>${SITE + pg.path}</guid><pubDate>${rfc(pg.p.date)}</pubDate><description>${esc(descOf(pg.p))}</description></item>`).join('\n')}
</channel></rss>
`;
fs.writeFileSync('feed.xml', feed);
console.log(pages.length, 'pages');
