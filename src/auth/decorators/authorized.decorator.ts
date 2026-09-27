import {createParamDecorator, type ExecutionContext, UnauthorizedException} from "@nestjs/common";
import type {Request} from 'express';
import {User} from "@prisma/client";

export const Authorized = createParamDecorator(
    (data:keyof User, context:ExecutionContext) => {
        const request = context.switchToHttp().getRequest() as Request &{ user?: User };
        const user = request.user;
        if(!user){
            throw new UnauthorizedException("You are not authorized");
        }

        return data? user[data]:user;
    }
);