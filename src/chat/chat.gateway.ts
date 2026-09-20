import {ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private activeUsers = new Map<string, { username: string; room: string }>();

  private readonly VARIANT_N = 20;

  constructor(private readonly prisma: PrismaService) {}


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
}
}

