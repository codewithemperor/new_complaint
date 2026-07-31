import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dtos/create-reminder.dto';
import { UpdateReminderDto } from './dtos/update-reminder.dto';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a reminder for a ticket' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReminderDto,
  ) {
    return this.remindersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active reminders for the current user' })
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.remindersService.list(user.id);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'List reminders for a specific ticket' })
  async listByTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ticketId') ticketId: string,
  ) {
    return this.remindersService.listByTicket(user.id, ticketId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder (owner only)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.remindersService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder (owner only)' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.remindersService.delete(id, user.id);
  }
}
