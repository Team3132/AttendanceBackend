import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DiscordModule } from '@discord/discord.module';
import { DiscordService } from '@discord/discord.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionSerializer } from './session.serializer';
import { DiscordStrategy } from './strategy/discord.strategy';

@Module({
  imports: [
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, DiscordStrategy, SessionSerializer],
  exports: [AuthService],
})
export class AuthModule {}
