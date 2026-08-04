import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Priority } from '../common/types/ticket-status';
import { Role } from '../common/types/role';

/** A cached SLA config row. escalationChain stored as JSON string in SQLite. */
interface SlaConfigRow {
  firstResponseHours: number;
  resolutionHours: number;
  warningThreshold: number;
  escalationChain: string[];
}

/**
 * SlaPolicy — the single source of truth for SLA targets.
 *
 * Reads the per-priority matrix from the `sla_config` DB table (cached
 * in-memory, seeded from env defaults on first boot), falling back to env vars
 * if a row is missing. SlaPolicy loads the cache on module init and exposes
 * invalidate() so the admin edit endpoint can refresh it.
 *
 * Snapshots: ticket.slaTargetHours is captured at clock start (M4), so editing
 * the matrix never moves the goalposts on an open ticket. Only tickets started
 * after an edit pick up the new target.
 *
 * Defaults mirror planning/05-sla-matrix.md §1.
 */
@Injectable()
export class SlaPolicy implements OnModuleInit {
  private cache: Map<Priority, SlaConfigRow> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.loadCache();
  }

  /** Reload the cache from the DB (called after an admin edits the matrix). */
  async invalidate(): Promise<void> {
    await this.loadCache();
  }

  private async loadCache(): Promise<void> {
    try {
      const rows = await this.prisma.slaConfig.findMany();
      const map = new Map<Priority, SlaConfigRow>();
      for (const r of rows) {
        // SQLite: escalationChain is stored as JSON string, parse it
        const chain = typeof r.escalationChain === 'string'
          ? JSON.parse(r.escalationChain)
          : r.escalationChain;
        map.set(r.priority as Priority, {
          firstResponseHours: r.firstResponseHours,
          resolutionHours: r.resolutionHours,
          warningThreshold: Number(r.warningThreshold),
          escalationChain: chain,
        });
      }
      this.cache = map;
    } catch {
      // Table may not be seeded yet; env fallbacks apply.
      this.cache = null;
    }
  }

  /** First-response target in hours (SUBMITTED → IN_PROGRESS). */
  firstResponseHours(priority: Priority): number {
    const row = this.cache?.get(priority);
    if (row) return row.firstResponseHours;
    const key = `SLA_${priority}_FIRST_RESPONSE_HOURS`;
    return this.config.get<number>(key) ?? this.defaultFirstResponse(priority);
  }

  /** Resolution target in hours (ASSIGNED → RESOLVED). */
  resolutionHours(priority: Priority): number {
    const row = this.cache?.get(priority);
    if (row) return row.resolutionHours;
    const key = `SLA_${priority}_RESOLUTION_HOURS`;
    return this.config.get<number>(key) ?? this.defaultResolution(priority);
  }

  /** Fraction of the target at which a warning fires (default 0.8). */
  warningThreshold(): number {
    const anyRow = this.cache?.values().next().value;
    if (anyRow) return anyRow.warningThreshold;
    return this.config.get<number>('SLA_WARNING_THRESHOLD') ?? 0.8;
  }

  /**
   * The escalation chain (lowest → highest tier) for a priority. DB-stored if
   * available; otherwise the static default. Returned as Roles for advance().
   */
  escalationChain(priority: Priority): Role[] {
    const row = this.cache?.get(priority);
    if (row?.escalationChain?.length) {
      return row.escalationChain as Role[];
    }
    switch (priority) {
      case Priority.P1:
      case Priority.P2:
        return [Role.DEPARTMENT_HOD, Role.PERMANENT_SECRETARY, Role.COMMISSIONER];
      case Priority.P3:
        return [Role.DEPARTMENT_HOD, Role.PERMANENT_SECRETARY];
      case Priority.P4:
      default:
        return [Role.DEPARTMENT_HOD];
    }
  }

  private defaultFirstResponse(priority: Priority): number {
    switch (priority) {
      case Priority.P1: return 1;
      case Priority.P2: return 4;
      case Priority.P3: return 24;
      case Priority.P4: return 48;
    }
  }

  private defaultResolution(priority: Priority): number {
    switch (priority) {
      case Priority.P1: return 24;
      case Priority.P2: return 72;
      case Priority.P3: return 240;
      case Priority.P4: return 360;
    }
  }
}
