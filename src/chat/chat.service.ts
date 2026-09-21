import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { kStringMaxLength } from 'buffer';

@Injectable()
export class ChatService {
    constructor(private readonly prismaService: PrismaService) {}

    async saveMessage(room: string, username: string, text: string) {
    return this.prismaService.message.create({
      data: {
        room,
        username,
        text,
      },
    });
  }

  async getRoomHistory(room: string) {
    return this.prismaService.message.findMany({
      where: { room },
      orderBy: { createdAt: 'asc' },
    });
  }
}
