import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { EventsController } from './events/events.controller';

@Module({
  imports: [DbModule, AuthModule, EventsModule],
  controllers: [AppController, EventsController],
})
export class AppModule {}
