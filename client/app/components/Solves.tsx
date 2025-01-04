import { Event, IAttempt } from "@cc/shared";
import { getFormattedTime } from "@cc/shared";

const Solves = ({
  event,
  attempts,
  showMultiPoints = false,
}: {
  event: Event;
  attempts: IAttempt[];
  showMultiPoints?: boolean;
}) => {
  return (
    <div className="d-flex gap-2">
      {attempts.map((attempt, index) => (
        <span key={index}>{getFormattedTime(attempt.result, { event, showMultiPoints })}</span>
      ))}
    </div>
  );
};

export default Solves;
