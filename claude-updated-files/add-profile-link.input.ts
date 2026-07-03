import { Field, InputType, Int } from "@nestjs/graphql";
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    MaxLength,
    Min,
} from "class-validator";

@InputType()
export class AddProfileLinkInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    label!: string;

    @Field()
    @IsUrl()
    @MaxLength(2048)
    url!: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(999)
    displayOrder?: number;
}
