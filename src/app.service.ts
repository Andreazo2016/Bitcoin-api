import { Injectable, HttpService } from '@nestjs/common';
import { WebSocketServer, WebSocketGateway } from '@nestjs/websockets';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Exchange, ExchangeDocument } from './exchange.schema';
import { Server } from 'socket.io';

import { Cron } from '@nestjs/schedule';
@WebSocketGateway()
@Injectable()
export class AppService {
  @WebSocketServer() server: Server;
  constructor(
    @InjectModel(Exchange.name)
    private exchangeModel: Model<ExchangeDocument>,
  ) { }

  async saveOnDatabase({ name, slug, data }): Promise<void> {
    const register = await this.exchangeModel.findOne({
      slug,
    });
    const response: any = await this.exchangeModel.aggregate([
      {
        $match: {
          slug,
        },
      },
      {
        $unwind: '$bitcoin_info',
      },
      {
        $project: {
          _id: 1,
          amount: '$bitcoin_info.lastValue',
        },
      },
      {
        $addFields: {
          amountConverted: { $toDecimal: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id',
          sum: { $sum: 1 },
          avgAmount: { $avg: '$amountConverted' },
        },
      },
    ]);

    if (!register) {
      const document = new this.exchangeModel({
        name,
        slug,
        average_price_bitcoin: Number(response[0].avgAmount.toString()),
        bitcoin_info: [data],
      });
      await document.save();
    } else {
      register.bitcoin_info.push(data);
      register.average_price_bitcoin = Number(response[0].avgAmount.toString());
      await register.save();
    }
    this.server.emit('update', {
      name,
      slug,
      average_price_bitcoin: Number(response[0].avgAmount.toString()),
    });
  }

  @Cron('0 */1 * * * *')
  getBitcoinDataFromBrazilBitcoin(): void {
    const httpService: HttpService = new HttpService();
    httpService
      .get('https://brasilbitcoin.com.br/API/prices/BTC')
      .subscribe(async (response) => {
        const { data } = response;

        const bitcoin = {
          lastValue: data.last,
          buy: data.buy,
          sell: data.sell,
          date: new Date(),
        };
        await this.saveOnDatabase({
          name: 'brasil bitcoin',
          slug: 'BRASIL_BITCOIN',
          data: bitcoin,
        });
      });
  }

  @Cron('0 */1 * * * *')
  getBitcoinDataFromBitPreco(): void {
    const httpService: HttpService = new HttpService();
    httpService
      .get('https://api.bitpreco.com/btc-brl/ticker')
      .subscribe(async (response) => {
        const { data } = response;
        const bitcoin = {
          lastValue: data.last,
          buy: data.buy,
          sell: data.sell,
          date: new Date(),
        };
        await this.saveOnDatabase({
          name: 'bit preço',
          slug: 'BIT_PRECO',
          data: bitcoin,
        });
      });
  }

  @Cron('0 */1 * * * *')
  getBitcoinDataFromMercadoBitcoin(): void {
    const httpService: HttpService = new HttpService();
    httpService
      .get('https://www.mercadobitcoin.net/api/BTC/ticker/')
      .subscribe(async (response) => {
        const {
          data: { ticker },
        } = response;
        const bitcoin = {
          lastValue: ticker.last,
          buy: ticker.buy,
          sell: ticker.sell,
          date: new Date(),
        };

        await this.saveOnDatabase({
          name: 'mercado bitcoin',
          slug: 'MERCADO_BITCOIN',
          data: bitcoin,
        });
      });
  }
}
