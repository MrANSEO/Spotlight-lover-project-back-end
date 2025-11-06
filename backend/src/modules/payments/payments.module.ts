import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MtnMomoProvider } from './providers/mtn.provider';
import { OrangeMoneyProvider } from './providers/orange.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MtnMomoProvider,
    OrangeMoneyProvider,
    StripeProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
