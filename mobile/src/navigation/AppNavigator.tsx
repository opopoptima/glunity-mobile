import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../modules/auth/navigation/types';

import HomeScreen        from '../modules/home/ui/screens/HomeScreen';
import { homeScreenMockProps } from '../modules/home/state/homeData';
import ProfileScreen     from '../modules/profile/ui/screens/ProfileScreen';
import SettingsScreen    from '../modules/profile/ui/screens/SettingsScreen';
import EditProfileScreen from '../modules/profile/ui/screens/EditProfileScreen';
import MapScreen         from '../modules/map/ui/screens/MapScreen';
import { useAuth }       from '../modules/auth/state/auth.context';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  const { user } = useAuth();
  const displayName = (user as any)?.fullName || (user as any)?.name || 'Guest';
  const avatarUri   = (user as any)?.avatar?.url || (user as any)?.avatarUrl || null;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            {...homeScreenMockProps}
            quickAccessItems={homeScreenMockProps.quickAccessItems.map(item =>
              item.id === 'map' ? { ...item, onPress: () => navigation.navigate('Map') } : item
            )}
            onPressProfilePhoto={() => navigation.navigate('Profile')}
            onPressNavHome={() => navigation.navigate('Home')}
            onPressNavEvents={() => navigation.navigate('Map')}
            onPressNavProfile={() => navigation.navigate('Profile')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Map">
        {({ navigation }) => (
          <MapScreen
            userName={displayName}
            userAvatarUri={avatarUri}
            onPressProfilePhoto={() => navigation.navigate('Profile')}
            onPressNavHome={() => navigation.navigate('Home')}
            onPressNavEvents={() => navigation.navigate('Map')}
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
