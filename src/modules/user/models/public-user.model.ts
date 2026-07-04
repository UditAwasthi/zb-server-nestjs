import { Field, ID, ObjectType } from "@nestjs/graphql";

import { PublicProfileModel } from "./public-profile.model";

@ObjectType()
export class PublicUserModel {
    @Field(() => ID)
    id!: string;

    @Field()
    username!: string;

    @Field({ nullable: true })
    avatarUrl?: string;

    @Field(() => PublicProfileModel)
    profile!: PublicProfileModel;

    @Field()
    createdAt!: Date;

    // Social Graph
    @Field()
    isFollowing!: boolean;

    @Field()
    followsYou!: boolean;

    @Field()
    isBlocked!: boolean;

    @Field()
    hasBlockedYou!: boolean;
}