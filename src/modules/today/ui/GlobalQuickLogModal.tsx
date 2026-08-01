import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { Pet } from '@/modules/pets/model/Pet';
import { PetPicker } from '@/modules/pets/ui/PetPicker';
import { QuickLog } from '@/modules/pet-events/ui/QuickLog';
import { Palette } from '@/shared/theme/palette';
import { ModalSheet } from '@/shared/ui/modal/ModalSheet';

type GlobalQuickLogModalProps = { visible: boolean; pets: Pet[]; onClose: () => void };

export function GlobalQuickLogModal({ visible, pets, onClose }: GlobalQuickLogModalProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [petId, setPetId] = useState(pets[0]?.id ?? '');
  const forms = usePetEventForms();
  const run = (action: (targetPetId: string) => void) => {
    if (!petId) return;
    onClose();
    action(petId);
  };
  return (
    <ModalSheet
      visible={visible}
      title="Quick log"
      testID="global-quick-log-modal"
      contentStyle={styles.content}
      onClose={onClose}
    >
      <Text style={styles.help}>Choose a pet, then what you want to record.</Text>
      <PetPicker pets={pets} selectedPetId={petId} onSelectPet={setPetId} />
      <QuickLog
        colors={colors}
        onLogSymptom={() => run(forms.openSymptom)}
        onLogDietChange={() => run(forms.openDietChange)}
        onLogOther={() => run(forms.openOtherEvent)}
      />
    </ModalSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    content: { gap: 14 },
    help: { color: colors.muted, fontSize: 13 },
  });
