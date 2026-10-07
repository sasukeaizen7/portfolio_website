import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUrl, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
// Empty string from a cleared form field means "no value".
const emptyToNull = ({ value }: { value: unknown }) => (typeof value === 'string' && value.trim() === '' ? null : trim({ value }));
const trimList = ({ value }: { value: unknown }) =>
  Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => v !== '') : value;

// Only http(s) links: these end up in href attributes.
const URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true };

export class CreateProjectDto {
  @Transform(trim) @IsString() @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'slug: lowercase letters, digits and dashes' }) @MaxLength(80)
  slug: string;

  @Transform(trim) @IsString() @Length(1, 120)
  title: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(400)
  summary?: string;

  @IsOptional() @IsString() @MaxLength(20_000)
  description?: string;

  @IsOptional() @Transform(trim) @IsString() @Length(1, 40)
  category?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(60)
  period?: string;

  @IsOptional() @Transform(trimList) @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional() @Transform(trimList) @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(300, { each: true })
  highlights?: string[];

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  repoUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  demoUrl?: string | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID()
  imageId?: string | null;

  @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)) @Matches(/^#[0-9a-f]{6}$/)
  color?: string;

  @IsOptional() @IsBoolean()
  featured?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;

  @IsOptional() @IsInt() @Min(-10_000) @Max(10_000)
  sortOrder?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateProfileDto {
  @Transform(trim) @IsString() @Length(1, 80)
  name: string;

  @Transform(trim) @IsString() @MaxLength(160)
  headline: string;

  @Transform(trim) @IsString() @MaxLength(2000)
  bio: string;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  githubUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  linkedinUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsEmail() @MaxLength(200)
  contactEmail?: string | null;
}
