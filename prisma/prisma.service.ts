// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// @Injectable()
// export class PrismaService implements OnModuleInit, OnModuleDestroy {
//   private client = prisma;

//   get user() { return this.client.user; }

//   async onModuleInit() {
//     await this.client.$connect();
//   }

//   async onModuleDestroy() {
//     await this.client.$disconnect();
//   }
// }

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}