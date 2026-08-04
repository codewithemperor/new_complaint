import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Role } from '../common/types/role';
import { Permission } from '../common/types/permission';

const BCRYPT_COST = 12;

/**
 * User access — read (auth/jwt) + admin CRUD (super-admin user management).
 *
 * All DB access goes through PrismaService (the repository boundary). Deletes
 * are soft (isActive = false) so the audit trail + ticket history survive.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { permissions: { select: { permission: true } } },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { permissions: { select: { permission: true } } },
    });
  }

  /** Returns a user-safe record (no passwordHash), including permissions. */
  findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        designation: true,
        phone: true,
        departmentId: true,
        isActive: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        permissions: { select: { permission: true } },
      },
    });
  }

  async touchLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /** List staff users with optional filters (admin user-management view). */
  findMany(filters: {
    role?: Role;
    departmentId?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { role, departmentId, isActive, page = 1, pageSize = 50 } = filters;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    return this.prisma.$transaction(async (tx) => {
      const [items, total] = await Promise.all([
        tx.user.findMany({
          where,
          orderBy: { fullName: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            designation: true,
            phone: true,
            departmentId: true,
            department: { select: { id: true, name: true, code: true } },
            isActive: true,
            isSuperAdmin: true,
            lastLoginAt: true,
            permissions: { select: { permission: true } },
          },
        }),
        tx.user.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  /** Create a new staff user (Super Admin). */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const permissions = (dto.permissions ?? []).filter((p) => p !== Permission.ALL);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role,
        passwordHash,
        designation: dto.designation,
        phone: dto.phone,
        departmentId: dto.departmentId,
        isSuperAdmin: dto.role === Role.ADMIN ? (dto.isSuperAdmin ?? false) : false,
        permissions:
          dto.role === Role.ADMIN && permissions.length
            ? { create: permissions.map((permission) => ({ permission })) }
            : undefined,
      },
      select: {
        id: true, email: true, fullName: true, role: true,
        designation: true, phone: true, departmentId: true, isActive: true,
        isSuperAdmin: true,
        permissions: { select: { permission: true } },
      },
    });
  }

  /** Update a staff user (Super Admin). */
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    // Hash a new password if provided.
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    }

    return this.prisma.$transaction(async (tx) => {
      // Replace module permissions if a new set was provided for an ADMIN user.
      if (dto.permissions !== undefined && user.role === Role.ADMIN) {
        const perms = dto.permissions.filter((p) => p !== Permission.ALL);
        await tx.userPermission.deleteMany({ where: { userId: id } });
        if (perms.length) {
          await tx.userPermission.createMany({
            data: perms.map((permission) => ({ userId: id, permission })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          role: dto.role,
          designation: dto.designation,
          phone: dto.phone,
          departmentId: dto.departmentId,
          isActive: dto.isActive,
          isSuperAdmin:
            dto.isSuperAdmin !== undefined && user.role === Role.ADMIN
              ? dto.isSuperAdmin
              : undefined,
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: {
          id: true, email: true, fullName: true, role: true,
          designation: true, phone: true, departmentId: true, isActive: true,
          isSuperAdmin: true,
          permissions: { select: { permission: true } },
        },
      });
    });
  }

  /** Soft-deactivate a user (isActive = false). Never hard-deletes. */
  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.isSuperAdmin) {
      throw new BadRequestException('Super Admin accounts cannot be deactivated.');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }
}
