/**
 * Páginas estáticas para SEO, geradas no build: uma por case (/cases/<id>/)
 * e um perfil em inglês (/en/). HTML + CSS inline, zero JS: não tocam na home
 * nem no bundle.
 */
import type { Plugin } from 'vite';
import { profile, works, marquee, type Work } from '../src/content';

const SITE = 'https://davi.metup.com.br';
const OG = `${SITE}/media/og.png`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sameAs = profile.links.filter((l) => l.href.startsWith('https://') && !l.href.includes('wa.me')).map((l) => l.href);

const person = {
  '@type': 'Person',
  '@id': `${SITE}/#davi`,
  name: profile.name,
  url: `${SITE}/`,
  image: `${SITE}/media/davi.webp`,
  sameAs,
};

const css = `
:root{--ink:#09090b;--ink-3:#17171c;--bone:#ece8e1;--bone-2:rgba(236,232,225,.64);--bone-3:rgba(236,232,225,.4);--line:rgba(236,232,225,.11);--accent:#9d8cff;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--ink)}
body{margin:0;background:var(--ink);color:var(--bone);font:16px/1.65 'Geist',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:860px;margin:0 auto;padding:clamp(32px,7vw,96px) 16px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.mono{font-family:'Geist Mono',ui-monospace,monospace}
.top{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--bone-3);margin-bottom:clamp(40px,8vw,88px)}
.route{color:var(--accent);font-size:14px}
h1{font-family:'Anybody','Arial Narrow',sans-serif;font-weight:800;font-stretch:75%;text-transform:uppercase;font-size:clamp(44px,10vw,104px);line-height:.92;margin:.25em 0 .3em;letter-spacing:-.01em}
h2{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--bone-3);font-weight:500;margin:56px 0 16px}
.kind{font-family:'Instrument Serif',serif;font-style:italic;font-size:clamp(22px,3.4vw,32px);color:var(--bone-2);margin:0}
p{color:var(--bone-2)}ul{padding-left:1.1em;color:var(--bone-2)}li{margin:.35em 0}li::marker{color:var(--accent)}
.tags{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.tags li{margin:0;border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:13px;color:var(--bone)}
pre{background:var(--ink-3);border:1px solid var(--line);border-radius:12px;padding:18px 20px;overflow-x:auto;font-size:13.5px;color:var(--bone)}
.note{border-left:2px solid var(--accent);padding:4px 0 4px 16px;color:var(--bone-2)}
.cases{list-style:none;padding:0}.cases li{border-top:1px solid var(--line);padding:16px 0;margin:0}.cases b{color:var(--bone)}
footer{margin-top:72px;padding-top:24px;border-top:1px solid var(--line);font-size:14px;color:var(--bone-3);display:flex;flex-wrap:wrap;gap:8px 20px}
`;

type Head = { lang: string; title: string; description: string; path: string; jsonLd: object; alternates?: string };

function page(h: Head, body: string) {
  const url = `${SITE}${h.path}`;
  return `<!doctype html>
<html lang="${h.lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(h.title)}</title>
<meta name="description" content="${esc(h.description)}" />
<meta name="author" content="${esc(profile.name)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<link rel="canonical" href="${url}" />
${h.alternates ?? ''}
<meta name="theme-color" content="#09090B" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${esc(profile.name)}" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(h.title)}" />
<meta property="og:description" content="${esc(h.description)}" />
<meta property="og:image" content="${OG}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${OG}" />
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@75,800&family=Instrument+Serif:ital@1&family=Geist:wght@400;500&family=Geist+Mono&display=swap" rel="stylesheet" />
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...h.jsonLd })}</script>
</head>
<body>
<main>
${body}
<footer>
<a href="/">${esc(profile.name)}</a>
${profile.links.map((l) => `<a href="${l.href.startsWith('http') ? l.href : '/' + l.href}">${esc(l.label)}</a>`).join('\n')}
<a href="mailto:${profile.email}">${profile.email}</a>
</footer>
</main>
</body>
</html>
`;
}

