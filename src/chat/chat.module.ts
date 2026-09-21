import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ScheduleModule } from 'node_modules/@nestjs/schedule/dist/schedule.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ChatGateway, ChatService,PrismaService],
})
export class ChatModule {}
