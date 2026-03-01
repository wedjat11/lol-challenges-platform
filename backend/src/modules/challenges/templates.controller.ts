import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OnboardingGuard } from '@/modules/auth/guards/onboarding.guard';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @UseGuards(OnboardingGuard)
  async findAll(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      validatorKey: string;
      paramSchema: Record<string, unknown>;
      rewardFormula: string;
    }>
  > {
    const templates = await this.challengesService.getTemplates();
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      validatorKey: t.validatorKey,
      paramSchema: t.paramSchema,
      rewardFormula: t.rewardFormula,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    id: string;
    name: string;
    description: string;
    validatorKey: string;
    paramSchema: Record<string, unknown>;
    rewardFormula: string;
  }> {
    const template = await this.challengesService.getTemplateById(id);
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      validatorKey: template.validatorKey,
      paramSchema: template.paramSchema,
      rewardFormula: template.rewardFormula,
    };
  }
}
