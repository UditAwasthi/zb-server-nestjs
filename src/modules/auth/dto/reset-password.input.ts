
import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, Length, MinLength } from "class-validator";

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @Length(6, 6)
  otp!: string;

  @Field()
  @MinLength(8)
  password!: string;
}