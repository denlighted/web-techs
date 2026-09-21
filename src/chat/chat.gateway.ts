import {ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { Interval } from 'node_modules/@nestjs/schedule/dist/decorators/interval.decorator';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private activeUsers = new Map<string, { username: string; room: string }>();

  private readonly VARIANT_N = 20;

  constructor(private readonly chatService: ChatService) {}


  @WebSocketServer() server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }
  

  handleDisconnect(client: Socket) {
    const user = this.activeUsers.get(client.id);
    if (user) {
      this.server.to(user.room).emit('userDisconnected', { username: "Admin",text: `${user.username} has left!`,time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }), });

    }
    this.activeUsers.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { username: string; room: string }
) {
  client.join(data.room);
    this.activeUsers.set(client.id, { username: data.username, room: data.room });
   
  client.emit('message', {
      username: 'Admin',
      text: `Welcome, ${data.username}!`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
    });  
  
    client.broadcast.to(data.room).emit('message', {
      username: 'Admin',
      text: `${data.username} has joined!`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
    });

    const history = await this.chatService.getRoomHistory(data.room);
    client.emit('history', history);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() text: string,
  ) {
    const user = this.activeUsers.get(client.id);
    if (user) {
      // Сохраняем сообщение через сервис
      await this.chatService.saveMessage(user.room, user.username, text);

      this.server.to(user.room).emit('message', {
        username: user.username,
        text,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
      });
    }
  }

  @Interval((10 + 20) * 1000) 
  handleAutomaticMessage() {
    const currentTime = new Date().toLocaleTimeString('ru-RU');
    const autoMessageText = `Автоматичне повідомлення від ст. Гарковенко Денис гр. ХХ-ХХ Варіант ${this.VARIANT_N} ${currentTime}`;
    
    this.server.emit('message', {
      username: 'System', 
      text: autoMessageText,
      isAutoMessage: true, 
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
    });
  }
}

