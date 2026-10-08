import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { YearCloseController } from './year-close.controller';
import { YearCloseService } from './year-close.service';

@Module({
  imports: [PrismaModule],
  controllers: [YearCloseController],
  providers: [YearCloseService],
})
export class YearCloseModule {}
