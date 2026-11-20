import { toggleSelection } from '@/modules/calendar/filterSelection';

describe('calendar filter selection', () => {
  const options = ['a', 'b', 'c'] as const;

  it('turns options on and off in their order but keeps the last one on', () => {
    expect(toggleSelection(options, ['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    expect(toggleSelection(options, ['c', 'a'], 'b')).toEqual(['a', 'b', 'c']);
    expect(toggleSelection(options, ['b'], 'b')).toEqual(['b']);
  });
});
