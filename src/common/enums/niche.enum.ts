import { registerEnumType } from "@nestjs/graphql";
import { Niche } from "@prisma/client";

registerEnumType(Niche, {
    name: "Niche",
});

export { Niche };