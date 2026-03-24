import { Course, Enrollment, Grade, Payment, UserProfile } from '../types';
import { createDocument, getCollection } from './firestore';

const DEPARTMENTS = [
  { code: 'CSC', name: 'Computer Science' },
  { code: 'APT', name: 'Information Technology' },
  { code: 'BUS', name: 'Business Administration' },
  { code: 'FIN', name: 'Finance' },
  { code: 'ACC', name: 'Accounting' },
  { code: 'ENG', name: 'Engineering' },
  { code: 'PSY', name: 'Psychology' },
];

const COURSE_TEMPLATES = [
  { dept: 'CSC', level: 1000, name: 'Introduction to Programming', credits: 3 },
  { dept: 'CSC', level: 1000, name: 'Computer Organization', credits: 3 },
  { dept: 'CSC', level: 2000, name: 'Data Structures', credits: 3 },
  { dept: 'CSC', level: 2000, name: 'Object Oriented Programming', credits: 3 },
  { dept: 'CSC', level: 3000, name: 'Database Systems', credits: 3 },
  { dept: 'CSC', level: 3000, name: 'Operating Systems', credits: 3 },
  { dept: 'CSC', level: 4000, name: 'Artificial Intelligence', credits: 3 },
  { dept: 'CSC', level: 4000, name: 'Software Engineering', credits: 3 },
  
  { dept: 'APT', level: 1000, name: 'Fundamentals of IT', credits: 3 },
  { dept: 'APT', level: 2000, name: 'Digital Electronics', credits: 3 },
  { dept: 'APT', level: 2000, name: 'Network Fundamentals', credits: 3 },
  { dept: 'APT', level: 3000, name: 'Web Development', credits: 3 },
  { dept: 'APT', level: 3000, name: 'Cyber Security', credits: 3 },
  { dept: 'APT', level: 4000, name: 'Cloud Computing', credits: 3 },
  
  { dept: 'BUS', level: 1000, name: 'Principles of Management', credits: 3 },
  { dept: 'BUS', level: 1000, name: 'Business Communication', credits: 3 },
  { dept: 'BUS', level: 2000, name: 'Organizational Behavior', credits: 3 },
  { dept: 'BUS', level: 3000, name: 'Strategic Management', credits: 3 },
  { dept: 'BUS', level: 3000, name: 'Marketing Management', credits: 3 },
  { dept: 'BUS', level: 4000, name: 'Entrepreneurship', credits: 3 },
  
  { dept: 'FIN', level: 1000, name: 'Introduction to Finance', credits: 3 },
  { dept: 'FIN', level: 2000, name: 'Financial Accounting', credits: 3 },
  { dept: 'FIN', level: 2000, name: 'Corporate Finance', credits: 3 },
  { dept: 'FIN', level: 3000, name: 'Investment Analysis', credits: 3 },
  { dept: 'FIN', level: 4000, name: 'International Finance', credits: 3 },
  
  { dept: 'ACC', level: 1000, name: 'Accounting I', credits: 3 },
  { dept: 'ACC', level: 2000, name: 'Cost Accounting', credits: 3 },
  { dept: 'ACC', level: 3000, name: 'Auditing', credits: 3 },
  { dept: 'ACC', level: 4000, name: 'Taxation', credits: 3 },
  
  { dept: 'ENG', level: 1000, name: 'Engineering Mathematics', credits: 3 },
  { dept: 'ENG', level: 1000, name: 'Introduction to Engineering', credits: 3 },
  { dept: 'ENG', level: 2000, name: 'Circuit Theory', credits: 3 },
  { dept: 'ENG', level: 3000, name: 'Control Systems', credits: 3 },
  { dept: 'ENG', level: 4000, name: 'Robotics', credits: 3 },
  
  { dept: 'PSY', level: 1000, name: 'Introduction to Psychology', credits: 3 },
  { dept: 'PSY', level: 2000, name: 'Social Psychology', credits: 3 },
  { dept: 'PSY', level: 3000, name: 'Cognitive Psychology', credits: 3 },
  { dept: 'PSY', level: 4000, name: 'Clinical Psychology', credits: 3 },
];

export const seedSampleData = async () => {
  console.log('Starting data seeding...');
  
  // 1. Seed Courses
  const courses: Course[] = [];
  for (const template of COURSE_TEMPLATES) {
    const id = Math.random().toString(36).substr(2, 9);
    const code = `${template.dept}${template.level + Math.floor(Math.random() * 100)}`;
    const course: Course = {
      id,
      name: template.name,
      code,
      credits: template.credits,
      department: DEPARTMENTS.find(d => d.code === template.dept)?.name || template.dept,
      description: `A comprehensive course on ${template.name} covering fundamental to advanced concepts.`,
    };
    await createDocument('courses', id, course);
    courses.push(course);
  }
  console.log(`Seeded ${courses.length} courses.`);

  // 2. Get all students
  const users = await getCollection<UserProfile>('users');
  const students = users.filter(u => u.role === 'student');
  
  if (students.length > 0) {
    for (const student of students) {
      // Randomly enroll in 3-5 courses
      const numToEnroll = Math.floor(Math.random() * 3) + 3;
      const shuffled = [...courses].sort(() => 0.5 - Math.random());
      const selectedCourses = shuffled.slice(0, numToEnroll);
      
      for (const course of selectedCourses) {
        const enrollmentId = Math.random().toString(36).substr(2, 9);
        const enrollment: Enrollment = {
          id: enrollmentId,
          studentUid: student.uid,
          courseId: course.id,
          semester: 'Spring 2026',
        };
        await createDocument('enrollments', enrollmentId, enrollment);
        
        // Add a grade for some courses
        if (Math.random() > 0.3) {
          const gradeId = Math.random().toString(36).substr(2, 9);
          const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
          const grade: Grade = {
            id: gradeId,
            studentUid: student.uid,
            courseId: course.id,
            grade: grades[Math.floor(Math.random() * grades.length)],
            semester: 'Spring 2026',
          };
          await createDocument('grades', gradeId, grade);
        }
      }
      
      // Add a sample payment
      const paymentId = Math.random().toString(36).substr(2, 9);
      const payment: Payment = {
        id: paymentId,
        studentUid: student.uid,
        amount: 1500,
        status: Math.random() > 0.5 ? 'paid' : 'pending',
        date: new Date().toISOString(),
        description: 'Tuition Fees - Spring 2026',
      };
      await createDocument('payments', paymentId, payment);
    }
    console.log(`Seeded data for ${students.length} students.`);
  }

  return true;
};
