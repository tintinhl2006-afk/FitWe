import { Stack } from 'expo-router';
import { useSceneStyle } from '../../components/ui/AmbientBackground';

export default function AuthLayout() {
  const scene = useSceneStyle();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: scene,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
