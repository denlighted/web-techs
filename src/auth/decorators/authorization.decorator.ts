import {applyDecorators, UseGuards} from "@nestjs/common";
import {RolesGuard} from "../guards/role.guards.js";
import { RoleEnum } from "../enums/role.enums.js";
import {JwtGuard} from "../guards/auth.guard.js";
import {Roles} from "./roles.decorator.js";

export function Authorization(...roles:RoleEnum[]){
    if(roles.length > 0){
        return applyDecorators(Roles(...roles), UseGuards(JwtGuard,RolesGuard))
    }
    return applyDecorators(UseGuards(JwtGuard));
}