import { Field, InputType } from "@nestjs/graphql";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from "class-validator";

@InputType()
export class ReorderProfileLinksInput {
    @Field(() => [String])
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsUUID("4", { each: true })
    linkIds!: string[];
}
