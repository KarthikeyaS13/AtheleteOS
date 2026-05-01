import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import {
  Zap, LayoutDashboard, PlusCircle, History,
  Utensils, Calendar, Trophy, BarChart2,
  FileText, Settings, Menu
} from 'lucide-react';

const Sidebar = () => {
  const { sidebarOpen } = useSelector(state => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Log Workout', path: '/log', icon: <PlusCircle size={20} /> },
    { name: 'Training History', path: '/history', icon: <History size={20} /> },
    { name: 'Nutrition Tracker', path: '/nutrition', icon: <Utensils size={20} /> },
    { name: 'Race Planner', path: '/races', icon: <Calendar size={20} /> },
    { name: 'Personal Records', path: '/prs', icon: <Trophy size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={20} /> },
    { name: 'Weekly Report', path: '/report', icon: <FileText size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const handleAction = () => {
    navigate('/settings')
  }

  const settings = useSelector(state => state.settings)

  const fullname = settings?.profile?.name || '';
  const nameParts = fullname.trim().split(" ");
  const initials = nameParts.length >= 2 ? nameParts[0][0] + nameParts[1][0] : nameParts[0]?.slice(0, 2) || 'AB'

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-white dark:bg-[#0f172a] border-r border-[#334155] border-gray-200 dark:border-[#1e293b] transition-all duration-300 z-50 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#334155]">
        <div className={`flex items-center space-x-3 overflow-hidden ${!sidebarOpen && 'hidden'}`}>
          <Zap className="text-accent flex-shrink-0" size={28} />
          <span className="text-xl font-bold text-gray-600 dark:text-gray-300 font-sans tracking-tight">AthleteOS</span>
        </div>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1 rounded-md hover:bg-[#334155] text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent">
        <nav className="space-y-1 px-3">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-[#334155]/50 hover:text-gray-100'
                }`
              }
              title={!sidebarOpen ? item.name : undefined}
            >
              <div className="flex flex-shrink-0 items-center justify-center">
                {item.icon}
              </div>
              {sidebarOpen && (
                <span className="ml-3 truncate">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[#334155]">
        <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
          <div onClick={handleAction} className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm uppercase">{initials}</span>

          </div>

          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-lg font-medium dark:text-gray-300 text-gray-600 truncate">{fullname || 'Athlete'}</p>
              <p className='text-xs text-gray-500 dark:text-gray-300'>{fullname ? 'Athlete' : ''}</p>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">Optimal Load</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
