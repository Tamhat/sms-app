import { PrismaClient, EnrolmentStatus, Classification } from '@prisma/client'

const prisma = new PrismaClient()

function getClassification(score: number): Classification {
  if (score >= 70) return 'DISTINCTION'
  if (score >= 60) return 'MERIT'
  if (score >= 40) return 'PASS'
  return 'FAIL'
}

async function generateStudentId(year: number, sequence: number): Promise<string> {
  return `SMS-${year}-${String(sequence).padStart(4, '0')}`
}

async function main() {
  console.log('🌱 Seeding database...')

  // ── Programmes ────────────────────────────────────────────────────────────
  const bscCS = await prisma.programme.upsert({
    where: { code: 'BSC-CS' },
    update: {},
    create: {
      name: 'BSc Computer Science',
      code: 'BSC-CS',
      feeAmount: 9250,
    },
  })

  const baBA = await prisma.programme.upsert({
    where: { code: 'BA-BA' },
    update: {},
    create: {
      name: 'BA Business Administration',
      code: 'BA-BA',
      feeAmount: 8500,
    },
  })

  const mscDS = await prisma.programme.upsert({
    where: { code: 'MSC-DS' },
    update: {},
    create: {
      name: 'MSc Data Science',
      code: 'MSC-DS',
      feeAmount: 11000,
    },
  })

  console.log('✅ Programmes created')

  // ── Students ──────────────────────────────────────────────────────────────
  const studentsData = [
    {
      seq: 1,
      fullName: 'Alice Pemberton',
      email: 'alice.pemberton@student.ac.uk',
      dateOfBirth: new Date('2001-03-15'),
      programmeId: bscCS.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.ENROLLED,
      feeAmount: Number(bscCS.feeAmount),
      dueDaysOffset: -30, // overdue
    },
    {
      seq: 2,
      fullName: 'Benjamin Okafor',
      email: 'benjamin.okafor@student.ac.uk',
      dateOfBirth: new Date('2000-07-22'),
      programmeId: baBA.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.ENROLLED,
      feeAmount: Number(baBA.feeAmount),
      dueDaysOffset: 60,
    },
    {
      seq: 3,
      fullName: 'Clara Hutchinson',
      email: 'clara.hutchinson@student.ac.uk',
      dateOfBirth: new Date('1999-11-08'),
      programmeId: mscDS.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.ENROLLED,
      feeAmount: Number(mscDS.feeAmount),
      dueDaysOffset: 30,
    },
    {
      seq: 4,
      fullName: 'David Mensah',
      email: 'david.mensah@student.ac.uk',
      dateOfBirth: new Date('2001-01-30'),
      programmeId: bscCS.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.DEFERRED,
      feeAmount: Number(bscCS.feeAmount),
      dueDaysOffset: -15, // overdue
    },
    {
      seq: 5,
      fullName: 'Evelyn Nakamura',
      email: 'evelyn.nakamura@student.ac.uk',
      dateOfBirth: new Date('2002-05-19'),
      programmeId: baBA.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.COMPLETED,
      feeAmount: Number(baBA.feeAmount),
      dueDaysOffset: -90,
    },
    {
      seq: 6,
      fullName: 'Femi Adeyemi',
      email: 'femi.adeyemi@student.ac.uk',
      dateOfBirth: new Date('2000-09-12'),
      programmeId: mscDS.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.ENROLLED,
      feeAmount: Number(mscDS.feeAmount),
      dueDaysOffset: 45,
    },
    {
      seq: 7,
      fullName: 'Grace Williamson',
      email: 'grace.williamson@student.ac.uk',
      dateOfBirth: new Date('2001-12-03'),
      programmeId: bscCS.id,
      academicYear: '2024/2025',
      enrolmentStatus: EnrolmentStatus.WITHDRAWN,
      feeAmount: Number(bscCS.feeAmount),
      dueDaysOffset: -60, // overdue
    },
  ]

  const students = []
  for (const s of studentsData) {
    const studentId = await generateStudentId(2025, s.seq)
    const student = await prisma.student.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        fullName: s.fullName,
        email: s.email,
        dateOfBirth: s.dateOfBirth,
        programmeId: s.programmeId,
        academicYear: s.academicYear,
        enrolmentStatus: s.enrolmentStatus,
      },
    })

    // Create fee record
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + s.dueDaysOffset)

    const feeRecord = await prisma.feeRecord.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        totalAmount: s.feeAmount,
        dueDate,
      },
    })

    // Add a partial payment for some students
    if ([1, 2, 3, 5, 6].includes(s.seq)) {
      const paymentAmount = s.seq === 5 ? s.feeAmount : s.feeAmount * 0.5
      const existing = await prisma.payment.findFirst({
        where: { feeRecordId: feeRecord.id },
      })
      if (!existing) {
        await prisma.payment.create({
          data: {
            feeRecordId: feeRecord.id,
            amount: paymentAmount,
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
            referenceNumber: `PAY-${student.studentId}-001`,
            notes: 'Initial payment',
          },
        })
      }
    }

    students.push(student)
  }
  console.log('✅ Students & fee records created')

  // ── Assessments ──────────────────────────────────────────────────────────
  const now = new Date()

  const assess1 = await prisma.assessment.upsert({
    where: { id: 'assess-seed-1' },
    update: {},
    create: {
      id: 'assess-seed-1',
      title: 'Introduction to Programming — Final Project',
      module: 'CS101',
      deadline: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    },
  })

  const assess2 = await prisma.assessment.upsert({
    where: { id: 'assess-seed-2' },
    update: {},
    create: {
      id: 'assess-seed-2',
      title: 'Business Strategy Report',
      module: 'BA201',
      deadline: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7), // 7 days ahead
    },
  })

  const assess3 = await prisma.assessment.upsert({
    where: { id: 'assess-seed-3' },
    update: {},
    create: {
      id: 'assess-seed-3',
      title: 'Data Analysis with Python',
      module: 'DS301',
      deadline: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14), // 14 days ahead
    },
  })

  console.log('✅ Assessments created')

  // ── Submissions ──────────────────────────────────────────────────────────
  const submissionsData = [
    { studentIdx: 0, assessment: assess1, isLate: false },
    { studentIdx: 1, assessment: assess1, isLate: true },
    { studentIdx: 2, assessment: assess1, isLate: false },
    { studentIdx: 5, assessment: assess1, isLate: false },
    { studentIdx: 1, assessment: assess2, isLate: false },
    { studentIdx: 4, assessment: assess2, isLate: false },
  ]

  for (const sub of submissionsData) {
    const student = students[sub.studentIdx]
    const existing = await prisma.submission.findUnique({
      where: { studentId_assessmentId: { studentId: student.id, assessmentId: sub.assessment.id } },
    })
    if (!existing) {
      await prisma.submission.create({
        data: {
          studentId: student.id,
          assessmentId: sub.assessment.id,
          fileName: `${student.fullName.split(' ')[0].toLowerCase()}_submission.pdf`,
          fileUrl: `/uploads/seed_submission_${student.studentId}_${sub.assessment.id}.pdf`,
          fileSize: 1024 * 512, // 512 KB
          isLate: sub.isLate,
          submittedAt: sub.isLate
            ? new Date(sub.assessment.deadline.getTime() + 1000 * 60 * 60 * 3) // 3 hours late
            : new Date(sub.assessment.deadline.getTime() - 1000 * 60 * 60 * 24), // 1 day before
        },
      })
    }
  }
  console.log('✅ Submissions created')

  // ── Grades ────────────────────────────────────────────────────────────────
  const gradesData = [
    { studentIdx: 0, assessment: assess1, score: 78, isPublished: true, feedback: 'Excellent work. Clean code and well-documented.' },
    { studentIdx: 1, assessment: assess1, score: 55, isPublished: true, feedback: 'Good effort, some logic errors to address.' },
    { studentIdx: 2, assessment: assess1, score: 82, isPublished: false, feedback: 'Outstanding analysis and presentation.' },
    { studentIdx: 5, assessment: assess1, score: 35, isPublished: false, feedback: 'Needs significant improvement.' },
    { studentIdx: 1, assessment: assess2, score: 65, isPublished: true, feedback: 'Well-structured report.' },
    { studentIdx: 4, assessment: assess2, score: 90, isPublished: true, feedback: 'Exceptional strategic insight.' },
  ]

  for (const g of gradesData) {
    const student = students[g.studentIdx]
    const existing = await prisma.grade.findUnique({
      where: { studentId_assessmentId: { studentId: student.id, assessmentId: g.assessment.id } },
    })
    if (!existing) {
      await prisma.grade.create({
        data: {
          studentId: student.id,
          assessmentId: g.assessment.id,
          score: g.score,
          classification: getClassification(g.score),
          isPublished: g.isPublished,
          publishedAt: g.isPublished ? new Date() : null,
          feedback: g.feedback,
        },
      })
    }
  }
  console.log('✅ Grades created')

  console.log('\n🎉 Seed complete!')
  console.log(`   Programmes: 3`)
  console.log(`   Students:   ${students.length}`)
  console.log(`   Assessments: 3`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
