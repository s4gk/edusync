import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CoachService } from './coach.service';

type ChatBody = {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
};

@ApiTags('coach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat con el Coach IA (proxy a Claude API; requiere ANTHROPIC_API_KEY)' })
  chat(@Body() body: ChatBody) {
    return this.coachService.chat(body?.messages ?? [], body?.context);
  }
}
