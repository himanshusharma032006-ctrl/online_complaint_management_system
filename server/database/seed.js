require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('🌱 Seeding database...');

// Clear existing data
db.exec(`
  DELETE FROM feedback;
  DELETE FROM notifications;
  DELETE FROM comments;
  DELETE FROM complaint_updates;
  DELETE FROM complaints;
  DELETE FROM users;
  DELETE FROM departments;
`);

// Reset auto-increment sequences
db.exec(`
  DELETE FROM sqlite_sequence WHERE name IN ('feedback','notifications','comments','complaint_updates','complaints','users','departments');
`);

// ─── Departments ────────────────────────────────────────────────────────────
const insertDept = db.prepare(`INSERT INTO departments (name, code) VALUES (?, ?)`);
const depts = [
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Electronics & Communication Engineering', code: 'ECE' },
  { name: 'Mechanical Engineering', code: 'ME' },
  { name: 'Civil Engineering', code: 'CE' },
  { name: 'Master of Business Administration', code: 'MBA' },
  { name: 'Admin Office', code: 'ADMIN' },
];
const deptIds = {};
for (const d of depts) {
  const result = insertDept.run(d.name, d.code);
  deptIds[d.code] = result.lastInsertRowid;
}
console.log('✅ Departments seeded');

// ─── Users ───────────────────────────────────────────────────────────────────
const password = bcrypt.hashSync('Demo@1234', 10);
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password, role, department_id, enrollment_no)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const adminId = insertUser.run('System Admin', 'admin@college.edu', password, 'admin', deptIds['ADMIN'], null).lastInsertRowid;
const hodCseId = insertUser.run('Dr. Rajesh Kumar', 'hod.cse@college.edu', password, 'hod', deptIds['CSE'], null).lastInsertRowid;
const hodEceId = insertUser.run('Dr. Priya Sharma', 'hod.ece@college.edu', password, 'hod', deptIds['ECE'], null).lastInsertRowid;
const staffCseId = insertUser.run('Prof. Amit Verma', 'staff.cse@college.edu', password, 'staff', deptIds['CSE'], null).lastInsertRowid;
const staffCse2Id = insertUser.run('Prof. Sunita Singh', 'staff2.cse@college.edu', password, 'staff', deptIds['CSE'], null).lastInsertRowid;
const staffEceId = insertUser.run('Prof. Rahul Gupta', 'staff.ece@college.edu', password, 'staff', deptIds['ECE'], null).lastInsertRowid;
const studentId = insertUser.run('Arjun Mehta', 'student@college.edu', password, 'student', deptIds['CSE'], 'CS2024001').lastInsertRowid;
const student2Id = insertUser.run('Priya Patel', 'student2@college.edu', password, 'student', deptIds['CSE'], 'CS2024002').lastInsertRowid;
const student3Id = insertUser.run('Rahul Sharma', 'student3@college.edu', password, 'student', deptIds['ECE'], 'EC2024001').lastInsertRowid;
const student4Id = insertUser.run('Sneha Reddy', 'student4@college.edu', password, 'student', deptIds['ME'], 'ME2024001').lastInsertRowid;

// Update HOD links in departments
db.prepare('UPDATE departments SET hod_id = ? WHERE id = ?').run(hodCseId, deptIds['CSE']);
db.prepare('UPDATE departments SET hod_id = ? WHERE id = ?').run(hodEceId, deptIds['ECE']);
console.log('✅ Users seeded');

