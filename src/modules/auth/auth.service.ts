import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { RegisterInput } from "./dto/register.input";
import { LoginInput } from "./dto/login.input";
import { AuthPayload } from "./dto/auth-payload.model";
import { env } from "../../config/env";
import { User, Profile, Prisma, Session, VerificationToken } from "@prisma/client";
import { UserModel } from "../user/models/user.model";
import { EmailService } from "../email/email.service";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { MeModel } from "../user/models/me.model";
import { ProfileModel } from "../user/models/profile.model";
import { NotificationSettingsModel } from "../user/models/notification-settings.model";
// ==========================
// Constants
// ==========================
// Keep this aligned with env.REFRESH_TOKEN_EXPIRES_IN so a session row never
// outlives (or dies long before) the refresh token that references it.
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const OTP_TTL_MS = 1000 * 60 * 10; // 10 minutes
const RESEND_COOLDOWN_MS = 60_000; // 1 minute

// ==========================
// Local types
// ==========================
interface RefreshTokenPayload {
    sub: string;
    sessionId: string;
    iat: number;
    exp: number;
}

interface AvailabilityResult {
    available: boolean;
    message: string;
}

type UserWithProfile = Prisma.UserGetPayload<{ include: { profile: true } }>;

type SessionWithUserProfile = Prisma.SessionGetPayload<{
    include: { user: { include: { profile: true } } };
}>;

// Narrow field sets actually needed to build a UserModel, so callers can use
// `select` instead of always fetching the full row (e.g. passwordHash).
type UserForModel = Pick<
    User,
    "id" | "bio" | "avatarUrl" | "username" | "email" | "emailVerifiedAt" | "createdAt" | "updatedAt"
