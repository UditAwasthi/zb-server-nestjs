import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CurrentUserPayload } from "../auth/types/current-user.type";

import { ProfileModel } from "../user/models/profile.model";
import { ProfessionalIdentityModel } from "../user/models/professional-identity.model";
import { PrivacySettingsModel } from "../user/models/privacy-settings.model";
import { NotificationSettingsModel } from "../user/models/notification-settings.model";
import { ProfileLinkModel } from "../user/models/profile-link.model";
import { ProfileInterestModel } from "../user/models/profile-interest.model";

import { ProfileService } from "./profile.service";
import { UpdateBasicProfileInput } from "./dto/update-basic-profile.input";
import { UpdateProfessionalIdentityInput } from "./dto/update-professional-identity.input";
import { UpdatePrivacySettingsInput } from "./dto/update-privacy-settings.input";
import { UpdateNotificationSettingsInput } from "./dto/update-notification-settings.input";
import { AddProfileLinkInput } from "./dto/add-profile-link.input";
import { UpdateProfileLinkInput } from "./dto/update-profile-link.input";
import { ReorderProfileLinksInput } from "./dto/reorder-profile-links.input";
import { AddInterestInput } from "./dto/add-interest.input";

@UseGuards(JwtAuthGuard)
@Resolver()
export class ProfileResolver {
    constructor(private readonly profileService: ProfileService) { }

    @Mutation(() => ProfileModel)
    updateBasicProfile(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: UpdateBasicProfileInput,
    ) {
        return this.profileService.updateBasicProfile(user.userId, input);
    }

    @Mutation(() => ProfessionalIdentityModel)
    updateProfessionalIdentity(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: UpdateProfessionalIdentityInput,
    ) {
        return this.profileService.updateProfessionalIdentity(user.userId, input);
    }

    @Mutation(() => PrivacySettingsModel)
    updatePrivacySettings(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: UpdatePrivacySettingsInput,
    ) {
        return this.profileService.updatePrivacySettings(user.userId, input);
    }

    @Mutation(() => NotificationSettingsModel)
    updateNotificationSettings(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: UpdateNotificationSettingsInput,
    ) {
        return this.profileService.updateNotificationSettings(user.userId, input);
    }

    @Mutation(() => ProfileLinkModel)
    addProfileLink(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: AddProfileLinkInput,
    ) {
        return this.profileService.addProfileLink(user.userId, input);
    }

    @Mutation(() => ProfileLinkModel)
    updateProfileLink(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: UpdateProfileLinkInput,
    ) {
        return this.profileService.updateProfileLink(user.userId, input);
    }

    @Mutation(() => Boolean)
    deleteProfileLink(
        @CurrentUser() user: CurrentUserPayload,
        @Args("id", ParseUUIDPipe) id: string,
    ) {
        return this.profileService.deleteProfileLink(user.userId, id);
    }

    @Mutation(() => [ProfileLinkModel])
    reorderProfileLinks(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: ReorderProfileLinksInput,
    ) {
        return this.profileService.reorderProfileLinks(user.userId, input);
    }

    @Mutation(() => ProfileInterestModel)
    addInterest(
        @CurrentUser() user: CurrentUserPayload,
        @Args("input") input: AddInterestInput,
    ) {
        return this.profileService.addInterest(user.userId, input);
    }

    @Mutation(() => Boolean)
    removeInterest(
        @CurrentUser() user: CurrentUserPayload,
        @Args("interestId", ParseUUIDPipe) interestId: string,
    ) {
        return this.profileService.removeInterest(user.userId, interestId);
    }
}
