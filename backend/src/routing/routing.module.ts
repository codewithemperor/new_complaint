import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { RoutingRulesController } from './routing-rules.controller';

@Module({
  controllers: [RoutingRulesController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
