import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header can go here later */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <div className="ml-auto flex items-center gap-4">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="User" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-medium text-indigo-700">
                {userInitial}
              </div>
            )}
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
