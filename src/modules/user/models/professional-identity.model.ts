import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ProfessionalIdentityModel {
    @Field({ nullable: true })
    currentRole?: string;

    @Field({ nullable: true })
    company?: string;

    @Field({ nullable: true })
    industry?: string;

    @Field({ nullable: true })
    highestEducation?: string;
}