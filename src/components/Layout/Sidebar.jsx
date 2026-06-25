import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import {
  Zap, LayoutDashboard, PlusCircle, History,
  Utensils, Calendar, Trophy, BarChart2,
  FileText, Settings, Menu, ChevronLeft, LogOut,
  Award
} from 'lucide-react';

const Sidebar = () => {
  const { sidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
    { name: 'Log Workout', path: '/log', icon: <PlusCircle size={20} /> },
    { name: 'Training History', path: '/history', icon: <History size={20} /> },
    { name: 'Nutrition Tracker', path: '/nutrition', icon: <Utensils size={20} /> },
    { name: 'Race Planner', path: '/races', icon: <Calendar size={20} /> },
    { name: 'Personal Records', path: '/prs', icon: <Award size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={20} /> },
    { name: 'Weekly Report', path: '/report', icon: <FileText size={20} /> },
  ];

  // Settings is always last
  navItems.push({ name: 'Settings', path: '/settings', icon: <Settings size={20} /> });

  const settings = useSelector(state => state.settings);
  const fullname = settings?.profile?.name || 'Athlete';
  const initials = fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`
      fixed top-0 left-0 h-screen 
      bg-white dark:bg-[#0f172a] 
      border-r border-gray-100 dark:border-gray-800 
      transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] 
      z-50 flex flex-col 
      ${sidebarOpen ? 'w-64' : 'w-20'}
    `}>
      {/* Logo Area */}
      <div className="flex items-center justify-between p-5 h-20">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 scale-50'}`}>
          <div className="p-2 bg-accent rounded-xl shadow-lg shadow-accent/20">
            <Zap className="text-white" size={24} />
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-white font-display tracking-tighter italic">AthleteOS</span>
        </div>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-accent transition-all duration-300"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-hide">
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center p-3 rounded-2xl transition-all duration-300 group relative
              ${isActive
                ? 'bg-accent/5 text-accent font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            title={!sidebarOpen ? item.name : undefined}
          >
            {/* Active Indicator Bar */}
            <div className={`
              absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-accent rounded-r-full transition-all duration-300
              ${sidebarOpen ? 'opacity-0 -left-1' : 'opacity-0'}
              group-[.active]:opacity-100
            `} />
            
            <div className="flex flex-shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              {item.icon}
            </div>
            
            <span className={`
              ml-3 truncate transition-all duration-500 font-medium
              ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
            `}>
              {item.name}
            </span>
          </NavLink>
        ))}

        {/* Logout Button */}
        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center p-3 rounded-2xl transition-all duration-300 text-danger hover:bg-danger/5 group relative"
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <div className="flex flex-shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <LogOut size={20} className="text-danger" />
          </div>
          <span className={`
            ml-3 truncate transition-all duration-500 font-medium text-danger
            ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
          `}>
            Logout
          </span>
        </button>
      </div>

      {/* Profile Area */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div 
          onClick={() => navigate('/settings')}
          className={`
            flex items-center p-2 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group
            ${sidebarOpen ? 'gap-3' : 'justify-center'}
          `}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20 transition-transform group-hover:rotate-6">
            <span className="text-white font-black text-sm">{initials}</span>
          </div>

          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{fullname}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Optimal Load</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
