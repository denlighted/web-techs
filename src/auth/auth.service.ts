import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { isDev } from '../utils/is-dev.utils.js';
import { RoleEnum } from './enums/role.enums.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.interface.js';
import { type LoginRequest } from "./dto/login.dto.js";
import { type RegisterRequest } from "./dto/register.dto.js";
import type { Response, Request } from 'express';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenType } from './enums/token-type.enums.js';
import ms, { StringValue } from 'ms';
import { hash, verify } from 'argon2';

@Injectable()
export class AuthService {

    private readonly JWT_ACCESS_TOKEN_TTL: string;
    private readonly JWT_REFRESH_TOKEN_TTL: string;

    private readonly COOKIE_DOMAIN: string;

    constructor(private readonly prismaService:PrismaService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {
        this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL');
        this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL');
        this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    }

    async register(res: Response, dto: RegisterRequest) {
        const {email, password, firstName, lastName, phoneNumber} = dto;

        const role = RoleEnum.USER;


        const existUser = await this.prismaService.user.findUnique({where: {email}});

        if (existUser) {
            throw new ConflictException('User already exists');
        }
        const user = await this.prismaService.user.create({
            data: {
                email,
                passwordHash: await hash(password),
                firstName,
                lastName,
                phoneNumber,
                role
            },
        });

        return this.auth(res, user.id, email, role);
    }

    async login(res: Response, dto: LoginRequest) {
        const {email, password} = dto;

        const user = await this.prismaService.user.findUnique({
            where: {email},
            select: {id: true, passwordHash: true, email: true, role: true},
        });


        if (!user) {
            throw new NotFoundException('User does not exist');
        }

        const isValidPassword = await verify(user.passwordHash, password);

        if (!isValidPassword) {
            throw new NotFoundException('Invalid credentials');
        }

        return this.auth(res, user.id, user.email, user.role as RoleEnum)
    }

    async refresh(req: Request, res: Response) {
        const refreshToken = req.cookies['refresh_token'];

        if (!refreshToken) {
            throw new UnauthorizedException('Not valid refreshToken');
        }

        const payLoad: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

        const tokenRecord = await this.prismaService.token.findFirst({
            where: {
                type: TokenType.REFRESH,
                userId: payLoad.sub,
                tokenHash: refreshToken
            },
        });


        if (!tokenRecord) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.prismaService.user.findUnique({
            where: { id: payLoad.sub },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const accessToken = this.jwtService.sign(
            { sub: user.id, email: user.email, role: user.role },
            { expiresIn: ms(this.JWT_ACCESS_TOKEN_TTL as StringValue) / 1000 }
        );
        this.setCookie(
            res,
            accessToken,
            "access_token",
            new Date(Date.now() + 15 * 60 * 1000)
        );

        return { accessToken };
    }


    async validate(id: string) {
        const user = await this.prismaService.user.findUnique({where: {id}});
        if (!user) {
            throw new NotFoundException("User has not found");
        }

        return user;
    }

    private async auth(res: Response, id: string, email: string, role: RoleEnum) {
        const {accessToken, refreshToken} = await this.generateTokens(id, email, role);

        this.setCookie(res, refreshToken, 'refresh_token', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        this.setCookie(res, accessToken,'access_token', new Date(Date.now() + 15 * 60 * 1000));

        return {accessToken};
    }

    async logout(res: Response) {
        this.setCookie(res,'','refresh_token', new Date(0))
        this.setCookie(res,'', 'access_token',new Date(0));
        return true;
    }

    private async generateTokens(sub: string, email: string, role: RoleEnum) {
        const payLoad: JwtPayload = {sub, email, role};

        const accessToken = this.jwtService.sign(payLoad, {
            expiresIn: ms(this.JWT_ACCESS_TOKEN_TTL as StringValue) / 1000,
        });

        const refreshToken = this.jwtService.sign({...payLoad, type: TokenType.REFRESH},
            {expiresIn: ms(this.JWT_REFRESH_TOKEN_TTL as StringValue) / 1000},
        );

        await this.prismaService.token.create({
            data: {
                userId: sub,
                tokenHash: refreshToken,
                type: TokenType.REFRESH,
                expiresAt: new Date(
                    Date.now() + (ms(this.JWT_REFRESH_TOKEN_TTL as StringValue) ?? 0),
                ),
            },
        });

        return {accessToken, refreshToken};
    }

    private setCookie(res: Response, value: string,name:string, expires: Date) {
        res.cookie(name, value, {
            httpOnly: true,
            expires,
            secure: !isDev(this.configService),
            sameSite: isDev(this.configService) ? 'lax' : 'none',
        });
    }


}
