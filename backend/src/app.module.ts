import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { cloudinaryConfig } from './config/cloudinary.config';
import { paymentConfig } from './config/payment.config';

// Database
import { PrismaModule } from './prisma/prisma.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { VotesModule } from './modules/votes/votes.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadModule } from './modules/upload/upload.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, cloudinaryConfig, paymentConfig],
      envFilePath: '.env',
    }),

    // Rate Limiting (Protection DDoS)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 100, // 100 requêtes par minute
      },
    ]),

    // Scheduled Tasks
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    AdminModule,
    CandidatesModule,
    VotesModule,
    LeaderboardModule,
    AnalyticsModule,
    UploadModule,
    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}
