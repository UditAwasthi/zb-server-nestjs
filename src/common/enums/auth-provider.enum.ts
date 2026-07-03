import { registerEnumType } from "@nestjs/graphql";
import { AuthProvider } from "@prisma/client";

registerEnumType(AuthProvider, {
    name: "AuthProvider",
});

export { AuthProvider };