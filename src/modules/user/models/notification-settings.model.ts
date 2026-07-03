import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationSettingsModel {
  @Field()
  likes!: boolean;

  @Field()
  comments!: boolean;

  @Field()
  mentions!: boolean;

  @Field()
  newFollowers!: boolean;

  @Field()
  directMessages!: boolean;

  @Field()
  groupMessages!: boolean;

  @Field()
  communityPosts!: boolean;

  @Field()
  communityAnnouncements!: boolean;
}
