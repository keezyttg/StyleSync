import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ONBOARDING_KEY } from '../screens/OnboardingScreen';

import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import FeedScreen from '../screens/FeedScreen';
import ClosetScreen from '../screens/ClosetScreen';
import PostScreen from '../screens/PostScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OutfitDetailScreen from '../screens/OutfitDetailScreen';
import BuildOutfitScreen from '../screens/BuildOutfitScreen';
import AddItemScreen from '../screens/AddItemScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CameraScreen from '../screens/CameraScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AvatarBuilderScreen from '../screens/AvatarBuilderScreen';
import EditItemScreen from '../screens/EditItemScreen';
import FollowListScreen from '../screens/FollowListScreen';
import GeminiHangerIcon from '../components/GeminiHangerIcon';

import { COLORS } from '../constants/theme';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'CameraTab', icon: '📷', label: 'Camera', isAction: true },
  { name: 'Closet',    icon: 'gemini', label: 'Closet' },
  { name: 'Feed',      icon: '🏠', label: 'Home' },
  { name: 'Discover',  icon: '🔍', label: 'Explore' },
  { name: 'Profile',   icon: '👤', label: 'Me' },
];

function CustomTabBar({ state, navigation }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[tabStyles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[
        tabStyles.bar,
        {
          backgroundColor: colors.card,
          shadowColor: isDark ? '#000' : '#6B21A8',
          borderColor: colors.border,
        },
      ]}>
        {TAB_CONFIG.map((tab, index) => {
          const route = state.routes[index];
          const focused = state.index === index && !tab.isAction;

          const onPress = () => {
            if (tab.isAction) {
              navigation.navigate('Camera');
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route?.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (tab.isAction) {
            return (
              <TouchableOpacity key={tab.name} style={tabStyles.tabItem} onPress={onPress} activeOpacity={0.7}>
                {tab.icon === 'gemini' ? (
                  <GeminiHangerIcon size={24} tone="solid" color={colors.textMuted} />
                ) : (
                  <Text style={[tabStyles.inactiveIcon, { color: colors.textMuted }]}>{tab.icon}</Text>
                )}
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={tab.name} style={tabStyles.tabItem} onPress={onPress} activeOpacity={0.7}>
              {focused ? (
                <View style={tabStyles.pill}>
                  {tab.icon === 'gemini' ? (
                    <GeminiHangerIcon size={20} tone="solid" color={COLORS.white} />
                  ) : (
                    <Text style={tabStyles.pillIcon}>{tab.icon}</Text>
                  )}
                </View>
              ) : (
                tab.icon === 'gemini' ? (
                  <GeminiHangerIcon size={24} tone="solid" color={colors.textMuted} />
                ) : (
                  <Text style={[tabStyles.inactiveIcon, { color: colors.textMuted }]}>{tab.icon}</Text>
                )
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="CameraTab" component={FeedScreen} />
      <Tab.Screen name="Closet"    component={ClosetScreen} />
      <Tab.Screen name="Feed"      component={FeedScreen} />
      <Tab.Screen name="Discover"  component={DiscoverScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(val => setInitialRoute(val === 'true' ? 'Main' : 'Onboarding'))
      .catch(() => setInitialRoute('Main'));
  }, []);

  if (!initialRoute) return null;

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding"      component={OnboardingScreen} />
      <Stack.Screen name="Main"            component={MainTabs} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
      <Stack.Screen name="OutfitDetail"    component={OutfitDetailScreen}    options={{ presentation: 'modal' }} />
      <Stack.Screen name="Post"            component={PostScreen}            options={{ presentation: 'modal' }} />
      <Stack.Screen name="BuildOutfit"     component={BuildOutfitScreen}     options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddItem"         component={AddItemScreen}         options={{ presentation: 'modal' }} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="Camera"          component={CameraScreen}          options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen}     options={{ presentation: 'modal' }} />
      <Stack.Screen name="UserProfile"     component={UserProfileScreen} />
      <Stack.Screen name="AvatarBuilder"   component={AvatarBuilderScreen} />
      <Stack.Screen name="EditItem"        component={EditItemScreen}        options={{ presentation: 'modal' }} />
      <Stack.Screen name="FollowList"      component={FollowListScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  safeArea: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    gap: 5,
  },
  pillIcon: { fontSize: 17 },
  inactiveIcon: { fontSize: 22 },
});
