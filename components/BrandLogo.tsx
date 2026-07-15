import { StyleSheet, View } from 'react-native';

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 52 }: BrandLogoProps) {
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <View style={styles.rind}>
        <View style={styles.flesh}>
          <View style={styles.core} />
          <View style={[styles.toe, styles.firstToe]} />
          <View style={[styles.toe, styles.secondToe]} />
          <View style={[styles.toe, styles.thirdToe]} />
          <View style={[styles.toe, styles.fourthToe]} />
          <View style={styles.pad} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  rind: {
    width: '94%',
    height: '94%',
    backgroundColor: '#433827',
    borderRadius: 999,
    overflow: 'hidden',
  },
  flesh: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    top: '7%',
    bottom: '7%',
    backgroundColor: '#A8CE4B',
    borderRadius: 999,
    alignItems: 'center',
  },
  core: {
    position: 'absolute',
    top: '19%',
    width: '38%',
    height: '62%',
    backgroundColor: '#DDF08A',
    borderRadius: 999,
  },
  toe: {
    position: 'absolute',
    width: '10%',
    height: '14%',
    borderRadius: 99,
    backgroundColor: '#172018',
  },
  firstToe: { left: '27%', top: '30%', transform: [{ rotate: '-28deg' }] },
  secondToe: { left: '40%', top: '22%', transform: [{ rotate: '-8deg' }] },
  thirdToe: { right: '40%', top: '22%', transform: [{ rotate: '8deg' }] },
  fourthToe: { right: '27%', top: '30%', transform: [{ rotate: '28deg' }] },
  pad: {
    position: 'absolute',
    top: '49%',
    width: '30%',
    height: '25%',
    borderRadius: 99,
    backgroundColor: '#172018',
  },
});
