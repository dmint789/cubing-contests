import jwtDecode from 'jwt-decode';
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { Color, EventFormat, Role, RoundFormat } from '@sh/enums';
import C from '@sh/constants';
import { getAlwaysShowDecimals, getRoundCanHaveAverage } from '@sh/sharedFunctions';
import { IAttempt, ICompetition, IEvent, IPerson, IResult } from '@sh/interfaces';
import { roundFormatOptions } from './multipleChoiceOptions';
import { MultiChoiceOption } from './interfaces/MultiChoiceOption';

export const getFormattedCoords = (comp: ICompetition): string => {
  return `${(comp.latitudeMicrodegrees / 1000000).toFixed(6)}, ${(comp.longitudeMicrodegrees / 1000000).toFixed(6)}`;
};

export const getFormattedDate = (startDate: Date | string, endDate?: Date | string): string => {
  if (!startDate) throw new Error('Start date missing!');

  if (typeof startDate === 'string') startDate = new Date(startDate);
  if (typeof endDate === 'string') endDate = new Date(endDate);

  const fullFormat = 'd MMM yyyy';

  if (!endDate || isSameDay(startDate, endDate)) {
    return format(startDate, fullFormat);
  } else {
    let startFormat: string;

    if (!isSameYear(startDate, endDate)) startFormat = fullFormat;
    else if (!isSameMonth(startDate, endDate)) startFormat = 'd MMM';
    else startFormat = 'd';

    return `${format(startDate, startFormat)} - ${format(endDate, fullFormat)}`;
  }
};

export const getFormattedTime = (
  time: number,
  {
    event,
    noFormatting = false,
    showMultiPoints = false,
  }: {
    event?: IEvent;
    noFormatting?: boolean;
    showMultiPoints?: boolean;
  } = {
    noFormatting: false,
    showMultiPoints: false,
  },
): string => {
  if (time === -1) {
    return 'DNF';
  } else if (time === -2) {
    return 'DNS';
  } else if (event?.format === EventFormat.Number) {
    // FMC singles are limited to 99 moves, so if it's more than that, it must be the mean. Format it accordingly.
    if (time >= 100 && !noFormatting) return (time / 100).toFixed(2);
    else return time.toString();
  } else {
    let centiseconds: number;
    let timeStr = time.toString();

    if (event?.format !== EventFormat.Multi) centiseconds = time;
    else centiseconds = parseInt(timeStr.slice(timeStr.length - 11, -4));

    let output = '';
    const hours = Math.floor(centiseconds / 360000);
    const minutes = Math.floor(centiseconds / 6000) % 60;
    const seconds = (centiseconds - hours * 360000 - minutes * 6000) / 100;

    if (hours > 0) {
      output = hours.toString();
      if (!noFormatting) output += ':';
    }

    if (hours > 0 || minutes > 0) {
      if (minutes === 0) output += '00';
      else if (minutes < 10 && hours > 0) output += '0' + minutes;
      else output += minutes;

      if (!noFormatting) output += ':';
    }

    if (seconds < 10 && (hours > 0 || minutes > 0)) output += '0';

    // Only times under ten minutes can have decimals (or if noFormatting = true)
    if ((hours === 0 && minutes < 10) || noFormatting || (event && getAlwaysShowDecimals(event))) {
      output += seconds.toFixed(2);
      if (noFormatting) output = Number(output.replace('.', '')).toString();
    } else {
      output += Math.floor(seconds).toFixed(0); // remove the decimals
    }

    if (event?.format !== EventFormat.Multi) {
      return output;
    } else {
      if (time < 0) timeStr = timeStr.replace('-', '');

      const points = (time < 0 ? -1 : 1) * (9999 - parseInt(timeStr.slice(0, -11)));
      const missed = parseInt(timeStr.slice(timeStr.length - 4));
      const solved = points + missed;

      if (time > 0) {
        if (noFormatting) return `${solved};${solved + missed};${output}`;
        // This includes an En space before the points part
        return `${solved}/${solved + missed} ${output}` + (showMultiPoints ? ` (${points})` : '');
      } else {
        if (noFormatting) return `${solved};${solved + missed};${output}`;
        return `DNF (${solved}/${solved + missed} ${output})`;
      }
    }
  }
};

