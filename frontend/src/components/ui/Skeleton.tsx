// Skeleton loader components — glassmorphism (CLAUDE.md §11)

export function SkeletonCard() {
  return (
    <div
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 animate-pulse"
    >
      <div className="h-4 bg-white/[0.06] rounded mb-3 w-2/3" />
      <div className="h-3 bg-white/[0.04] rounded mb-2" />
      <div className="h-3 bg-white/[0.04] rounded w-1/2" />
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl h-24 animate-pulse"
        />
      ))}
    </div>
  );
}

export function SkeletonChallengeList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
