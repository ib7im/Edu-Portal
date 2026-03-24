export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  studentId?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
}

export interface Grade {
  id: string;
  studentUid: string;
  courseId: string;
  grade: string;
  semester: string;
}

export interface Payment {
  id: string;
  studentUid: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
  description: string;
}

export interface Notification {
  id: string;
  recipientUid: string; // UID or 'all'
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Enrollment {
  id: string;
  studentUid: string;
  courseId: string;
  semester: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
