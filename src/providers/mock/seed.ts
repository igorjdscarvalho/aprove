import { addMonths, todayMonthKey } from '@/lib/dates';
import type { ApprovalStatus, AspectRatio, Media, Post, PostType, Review } from '@/types/domain';

export interface MockClient {
  id: string;
  slug: string;
  name: string;
  username: string;
  bio: string;
  category: string;
  website: string;
  avatar_path: string | null;
  followers_count: number;
  following_count: number;
  status: 'unpublished' | 'published' | 'archived';
  password: string;
}

export interface MockPost extends Post {
  client_id: string;
  is_visible: boolean;
}

export interface MockState {
  v: number;
  clients: MockClient[];
  posts: MockPost[];
}

export const MOCK_VERSION = 3;
export const DEMO_SLUG = 'demo-marca-abc123';
export const DEMO_PASSWORD = 'demo1234';
export const MOCK_CLIENT_SLUGS = [DEMO_SLUG, 'cafe-brasa-x9k2m1'] as const;

/** Imagem fictícia (SVG em data URI): gradiente + rótulo. Sem arquivos externos. */
export function fakeImage(label: string, w: number, h: number, hue: number): string {
  const h2 = (hue + 50) % 360;
  const fs = Math.round(Math.min(w, h) / 11);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},72%,58%)"/><stop offset="1" stop-color="hsl(${h2},68%,42%)"/>` +
    `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<circle cx="${w * 0.78}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.16}" fill="rgba(255,255,255,.18)"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#fff" ` +
    `font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="${fs}">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function avatar(letter: string, hue: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(${hue},60%,45%)"/>` +
    `<text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Helvetica,Arial,sans-serif" ` +
    `font-weight="700" font-size="140">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SIZE: Record<AspectRatio, [number, number]> = {
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '1.91:1': [1080, 565],
  '9:16': [1080, 1920],
};

let seq = 0;
const nid = (p: string) => `${p}-${++seq}`;

interface PostSpec {
  type: PostType;
  month: string;
  day: number;
  time?: string;
  ratio?: AspectRatio;
  slides?: number;
  status?: ApprovalStatus;
  caption?: string;
  visible?: boolean;
  hue: number;
  cropY?: number;
  reviews?: Omit<Review, 'created_at'>[];
  daysAgo?: number;
}

function build(clientId: string, s: PostSpec, n: number): MockPost {
  const ratio: AspectRatio = s.type === 'reel' || s.type === 'story' ? '9:16' : (s.ratio ?? '4:5');
  const [w, h] = SIZE[ratio];
  const count = s.type === 'carousel' ? (s.slides ?? 3) : 1;
  const tag = s.type === 'image' ? 'Imagem' : s.type === 'carousel' ? 'Carrossel' : s.type === 'reel' ? 'Reels' : 'Story';
  const id = nid('p');
  const media: Media[] = [];
  for (let i = 0; i < count; i++) {
    const label = `${tag} ${n}${count > 1 ? ` · ${i + 1}/${count}` : ''} · ${ratio}`;
    const img = fakeImage(label, w, h, (s.hue + i * 18) % 360);
    media.push(
      s.type === 'reel'
        ? {
            id: nid('m'),
            position: i,
            kind: 'video',
            path: '', // vídeo simulado pelo player (Etapa 2d); com mídia real virá do Storage
            poster_path: img,
            width: w,
            height: h,
            duration: 18,
          }
        : { id: nid('m'), position: i, kind: 'image', path: img, poster_path: null, width: w, height: h, duration: null },
    );
  }
  const date = `${s.month}-${String(s.day).padStart(2, '0')}`;
  const reviews: Review[] = (s.reviews ?? []).map((r, i) => ({
    ...r,
    created_at: new Date(Date.UTC(+s.month.slice(0, 4), +s.month.slice(5, 7) - 1, s.day, 12 + i)).toISOString(),
  }));
  return {
    id,
    client_id: clientId,
    type: s.type,
    caption: s.caption ?? '',
    location: s.type === 'story' ? '' : 'Presidente Prudente, SP',
    audio_name: s.type === 'reel' ? 'Áudio original' : '',
    scheduled_date: date,
    scheduled_time: s.time ?? null,
    approval_status: s.status ?? 'pending',
    revision: reviews.some((r) => r.decision === 'changes_requested') ? 2 : 1,
    aspect_ratio: ratio,
    cover_path: s.type === 'reel' ? media[0].poster_path : null,
    grid_crop_x: 50,
    grid_crop_y: s.cropY ?? 50,
    story_seconds: 5,
    media,
    reviews,
    is_visible: s.visible ?? true,
  };
}

export function buildSeed(): MockState {
  seq = 0;
  const cur = todayMonthKey();
  const prev = addMonths(cur, -1);
  const next = addMonths(cur, 1);

  const clients: MockClient[] = [
    {
      id: 'c-1',
      slug: DEMO_SLUG,
      name: 'Studio Aurora',
      username: 'studioaurora',
      bio: 'Conteúdo que conecta marcas e pessoas ✨\nCliente de demonstração',
      category: 'Agência de marketing',
      website: 'studioaurora.example.com',
      avatar_path: avatar('A', 265),
      followers_count: 12400,
      following_count: 318,
      status: 'published',
      password: DEMO_PASSWORD,
    },
    {
      id: 'c-2',
      slug: 'cafe-brasa-x9k2m1',
      name: 'Café Brasa',
      username: 'cafebrasa',
      bio: 'Cafeteria de especialidade ☕',
      category: 'Cafeteria',
      website: '',
      avatar_path: avatar('C', 25),
      followers_count: 3200,
      following_count: 410,
      status: 'unpublished',
      password: 'cafe2026',
    },
  ];

  const adj = {
    decision: 'changes_requested' as const,
    comment: 'Podemos deixar o texto da arte maior e trocar a cor do fundo para algo mais quente?',
    reviewer_name: 'Marina',
    revision: 1,
  };
  const ok = { decision: 'approved' as const, comment: '', reviewer_name: 'Marina', revision: 1 };

  const specs: PostSpec[] = [
    // mês anterior
    { type: 'image', month: prev, day: 3, ratio: '4:5', status: 'approved', hue: 200, caption: 'Começando o mês com tudo! #novidade #studioaurora', reviews: [ok] },
    { type: 'carousel', month: prev, day: 7, slides: 3, status: 'approved', hue: 150, caption: 'Três jeitos de organizar sua semana de conteúdo 👇', reviews: [ok] },
    { type: 'reel', month: prev, day: 10, status: 'approved', hue: 330, caption: 'Bastidores da sessão de fotos 🎬 #bastidores', reviews: [ok] },
    { type: 'image', month: prev, day: 15, ratio: '1:1', status: 'approved', hue: 40, caption: 'Quadrado perfeito. @studioaurora', reviews: [ok] },
    { type: 'image', month: prev, day: 21, ratio: '1.91:1', status: 'changes_requested', hue: 10, caption: 'Formato paisagem para o convite do evento.', reviews: [adj] },
    { type: 'reel', month: prev, day: 27, status: 'pending', hue: 280, caption: 'Resumo do mês em 15 segundos ✨' },
    // mês atual
    { type: 'image', month: cur, day: 2, ratio: '4:5', status: 'pending', hue: 215, caption: 'Nova semana, novas ideias. Qual delas você vai testar primeiro?\n\n#marketing #conteudo #instagram' },
    { type: 'image', month: cur, day: 5, ratio: '1:1', status: 'approved', hue: 95, caption: 'Promoção especial só até domingo! Link na bio.', reviews: [ok] },
    { type: 'carousel', month: cur, day: 8, slides: 5, status: 'pending', hue: 260, caption: 'Guia rápido: 5 passos para planejar o seu mês de posts. Arraste para o lado e salve para consultar depois. Se tiver dúvida, chame a gente no direct.\n\n#planejamento #socialmedia' },
    { type: 'reel', month: cur, day: 11, status: 'pending', hue: 350, caption: 'Teste de Reels: como fica o recorte da capa na grade?', cropY: 40 },
    { type: 'reel', month: cur, day: 14, status: 'changes_requested', hue: 20, caption: 'Tutorial rápido de edição 🎞️', reviews: [adj] },
    { type: 'image', month: cur, day: 18, ratio: '1.91:1', status: 'pending', hue: 175, caption: 'Banner do evento de lançamento.' },
    { type: 'carousel', month: cur, day: 22, slides: 4, status: 'approved', hue: 120, caption: 'Resultados do trimestre em 4 slides.', reviews: [ok] },
    { type: 'image', month: cur, day: 26, ratio: '4:5', status: 'changes_requested', hue: 300, caption: 'Prévia da campanha de fim de ano 🎄', reviews: [adj] },
    // rascunho oculto (não deve aparecer para o cliente)
    { type: 'image', month: cur, day: 28, ratio: '4:5', status: 'pending', hue: 0, visible: false, caption: 'RASCUNHO: não deve aparecer para o cliente.' },
    // próximo mês
    { type: 'image', month: next, day: 4, ratio: '4:5', status: 'pending', hue: 230, caption: 'Primeiro post do próximo mês.' },
    { type: 'carousel', month: next, day: 12, slides: 3, status: 'pending', hue: 70, caption: 'Calendário de datas comemorativas.' },
    { type: 'reel', month: next, day: 19, status: 'pending', hue: 310, caption: 'Teaser da campanha.' },
    // stories do mês atual
    { type: 'story', month: cur, day: 3, status: 'pending', hue: 190 },
    { type: 'story', month: cur, day: 6, status: 'approved', hue: 100, reviews: [ok] },
    { type: 'story', month: cur, day: 12, status: 'pending', hue: 330 },
    { type: 'story', month: cur, day: 20, status: 'changes_requested', hue: 45, reviews: [adj] },
  ];

  const posts = specs.map((s, i) => build('c-1', s, i + 1));

  posts.push(
    build('c-2', { type: 'image', month: cur, day: 9, ratio: '4:5', hue: 30, caption: 'Café coado do dia ☕' }, 1),
    build('c-2', { type: 'carousel', month: cur, day: 16, slides: 3, hue: 15, caption: 'Nosso cardápio.' }, 2),
  );

  return { v: MOCK_VERSION, clients, posts };
}
