import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { PrismaModule } from '../../database/prisma.module';

import { env } from '../../config/env';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,

    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as any,
      },
    }),
    EmailModule,
  ],

  providers: [AuthResolver, AuthService, JwtStrategy],

  exports: [AuthService],
})
export class AuthModule {}
