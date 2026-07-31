import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketIdGenerator } from './ticket-id-generator';
import { TicketStateMachine } from './ticket-state-machine';
import { TrackingTokenService } from './tracking-token.service';
import { TrackingTokenGuard } from '../common/guards/tracking-token.guard';
import { TicketsScheduler } from './tickets-scheduler.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RoutingModule } from '../routing/routing.module';
import { SlaModule } from '../sla/sla.module';

@Module({
  imports: [
    StorageModule,
    NotificationsModule,
    RoutingModule,
    SlaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('APP_TOKEN_SECRET'),
      }),
    }),
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    TicketIdGenerator,
    TicketStateMachine,
    TrackingTokenService,
    TrackingTokenGuard,
    TicketsScheduler,
  ],
  exports: [TicketsService, TicketStateMachine, TrackingTokenService],
})
export class TicketsModule {}
