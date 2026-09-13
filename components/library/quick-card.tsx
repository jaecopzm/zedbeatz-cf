export function QuickCard({ 
  icon, 
  gradient, 
  label, 
  count, 
  onClick 
}: { 
  icon: React.ReactNode; 
  gradient: string; 
  label: string; 
  count: number; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded p-4 text-left active:scale-95 transition-transform bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute -bottom-3 -right-3 opacity-20">
        {icon && <div className="scale-[2.5]">{icon}</div>}
      </div>
      <div className="relative z-10">
        <div className="mb-3">{icon}</div>
        <p className="font-bold text-sm text-foreground leading-tight">{label}</p>
        <p className="text-foreground/60 text-xs mt-0.5">{count} tracks</p>
      </div>
    </button>
  );
}
