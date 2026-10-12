import { principles, profile, works } from '../content';

/**
 * O "servidor" do terminal: comandos exatos + intenção em linguagem natural.
 * Cada resposta é uma lista de linhas; efeitos colaterais vão em `effect`.
 */

export type LineKind = 'out' | 'dim' | 'ok' | 'err' | 'accent' | 'link';
export type OutLine = { kind: LineKind; text: string; href?: string };
export type Effect = { type: 'clear' } | { type: 'open-case'; id: string } | { type: 'glitch' } | { type: 'scroll'; id: string };
export type Reply = { lines: OutLine[]; effect?: Effect };

const o = (text: string, kind: LineKind = 'out'): OutLine => ({ kind, text });
const link = (text: string, href: string): OutLine => ({ kind: 'link', text, href });

const contact = (): OutLine[] => [
  o('Canal aberto. Escolha o protocolo:', 'dim'),
  link(`  mail      → ${profile.email}`, `mailto:${profile.email}`),
  ...profile.links.map((l) =>
    link(
      `  ${l.label.toLowerCase().padEnd(10)}→ ${'download' in l && l.download ? 'baixar PDF' : l.href.replace(/^https?:\/\//, '')}`,
      l.href,
    ),
  ),
];

const COMMANDS: Record<string, { help?: string; run: (args: string[]) => Reply }> = {
  help: {
    help: 'lista os comandos',
    run: () => ({
      lines: [
        o('Comandos disponíveis (ou só escreva como numa conversa):', 'dim'),
        ...Object.entries(COMMANDS)
          .filter(([, c]) => c.help)
          .map(([k, c]) => o(`  ${k.padEnd(16)} ${c.help}`)),
      ],
    }),
  },
  whoami: {
    help: 'quem responde aqui',
    run: () => ({
      lines: [
        o(profile.name, 'accent'),
        o(`${profile.role} com foco em ${profile.focus}.`),
        o('Construo APIs, regras de negócio e dados que não se perdem. E subo até a interface quando precisa.'),
        o(`${profile.location} · UTC−3`, 'dim'),
      ],
    }),
  },
  stack: {
    help: 'o que eu uso todo dia',
    run: () => ({
      lines: [
        o('backend   C# · .NET · ASP.NET Core · EF Core · PostgreSQL', 'out'),
        o('runtime   SignalR · Hangfire · FluentValidation · xUnit', 'out'),
        o('front     React · TypeScript · Three.js · GSAP', 'out'),
        o('infra     Docker · migrations versionadas · webhooks idempotentes', 'out'),
        o('// arquitetura: Clean Architecture, dependências apontando para dentro', 'dim'),
      ],
    }),
  },
  cases: {
    help: 'projetos (use: open <id>)',
    run: () => {
      const pad = Math.max(...works.map((w) => w.id.length)) + 2;
      return {
        lines: [
          ...works.map((w) => o(`  ${w.index}  ${w.id.padEnd(pad)} ${w.name} · ${w.kind}`)),
          o('dica: open beemov · no ar: digite live', 'dim'),
        ],
      };
    },
  },
  live: {
    help: 'o que dá pra abrir agora',
    run: () => ({
      lines: [
        o('Respondendo 200 em produção:', 'dim'),
        ...works.flatMap((w) => (w.links ?? []).map((l) => link(`  ${w.name.padEnd(16)} → ${l.label}`, l.href))),
      ],
    }),
  },
  open: {
    run: ([id]) => {
      const w = works.find((x) => x.id === id || x.name.toLowerCase() === id);
      if (!w) return { lines: [o(`open: caso '${id ?? ''}' não encontrado. Tente: cases`, 'err')] };
      return { lines: [o(`→ abrindo ${w.route}`, 'ok')], effect: { type: 'open-case', id: w.id } };
    },
  },
  contato: { help: 'como falar comigo', run: () => ({ lines: contact() }) },
  cv: {
    help: 'baixar meu currículo (PDF)',
    run: () => ({
      lines: [o('Currículo 2026 · PDF', 'accent'), link('  → baixar Davi_Maximo_Quoos_-_Curriculo_2026.pdf', profile.resume)],
    }),
  },
  whatsapp: {
    run: () => ({ lines: [o('Direto no WhatsApp:', 'dim'), link(`  → wa.me/${profile.whatsapp}`, `https://wa.me/${profile.whatsapp}`)] }),
  },
  status: {
    help: 'disponibilidade',
    run: () => ({
      lines: profile.available
        ? [o('● disponível para novos projetos e conversas.', 'ok'), o('digite: contato', 'dim')]
        : [o('○ agenda cheia no momento, mas e-mail sempre é lido.', 'dim')],
    }),
  },
  'sudo contratar': {
    help: 'você sabe o que fazer',
    run: () => ({
      lines: [o('[sudo] senha para visitante: ••••••••', 'dim'), o('Permissão concedida ✓', 'ok'), ...contact()],
    }),
  },
  ls: { run: () => ({ lines: [o('Davi.cs   cases/   stack.json   contato.txt')] }) },
  cat: {
    run: ([f]) => {
      const file = (f ?? '').toLowerCase();
      if (file === 'davi.cs') return { lines: principles.map((p) => o(`// ${p.k} ${p.v}`, 'dim')), effect: { type: 'scroll', id: 'davi-cs' } };
      if (file === 'stack.json') return COMMANDS.stack.run([]);
      if (file === 'contato.txt') return COMMANDS.contato.run([]);
      if (file.startsWith('cases')) return { lines: [o('cat: cases/: é um diretório. Tente: cases', 'err')] };
      return { lines: [o(`cat: ${f ?? ''}: arquivo não encontrado`, 'err')] };
    },
  },
  ping: { run: () => ({ lines: [o('pong · 1ms · 0% de perda', 'ok')] }) },
  date: {
    run: () => ({
      lines: [o(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'medium', timeZone: profile.timezone }).format(new Date()))],
    }),
  },
  'dotnet --version': { run: () => ({ lines: [o('10.0 · C# 14 · e contando')] }) },
  cafe: { run: () => ({ lines: [o('HTTP 418: I\'m a teapot.', 'accent'), o('Mas topo um café numa call. digite: contato', 'dim')] }) },
  echo: { run: (args) => ({ lines: [o(args.join(' '))] }) },
  clear: { help: 'limpa a tela', run: () => ({ lines: [], effect: { type: 'clear' } }) },
  exit: { run: () => ({ lines: [o('Não existe saída daqui.', 'dim'), o('Mas existe e-mail:', 'dim'), ...contact().slice(1, 2)] }) },
  'rm -rf /': { run: () => ({ lines: [o('Negado. Este servidor tem backup. E migrations versionadas.', 'err')] }) },
  matrix: { run: () => ({ lines: [o('Wake up, visitante…', 'accent')], effect: { type: 'glitch' } }) },
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[?!.]+$/g, '')
    .trim();

