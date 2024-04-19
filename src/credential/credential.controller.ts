import {BadRequestException, Body, Controller, Get, Post, Req, Res, UnauthorizedException} from '@nestjs/common';
import {CredentialService} from './credential.service';
import * as bcrypt from 'bcrypt';
import {JwtService} from "@nestjs/jwt";
import { Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';

@Controller('credential')
export class CredentialController {
    constructor(    
	private readonly credentialService: CredentialService,
        private jwtService: JwtService
    ) {
    }

    @Post('signup')
    async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: string,
    ) {
        const hashedPassword = await bcrypt.hash(password, 12);

        const credential = await this.credentialService.create({
            role,
            email,
            password: hashedPassword
        });

        delete credential.password;

        return credential;
    }

    @Post('login')
    async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: ExpressResponse,
    ) {
        const credential = await this.credentialService.findOneBy({email});

        if (!credential) {
            throw new BadRequestException('invalid credentials');
        }

        if (!await bcrypt.compare(password, credential.password)) {
            throw new BadRequestException('invalid credentials');
        }

        const jwt = await this.jwtService.signAsync({id: credential.id});

        response.cookie('jwt', jwt, {httpOnly: true});

        return {
            message: 'success'
        };
    }

    @Get('credential')
    async credential(@Req() request: ExpressRequest) {
        try {
            const cookie = request.cookies['jwt'];

            const data = await this.jwtService.verifyAsync(cookie);

            if (!data) {
                throw new UnauthorizedException();
            }

            const credential = await this.credentialService.findOneBy({id: data['id']});

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {password, ...result} = credential;

            return result;
        } catch (e) {
            throw new UnauthorizedException();
        }
    }

    @Post('logout')
    async logout(@Res({passthrough: true}) response: ExpressResponse) {
        response.clearCookie('jwt');

        return {
            message: 'success'
        }
    }
}