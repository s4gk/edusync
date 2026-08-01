import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReportCardsController } from './report-cards.controller';
import { ReportCardsService } from './report-cards.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'pdf' })],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
  exports: [ReportCardsService],
})
export class ReportCardsModule {}
