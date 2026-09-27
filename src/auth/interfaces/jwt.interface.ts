import { RoleEnum } from "./../enums/role.enums.js"

export interface JwtPayload {
    sub: string;
    email: string;
    role?: RoleEnum;
    iat?: number;
    exp?: number;
}