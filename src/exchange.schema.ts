import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExchangeDocument = Exchange & Document;

interface BitconInfo {
  lastValue: number;
  buy: number;
  sell: number;
  date: Date;
}

@Schema()
export class Exchange {
  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  bitcoin_info: BitconInfo[];

  @Prop({ default: 0 })
  average_price_bitcoin: number;
}

export const ExchangeSchema = SchemaFactory.createForClass(Exchange);
