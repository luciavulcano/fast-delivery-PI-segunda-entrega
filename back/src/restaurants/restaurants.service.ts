import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.restaurant.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
      },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }
    return restaurant;
  }

  async create(ownerId: string, dto: CreateRestaurantDto) {
    const existing = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (existing) {
      throw new ForbiddenException('Este usuário já possui um restaurante');
    }
    return this.prisma.restaurant.create({ data: { ...dto, ownerId } });
  }

  async update(id: string, ownerId: string, dto: UpdateRestaurantDto) {
    await this.assertOwner(id, ownerId);
    return this.prisma.restaurant.update({ where: { id }, data: dto });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwner(id, ownerId);
    await this.prisma.restaurant.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertOwner(id: string, ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Você não é o dono deste restaurante');
    }
  }
}
