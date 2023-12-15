import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthRegisterDTO } from "./dto/auth-register.dto";
import { UserService } from "src/user/user.service";
import * as bcrypt from 'bcrypt';
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class AuthService {

    private issuer = 'login';
    private audience = 'users';

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        private readonly mailer: MailerService

    ){}
   
    createToken(user: User) {
        return {
            accessToken: this.jwtService.sign({
                id: user.id,
                name: user.name,
                email: user.email
            },{
                expiresIn: "7 days",
                subject: String(user.id),
                issuer: this.issuer,
                audience: this.audience,
                // notBefore: Math.ceil((Date.now() + 1000 * 60 * 60) / 1000)
            })
        }
    }

    checkToken(token: string) {
        try {
            const data = this.jwtService.verify(token, {
                issuer: this.issuer,
                audience: this.audience,           
            });
            
            return data;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    isValidToken(token: string) {
        try {
            this.checkToken(token);
            return true;
        }catch(e) {
            return false;
        }
        
    }

    /**
     * LOGIN
     * 
     * @param email 
     * @param password 
     * @returns 
     */
    async login(email: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email
            }
        });

        if(!user) {
            throw new UnauthorizedException("Email e/ou senha incorretos.");
        }

        if( !await bcrypt.compare( password, user.password )) {
            throw new UnauthorizedException("Email e/ou senha incorretos.");
        }

        return this.createToken(user);
    }

    /**
     * FORGET
     * 
     * @param email 
     * @returns 
     */
    async forget(email: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email
            }
        });

        if(!user) {
            throw new UnauthorizedException("Email está incorreto.");
        }

        const token = this.jwtService.sign({
                id: user.id
            },{
                expiresIn: "10 minutes",
                subject: String(user.id),
                issuer: 'forget',
                audience: 'users',
                // notBefore: Math.ceil((Date.now() + 1000 * 60 * 60) / 1000)
            });

        await this.mailer.sendMail({
            subject: "Recuperação de Senha",
            to: "marwamprog.js@gmail.com",
            template: 'forget',
            context: {
                name: user.name,
                token
            }
        });

        return true;
    }
    
    /**
     * RESET
     * 
     * @param password 
     * @param token 
     * @returns 
     */
    async reset(password: string, token: string) {
        try {

            console.log(token);

            const data:any = this.jwtService.verify(token, {
                issuer: 'forget',
                audience: 'users',           
            });          
                        
            if(isNaN(Number(data.id))) {
                throw new BadRequestException("Token é inválido");
            }

            const salt = await bcrypt.genSalt();
            password = await bcrypt.hash(password, salt);

            const user = await this.prisma.user.update({
                where: {
                    id: Number(data.id)
                },
                data: {
                    password
                }
            });

            return this.createToken(user);

        } catch (error) {
            throw new BadRequestException(error);
        }

        
    }

    /**
     * REGISTER
     * 
     * @param data 
     * @returns 
     */
    async register(data: AuthRegisterDTO) {
       const user = await this.userService.create(data);
       return this.createToken(user);
    }


}