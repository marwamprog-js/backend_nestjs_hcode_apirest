import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthRegisterDTO } from "./dto/auth-register.dto";
import { UserService } from "src/user/user.service";

@Injectable()
export class AuthService {

    private issuer = 'login';
    private audience = 'users';

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly userService: UserService

    ){}
   
    async createToken(user: User) {
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

    async checkToken(token: string) {
        try {
            const data = await this.jwtService.verify(token, {
                issuer: this.issuer,
                audience: this.audience,           
            });
            
            return data;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async isValidToken(token: string) {
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
                email,
                password
            }
        });

        if(!user) {
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

        //TO DO: Enviar o e-mail...

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
        //TO DO: Validar o token...

        const id = 0;

        const user = await this.prisma.user.update({
            where: {
                id
            },
            data: {
                password
            }
        });

        return this.createToken(user);
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