import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Departments ──
  const deptICT = await prisma.department.upsert({
    where: { code: 'ICT' },
    update: {},
    create: {
      name: 'Information & Communications Technology',
      code: 'ICT',
      description: 'ICT department',
    },
  });
  const deptWorks = await prisma.department.upsert({
    where: { code: 'WORKS' },
    update: {},
    create: {
      name: 'Works & Housing',
      code: 'WORKS',
      description: 'Works and housing infrastructure',
    },
  });
  const deptHealth = await prisma.department.upsert({
    where: { code: 'HEALTH' },
    update: {},
    create: { name: 'Health', code: 'HEALTH', description: 'Health services' },
  });
  const deptEducation = await prisma.department.upsert({
    where: { code: 'EDUCATION' },
    update: {},
    create: {
      name: 'Education',
      code: 'EDUCATION',
      description: 'Education and learning',
    },
  });

  // ── Users ──
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      email: 'admin@kwmoc.gov.ng',
      fullName: 'Admin Officer',
      role: 'ADMIN_OFFICER' as const,
      designation: 'Admin Officer I',
      departmentId: deptICT.id,
    },
    {
      email: 'superadmin@kwmoc.gov.ng',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      designation: 'System Administrator',
    },
    {
      email: 'intake@kwmoc.gov.ng',
      fullName: 'Intake Officer',
      role: 'INTAKE_OFFICER' as const,
      designation: 'Intake Officer I',
      departmentId: deptICT.id,
    },
    {
      email: 'officer@kwmoc.gov.ng',
      fullName: 'Schedule Officer',
      role: 'SCHEDULE_OFFICER' as const,
      designation: 'Schedule Officer',
      departmentId: deptICT.id,
    },
    {
      email: 'asstdir@kwmoc.gov.ng',
      fullName: 'Assistant Director',
      role: 'ASSISTANT_DIRECTOR' as const,
      designation: 'Assistant Director',
      departmentId: deptWorks.id,
    },
    {
      email: 'depdir@kwmoc.gov.ng',
      fullName: 'Deputy Director',
      role: 'DEPUTY_DIRECTOR' as const,
      designation: 'Deputy Director',
      departmentId: deptWorks.id,
    },
    {
      email: 'director@kwmoc.gov.ng',
      fullName: 'Director HOD',
      role: 'DIRECTOR' as const,
      designation: 'Director',
      departmentId: deptICT.id,
    },
    {
      email: 'ps@kwmoc.gov.ng',
      fullName: 'Permanent Secretary',
      role: 'PERMANENT_SECRETARY' as const,
      designation: 'PS',
    },
    {
      email: 'commissioner@kwmoc.gov.ng',
      fullName: 'Hon. Commissioner',
      role: 'COMMISSIONER' as const,
      designation: 'Commissioner',
    },
    {
      email: 'auditor@kwmoc.gov.ng',
      fullName: 'Auditor General',
      role: 'AUDITOR' as const,
      designation: 'Auditor',
    },
    {
      email: 'officer2@kwmoc.gov.ng',
      fullName: 'Works Officer',
      role: 'SCHEDULE_OFFICER' as const,
      designation: 'Schedule Officer',
      departmentId: deptWorks.id,
    },
    {
      email: 'officer3@kwmoc.gov.ng',
      fullName: 'Health Officer',
      role: 'SCHEDULE_OFFICER' as const,
      designation: 'Schedule Officer',
      departmentId: deptHealth.id,
    },
    {
      email: 'director2@kwmoc.gov.ng',
      fullName: 'Works Director',
      role: 'DIRECTOR' as const,
      designation: 'Director',
      departmentId: deptWorks.id,
    },
    {
      email: 'director3@kwmoc.gov.ng',
      fullName: 'Health Director',
      role: 'DIRECTOR' as const,
      designation: 'Director',
      departmentId: deptHealth.id,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  // ── Citizens ──
  const citizens = [
    {
      email: 'citizen1@example.com',
      name: 'Aisha Ibrahim',
      phone: '08012345678',
      lga: 'ILORIN_WEST',
    },
    {
      email: 'citizen2@example.com',
      name: 'Bola Adeyemi',
      phone: '08023456789',
      lga: 'ILORIN_EAST',
    },
    {
      email: 'citizen3@example.com',
      name: 'Chidi Nwosu',
      phone: '08034567890',
      lga: 'OFFA',
    },
    {
      email: 'citizen4@example.com',
      name: null,
      phone: null,
      lga: null,
      isAnonymous: true,
    },
    {
      email: 'citizen5@example.com',
      name: 'Fatima Musa',
      phone: '08045678901',
      lga: 'OYO',
    },
  ];

  for (const c of citizens) {
    await prisma.citizen.upsert({
      where: { email: c.email },
      update: {},
      create: c as any,
    });
  }

  // ── Tickets ──
  const allCitizens = await prisma.citizen.findMany();
  const allOfficers = await prisma.user.findMany({
    where: { role: 'SCHEDULE_OFFICER' },
  });
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN_OFFICER' },
  });
  const directorUser = await prisma.user.findFirst({
    where: { role: 'DIRECTOR', departmentId: deptICT.id },
  });

  const ticketData = [
    {
      subject: 'Pothole on Unity Road',
      description:
        'There is a large pothole on Unity Road near the roundabout that has been causing accidents.',
      category: 'ROADS',
      priority: 'P2' as const,
      status: 'ACKNOWLEDGED' as const,
      channel: 'WEB' as const,
      citizenIdx: 0,
      departmentId: deptWorks.id,
    },
    {
      subject: 'Delayed salary payment',
      description:
        'My salary for the last 3 months has not been paid despite all documentation being complete.',
      category: 'SALARY',
      priority: 'P1' as const,
      status: 'ASSIGNED' as const,
      channel: 'WALK_IN' as const,
      citizenIdx: 1,
      departmentId: deptICT.id,
      officerIdx: 0,
    },
    {
      subject: 'Hospital lacks equipment',
      description:
        'The general hospital in our LGA does not have basic equipment like X-ray machines.',
      category: 'HEALTH',
      priority: 'P2' as const,
      status: 'IN_PROGRESS' as const,
      channel: 'WEB' as const,
      citizenIdx: 2,
      departmentId: deptHealth.id,
      officerIdx: 2,
    },
    {
      subject: 'School building collapsing',
      description:
        'The primary school building in our community is in a state of disrepair and poses danger to students.',
      category: 'EDUCATION',
      priority: 'P1' as const,
      status: 'RESOLVED' as const,
      channel: 'PHONE' as const,
      citizenIdx: 4,
      departmentId: deptEducation.id,
      officerIdx: 0,
    },
    {
      subject: 'Water supply interruption',
      description:
        'Our community has not had pipe-borne water for 2 weeks now.',
      category: 'WATER',
      priority: 'P2' as const,
      status: 'ACKNOWLEDGED' as const,
      channel: 'WEB' as const,
      citizenIdx: 3,
      departmentId: deptWorks.id,
    },
    {
      subject: 'Traffic light malfunction',
      description:
        'The traffic light at the Post Office junction has been non-functional for a week.',
      category: 'ROADS',
      priority: 'P3' as const,
      status: 'ACKNOWLEDGED' as const,
      channel: 'EMAIL' as const,
      citizenIdx: 0,
      departmentId: deptWorks.id,
    },
    {
      subject: 'Internet connectivity issues',
      description:
        'Government offices in our area have no internet access for the past month.',
      category: 'ICT',
      priority: 'P2' as const,
      status: 'CLOSED' as const,
      channel: 'WEB' as const,
      citizenIdx: 1,
      departmentId: deptICT.id,
      officerIdx: 0,
    },
    {
      subject: 'Delay in pension payment',
      description:
        'Pensioners have not received their monthly pension for 3 months.',
      category: 'PENSION',
      priority: 'P1' as const,
      status: 'REOPENED' as const,
      channel: 'LETTER' as const,
      citizenIdx: 4,
      departmentId: deptICT.id,
    },
    {
      subject: 'Market sanitation problem',
      description: 'The main market is very dirty and needs urgent cleaning.',
      category: 'SANITATION',
      priority: 'P3' as const,
      status: 'ACKNOWLEDGED' as const,
      channel: 'WALK_IN' as const,
      citizenIdx: 2,
      departmentId: deptWorks.id,
    },
    {
      subject: 'Unresponsive government hotline',
      description:
        'The government complaint hotline has been unreachable for days.',
      category: 'ICT',
      priority: 'P2' as const,
      status: 'IN_PROGRESS' as const,
      channel: 'WEB' as const,
      citizenIdx: 0,
      departmentId: deptICT.id,
      officerIdx: 0,
    },
  ];

  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i];
    const citizen = allCitizens[t.citizenIdx];
    const officer =
      t.officerIdx !== undefined ? allOfficers[t.officerIdx] : null;

    const code = `KWMOC-2026-${String(i + 1).padStart(6, '0')}`;
    const trackingToken = `tok_${Math.random().toString(36).slice(2)}`;
    const passcode = String(Math.floor(100000 + Math.random() * 900000));

    const data: any = {
      ticketCode: code,
      subject: t.subject,
      description: t.description,
      category: t.category,
      status: t.status,
      channel: t.channel,
      lga: allCitizens[t.citizenIdx]?.lga || 'ILORIN_WEST',
      citizenId: citizen.id,
      departmentId: t.departmentId || null,
      trackingToken,
      trackingPasscode: passcode,
    };

    if (t.priority) data.priority = t.priority;
    if (officer) data.assignedOfficerId = officer.id;
    if (
      ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'].includes(
        t.status,
      )
    ) {
      data.triagedAt = new Date();
      data.triagedById = adminUser?.id;
    }
    if (['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(t.status)) {
      data.slaStartedAt = new Date(Date.now() - 48 * 3600000);
      data.slaTargetHours =
        t.priority === 'P1' ? 24 : t.priority === 'P2' ? 72 : 240;
    }
    if (t.status === 'RESOLVED') {
      data.resolutionText =
        'The issue has been addressed. Equipment has been procured and deployed.';
      data.resolvedAt = new Date(Date.now() - 24 * 3600000);
      data.resolvedById = officer?.id;
    }
    if (t.status === 'CLOSED') {
      data.resolutionText =
        'Internet connectivity has been restored across all government offices.';
      data.resolvedAt = new Date(Date.now() - 72 * 3600000);
      data.resolvedById = officer?.id;
      data.closedAt = new Date(Date.now() - 48 * 3600000);
    }
    if (t.status === 'REOPENED') {
      data.reopenCount = 1;
      data.lastReopenedAt = new Date();
    }

    await prisma.ticket.upsert({
      where: { ticketCode: code },
      update: {},
      create: data,
    });
  }

  const seedYear = 2026;
  await prisma.ticketSequence.upsert({
    where: { year: seedYear },
    update: { lastValue: ticketData.length },
    create: { id: seedYear, year: seedYear, lastValue: ticketData.length },
  });

  // ── SLA Config ──
  const slaConfigs = [
    {
      priority: 'P1',
      firstResponseHours: 1,
      resolutionHours: 24,
      warningThreshold: 0.8,
      escalationChain: JSON.stringify([
        'DIRECTOR',
        'PERMANENT_SECRETARY',
        'COMMISSIONER',
      ]),
    },
    {
      priority: 'P2',
      firstResponseHours: 4,
      resolutionHours: 72,
      warningThreshold: 0.8,
      escalationChain: JSON.stringify([
        'DIRECTOR',
        'PERMANENT_SECRETARY',
        'COMMISSIONER',
      ]),
    },
    {
      priority: 'P3',
      firstResponseHours: 24,
      resolutionHours: 240,
      warningThreshold: 0.8,
      escalationChain: JSON.stringify(['DIRECTOR', 'PERMANENT_SECRETARY']),
    },
    {
      priority: 'P4',
      firstResponseHours: 48,
      resolutionHours: 360,
      warningThreshold: 0.8,
      escalationChain: JSON.stringify(['DIRECTOR']),
    },
  ];

  for (const sc of slaConfigs) {
    await prisma.slaConfig.upsert({
      where: { priority: sc.priority as any },
      update: {},
      create: sc as any,
    });
  }

  // ── Routing Rules ──
  const routingRules = [
    { category: 'ICT', departmentId: deptICT.id, priorityRank: 1 },
    { category: 'ROADS', departmentId: deptWorks.id, priorityRank: 1 },
    { category: 'HEALTH', departmentId: deptHealth.id, priorityRank: 1 },
    { category: 'EDUCATION', departmentId: deptEducation.id, priorityRank: 1 },
    { category: 'WATER', departmentId: deptWorks.id, priorityRank: 2 },
    { category: 'SALARY', departmentId: deptICT.id, priorityRank: 2 },
    { category: 'PENSION', departmentId: deptICT.id, priorityRank: 3 },
    { category: 'SANITATION', departmentId: deptWorks.id, priorityRank: 3 },
  ];

  for (const rule of routingRules) {
    await prisma.routingRule.create({ data: rule });
  }

  // ── Ticket Movements ──
  const tickets = await prisma.ticket.findMany();
  for (const ticket of tickets) {
    if (['ACKNOWLEDGED'].includes(ticket.status)) {
      await prisma.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: 'SUBMITTED',
          note: 'Complaint submitted',
        },
      });
    }
    if (
      ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'].includes(
        ticket.status,
      )
    ) {
      await prisma.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: 'SUBMITTED',
          note: 'Complaint submitted',
        },
      });
      await prisma.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: 'ROUTED',
          note: `Routed to department`,
          toUserId: ticket.departmentId ? undefined : undefined,
        },
      });
      await prisma.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: 'ASSIGNED',
          note: 'Assigned to officer',
          toUserId: ticket.assignedOfficerId,
        },
      });
    }
    if (['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(ticket.status)) {
      await prisma.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: 'SUBMITTED' as any,
          note: 'Investigation started',
        },
      });
    }
    if (ticket.status === 'REOPENED') {
      await prisma.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: 'REOPENED',
          note: 'Citizen not satisfied — reopened',
        },
      });
    }
  }

  console.log('✅ Seed completed!');
  console.log('📋 Test accounts (password: Password123!):');
  console.log('   admin@kwmoc.gov.ng — Admin Officer');
  console.log('   superadmin@kwmoc.gov.ng — Super Admin');
  console.log('   intake@kwmoc.gov.ng — Intake Officer');
  console.log('   officer@kwmoc.gov.ng — Schedule Officer');
  console.log('   director@kwmoc.gov.ng — Director (HOD)');
  console.log('   ps@kwmoc.gov.ng — Permanent Secretary');
  console.log('   commissioner@kwmoc.gov.ng — Commissioner');
  console.log('   auditor@kwmoc.gov.ng — Auditor');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
