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
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SessionGuard } from '../auth/guard/session.guard';
import { GetUser } from '../auth/decorators/GetUserDecorator.decorator';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/DiscordRoleDecorator.decorator';
import { ROLES } from '../constants';
import { User } from './entities/user.entity';
import { RsvpService } from '../rsvp/rsvp.service';
import { Rsvp } from '../rsvp/entities/rsvp.entity';
import { Cache } from 'cache-manager';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { OutreachReport } from './dto/outreach-report.dto';
import { GetOutreachReport } from './dto/outreach-report-get.dto';
import { Scancode } from 'src/scancode/entities/scancode.entity';
import { ScancodeService } from 'src/scancode/scancode.service';
import { CreateScancodeDto } from 'src/scancode/dto/create-scancode.dto';

/** The user controller for controlling the user status */
@ApiTags('User')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rsvpService: RsvpService,
    private readonly scancodeService: ScancodeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get the currently authenticated user.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Get the currently authenticated user.',
    operationId: 'getMe',
  })
  @ApiOkResponse({ type: User })
  @Get('me')
  me(@GetUser('id') id: Express.User['id']) {
    return this.userService.user({ id });
  }

  /**
   * Get a specific user.
   * @param userId The actionable user.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Get a specific user.',
    operationId: 'getUser',
  })
  @ApiOkResponse({ type: User })
  @Roles([ROLES.MENTOR])
  @Get(':id')
  user(@Param('id') userId: string) {
    return this.userService.user({ id: userId });
  }

  /**
   * Get the currently authenticated user's avatar id
   * @returns {string}
   */
  @ApiOperation({
    summary: "Get the currently authenticated user's avatar id",
    operationId: 'getMeAvatar',
  })
  @ApiOkResponse({ type: String })
  @Get('me/avatar')
  async userMeAvatar(@GetUser('id') userId: Express.User['id']) {
    const { user } = await this.userService.discordProfile(userId);
    return user.avatar;
  }

  /**
   * Get a user's discord avatar id
   * @returns {string}
   */
  @ApiOperation({
    summary: "Get a user's discord avatar id",
    operationId: 'getUserAvatar',
  })
  @ApiOkResponse({ type: String })
  @Roles([ROLES.MENTOR])
  @Get(':id/avatar')
  async userAvatar(@Param('id') userId: string) {
    const { user } = await this.userService.discordProfile(userId);
    return user.avatar;
  }

  /**
   * Get the RSVPs of the logged in user.
   * @returns {Rsvp[]}
   */
  @ApiOperation({
    summary: 'Get the RSVPs of the logged in user.',
    operationId: 'getMeRSVPs',
  })
  @ApiOkResponse({ type: [Rsvp] })
  @Get('me/rsvp')
  meRSVP(@GetUser('id') id: Express.User['id']) {
    return this.rsvpService.rsvps({ where: { userId: id } });
  }

  /**
   * Get a user's RSVPs
   * @returns {Rsvp[]}
   */
  @ApiOperation({
    summary: "Get a user's RSVPs",
    operationId: 'getUserRSVPs',
  })
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
   * Edit the signed-in user.
   * @param updateUserDto
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Edit the signed-in user.',
    operationId: 'editMe',
  })
  @ApiCreatedResponse({ type: User })
  @Patch('me')
  update(
    @GetUser('id') id: Express.User['id'],
    @Body() updateUserDto: UpdateUserDto,
  ) {
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
   * Edit a user.
   * @param updateUserDto New user info.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Edit a user.',
    operationId: 'editUser',
  })
  @ApiCreatedResponse({ type: User })
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
   * Regenerates the calendar token of the signed in user.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Regenerates the calendar token of the signed in user.',
    operationId: 'regenerateMeCalendarToken',
  })
  @ApiCreatedResponse({ type: User })
  @Post('me/regenerateToken')
  regenerateToken(@GetUser('id') id: Express.User['id']) {
    return this.userService.regenerateCalendarSecret({ id });
  }

  /**
   * Regenerates the calendar token of the specified user.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Regenerates the calendar token of the specified user.',
    operationId: 'regenerateUserCalendarToken',
  })
  @ApiCreatedResponse({ type: User })
  @Roles([ROLES.MENTOR])
  @Post(':id/regenerateToken')
  regenerateUserToken(@Param('id') id: string) {
    return this.userService.regenerateCalendarSecret({ id });
  }

  /**
   * Delete the signed in user.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Delete the signed in user.',
    operationId: 'deleteMe',
  })
  @ApiOkResponse({ type: User })
  @Delete('me')
  async remove(
    @GetUser('id') id: Express.User['id'],
    @Session() session: Express.Request['session'],
  ) {
    const destroySession = new Promise<void>((res, rej) => {
      session.destroy((callback) => {
        if (callback) {
          rej(callback);
        } else {
          res();
        }
      });
    });

    await destroySession;

    return this.userService.deleteUser({ id });
  }

  /**
   * Delete a user.
   * @returns {User}
   */
  @ApiOperation({
    summary: 'Delete a user.',
    operationId: 'deleteUser',
  })
  @ApiOkResponse({ type: User })
  @Roles([ROLES.MENTOR])
  @Delete(':id')
  removeUser(@Param('id') id: string) {
    return this.userService.deleteUser({ id });
  }

  /**
   * Get a list of all users.
   * @returns {User[]}
   */
  @ApiOperation({
    summary: 'Get a list of all users.',
    operationId: 'getUsers',
  })
  @ApiOkResponse({ type: [User] })
  @Roles([ROLES.MENTOR])
  @Get()
  users() {
    return this.userService.users({});
  }

  /**
   * Get an outreach report of the logged in user.
   * @returns {OutreachReport}
   */
  @ApiOperation({
    summary: 'Get an outreach report of the logged in user.',
    operationId: 'getMeOutreachReport',
  })
  @ApiOkResponse({ type: OutreachReport })
  @Get('me/outreach')
  async myOutreachReport(
    @Query() params: GetOutreachReport,
    @GetUser('id') id: Express.User['id'],
  ) {
    const { from, to } = params;
    return this.userService.outreachReport(id, from, to);
  }

  /**
   * Get an outreach report of the specified user.
   * @returns {OutreachReport}
   */
  @ApiOperation({
    summary: 'Get an outreach report of the specified user.',
    operationId: 'getUserOutreachReport',
  })
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

  /**
   * Get a list of the logged in user's scancodes.
   * @returns {Scancode[]}
   */
  @ApiOperation({
    summary: "Get a list of the logged in user's scancodes.",
    operationId: 'getMeScancodes',
  })
  @ApiOkResponse({ type: [Scancode] })
  @Get('me/scancodes')
  async scancodes(@GetUser('id') id: Express.User['id']) {
    return this.scancodeService.scancodes({
      where: {
        userId: id,
      },
    });
  }

  /**
   * Get a list of the specified user's scancodes.
   * @returns {Scancode[]}
   */
  @ApiOperation({
    summary: "Get a list of the specified user's scancodes.",
    operationId: 'getUserScancodes',
  })
  @ApiOkResponse({ type: [Scancode] })
  @Roles([ROLES.MENTOR])
  @Get(':id/scancodes')
  async userScancodes(@Param('id') id: string) {
    return this.scancodeService.scancodes({
      where: {
        userId: id,
      },
    });
  }

  /**
   * Create a scancode for the logged in user.
   * @returns  {Scancode}
   */
  @ApiOperation({
    summary: 'Create a scancode for the logged in user.',
    operationId: 'createMeScancode',
  })
  @ApiCreatedResponse({ type: Scancode })
  @Post('me/scancodes')
  async createScancode(
    @GetUser('id') id: Express.User['id'],
    @Body() body: CreateScancodeDto,
  ) {
    return this.scancodeService.createScancode({
      ...body,
      user: {
        connect: {
          id,
        },
      },
    });
  }

  /**
   * Create a scancode for the specified user.
   * @returns {Scancode}
   */
  @ApiOperation({
    summary: 'Create a scancode for the specified user.',
    operationId: 'createUserScancode',
  })
  @ApiCreatedResponse({ type: Scancode })
  @Roles([ROLES.MENTOR])
  @Post(':id/scancodes')
  async createUserScancode(
    @Param('id') id: string,
    @Body() body: CreateScancodeDto,
  ) {
    return this.scancodeService.createScancode({
      ...body,
      user: {
        connect: {
          id,
        },
      },
    });
  }

  /**
   * Delete a scancode for the logged in user.
   * @returns {Scancode}
   */
  @ApiOperation({
    summary: 'Delete a scancode for the logged in user.',
    operationId: 'deleteMeScancode',
  })
  @ApiOkResponse({ type: Scancode })
  @Delete('me/scancodes/:scancodeId')
  async deleteScancode(
    @GetUser('id') id: Express.User['id'],
    @Param('scancodeId') scancodeId: string,
  ) {
    const scancode = await this.scancodeService.scancode({
      code: scancodeId,
    });

    if (scancode.userId !== id) {
      throw new ForbiddenException();
    }

    return this.scancodeService.deleteScancode({
      code: scancodeId,
    });
  }

  /**
   * Delete a scancode for the specified user.
   * @returns {Scancode}
   */
  @ApiOperation({
    summary: 'Delete a scancode for the specified user.',
    operationId: 'deleteUserScancode',
  })
  @ApiOkResponse({ type: Scancode })
  @Roles([ROLES.MENTOR])
  @Delete(':id/scancodes/:scancodeId')
  async deleteUserScancode(
    @Param('id') id: string,
    @Param('scancodeId') scancodeId: string,
  ) {
    const scancode = await this.scancodeService.scancode({
      code: scancodeId,
    });

    if (scancode.userId !== id) {
      throw new ForbiddenException();
    }

    return this.scancodeService.deleteScancode({
      code: scancodeId,
    });
  }
}
