import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import {
  APIGuildMember,
  RESTGetAPIGuildMemberResult,
} from 'discord-api-types/v10';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuid } from 'uuid';
import { AuthService } from 'src/auth/auth.service';
import { DiscordService } from 'src/discord/discord.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly discordService: DiscordService,
    private readonly authService: AuthService,
  ) {}
  private readonly logger = new Logger(UserService.name);

  users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prismaService.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  user(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUnique({ where: userWhereUniqueInput });
  }

  updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }) {
    const { data, where } = params;
    return this.prismaService.user.update({
      data,
      where,
    });
  }

  regenerateCalendarSecret(where: Prisma.UserWhereUniqueInput) {
    this.logger.log(
      `User with id: ${where.id} calendar secret was regenerated.`,
    );
    return this.prismaService.user.update({
      where,
      data: {
        calendarSecret: uuid(),
      },
    });
  }

  deleteUser(where: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.delete({ where });
  }

  async discordProfile(userId: string): Promise<APIGuildMember> {
    return this.discordService.getDiscordMemberDetails(userId);
  }
}
