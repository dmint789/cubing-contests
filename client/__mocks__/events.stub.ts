import { Event } from "@cc/shared";
import { EventFormat, EventGroup, RoundFormat } from "@cc/shared";

// COPIED FROM THE EVENTS SEED IN THE SERVER SEEDS DIRECTORY
export const eventsStub = (): Event[] => [
  ///////////////////////////////////////////////////////////////////
  // WCA
  ///////////////////////////////////////////////////////////////////
  {
    eventId: "333",
    name: "3x3x3 Cube",
    rank: 10,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "222",
    name: "2x2x2 Cube",
    rank: 20,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "444",
    name: "4x4x4 Cube",
    rank: 30,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "555",
    name: "5x5x5 Cube",
    rank: 40,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "666",
    name: "6x6x6 Cube",
    rank: 50,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Mean,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "777",
    name: "7x7x7 Cube",
    rank: 60,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Mean,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "333bf",
    name: "3x3x3 Blindfolded",
    rank: 70,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf3,
    groups: [EventGroup.WCA, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "333fm",
    name: "3x3x3 Fewest Moves",
    rank: 80,
    format: EventFormat.Number,
    defaultRoundFormat: RoundFormat.Mean,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "333oh",
    name: "3x3x3 One-Handed",
    rank: 90,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "clock",
    name: "Clock",
    rank: 110,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "minx",
    name: "Megaminx",
    rank: 120,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "pyram",
    name: "Pyraminx",
    rank: 130,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "skewb",
    name: "Skewb",
    rank: 140,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "sq1",
    name: "Square-1",
    rank: 150,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.WCA],
    participants: 1,
  },
  {
    eventId: "444bf",
    name: "4x4x4 Blindfolded",
    rank: 160,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf3,
    groups: [EventGroup.WCA, EventGroup.SubmissionsAllowed, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "555bf",
    name: "5x5x5 Blindfolded",
    rank: 170,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf3,
    groups: [EventGroup.WCA, EventGroup.SubmissionsAllowed, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "333mbf",
    name: "3x3x3 Multi-Blind",
    rank: 180,
    format: EventFormat.Multi,
    defaultRoundFormat: RoundFormat.BestOf1,
    groups: [EventGroup.WCA, EventGroup.SubmissionsAllowed, EventGroup.HasMemo],
    participants: 1,
  },
  ///////////////////////////////////////////////////////////////////
  // Unofficial
  ///////////////////////////////////////////////////////////////////
  {
    eventId: "fto",
    name: "Face-Turning Octahedron",
    rank: 1010,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Unofficial],
    participants: 1,
  },
  {
    eventId: "333_team_bld",
    name: "3x3x3 Team-Blind",
    rank: 1020,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Unofficial],
    participants: 2,
  },
  {
    eventId: "333_mirror_blocks",
    name: "Mirror Blocks",
    rank: 1030,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Unofficial],
    participants: 1,
  },
  {
    eventId: "magic",
    name: "Magic",
    rank: 1040,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Unofficial, EventGroup.RemovedWCA],
    participants: 1,
  },
  {
    eventId: "mmagic",
    name: "Master Magic",
    rank: 1050,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Unofficial, EventGroup.RemovedWCA],
    participants: 1,
  },
  {
    eventId: "333ft",
    name: "3x3x3 With Feet",
    rank: 1060,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Unofficial, EventGroup.RemovedWCA],
    participants: 1,
  },
  ///////////////////////////////////////////////////////////////////
  // Extreme BLD
  ///////////////////////////////////////////////////////////////////
  {
    eventId: "333mbo",
    name: "3x3x3 Multi-Blind Old Style",
    rank: 2010,
    format: EventFormat.Multi,
    defaultRoundFormat: RoundFormat.BestOf1,
    groups: [EventGroup.ExtremeBLD, EventGroup.RemovedWCA, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "666bf",
    name: "6x6x6 Blindfolded",
    rank: 2100,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf1,
    groups: [EventGroup.ExtremeBLD, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "777bf",
    name: "7x7x7 Blindfolded",
    rank: 2110,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf1,
    groups: [EventGroup.ExtremeBLD, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "888bf",
    name: "8x8x8 Blindfolded",
    rank: 2120,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf1,
    groups: [EventGroup.ExtremeBLD, EventGroup.HasMemo],
    participants: 1,
  },
  {
    eventId: "999bf",
    name: "9x9x9 Blindfolded",
    rank: 2130,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.BestOf1,
    groups: [EventGroup.ExtremeBLD, EventGroup.HasMemo],
    participants: 1,
  },
  ///////////////////////////////////////////////////////////////////
  // Miscellaneous
  ///////////////////////////////////////////////////////////////////
  {
    eventId: "234relay",
    name: "2x2x2-4x4x4 Relay",
    rank: 3010,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Miscellaneous],
    participants: 1,
  },
  {
    eventId: "gigaminx",
    name: "Gigaminx",
    rank: 3020,
    format: EventFormat.Time,
    defaultRoundFormat: RoundFormat.Average,
    groups: [EventGroup.Miscellaneous],
    participants: 1,
  },
];
