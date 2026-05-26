import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/theme.context';
import { AppHeader } from './AppHeader';
import { BottomNavBar } from './BottomNavBar';

export type AppTabKey = 'home' | 'events' | 'reels' | 'profile';

interface AppScaffoldProps {
  title: string;
  activeTab: AppTabKey;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  onPressHome?: () => void;
  onPressEvents?: () => void;
  onPressCenter?: () => void;
  onPressReels?: () => void;
  onPressProfile?: () => void;
}

export function AppScaffold({
  title,
  activeTab,
  onBack,
  rightIcon,
  onRightPress,
  rightElement,
  children,
  contentStyle,
  onPressHome,
  onPressEvents,
  onPressCenter,
  onPressReels,
  onPressProfile,
}: AppScaffoldProps) {
  const { theme: C } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <AppHeader
        title={title}
        onBack={onBack}
        rightIcon={rightIcon}
        onRightPress={onRightPress}
        rightElement={rightElement}
      />
      <View style={[styles.content, { backgroundColor: C.bg }, contentStyle]}>
        {children}
      </View>
      <BottomNavBar
        activeTab={activeTab}
        onPressHome={onPressHome}
        onPressEvents={onPressEvents}
        onPressCenter={onPressCenter}
        onPressReels={onPressReels}
        onPressProfile={onPressProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
