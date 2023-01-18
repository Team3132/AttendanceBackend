import { Rsvp } from '@/rsvp/entities/rsvp.entity';
import { ApiProperty } from '@nestjs/swagger';

class MinimalUser {
  @ApiProperty()
  id: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  roles: string[];
}

export class RsvpUser extends Rsvp {
  @ApiProperty({ type: MinimalUser })
  user: MinimalUser;
}
