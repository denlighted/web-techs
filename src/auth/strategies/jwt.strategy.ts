import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service.js';
import type { JwtPayload } from '../interfaces/jwt.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: JwtPayload) {
    return this.authService.validate(payload.sub);
  }
}