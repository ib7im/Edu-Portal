import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from './types';
import { getDocument, createDocument, subscribeToDocument } from './services/firestore';
import Auth from './components/Auth';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    console.log("[EduPortal] Initializing auth listener...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[EduPortal] Auth state changed:", firebaseUser ? "User Logged In" : "No User");
      setLoading(true);
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          console.log("[EduPortal] Fetching profile for:", firebaseUser.uid);
          // Check if profile exists
          const userProfile = await getDocument<UserProfile>('users', firebaseUser.uid);
          console.log("[EduPortal] Profile fetch result:", userProfile ? "Found" : "Not Found");
          
          if (!userProfile) {
            console.log("[EduPortal] Creating new profile...");
            // Create default profile for new user (default to student)
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'New User',
              role: firebaseUser.email === 'axs83006@gmail.com' ? 'admin' : 'student',
            };
            if (newProfile.role === 'student') {
              newProfile.studentId = `STU-${Math.floor(10000 + Math.random() * 90000)}`;
            }
            await createDocument('users', firebaseUser.uid, newProfile);
            setProfile(newProfile);
            setActiveTab(newProfile.role === 'admin' ? 'overview' : 'dashboard');
          } else {
            setProfile(userProfile);
            setActiveTab(userProfile.role === 'admin' ? 'overview' : 'dashboard');
            
            // Subscribe to profile changes
            if (unsubProfile) unsubProfile();
            unsubProfile = subscribeToDocument<UserProfile>('users', firebaseUser.uid, (data) => {
              if (data) {
                console.log("[EduPortal] Profile updated from Firestore");
                setProfile(data);
              }
            });
          }
        } else {
          setProfile(null);
          setActiveTab('dashboard'); // Reset to default for next login
          if (unsubProfile) {
            unsubProfile();
            unsubProfile = null;
          }
        }
      } catch (error) {
        console.error("[EduPortal] Auth initialization error:", error);
      } finally {
        console.log("[EduPortal] Setting loading to false");
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#5A5A40] mx-auto mb-4" />
          <p className="text-[#5A5A40] font-serif italic">Loading EduPortal...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <ErrorBoundary>
        <Auth />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout user={profile} activeTab={activeTab} setActiveTab={setActiveTab}>
        {profile.role === 'admin' ? (
          <AdminDashboard activeSubTab={activeTab} setActiveSubTab={setActiveTab} />
        ) : (
          <StudentDashboard user={profile} activeSubTab={activeTab} setActiveSubTab={setActiveTab} />
        )}
      </Layout>
    </ErrorBoundary>
  );
}
