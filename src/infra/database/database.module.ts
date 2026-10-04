import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaDatabaseModule } from './prisma/prisma-database.module';
import { MongoDatabaseModule } from './mongo/mongo-database.module';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const provider = (process.env.DATABASE_PROVIDER || 'postgres').toLowerCase();

    if (provider === 'mongo' || provider === 'mongodb') {
      return {
        module: DatabaseModule,
        imports: [MongoDatabaseModule.register()],
        exports: [MongoDatabaseModule],
      };
    }

    return {
      module: DatabaseModule,
      imports: [PrismaDatabaseModule.register()],
      exports: [PrismaDatabaseModule],
    };
  }
}
