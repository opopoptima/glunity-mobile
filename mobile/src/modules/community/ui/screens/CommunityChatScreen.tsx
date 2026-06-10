import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScaffold } from '@/shared/components/AppScaffold';
import { useTheme } from '@/shared/context/theme.context';
import { useLanguage } from '@/shared/context/language.context';
import MessagingHome from './MessagingHome';
import CommunityMessaging from './CommunityMessaging';

export default function CommunityChatScreen({ navigation, route }: any) {
  const [loading, setLoading] = useState(true);
  const { theme: T } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('@joined_community');
        if (v !== 'true') {
          navigation.replace('Community');
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    })();
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.green} />
      </View>
    );
  }

  // Guard: on web React Navigation serialises the channel object → "[object Object]".
  // Only accept it when it is an actual object with an _id / id field.
  const rawChannel = route?.params?.initialChannel;
  const initialChannel =
    rawChannel && typeof rawChannel === 'object' && (rawChannel._id || rawChannel.id)
      ? rawChannel
      : null;

  const initialChannelId =
    route?.params?.channelId ||
    route?.params?.initialChannelId ||
    // last resort: if rawChannel was a valid MongoDB id string use it directly
    (typeof rawChannel === 'string' && /^[a-f\d]{24}$/i.test(rawChannel) ? rawChannel : null);

  return (
    <AppScaffold title={t('Community')} activeTab="events" contentStyle={{ backgroundColor: T.bg, paddingBottom: 0 }} showHeader={false} showBottomNav={false}>
      {/* Render flux messaging screen (home/list) or open chat when channel provided */}
      {initialChannel || initialChannelId ? (
        <CommunityMessaging initialChannel={initialChannel} initialChannelId={initialChannelId} navigation={navigation} />
      ) : (
        <MessagingHome navigation={navigation} />
      )}
    </AppScaffold>
  );
}
