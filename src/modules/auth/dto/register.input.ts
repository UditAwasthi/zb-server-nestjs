import { Field, InputType } from "@nestjs/graphql";
import {
  IsDate,
  IsEmail,
  IsString,
  Length,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";


@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @Length(3, 30)
  username!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;

  @Field()
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  dateOfBirth!: Date;
}