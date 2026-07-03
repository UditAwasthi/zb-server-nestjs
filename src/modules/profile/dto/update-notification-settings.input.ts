import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateNotificationSettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  likes?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  newFollowers?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  directMessages?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  groupMessages?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  communityPosts?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  communityAnnouncements?: boolean;
}
