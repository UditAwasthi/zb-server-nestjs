import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';
import { AvatarService } from './avatar.service';

@Module({
  imports: [PrismaModule],
  providers: [ProfileResolver, ProfileService, AvatarService],
})
export class ProfileModule {}
