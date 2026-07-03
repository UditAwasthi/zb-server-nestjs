import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

import { UserModel } from '../user/models/user.model';
import { AuthService } from './auth.service';
import { MeModel } from '../user/models/me.model';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.model';
import { AvailabilityResponse } from './dto/availability-response.model';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { JwtPayload } from './types/jwt-payload';
import { CurrentUserPayload } from './types/current-user.type';
import { VerifyEmailInput } from './dto/verify-email.input';
import { GoogleLoginInput } from './dto/google-login.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}
  //register
  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Query(() => AvailabilityResponse)
  async checkUsernameAvailability(
    @Args('username') username: string,
  ): Promise<AvailabilityResponse> {
    return this.authService.checkUsernameAvailability(username);
  }

  @Query(() => AvailabilityResponse)
  async checkEmailAvailability(
    @Args('email') email: string,
  ): Promise<AvailabilityResponse> {
    return this.authService.checkEmailAvailability(email);
  }

  //login
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }
  //refresh token
  @Mutation(() => AuthPayload)
  refreshToken(
    @Args('input')
    input: RefreshTokenInput,
  ) {
    return this.authService.refreshToken(input.refreshToken);
  }
  //me
  @UseGuards(JwtAuthGuard)
  @Query(() => MeModel)
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.me(user.userId);
  }

  //logout
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  logout(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logout(user.sessionId, user.userId);
  }

  //logoutall devices
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  logoutAllDevices(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logoutAllDevices(user.userId);
  }

  //verify email wali mutation
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  verifyEmail(
    @CurrentUser() user: CurrentUserPayload,

    @Args('input')
    input: VerifyEmailInput,
  ) {
    return this.authService.verifyEmail(user.userId, input.otp);
  }
  //verify
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  resendVerificationEmail(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.resendVerificationEmail(user.userId);
  }
  //forgot password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Args('input') input: ForgotPasswordInput,
  ): Promise<boolean> {
    return this.authService.forgotPassword(input.email);
  }

  //reset password
  @Mutation(() => Boolean)
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<boolean> {
    return this.authService.resetPassword(
      input.email,
      input.otp,
      input.password,
    );
  }

  //google login
  @Mutation(() => AuthPayload)
  async googleLogin(
    @Args('input') input: GoogleLoginInput,
  ): Promise<AuthPayload> {
    return this.authService.googleLogin(input.idToken);
  }
}
