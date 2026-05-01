import { useSelector, useDispatch } from 'react-redux';
import { setTheme, toggleSidebar } from '../../store/slices/uiSlice';
import { Sun, Moon, Menu } from 'lucide-react';

const Header = () => {
  const { theme, } = useSelector(state => state.ui);
  const dispatch = useDispatch();

  const handleToggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="w-full bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-[#1e293b] shadow-sm flex items-center justify-between px-4 md:px-8 py-3 transition-colors duration-300 z-40 sticky top-0">

      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1e293b]"
        >
          <Menu size={24} className="text-black dark:text-white" />
        </button>

        <div className="md:hidden font-bold text-lg text-black dark:text-white">
          AthleteOS
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-white hover:text-yellow-300" />
          ) : (
            <Moon size={20} className="text-black hover:text-gray-700" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
