import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Body, Post, Res, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { RegisterRequest } from './dto/register.dto.js';
import { LoginRequest } from './dto/login.dto.js';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { RoleEnum } from './enums/role.enums.js';
import { Authorized } from './decorators/authorized.decorator.js';
import { JwtGuard } from './guards/auth.guard.js';
import type {User} from "@prisma/client";


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService,
                private readonly configService: ConfigService,) {
    }

    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    async register(@Res({passthrough: true}) res: Response, @Body() dto: RegisterRequest) {
        return await this.authService.register(res, dto)
    }

    @Post("login")
    @HttpCode(HttpStatus.OK)
    async login(@Res({passthrough: true}) res: Response, @Body() dto: LoginRequest) {
        return await this.authService.login(res, dto)
    }

    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({passthrough: true}) res: Response) {
        return await this.authService.refresh(req, res)
    }

    @Post("logout")
    @HttpCode(HttpStatus.OK)
    async logout(@Res({passthrough: true}) res: Response) {
        return await this.authService.logout(res);
    }

    @UseGuards(JwtGuard)
    @Patch("change-role")
    async changeUsersRole(@Authorized() user: User, @Body("newRole") newRole: RoleEnum) {
        return await this.authService.changeUsersRole(user.id, newRole);
    }
}
