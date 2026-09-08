import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateMenuItemDto) {
    await this.assertRestaurantOwner(dto.restaurantId, ownerId);
    return this.prisma.menuItem.create({ data: dto });
  }

  async update(id: string, ownerId: string, dto: UpdateMenuItemDto) {
    const item = await this.getOwned(id, ownerId);
    return this.prisma.menuItem.update({ where: { id: item.id }, data: dto });
  }

  async remove(id: string, ownerId: string) {
    const item = await this.getOwned(id, ownerId);
    await this.prisma.menuItem.delete({ where: { id: item.id } });
    return { deleted: true };
  }

  private async getOwned(id: string, ownerId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true },
    });
    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }
    if (item.restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Item pertence a outro restaurante');
    }
    return item;
  }

  private async assertRestaurantOwner(restaurantId: string, ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Você não é o dono deste restaurante');
    }
  }
}