function casePage(w: Work) {
  const title = `${w.name}: ${w.kind} · ${profile.name}`;
  const others = works.filter((o) => o.id !== w.id);
  const body = `
<div class="top mono"><a href="/">← ${esc(profile.name)} · ${esc(profile.role)}</a><span>${esc(w.index)} / ${String(works.length).padStart(2, '0')} · ${esc(w.year)}</span></div>
<div class="route mono">${esc(w.route)}</div>
<h1>${esc(w.name)}</h1>
<p class="kind">${esc(w.kind)}</p>
<p>${esc(w.summary)}</p>
<h2>O que tem dentro</h2>
<ul>${w.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
<h2>Stack</h2>
<ul class="tags mono">${w.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h2>Trecho</h2>
<pre class="mono"><code>${esc(w.snippet)}</code></pre>
<h2>Status</h2>
<p class="mono">${esc(w.status)}</p>
${w.links?.length ? `<p>${w.links.map((l) => `<a href="${l.href}" rel="noopener">${esc(l.label)} ↗</a>`).join(' · ')}</p>` : ''}
${w.privacy ? `<p class="note">${esc(w.privacy)}</p>` : ''}
<h2>Outros cases</h2>
<ul class="cases">${others.map((o) => `<li><a href="/cases/${o.id}/"><b>${esc(o.name)}</b></a> · ${esc(o.kind)}</li>`).join('')}</ul>
<p><a href="/#cases">Ver o portfólio completo →</a></p>`;

  return page(
    {
      lang: 'pt-BR',
      title,
      description: `${w.name}, ${w.kind.toLowerCase()}, desenvolvido por ${profile.name}. ${w.summary}`.slice(0, 300),
      path: `/cases/${w.id}/`,
      jsonLd: {
        '@graph': [
          person,
          {
            '@type': 'CreativeWork',
            name: w.name,
            headline: title,
            description: w.summary,
            url: `${SITE}/cases/${w.id}/`,
            dateCreated: w.year,
            inLanguage: 'pt-BR',
            author: { '@id': `${SITE}/#davi` },
            keywords: w.stack.join(', '),
            ...(w.links?.[0] ? { sameAs: w.links[0].href } : {}),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: profile.name, item: `${SITE}/` },
              { '@type': 'ListItem', position: 2, name: 'Cases', item: `${SITE}/#cases` },
              { '@type': 'ListItem', position: 3, name: w.name, item: `${SITE}/cases/${w.id}/` },
            ],
          },
        ],
      },
    },
    body,
  );
}

const en: Record<string, { kind: string; summary: string }> = {
  beemov: { kind: 'Multi-tenant ERP + POS SaaS for the beverage market', summary: 'One system serving many stores and distributors, each with isolated data: fast POS sales, margin control, inventory, purchasing and a business dashboard. CI runs 680+ tests before every deploy.' },
  'metup-crm': { kind: 'Sales operating system', summary: 'Runs the whole sales machine (prospecting, calls, follow-ups, meetings, proposals) with the funnel as its backbone, an idempotent ingestion API and outbound events for automations.' },
  confraria: { kind: 'Custom ERP + POS for a liquor store', summary: 'Barcode POS with cash, PIX and card, cash register sessions, inventory, suppliers and reports, replacing a rented legacy system.' },
  sementinhas: { kind: 'Daycare management system', summary: 'Attendance, daily agenda and messages from the phone, pickup authorization treated as security data, LGPD-compliant permissions and audit trail.' },
  financeiro: { kind: 'Multi-unit finance for distributors', summary: 'Payables, receivables, cash flow and budgets across business units, with per-unit permissions, sessions panel and audit trail.' },
  'wedding-planner': { kind: 'Wedding budget calculator', summary: 'An ASP.NET Core API that splits a wedding budget across vendors using fixed, per-guest, percentage and weighted cost strategies.' },
  xadrez: { kind: 'Chess engine in C# for the terminal', summary: 'A full chess game on a rules engine written from scratch: castling, en passant, promotion, check and checkmate. Zero dependencies.' },
  caulim: { kind: 'Porcelain studio · WebGL experience', summary: 'A WebGL vase goes through the whole studio process as you scroll: throwing, drying, glazing and firing, with custom GLSL shaders.' },
  folego: { kind: 'Freediving school · scroll as depth', summary: 'Scrolling the page is diving into the sea: light and pressure are mapped to depth, with bioluminescent particles in shaders.' },
};

