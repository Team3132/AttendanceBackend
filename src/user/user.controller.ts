import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Session,
  CACHE_MANAGER,
  Inject,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SessionGuard } from '../auth/guard/session.guard';
import { GetUser } from '../auth/decorators/GetUserDecorator.decorator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/DiscordRoleDecorator.decorator';
import { ROLES } from '../constants';
import { User } from './entities/user.entity';
import { RsvpService } from '../rsvp/rsvp.service';
import { Rsvp } from '../rsvp/entities/rsvp.entity';
import { Cache } from 'cache-manager';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime';
import { OutreachReport } from './dto/outreach-report.dto';
import { GetOutreachReport } from './dto/outreach-report-get.dto';

/** The user controller for controlling the user status */
@ApiTags('User')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rsvpService: RsvpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get the currently authenticated user.
   * @returns User
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: User })
  @Get('me')
  me(@GetUser('id') id: string) {
    return this.userService.user({ id });
  }

  /**
   * Get the currently authenticated user's avatar id
   * @returns Avatar string
   */
  @ApiCookieAuth()
  @ApiOkResponse({ type: String })
  @UseGuards(SessionGuard)
  @Get('me/avatar')
  async userMeAvatar(@GetUser('id') userId: string) {
    const { user } = await this.userService.discordProfile(userId);
    return user.avatar;
  }

  /**
   * Get the RSVPs of the logged in user.
   * @returns RSVP
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: [Rsvp] })
  @Get('me/rsvp')
  meRSVP(@GetUser('id') id: string) {
    return this.rsvpService.rsvps({ where: { userId: id } });
  }

  /**
   * Edit the signed-in user.
   * @param updateUserDto
   * @returns
   */
  @ApiOkResponse({ type: User })
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @Patch('me')
  update(@GetUser('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return this.userService.updateUser({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('The email must be unique');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Regenerates the calendar token of the signed in user.
   * @returns User
   */
  @ApiOkResponse({ type: User })
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @Post('me/regenerateToken')
  regenerateToken(@GetUser('id') id: string) {
    return this.userService.regenerateCalendarSecret({ id });
  }

  /**
   * Delete the signed in user.
   * @returns User
   */
  @ApiOkResponse({ type: User })
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @Delete('me')
  remove(
    @GetUser('id') id: string,
    @Session() session: Express.Request['session'],
  ) {
    session.destroy((callback) => {});
    return this.userService.deleteUser({ id });
  }

  /**
   * Get a list of all users.
   * @returns List of Users
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: [User] })
  @Roles([ROLES.MENTOR])
  @Get()
  users() {
    return this.userService.users({});
  }

  /**
   * Get a specific user.
   * @param userId The actionable user.
   * @returns List of Users
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: User })
  @Roles([ROLES.MENTOR])
  @Get(':id')
  user(@Param('id') userId: string) {
    return this.userService.user({ id: userId });
  }

  /**
   * Edit a user.
   * @param updateUserDto New user info.
   * @returns User
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: User })
  @Roles([ROLES.MENTOR])
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return this.userService.updateUser({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('The email must be unique');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Regenerates the calendar token of the specified user.
   * @returns User
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: User })
  @Roles([ROLES.MENTOR])
  @Post(':id/regenerateToken')
  regenerateUserToken(@Param('id') id: string) {
    return this.userService.regenerateCalendarSecret({ id });
  }

  /**
   * Delete a user.
   * @returns User
   */
  @ApiOkResponse({ type: User })
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @Roles([ROLES.MENTOR])
  @Delete(':id')
  removeUser(@Param('id') id: string) {
    return this.userService.deleteUser({ id });
  }

  /**
   * Get a user's RSVPs
   * @returns List of RSVP
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: [Rsvp] })
  @Roles([ROLES.MENTOR])
  @Get(':id/rsvp')
  userRSVPs(@Param('id') userId: string) {
    return this.rsvpService.rsvps({
      where: {
        userId: userId,
      },
    });
  }

  /**
   * Get a user's discord avatar id
   * @returns Avatar string
   */
  @ApiOkResponse({ type: String })
  @Roles([ROLES.MENTOR])
  @Get(':id/avatar')
  async userAvatar(@Param('id') userId: string) {
    const { user } = await this.userService.discordProfile(userId);
    return user.avatar;
  }

  @ApiOkResponse({ type: OutreachReport })
  @Roles([ROLES.MENTOR])
  @Get(':id/outreach')
  async outreachReport(
    @Param('id') userId: string,
    @Query() params: GetOutreachReport,
  ) {
    const { from, to } = params;
    return this.userService.outreachReport(userId, from, to);
  }
}
