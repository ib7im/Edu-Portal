import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  MessageSquare, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { 
  Course, 
  Grade, 
  Payment, 
  UserProfile, 
  Enrollment,
  ChatMessage
} from '../types';
import { where } from 'firebase/firestore';
import { 
  subscribeToCollection, 
  createDocument, 
  updateDocument,
  deleteDocument,
  getCollection 
} from '../services/firestore';
import { motion, AnimatePresence } from 'motion/react';
import AIAssistant from './AIAssistant';

interface StudentDashboardProps {
  user: UserProfile;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

export default function StudentDashboard({ user, activeSubTab, setActiveSubTab }: StudentDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myGrades, setMyGrades] = useState<Grade[]>([]);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStudentName, setPaymentStudentName] = useState(user.name);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(user);
  const validTabs = ['dashboard', 'courses', 'grades', 'payments', 'assistant', 'profile'];

  useEffect(() => {
    if (!validTabs.includes(activeSubTab)) {
      setActiveSubTab('dashboard');
    }
  }, [activeSubTab]);

  useEffect(() => {
    const unsubCourses = subscribeToCollection<Course>('courses', setCourses);
    const unsubGrades = subscribeToCollection<Grade>(
      'grades', 
      setMyGrades,
      where('studentUid', '==', user.uid)
    );
    const unsubPayments = subscribeToCollection<Payment>(
      'payments', 
      setMyPayments,
      where('studentUid', '==', user.uid)
    );
    const unsubEnrollments = subscribeToCollection<Enrollment>(
      'enrollments', 
      setMyEnrollments,
      where('studentUid', '==', user.uid)
    );

    return () => {
      unsubCourses();
      unsubGrades();
      unsubPayments();
      unsubEnrollments();
    };
  }, [user.uid]);

  const enrolledCourseIds = new Set(myEnrollments.map(e => e.courseId));
  const myCourses = courses.filter(c => enrolledCourseIds.has(c.id));
  
  const departments = ['All', ...new Set(courses.map(c => c.department))];
  
  const availableCourses = courses.filter(c => {
    const matchesEnrollment = !enrolledCourseIds.has(c.id);
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || c.department === selectedDept;
    return matchesEnrollment && matchesSearch && matchesDept;
  });

  const handleEnroll = async (courseId: string) => {
    if (myEnrollments.length >= 5) {
      alert("You cannot enroll in more than 5 courses");
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    await createDocument('enrollments', id, {
      id,
      studentUid: user.uid,
      courseId,
      semester: 'Spring 2026'
    } as Enrollment);
  };

  const handleSimulatedPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!paymentStudentName.trim()) {
      alert('Please enter student name.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amount > remainingBalance) {
      alert(`You cannot pay more than your remaining balance of KES ${remainingBalance.toLocaleString()}.`);
      return;
    }

    setIsPaying(true);
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await createDocument('payments', id, {
        id,
        studentUid: user.uid,
        amount: amount,
        status: 'paid',
        date: new Date().toISOString(),
        description: `Fee Payment - ${paymentStudentName}`
      } as Payment);
      
      setPaymentAmount('');
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 3000);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const [droppingCourseId, setDroppingCourseId] = useState<string | null>(null);

  const handleDrop = async (courseId: string) => {
    const enrollment = myEnrollments.find(e => e.courseId === courseId);
    if (enrollment) {
      await deleteDocument('enrollments', enrollment.id);
      setDroppingCourseId(null);
    }
  };

  const totalCredits = myCourses.reduce((acc, c) => acc + c.credits, 0);
  const COURSE_FEE = 40000;
  const totalFees = myEnrollments.length * COURSE_FEE;
  const amountPaid = myPayments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, totalFees - amountPaid);

  const calculateGPA = () => {
    if (myGrades.length === 0) return '0.00';
    const gradePoints: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };
    const totalPoints = myGrades.reduce((acc, g) => acc + (gradePoints[g.grade] || 0), 0);
    return (totalPoints / myGrades.length).toFixed(2);
  };

  const gpa = calculateGPA();

  const handleUpdateProfile = async () => {
    try {
      await updateDocument('users', user.uid, editedProfile);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {(activeSubTab === 'dashboard' || !validTabs.includes(activeSubTab)) && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-accent/5 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20" />
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
                    <p className="text-base sm:text-lg opacity-60 italic">"The beautiful thing about learning is that no one can take it away from you."</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block">Student ID</span>
                    <span className="text-lg font-mono font-bold text-accent">{user.studentId || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <div className="bg-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-accent/20 text-sm sm:text-base">
                    <TrendingUp size={18} />
                    <span>GPA: {gpa}</span>
                  </div>
                  <div className="bg-surface border border-border px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold flex items-center gap-2 text-sm sm:text-base">
                    <CreditCard size={18} className="text-accent" />
                    <span>Balance: KES {remainingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500"><BookOpen size={24} /></div>
                  <button onClick={() => setActiveSubTab('courses')} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">View All</button>
                </div>
                <h3 className="text-xl font-bold mb-2">My Courses</h3>
                <p className="text-sm opacity-50 mb-6">You are currently enrolled in {myCourses.length} courses.</p>
                <div className="space-y-3 mt-auto">
                  {myCourses.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-bg/50">
                      <span className="text-sm font-bold">{c.code}</span>
                      <ChevronRight size={16} className="opacity-20" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500"><GraduationCap size={24} /></div>
                  <button onClick={() => setActiveSubTab('grades')} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">View All</button>
                </div>
                <h3 className="text-xl font-bold mb-2">Recent Grades</h3>
                <p className="text-sm opacity-50 mb-6">Check your latest academic performance.</p>
                <div className="space-y-3 mt-auto">
                  {myGrades.slice(0, 3).map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-2xl bg-bg/50">
                      <span className="text-sm font-bold">{courses.find(c => c.id === g.courseId)?.code}</span>
                      <span className="text-sm font-bold text-emerald-500">{g.grade}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><CreditCard size={24} /></div>
                  <button onClick={() => setActiveSubTab('payments')} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">View All</button>
                </div>
                <h3 className="text-xl font-bold mb-2">Fees & Payments</h3>
                <p className="text-sm opacity-50 mb-6">Your remaining balance is KES {remainingBalance.toLocaleString()}.</p>
                <div className="mt-auto">
                  <button 
                    onClick={() => setActiveSubTab('payments')}
                    className="w-full bg-accent text-white py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all"
                  >
                    Pay Now
                  </button>
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
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-2xl font-bold">Course Registration</h3>
                <div className="flex gap-2 bg-surface p-1 rounded-full border border-border">
                  <button className="px-6 py-2 rounded-full text-sm font-bold bg-accent text-white">Available</button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('my-enrolled-courses');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-2 rounded-full text-sm font-bold hover:bg-bg"
                  >
                    My Courses
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search courses by name or code..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface border border-border focus:ring-2 focus:ring-accent/20"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="px-4 py-3 rounded-2xl bg-surface border border-border focus:ring-2 focus:ring-accent/20"
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map(course => (
                <div key={course.id} className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm flex flex-col group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{course.code}</span>
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">{course.department}</span>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold">{course.credits} Credits</span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">{course.name}</h4>
                  <p className="text-sm opacity-60 mb-8 flex-1 line-clamp-3">{course.description}</p>
                  <button 
                    onClick={() => handleEnroll(course.id)}
                    className="w-full bg-accent text-white py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    <Plus size={18} />
                    <span>Enroll Now</span>
                  </button>
                </div>
              ))}
              {availableCourses.length === 0 && (
                <div className="col-span-full py-20 text-center bg-surface rounded-[32px] border border-dashed border-border">
                  <BookOpen className="mx-auto opacity-10 mb-4" size={48} />
                  <p className="opacity-40 font-medium">No courses found matching your criteria.</p>
                </div>
              )}
            </div>

            <div id="my-enrolled-courses" className="pt-8 border-t border-border">
              <h3 className="text-2xl font-bold mb-6">My Enrolled Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map(course => (
                  <div key={course.id} className="bg-surface p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm border-l-4 border-l-accent">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{course.code}</span>
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">{course.department}</span>
                      </div>
                      <CheckCircle size={20} className="text-emerald-500" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">{course.name}</h4>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{course.credits} Credits</span>
                      {droppingCourseId === course.id ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDrop(course.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setDroppingCourseId(null)}
                            className="bg-bg text-text px-3 py-1 rounded-full text-[10px] font-bold border border-border"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDroppingCourseId(course.id)}
                          className="text-red-500 text-[10px] font-bold hover:underline uppercase tracking-widest"
                        >
                          Drop Course
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'grades' && (
          <motion.div
            key="grades"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface rounded-[24px] sm:rounded-[32px] border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-8 border-b border-border">
              <h3 className="text-2xl font-bold">Academic Transcript</h3>
              <p className="text-sm opacity-50 mt-1">Spring Semester 2026</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg/50">
                    <th className="px-6 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Course Code</th>
                    <th className="px-6 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Course Name</th>
                    <th className="px-6 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Credits</th>
                    <th className="px-6 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Grade</th>
                    <th className="px-6 sm:px-8 py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myGrades.map(grade => {
                    const course = courses.find(c => c.id === grade.courseId);
                    return (
                      <tr key={grade.id} className="hover:bg-bg/30 transition-colors">
                        <td className="px-6 sm:px-8 py-6 font-mono text-sm">{course?.code}</td>
                        <td className="px-6 sm:px-8 py-6 font-bold">{course?.name}</td>
                        <td className="px-6 sm:px-8 py-6 opacity-60">{course?.credits}</td>
                        <td className="px-6 sm:px-8 py-6 font-bold text-lg">{grade.grade}</td>
                        <td className="px-6 sm:px-8 py-6">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Passed</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-bold">Payment History</h3>
              {myPayments.map(payment => (
                <div key={payment.id} className="bg-surface p-6 rounded-[24px] sm:rounded-[32px] border border-border shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${payment.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold">{payment.description}</h4>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">KES {payment.amount.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${payment.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Financial Summary</h3>
              <div className="bg-accent text-white p-8 rounded-[32px] shadow-xl shadow-accent/20">
                <div className="space-y-6 mb-8">
                  <div>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">Total Fees</p>
                    <h4 className="text-2xl font-bold">KES {totalFees.toLocaleString()}</h4>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">Amount Paid</p>
                    <h4 className="text-2xl font-bold">KES {amountPaid.toLocaleString()}</h4>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">Remaining Balance</p>
                    <h4 className="text-4xl font-bold">KES {remainingBalance.toLocaleString()}</h4>
                  </div>
                </div>
                
                {remainingBalance > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 block">Student Name</label>
                        <input 
                          type="text" 
                          placeholder="Your Name"
                          className="w-full bg-white/10 border-none focus:ring-2 focus:ring-white/20 rounded-xl text-white placeholder:text-white/30"
                          value={paymentStudentName}
                          onChange={e => setPaymentStudentName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 block">Payment Amount (KES)</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="0.00"
                            className="flex-1 bg-white/10 border-none focus:ring-2 focus:ring-white/20 rounded-xl text-white placeholder:text-white/30"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                          />
                          <button 
                            onClick={handleSimulatedPayment}
                            disabled={isPaying || !paymentAmount}
                            className="bg-white text-accent px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            {isPaying ? '...' : 'Pay'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {paymentSuccess && (
                      <div className="bg-emerald-500/20 text-emerald-100 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle size={14} />
                        Payment Successful!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/10 p-6 rounded-2xl border border-white/10 text-center">
                    <CheckCircle className="mx-auto mb-2 opacity-60" size={32} />
                    <p className="text-sm font-bold">All fees paid!</p>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                  <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Fee Breakdown</p>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Enrolled Courses ({myEnrollments.length})</span>
                    <span className="font-bold">KES {(myEnrollments.length * COURSE_FEE).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] opacity-40 italic mt-2">* Each course is charged at KES {COURSE_FEE.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'assistant' && (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AIAssistant 
              user={user}
              courses={myCourses}
              grades={myGrades}
              payments={myPayments}
              gpa={gpa}
              pendingFees={remainingBalance}
            />
          </motion.div>
        )}
        {activeSubTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center text-2xl font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-sm opacity-50">{user.email}</p>
                  </div>
                </div>
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="px-6 py-2 bg-accent/10 text-accent rounded-full font-bold text-sm hover:bg-accent/20 transition-all"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Full Name</label>
                    <input 
                      type="text" 
                      className={`w-full px-5 py-4 rounded-2xl bg-bg border border-border focus:ring-2 focus:ring-accent/20 transition-all ${!isEditingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={editedProfile.name}
                      onChange={e => setEditedProfile({...editedProfile, name: e.target.value})}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-5 py-4 rounded-2xl bg-bg border border-border opacity-50 cursor-not-allowed"
                      value={user.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Student ID</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 rounded-2xl bg-bg border border-border opacity-50 cursor-not-allowed font-mono"
                      value={user.studentId || 'N/A'}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block ml-2">Role</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 rounded-2xl bg-bg border border-border opacity-50 cursor-not-allowed capitalize"
                      value={user.role}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {isEditingProfile && (
                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-accent text-white py-4 rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditedProfile(user);
                    }}
                    className="flex-1 bg-bg border border-border py-4 rounded-full font-bold hover:bg-accent/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