function enPage() {
  const description = `${profile.name} is a Brazilian full-stack developer focused on C# / .NET back-end: ASP.NET Core APIs, Clean Architecture, DDD, EF Core, PostgreSQL, React and Three.js.`;
  const body = `
<div class="top mono"><a href="/" hreflang="pt-BR">← Português</a><span>Brazil · remote</span></div>
<div class="route mono">GET /en HTTP/2</div>
<h1>Davi Maximo Quoos</h1>
<p class="kind">Full-stack developer · C# / .NET back-end</p>
<p>I write the part of software nobody sees. And it's the part that can't go down.</p>
<p>${esc(description)} I ship production systems running on real customer data: multi-tenant ERP + POS SaaS, a sales CRM, daycare management and multi-unit finance.</p>
<h2>Stack</h2>
<ul class="tags mono">${marquee.map((s) => `<li>${esc(s)}</li>`).join('')}<li>Clean Architecture</li><li>DDD</li><li>CQRS</li></ul>
<h2>Selected work</h2>
<ul class="cases">${works
    .map((w) => `<li><a href="/cases/${w.id}/" hreflang="pt-BR"><b>${esc(w.name)}</b></a> · ${esc(en[w.id]?.kind ?? w.kind)}<br />${esc(en[w.id]?.summary ?? '')}${w.links?.[0] ? ` <a href="${w.links[0].href}" rel="noopener">${esc(w.links[0].label)} ↗</a>` : ''}</li>`)
    .join('')}</ul>
<p class="note">Production systems hold real customer data, so they have no public link. Happy to demo them on a call.</p>
<h2>Contact</h2>
<p><a href="mailto:${profile.email}">${profile.email}</a> · <a href="/">Interactive portfolio (WebGL) →</a></p>`;

  return page(
    {
      lang: 'en',
      title: `${profile.name} | Full-stack Developer · C# / .NET Back-end`,
      description,
      path: '/en/',
      alternates: `<link rel="alternate" hreflang="pt-BR" href="${SITE}/" />\n<link rel="alternate" hreflang="en" href="${SITE}/en/" />\n<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
      jsonLd: {
        '@graph': [
          {
            ...person,
            jobTitle: 'Full-stack Developer · C# / .NET Back-end',
            description,
            knowsAbout: [...marquee, 'Clean Architecture', 'Domain-Driven Design', 'CQRS'],
          },
          { '@type': 'ProfilePage', url: `${SITE}/en/`, inLanguage: 'en', mainEntity: { '@id': `${SITE}/#davi` } },
        ],
      },
    },
    body,
  );
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const alt = `\n    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/en/" />`;
  const urls = [
    `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>${alt}\n    <image:image><image:loc>${SITE}/media/davi.webp</image:loc></image:image>\n  </url>`,
    `  <url>\n    <loc>${SITE}/en/</loc>\n    <lastmod>${today}</lastmod>${alt}\n  </url>`,
    ...works.map((w) => `  <url>\n    <loc>${SITE}/cases/${w.id}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`),
    `  <url>\n    <loc>${SITE}/${profile.resume}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

export function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    apply: 'build',
    generateBundle() {
      for (const w of works) this.emitFile({ type: 'asset', fileName: `cases/${w.id}/index.html`, source: casePage(w) });
      this.emitFile({ type: 'asset', fileName: 'en/index.html', source: enPage() });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
    },
  };
}
