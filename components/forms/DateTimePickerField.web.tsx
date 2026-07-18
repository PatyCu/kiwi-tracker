import { Ionicons } from '@expo/vector-icons';
import { ChangeEvent, CSSProperties, MouseEvent, useMemo } from 'react';

import { Palette, darkColors } from '@/lib/theme';

type DateTimePickerFieldMode = 'date' | 'time';

type DateTimePickerFieldProps = {
  accessibilityLabel: string;
  value: string;
  mode: DateTimePickerFieldMode;
  colors: Palette;
  isInvalid?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  maximumDate?: Date;
  onChange: (value: string) => void;
};

export function DateTimePickerField({
  accessibilityLabel,
  value,
  mode,
  colors,
  isInvalid = false,
  disabled = false,
  maximumDate,
  onChange,
}: DateTimePickerFieldProps) {
  const style = useMemo(
    () => makeInputStyle(colors, isInvalid, disabled),
    [colors, disabled, isInvalid],
  );
  const webValue = mode === 'date' ? toWebDate(value) : value;
  const maximumValue = maximumDate ? toWebDate(toDisplayedDate(maximumDate)) : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value;
    onChange(mode === 'date' ? fromWebDate(nextValue) : nextValue);
  };

  const openPicker = (event: MouseEvent<HTMLInputElement>) => {
    try {
      event.currentTarget.showPicker();
    } catch {
      // The input remains keyboard-editable when a browser does not support showPicker().
    }
  };

  return (
    <div style={containerStyle}>
      <style>{webPickerIndicatorStyles}</style>
      <input
        aria-invalid={isInvalid}
        aria-label={accessibilityLabel}
        aria-valuetext={value || `No ${mode} selected`}
        className="kiwi-date-time-picker-input"
        disabled={disabled}
        max={maximumValue}
        onChange={handleChange}
        onClick={openPicker}
        style={style}
        type={mode}
        value={webValue}
      />
      <Ionicons
        name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
        size={19}
        color={colors.muted}
        style={iconStyle}
      />
    </div>
  );
}

const webPickerIndicatorStyles = `
  .kiwi-date-time-picker-input::-webkit-calendar-picker-indicator {
    position: absolute;
    inset: 0;
    width: auto;
    height: auto;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
`;

const containerStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
};

const iconStyle = {
  position: 'absolute',
  top: '50%',
  right: 14,
  transform: [{ translateY: -9.5 }],
  pointerEvents: 'none',
} as const;

function toWebDate(value: string): string {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return '';
  const [day, month, year] = value.split('-');
  return `${year}-${month}-${day}`;
}

function fromWebDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function toDisplayedDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${value.getFullYear()}`;
}

function makeInputStyle(colors: Palette, isInvalid: boolean, disabled: boolean): CSSProperties {
  return {
    width: '100%',
    minWidth: 0,
    minHeight: 50,
    boxSizing: 'border-box',
    backgroundColor: colors.surface2,
    border: `1px solid ${isInvalid ? colors.coral : colors.line}`,
    borderRadius: 14,
    padding: '14px 42px 14px 14px',
    color: colors.text,
    colorScheme: colors.bg === darkColors.bg ? 'dark' : 'light',
    fontFamily: 'inherit',
    fontSize: 14,
    opacity: disabled ? 0.5 : 1,
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
