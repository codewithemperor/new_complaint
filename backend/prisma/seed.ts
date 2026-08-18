import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Information Services', code: 'ISV', description: 'ICT, records and information management' },
  { name: 'Public Orientation', code: 'POR', description: 'Public enquiries, orientation and citizen engagement' },
  { name: 'Graphics', code: 'GRP', description: 'Design, printing and visual communications' },
  { name: 'Culture and Tourism', code: 'CTU', description: 'Culture, arts, heritage and tourism' },
  { name: 'Finance & Supply', code: 'FNS', description: 'Finance, accounts and supply chain' },
  { name: 'Planning, Research and Statistics', code: 'PRS', description: 'Planning, research, monitoring and statistics' },
  { name: 'Admin Department', code: 'ADM', description: 'Administration and human resources' },
] as const;

const CATEGORIES = {
  SERVICE_QUALITY: 'Service quality',
  DELAYED_ACTION: 'Delayed action',
  STAFF_CONDUCT: 'Staff conduct',
  PAYMENT_PROCUREMENT: 'Payment or procurement',
  PUBLIC_INFORMATION: 'Public information request',
  FACILITY_EQUIPMENT: 'Facility or equipment',
  SAFETY_SECURITY: 'Safety or security',
  RECORDS_DATA: 'Records or data',
  GENERAL: 'General complaint',
} as const;

const PASSWORD = 'Password123!';

