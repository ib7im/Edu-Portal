import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Business Administration',
  'International Relations',
  'Psychology',
  'Journalism'
];

const COURSE_PREFIXES: Record<string, string> = {
  'Computer Science': 'CSC',
  'Information Technology': 'APT',
  'Business Administration': 'BUS',
  'International Relations': 'IRL',
  'Psychology': 'PSY',
  'Journalism': 'JRN'
};

const COURSE_NAMES: Record<string, string[]> = {
  'Computer Science': [
    'Introduction to Programming',
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Software Engineering',
    'Artificial Intelligence',
    'Computer Networks',
    'Web Development',
    'Mobile Application Development',
    'Cyber Security'
  ],
  'Information Technology': [
    'Digital Electronics',
    'System Analysis and Design',
    'Network Administration',
    'IT Project Management',
    'Cloud Computing',
    'Human Computer Interaction',
    'Enterprise Resource Planning',
    'Information Systems Audit',
    'E-Commerce',
    'Multimedia Systems'
  ],
  'Business Administration': [
    'Principles of Marketing',
    'Financial Accounting',
    'Human Resource Management',
    'Strategic Management',
    'Microeconomics',
    'Macroeconomics',
    'Business Law',
    'Organizational Behavior',
    'Entrepreneurship',
    'Operations Management'
  ],
  'International Relations': [
    'Introduction to IR',
    'Diplomacy and Statecraft',
    'International Organizations',
    'Global Political Economy',
    'Conflict Resolution',
    'Foreign Policy Analysis',
    'Human Rights',
    'International Law',
    'Regional Integration',
    'Security Studies'
  ],
  'Psychology': [
    'Introduction to Psychology',
    'Developmental Psychology',
    'Social Psychology',
    'Cognitive Psychology',
    'Abnormal Psychology',
    'Research Methods',
    'Personality Theories',
    'Counseling Psychology',
    'Educational Psychology',
    'Health Psychology'
  ],
  'Journalism': [
    'Introduction to Mass Communication',
    'News Writing and Reporting',
    'Media Law and Ethics',
    'Photojournalism',
    'Broadcast Journalism',
    'Digital Media Production',
    'Public Relations',
    'Advertising Principles',
    'Feature Writing',
    'Investigative Journalism'
  ]
};

const STUDENT_NAMES = [
  'James Onyango', 'Mary Wambui', 'John Kamau', 'Sarah Cherono', 'David Mutua',
  'Grace Atieno', 'Peter Kiprop', 'Alice Njeri', 'Michael Otieno', 'Emily Chebet',
  'Kevin Maina', 'Faith Wanjiku', 'Brian Omondi', 'Lucy Nyambura', 'Robert Mwangi'
];

const SEMESTERS = ['Fall 2025', 'Spring 2026', 'Summer 2026'];
const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];

export const seedSampleData = async () => {
  console.log('Starting seed process...');

  // 1. Check if we already have data to avoid duplicates (optional but good)
  const coursesSnap = await getDocs(collection(db, 'courses'));
  if (coursesSnap.size > 20) {
    console.log('System already has significant data. Skipping seed.');
    return { success: false, message: 'System already has data.' };
  }

  const batch = writeBatch(db);

  // 2. Create Courses (40-60)
  const courseIds: string[] = [];
  for (const dept of DEPARTMENTS) {
    const prefix = COURSE_PREFIXES[dept];
    const names = COURSE_NAMES[dept];
    
    for (let i = 0; i < names.length; i++) {
      const level = (Math.floor(Math.random() * 4) + 1) * 1000; // 1000, 2000, 3000, 4000
      const code = `${prefix}${level + (i * 10)}`;
      const courseId = code.toLowerCase();
      const courseData = {
        id: courseId,
        code: code,
        name: names[i],
        department: dept,
        description: `This is a comprehensive course on ${names[i]} offered by the ${dept} department.`,
        credits: Math.random() > 0.5 ? 3 : 4
      };
      
      const courseRef = doc(db, 'courses', courseId);
      batch.set(courseRef, courseData);
      courseIds.push(courseId);
    }
  }

  // 3. Create Students (10-15)
  const studentUids: string[] = [];
  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const name = STUDENT_NAMES[i];
    const email = `${name.toLowerCase().replace(' ', '.')}@example.edu`;
    const uid = `student_seed_${i}`;
    const studentId = `STU${1000 + i}`;
    
    const userData = {
      uid: uid,
      email: email,
      name: name,
      role: 'student',
      studentId: studentId
    };
    
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, userData);
    studentUids.push(uid);
  }

  // 4. Create Enrollments, Grades, and Payments
  const paymentIds: string[] = [];
  for (const studentUid of studentUids) {
    // Enroll in 3-5 courses
    const numCourses = Math.floor(Math.random() * 3) + 3;
    const shuffledCourses = [...courseIds].sort(() => 0.5 - Math.random());
    const selectedCourses = shuffledCourses.slice(0, numCourses);
    
    for (const courseId of selectedCourses) {
      const enrollmentId = `enroll_${studentUid}_${courseId}`;
      const semester = SEMESTERS[Math.floor(Math.random() * SEMESTERS.length)];
      
      const enrollmentData = {
        id: enrollmentId,
        studentUid: studentUid,
        courseId: courseId,
        semester: semester
      };
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      batch.set(enrollmentRef, enrollmentData);
      
      // Add Grade for some courses (simulating past semesters)
      if (Math.random() > 0.3) {
        const gradeId = `grade_${studentUid}_${courseId}`;
        const gradeData = {
          id: gradeId,
          studentUid: studentUid,
          courseId: courseId,
          grade: GRADES[Math.floor(Math.random() * GRADES.length)],
          semester: semester
        };
        const gradeRef = doc(db, 'grades', gradeId);
        batch.set(gradeRef, gradeData);
      }
    }
    
    // Create Payments (1-2 per student to reach 15-25 total)
    const numPayments = Math.random() > 0.5 ? 2 : 1;
    for (let p = 0; p < numPayments; p++) {
      const paymentId = `pay_${studentUid}_${p}`;
      const status = Math.random() > 0.3 ? 'paid' : 'pending';
      const amount = Math.floor(Math.random() * 500) + 500; // 500 - 1000
      const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
      
      const paymentData = {
        id: paymentId,
        studentUid: studentUid,
        amount: amount,
        status: status,
        date: date,
        description: p === 0 ? 'Tuition Fee - Semester 1' : 'Library & Activity Fees'
      };
      const paymentRef = doc(db, 'payments', paymentId);
      batch.set(paymentRef, paymentData);
      paymentIds.push(paymentId);
    }
  }

  await batch.commit();
  console.log('Seed process completed successfully.');
  return { success: true, message: 'Sample data seeded successfully.' };
};
