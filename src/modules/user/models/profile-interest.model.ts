import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class InterestModel {
    @Field()
    id!: string;

    @Field()
    name!: string;
}

@ObjectType()
export class ProfileInterestModel {
    @Field(() => InterestModel)
    interest!: InterestModel;
}