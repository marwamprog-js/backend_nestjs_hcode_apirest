import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [JwtModule.register({
        secret: `cJwvg4Bcjlw0=EF|w9+#Z@g8=KlF<bX*`
    })]
})
export class AuthModule {

}