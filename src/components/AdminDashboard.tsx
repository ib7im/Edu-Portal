import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2, 
  Send, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  X
} from 'lucide-react';
import { 
  Course, 
  Grade, 
  Payment, 
  UserProfile, 
  Notification,
  Enrollment
} from '../types';
import { 
  subscribeToCollection, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  getCollection
} from '../services/firestore';
import { seedSampleData } from '../services/seedService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AdminDashboardProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

export default function AdminDashboard({ activeSubTab, setActiveSubTab }: AdminDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form states
  const [newCourse, setNewCourse] = useState<Partial<Course>>({ name: '', code: '', credits: 0, description: '', department: 'General' });
  const [newNotification, setNewNotification] = useState<Partial<Notification>>({ title: '', message: '', recipientUid: 'all' });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof UserProfile>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const validTabs = ['overview', 'courses', 'students', 'users', 'notifications'];

  useEffect(() => {
    if (!validTabs.includes(activeSubTab)) {
      setActiveSubTab('overview');
    }
  }, [activeSubTab]);

  useEffect(() => {
    const unsubCourses = subscribeToCollection<Course>('courses', setCourses);
    const unsubUsers = subscribeToCollection<UserProfile>('users', setUsers);
    const unsubGrades = subscribeToCollection<Grade>('grades', setGrades);
    const unsubPayments = subscribeToCollection<Payment>('payments', setPayments);
    const unsubEnrollments = subscribeToCollection<Enrollment>('enrollments', setEnrollments);
    const unsubNotifications = subscribeToCollection<Notification>('notifications', setNotifications);

    return () => {
      unsubCourses();
      unsubUsers();
      unsubGrades();
      unsubPayments();
      unsubEnrollments();
      unsubNotifications();
    };
  }, []);

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);
  
  const COURSE_FEE = 40000;
  const totalPotentialRevenue = enrollments.length * COURSE_FEE;
  const pendingPayments = Math.max(0, totalPotentialRevenue - totalRevenue);

  const stats = [
    { label: 'Total Students', value: users.filter(u => u.role === 'student').length, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'bg-emerald-500' },
    { 
      label: 'Total Revenue', 
      value: `KES ${totalRevenue.toLocaleString()}`, 
      icon: CreditCard, 
      color: 'bg-amber-500' 
    },
    { 
      label: 'Pending Payments', 
      value: `KES ${pendingPayments.toLocaleString()}`, 
      icon: AlertCircle, 
      color: 'bg-rose-500' 
    },
  ];

  // Group payments by month for the chart
  const getMonthlyRevenue = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map(month => ({ name: month, revenue: 0 }));

    payments.forEach(p => {
      if (p.status === 'paid') {
        const date = new Date(p.date);
        if (date.getFullYear() === currentYear) {
          monthlyData[date.getMonth()].revenue += p.amount;
        }
      }
    });

    return monthlyData;
  };

  const chartData = getMonthlyRevenue();

  const pieData = [
    { name: 'Paid', value: payments.filter(p => p.status === 'paid').length },
    { name: 'Pending', value: payments.filter(p => p.status === 'pending').length },
  ];

  const recentTransactions = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const COLORS = ['#10b981', '#f43f5e'];

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code) return;
    const id = Math.random().toString(36).substr(2, 9);
    await createDocument('courses', id, { ...newCourse, id, department: newCourse.department || 'General' } as Course);
    setNewCourse({ name: '', code: '', credits: 0, description: '', department: 'General' });
  };

  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteDocument('courses', id);
      setDeletingCourseId(null);
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDocument('users', uid);
      setIsDeletingUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateDocument('users', editingUser.uid, editingUser);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const filteredUsers = users
    .filter(u => {
      const matchesTab = activeSubTab === 'users' ? true : u.role === 'student';
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: keyof UserProfile) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) return;
    const id = Math.random().toString(36).substr(2, 9);
    await createDocument('notifications', id, {
      ...newNotification,
      id,
      timestamp: new Date().toISOString(),
      read: false
    } as Notification);
    setNewNotification({ title: '', message: '', recipientUid: 'all' });
  };

  return (
    <div className="space-y-8">
      {/* Sub-tabs Navigation */}
      <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto scrollbar-hide">
        {[
          { id: 'overview', icon: TrendingUp, label: 'Overview' },
          { id: 'courses', icon: BookOpen, label: 'Courses' },
          { id: 'students', icon: GraduationCap, label: 'Students' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'notifications', icon: Send, label: 'Announcements' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 ${
              activeSubTab === tab.id 
                ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                : 'bg-surface border border-border hover:bg-accent/5 hover:border-accent/20'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {(activeSubTab === 'overview' || !validTabs.includes(activeSubTab)) && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">System Overview</h2>
              <button 
                onClick={() => seedSampleData()}
                className="px-6 py-2 bg-accent/10 text-accent rounded-full text-sm font-bold hover:bg-accent/20 transition-all border border-accent/20"
              >
                Seed Sample Data
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-surface p-6 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm group hover:border-accent/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon size={24} />
                    </div>
                    <div className="flex flex-col items-end">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span className="text-[10px] text-emerald-500 font-bold mt-1">+12%</span>
                    </div>
                  </div>
                  <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                  <div className="mt-4 h-1 w-full bg-bg rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color} opacity-30 w-2/3`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Revenue Overview</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                        />
                        <Bar dataKey="revenue" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
                  <div className="space-y-4">
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map(transaction => {
                        const student = users.find(u => u.uid === transaction.studentUid);
                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-4 rounded-2xl bg-bg/50 border border-border/50">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl ${transaction.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                <CreditCard size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{student?.name || 'Unknown Student'}</p>
                                <p className="text-[10px] opacity-50 uppercase tracking-widest">{new Date(transaction.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">KES {transaction.amount.toLocaleString()}</p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${transaction.status === 'paid' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {transaction.status}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-8 opacity-50 text-sm">No transactions found</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm h-fit">
                <h3 className="text-xl font-bold mb-6">Payment Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-xl">
                  <Plus size={20} />
                </div>
                <h3 className="text-xl font-bold">Add New Course</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">Course Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Advanced Mathematics" 
                    className="w-full px-4 py-3 rounded-2xl bg-bg border-border border focus:ring-2 focus:ring-accent/20 transition-all"
                    value={newCourse.name}
                    onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">Course Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MATH-401" 
                    className="w-full px-4 py-3 rounded-2xl bg-bg border-border border focus:ring-2 focus:ring-accent/20 transition-all"
                    value={newCourse.code}
                    onChange={e => setNewCourse({...newCourse, code: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">Credits</label>
                  <input 
                    type="number" 
                    placeholder="3" 
                    className="w-full px-4 py-3 rounded-2xl bg-bg border-border border focus:ring-2 focus:ring-accent/20 transition-all"
                    value={newCourse.credits || ''}
                    onChange={e => setNewCourse({...newCourse, credits: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Science" 
                    className="w-full px-4 py-3 rounded-2xl bg-bg border-border border focus:ring-2 focus:ring-accent/20 transition-all"
                    value={newCourse.department}
                    onChange={e => setNewCourse({...newCourse, department: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleAddCourse}
                  className="bg-accent text-white rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all py-3 px-8 shadow-lg shadow-accent/20"
                >
                  <Plus size={20} />
                  <span>Create Course</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-surface p-6 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {deletingCourseId === course.id ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setDeletingCourseId(null)}
                            className="p-1.5 bg-bg text-text rounded-lg text-[10px] font-bold border border-border"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-full"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => setDeletingCourseId(course.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold">{course.name}</h4>
                  <p className="text-[10px] opacity-50 font-mono mt-1 uppercase tracking-widest">{course.code}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{course.credits} Credits</span>
                    <span className="text-[10px] bg-accent/10 text-accent px-3 py-1 rounded-full font-bold uppercase tracking-widest">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="bg-surface p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/10 text-accent rounded-2xl">
                  <Send size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Send Announcement</h3>
                  <p className="text-sm opacity-50">Broadcast messages to students or individuals</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Recipient Group</label>
                    <select 
                      className="w-full px-5 py-4 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all appearance-none"
                      value={newNotification.recipientUid}
                      onChange={e => setNewNotification({...newNotification, recipientUid: e.target.value})}
                    >
                      <option value="all">All Students</option>
                      <optgroup label="Individual Students">
                        {users.filter(u => u.role === 'student').map(u => (
                          <option key={u.uid} value={u.uid}>{u.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Announcement Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Exam Schedule Update" 
                      className="w-full px-5 py-4 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all"
                      value={newNotification.title}
                      onChange={e => setNewNotification({...newNotification, title: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Message Content</label>
                  <textarea 
                    placeholder="Type your announcement here..." 
                    className="flex-1 w-full px-5 py-4 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all resize-none min-h-[150px]"
                    value={newNotification.message}
                    onChange={e => setNewNotification({...newNotification, message: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSendNotification}
                  className="bg-accent text-white px-10 py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-accent/20 group"
                >
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  <span>Broadcast Announcement</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Recent Announcements</h3>
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="bg-surface p-6 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{n.title}</h4>
                      <p className="text-sm opacity-60 mt-1">{n.message}</p>
                    </div>
                    <span className="text-[10px] opacity-40 font-mono">{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] opacity-40 uppercase tracking-widest">Recipient: {n.recipientUid === 'all' ? 'All Students' : 'Direct Message'}</span>
                    <button 
                      onClick={() => deleteDocument('notifications', n.id)}
                      className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Other tabs would be implemented similarly */}
        {(activeSubTab === 'students' || activeSubTab === 'users') && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface rounded-[24px] sm:rounded-[32px] border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-8 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold capitalize">{activeSubTab} Management</h3>
                <p className="text-sm opacity-50">Manage and monitor system {activeSubTab}</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                  <input 
                    type="text" 
                    placeholder={`Search ${activeSubTab}...`}
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="p-3 bg-bg border border-border rounded-full hover:bg-accent/5 transition-all"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg/50">
                    <th 
                      className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-40 cursor-pointer hover:opacity-100"
                      onClick={() => toggleSort('name')}
                    >
                      User Profile {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-40 cursor-pointer hover:opacity-100"
                      onClick={() => toggleSort('email')}
                    >
                      Contact Info {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-40 cursor-pointer hover:opacity-100"
                      onClick={() => toggleSort('role')}
                    >
                      Role Status {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map(user => (
                    <tr key={user.uid} className="hover:bg-bg/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold">{user.name}</p>
                            {user.studentId && <p className="text-[10px] opacity-40">{user.studentId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 opacity-60 text-sm">{user.email}</td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                          user.role === 'admin' 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                          {isDeletingUser === user.uid ? (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleDeleteUser(user.uid)}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => setIsDeletingUser(null)}
                                className="px-3 py-1 bg-bg border border-border rounded-lg text-[10px] font-bold"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setEditingUser(user)}
                                className="p-2.5 hover:bg-blue-500/10 text-blue-500 rounded-xl transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => setIsDeletingUser(user.uid)}
                                className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-md rounded-[32px] border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Edit User</h3>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-bg rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all"
                      value={editingUser.name}
                      onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-5 py-3 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all opacity-50"
                      value={editingUser.email}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Role</label>
                    <select 
                      className="w-full px-5 py-3 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all"
                      value={editingUser.role}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'student'})}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {editingUser.role === 'student' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Student ID</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all"
                        value={editingUser.studentId || ''}
                        onChange={e => setEditingUser({...editingUser, studentId: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={handleUpdateUser}
                    className="flex-1 bg-accent text-white py-3 rounded-full font-bold hover:opacity-90 transition-all"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-bg border border-border py-3 rounded-full font-bold hover:bg-accent/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
