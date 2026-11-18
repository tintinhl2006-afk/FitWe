import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Utensils, Dumbbell, Calendar, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';
import { Glass } from '../../constants/theme';
import { useSceneStyle } from '../../components/ui/AmbientBackground';

export default function TabsLayout() {
  const { colors, theme } = useAppTheme();
  const glass = Glass[theme];
  const scene = useSceneStyle();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: scene,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          borderRadius: 34,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: glass.edge,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          shadowColor: glass.shadow,
          shadowOpacity: theme === 'dark' ? 0.5 : 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 34, overflow: 'hidden' }]}>
            <BlurView
              intensity={60}
              tint={theme === 'dark' ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.tint }]} />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ color, size }) => <Utensils size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('nutrition', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Entrenos',
          tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('workout', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Clases',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('classes', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('profile', { screen: 'index' });
          },
        })}
      />
    </Tabs>
  );
}
