import {
  CacheInterceptor,
  Controller,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  /**
   * A simple hello world just for you.
   * @returns "Hello World!"
   */
  @Get()
  @ApiOperation({
    summary: 'A simple hello world just for you.',
    operationId: 'helloWorld',
  })
  @ApiOkResponse({ type: String })
  helloWorld() {
    return `Welcome to the TDU Attendance API. It's only accessible to TDU members. If you're a TDU member, please visit https://attendance.team3132.com/ to get started.`;
  }
}
