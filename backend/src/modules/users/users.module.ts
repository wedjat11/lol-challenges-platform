import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, RiotAccount } from './entities';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RiotModule } from '@/modules/riot/riot.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, RiotAccount]), RiotModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
