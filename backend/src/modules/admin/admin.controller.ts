import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '@/modules/auth/guards/admin.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from '@/modules/users/entities';
import {
  AdminUserFilterDto,
  UpdateUserStatusDto,
  GrantCoinsDto,
  DeductCoinsDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@Query() filter: AdminUserFilterDto) {
    return this.adminService.listUsers(filter);
  }

  @Get('users/:userId')
  async getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Patch('users/:userId/status')
  async updateUserStatus(@Param('userId') userId: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(userId, dto);
  }

  @Post('economy/grant')
  async grantCoins(@CurrentUser() user: User, @Body() dto: GrantCoinsDto) {
    return this.adminService.grantCoins(user.id, dto);
  }

  @Post('economy/deduct')
  async deductCoins(@CurrentUser() user: User, @Body() dto: DeductCoinsDto) {
    return this.adminService.deductCoins(user.id, dto);
  }

  @Post('templates')
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.adminService.createTemplate(dto);
  }

  @Patch('templates/:id')
  async updateTemplate(@Param('id') templateId: string, @Body() dto: UpdateTemplateDto) {
    return this.adminService.updateTemplate(templateId, dto);
  }
}