/** intenção em linguagem natural → comando */
const INTENTS: [RegExp, string][] = [
  [/\b(curriculo|curriculum|resume|cv\b)/, 'cv'],
  [/\b(whats|zap|celular|telefone)/, 'whatsapp'],
  [/\b(contrat|orcament|freela|vaga|hire|job|proposta)/, 'sudo contratar'],
  [/\b(contat|email|e-mail|falar|conversar|whats|linkedin|github|chamar)/, 'contato'],
  [/\b(no ar|online|ao vivo|link|demo|produc)/, 'live'],
  [/\b(projet|case|portfol|trabalho)/, 'cases'],
  [/\b(stack|tecnolog|linguag|ferrament|framework|usa\b|sabe)/, 'stack'],
  [/\b(disponi|livre|agenda)/, 'status'],
  [/\b(quem|sobre|voce|vc|apresent)/, 'whoami'],
  [/\b(cafe|coffee)/, 'cafe'],
  [/\b(ajuda|comando)/, 'help'],
];

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function run(raw: string): Reply {
  const input = normalize(raw);
  if (!input) return { lines: [] };

  if (/^(oi+|ola|opa|hey|eai|e ai|salve|bom dia|boa tarde|boa noite|hello|hi)\b/.test(input)) {
    return {
      lines: [
        o('Olá! Aqui é o servidor do Davi. 👋', 'accent'),
        o('Pode digitar comandos (help) ou perguntar do seu jeito,'),
        o('tipo "quais projetos?" ou "como te contrato?".', 'dim'),
      ],
    };
  }
  if (/(backend|c#|csharp|dotnet|\.net)/.test(input) && !COMMANDS[input]) {
    return {
      lines: [
        o('Backend é a minha casa.', 'accent'),
        o('C# e .NET para APIs com ASP.NET Core, EF Core sobre PostgreSQL,'),
        o('jobs em segundo plano, tempo real com SignalR e domínio protegido por Clean Architecture.'),
        o('quer ver na prática? role até /pipeline ou digite: cases', 'dim'),
      ],
    };
  }

  const exact = COMMANDS[input];
  if (exact) return exact.run([]);
  const [head, ...args] = input.split(/\s+/);
  if (COMMANDS[head]) return COMMANDS[head].run(args);

  for (const [re, cmd] of INTENTS) if (re.test(input)) return COMMANDS[cmd].run([]);

  const names = Object.keys(COMMANDS);
  const best = names.map((n) => [n, lev(head, n)] as const).sort((a, b) => a[1] - b[1])[0];
  if (best && best[1] <= 2) return { lines: [o(`comando não encontrado: ${head}`, 'err'), o(`você quis dizer “${best[0]}”?`, 'dim')] };
  return {
    lines: [o(`404: não entendi “${raw.trim()}”.`, 'err'), o('Sou só um terminal, mas aprendo rápido: tente help.', 'dim')],
  };
}

export const SUGGESTIONS = ['help', 'whoami', 'stack', 'cases', 'cv', 'quero te contratar'];
