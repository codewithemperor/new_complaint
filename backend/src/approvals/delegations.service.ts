import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/types/role';
import { CreateDelegationDto } from './dtos/create-delegation.dto';

/**
 * DelegationsService — PS-only time-boxed delegation of approval authority.
 *
 * Only a PERMANENT_SECRETARY may create a delegation, and only to a
 * DEPARTMENT_HOD (delegating downward to someone who can hold the
 * department-level sign-off in the PS's absence). Resolution happens in
 * EscalationService.
 */
@Injectable()
export class DelegationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDelegationDto, user: { id: string; role: Role; isSuperAdmin?: boolean }) {
    if (user.role !== Role.PERMANENT_SECRETARY && !user.isSuperAdmin) {
      throw new ForbiddenException('Only the Permanent Secretary may delegate approval authority.');
    }

    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);
    if (validTo <= validFrom) {
      throw new BadRequestException('validTo must be after validFrom.');
    }

    const delegate = await this.prisma.user.findUnique({ where: { id: dto.delegateId } });
    if (!delegate) throw new NotFoundException('Delegate user not found.');
    if (delegate.role !== Role.DEPARTMENT_HOD) {
      throw new BadRequestException('Delegation target must be a Department HOD.');
    }

    return this.prisma.delegation.create({
      data: {
        delegatorId: user.id,
        delegateId: dto.delegateId,
        validFrom,
        validTo,
        reason: dto.reason,
        isActive: true,
      },
    });
  }

  /** List delegations, optionally filtered to active ones. */
  async findMany(filters: { activeOnly?: boolean; delegatorId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.validFrom = { lte: now };
      where.validTo = { gte: now };
    }
    if (filters.delegatorId) where.delegatorId = filters.delegatorId;

    return this.prisma.delegation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        delegator: { select: { fullName: true, role: true } },
        delegate: { select: { fullName: true, role: true, department: { select: { name: true } } } },
      },
    });
  }

  async revoke(id: string, user: { id: string; role: Role; isSuperAdmin?: boolean }) {
    const delegation = await this.prisma.delegation.findUnique({ where: { id } });
    if (!delegation) throw new NotFoundException('Delegation not found.');
    if (delegation.delegatorId !== user.id && !user.isSuperAdmin) {
      throw new ForbiddenException('You may only revoke your own delegations.');
    }
    return this.prisma.delegation.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
