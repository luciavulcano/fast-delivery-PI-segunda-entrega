import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItems: MenuItemsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMenuItemDto) {
    return this.menuItems.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItems.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.menuItems.remove(id, user.id);
  }
}
