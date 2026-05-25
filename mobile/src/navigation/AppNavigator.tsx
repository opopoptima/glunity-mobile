import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../modules/auth/navigation/types';

import HomeScreen        from '../modules/home/ui/screens/HomeScreen';
import RecipesScreen     from '../modules/recipes/ui/screens/RecipesScreen';
import RecipeDetailScreen from '../modules/recipes/ui/screens/RecipeDetailScreen';
import ProfileScreen     from '../modules/profile/ui/screens/ProfileScreen';
import SettingsScreen    from '../modules/profile/ui/screens/SettingsScreen';
import EditProfileScreen from '../modules/profile/ui/screens/EditProfileScreen';
import SellerProfileScreen from '../modules/seller/ui/screens/SellerProfileScreen';
import AddProductScreen   from '../modules/seller/ui/screens/AddProductScreen';
import SellerStatsScreen  from '../modules/seller/ui/screens/SellerStatsScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="Recipes"     component={RecipesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Profile"     component={ProfileScreen}     options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Settings"    component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <Stack.Screen name="AddProduct"    component={AddProductScreen} />
      <Stack.Screen name="SellerStats"   component={SellerStatsScreen} />
    </Stack.Navigator>
  );
}
