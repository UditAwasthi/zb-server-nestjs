import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class AddInterestInput {
  @Field()
  @IsUUID('4')
  interestId!: string;
}
