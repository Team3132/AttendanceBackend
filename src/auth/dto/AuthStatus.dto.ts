import { ApiProperty } from '@nestjs/swagger';

/**
 * The authentication status metadata
 */
export class AuthStatusDto {
  @ApiProperty()
  isAuthenticated: boolean;
  @ApiProperty()
  roles: string[];
  @ApiProperty()
  isAdmin: boolean;
}
