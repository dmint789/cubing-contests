import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';

const FormRadio = ({
  title,
  id,
  options,
  selected,
  setSelected,
  disabled = false,
  oneLine = false,
}: {
  title: string;
  id?: string;
  options: MultiChoiceOption[];
  selected: unknown;
  setSelected: (val: unknown) => void;
  disabled?: boolean;
  oneLine?: boolean;
}) => {
  return (
    <div className={oneLine ? 'd-flex align-items-center gap-5' : ''}>
      <h5 className={oneLine ? 'm-0' : ''}>{title}</h5>

      <div className="my-3 d-flex gap-5">
        {options.map((option) => {
          const uniqueId = `radio_${id || title}_${option.value}`;

          return (
            <div key={uniqueId} className="form-check">
              <input
                id={uniqueId}
                type="radio"
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
                disabled={disabled || option.disabled}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor={uniqueId}>
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormRadio;
