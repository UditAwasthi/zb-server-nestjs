import { Field, Int, ObjectType } from "@nestjs/graphql";

import { AccountType } from "../../../common/enums/account-type.enum";
import { Niche } from "../../../common/enums/niche.enum";
import { Pronouns } from "../../../common/enums/pronouns.enum";

import { ProfessionalIdentityModel } from "./professional-identity.model";
import { ProfileInterestModel } from "./profile-interest.model";
import { ProfileLinkModel } from "./profile-link.model";

@ObjectType()
export class PublicProfileModel {
    @Field()
    id!: string;

    @Field()
    fullName!: string;

    @Field(() => Pronouns, { nullable: true })
    pronouns?: Pronouns;

    @Field({ nullable: true })
    location?: string;

    @Field({ nullable: true })
    bio?: string;

    @Field(() => AccountType)
    accountType!: AccountType;

    @Field(() => Niche, { nullable: true })
    niche?: Niche;

    @Field({ nullable: true })
    profileMusicUrl?: string;

    @Field(() => Int)
    followerCount!: number;

    @Field(() => Int)
    followingCount!: number;

    @Field(() => Int)
    postCount!: number;

    @Field(() => ProfessionalIdentityModel, {
        nullable: true,
    })
    professionalIdentity?: ProfessionalIdentityModel;

    @Field(() => [ProfileLinkModel])
    profileLinks!: ProfileLinkModel[];

    @Field(() => [ProfileInterestModel])
    profileInterests!: ProfileInterestModel[];
}