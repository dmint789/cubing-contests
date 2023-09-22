import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { find } from 'geo-tz';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContestEvent, ContestDocument } from '~/src/models/contest.model';
import { excl, exclSysButKeepCreatedBy } from '~/src/helpers/dbHelpers';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { IContestEvent, IContestData, IContest } from '@sh/interfaces';
import { ContestState, ContestType } from '@sh/enums';
import { Role } from '@sh/enums';
import { ScheduleDocument } from '~/src/models/schedule.model';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { AuthService } from '../auth/auth.service';

const eventPopulateOptions = {
  event: { path: 'events.event', model: 'Event' },
  rounds: {
    path: 'events.rounds',
    model: 'Round',
    populate: [
      {
        path: 'results',
        model: 'Result',
      },
    ],
  },
};

@Injectable()
export class ContestsService {
  constructor(
    private eventsService: EventsService,
    private resultsService: ResultsService,
    private recordTypesService: RecordTypesService,
    private personsService: PersonsService,
    private authService: AuthService,
    @InjectModel('Competition') private readonly contestModel: Model<ContestDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async getContests(region?: string): Promise<ContestDocument[]> {
    const queryFilter: any = { state: { $gt: ContestState.Created } };
    if (region) queryFilter.countryIso2 = region;

    try {
      const contests = await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
      return contests;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getModContests(user: IPartialUser): Promise<IContest[]> {
    let queryFilter: any = {};
    if (!user.roles.includes(Role.Admin)) queryFilter = { createdBy: user.personId };

    try {
      return await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getContest(competitionId: string, user?: IPartialUser): Promise<IContestData> {
    const contest = await this.getFullCompetition(competitionId, user);
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    try {
      // TEMPORARILY DISABLED until mod-only protection is added
      // if (contest?.state > ContestState.Created) {

      const output: IContestData = {
        contest,
        persons: await this.personsService.getCompetitionParticipants({ contestEvents: contest.events }),
        activeRecordTypes,
      };

      if (user) {
        output.recordPairsByEvent = await this.resultsService.getRecordPairs(
          contest.events.map((el) => el.event.eventId),
          contest.startDate,
          activeRecordTypes,
        );
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Create new contest, if one with that id doesn't already exist (no results yet)
  async createContest(createContestDto: CreateContestDto, creatorPersonId: number, saveResults = false) {
    let comp;
    try {
      comp = await this.contestModel.findOne({ competitionId: createContestDto.competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`A contest with the ID ${createContestDto.competitionId} already exists`);

    try {
      comp = await this.contestModel.findOne({ name: createContestDto.name }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`A contest with the name ${createContestDto.name} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const contestEvents: ContestEvent[] = [];

      for (const contestEvent of createContestDto.events) {
        contestEvents.push(await this.getNewContestEvent(contestEvent, saveResults));
      }

      // Create new contest
      const newCompetition: IContest = {
        ...createContestDto,
        events: contestEvents,
        createdBy: creatorPersonId,
        state: ContestState.Created,
        participants: !saveResults
          ? 0
          : (await this.personsService.getCompetitionParticipants({ contestEvents: contestEvents })).length,
      };

      newCompetition.organizers = await this.personsService.getPersonsById(
        createContestDto.organizers.map((org) => org.personId),
      );

      if (createContestDto.type === ContestType.Meetup) {
        newCompetition.timezone = find(
          createContestDto.latitudeMicrodegrees / 1000000,
          createContestDto.longitudeMicrodegrees / 1000000,
        )[0];
      }

      if (createContestDto.compDetails?.schedule) {
        newCompetition.compDetails.schedule = await this.scheduleModel.create(createContestDto.compDetails.schedule);
      }

      await this.contestModel.create(newCompetition);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateContest(competitionId: string, updateContestDto: UpdateContestDto, user: IPartialUser) {
    const contest = await this.findContest(competitionId, true);
    // Makes sure the user is an admin or a moderator who has access rights to the UNFINISHED contest.
    // If the contest is finished and the user is not an admin, an unauthorized exception is thrown.
    this.authService.checkAccessRightsToContest(user, contest);
    const isAdmin = user.roles.includes(Role.Admin);

    contest.organizers = await this.personsService.getPersonsById(
      updateContestDto.organizers.map((org) => org.personId),
    );
    if (updateContestDto.contact) contest.contact = updateContestDto.contact;
    if (updateContestDto.description) contest.description = updateContestDto.description;

    contest.events = await this.updateContestEvents(contest, updateContestDto.events);

    if (isAdmin || contest.state < ContestState.Approved) {
      contest.name = updateContestDto.name;
      if (updateContestDto.city) contest.city = updateContestDto.city;
      if (updateContestDto.venue) contest.venue = updateContestDto.venue;
      if (updateContestDto.address) contest.address = updateContestDto.address;
      if (updateContestDto.latitudeMicrodegrees && updateContestDto.longitudeMicrodegrees) {
        contest.latitudeMicrodegrees = updateContestDto.latitudeMicrodegrees;
        contest.longitudeMicrodegrees = updateContestDto.longitudeMicrodegrees;
      }
      if (updateContestDto.competitorLimit) contest.competitorLimit = updateContestDto.competitorLimit;
      contest.mainEventId = updateContestDto.mainEventId;

      if (updateContestDto.compDetails) {
        if (contest.compDetails) {
          await this.scheduleModel.updateOne(
            { _id: contest.compDetails.schedule._id },
            updateContestDto.compDetails.schedule,
          );
        } else {
          contest.compDetails = {
            schedule: await this.scheduleModel.create(updateContestDto.compDetails.schedule),
          };
        }
      }
    }

    // Even an admin is not allowed to edit these after a comp has been approved
    if (contest.state < ContestState.Approved) {
      contest.startDate = updateContestDto.startDate;
      if (contest.endDate) contest.endDate = updateContestDto.endDate;
    }

    await this.saveContest(contest);
  }

  async updateState(competitionId: string, newState: ContestState, user: IPartialUser) {
    const contest = await this.findContest(competitionId);
    this.authService.checkAccessRightsToContest(user, contest);
    const isAdmin = user.roles.includes(Role.Admin);

    if (contest.type === ContestType.Competition && !contest.compDetails) {
      throw new BadRequestException('A competition without a schedule cannot be approved');
    }

    if (
      isAdmin ||
      // Allow mods only to finish an ongoing contest
      (contest.state === ContestState.Ongoing && newState === ContestState.Finished)
    ) {
      contest.state = newState;
    }

    if (isAdmin && newState === ContestState.Published) {
      console.log(`Publishing contest ${contest.competitionId}...`);

      try {
        // Unset unapproved from the results so that they can be included in the rankings
        await this.resultModel.updateMany({ competitionId: contest.competitionId }, { $unset: { unapproved: '' } });

        await this.resultsService.resetRecordsCancelledByPublishedComp(contest.competitionId);
      } catch (err) {
        throw new InternalServerErrorException(`Error while publishing contest: ${err.message}`);
      }
    }

    await this.saveContest(contest);
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  private async findContest(competitionId: string, populateEvents = false): Promise<ContestDocument> {
    let contest: ContestDocument;

    try {
      if (!populateEvents) {
        contest = await this.contestModel.findOne({ competitionId }).exec();
      } else {
        contest = await this.contestModel
          .findOne({ competitionId })
          .populate(eventPopulateOptions.event)
          .populate(eventPopulateOptions.rounds)
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!contest) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return contest;
  }

  private async saveContest(contest: ContestDocument) {
    try {
      await contest.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Finds the contest with the given competition ID with the rounds and results populated
  private async getFullCompetition(competitionId: string, user?: IPartialUser): Promise<ContestDocument> {
    let contest: ContestDocument;

    try {
      contest = await this.contestModel
        // createdBy is used to check access rights below, and then excluded
        .findOne({ competitionId }, exclSysButKeepCreatedBy)
        .populate(eventPopulateOptions.event)
        .populate(eventPopulateOptions.rounds)
        .populate({ path: 'organizers', model: 'Person' })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!contest) throw new NotFoundException(`Contest with ID ${competitionId} not found`);

    if (user) this.authService.checkAccessRightsToContest(user, contest, { ignoreState: true });
    contest.createdBy = undefined;

    if (contest.compDetails) {
      try {
        await contest.populate({ path: 'compDetails.schedule', model: 'Schedule' });
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }
    }

    return contest;
  }

  private async getNewContestEvent(contestEvent: IContestEvent, saveResults = false): Promise<ContestEvent> {
    const eventRounds: RoundDocument[] = [];

    try {
      for (const round of contestEvent.rounds) {
        // This is only used for the import contest feature and can only be used by an admin
        if (saveResults) {
          round.results = await this.resultModel.create(round.results.map((r) => ({ ...r, unapproved: true })));
        }

        eventRounds.push(await this.roundModel.create(round));
      }
    } catch (err) {
      throw new InternalServerErrorException('Error while creating rounds for co');
    }

    return {
      event: await this.eventsService.getEventById(contestEvent.event.eventId),
      rounds: eventRounds,
    };
  }

  // Deletes/adds/updates contest events and rounds
  private async updateContestEvents(contest: ContestDocument, newEvents: IContestEvent[]): Promise<ContestEvent[]> {
    try {
      // Remove deleted rounds and events
      for (const contestEvent of contest.events) {
        const sameEventInNew = newEvents.find((el) => el.event.eventId === contestEvent.event.eventId);

        if (sameEventInNew) {
          for (const round of contestEvent.rounds) {
            // Delete round if it has no results
            if (round.results.length === 0 && !sameEventInNew.rounds.some((el) => el.roundId === round.roundId)) {
              await round.deleteOne();
              contestEvent.rounds = contestEvent.rounds.filter((el) => el !== round);
            }
          }
        }
        // Delete event and all of its rounds if it has no results
        else if (!contestEvent.rounds.some((el) => el.results.length > 0)) {
          for (const round of contestEvent.rounds) await round.deleteOne();
          contest.events = contest.events.filter((el) => el.event.eventId !== contestEvent.event.eventId);
        }
      }

      // Update rounds and add new events
      for (const newEvent of newEvents) {
        const sameEventInContest = contest.events.find((el) => el.event.eventId === newEvent.event.eventId);

        if (sameEventInContest) {
          for (const round of newEvent.rounds) {
            const sameRoundInContest = sameEventInContest.rounds.find((el) => el.roundId === round.roundId);

            // If the contest already has this round, update the permitted fields
            if (sameRoundInContest) {
              sameRoundInContest.roundTypeId = round.roundTypeId;

              if (sameRoundInContest.results.length === 0) {
                sameRoundInContest.format = round.format;
                if (contest.state < ContestState.Approved) sameRoundInContest.date = round.date;
              }

              // Update proceed object if the updated round has it, or unset proceed if it doesn't,
              // meaning that the round became the final round due to a deletion
              if (round.proceed) sameRoundInContest.proceed = round.proceed;
              else sameRoundInContest.proceed = undefined;

              await sameRoundInContest.save();
            } else {
              // If it's a new round, add it
              sameEventInContest.rounds.push(await this.roundModel.create(round));
            }
          }
        } else {
          contest.events.push(await this.getNewContestEvent(newEvent));
        }
      }

      // Sort contest events by rank
      contest.events.sort((a, b) => a.event.rank - b.event.rank);

      return contest.events;
    } catch (err) {
      throw new InternalServerErrorException(`Error while updating contest events: ${err.message}`);
    }
  }
}
