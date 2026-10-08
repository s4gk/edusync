import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateConsentDto {
  @IsString()
  @IsNotEmpty({ message: 'Falta el titular de los datos' })
  subjectUserId: string;

  @IsArray()
  @IsString({ each: true })
  purposes: string[];

  @IsOptional()
  @IsBoolean()
  sensitiveDataAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  imageRightsAccepted?: boolean;

  /** Nombre de quien firma. Para un menor es el acudiente; se guarda como
   *  texto además del userId porque la evidencia debe seguir siendo legible
   *  aunque esa cuenta se elimine después. */
  @IsString()
  @IsNotEmpty({ message: 'Falta el nombre de quien autoriza' })
  @MaxLength(160)
  signedByName: string;

  @IsString()
  @IsNotEmpty({ message: 'Falta la calidad de quien autoriza' })
  signedByRole: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  signedByDocument?: string;

  @IsOptional()
  @IsString()
  signedByUserId?: string;

  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  @IsOptional()
  @IsString()
  channel?: string;
}

export class RevokeConsentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
