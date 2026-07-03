import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { env } from '../../../config/env';
import { JwtPayload } from '../types/jwt-payload';
import { CurrentUserPayload } from '../types/current-user.type';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
    };
  }
}
