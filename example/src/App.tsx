import { useState, type ComponentType } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import {
  FittedImageHeaderScreen,
  ImageHeaderScreen,
  Launcher,
  PlainHeaderScreen,
  SoloImageHeaderScreen,
  type HeaderScreenProps,
  type HeroVariant,
} from './screens';

/** One screen per variant, so the router has no switch to keep in step. */
const SCREENS: Record<HeroVariant, ComponentType<HeaderScreenProps>> = {
  image: ImageHeaderScreen,
  fitted: FittedImageHeaderScreen,
  solo: SoloImageHeaderScreen,
  plain: PlainHeaderScreen,
};

export default function App() {
  // `null` is the launcher. A tiny router is enough here — the package brings
  // no navigation dependency of its own.
  const [variant, setVariant] = useState<HeroVariant | null>(null);
  const Screen = variant ? SCREENS[variant] : null;

  return (
    <SafeAreaView style={styles.flex}>
      {Screen ? (
        <Screen onBack={() => setVariant(null)} />
      ) : (
        <Launcher onPick={setVariant} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f4f5f7' },
});
