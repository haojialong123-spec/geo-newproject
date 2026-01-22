import React from 'react';
import { LayoutDashboard, FileText, Settings, UserCircle, HardHat, Book } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const getHeaderTitle = () => {
    switch (activeView) {
      case 'dashboard': return '案源需求管理';
      case 'templates': return '建工场景模型库';
      case 'generator': return '智能内容生成';
      case 'knowledge': return '律所品牌资产 (GEO)';
      default: return '工作台';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar - Premium Dark Style */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl relative z-20">
        <div className="p-8 pb-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2 bg-amber-600 rounded-lg shadow-lg shadow-amber-900/20">
                <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium tracking-[0.2em] text-amber-600 uppercase">ZhengJi Law</span>
          </div>
          <h1 className="text-xl font-serif text-white tracking-wide mt-3">AI 建工营销中台</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="工作台" 
            isActive={activeView === 'dashboard'} 
            onClick={() => onNavigate('dashboard')} 
          />
          
          <div className="mt-8 mb-3 px-4 flex items-center">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Knowledge</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>
          
          <NavItem 
            icon={<Book size={18} />} 
            label="品牌资产库 (GEO)" 
            isActive={activeView === 'knowledge'} 
            onClick={() => onNavigate('knowledge')} 
          />

          <div className="mt-8 mb-3 px-4 flex items-center">
             <div className="h-px bg-slate-800 flex-1"></div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Tools</span>
             <div className="h-px bg-slate-800 flex-1"></div>
          </div>

           <NavItem 
            icon={<FileText size={18} />} 
            label="场景模型库" 
            isActive={activeView === 'templates'} 
            onClick={() => onNavigate('templates')} 
          />
           <NavItem 
            icon={<Settings size={18} />} 
            label="系统设置" 
            isActive={false} 
            disabled
          />
        </nav>

        <div className="p-6 border-t border-slate-800/50 bg-slate-950/30">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-2 rounded-full">
                <UserCircle size={20} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <div className="flex items-center mt-1">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                 <p className="text-xs text-slate-500">GEO Engine Active</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-10 sticky top-0 z-10 transition-all">
          <div>
              <h2 className="text-2xl text-slate-800 font-serif font-medium tracking-tight">
                {getHeaderTitle()}
              </h2>
          </div>
          <div className="text-xs font-medium text-slate-400 font-mono">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </header>
        <div className="p-10 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick, disabled = false }: any) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
          : disabled 
            ? 'text-slate-600 cursor-not-allowed opacity-50'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
          {icon}
      </span>
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </button>
);

export default Layout;
