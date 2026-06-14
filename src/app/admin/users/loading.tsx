export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-56 rounded-lg bg-white/[0.06]" />
      <div className="h-4 w-80 max-w-full rounded bg-white/[0.04]" />
      <div className="h-10 max-w-md rounded-lg bg-white/[0.05]" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
