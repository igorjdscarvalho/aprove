// Esqueleto do perfil enquanto o feed carrega (1.13).
export function ProfileSkeleton() {
  const bar = 'animate-pulse rounded bg-surface';
  return (
    <div role="status" aria-label="Carregando perfil" className="mx-auto w-full max-w-profile px-4 pt-6">
      <div className="mb-6 flex items-center gap-5">
        <div className="aspect-square w-[clamp(78px,18vw,150px)] flex-none animate-pulse rounded-full bg-surface" />
        <div className="flex-1 space-y-3">
          <div className={`${bar} h-5 w-40`} />
          <div className={`${bar} h-4 w-full max-w-xs`} />
          <div className={`${bar} h-4 w-48`} />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-[3px]">
        {Array.from({ length: 9 }, (_, k) => (
          <div key={k} className="aspect-[3/4] animate-pulse bg-surface" />
        ))}
      </div>
    </div>
  );
}
