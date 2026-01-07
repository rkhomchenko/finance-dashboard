import { useState, useEffect } from 'react';
import { LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'bg-sidebar flex flex-col min-h-screen transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-48'
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-sidebar border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-sidebar/90 z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn('p-4 flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">F</span>
        </div>
        {!collapsed && <span className="text-white font-semibold">Finance</span>}
      </div>

      <nav className={cn('flex-1 py-4', collapsed ? 'px-2' : 'px-3')}>
        <a
          href="#"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg',
            'bg-white/10 text-white',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Dashboard</span>}
        </a>
      </nav>
    </aside>
  );
}