// ─── Complaints ──────────────────────────────────────────────────────────────
const insertComplaint = db.prepare(`
  INSERT INTO complaints (title, description, category, status, priority, student_id, department_id, assigned_to, is_anonymous, resolution_note, resolved_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString().slice(0, 19).replace('T', ' ');

const complaints = [
  // CSE - various statuses
  {
    title: 'Projector not working in Lab 3',
    desc: 'The projector in Computer Lab 3 has been malfunctioning for the past week. It shows a blurry image and sometimes switches off automatically during lectures.',
    category: 'IT & Labs', status: 'resolved', priority: 'high',
    student: studentId, dept: deptIds['CSE'], assigned: staffCseId, anon: 0,
    resolution: 'The projector bulb has been replaced and the unit is now fully functional.',
    resolved: daysAgo(2), created: daysAgo(10), updated: daysAgo(2)
  },
  {
    title: 'Wi-Fi connectivity issues in hostel',
    desc: 'The Wi-Fi in Block C hostel has been extremely slow and frequently disconnects. Students are unable to access online study materials and submit assignments on time.',
    category: 'Hostel', status: 'in_progress', priority: 'urgent',
    student: studentId, dept: deptIds['CSE'], assigned: staffCseId, anon: 0,
    resolution: null, resolved: null, created: daysAgo(5), updated: daysAgo(1)
  },
  {
    title: 'Unfair marking in mid-semester exam',
    desc: 'I believe my answer sheet for the Data Structures mid-semester exam was incorrectly evaluated. I answered the tree traversal question correctly but received 0 marks.',
    category: 'Examination', status: 'under_review', priority: 'high',
    student: studentId, dept: deptIds['CSE'], assigned: null, anon: 0,
    resolution: null, resolved: null, created: daysAgo(3), updated: daysAgo(3)
  },
  {
    title: 'Faculty consistently arriving late',
    desc: 'The instructor for Operating Systems (CS501) regularly arrives 15-20 minutes late and leaves 10 minutes early. This is affecting our learning significantly.',
    category: 'Faculty Behavior', status: 'assigned', priority: 'medium',
    student: student2Id, dept: deptIds['CSE'], assigned: staffCse2Id, anon: 1,
    resolution: null, resolved: null, created: daysAgo(7), updated: daysAgo(4)
  },
  {
    title: 'Library books not available for core subjects',
    desc: 'The library does not have sufficient copies of the recommended textbooks for 5th semester courses. Students are unable to borrow books as there are only 2 copies for 60 students.',
    category: 'Library', status: 'pending', priority: 'medium',
    student: student2Id, dept: deptIds['CSE'], assigned: null, anon: 0,
    resolution: null, resolved: null, created: daysAgo(1), updated: daysAgo(1)
  },
  // ECE complaints
  {
    title: 'Electronics lab equipment broken',
    desc: 'Multiple oscilloscopes in the ECE lab are not functioning properly. At least 5 out of 12 units are completely dead. This is hampering practical sessions.',
    category: 'IT & Labs', status: 'in_progress', priority: 'high',
    student: student3Id, dept: deptIds['ECE'], assigned: staffEceId, anon: 0,
    resolution: null, resolved: null, created: daysAgo(6), updated: daysAgo(2)
  },
  {
    title: 'Canteen food quality has deteriorated',
    desc: 'The food served in the main canteen has become unhygienic over the past month. There have been reports of students falling sick after eating there.',
    category: 'Canteen', status: 'resolved', priority: 'urgent',
    student: student3Id, dept: deptIds['ECE'], assigned: null, anon: 0,
    resolution: 'Canteen vendor has been warned and a health inspection was conducted. New hygiene protocols are in place.',
    resolved: daysAgo(3), created: daysAgo(14), updated: daysAgo(3)
  },
  {
    title: 'Bus route 4 frequently delayed',
    desc: 'College bus route 4 (covering Sector 18 area) is frequently delayed by 30-45 minutes, causing students to miss the first lecture of the day.',
    category: 'Transport', status: 'pending', priority: 'medium',
    student: student3Id, dept: deptIds['ECE'], assigned: null, anon: 0,
    resolution: null, resolved: null, created: daysAgo(2), updated: daysAgo(2)
  },
  // ME complaints
  {
    title: 'Ragging incident reported in hostel',
    desc: 'Senior students in Block A have been ragging freshers during night hours. This has created a hostile environment. Immediate action is needed.',
    category: 'Ragging', status: 'under_review', priority: 'urgent',
    student: student4Id, dept: deptIds['ME'], assigned: null, anon: 1,
    resolution: null, resolved: null, created: daysAgo(1), updated: daysAgo(1)
  },
  {
    title: 'Sports ground not maintained',
    desc: 'The cricket ground and football field have not been maintained for months. The grass is overgrown and the pitch is unusable. Annual sports event is approaching.',
    category: 'Sports & Cultural', status: 'assigned', priority: 'low',
    student: student4Id, dept: deptIds['ME'], assigned: null, anon: 0,
    resolution: null, resolved: null, created: daysAgo(8), updated: daysAgo(5)
  },
  {
    title: 'Scholarship disbursement delayed',
    desc: 'The government scholarship for merit students has not been credited for 3 months. Many students are facing financial difficulties due to this delay.',
    category: 'Financial/Fee', status: 'pending', priority: 'high',
    student: studentId, dept: deptIds['ADMIN'], assigned: null, anon: 0,
    resolution: null, resolved: null, created: daysAgo(4), updated: daysAgo(4)
  },
  {
    title: 'Classrooms not cleaned regularly',
    desc: 'The classrooms in Block B are not being cleaned daily. Dustbins are overflowing and floors are dirty, creating an unhygienic environment.',
    category: 'Infrastructure', status: 'resolved', priority: 'low',
    student: student2Id, dept: deptIds['CSE'], assigned: staffCseId, anon: 0,
    resolution: 'Cleaning schedule has been updated to twice daily. New dustbins have been installed.',
    resolved: daysAgo(5), created: daysAgo(20), updated: daysAgo(5)
  },
  {
    title: 'Online examination portal crashing',
    desc: 'The college online examination portal crashes repeatedly during practice tests. Multiple students have lost their progress. This is a critical issue before upcoming exams.',
    category: 'IT & Labs', status: 'rejected', priority: 'urgent',
    student: student3Id, dept: deptIds['ECE'], assigned: staffEceId, anon: 0,
    resolution: 'After investigation, the issue was found to be with the student\'s internet connection. The portal is working correctly.',
    resolved: daysAgo(7), created: daysAgo(15), updated: daysAgo(7)
  },
  {
    title: 'Administrative fee receipt not provided',
    desc: 'After paying the examination fee of Rs. 2500 at the admin office, I did not receive a proper receipt. I need this for my records and scholarship application.',
    category: 'Administrative', status: 'closed', priority: 'medium',
    student: student2Id, dept: deptIds['ADMIN'], assigned: null, anon: 0,
    resolution: 'Receipt has been issued. Student should collect from admin office counter 3.',
    resolved: daysAgo(10), created: daysAgo(25), updated: daysAgo(10)
  },
  {
    title: 'No drinking water facility near labs',
    desc: 'There is no water cooler or RO purifier near the engineering labs on the 3rd floor. Students have to travel all the way to the ground floor during short breaks.',
    category: 'Infrastructure', status: 'pending', priority: 'medium',
    student: studentId, dept: deptIds['CSE'], assigned: null, anon: 0,
    resolution: null, resolved: null, created: daysAgo(0), updated: daysAgo(0)
  },
];

const insertedComplaintIds = [];
for (const c of complaints) {
  const result = insertComplaint.run(
    c.title, c.desc, c.category, c.status, c.priority,
    c.student, c.dept, c.assigned ?? null, c.anon,
    c.resolution ?? null, c.resolved ?? null, c.created, c.updated
  );
  insertedComplaintIds.push(result.lastInsertRowid);
}
console.log(`✅ ${complaints.length} complaints seeded`);

// ─── Complaint Updates (timeline) ────────────────────────────────────────────
const insertUpdate = db.prepare(`
  INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, message, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Add timeline for first complaint (resolved)
const cid1 = insertedComplaintIds[0];
insertUpdate.run(cid1, studentId, null, 'pending', 'Complaint submitted', daysAgo(10));
insertUpdate.run(cid1, hodCseId, 'pending', 'assigned', 'Assigned to Prof. Amit Verma for resolution', daysAgo(9));
insertUpdate.run(cid1, staffCseId, 'assigned', 'in_progress', 'Investigating the issue, replacement part ordered', daysAgo(7));
insertUpdate.run(cid1, staffCseId, 'in_progress', 'resolved', 'Projector bulb replaced, unit is fully functional now', daysAgo(2));

// Add timeline for second complaint (in_progress)
const cid2 = insertedComplaintIds[1];
insertUpdate.run(cid2, studentId, null, 'pending', 'Complaint submitted', daysAgo(5));
insertUpdate.run(cid2, hodCseId, 'pending', 'under_review', 'Under review by IT department', daysAgo(4));
insertUpdate.run(cid2, hodCseId, 'under_review', 'assigned', 'Assigned to Prof. Amit Verma', daysAgo(3));
insertUpdate.run(cid2, staffCseId, 'assigned', 'in_progress', 'Working on fixing the network switches', daysAgo(1));

console.log('✅ Complaint updates seeded');

// ─── Comments ────────────────────────────────────────────────────────────────
const insertComment = db.prepare(`
  INSERT INTO comments (complaint_id, user_id, content, is_internal, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

insertComment.run(cid1, studentId, 'This issue has been persisting for over a week now. Please resolve ASAP.', 0, daysAgo(9));
insertComment.run(cid1, staffCseId, 'We have ordered the replacement part. Will update soon.', 0, daysAgo(7));
insertComment.run(cid1, staffCseId, 'Internal: Vendor confirmed delivery by tomorrow.', 1, daysAgo(4));
insertComment.run(cid1, studentId, 'Thank you for the quick resolution!', 0, daysAgo(2));

insertComment.run(cid2, studentId, 'The issue is very severe. Cannot download study materials.', 0, daysAgo(4));
insertComment.run(cid2, staffCseId, 'Internal: Need to replace 3 network switches in Block C.', 1, daysAgo(2));

console.log('✅ Comments seeded');

// ─── Notifications ───────────────────────────────────────────────────────────
const insertNotif = db.prepare(`
  INSERT INTO notifications (user_id, complaint_id, title, message, is_read, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertNotif.run(studentId, cid1, 'Complaint Resolved', 'Your complaint "Projector not working in Lab 3" has been resolved.', 0, daysAgo(2));
insertNotif.run(studentId, cid2, 'Status Updated', 'Your complaint "Wi-Fi connectivity issues in hostel" is now in progress.', 0, daysAgo(1));
insertNotif.run(staffCseId, cid1, 'Complaint Assigned', 'A complaint has been assigned to you: Projector not working in Lab 3', 1, daysAgo(9));
insertNotif.run(hodCseId, cid1, 'New Complaint', 'A new high-priority complaint has been submitted in your department.', 1, daysAgo(10));

console.log('✅ Notifications seeded');

// ─── Feedback ────────────────────────────────────────────────────────────────
const insertFeedback = db.prepare(`
  INSERT INTO feedback (complaint_id, student_id, rating, comment, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

insertFeedback.run(cid1, studentId, 5, 'Great service! The issue was resolved quickly and professionally.', daysAgo(2));

console.log('✅ Feedback seeded');
console.log('\n🎉 Database seeding complete!');
console.log('\n📋 Demo Credentials (password: Demo@1234):');
console.log('  admin@college.edu    → Admin');
console.log('  hod.cse@college.edu  → HOD (CSE)');
console.log('  staff.cse@college.edu → Staff (CSE)');
console.log('  student@college.edu  → Student (CSE)');
