export const SYMPTOM_KINDS = [
  'Vomiting',
  'Diarrhea',
  'Asthma',
  'Hairball',
  'Nausea',
  'Loss of appetite',
  'Other',
] as const;

export const DIET_ITEM_TYPES = ['dry-food', 'wet-food', 'snack', 'supplement', 'other'] as const;

export type SymptomKind = (typeof SYMPTOM_KINDS)[number];
export type DietItemType = (typeof DIET_ITEM_TYPES)[number];

export type PetEventBase = {
  id: string;
  petId: string;
  occurredAt: string;
  recordedAt: string;
  note?: string;
};

export type SymptomEvent = PetEventBase & {
  type: 'symptom';
  symptom: SymptomKind;
};

export type DietItemSnapshot = {
  id: string;
  productName: string;
  foodType: DietItemType;
};

export type DietItemInput = Omit<DietItemSnapshot, 'id'>;

export type DietChange =
  | { type: 'replace'; previousItem: DietItemSnapshot; nextItem: DietItemSnapshot }
  | { type: 'add'; item: DietItemSnapshot }
  | { type: 'remove'; item: DietItemSnapshot };

export type DietChangeInput =
  | { type: 'replace'; previousItem: DietItemSnapshot; nextItem: DietItemInput }
  | { type: 'add'; item: DietItemInput }
  | { type: 'remove'; item: DietItemSnapshot };

export type DietChangeEvent = PetEventBase & {
  type: 'diet-change';
  change: DietChange;
};

export type OtherEvent = PetEventBase & {
  type: 'other';
  title: string;
};

export type PetEvent = SymptomEvent | DietChangeEvent | OtherEvent;
