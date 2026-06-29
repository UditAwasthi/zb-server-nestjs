import { Module } from "@nestjs/common";

import { PrismaModule } from "./database/prisma.module";
import { AppGraphQLModule } from "./graphql/graphql.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    PrismaModule,
    AppGraphQLModule,
    AuthModule,
  ],
})
export class AppModule {}