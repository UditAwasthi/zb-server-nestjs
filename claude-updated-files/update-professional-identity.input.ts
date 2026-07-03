import { Field, InputType } from "@nestjs/graphql";
import { IsOptional, IsString, MaxLength } from "class-validator";

@InputType()
export class UpdateProfessionalIdentityInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    currentRole?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    company?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    industry?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    highestEducation?: string;
}
