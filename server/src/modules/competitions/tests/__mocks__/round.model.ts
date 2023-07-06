import { RoundDocument } from '~/src/models/round.model';
import IRound from '@sh/interfaces/Round';

export const mockRoundModel = (): any => ({
  create(round: IRound): RoundDocument {
    return round as RoundDocument;
  },
});
