import { SectionAction } from '@/shared/ui/SectionHeader';

/** The calendar's "+ Schedule" action, the same wherever the Calendar tab shows it. */
export function scheduleAction(onPress: () => void): SectionAction {
  return {
    label: 'Schedule',
    accessibilityLabel: 'Schedule calendar event',
    icon: 'add',
    onPress,
  };
}
