import { Field, InputType } from "@nestjs/graphql";
import { IsEnum, IsOptional } from "class-validator";

import { AccountPrivacy } from "../../../common/enums/account-privacy.enum";
import { MessagePermission } from "../../../common/enums/message-permission.enum";

@InputType()
export class UpdatePrivacySettingsInput {
    @Field(() => AccountPrivacy, { nullable: true })
    @IsOptional()
    @IsEnum(AccountPrivacy)
    accountPrivacy?: AccountPrivacy;

    @Field(() => MessagePermission, { nullable: true })
    @IsOptional()
    @IsEnum(MessagePermission)
    messagePermission?: MessagePermission;
}
