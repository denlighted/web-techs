import {createParamDecorator, type ExecutionContext, UnauthorizedException} from "@nestjs/common";
import {User} from "@prisma/client";
import type {Request} from 'express';

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