// Returns null if the time is invalid
const getCentiseconds = (time: string, round = true): number | null => {
  let hours = 0;
  let minutes = 0;
  let centiseconds: number;

  if (time.length >= 5) {
    // Round attempts >= 10 minutes long, unless noRounding = true
    if (time.length >= 6 && round) time = time.slice(0, -2) + '00';

    if (time.length >= 7) hours = parseInt(time.slice(0, time.length - 6));
    minutes = parseInt(time.slice(Math.max(time.length - 6, 0), -4));
    centiseconds = parseInt(time.slice(-4));
  } else {
    centiseconds = parseInt(time);
  }

  if (hours >= 24) return null;
  if (minutes >= 60 || centiseconds >= 6000) return null;

  return hours * 360000 + minutes * 6000 + centiseconds;
};

// Returns null if the time is invalid (e.g. 8145); returns 0 if it's empty.
// solved and attempted are only required for the Multi event format.
export const getAttempt = (
  attempt: IAttempt,
  event: IEvent,
  time: string, // a time string without formatting (e.g. 1534 represents 15.34, 25342 represents 2:53.42)
  // These are optional if the event format is Number
  solved?: string,
  attempted?: string,
  memo?: string | undefined, // only used for events with the event group HasMemo, otherwise set to undefined
  { roundTime, roundMemo }: { roundTime: boolean; roundMemo: boolean } = {
    roundTime: false,
    roundMemo: false,
  },
): IAttempt => {
  if (time.length > 8 || memo?.length > 8) throw new Error('times longer than 8 digits are not supported');
  if (time.length > 2 && event.format === EventFormat.Number)
    throw new Error('Fewest Moves solutions longer than 2 digits are not supported');

  if (event.format === EventFormat.Number) return { ...attempt, result: time ? parseInt(time) : 0 };

  const newAttempt: IAttempt = { result: time ? getCentiseconds(time, roundTime) : 0 };
  if (memo !== undefined) {
    newAttempt.memo = getCentiseconds(memo, roundMemo);
    if (newAttempt.memo >= newAttempt.result) return { ...newAttempt, result: null };
  }

  if (event.format === EventFormat.Multi && newAttempt.result) {
    if (!solved || !attempted) return { result: null };

    const solvedNum = parseInt(solved);
    const attemptedNum = parseInt(attempted);

    if (isNaN(solvedNum) || isNaN(attemptedNum) || solvedNum > attemptedNum) return { result: null };

    // Disallow submitting multi times longer than 1:00:20 (accounts for +2s), and the opposite for old style
    if (event.eventId === '333mbf' && newAttempt.result > 362000) return { ...newAttempt, result: null };
    else if (event.eventId === '333mbo' && newAttempt.result <= 362000) return { ...newAttempt, result: null };

    // See the IResult interface for information about how this works
    let multiOutput = ''; // DDDDTTTTTTTMMMM
    const missed: number = attemptedNum - solvedNum;
    let points: number = solvedNum - missed;

    if (points <= 0) {
      if (points < 0 || solvedNum < 2) multiOutput += '-';
      points = -points;
    }

    multiOutput += 9999 - points;
    multiOutput += new Array(7 - newAttempt.result.toString().length).fill('0').join('') + newAttempt.result;
    multiOutput += new Array(4 - missed.toString().length).fill('0').join('') + missed;

    newAttempt.result = parseInt(multiOutput);
  }

  return newAttempt;
};

// Returns the best and average times
export const getBestAndAverage = (
  attempts: IAttempt[],
  roundFormat: RoundFormat,
  event: IEvent,
): { best: number; average: number } => {
  let best: number, average: number;
  let sum = 0;
  let DNFDNScount = 0;

  // This actually follows the rule that the lower the attempt value is - the better
  const convertedAttempts = attempts.map(({ result }) => {
    if (result > 0) {
      sum += result;
      return result;
    }
    DNFDNScount++;
    return Infinity;
  });

  best = Math.min(...convertedAttempts);
  if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS

  if (
    // No averages for rounds that don't support them
    !getRoundCanHaveAverage(roundFormat, event) ||
    DNFDNScount > 1 ||
    (DNFDNScount > 0 && attempts.length === 3)
  ) {
    average = -1;
  } else {
    // Subtract best and worst results, if it's an Ao5 round
    if (attempts.length === 5) {
      sum -= best;
      if (DNFDNScount === 0) sum -= Math.max(...convertedAttempts);
    }

    average = Math.round((sum / 3) * (event.format === EventFormat.Number ? 100 : 1));
  }

  return { best, average };
};

