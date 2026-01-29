import React from 'react';
import { LayoutDashboard, FileText, Settings, UserCircle, HardHat, Book, ChevronRight, ChevronLeft, Scale } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'dashboard': return '案源需求管理';
      case 'templates': return '建工场景模型库';
      case 'generator': return '智能内容生成';
      case 'knowledge': return '律所品牌资产 (GEO)';
      case 'factAnalysis': return '建工案件事实梳理';
      default: return '工作台';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar - Premium Dark Style */}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-slate-300 flex flex-col shadow-2xl relative z-20 transition-all duration-300 ease-in-out`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-9 bg-amber-600 text-white p-1 rounded-full shadow-lg hover:bg-amber-700 transition-colors z-30"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-8 pb-6 border-b border-slate-800/50 ${isCollapsed ? 'px-4 items-center flex flex-col' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center mb-0' : 'space-x-3 mb-1'}`}>
            <div className="p-2 bg-amber-600 rounded-lg shadow-lg shadow-amber-900/20 shrink-0">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xs font-medium tracking-[0.2em] text-amber-600 uppercase whitespace-nowrap">正己律所</span>
            )}
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-serif text-white tracking-wide mt-3 whitespace-nowrap overflow-hidden">AI 建工营销中台</h1>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-hidden">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="工作台"
            isActive={activeView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
            isCollapsed={isCollapsed}
          />

          <div className={`mt-8 mb-3 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'}`}>
            {!isCollapsed ? (
              <>
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 whitespace-nowrap">知识库</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </>
            ) : (
              <div className="h-px w-6 bg-slate-800"></div>
            )}
          </div>

          <NavItem
            icon={<Book size={20} />}
            label="品牌资产库 (GEO)"
            isActive={activeView === 'knowledge'}
            onClick={() => onNavigate('knowledge')}
            isCollapsed={isCollapsed}
          />

          <div className={`mt-8 mb-3 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'}`}>
            {!isCollapsed ? (
              <>
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 whitespace-nowrap">工具</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </>
            ) : (
              <div className="h-px w-6 bg-slate-800"></div>
            )}
          </div>

          <NavItem
            icon={<Scale size={20} />}
            label="事实梳理"
            isActive={activeView === 'factAnalysis'}
            onClick={() => onNavigate('factAnalysis')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<FileText size={20} />}
            label="场景模型库"
            isActive={activeView === 'templates'}
            onClick={() => onNavigate('templates')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="系统设置"
            isActive={false}
            disabled
            isCollapsed={isCollapsed}
          />
        </nav>

        <div className={`p-6 border-t border-slate-800/50 bg-slate-950/30 ${isCollapsed ? 'items-center justify-center flex' : ''}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-slate-800 p-2 rounded-full shrink-0">
              <UserCircle size={20} className="text-slate-400" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">管理员</p>
                <div className="flex items-center mt-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                  <p className="text-xs text-slate-500 truncate">GEO 引擎运行中</p>
                </div>
              </div>
            )}
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

const NavItem = ({ icon, label, isActive, onClick, disabled = false, isCollapsed = false }: any) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    title={isCollapsed ? label : ''}
    className={`group flex items-center space-x-3 rounded-lg transition-all duration-200 ${isCollapsed
      ? 'w-10 h-10 justify-center p-0 mx-auto'
      : 'w-full px-4 py-3'
      } ${isActive
        ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'
        : disabled
          ? 'text-slate-600 cursor-not-allowed opacity-50'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
  >
    <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
      {icon}
    </span>
    {!isCollapsed && (
      <span className="font-medium text-sm tracking-wide whitespace-nowrap">{label}</span>
    )}
  </button>
);

export default Layout;
