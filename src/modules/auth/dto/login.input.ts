import { Field, InputType } from "@nestjs/graphql";
import { IsString, MinLength } from "class-validator";

@InputType()
export class LoginInput {
  @Field({
    description: "Email address or username",
  })
  @IsString()
  identifier!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;
}