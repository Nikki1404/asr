import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBarIcon, DocumentTextIcon, UploadCloudIcon, SunIcon, MoonIcon } from './IconComponents';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const activeLinkClass = 'bg-primary text-white';
  const inactiveLinkClass = 'text-white hover:bg-secondary';

  return (
    <header className="bg-neutral dark:bg-gray-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <NavLink to="/" className="flex items-center space-x-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span className="text-2xl font-bold text-white">ASR Benchmark Hub</span>
            </NavLink>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-center">
              <div className="flex items-baseline space-x-4">
                <NavLink
                  to="/blog"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? activeLinkClass : inactiveLinkClass}`
                  }
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Reports
                </NavLink>
                <NavLink
                  to="/trends"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? activeLinkClass : inactiveLinkClass}`
                  }
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Trends
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${isActive ? activeLinkClass : inactiveLinkClass}`
                  }
                >
                  <UploadCloudIcon className="h-5 w-5 mr-2" />
                  Dashboard
                </NavLink>
              </div>
              <button
                onClick={toggleTheme}
                className="ml-6 p-2 rounded-full text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral dark:focus:ring-offset-gray-900 focus:ring-white transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;