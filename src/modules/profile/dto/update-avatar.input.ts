import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsUrl } from "class-validator";

@InputType()
export class UpdateAvatarInput {
    @Field()
    @IsUrl()
    avatarUrl!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    avatarKey!: string;
}