>;
type ProfileForModel = Pick<Profile, "fullName">;
type UserForMeModel = Prisma.UserGetPayload<{
    include: {
        profile: {
            include: {
                privacySettings: true;
                professionalIdentity: true;
                profileLinks: true;
                profileInterests: {
                    include: {
                        interest: true;
                    };
                };
            };
        };
        notificationSettings: true;
    };
}>;
@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly emailService: EmailService,
    ) { }

    // Reused across every googleLogin() call instead of constructing a new
    // client per request.
    private readonly googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

    // Lazily-computed, cached argon2 hash used only to keep login timing
    // consistent when an account doesn't exist (see login() and
    // resetPassword()).
    private dummyHashPromise: Promise<string> | null = null;

    // ==========================
    // Private Helpers
    // ==========================
    private generateAccessToken(userId: string, sessionId: string): string {
        return this.jwt.sign({
            sub: userId,
            sessionId,
        });
    }

    private generateRefreshToken(userId: string, sessionId: string): string {
        return this.jwt.sign(
            {
                sub: userId,
                sessionId,
            },
            {
                secret: env.JWT_REFRESH_SECRET,
                expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as JwtSignOptions["expiresIn"],
            },
        );
    }

    private async hashRefreshToken(refreshToken: string): Promise<string> {
        return argon2.hash(refreshToken);
    }

    private async isRefreshTokenValid(
        refreshToken: string,
        refreshTokenHash: string,
    ): Promise<boolean> {
        return argon2.verify(refreshTokenHash, refreshToken);
    }

    private getDummyHash(): Promise<string> {
        if (!this.dummyHashPromise) {
            this.dummyHashPromise = argon2.hash(randomUUID());
        }
        return this.dummyHashPromise;
    }


    private async issueSessionTokens(
        userId: string,
        prisma: PrismaService | Prisma.TransactionClient = this.prisma,
    ): Promise<{ session: Session; accessToken: string; refreshToken: string }> {
        const sessionId = randomUUID();
        const accessToken = this.generateAccessToken(userId, sessionId);
        const refreshToken = this.generateRefreshToken(userId, sessionId);
        const refreshTokenHash = await this.hashRefreshToken(refreshToken);

        const session = await prisma.session.create({
            data: {
                id: sessionId,
                userId,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + SESSION_TTL_MS),
            },
        });

        return { session, accessToken, refreshToken };
    }

    private async ensureUniqueUser(email: string, username: string): Promise<void> {
        const emailLower = email.toLowerCase();
        const usernameLower = username.toLowerCase();

        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ emailLower }, { usernameLower }],
            },
            select: {
                emailLower: true,
                usernameLower: true,
            },
        });

        if (!existing) {
            return;
        }

        if (existing.emailLower === emailLower) {
            throw new ConflictException("Email is already in use.");
        }

        throw new ConflictException("Username is already in use.");
    }

    private async createAccount(
        input: RegisterInput,
        passwordHash: string,
    ): Promise<{ user: User; profile: Profile; accessToken: string; refreshToken: string }> {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        username: input.username,
                        usernameLower: input.username.toLowerCase(),

                        email: input.email,
                        emailLower: input.email.toLowerCase(),

                        passwordHash,
                    },
                });

                const profile = await tx.profile.create({
                    data: {
                        userId: user.id,
                        fullName: input.fullName,
                        dateOfBirth: input.dateOfBirth,
                    },
                });

                const { accessToken, refreshToken } = await this.issueSessionTokens(
                    user.id,
                    tx,
                );

                return { user, profile, accessToken, refreshToken };
            });
        } catch (error) {
            // Fallback for the rare race where two requests pass
            // ensureUniqueUser() at the same time and both hit the DB's
            // unique constraint on email/username.
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new ConflictException("Email or username is already in use.");
            }
            throw error;
        }
    }

    private toUserModel(user: UserForModel, profile: ProfileForModel): UserModel {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: profile.fullName,
            bio: user.bio || undefined,
            avatarUrl: user.avatarUrl || undefined,
            emailVerified: user.emailVerifiedAt !== null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    private toMeModel(
        user: UserForMeModel,
    ): MeModel {
        return {
            id: user.id,
            username: user.username,
            email: user.email,

            fullName: user.profile!.fullName,

            bio: user.bio ?? undefined,
            avatarUrl: user.avatarUrl ?? undefined,

            emailVerified:
                user.emailVerifiedAt !== null,

            onboardingCompleted:
                user.onboardingCompleted,

            authProvider:
                user.authProvider,

            accountStatus:
                user.accountStatus,

            role:
                user.role,

            twoFactorEnabled:
                user.twoFactorEnabled,

            createdAt:
                user.createdAt,

            updatedAt:
                user.updatedAt,

            profile:
                this.toProfileModel(user.profile),

            notificationSettings:
                this.toNotificationSettingsModel(
                    user.notificationSettings,
                ),
        };
    }


    private toProfileModel(
        profile: UserForMeModel["profile"],
    ): ProfileModel {
        return {
            id: profile!.id,
            fullName: profile!.fullName,
            dateOfBirth: profile!.dateOfBirth ?? undefined,
            pronouns: profile!.pronouns ?? undefined,
            location: profile!.location ?? undefined,

            accountType: profile!.accountType,
            niche: profile!.niche ?? undefined,

            profileMusicUrl:
                profile!.profileMusicUrl ?? undefined,

            showInGlobalSearch:
                profile!.showInGlobalSearch,

            followerCount:
                profile!.followerCount,

            followingCount:
                profile!.followingCount,

            postCount:
                profile!.postCount,

            privacySettings:
                profile!.privacySettings ?? undefined,

            professionalIdentity:
                profile!.professionalIdentity
                    ? {
                        currentRole:
                            profile!.professionalIdentity.currentRole ?? undefined,
                        company:
                            profile!.professionalIdentity.company ?? undefined,
                        industry:
                            profile!.professionalIdentity.industry ?? undefined,
                        highestEducation:
                            profile!.professionalIdentity.highestEducation ?? undefined,
                    }
                    : undefined,
            profileLinks:
                profile!.profileLinks,

            profileInterests:
                profile!.profileInterests,
        };
    }

    
    private toNotificationSettingsModel(
        settings: UserForMeModel["notificationSettings"],
    ): NotificationSettingsModel | undefined {
        if (!settings) {
            return undefined;
        }

        return {
            likes: settings.likes,
            comments: settings.comments,
            mentions: settings.mentions,
            newFollowers: settings.newFollowers,
            directMessages: settings.directMessages,
            groupMessages: settings.groupMessages,
            communityPosts: settings.communityPosts,
            communityAnnouncements: settings.communityAnnouncements,
        };
    }
    private async hashPassword(password: string): Promise<string> {
        return argon2.hash(password);
    }

    private async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
        return argon2.verify(passwordHash, password);
    }

    private async findUserByIdentifier(identifier: string): Promise<UserWithProfile | null> {
        const identifierLower = identifier.toLowerCase();

        return this.prisma.user.findFirst({
            where: {
                OR: [{ emailLower: identifierLower }, { usernameLower: identifierLower }],
            },
            include: {
                profile: true,
            },
        });
    }

    private verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
        try {
            return this.jwt.verify<RefreshTokenPayload>(refreshToken, {
                secret: env.JWT_REFRESH_SECRET,
            });
        } catch {
            throw new UnauthorizedException("Invalid refresh token.");
        }
    }

    private async findValidSession(sessionId: string): Promise<SessionWithUserProfile> {
        const session = await this.prisma.session.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                user: {
                    include: {
                        profile: true,
                    },
                },
            },
        });

        if (!session) {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        if (session.expiresAt < new Date()) {
            await this.prisma.session
                .delete({ where: { id: session.id } })
                .catch(() => undefined);

            throw new UnauthorizedException("Session expired. Please log in again.");
        }

        return session;
    }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async createVerificationToken(userId: string): Promise<string> {
        const otp = this.generateOtp();
        const token = await argon2.hash(otp);

        // Atomically replace any existing code so a user can never end up
        // with two valid codes (or a create racing a delete) at once.
        await this.prisma.$transaction([
            this.prisma.verificationToken.deleteMany({
                where: { userId },
            }),
            this.prisma.verificationToken.create({
                data: {
                    userId,
                    token,
                    expiresAt: new Date(Date.now() + OTP_TTL_MS),
                },
            }),
        ]);

        return otp;
    }

    private async verifyVerificationToken(
        userId: string,
        otp: string,
    ): Promise<VerificationToken> {
        const verification = await this.prisma.verificationToken.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        if (!verification) {
            throw new UnauthorizedException(
                "Verification code not found. Please request a new one.",
            );
        }

        if (verification.expiresAt < new Date()) {
            await this.prisma.verificationToken
                .delete({ where: { id: verification.id } })
                .catch(() => undefined);

            throw new UnauthorizedException(
                "Verification code expired. Please request a new one.",
            );
        }

        const valid = await argon2.verify(verification.token, otp);

        if (!valid) {
            throw new UnauthorizedException("Invalid verification code.");
        }

        return verification;
    }

    private async createPasswordResetToken(userId: string): Promise<string> {
        const otp = this.generateOtp();
        const token = await argon2.hash(otp);

        // Same delete-then-create-in-one-transaction pattern as
        // createVerificationToken(), so a user only ever has one live reset
        // code at a time.
        await this.prisma.$transaction([
            this.prisma.passwordResetToken.deleteMany({
                where: { userId },
            }),
            this.prisma.passwordResetToken.create({
                data: {
                    userId,
                    token,
                    expiresAt: new Date(Date.now() + OTP_TTL_MS),
                },
            }),
        ]);

        return otp;
    }

    private async handleGoogleUser(
        email: string,
        name?: string,
        picture?: string,
    ): Promise<AuthPayload> {
        let user = await this.prisma.user.findUnique({
            where: {
                emailLower: email.toLowerCase(),
            },
            include: {
                profile: true,
            },
        });

        if (user) {
            user = await this.prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    authProvider: "GOOGLE",
                    emailVerifiedAt: new Date(),
                    avatarUrl: user.avatarUrl ?? picture,
                },
                include: {
                    profile: true,
                },
            });

            if (!user.profile) {
                throw new NotFoundException(
                    "User profile not found.",
                );
            }
        } else {
            const baseUsername = email.split("@")[0].toLowerCase();
            let username = baseUsername;
            while (
                await this.prisma.user.findUnique({
                    where: {
                        usernameLower:
                            username.toLowerCase(),
                    },
                    select: {
                        id: true,
                    },
                })
            ) {
                username =
                    `${baseUsername}${Math.floor(
                        1000 +
                        Math.random() * 9000,
                    )}`;
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const createdUser = await tx.user.create({
                    data: {
                        username,
                        usernameLower: username.toLowerCase(),

                        email,
                        emailLower: email.toLowerCase(),

                        authProvider: "GOOGLE",
                        avatarUrl: picture,
                        emailVerifiedAt: new Date(),
                    },
                });

                const profile = await tx.profile.create({
                    data: {
                        userId: createdUser.id,
                        fullName: name ?? username,
                    },
                });

                return { user: createdUser, profile };
            });

            user = { ...result.user, profile: result.profile };
        }

        const { accessToken, refreshToken } = await this.issueSessionTokens(user.id);

        return {
            accessToken,
            refreshToken,
            user: this.toUserModel(user, user.profile!),
        };
    }

    // ==========================
    // Public API
    // ==========================
    async register(input: RegisterInput): Promise<AuthPayload> {
        await this.ensureUniqueUser(input.email, input.username);

        const passwordHash = await this.hashPassword(input.password);

        const { user, profile, accessToken, refreshToken } = await this.createAccount(
            input,
            passwordHash,
        );

        const otp = await this.createVerificationToken(user.id);
        await this.emailService.sendVerificationEmail(user.email, otp);

        return {
            accessToken,
            refreshToken,
            user: this.toUserModel(user, profile),
        };
    }

    async checkUsernameAvailability(username: string): Promise<AvailabilityResult> {
        const existingUser = await this.prisma.user.findUnique({
            where: { usernameLower: username.toLowerCase() },
            select: { id: true },
        });

        return {
            available: !existingUser,
            message: existingUser ? "Username is already taken." : "Username is available.",
        };
    }

    async checkEmailAvailability(email: string): Promise<AvailabilityResult> {
        const existingUser = await this.prisma.user.findUnique({
            where: { emailLower: email.toLowerCase() },
            select: { id: true },
        });

        return {
            available: !existingUser,
            message: existingUser ? "Email is already taken." : "Email is available.",
        };
    }

    async login(input: LoginInput): Promise<AuthPayload> {
        const user = await this.findUserByIdentifier(input.identifier);

        if (!user || !user.passwordHash) {
            await argon2.verify(await this.getDummyHash(), input.password).catch(() => undefined);
            throw new UnauthorizedException("Invalid credentials.");
        }

        const isPasswordValid = await this.verifyPassword(input.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials.");
        }

        // Checked only *after* the password is confirmed valid, so a wrong

        if (!user.emailVerifiedAt) {
            throw new UnauthorizedException("Please verify your email before logging in.");
        }

        if (!user.profile) {
            throw new NotFoundException("User profile not found.");
        }

        const { accessToken, refreshToken } = await this.issueSessionTokens(user.id);

        return {
            accessToken,
            refreshToken,
            user: this.toUserModel(user, user.profile),
        };
    }

    async refreshToken(refreshToken: string): Promise<AuthPayload> {
        const payload = this.verifyRefreshToken(refreshToken);
        const session = await this.findValidSession(payload.sessionId);

        if (!session.refreshTokenHash || session.userId !== payload.sub) {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        const isValid = await this.isRefreshTokenValid(
            refreshToken,
            session.refreshTokenHash,
        );

        if (!isValid) {
            await this.prisma.session.deleteMany({ where: { id: session.id } });
            throw new UnauthorizedException("Invalid refresh token. Please log in again.");
        }

        if (!session.user.profile) {
            throw new NotFoundException("User profile not found.");
        }

        const newAccessToken = this.generateAccessToken(session.userId, session.id);
        const newRefreshToken = this.generateRefreshToken(session.userId, session.id);
        const newRefreshTokenHash = await this.hashRefreshToken(newRefreshToken);

        const { count } =
            await this.prisma.session.updateMany({
                where: {
                    id: session.id,
                    refreshTokenHash:
                        session.refreshTokenHash,
                },
                data: {
                    refreshTokenHash:
                        newRefreshTokenHash,

                    expiresAt: new Date(
                        Date.now() +
                        SESSION_TTL_MS,
                    ),
                },
            });

        if (count === 0) {
            await this.prisma.session.deleteMany({ where: { id: session.id } });
            throw new UnauthorizedException("Invalid refresh token. Please log in again.");
        }

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: this.toUserModel(session.user, session.user.profile),
        };
    }

    async me(
        userId: string,
    ): Promise<MeModel> {
        const user =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    profile: {
                        include: {
                            privacySettings: true,
                            professionalIdentity: true,
                            profileLinks: {
                                orderBy: {
                                    displayOrder: "asc",
                                },
                            },
                            profileInterests: {
                                include: {
                                    interest: true,
                                },
                            },
                        },
                    },
                    notificationSettings: true,
                },
            });

        if (!user || !user.profile) {
            throw new NotFoundException(
                "Account not found.",
            );
        }

        return this.toMeModel(user);
    }
    async logout(sessionId: string, userId: string): Promise<boolean> {
        await this.prisma.session.deleteMany({
            where: { id: sessionId, userId },
        });

        return true;
    }

    async logoutAllDevices(userId: string): Promise<boolean> {
        await this.prisma.session.deleteMany({
            where: { userId },
        });

        return true;
    }

    async verifyEmail(userId: string, otp: string): Promise<boolean> {
        if (!/^\d{6}$/.test(otp)) {
            throw new BadRequestException("Please enter a valid 6-digit code.");
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, emailVerifiedAt: true },
        });

        if (!user) {
            throw new NotFoundException("Account not found.");
        }

        if (user.emailVerifiedAt) {
            throw new ConflictException("Email is already verified.");
        }

        await this.verifyVerificationToken(userId, otp);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { emailVerifiedAt: new Date() },
            }),

            this.prisma.verificationToken.deleteMany({
                where: { userId },
            }),
        ]);

        return true;
    }

    async resendVerificationEmail(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, emailVerifiedAt: true },
        });

        if (!user) {
            throw new NotFoundException("Account not found.");
        }

        if (user.emailVerifiedAt) {
            throw new ConflictException("Email is already verified.");
        }

        const existing = await this.prisma.verificationToken.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        });

        if (existing && Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
            // NestJS has no built-in 429 exception class, so HttpException is
            // used directly with the correct status code.
            throw new HttpException(
                "Please wait a moment before requesting another code.",
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const otp = await this.createVerificationToken(user.id);
        await this.emailService.sendVerificationEmail(user.email, otp);

        return true;
    }

    async forgotPassword(email: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { emailLower: email.toLowerCase() },
            select: { id: true, email: true },
        });

        // Always return true — never reveal whether the email exists.
        if (!user) {
            return true;
        }

        const existing = await this.prisma.passwordResetToken.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        });

        if (existing && Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
            // Same "return true, do nothing" as the not-found case above,
            // deliberately: a distinguishable rate-limit error here would
            // itself confirm the account exists.
            return true;
        }

        const otp = await this.createPasswordResetToken(user.id);
        await this.emailService.sendPasswordResetEmail(user.email, otp);

        return true;
    }

    async resetPassword(email: string, otp: string, password: string): Promise<boolean> {
        if (!/^\d{6}$/.test(otp)) {
            throw new BadRequestException("Please enter a valid 6-digit code.");
        }

        const user = await this.prisma.user.findUnique({
            where: { emailLower: email.toLowerCase() },
            select: { id: true },
        });

        if (!user) {
            // Run a real argon2 verify so a nonexistent email takes about as
            // long as a genuine "wrong code" check, then fail with the exact
            // same message every other failure below uses — this endpoint
            // never reveals whether the account exists.
            await argon2.verify(await this.getDummyHash(), otp).catch(() => undefined);
            throw new BadRequestException("Invalid or expired reset code.");
        }

        const resetToken = await this.prisma.passwordResetToken.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            throw new BadRequestException("Invalid or expired reset code.");
        }

        const isValid = await argon2.verify(resetToken.token, otp);

        if (!isValid) {
            throw new BadRequestException("Invalid or expired reset code.");
        }

        const passwordHash = await this.hashPassword(password);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            this.prisma.passwordResetToken.deleteMany({
                where: { userId: user.id },
            }),
            // Same hard-delete semantics logoutAllDevices() uses elsewhere
            // in this file — there's no revokedAt field on Session, so this
            // revokes every existing session by removing it outright.
            this.prisma.session.deleteMany({
                where: { userId: user.id },
            }),
        ]);

        return true;
    }

    async googleLogin(idToken: string): Promise<AuthPayload> {
        let payload: TokenPayload | undefined;

        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: env.GOOGLE_CLIENT_ID,
            });

            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedException("Invalid Google token.");
        }

        if (!payload?.email) {
            throw new UnauthorizedException("Google account has no email.");
        }

        if (!payload.email_verified) {
            throw new UnauthorizedException("Google account email is not verified.");
        }

        return this.handleGoogleUser(payload.email, payload.name, payload.picture);
    }
}