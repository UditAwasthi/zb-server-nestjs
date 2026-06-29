import {
  Args,
  Mutation,
  Query,
  Resolver,
} from "@nestjs/graphql";

import { AuthService } from "./auth.service";

import { RegisterInput } from "./dto/register.input";
import { AuthPayload } from "./dto/auth-payload.model";
import { AvailabilityResponse } from "./dto/availability-response.model";

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => AuthPayload)
  async register(
    @Args("input") input: RegisterInput,
  ): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Query(() => AvailabilityResponse)
  async checkUsernameAvailability(
    @Args("username") username: string,
  ): Promise<AvailabilityResponse> {
    return this.authService.checkUsernameAvailability(username);
  }

  @Query(() => AvailabilityResponse)
  async checkEmailAvailability(
    @Args("email") email: string,
  ): Promise<AvailabilityResponse> {
    return this.authService.checkEmailAvailability(email);
  }
}