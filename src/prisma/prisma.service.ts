import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  jwtService: any;
  constructor() {
    // Use test database URL if in test environment
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  onModuleInit() {
    this.$connect()
      .then(() => console.log('Connected to DB'))
      .catch((err) => {
        console.log(`Error connecting to DB: ${err}`);
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // async cleanDatabase() {
  //   if (process.env.NODE_ENV === 'production') return;
  //   const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

  //   return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
  // }
}
