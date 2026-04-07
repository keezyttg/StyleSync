import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../hooks/useAuth';
import LoginScreen from '../screens/LoginScreen';
import FeedScreen from '../screens/FeedScreen';
import ClosetScreen from '../screens/ClosetScreen';
import PostScreen from '../screens/PostScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OutfitDetailScreen from '../screens/OutfitDetailScreen';
import BuildOutfitScreen from '../screens/BuildOutfitScreen';
import AddItemScreen from '../screens/AddItemScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import CameraScreen from '../screens/CameraScreen';

import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabBarIcon({ icon, label, focused }) {
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icon}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
    </View>
  );
}

function CenterPostButton({ onPress }) {
  return (
    <TouchableOpacity style={tabStyles.centerBtn} onPress={onPress} activeOpacity={0.85}>
      <View style={tabStyles.centerBtnInner}>
        <Text style={tabStyles.centerBtnIcon}>⌂</Text>
      </View>
    </TouchableOpacity>
  );
}

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="🏠" label="Feed" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Closet"
        component={ClosetScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="👗" label="Closet" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          tabBarButton: () => (
            <CenterPostButton onPress={() => navigation.navigate('Camera')} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="🔍" label="Discover" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="👤" label="Profile" focused={focused} />,
        }}
      />
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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="OutfitDetail" component={OutfitDetailScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Post" component={PostScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="BuildOutfit" component={BuildOutfitScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddItem" component={AddItemScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    height: 80,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 16,
    paddingTop: 8,
  },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, color: COLORS.textMuted },
  iconFocused: { color: COLORS.primary },
  label: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  labelFocused: { color: COLORS.primary, fontWeight: '600' },
  centerBtn: { top: -20, justifyContent: 'center', alignItems: 'center' },
  centerBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centerBtnIcon: { fontSize: 26, color: COLORS.white },
});
