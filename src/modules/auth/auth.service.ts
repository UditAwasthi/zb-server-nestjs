import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../database/prisma.service";
import { RegisterInput } from "./dto/register.input";
import { LoginInput } from "./dto/login.input";
import { AuthPayload } from "./dto/auth-payload.model";
import { env } from "../../config/env"
import { User, Profile, Prisma } from "@prisma/client";
import { UserModel } from "../user/models/user.model";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,

    ) { }

    // ==========================
    // Private Helpers
    // ==========================
    private generateAccessToken(
        userId: string,
        sessionId: string,
    ): string {
        return this.jwt.sign({
            sub: userId,
            sessionId,
        });
    }
    private generateRefreshToken(
        userId: string,
        sessionId: string,
    ): string {
        return this.jwt.sign(
            {
                sub: userId,
                sessionId,
            },
            {
                secret: env.JWT_REFRESH_SECRET,
                expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
            },
        );
    }
    private async hashRefreshToken(
        refreshToken: string,
    ): Promise<string> {
        return argon2.hash(refreshToken);
    }
    private async createSession(
        prisma: PrismaService | Prisma.TransactionClient,
        userId: string,
    ) {
        return prisma.session.create({
            data: {
                userId,
                refreshTokenHash: "",
                expiresAt: new Date(
                    Date.now() +
                    1000 * 60 * 60 * 24 * 30,
                ),
            },
        });
    }
    private async ensureUniqueUser(
        email: string,
        username: string,
    ): Promise<void> {
        const [emailExists, usernameExists] =
            await Promise.all([
                this.prisma.user.findUnique({
                    where: {
                        emailLower: email.toLowerCase(),
                    },
                }),

                this.prisma.user.findUnique({
                    where: {
                        usernameLower: username.toLowerCase(),
                    },
                }),
            ]);

        if (emailExists) {
            throw new ConflictException(
                "Email is already in use.",
            );
        }

        if (usernameExists) {
            throw new ConflictException(
                "Username is already in use.",
            );
        }
    }
    private async updateSessionRefreshToken(
        sessionId: string,
        refreshToken: string,
    ) {
        const refreshTokenHash =
            await this.hashRefreshToken(
                refreshToken,
            );

        return this.prisma.session.update({
            where: {
                id: sessionId,
            },

            data: {
                refreshTokenHash,
            },
        });
    }
    private async createAccount(
        input: RegisterInput,
        passwordHash: string,
    ) {
        return this.prisma.$transaction(async (tx) => {
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

            const session = await this.createSession(
                tx,
                user.id,
            );

            return {
                user,
                profile,
                session,
            };
        });
    }
    private toUserModel(
        user: User,
        profile: Profile,
    ): UserModel {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: profile.fullName,
            emailVerified: user.emailVerifiedAt !== null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    private async hashPassword(
        password: string,
    ): Promise<string> {
        return argon2.hash(password);
    }
    private async verifyPassword(
        password: string,
        passwordHash: string,
    ): Promise<boolean> {
        return argon2.verify(
            passwordHash,
            password,
        );
    }
    private async findUserByIdentifier(
        identifier: string,
    ) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    {
                        emailLower: identifier.toLowerCase(),
                    },
                    {
                        usernameLower: identifier.toLowerCase(),
                    },
                ],
            },
            include: {
                profile: true,
            },
        });
    }





    async register(
        input: RegisterInput,
    ): Promise<AuthPayload> {
        await this.ensureUniqueUser(
            input.email,
            input.username,
        );

        const passwordHash = await this.hashPassword(
            input.password,
        );

        const {
            user,
            profile,
            session,
        } = await this.createAccount(
            input,
            passwordHash,
        );

        const accessToken =
            this.generateAccessToken(
                user.id,
                session.id,
            );

        const refreshToken =
            this.generateRefreshToken(
                user.id,
                session.id,
            );

        await this.updateSessionRefreshToken(
            session.id,
            refreshToken,
        );

        return {
            accessToken,
            refreshToken,
            user: this.toUserModel(
                user,
                profile,
            ),
        };
    }

    async checkUsernameAvailability(
        username: string,
    ) {
        const existingUser =
            await this.prisma.user.findUnique({
                where: {
                    usernameLower: username.toLowerCase(),
                },
            });
        return {
            available: !existingUser,
            message: existingUser ? "Username is already taken" : "Username is available"
        };
    }


    async checkEmailAvailability(
        email: string,
    ) {
        const existingUser =
            await this.prisma.user.findUnique({
                where: {
                    emailLower: email.toLowerCase(),
                },
            });
        return {
            available: !existingUser,
            message: existingUser ? "Email is already taken" : "Email is available"
        };
    }


    async login(
        input: LoginInput,
    ): Promise<AuthPayload> {
        const user = await this.findUserByIdentifier(
            input.identifier,
        );

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException(
                "Invalid credentials.",
            )
        }
        const isPasswordValid = await this.verifyPassword(
            input.password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException(
                "Invalid credentials.",
            );
        }
        const session = await this.createSession(
            this.prisma,
            user.id,
        );

        const accessToken = this.generateAccessToken(
            user.id,
            session.id,
        );

        const refreshToken = this.generateRefreshToken(
            user.id,
            session.id,
        );

        await this.updateSessionRefreshToken(
            session.id,
            refreshToken,
        );
        if (!user.profile) {
            throw new UnauthorizedException(
                "User profile not found.",
            );
        }
        return {
            accessToken,
            refreshToken,
            user: this.toUserModel(
                user,
                user.profile,
            ),
        };


    }

    // async refreshToken(
    //     refreshToken: string,
    // ): Promise<AuthPayload> { }

    // async logout(
    //     sessionId: string,
    // ): Promise<boolean> { }

    // async me(
    //     userId: string,
    // ) { }
}