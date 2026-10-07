import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUrl, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf,
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

// Site-relative paths (an uploaded file at /api/files/..., a static /photo.png) or http(s) URLs.
const LINK = /^(https?:\/\/|\/(?!\/))\S*$/;

export class UpdateProfileDto {
  @Transform(trim) @IsString() @Length(1, 80)
  name: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  title?: string;

  @Transform(trim) @IsString() @MaxLength(160)
  headline: string;

  @Transform(trim) @IsString() @MaxLength(4000)
  bio: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  location?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(160)
  availability?: string;

  @IsOptional() @Transform(trimList) @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(60, { each: true })
  languages?: string[];

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @Matches(LINK) @MaxLength(500)
  photoUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @Matches(LINK) @MaxLength(500)
  cvUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  githubUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  linkedinUrl?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsEmail() @MaxLength(200)
  contactEmail?: string | null;
}

export class CreateExperienceDto {
  @IsIn(['work', 'education', 'certification'])
  kind: 'work' | 'education' | 'certification';

  @Transform(trim) @IsString() @Length(1, 160)
  title: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(160)
  organization?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(80)
  location?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(40)
  startLabel?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(40)
  endLabel?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000)
  summary?: string;

  @IsOptional() @Transform(trimList) @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(300, { each: true })
  highlights?: string[];

  @IsOptional() @Transform(trimList) @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsUrl(URL_OPTIONS) @MaxLength(500)
  url?: string | null;

  @IsOptional() @IsBoolean()
  published?: boolean;

  @IsOptional() @IsInt() @Min(-10_000) @Max(10_000)
  sortOrder?: number;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

export class CreateSkillGroupDto {
  @Transform(trim) @IsString() @Length(1, 60)
  name: string;

  @IsOptional() @Transform(trimList) @IsArray() @ArrayMaxSize(40) @IsString({ each: true }) @MaxLength(40, { each: true })
  items?: string[];

  @IsOptional() @IsInt() @Min(-10_000) @Max(10_000)
  sortOrder?: number;
}

export class UpdateSkillGroupDto extends PartialType(CreateSkillGroupDto) {}
