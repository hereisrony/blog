// Writes the static side of rony.blog from the POSTS in index.html:
// a real page per post and language, sitemap.xml, robots.txt, feed.xml.
// Run from the repo root:  node tools/build.mjs
import fs from 'fs';
import vm from 'vm';

const SITE = 'https://rony.blog';
// The same person as on ronyefrat.work: its @id ties both sites to one author.
const PERSON_ID = 'https://www.ronyefrat.work/#person';
const PERSON = { '@type': 'Person', '@id': PERSON_ID, name: 'Rony Efrat', url: 'https://www.ronyefrat.work/',
  sameAs: ['https://www.ronyefrat.work/', 'https://www.instagram.com/hereisrony/', 'https://www.linkedin.com/in/hereisrony'] };
const AUTHOR = { '@id': PERSON_ID };
const BLOG_ID = 'https://rony.blog/#blog';
const HOME = {
  en: { path: '/', title: 'rony.blog ⋮ essays, poems, prose and notes', og: 'Essays, poems, prose and notes, in English and French.',
        desc: 'Essays, poems, prose and notes, written in English and French, each with an automatic translation.', nav: 'posts' },
  fr: { path: '/fr/', title: 'rony.blog ⋮ essais, poèmes, prose et notes', og: 'Essais, poèmes, prose et notes, en français et en anglais.',
        desc: 'Essais, poèmes, prose et notes, écrits en français et en anglais, chacun avec une traduction automatique.', nav: 'publications' }
};
const TAGLINE = HOME.en.og;
const LOCALE = { en: 'en_GB', fr: 'fr_FR' };
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
const path = (id, lg, orig) => '/' + id + '/' + (lg === orig ? '' : lg + '/');

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
  let h = `<article class="post" lang="${lang}">\n<p><a href="${HOME[lang].path}">rony.blog</a></p>\n<p class="when"><time datetime="${p.date}">${dateLabel(p.date, lang)}</time></p>\n`;
  h += `<h1>${p.title}</h1>\n`;
  if (p.dek) h += `<p class="dek">${p.dek}</p>\n`;
  if (p.auto) {
    const o = path(p.id, orig, orig);
    h += lang === 'fr'
      ? `<p class="auto">Traduction automatique de l’${NAME_FR[orig]}. <a href="${o}">Lire l’original</a>.</p>\n`
      : `<p class="auto">Translated automatically from ${NAME[orig]}. <a href="${o}">Read the original</a>.</p>\n`;
  }
  for (const s of kind === 'note' ? [] : p.slides) {
    if (s.t) h += [].concat(s.t).map(t => `<p>${t}</p>`).join('\n') + '\n';
    else if (s.h) h += `<h2>${[].concat(s.h).join(" ")}</h2>\n`;
    else if (s.poem) h += `<p>${[].concat(s.poem).join('<br>\n')}</p>\n`;
    else if (s.i) h += `<figure><img src="/media/${s.i}" alt="${esc(plain(s.alt))}" loading="lazy">${s.caption ? `<figcaption>${s.caption}</figcaption>` : ''}</figure>\n`;
  }
  if (p.also) h += `<p class="also">${p.also.map(x => `<a href="${x.href}" rel="noopener">${esc(x.label)}</a>`).join(', ')}</p>\n`;
  return h + '</article>';
}

const meta = ({ title, desc, ogDesc, url, lang, type, image, imageAlt, card, alts, ld, extra = '' }) => `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Rony Efrat">
<link rel="author" href="https://www.ronyefrat.work/">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="${url}">
${alts.map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${u}">`).join('\n')}
<link rel="alternate" type="application/rss+xml" title="rony.blog" href="/feed.xml">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="rony.blog">
<meta property="og:locale" content="${LOCALE[lang]}">
${alts.filter(([l]) => l !== lang && l !== 'x-default').map(([l]) => `<meta property="og:locale:alternate" content="${LOCALE[l]}">`).join('\n')}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(ogDesc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
${extra}<meta name="twitter:card" content="${card}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(ogDesc)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;

const homeAlts = [['en', SITE + '/'], ['fr', SITE + '/fr/'], ['x-default', SITE + '/']];
function head(pg, lg = 'en') {
  if (!pg) {
    const H = HOME[lg], url = SITE + H.path;
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Blog', '@id': BLOG_ID, name: 'rony.blog', url: SITE + '/', description: H.desc, inLanguage: ['en', 'fr'], author: AUTHOR, publisher: AUTHOR,
        blogPost: POSTS.map(p => ({ '@id': SITE + path(p.id, p.lang || 'en', p.lang || 'en') + '#post' })) },
      { '@type': 'WebSite', '@id': SITE + '/#website', name: 'rony.blog', url: SITE + '/', inLanguage: ['en', 'fr'], publisher: AUTHOR, author: AUTHOR },
      { '@type': 'WebPage', '@id': url + '#page', url, name: H.title, inLanguage: lg, isPartOf: { '@id': SITE + '/#website' }, about: { '@id': BLOG_ID } },
      PERSON
    ] };
    return meta({ title: H.title, desc: H.desc, ogDesc: H.og, url, lang: lg, type: 'website', image: SITE + '/media/og-home.png',
      imageAlt: lg === 'fr' ? 'Le pentagone de rony.blog sur fond vert' : 'The rony.blog pentagon on green', card: 'summary_large_image', alts: homeAlts, ld });
  }
  const { p, p0, lang, orig } = pg, url = SITE + pg.path, t = plain(p.title), desc = descOf(p);
  const alts = pages.filter(x => x.p0 === p0).map(x => [x.lang, SITE + x.path]).concat([['x-default', SITE + path(p.id, orig, orig)]]);
  const post = {
    '@type': 'BlogPosting', '@id': url + '#post', headline: clip(t, 110), description: desc, url,
    mainEntityOfPage: url, datePublished: p.date, dateModified: p.date, inLanguage: lang,
    genre: { essay: 'Essay', poem: 'Poetry', prose: 'Prose', note: 'Note' }[p.kind] || p.kind,
    image: `${SITE}/media/og-${p.id}.png`, author: AUTHOR, publisher: AUTHOR, isPartOf: { '@id': BLOG_ID },
    wordCount: bodyText(p).join(' ').split(/\s+/).filter(Boolean).length
  };
  if (p.auto) {
    post.translationOfWork = { '@id': SITE + path(p.id, orig, orig) + '#post' };
    post.translator = { '@type': 'Organization', name: 'Automatic translation' };
  } else {
    const tr = pages.filter(x => x.p0 === p0 && x.lang !== orig);
    if (tr.length) post.workTranslation = tr.map(x => ({ '@id': SITE + x.path + '#post' }));
  }
  if (p.also) post.sameAs = p.also.map(x => x.href);
  const ld = { '@context': 'https://schema.org', '@graph': [post, { '@type': 'Blog', '@id': BLOG_ID, name: 'rony.blog', url: SITE + '/' }, PERSON] };
  return meta({ title: `${p.kind === 'note' ? clip(t, 70) : t} ⋮ rony.blog`, desc, ogDesc: desc, url, lang, type: 'article', image: `${SITE}/media/og-${p.id}.png`,
    imageAlt: lang === 'fr' ? `Le dessin de « ${clip(t, 80)} » sur fond vert` : `The drawing for “${clip(t, 80)}” on green`,
    card: 'summary_large_image', alts, ld,
    extra: `<meta property="article:published_time" content="${p.date}">\n<meta property="article:author" content="https://www.ronyefrat.work/">\n<meta property="article:section" content="${p.kind}">\n` });
}

