import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDTO } from "./dto/create-user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdatePutUserDTO } from "./dto/update-put-user.dto";
import { UpdatePatchUserDTO } from "./dto/update-patch-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

    constructor(private readonly prisma: PrismaService) {}

    /**
     * CREATE
     * 
     * @param param0 
     * @returns 
     */
    async create(data: CreateUserDTO) {

        const salt = await bcrypt.genSalt();
        // console.log({salt});
        data.password = await bcrypt.hash(data.password, salt);

        return this.prisma.user.create({
            data
        });
    }

    /**
     * LISTAR TODOS
     * 
     * @returns 
     */
    async list() {
        return this.prisma.user.findMany();
    }

    /**
     * LISTAR POR ID
     * 
     * @param id 
     * @returns 
     */
    async findById(id: number) {

        await this.userExists(id);

        return this.prisma.user.findUnique({
            where: {
                id
            }
        });
    }

    /**
     * UPDATE
     * 
     * @param id 
     * @param data 
     * @returns 
     */
    async update(id: number, {email, name, password, birthAt, role}: UpdatePutUserDTO) {

        await this.userExists(id);

        const salt = await bcrypt.genSalt();
        // console.log({salt});
        password = await bcrypt.hash(password, salt);

        return this.prisma.user.update({
            data: {email, name, password, birthAt: birthAt ? new Date(birthAt) : null, role},
            where: {
                id
            }
        });
    }

    /**
     * UPDATE PATCH, PARCIAL
     * 
     * @param id 
     * @param data 
     * @returns 
     */
    async updatePartial(id: number, {email, name, password, birthAt, role}: UpdatePatchUserDTO) {

        await this.userExists(id);

        const data: any = {};

        if(birthAt) {
            data.birthAt = new Date(data.birthAt);
        }

        if(email) {
            data.email = email;
        }

        if(name) {
            data.name = name;
        }

        if(password) {
            const salt = await bcrypt.genSalt();
            data.password = await bcrypt.hash(password, salt);
        }

        if(role) {
            data.role = role;
        }

        return this.prisma.user.update({
            data,
            where: {
                id
            }
        });
    }

    /**
     * DELETE
     * 
     * @param id 
     * @returns 
     */
    async delete(id: number) {

        await this.userExists(id);

        return this.prisma.user.delete({
            where: {
                id
            }
        });
    }

    async userExists(id: number) {
        if(!(await this.prisma.user.count({
            where: {
                id
            }
        }))) {
            throw new NotFoundException(`O usuário ${id} não existe.`);
        }
    }

}