import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EconomyService } from './economy.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/users/entities';

@ApiTags('economy')
@ApiBearerAuth()
@Controller('economy')
@UseGuards(JwtAuthGuard)
export class EconomyController {
  constructor(private readonly economyService: EconomyService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: User): Promise<{ balance: number }> {
    const balance = await this.economyService.getBalance(user.id);
    return { balance };
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: User,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ): Promise<{
    transactions: Array<{
      id: string;
      amount: number;
      type: string;
      balanceAfter: number;
      createdAt: Date;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const result = await this.economyService.getTransactions(user.id, limit, offset);
    return {
      transactions: result.transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.createdAt,
      })),
      total: result.total,
      limit,
      offset,
    };
  }
}
