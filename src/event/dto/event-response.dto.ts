import { OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Event, EventTypes, Prisma } from '@prisma/client';
import { Exclude } from 'class-transformer';
// import { Event } from '../entities/event.entity';

export class EventResponse implements Event {
  @ApiProperty()
  id: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;
  @ApiProperty()
  allDay: boolean;
  @ApiProperty({ enum: EventTypes })
  type: EventTypes;

  @Exclude()
  secret: string;

  constructor(event: Event) {
    Object.assign(this, event);
  }
}

export class EventResponseType extends OmitType(EventResponse, ['secret']) {}
