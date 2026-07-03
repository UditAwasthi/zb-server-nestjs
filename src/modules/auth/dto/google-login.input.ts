
import { Field, InputType } from "@nestjs/graphql";
import { IsString, IsNotEmpty } from "class-validator";

@InputType()
export class GoogleLoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}