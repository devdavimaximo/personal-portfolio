export const profile = {
  name: 'Davi Maximo Quoos',
  first: 'Davi',
  role: 'Desenvolvedor fullstack',
  focus: 'backend C# / .NET',
  email: 'devdavimaximo@gmail.com',
  location: 'Brasil',
  timezone: 'America/Sao_Paulo',
  available: true,
  whatsapp: '5551995204679',
  resume: 'media/Davi_Maximo_Quoos_-_Curriculo_2026.pdf',
  links: [
    { label: 'WhatsApp', href: 'https://wa.me/5551995204679' },
    { label: 'GitHub', href: 'https://github.com/devdavimaximo' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/davimaximoquoos' },
    { label: 'Currículo', href: 'media/Davi_Maximo_Quoos_-_Curriculo_2026.pdf', download: true },
  ],
};

export const hero = {
  kicker: 'Backend C# · Fullstack',
  lines: ['Davi', 'Maximo', 'Quoos'],
  lede: 'Eu escrevo a parte do software que ninguém vê.',
  ledeAccent: 'E é ela que não pode cair.',
  hint: 'passe o mouse no retrato para descompilar',
  hintTouch: 'deslize o dedo no retrato para descompilar',
};

export const manifesto =
  'Interface é promessa. Backend é quem cumpre. Cada clique bonito depende de uma regra que não mente, de um dado que não se perde e de uma API que responde igual às três da manhã e no pico da Black Friday. É nessa camada que eu moro, e é dela que eu subo até o pixel.';

export type Stage = {
  id: string;
  name: string;
  title: string;
  code: string;
  body: string;
  tags: string[];
  ms: number;
};

/** A seção "Anatomia de uma requisição": cada estágio é um portal no túnel 3D. */
export const stages: Stage[] = [
  {
    id: 'kestrel',
    name: 'Request',
    title: 'Tudo começa com alguém pedindo algo.',
    code: 'GET /api/davi HTTP/2',
    body: 'Um clique vira um pacote. O Kestrel recebe, abre o contexto e a viagem começa. Daqui até a resposta, cada milissegundo é uma decisão de projeto.',
    tags: ['Kestrel', 'HTTP/2', 'HTTPS'],
    ms: 1,
  },
  {
    id: 'middleware',
    name: 'Middleware',
    title: 'Antes de qualquer regra, a porta.',
    code: 'app.UseAuthentication().UseAuthorization();',
    body: 'Autenticação JWT, políticas de autorização, rate limiting, correlation id nos logs e um tratador global que devolve ProblemDetails em vez de stack trace.',
    tags: ['JWT', 'Policies', 'Rate limit', 'ProblemDetails'],
    ms: 3,
  },
  {
    id: 'endpoint',
    name: 'Endpoint',
    title: 'Contratos claros, sem vazamento.',
    code: 'group.MapGet("/{id:guid}", GetById.Handle);',
    body: 'Minimal APIs ou Controllers, versionadas e documentadas em OpenAPI. DTOs na borda, o domínio nunca é serializado direto para fora.',
    tags: ['Minimal APIs', 'OpenAPI', 'Versionamento'],
    ms: 2,
  },
  {
    id: 'application',
    name: 'Application',
    title: 'Um caso de uso por vez.',
    code: 'await dispatcher.Send(new LogCall(dealId, Outcome.Answered), ct);',
    body: 'Comandos e consultas separados, validação com FluentValidation antes de tocar em qualquer coisa, transação explícita e idempotência para quem pode reenviar.',
    tags: ['CQRS', 'FluentValidation', 'Idempotência'],
    ms: 6,
  },
  {
    id: 'domain',
    name: 'Domain',
    title: 'O coração não depende de ninguém.',
    code: 'deal.MoveTo(Stage.Proposal, clock.UtcNow);',
    body: 'Entidades ricas, invariantes protegidas, value objects e eventos de domínio. Clean Architecture de verdade: as dependências apontam para dentro, e a regra de negócio não sabe que existe banco.',
    tags: ['DDD', 'Clean Architecture', 'Value Objects'],
    ms: 2,
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    title: 'Onde o dado não pode se perder.',
    code: 'await db.SaveChangesAsync(ct); // decimal, nunca float',
    body: 'EF Core sobre PostgreSQL, migrations versionadas desde o dia um, índices pensados para a consulta real. Jobs em segundo plano, SignalR para tempo real, webhooks com entrega garantida.',
    tags: ['EF Core', 'PostgreSQL', 'Hangfire', 'SignalR'],
    ms: 21,
  },
  {
    id: 'response',
    name: 'Response',
    title: '200 OK. E ninguém percebeu nada.',
    code: 'return TypedResults.Ok(dto);',
    body: 'O melhor backend é invisível: testes com xUnit, logs estruturados, Docker do dev à produção. A resposta volta, a tela pinta e o usuário só sente que funcionou.',
    tags: ['xUnit', 'Docker', 'Observabilidade'],
    ms: 3,
  },
];

export type WorkLink = { label: string; href: string };

export type Work = {
  id: string;
  index: string;
  route: string;
  name: string;
  kind: string;
  year: string;
  summary: string;
  points: string[];
  stack: string[];
  snippet: string;
  status: string;
  links?: WorkLink[];
  /** casos sem link: por que não estão públicos (aparece no caso e no filtro) */
  privacy?: string;
  preview: 'tenants' | 'funnel' | 'receipt' | 'attendance' | 'cashflow' | 'budget' | 'chess' | 'lathe' | 'sonar';
};

export const works: Work[] = [
  {
    id: 'beemov',
    index: '01',
    route: 'GET /cases/beemov',
    name: 'Beemov',
    kind: 'SaaS de ERP + PDV para o mercado de bebidas',
    year: '2026',
    summary:
      'Um único sistema atendendo muitas lojas, distribuidoras e adegas, cada uma com seus dados isolados: venda em poucos cliques no PDV, margem sob controle, estoque, compras e o negócio inteiro num dashboard.',
    points: [
      'Multi-tenant com filtros globais por tenant e escopo de filial',
      'RBAC, bloqueio de módulos por plano e auditoria central via interceptor',
      'PDV com sessão de caixa, promoções, receitas e importação de NF-e de compra',
      'CI com 680+ testes (xUnit + Testcontainers) antes de cada deploy',
    ],
    stack: ['.NET 10', 'ASP.NET Core', 'Clean Architecture', 'MediatR', 'EF Core', 'PostgreSQL', 'React', 'Docker'],
    snippet: `builder.Entity<Sale>()
    .HasQueryFilter(e => e.TenantId == tenantContext!.TenantId);`,
    status: 'No ar · SaaS em evolução contínua',
    privacy: 'SaaS comercial com dados reais de clientes: o acesso exige conta. Demonstração guiada sob pedido.',
    preview: 'tenants',
  },
  {
    id: 'metup-crm',
    index: '02',
    route: 'GET /cases/metup-crm',
    name: 'Metup CRM',
    kind: 'Sistema operacional comercial',
    year: '2026',
    summary:
      'Não é um CRUD de CRM bonito: é o sistema que opera a máquina comercial inteira (prospecção, ligação, follow-up, reunião, proposta, venda), com o funil como espinha e cada contato virando dado.',
    points: [
      'Estágios do funil first-class, com histórico de cada transição',
      'Atividades com desfecho estruturado (enum + timestamp), com métricas calculáveis',
      'API de ingestão idempotente + eventos de saída para automações n8n',
      'Costura multi-tenant desde o dia 1 (OrganizationId em tudo)',
    ],
    stack: ['ASP.NET Core', 'PostgreSQL', 'EF Core', 'SignalR', 'Hangfire', 'React', 'TypeScript'],
    snippet: `public sealed record StageChange(
    Guid DealId, Stage From, Stage To, DateTimeOffset At);`,
    status: 'No ar · V1 em uso pela Metup',
    privacy: 'Ferramenta interna da Metup, com o funil e os contatos comerciais reais: só a equipe tem acesso. Mostro em call.',
    preview: 'funnel',
  },
  {
    id: 'confraria',
    index: '03',
    route: 'GET /cases/confraria',
    name: 'Confraria',
    kind: 'ERP + PDV sob medida para loja de bebidas',
    year: '2026',
    summary:
      'A Confraria das Bebidas trocou um sistema alugado por um sistema próprio: PDV com leitor de código de barras, controle de caixa, estoque e relatórios, com a cara de um produto moderno, não de um software de balcão.',
    points: [
      'PDV com dinheiro, PIX e cartão, CPF na nota e cupom gerencial',
      'Abertura, sangria e fechamento de caixa com cupom de conferência',
      'Estoque com movimentações, entradas, fornecedores e receituários',
      'Imagens de produto no Cloudflare R2, deploy contínuo via GitHub Actions',
    ],
    stack: ['ASP.NET Core', 'CQRS + MediatR', 'EF Core', 'PostgreSQL', 'React', 'TanStack Query'],
    snippet: `public record GetCupomFechamentoCaixaQuery(Guid SessaoId)
    : IRequest<string?>;`,
    status: 'Em produção · operação diária da loja',
    privacy: 'Sistema interno de um cliente, rodando com vendas e caixa reais da loja. O código e o acesso são dele.',
    preview: 'receipt',
  },
  {
    id: 'sementinhas',
    index: '04',
    route: 'GET /cases/sementinhas',
    name: 'Sementinhas',
    kind: 'Sistema de gestão para creche',
    year: '2026',
    summary:
      'Feito para quem cuida de criança, não de software: a equipe registra frequência, agenda diária e recados pelo celular, com uma criança no colo. E a direção enxerga a creche inteira num painel.',
    points: [
      'Crianças, responsáveis, turmas, matrículas, frequência e agenda diária',
      'Autorização de retirada tratada como dado de segurança, com histórico',
      'LGPD: permissão checada no servidor e auditoria de todo acesso sensível',
      'Financeiro com mensalidades e despesas recorrentes, mobile-first',
    ],
    stack: ['ASP.NET Core', 'Identity', 'EF Core', 'PostgreSQL', 'React', 'Tailwind'],
    snippet: `[RequirePermission(Permissions.ChildrenViewPickup)]
await auditLogger.LogAsync(db, nameof(Child), childId, AuditActions.ViewPickup, CurrentUserId);`,
    status: 'Em produção · uso diário da creche',
    privacy: 'Guarda dados de crianças e famílias: pela LGPD, o acesso é restrito à equipe da creche.',
    preview: 'attendance',
  },
  {
    id: 'financeiro',
    index: '05',
    route: 'GET /cases/financeiro',
    name: 'Gestão Financeira',
    kind: 'Financeiro multiunidade para distribuidoras',
    year: '2026',
    summary:
      'Contas a pagar e a receber, fluxo de caixa, verbas e compras de várias unidades num lugar só, com cada pessoa vendo exatamente as unidades e os módulos que lhe cabem.',
    points: [
      'Permissões por unidade, com papel base e exceções por usuário',
      'Fluxo de caixa, calendário financeiro, verbas e alertas',
      'Painel SuperAdmin com sessões ativas e trilha de auditoria',
      'Identity + JWT e rate limiting no login',
    ],
    stack: ['.NET 10', 'ASP.NET Core', 'Identity', 'EF Core', 'PostgreSQL', 'React', 'Recharts'],
    snippet: `IList<UnitPermissionSet> sets = await resolver.ResolveAsync(userId);`,
    status: 'No ar · demo comercial',
    privacy: 'Lida com dados financeiros de empresas: a demo é apresentada em call, não fica aberta.',
    preview: 'cashflow',
  },
  {
    id: 'wedding-planner',
    index: '06',
    route: 'GET /cases/wedding-planner',
    name: 'Wedding Planner',
    kind: 'Calculadora de orçamento de casamento',
    year: '2026',
    summary:
      'O casal informa o orçamento e o número de convidados; a API distribui o dinheiro entre os fornecedores (custo fixo, por convidado, percentual ou por peso) e avisa quando a conta não fecha.',
    points: [
      'Quatro estratégias de custo: fixo, por convidado, percentual e ponderado',
      'O que sobra dos custos fixos é dividido proporcionalmente aos pesos',
      'Serviços podem ser excluídos e o orçamento é recalculado na hora',
      'API ASP.NET Core documentada em Swagger, front React na Vercel',
    ],
    stack: ['ASP.NET Core', 'C#', 'Swagger', 'React', 'Tailwind', 'Vercel'],
    snippet: `decimal cost = (service.Weight / totalWeight) * remainingBudget;`,
    status: 'No ar',
    links: [{ label: 'weddingplannerdn.vercel.app', href: 'https://weddingplannerdn.vercel.app' }],
    preview: 'budget',
  },
  {
    id: 'xadrez',
    index: '07',
    route: 'GET /cases/xadrez',
    name: 'Xadrez Console',
    kind: 'Motor de xadrez em C# no terminal',
    year: '2026',
    summary:
      'Uma partida completa de xadrez jogada no terminal, sobre um motor de regras escrito do zero: movimentos válidos destacados, capturas, xeque e xeque-mate.',
    points: [
      'Roque pequeno e grande, en passant e promoção',
      'Impede qualquer jogada que deixe o próprio rei em xeque',
      'Tabuleiro genérico separado das regras do xadrez',
      'Zero dependências externas: só C# e a biblioteca padrão',
    ],
    stack: ['C#', '.NET 10', 'Orientação a objetos'],
    snippet: `if (estaEmXeque(JogadorAtual))
    throw new TabuleiroExeption("Você não pode se colocar em xeque!");`,
    status: 'Código aberto',
    links: [{ label: 'github.com/devdavimaximo/Xadrez-Console', href: 'https://github.com/devdavimaximo/Xadrez-Console' }],
    preview: 'chess',
  },
  {
    id: 'caulim',
    index: '08',
    route: 'GET /cases/caulim',
    name: 'Caulim',
    kind: 'Ateliê de porcelana · experiência WebGL',
    year: '2026',
    summary:
      'Um vaso em WebGL atravessa o processo inteiro do ateliê enquanto você rola: torno, secagem, esmalte e queima a 1.285 °C. O visitante desenha o próprio perfil e vê a peça nascer.',
    points: [
      'Geometria de torno gerada em tempo real a partir de um perfil',
      'Shaders GLSL próprios para argila, esmalte e forno',
      'Scroll coreografado com GSAP ScrollTrigger + Lenis',
    ],
    stack: ['React', 'Three.js', 'R3F', 'GLSL', 'GSAP'],
    snippet: `const geo = new LatheGeometry(profile, 128);
material.uniforms.uFire.value = progress;`,
    status: 'No ar · site conceitual',
    links: [{ label: 'porcelana.metup.com.br', href: 'https://porcelana.metup.com.br' }],
    preview: 'lathe',
  },
  {
    id: 'folego',
    index: '09',
    route: 'GET /cases/folego',
    name: 'Fôlego',
    kind: 'Escola de apneia · scroll como profundidade',
    year: '2026',
    summary:
      'Rolar a página é descer no mar. A luz muda com a profundidade, a pressão aparece na tipografia e o fôlego do visitante vira o ritmo da narrativa.',
    points: [
      'Profundidade mapeada ao scroll, com luz e cor físicas',
      'Partículas bioluminescentes em shader',
      'Narrativa em capítulos, um por faixa de profundidade',
    ],
    stack: ['React', 'Three.js', 'GLSL', 'GSAP', 'Lenis'],
    snippet: `const depth = progress * MAX_DEPTH; // metros
uniforms.uLight.value = Math.exp(-depth / 18);`,
    status: 'No ar · site conceitual',
    links: [{ label: 'apneia.metup.com.br', href: 'https://apneia.metup.com.br' }],
    preview: 'sonar',
  },
];

/** Davi.cs: digitado conforme a rolagem. */
export const source = `namespace Brasil.Dev;

/// <summary>Fullstack, com o coração no backend.</summary>
public sealed class Davi : IDeveloper
{
    public string Nome => "Davi Maximo Quoos";
    public Foco Foco => Foco.Backend | Foco.Arquitetura;

    public IReadOnlyList<string> Stack =>
    [
        "C#", ".NET", "ASP.NET Core", "EF Core",
        "PostgreSQL", "Docker", "Git",
        "React", "TypeScript", "Three.js", "GSAP"
    ];

    public async Task<Software> ConstruirAsync(Ideia ideia, CancellationToken ct)
    {
        var dominio = await EntenderAsync(ideia, ct);  // primeiro o problema
        var nucleo  = Modelar(dominio);                 // regras sem framework
        return await EntregarAsync(nucleo, testes: true, ct);
    }
}`;

export const principles = [
  { k: 'Dado', v: 'é patrimônio. Migration versionada, dinheiro em decimal, histórico que nunca se apaga.' },
  { k: 'Regra', v: 'mora no domínio. Framework é detalhe; o negócio não pode depender dele.' },
  { k: 'Tela', v: 'é onde tudo isso vira sensação. Por isso eu também desço até o pixel.' },
];

/** filtro da seção de casos: a categoria sai dos dados (tem link ou não) */
export const caseFilters = [
  { id: 'all', label: 'Todos', note: '' },
  { id: 'linked', label: 'Com link', note: 'Abertos para visitar: no ar, públicos ou com código no GitHub.' },
  {
    id: 'production',
    label: 'Em produção',
    note: 'Rodam com dados reais de clientes: empresas, caixas, crianças. Por isso não têm link público; mostro tudo funcionando numa call.',
  },
] as const;

export const marquee = ['C#', '.NET', 'ASP.NET Core', 'EF Core', 'PostgreSQL', 'Docker', 'Git', 'React', 'TypeScript', 'Three.js', 'GSAP'];
