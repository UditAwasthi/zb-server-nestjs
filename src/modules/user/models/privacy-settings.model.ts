import { Field, ObjectType } from "@nestjs/graphql";

import { AccountPrivacy } from "../../../common/enums/account-privacy.enum";
import { MessagePermission } from "../../../common/enums/message-permission.enum";

@ObjectType()
export class PrivacySettingsModel {
    @Field(() => AccountPrivacy)
    accountPrivacy!: AccountPrivacy;

    @Field(() => MessagePermission)
    messagePermission!: MessagePermission;
}