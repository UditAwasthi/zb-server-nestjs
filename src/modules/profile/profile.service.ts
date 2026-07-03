import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, Profile } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { ProfileModel } from '../user/models/profile.model';
import { ProfessionalIdentityModel } from '../user/models/professional-identity.model';
import { PrivacySettingsModel } from '../user/models/privacy-settings.model';
import { NotificationSettingsModel } from '../user/models/notification-settings.model';
import { ProfileLinkModel } from '../user/models/profile-link.model';
import { ProfileInterestModel } from '../user/models/profile-interest.model';
import { UserModel } from '../user/models/user.model';

import { AvatarService } from './avatar.service';
import { UpdateAvatarInput } from './dto/update-avatar.input';
import { AvatarUploadUrlResponse } from './dto/avatar-upload-url.model';

import { UpdateBasicProfileInput } from './dto/update-basic-profile.input';
import { UpdateProfessionalIdentityInput } from './dto/update-professional-identity.input';
import { UpdatePrivacySettingsInput } from './dto/update-privacy-settings.input';
import { UpdateNotificationSettingsInput } from './dto/update-notification-settings.input';
import { AddProfileLinkInput } from './dto/add-profile-link.input';
import { UpdateProfileLinkInput } from './dto/update-profile-link.input';
import { ReorderProfileLinksInput } from './dto/reorder-profile-links.input';
import { AddInterestInput } from './dto/add-interest.input';

const MAX_PROFILE_LINKS = 10;

const PROFILE_INCLUDE = {
  privacySettings: true,
  professionalIdentity: true,
  profileLinks: {
    orderBy: { displayOrder: 'asc' as const },
  },
  profileInterests: {
    include: { interest: true },
  },
} satisfies Prisma.ProfileInclude;

type ProfileWithRelations = Prisma.ProfileGetPayload<{
  include: typeof PROFILE_INCLUDE;
}>;

