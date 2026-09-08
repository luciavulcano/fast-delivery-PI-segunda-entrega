import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('users/me/addresses')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.users.listAddresses(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.users.createAddress(user.id, dto);
  }
}
