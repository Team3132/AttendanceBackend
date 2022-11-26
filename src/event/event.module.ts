import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { RsvpService } from '../rsvp/rsvp.service';
import { RsvpModule } from '../rsvp/rsvp.module';
import { ScancodeService } from 'src/scancode/scancode.service';
import { ScancodeModule } from 'src/scancode/scancode.module';

@Module({
  controllers: [EventController],
  providers: [EventService, RsvpService, ScancodeService],
  exports: [EventService],
  imports: [RsvpModule, ScancodeModule],
})
export class EventModule {}
