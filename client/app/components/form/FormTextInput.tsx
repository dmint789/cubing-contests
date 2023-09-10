import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const FormTextInput = ({
  title,
  id,
  value,
  placeholder = '',
  setValue,
  onFocus,
  onBlur,
  onKeyDown,
  autoFocus = false,
  required = false,
  disabled = false,
  submitOnEnter = false,
  password = false,
  monospace = false,
  invalid = false,
}: {
  title?: string;
  id?: string;
  placeholder?: string;
  value: string;
  setValue?: (val: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: any) => void;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  password?: boolean;
  monospace?: boolean;
  submitOnEnter?: boolean;
  invalid?: boolean;
}) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormTextInput!');

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = id || title;

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !submitOnEnter) e.preventDefault();

    if (onKeyDown) onKeyDown(e);
  };

  const handleFocus = (e: any) => {
    // Prevent the whole input from being highlighted
    e.target.selectionStart = e.target.selectionEnd;
    if (onFocus) onFocus();
  };

  return (
    <div className="mb-3 fs-5">
      {title && (
        <label htmlFor={inputId} className="form-label">
          {title}
        </label>
      )}
      <div className="d-flex justify-content-between align-items-center gap-3">
        <input
          type={hidePassword ? 'password' : 'text'}
          id={inputId}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          readOnly={!setValue}
          onChange={setValue ? (e: any) => setValue(e.target.value) : undefined}
          onKeyDown={handleKeyDown}
          onFocus={(e: any) => handleFocus(e)}
          onBlur={onBlur}
          className={'form-control flex-grow-1' + (monospace ? ' font-monospace' : '') + (invalid ? ' is-invalid' : '')}
        />
        {password && (
          <button
            type="button"
            className="px-2 pt-0 pb-1 btn btn-primary fs-5"
            onClick={() => setHidePassword(!hidePassword)}
          >
            {hidePassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormTextInput;
