import { compareAvgs, compareSingles, getAlwaysShowDecimals, getDefaultAverageAttempts } from '@sh/sharedFunctions';
import { ResultDocument } from '../models/result.model';
import { EventFormat } from '@sh/enums';
import { IEvent, IResult } from '@sh/interfaces';

export const setRankings = async (
  results: ResultDocument[],
  {
    ranksWithAverage,
    dontSortOrSave,
    noTieBreakerForAvgs,
  }: { ranksWithAverage?: boolean; dontSortOrSave?: boolean; noTieBreakerForAvgs?: boolean },
): Promise<ResultDocument[]> => {
  if (results.length === 0) return results;

  let sortedResults: ResultDocument[];

  if (dontSortOrSave) {
    sortedResults = results;
  } else if (ranksWithAverage) {
    sortedResults = results.sort((a, b) => compareAvgs(a, b, noTieBreakerForAvgs));
  } else {
    sortedResults = results.sort(compareSingles);
  }

  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((ranksWithAverage && compareAvgs(prevResult, sortedResults[i], noTieBreakerForAvgs) < 0) ||
        (!ranksWithAverage && compareSingles(prevResult, sortedResults[i]) < 0))
    ) {
      ranking = i + 1;
    }

    sortedResults[i].ranking = ranking;
    prevResult = sortedResults[i];
    if (!dontSortOrSave) await sortedResults[i].save(); // update the result in the DB
  }

  return sortedResults;
};

export const fixTimesOverTenMinutes = (result: IResult, event: IEvent) => {
  if (event.format === EventFormat.Time && !getAlwaysShowDecimals(event)) {
    if (result.best > 60000) result.best -= result.best % 100;

    result.attempts = result.attempts.map((att) =>
      att.result > 60000 ? { ...att, result: att.result - (att.result % 100) } : att,
    );
  }
};

export const getBaseSinglesFilter = (
  event: IEvent,
  {
    best,
    unapproved,
  }: {
    best: any;
    unapproved?: any;
  } = {
    best: { $gt: 0 },
    unapproved: { $exists: false },
  },
) => {
  const output: any = { eventId: event.eventId, best };
  if (unapproved !== undefined) output.unapproved = unapproved;
  return output;
};

export const getBaseAvgsFilter = (
  event: IEvent,
  {
    average,
    unapproved,
  }: {
    average: any;
    unapproved?: any;
  } = {
    average: { $gt: 0 },
    unapproved: { $exists: false },
  },
) => {
  const output: any = { eventId: event.eventId, average, attempts: { $size: getDefaultAverageAttempts(event) } };
  if (unapproved !== undefined) output.unapproved = unapproved;
  return output;
};
