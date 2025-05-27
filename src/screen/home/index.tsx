import useNavigate from '@hooks/logic/useNavigate';
import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const HomeScreen = () => {
  const navigate = useNavigate();
  return (
    <SafeAreaView>
      <Text>HomeScreen</Text>

      <TouchableOpacity onPress={() => navigate.push('createRoutineScreen')}>
        <Text>createRoutineScreen</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;