// ---- the template is index.html with its seo and feed regions swapped
const region = (s, name, inner) => s.replace(new RegExp(`(<!--${name}:start-->)[\\s\\S]*?(<!--${name}:end-->)`), `$1\n${inner}\n$2`);
const listing = lg => `<nav aria-label="${HOME[lg].nav}"><ul>\n` + [...POSTS].sort((x, y) => y.date.localeCompare(x.date)).map(p => {
  const orig = p.lang || 'en', has = pages.some(x => x.p0 === p && x.lang === lg), l = localize(p, has ? lg : orig);
  return `<li><time datetime="${p.date}">${dateLabel(p.date, l.lang)}</time> <a href="${path(p.id, l.lang, orig)}" hreflang="${l.lang}">${plain(l.title)}</a></li>`;
}).join('\n') + '\n</ul></nav>';

if (!src.includes('<!--seo:start-->')) throw new Error('index.html needs the <!--seo--> and <!--feed--> markers');
src = region(src, 'seo', head(null, 'en'));
src = region(src, 'feed', listing('en'));
src = src.replace(/<html lang="[a-z]+">/, '<html lang="en">');
fs.writeFileSync('index.html', src);

const write = (f, s) => { fs.mkdirSync(f.replace(/\/[^/]*$/, '') || '.', { recursive: true }); fs.writeFileSync(f, s); };
for (const id of new Set(POSTS.map(p => p.id))) for (const lg of ['en', 'fr']) fs.rmSync(`${id}/${lg}`, { recursive: true, force: true });
{
  let s = region(src, 'seo', head(null, 'fr'));
  s = region(s, 'feed', listing('fr'));
  write('fr/index.html', s.replace(/<html lang="[a-z]+">/, '<html lang="fr">'));
}
for (const pg of pages) {
  let s = region(src, 'seo', head(pg));
  s = region(s, 'feed', article(pg));
  s = s.replace(/<html lang="[a-z]+">/, `<html lang="${pg.lang}">`);
  write(pg.path.slice(1) + 'index.html', s);
}

// ---- the first addresses, forwarded
for (const [old, now] of Object.entries(LEGACY)) {
  for (const sub of ['', 'en/', 'fr/']) {
    const to = `/${now}/${sub}`;
    const known = pages.some(x => x.path === to);
    const dest = known ? to : `/${now}/`;
    write(`${old}/${sub}index.html`, `<!doctype html>
<html><head><meta charset="utf-8"><title>rony.blog</title>
<meta http-equiv="refresh" content="0; url=${dest}">
<link rel="canonical" href="${SITE}${dest}">
<meta name="robots" content="noindex">
<script>location.replace('${dest}')</script></head>
<body><a href="${dest}">rony.blog</a></body></html>
`);
  }
}

// ---- sitemap, robots, feed
const latest = POSTS.map(p => p.date).sort().pop();
const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${['/', '/fr/'].map(h => `<url><loc>${SITE + h}</loc><lastmod>${latest}</lastmod>\n${homeAlts.map(([l, u]) => `  <xhtml:link rel="alternate" hreflang="${l}" href="${u}"/>`).join('\n')}\n</url>`).join('\n')}
${pages.map(pg => `<url><loc>${SITE + pg.path}</loc><lastmod>${pg.p.date}</lastmod>\n${pages.filter(x => x.p0 === pg.p0).map(x => `  <xhtml:link rel="alternate" hreflang="${x.lang}" href="${SITE + x.path}"/>`).concat([`  <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + path(pg.p.id, pg.orig, pg.orig)}"/>`]).join('\n')}\n</url>`).join('\n')}
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
