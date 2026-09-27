import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { PrismaController } from './prisma.controller.js';

@Module({
  controllers: [PrismaController],
  providers: [PrismaService],
})
export class PrismaModule {}
