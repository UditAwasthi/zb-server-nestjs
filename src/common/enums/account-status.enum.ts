import { registerEnumType } from "@nestjs/graphql";
import { AccountStatus } from "@prisma/client";

registerEnumType(AccountStatus, {
    name: "AccountStatus",
});

export { AccountStatus };