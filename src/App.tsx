import React, {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import RootStack from './navigation';
import {useHabitStore} from './store/useHabitStore';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {LocaleConfig} from 'react-native-calendars';
import {LOCALE_CONFIG} from './constants/common';

// 한국어 로케일 설정
LocaleConfig.locales.ko = LOCALE_CONFIG;
LocaleConfig.defaultLocale = 'ko';
dayjs.locale('ko');

function App(): React.JSX.Element {
  const loadHabits = useHabitStore(state => state.loadHabits);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 앱 시작 시 데이터 미리 로드
        await loadHabits();
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      }
    };

    initializeApp();
  }, [loadHabits]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