async function main() {
  console.log('🌱 Seeding database...');

  // ── Departments ──
  const deptByCode: Record<string, { id: string }> = {};
  for (const d of DEPARTMENTS) {
    const row = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: { name: d.name, code: d.code, description: d.description },
    });
    deptByCode[d.code] = row;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Users ──
  // SUPER_ADMIN = an ADMIN with isSuperAdmin = true (no separate role).
  const users = [
    {
      email: 'superadmin@kwmoc.gov.ng',
      fullName: 'Super Admin',
      role: 'ADMIN' as const,
      isSuperAdmin: true,
      designation: 'System Administrator',
      permissions: ['ALL'] as const,
    },
    {
      // Admin with full module access (every permission explicitly).
      email: 'admin@kwmoc.gov.ng',
      fullName: 'Administrator',
      role: 'ADMIN' as const,
      isSuperAdmin: false,
      designation: 'Administrator',
      permissions: ['ALL'] as const,
    },
    {
      // Admin with limited access: intake + reports only.
      email: 'intake.admin@kwmoc.gov.ng',
      fullName: 'Intake & Reports Admin',
      role: 'ADMIN' as const,
      isSuperAdmin: false,
      designation: 'Intake Officer',
      permissions: ['INTAKE', 'REPORTS'] as const,
    },
    {
      // Department staff in Information Services.
      email: 'staff@kwmoc.gov.ng',
      fullName: 'Abdulrahman Bello',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Information Services Officer',
      departmentId: deptByCode.ISV.id,
    },
    {
      email: 'staff.public@kwmoc.gov.ng',
      fullName: 'Zainab Olayinka',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Public Orientation Officer',
      departmentId: deptByCode.POR.id,
    },
    {
      email: 'staff.graphics@kwmoc.gov.ng',
      fullName: 'Tunde Balogun',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Graphics Officer',
      departmentId: deptByCode.GRP.id,
    },
    {
      email: 'staff.tourism@kwmoc.gov.ng',
      fullName: 'Maryam Sulu-Gambari',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Culture and Tourism Officer',
      departmentId: deptByCode.CTU.id,
    },
    {
      email: 'staff.finance@kwmoc.gov.ng',
      fullName: 'Kemi Ajibade',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Finance and Supply Officer',
      departmentId: deptByCode.FNS.id,
    },
    {
      email: 'staff.planning@kwmoc.gov.ng',
      fullName: 'Ibrahim Sanni',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Planning and Statistics Officer',
      departmentId: deptByCode.PRS.id,
    },
    {
      email: 'staff.admin@kwmoc.gov.ng',
      fullName: 'Grace Adewole',
      role: 'DEPARTMENT_STAFF' as const,
      designation: 'Administrative Officer',
      departmentId: deptByCode.ADM.id,
    },
    {
      email: 'hod@kwmoc.gov.ng',
      fullName: 'Dr. Yusuf Abdulkareem',
      role: 'DEPARTMENT_HOD' as const,
      designation: 'Head of Department',
      departmentId: deptByCode.ISV.id,
    },
    {
      email: 'hod.finance@kwmoc.gov.ng',
      fullName: 'Mrs. Folake Jimoh',
      role: 'DEPARTMENT_HOD' as const,
      designation: 'Head of Department',
      departmentId: deptByCode.FNS.id,
    },
    {
      email: 'ps@kwmoc.gov.ng',
      fullName: 'Permanent Secretary',
      role: 'PERMANENT_SECRETARY' as const,
      designation: 'Permanent Secretary',
    },
    {
      email: 'commissioner@kwmoc.gov.ng',
      fullName: 'Commissioner',
      role: 'COMMISSIONER' as const,
      designation: 'Commissioner',
    },
    {
      email: 'auditor@kwmoc.gov.ng',
      fullName: 'Auditor',
      role: 'AUDITOR' as const,
      designation: 'Auditor',
    },
  ];

  for (const u of users) {
    const { permissions, ...base } = u;
    const created = await prisma.user.upsert({
      where: { email: base.email },
      update: {
        fullName: base.fullName,
        role: base.role,
        isSuperAdmin: (base as any).isSuperAdmin ?? false,
        designation: base.designation,
        departmentId: base.departmentId,
      },
      create: {
        email: base.email,
        fullName: base.fullName,
        role: base.role,
        isSuperAdmin: (base as any).isSuperAdmin ?? false,
        designation: base.designation,
        departmentId: base.departmentId,
        passwordHash,
      },
      select: { id: true, email: true },
    });

    // Replace permissions for ADMIN users (idempotent).
    if (base.role === 'ADMIN' && permissions?.length) {
      await prisma.userPermission.deleteMany({ where: { userId: created.id } });
      await prisma.userPermission.createMany({
        data: permissions.map((p) => ({ userId: created.id, permission: p as any })),
      });
    }
  }

  // ── Citizens ──
  const citizens = [
    { email: 'citizen1@example.com', name: 'Aisha Ibrahim', phone: '08012345678', lga: 'ILORIN_WEST' },
    { email: 'citizen2@example.com', name: 'Bola Adeyemi', phone: '08023456789', lga: 'ILORIN_EAST' },
    { email: 'citizen3@example.com', name: 'Chidi Nwosu', phone: '08034567890', lga: 'OFFA' },
    { email: 'citizen4@example.com', name: null, phone: null, lga: null, isAnonymous: true },
    { email: 'citizen5@example.com', name: 'Fatima Musa', phone: '08045678901', lga: 'OYO' },
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
  const officerByDeptCode = Object.fromEntries(
    await Promise.all(
      DEPARTMENTS.map(async (department) => {
        const officer = await prisma.user.findFirst({
          where: { role: 'DEPARTMENT_STAFF', departmentId: deptByCode[department.code].id },
        });
        return [department.code, officer] as const;
      }),
    ),
  );
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  const ticketData = [
    {
      subject: 'Internet outage in ministry offices',
      description: 'Government offices in our area have had no internet access for the past week.',
      category: CATEGORIES.FACILITY_EQUIPMENT,
      priority: 'P2' as const,
      status: 'ACKNOWLEDGED' as const,
      channel: 'WEB' as const,
      citizenIdx: 0,
      departmentId: deptByCode.ISV.id,
      officer: officerByDeptCode.ISV,
    },
    {
      subject: 'Unclear response on a submitted enquiry',
      description: 'I submitted an enquiry weeks ago and have not received any orientation or feedback.',
      category: CATEGORIES.PUBLIC_INFORMATION,
      priority: 'P3' as const,
      status: 'ASSIGNED' as const,
      channel: 'WALK_IN' as const,
      citizenIdx: 1,
      departmentId: deptByCode.POR.id,
      officer: officerByDeptCode.POR,
    },
    {
      subject: 'Print job not delivered',
      description: 'A design and print request submitted a month ago has not been delivered.',
      category: CATEGORIES.DELAYED_ACTION,
      priority: 'P3' as const,
      status: 'IN_PROGRESS' as const,
      channel: 'WEB' as const,
      citizenIdx: 2,
      departmentId: deptByCode.GRP.id,
      officer: officerByDeptCode.GRP,
    },
    {
      subject: 'Tourism site needs maintenance',
      description: 'A major tourism site is in disrepair and needs urgent attention.',
      category: CATEGORIES.FACILITY_EQUIPMENT,
      priority: 'P2' as const,
      status: 'RESOLVED' as const,
      channel: 'PHONE' as const,
      citizenIdx: 4,
      departmentId: deptByCode.CTU.id,
      officer: officerByDeptCode.CTU,
    },
    {
      subject: 'Delayed payment',
      description: 'A payment due to my organisation has been delayed despite completed documentation.',
      category: CATEGORIES.PAYMENT_PROCUREMENT,
      priority: 'P1' as const,
      status: 'CLOSED' as const,
      channel: 'EMAIL' as const,
      citizenIdx: 1,
      departmentId: deptByCode.FNS.id,
      officer: officerByDeptCode.FNS,
    },
    {
      subject: 'Request for statistical data',
      description: 'I requested published statistics but have not received them.',
      category: CATEGORIES.RECORDS_DATA,
      priority: 'P4' as const,
      status: 'REOPENED' as const,
      channel: 'LETTER' as const,
      citizenIdx: 4,
      departmentId: deptByCode.PRS.id,
      officer: officerByDeptCode.PRS,
    },
  ];

  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i];
    const citizen = allCitizens[t.citizenIdx];
    const code = `KWMOC-2026-${String(i + 1).padStart(6, '0')}`;
    const trackingToken = `seed_token_${String(i + 1).padStart(6, '0')}`;
    const passcode = String(958860 + i + 1);

    const data: any = {
      ticketCode: code,
      subject: t.subject,
      description: t.description,
      category: t.category,
      status: t.status,
      channel: t.channel,
      lga: citizen?.lga || 'ILORIN_WEST',
      citizenId: citizen.id,
      departmentId: t.departmentId,
      trackingToken,
      trackingPasscode: passcode,
    };
    if (t.priority) data.priority = t.priority;
    if (t.officer) data.assignedOfficerId = t.officer.id;
    if (['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'].includes(t.status)) {
      data.triagedAt = new Date();
      data.triagedById = adminUser?.id;
    }
    if (['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(t.status)) {
      data.slaStartedAt = new Date(Date.now() - 48 * 3600000);
      data.slaTargetHours = t.priority === 'P1' ? 24 : t.priority === 'P2' ? 72 : 240;
    }
    if (t.status === 'RESOLVED') {
      data.resolutionText = 'The issue has been addressed.';
      data.resolvedAt = new Date(Date.now() - 24 * 3600000);
      data.resolvedById = t.officer?.id;
    }
    if (t.status === 'CLOSED') {
      data.resolutionText = 'Resolved and confirmed.';
      data.resolvedAt = new Date(Date.now() - 72 * 3600000);
      data.resolvedById = t.officer?.id;
      data.closedAt = new Date(Date.now() - 48 * 3600000);
    }
    if (t.status === 'REOPENED') {
      data.reopenCount = 1;
      data.lastReopenedAt = new Date();
    }

    await prisma.ticket.upsert({
      where: { ticketCode: code },
      update: data,
      create: data,
    });
  }

  await prisma.ticketSequence.upsert({
    where: { year: 2026 },
    update: { lastValue: ticketData.length },
    create: { id: 2026, year: 2026, lastValue: ticketData.length },
  });

  // ── SLA config (escalation chain: HOD → PS → Commissioner) ──
  const slaConfigs = [
    { priority: 'P1', firstResponseHours: 1, resolutionHours: 24, warningThreshold: 0.8, escalationChain: JSON.stringify(['DEPARTMENT_HOD', 'PERMANENT_SECRETARY', 'COMMISSIONER']) },
    { priority: 'P2', firstResponseHours: 4, resolutionHours: 72, warningThreshold: 0.8, escalationChain: JSON.stringify(['DEPARTMENT_HOD', 'PERMANENT_SECRETARY', 'COMMISSIONER']) },
    { priority: 'P3', firstResponseHours: 24, resolutionHours: 240, warningThreshold: 0.8, escalationChain: JSON.stringify(['DEPARTMENT_HOD', 'PERMANENT_SECRETARY']) },
    { priority: 'P4', firstResponseHours: 48, resolutionHours: 360, warningThreshold: 0.8, escalationChain: JSON.stringify(['DEPARTMENT_HOD']) },
  ];
  for (const sc of slaConfigs) {
    await prisma.slaConfig.upsert({
      where: { priority: sc.priority as any },
      update: { escalationChain: sc.escalationChain },
      create: sc as any,
    });
  }

  // ── Routing rules (issue category → owning department) ──
  const routingRules = [
    { category: CATEGORIES.SERVICE_QUALITY, departmentId: deptByCode.POR.id, priorityRank: 1 },
    { category: CATEGORIES.DELAYED_ACTION, departmentId: deptByCode.ADM.id, priorityRank: 1 },
    { category: CATEGORIES.STAFF_CONDUCT, departmentId: deptByCode.ADM.id, priorityRank: 1 },
    { category: CATEGORIES.PAYMENT_PROCUREMENT, departmentId: deptByCode.FNS.id, priorityRank: 1 },
    { category: CATEGORIES.PUBLIC_INFORMATION, departmentId: deptByCode.POR.id, priorityRank: 1 },
    { category: CATEGORIES.FACILITY_EQUIPMENT, departmentId: deptByCode.ISV.id, priorityRank: 1 },
    { category: CATEGORIES.SAFETY_SECURITY, departmentId: deptByCode.ADM.id, priorityRank: 1 },
    { category: CATEGORIES.RECORDS_DATA, departmentId: deptByCode.PRS.id, priorityRank: 1 },
    { category: CATEGORIES.GENERAL, departmentId: deptByCode.ADM.id, priorityRank: 1 },
  ];

  await prisma.routingRule.updateMany({
    where: { category: { in: DEPARTMENTS.map((d) => d.name) } },
    data: { isActive: false },
  });

  for (const rule of routingRules) {
    const existing = await prisma.routingRule.findFirst({ where: { category: rule.category } });
    if (existing) {
      await prisma.routingRule.update({
        where: { id: existing.id },
        data: {
          departmentId: rule.departmentId,
          priorityRank: rule.priorityRank,
          isActive: true,
        },
      });
    } else {
      await prisma.routingRule.create({ data: rule });
    }
  }

  console.log('✅ Seed completed!');
  console.log(`📋 Test accounts (password: ${PASSWORD}):`);
  console.log('   superadmin@kwmoc.gov.ng       — Super Admin (ADMIN + isSuperAdmin, ALL perms)');
  console.log('   admin@kwmoc.gov.ng            — Administrator (ADMIN, ALL perms)');
  console.log('   intake.admin@kwmoc.gov.ng     — Admin (INTAKE + REPORTS only)');
  console.log('   staff@kwmoc.gov.ng            — Department Staff (Information Services)');
  console.log('   hod@kwmoc.gov.ng              — Department HOD (Information Services)');
  console.log('   ps@kwmoc.gov.ng               — Permanent Secretary');
  console.log('   commissioner@kwmoc.gov.ng     — Commissioner');
  console.log('   auditor@kwmoc.gov.ng          — Auditor (read-only)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
