// Constantes que imitam o Instagram. Ficam aqui para serem fáceis de ajustar (seção 8.1 do plano).
export const IG = {
  FEED_RATIOS: { '1:1': 1, '4:5': 4 / 5, '1.91:1': 1.91 },
  REEL_STORY_RATIO: 9 / 16,
  GRID_TILE_RATIO: 3 / 4,
  CAPTION_MAX: 2200,
  CAPTION_COLLAPSED_CHARS: 125,
  CAROUSEL_MAX_ITEMS: 20,
  STORY_DEFAULT_SECONDS: 5,
  IMAGE_MAX_LONG_SIDE: 2160,
  VIDEO_MAX_MB: 50,
} as const;
