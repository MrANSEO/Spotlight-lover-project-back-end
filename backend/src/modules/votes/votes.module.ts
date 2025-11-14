import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { WebhooksController } from './webhooks.controller';
import { VotesService } from './votes.service';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [VotesController, WebhooksController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
