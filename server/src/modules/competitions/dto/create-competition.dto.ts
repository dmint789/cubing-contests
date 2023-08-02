import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import Countries from '@sh/Countries';
import { CompetitionType } from '@sh/enums';
import { IEvent, IPerson, IRound } from '@sh/interfaces';

export class CreateCompetitionDto {
  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]{9,45}$/)
  competitionId: string;

  @IsString()
  @Matches(/^[A-Z0-9][a-zA-Z0-9 -:']{9,45}$/)
  name: string;

  @IsEnum(CompetitionType)
  type: CompetitionType;

  @IsString()
  city: string;

  @IsIn(Countries.map((el) => el.code))
  countryIso2: string;

  @IsString()
  venue: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitudeMicrodegrees: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitudeMicrodegrees: number;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  organizers?: IPerson[];

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  competitorLimit?: number;

  @IsString()
  @MinLength(3)
  mainEventId: string;

  @IsArray()
  @ArrayMinSize(1)
  events: {
    event: IEvent;
    rounds: IRound[];
  }[];
}
