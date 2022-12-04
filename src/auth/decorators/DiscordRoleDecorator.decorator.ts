import { SetMetadata } from '@nestjs/common';
import { ROLES, ROLE } from '@/constants';

export const Roles = (roles: ROLE[]) => SetMetadata('roles', roles);
