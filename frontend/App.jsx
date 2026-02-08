import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import "./global.css";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaView>
      <View className="bg-gray-900 h-full">
        <Text>Welcome to react native</Text>
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}
