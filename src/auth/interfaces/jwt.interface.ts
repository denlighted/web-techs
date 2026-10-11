import { RoleEnum } from "./../enums/role.enums.js"

export interface JwtPayload {
    sub: string;
    email: string;
    role?: RoleEnum;
    name?: string;
    iat?: number;
    exp?: number;
}