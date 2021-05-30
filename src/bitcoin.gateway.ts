import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  WsResponse,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Exchange, ExchangeDocument } from './exchange.schema';

import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class BitcoinEvent implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @InjectModel(Exchange.name)
    private exchangeModel: Model<ExchangeDocument>,
  ) { }

  public async handleConnection(client: Socket): Promise<void> {
    const exchanges = await this.exchangeModel.find({});
    const exchangesMapped = exchanges.map(
      ({ name, slug, average_price_bitcoin }) => ({
        name,
        slug,
        average_price_bitcoin,
      }),
    );
    console.log('Client conectado', client.id);
    this.server.emit('data', exchangesMapped);
  }

  public handleDisconnect() { }
}
