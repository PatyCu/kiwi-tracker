import { fireEvent, render } from '@testing-library/react-native';

import { QuickLog } from '@/modules/pet-events/ui/QuickLog';
import { darkColors } from '@/shared/theme/palette';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

describe('QuickLog', () => {
  it('routes symptom and diet quick-log actions to their own flows', () => {
    const onLogSymptom = jest.fn();
    const onLogDietChange = jest.fn();
    const onLogOther = jest.fn();
    const screen = render(
      <QuickLog
        colors={darkColors}
        onLogSymptom={onLogSymptom}
        onLogDietChange={onLogDietChange}
        onLogOther={onLogOther}
      />,
    );

    fireEvent.press(screen.getByText('Symptom'));
    fireEvent.press(screen.getByText('Diet change'));
    fireEvent.press(screen.getByText('Other'));

    expect(onLogSymptom).toHaveBeenCalledTimes(1);
    expect(onLogDietChange).toHaveBeenCalledTimes(1);
    expect(onLogOther).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual([
      'Add diet change to timeline',
      'Add environment to timeline',
      'Add symptom to timeline',
      'Add treatment to timeline',
      'Add other to timeline',
    ]);
    expect(screen.getByLabelText('Add environment to timeline').props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(screen.getByLabelText('Add treatment to timeline').props.accessibilityState).toEqual({
      disabled: true,
    });
  });
});
