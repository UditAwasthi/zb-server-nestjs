import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AvailabilityResponse {
  @Field()
  available!: boolean;

  @Field()
  message!: string;
}