import { ApiProperty } from '@nestjs/swagger';
import { RSVPStatus } from '@prisma/client';
import { IsEnum, IsOptional, ValidateIf } from 'class-validator';

/**
 * The data used to update a user
 */
export class UpdateUserDto {
  @IsOptional()
  @IsEnum(RSVPStatus)
  @ValidateIf((v) => v !== null || v !== '')
  @ApiProperty({ required: false, enum: RSVPStatus, nullable: true })
  defaultStatus: RSVPStatus | null;
}
