import HomeScreen from '@/screen/home';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import React from 'react';
import {TRootStackParamList} from './types';
import CreateRoutineScreen from '@/screen/createRoutine';

const Stack = createStackNavigator<TRootStackParamList>();

const RootStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={'homeScreen'}
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: '#fff',
        },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen name={'homeScreen'} component={HomeScreen} />
      <Stack.Screen
        name={'createRoutineScreen'}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          animation: 'slide_from_bottom',
        }}
        component={CreateRoutineScreen}
      />
    </Stack.Navigator>
  );
};

export default RootStack;
