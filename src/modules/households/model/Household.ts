/** The household the signed-in user belongs to; it owns the pets they share. */
export type Household = {
  id: string;
  /** What members call their household, shown in labels. */
  alias: string;
};
