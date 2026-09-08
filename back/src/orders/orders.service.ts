import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ORDER_INCLUDE = {
  items: true,
  payment: true,
  restaurant: { select: { id: true, name: true, category: true } },
  address: true,
  tracking: { orderBy: { createdAt: 'asc' } as const },
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateOrderDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId: customerId },
    });
    if (!address) {
      throw new BadRequestException('Endereço inválido');
    }

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: dto.restaurantId, isAvailable: true },
    });
    if (menuItems.length !== new Set(menuItemIds).size) {
      throw new BadRequestException('Um ou mais itens são inválidos para este restaurante');
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    const orderItemsData = dto.items.map((input) => {
      const item = priceMap.get(input.menuItemId)!;
      const unitPrice = Number(item.price);
      subtotal += unitPrice * input.quantity;
      return {
        menuItemId: item.id,
        nameSnapshot: item.name,
        unitPrice,
        quantity: input.quantity,
        notes: input.notes,
      };
    });

    const deliveryFee = Number(restaurant.deliveryFee);
    const total = subtotal + deliveryFee;

    if (subtotal < Number(restaurant.minOrder)) {
      throw new BadRequestException(
        `Pedido mínimo de R$ ${Number(restaurant.minOrder).toFixed(2)}`,
      );
    }

    return this.prisma.order.create({
      data: {
        customerId,
        restaurantId: dto.restaurantId,
        addressId: dto.addressId,
        notes: dto.notes,
        subtotal,
        deliveryFee,
        total,
        items: { create: orderItemsData },
        payment: {
          create: { method: dto.paymentMethod, amount: total, status: 'PENDING' },
        },
        tracking: {
          create: { status: 'PENDING', message: 'Pedido recebido, aguardando confirmação' },
        },
      },
      include: ORDER_INCLUDE,
    });
  }

  async findForUser(user: { id: string; role: string }) {
    if (user.role === 'MERCHANT') {
      return this.prisma.order.findMany({
        where: { restaurant: { ownerId: user.id } },
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.order.findMany({
      where: { customerId: user.id },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { ...ORDER_INCLUDE, restaurant: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const isCustomer = order.customerId === user.id;
    const isMerchant = order.restaurant.ownerId === user.id;
    const isCourier = order.courierId != null && user.role === 'COURIER';
    if (!isCustomer && !isMerchant && !isCourier && user.role !== 'ADMIN') {
      throw new ForbiddenException('Sem acesso a este pedido');
    }
    return order;
  }

  async updateStatus(id: string, user: { id: string; role: string }, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const isMerchant = order.restaurant.ownerId === user.id;
    const isCourier = user.role === 'COURIER';
    if (!isMerchant && !isCourier && user.role !== 'ADMIN') {
      throw new ForbiddenException('Sem permissão para alterar o status');
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.trackingEvent.create({
        data: {
          orderId: id,
          status: dto.status,
          message: dto.message,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      }),
      this.prisma.order.update({
        where: { id },
        data: {
          status: dto.status,
          payment:
            dto.status === 'DELIVERED'
              ? { update: { status: 'PAID', paidAt: new Date() } }
              : undefined,
        },
        include: ORDER_INCLUDE,
      }),
    ]);
    return updated;
  }
}
