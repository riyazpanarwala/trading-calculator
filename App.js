import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import CalculatorScreen from "./src/components/CalculatorScreen";

export default function App() {
  return (
    <SafeAreaProvider edges={['top', 'bottom']}>
      <SafeAreaView style={{ flex: 1 }}>
        <CalculatorScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
