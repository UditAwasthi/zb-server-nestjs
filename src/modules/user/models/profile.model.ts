import { Field, Int, ObjectType } from "@nestjs/graphql";

import { AccountType } from "../../../common/enums/account-type.enum";
import { Niche } from "../../../common/enums/niche.enum";
import { Pronouns } from "../../../common/enums/pronouns.enum";

import { PrivacySettingsModel } from "./privacy-settings.model";
import { ProfessionalIdentityModel } from "./professional-identity.model";
import { ProfileLinkModel } from "./profile-link.model";
import { ProfileInterestModel } from "./profile-interest.model";

@ObjectType()
export class ProfileModel {
    @Field()
    id!: string;

    @Field()
    fullName!: string;

    @Field({ nullable: true })
    dateOfBirth?: Date;

    @Field(() => Pronouns, { nullable: true })
    pronouns?: Pronouns;

    @Field({ nullable: true })
    location?: string;

    @Field(() => AccountType)
    accountType!: AccountType;

    @Field(() => Niche, { nullable: true })
    niche?: Niche;

    @Field({ nullable: true })
    profileMusicUrl?: string;

    @Field()
    showInGlobalSearch!: boolean;

    @Field(() => Int)
    followerCount!: number;

    @Field(() => Int)
    followingCount!: number;

    @Field(() => Int)
    postCount!: number;

    @Field(() => PrivacySettingsModel, {
        nullable: true,
    })
    privacySettings?: PrivacySettingsModel;

    @Field(() => ProfessionalIdentityModel, {
        nullable: true,
    })
    professionalIdentity?: ProfessionalIdentityModel;

    @Field(() => [ProfileLinkModel])
    profileLinks!: ProfileLinkModel[];

    @Field(() => [ProfileInterestModel])
    profileInterests!: ProfileInterestModel[];
}