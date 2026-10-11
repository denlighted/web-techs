import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { getJwtConfig } from './config/jwt.config.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports:[PrismaModule, PassportModule.register({defaultStrategy: 'jwt'}), JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: getJwtConfig,
    inject: [ConfigService]
  })]
})
export class AuthModule {}
