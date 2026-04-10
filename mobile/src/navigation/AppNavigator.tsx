import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../modules/auth/navigation/types';

import HomeScreen        from '../modules/home/ui/screens/HomeScreen';
import { homeScreenMockProps } from '../modules/home/state/homeData';
import ProfileScreen     from '../modules/profile/ui/screens/ProfileScreen';
import SettingsScreen    from '../modules/profile/ui/screens/SettingsScreen';
import EditProfileScreen from '../modules/profile/ui/screens/EditProfileScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            {...homeScreenMockProps}
            onPressProfilePhoto={() => navigation.navigate('Profile')}
            onPressNavHome={() => navigation.navigate('Home')}
            onPressNavProfile={() => navigation.navigate('Profile')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Profile"     component={ProfileScreen}     options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Settings"    component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
