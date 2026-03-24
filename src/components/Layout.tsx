import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  Bell, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Users,
  Sun,
  Moon,
  Search
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile, Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCollection, updateDocument } from '../services/firestore';
import { where } from 'firebase/firestore';

interface LayoutProps {
  user: UserProfile;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ user, children, activeTab, setActiveTab }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Notification>(
      'notifications',
      (data) => {
        setNotifications(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      },
      where('recipientUid', 'in', [user.uid, 'all'])
    );
    return () => unsubscribe();
  }, [user.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => signOut(auth);

  const menuItems = user.role === 'admin' 
    ? [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'notifications', label: 'Announcements', icon: Bell },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'grades', label: 'Grades', icon: GraduationCap },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
        { id: 'profile', label: 'Profile', icon: UserIcon },
      ];

  const markAsRead = async (id: string) => {
    await updateDocument('notifications', id, { read: true });
  };

  return (
    <div className="min-h-screen flex font-serif bg-bg text-text">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">EduPortal</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                    : 'hover:bg-accent/10 text-text/70'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 mt-auto border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-bg">
              <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] opacity-60 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen && window.innerWidth > 1024 ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md bg-bg/80 border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-black/5 rounded-full">
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-medium opacity-60">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-[10px] font-mono opacity-40">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:flex items-center px-4 py-2 rounded-full bg-surface border border-border">
              <Search size={18} className="opacity-40" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-32 lg:w-48"
              />
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-black/5 transition-all"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-black/5 relative transition-all"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-bg">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 sm:w-80 rounded-3xl shadow-2xl overflow-hidden border border-border bg-surface"
                  >
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-bold">Notifications</h3>
                      <span className="text-xs opacity-50">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center opacity-40 italic text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={`p-4 border-b border-border cursor-pointer transition-colors ${!n.read ? 'bg-accent/5' : 'hover:bg-black/5'}`}
                          >
                            <p className="font-bold text-sm">{n.title}</p>
                            <p className="text-xs opacity-70 mt-1">{n.message}</p>
                            <p className="text-[10px] opacity-40 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
