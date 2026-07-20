import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class OwnerQueryDto {
  @ApiProperty({ description: 'Tenant/workspace owner identifier' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;
}
