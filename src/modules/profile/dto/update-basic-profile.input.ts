import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { Pronouns } from '../../../common/enums/pronouns.enum';
import { AccountType } from '../../../common/enums/account-type.enum';
import { Niche } from '../../../common/enums/niche.enum';

@InputType()
export class UpdateBasicProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @Field(() => Pronouns, { nullable: true })
  @IsOptional()
  @IsEnum(Pronouns)
  pronouns?: Pronouns;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @Field(() => AccountType, { nullable: true })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @Field(() => Niche, { nullable: true })
  @IsOptional()
  @IsEnum(Niche)
  niche?: Niche;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  profileMusicUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showInGlobalSearch?: boolean;
}