// Returns the authorized user's role with the highest privilege
export const getRole = (): Role => {
  let role: Role;
  // Decode the JWT (only take the part after "Bearer ")
  const authorizedUser: any = jwtDecode(localStorage.getItem('jwtToken').split(' ')[1]);

  if (authorizedUser.roles.includes(Role.Admin)) role = Role.Admin;
  else if (authorizedUser.roles.includes(Role.Moderator)) role = Role.Moderator;

  return role;
};

// Checks if there are any errors, and if not, calls the callback function,
// passing it the result with the best single and average set
export const checkErrorsBeforeSubmit = (
  result: IResult,
  roundFormat: RoundFormat,
  event: IEvent,
  persons: IPerson[],
  setErrorMessages: (val: string[]) => void,
  setSuccessMessage: (val: string) => void,
  callback: (result: IResult) => void,
  requireRealResult = false,
) => {
  const errorMessages: string[] = [];

  if (persons.includes(null)) {
    errorMessages.push('Invalid person(s)');
  } else if (persons.some((p1, i1) => persons.some((p2, i2) => i1 !== i2 && p1.personId === p2.personId))) {
    errorMessages.push('You cannot enter the same person twice');
  }

  let realResultExists = false; // real meaning not DNF or DNS

  for (let i = 0; i < result.attempts.length; i++) {
    if (result.attempts[i].result === null || result.attempts[i].memo === null)
      errorMessages.push(`Attempt ${i + 1} is invalid`);
    else if (result.attempts[i].result === 0) errorMessages.push(`Please enter attempt ${i + 1}`);
    else if (result.attempts[i].result > 0) realResultExists = true;
  }

  if (requireRealResult && !realResultExists) errorMessages.push('You cannot submit only DNF/DNS results');

  if (errorMessages.length > 0) {
    setErrorMessages(errorMessages);
  } else {
    setErrorMessages([]);
    setSuccessMessage('');

    const { best, average } = getBestAndAverage(result.attempts, roundFormat, event);
    result.best = best;
    result.average = average;

    callback(result);
  }
};

export const limitRequests = (
  fetchTimer: NodeJS.Timeout,
  setFetchTimer: (val: NodeJS.Timeout) => void,
  callback: () => void,
) => {
  if (fetchTimer !== null) clearTimeout(fetchTimer);

  setFetchTimer(
    setTimeout(async () => {
      await callback();

      // Resetting this AFTER the callback, so that the fetch request can complete first
      setFetchTimer(null);
    }, C.fetchThrottleTimeout),
  );
};

// Disallows Mo3 format for events that have Ao5 as the default format, and vice versa for all other events
export const getAllowedRoundFormats = (event: IEvent, excludeBo3 = false): MultiChoiceOption[] => {
  let output: MultiChoiceOption[] = roundFormatOptions;

  if (event.defaultRoundFormat === RoundFormat.Average) {
    output = output.filter((el) => el.value !== RoundFormat.Mean);
  } else {
    if (excludeBo3) output = output.filter((el) => el.value !== RoundFormat.BestOf3);

    output = output.filter((el) => el.value !== RoundFormat.Average);
  }

  return output;
};

export const getBGClassFromColor = (color: Color): string => {
  // THE MAGENTA OPTION IS SKIPPED FOR NOW
  switch (color) {
    case Color.Red: {
      return 'bg-danger';
    }
    case Color.Blue: {
      return 'bg-primary';
    }
    case Color.Green: {
      return 'bg-success';
    }
    case Color.Yellow: {
      return 'bg-warning';
    }
    case Color.White: {
      return 'bg-light';
    }
    case Color.Cyan: {
      return 'bg-info';
    }
    default: {
      console.error(`Unknown color: ${color}`);
      return 'bg-dark';
    }
  }
};
