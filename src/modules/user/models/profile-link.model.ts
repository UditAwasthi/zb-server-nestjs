import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProfileLinkModel {
  @Field()
  id!: string;

  @Field()
  label!: string;

  @Field()
  url!: string;

  @Field(() => Int)
  displayOrder!: number;
}
