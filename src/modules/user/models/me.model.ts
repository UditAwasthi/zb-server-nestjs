import { Field, ObjectType } from "@nestjs/graphql";

import { UserModel } from "./user.model";
import { ProfileModel } from "./profile.model";
import { NotificationSettingsModel } from "./notification-settings.model";

import { AuthProvider } from "../../../common/enums/auth-provider.enum";
import { AccountStatus } from "../../../common/enums/account-status.enum";
import { UserRole } from "../../../common/enums/user-role.enum";

@ObjectType()
export class MeModel extends UserModel {
    @Field()
    onboardingCompleted!: boolean;

    @Field(() => AuthProvider)
    authProvider!: AuthProvider;

    @Field(() => AccountStatus)
    accountStatus!: AccountStatus;

    @Field(() => UserRole)
    role!: UserRole;

    @Field()
    twoFactorEnabled!: boolean;

    @Field(() => ProfileModel)
    profile!: ProfileModel;

    @Field(() => NotificationSettingsModel, {
        nullable: true,
    })
    notificationSettings?: NotificationSettingsModel;
}