import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';

const Layout = () => {
  const { sidebarOpen } = useSelector(state => state.ui);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 w-full min-h-screen ${
          sidebarOpen ? 'md:ml-64 ml-20' : 'ml-20'
        }`}
      >
        <div className="h-full p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
