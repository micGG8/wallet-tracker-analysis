import { PlusCircle, BarChart3, PieChart, History } from 'lucide-react';

export type View = 'add' | 'outlook' | 'analysis' | 'history';

interface BottomNavProps {
  view: View;
  onChange: (view: View) => void;
}

export function BottomNav({ view, onChange }: BottomNavProps) {
  const items: { id: View; label: string; icon: typeof PlusCircle }[] = [
    { id: 'add', label: 'Inserisci', icon: PlusCircle },
    { id: 'outlook', label: 'Outlook', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: PieChart },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigazione principale"
    >
      <div className="mx-auto flex max-w-md py-1">
        {items.map((item) => {
          const active = view === item.id;
          const IconCmp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className="group relative flex flex-1 flex-col items-center gap-1 py-2 outline-none"
            >
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 group-active:scale-95'
                }`}
              >
                <IconCmp size={18} strokeWidth={2.2} />
              </span>
              <span
                className={`text-[10px] font-medium leading-tight transition-colors duration-200 ${
                  active ? 'text-brand-700 font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
