import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ForumDetailScreen } from '../screens/ForumDetailScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { SavedTopicsScreen } from '../screens/SavedTopicsScreen';
import { UserTopicsScreen } from '../screens/UserTopicsScreen';
import { useAuth } from '../auth/AuthContext';
import { EVColors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={EVColors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="ForumDetail"
              component={ForumDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Messages"
              component={MessagesScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SavedTopics"
              component={SavedTopicsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="UserTopics"
              component={UserTopicsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EVColors.background,
  },
});
