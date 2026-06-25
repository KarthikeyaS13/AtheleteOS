import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import StravaPRBanner from '../Strava/StravaPRBanner';

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
        <main className="flex-1 p-3 md:p-5 max-w-[1400px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <StravaPRBanner />
    </div>
  );
};

export default Layout;

