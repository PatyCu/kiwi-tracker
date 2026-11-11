export type LoadStatus = 'loading' | 'ready' | 'error';

/** The status of data that needs several loads: an error wins, then loading, else ready. */
export function combineLoadStatus(...statuses: LoadStatus[]): LoadStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('loading')) return 'loading';
  return 'ready';
}
