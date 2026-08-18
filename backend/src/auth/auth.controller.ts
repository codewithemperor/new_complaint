import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { Public } from '../common/decorators/is-public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ttlToMs } from '../common/utils/ttl';
import type { Response } from 'express';

const COOKIE_NAME = 'kwmoc_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Staff login — sets httpOnly cookie + returns token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear the auth cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, {
      path: '/',
      sameSite: this.getCookieSameSite(),
      secure: this.configService.get<boolean>('COOKIE_SECURE', false),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  private setAuthCookie(res: Response, token: string) {
    const ttlMs = ttlToMs(
      this.configService.get<string>('JWT_ACCESS_TTL') ?? '8h',
    );
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.configService.get<boolean>('COOKIE_SECURE', false),
      sameSite: this.getCookieSameSite(),
      maxAge: ttlMs,
      path: '/',
    });
  }

  private getCookieSameSite(): 'lax' | 'none' {
    return this.configService.get<boolean>('COOKIE_SECURE', false)
      ? 'none'
      : 'lax';
  }
}
