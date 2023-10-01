import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';
import { getBSClassFromColor } from '~/helpers/utilityFunctions';
import { ContestType } from '~/shared_helpers/enums';

const ContestTypeBadge = ({ type }: { type: ContestType }) => {
  const contestType = contestTypeOptions.find((el) => el.value === type);

  return (
    <div className={`badge bg-${getBSClassFromColor(contestType.color)}`} style={{ padding: '0.4rem 0.5rem' }}>
      {contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
