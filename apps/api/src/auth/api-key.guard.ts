import { createHash, timingSafeEqual } from 'node:crypto';

import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { parseApiKeys } from '../config/environment.js';
import { IS_PUBLIC_ROUTE } from './public.decorator.js';

interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function isAuthorizedApiKey(candidate: string, configuredKeys: readonly string[]): boolean {
  const candidateDigest = digest(candidate);
  return configuredKeys.some((key) => timingSafeEqual(candidateDigest, digest(key)));
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly configuredKeys: readonly string[];

  public constructor(
    @Inject(ConfigService)
    config: ConfigService,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {
    this.configuredKeys = parseApiKeys(config.getOrThrow<string>('API_KEYS'));
  }

  public canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<HttpRequest>();
    const header = request.headers['x-api-key'];
    const candidate = Array.isArray(header) ? header[0] : header;

    if (!candidate || !isAuthorizedApiKey(candidate, this.configuredKeys)) {
      throw new UnauthorizedException('A valid x-api-key header is required');
    }
    return true;
  }
}
