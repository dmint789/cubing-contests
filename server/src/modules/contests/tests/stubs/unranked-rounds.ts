import { RoundFormat, RoundType } from "~/shared/enums";
import { RoundDocument } from "~/src/models/round.model";

export const unrankedRoundsStub = (): RoundDocument[] =>
  [
    {
      roundId: "333-r1",
      competitionId: "Munich19022023",
      roundTypeId: RoundType.Final,
      format: RoundFormat.Average,
      results: [
        {
          competitionId: "Munich19022023",
          eventId: "333",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [4],
          ranking: 0,
          attempts: [{ result: 1003 }, { result: 1399 }, { result: 1379 }, { result: 1404 }, { result: 1142 }],
          best: 1003,
          average: 1307,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "333",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [1],
          ranking: 0,
          attempts: [{ result: 990 }, { result: 1385 }, { result: 1189 }, { result: 1294 }, { result: 1028 }],
          best: 990,
          average: 1170,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "333",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [2],
          ranking: 0,
          attempts: [{ result: 1722 }, { result: 1733 }, { result: 1418 }, { result: 1164 }, { result: 1884 }],
          best: 1164,
          average: 1624,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "333",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [3],
          ranking: 0,
          attempts: [{ result: 1278 }, { result: 1404 }, { result: 1341 }, { result: 1307 }, { result: 1471 }],
          best: 1278,
          average: 1351,
          save() {},
        },
      ],
    },
    {
      roundId: "333fm-r1",
      competitionId: "Munich19022023",
      roundTypeId: RoundType.Final,
      format: RoundFormat.Mean,
      results: [
        // Tied mean with single tie-breaker
        {
          competitionId: "Munich19022023",
          eventId: "333fm",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [3],
          ranking: 0,
          attempts: [{ result: 39 }, { result: 43 }, { result: 47 }],
          best: 39,
          average: 43,
          save() {},
        },
        // This result is tied
        {
          competitionId: "Munich19022023",
          eventId: "333fm",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [2],
          ranking: 0,
          attempts: [{ result: 37 }, { result: 41 }, { result: 42 }],
          best: 37,
          average: 40,
          save() {},
        },
        // Tied mean with single tie-breaker
        {
          competitionId: "Munich19022023",
          eventId: "333fm",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [4],
          ranking: 0,
          attempts: [{ result: 40 }, { result: 43 }, { result: 46 }],
          best: 40,
          average: 43,
          save() {},
        },
        // This result is tied
        {
          competitionId: "Munich19022023",
          eventId: "333fm",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [1],
          ranking: 0,
          attempts: [{ result: 37 }, { result: 40 }, { result: 43 }],
          best: 37,
          average: 40,
          save() {},
        },
      ],
    },
    {
      roundId: "333bf-r1",
      competitionId: "Munich19022023",
      roundTypeId: RoundType.Final,
      format: RoundFormat.BestOf3,
      results: [
        {
          competitionId: "Munich19022023",
          eventId: "333bf",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [4],
          ranking: 0,
          attempts: [{ result: 4124 }, { result: -1 }, { result: -1 }],
          best: 4124,
          average: -1,
          save() {},
        },
        // This result is tied
        {
          competitionId: "Munich19022023",
          eventId: "333bf",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [2],
          ranking: 0,
          attempts: [{ result: 2482 }, { result: -1 }, { result: 3011 }],
          best: 2482,
          average: -1,
          save() {},
        },
        // Tied with the other triple DNF
        {
          competitionId: "Munich19022023",
          eventId: "333bf",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [6],
          ranking: 0,
          attempts: [{ result: -1 }, { result: -1 }, { result: -1 }],
          best: -1,
          average: -1,
          save() {},
        },
        // This result is tied
        {
          competitionId: "Munich19022023",
          eventId: "333bf",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [3],
          ranking: 0,
          attempts: [{ result: 2856 }, { result: 2482 }, { result: 2744 }],
          best: 2482,
          average: 2694,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "333bf",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [1],
          ranking: 0,
          attempts: [{ result: 2142 }, { result: 1938 }, { result: -1 }],
          best: 1938,
          average: -1,
          save() {},
        },
        // Tied with the other triple DNF
        {
          competitionId: "Munich19022023",
          eventId: "333bf",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [5],
          ranking: 0,
          attempts: [{ result: -1 }, { result: -1 }, { result: -1 }],
          best: -1,
          average: -1,
          save() {},
        },
      ],
    },
    {
      roundId: "222-r1",
      competitionId: "Munich19022023",
      roundTypeId: RoundType.Final,
      format: RoundFormat.BestOf3, // ATYPICAL FORMAT
      results: [
        {
          competitionId: "Munich19022023",
          eventId: "222",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [1],
          ranking: 0,
          attempts: [{ result: 221 }, { result: 428 }, { result: 374 }],
          best: 221,
          average: -1,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "222",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [2],
          ranking: 0,
          attempts: [{ result: 335 }, { result: 417 }, { result: 725 }],
          best: 335,
          average: -1,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "222",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [3],
          ranking: 0,
          attempts: [{ result: 449 }, { result: 516 }, { result: 593 }],
          best: 449,
          average: -1,
          save() {},
        },
      ],
    },
    {
      roundId: "555-r1",
      competitionId: "Munich19022023",
      roundTypeId: RoundType.Final,
      format: RoundFormat.Average,
      results: [
        {
          competitionId: "Munich19022023",
          eventId: "555",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [2],
          ranking: 0,
          attempts: [{ result: 5012 }, { result: 4913 }, { result: -1 }, { result: 5314 }, { result: -1 }],
          best: 4913,
          average: -1,
          save() {},
        },
        {
          competitionId: "Munich19022023",
          eventId: "555",
          date: new Date("2023-02-19T00:00:00Z"),
          personIds: [1],
          ranking: 0,
          attempts: [{ result: 3845 }, { result: -1 }, { result: 5011 }, { result: 4576 }, { result: -1 }],
          best: 3845,
          average: -1,
          save() {},
        },
      ],
    },
  ] as RoundDocument[];