type ProfileLinkWithOwner = Prisma.ProfileLinkGetPayload<{
  include: { profile: { select: { userId: true } } };
}>;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarService: AvatarService,
  ) {}

  private async getProfileIdOrThrow(userId: string): Promise<string> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return profile.id;
  }

  private async getOwnedProfileLinkOrThrow(
    userId: string,
    linkId: string,
  ): Promise<ProfileLinkWithOwner> {
    const link = await this.prisma.profileLink.findUnique({
      where: { id: linkId },
      include: {
        profile: {
          select: { userId: true },
        },
      },
    });

    if (!link || link.profile.userId !== userId) {
      throw new NotFoundException('Profile link not found.');
    }

    return link;
  }

  private toProfileModel(profile: ProfileWithRelations): ProfileModel {
    return {
      id: profile.id,
      fullName: profile.fullName,
      dateOfBirth: profile.dateOfBirth ?? undefined,
      pronouns: profile.pronouns ?? undefined,
      location: profile.location ?? undefined,
      bio: profile.bio ?? undefined,
      accountType: profile.accountType,
      niche: profile.niche ?? undefined,
      profileMusicUrl: profile.profileMusicUrl ?? undefined,
      showInGlobalSearch: profile.showInGlobalSearch,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
      postCount: profile.postCount,
      privacySettings: profile.privacySettings
        ? this.toPrivacySettingsModel(profile.privacySettings)
        : undefined,
      professionalIdentity: profile.professionalIdentity
        ? this.toProfessionalIdentityModel(profile.professionalIdentity)
        : undefined,
      profileLinks: profile.profileLinks,
      profileInterests: profile.profileInterests,
    };
  }

  private toProfessionalIdentityModel(
    identity: NonNullable<ProfileWithRelations['professionalIdentity']>,
  ): ProfessionalIdentityModel {
    return {
      currentRole: identity.currentRole ?? undefined,
      company: identity.company ?? undefined,
      industry: identity.industry ?? undefined,
      highestEducation: identity.highestEducation ?? undefined,
    };
  }

  private toPrivacySettingsModel(
    settings: NonNullable<ProfileWithRelations['privacySettings']>,
  ): PrivacySettingsModel {
    return {
      accountPrivacy: settings.accountPrivacy,
      messagePermission: settings.messagePermission,
    };
  }

  private toNotificationSettingsModel(settings: {
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    newFollowers: boolean;
    directMessages: boolean;
    groupMessages: boolean;
    communityPosts: boolean;
    communityAnnouncements: boolean;
  }): NotificationSettingsModel {
    return {
      likes: settings.likes,
      comments: settings.comments,
      mentions: settings.mentions,
      newFollowers: settings.newFollowers,
      directMessages: settings.directMessages,
      groupMessages: settings.groupMessages,
      communityPosts: settings.communityPosts,
      communityAnnouncements: settings.communityAnnouncements,
    };
  }

  async updateBasicProfile(
    userId: string,
    input: UpdateBasicProfileInput,
  ): Promise<ProfileModel> {
    await this.getProfileIdOrThrow(userId);

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        pronouns: input.pronouns,
        location: input.location,
        bio: input.bio,
        accountType: input.accountType,
        niche: input.niche,
        profileMusicUrl: input.profileMusicUrl,
        showInGlobalSearch: input.showInGlobalSearch,
      },
      include: PROFILE_INCLUDE,
    });

    return this.toProfileModel(updated);
  }

  async updateProfessionalIdentity(
    userId: string,
    input: UpdateProfessionalIdentityInput,
  ): Promise<ProfessionalIdentityModel> {
    const profileId = await this.getProfileIdOrThrow(userId);

    const identity = await this.prisma.professionalIdentity.upsert({
      where: { profileId },
      update: {
        currentRole: input.currentRole,
        company: input.company,
        industry: input.industry,
        highestEducation: input.highestEducation,
      },
      create: {
        profileId,
        currentRole: input.currentRole,
        company: input.company,
        industry: input.industry,
        highestEducation: input.highestEducation,
      },
    });

    return this.toProfessionalIdentityModel(identity);
  }

  async updatePrivacySettings(
    userId: string,
    input: UpdatePrivacySettingsInput,
  ): Promise<PrivacySettingsModel> {
    const profileId = await this.getProfileIdOrThrow(userId);

    const settings = await this.prisma.privacySettings.upsert({
      where: { profileId },
      update: {
        accountPrivacy: input.accountPrivacy,
        messagePermission: input.messagePermission,
      },
      create: {
        profileId,
        accountPrivacy: input.accountPrivacy,
        messagePermission: input.messagePermission,
      },
    });

    return this.toPrivacySettingsModel(settings);
  }

  async updateNotificationSettings(
    userId: string,
    input: UpdateNotificationSettingsInput,
  ): Promise<NotificationSettingsModel> {
    const settings = await this.prisma.notificationSettings.upsert({
      where: { userId },
      update: {
        likes: input.likes,
        comments: input.comments,
        mentions: input.mentions,
        newFollowers: input.newFollowers,
        directMessages: input.directMessages,
        groupMessages: input.groupMessages,
        communityPosts: input.communityPosts,
        communityAnnouncements: input.communityAnnouncements,
      },
      create: {
        userId,
        likes: input.likes,
        comments: input.comments,
        mentions: input.mentions,
        newFollowers: input.newFollowers,
        directMessages: input.directMessages,
        groupMessages: input.groupMessages,
        communityPosts: input.communityPosts,
        communityAnnouncements: input.communityAnnouncements,
      },
    });

    return this.toNotificationSettingsModel(settings);
  }

  async addProfileLink(
    userId: string,
    input: AddProfileLinkInput,
  ): Promise<ProfileLinkModel> {
    const profileId = await this.getProfileIdOrThrow(userId);

    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.profileLink.count({
        where: { profileId },
      });

      if (existingCount >= MAX_PROFILE_LINKS) {
        throw new BadRequestException(
          `You can add up to ${MAX_PROFILE_LINKS} links only.`,
        );
      }

      return tx.profileLink.create({
        data: {
          profileId,
          label: input.label,
          url: input.url,
          displayOrder: input.displayOrder ?? existingCount,
        },
      });
    });
  }

  async updateProfileLink(
    userId: string,
    input: UpdateProfileLinkInput,
  ): Promise<ProfileLinkModel> {
    await this.getOwnedProfileLinkOrThrow(userId, input.id);

    return this.prisma.profileLink.update({
      where: { id: input.id },
      data: {
        label: input.label,
        url: input.url,
        displayOrder: input.displayOrder,
      },
    });
  }

  async deleteProfileLink(userId: string, id: string): Promise<boolean> {
    await this.getOwnedProfileLinkOrThrow(userId, id);

    await this.prisma.profileLink.delete({
      where: { id },
    });

    return true;
  }

  async reorderProfileLinks(
    userId: string,
    input: ReorderProfileLinksInput,
  ): Promise<ProfileLinkModel[]> {
    const profileId = await this.getProfileIdOrThrow(userId);

    const existingLinks = await this.prisma.profileLink.findMany({
      where: { profileId },
      select: { id: true },
    });

    const existingIds = new Set(existingLinks.map((link) => link.id));
    const requestedIds = new Set(input.linkIds);

    if (
      existingIds.size !== requestedIds.size ||
      ![...existingIds].every((id) => requestedIds.has(id))
    ) {
      throw new BadRequestException(
        'The provided link order must include every existing link exactly once.',
      );
    }

    await this.prisma.$transaction(
      input.linkIds.map((id, index) =>
        this.prisma.profileLink.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );

    return this.prisma.profileLink.findMany({
      where: { profileId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async addInterest(
    userId: string,
    input: AddInterestInput,
  ): Promise<ProfileInterestModel> {
    const profileId = await this.getProfileIdOrThrow(userId);

    const interest = await this.prisma.interest.findUnique({
      where: { id: input.interestId },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found.');
    }

    const existing = await this.prisma.profileInterest.findUnique({
      where: {
        profileId_interestId: {
          profileId,
          interestId: input.interestId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Interest has already been added.');
    }

    try {
      const profileInterest = await this.prisma.profileInterest.create({
        data: {
          profileId,
          interestId: input.interestId,
        },
        include: { interest: true },
      });

      return profileInterest;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Interest has already been added.');
      }
      throw error;
    }
  }

  async removeInterest(userId: string, interestId: string): Promise<boolean> {
    const profileId = await this.getProfileIdOrThrow(userId);

    try {
      await this.prisma.profileInterest.delete({
        where: {
          profileId_interestId: {
            profileId,
            interestId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Interest not found on your profile.');
      }
      throw error;
    }

    return true;
  }

  private toUserModel(user: User, profile: Profile): UserModel {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: profile.fullName,
      bio: profile.bio || undefined,
      avatarUrl: user.avatarUrl || undefined,
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async generateAvatarUploadUrl(userId: string): Promise<AvatarUploadUrlResponse> {
    await this.getProfileIdOrThrow(userId);
    return this.avatarService.generateUploadUrl(userId);
  }

  async updateAvatar(userId: string, input: UpdateAvatarInput): Promise<UserModel> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('Account or profile not found.');
    }

    if (user.avatarKey) {
      await this.avatarService.deleteObject(user.avatarKey);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: input.avatarUrl,
        avatarKey: input.avatarKey,
      },
      include: { profile: true },
    });

    return this.toUserModel(updatedUser, updatedUser.profile!);
  }

  async deleteAvatar(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    if (user.avatarKey) {
      await this.avatarService.deleteObject(user.avatarKey);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarKey: null,
      },
    });

    return true;
  }
}
