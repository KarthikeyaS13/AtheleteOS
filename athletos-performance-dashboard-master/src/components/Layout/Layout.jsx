import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const { sidebarOpen } = useSelector(state => state.ui);

  return (
    <div className="flex min-h-screen bg-background dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar />
      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 w-full min-h-screen ${
          sidebarOpen ? 'md:ml-64 ml-20' : 'ml-20'
        }`}
      >
        <Header />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
