import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // TODO: Implémenter authentification JWT
  async login(email: string, password: string) {
    this.logger.log(`🔐 Tentative de connexion: ${email}`);
    // À implémenter
    return { message: 'Auth service - À implémenter' };
  }
}
