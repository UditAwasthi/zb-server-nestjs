import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AvatarUploadUrlResponse {
    @Field()
    uploadUrl!: string;

    @Field()
    avatarKey!: string;

    @Field()
    publicUrl!: string;
}
