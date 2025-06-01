import {NavigationContainer} from '@react-navigation/native';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import React from 'react';
import {LocaleConfig} from 'react-native-calendars';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LOCALE_CONFIG} from './constants/common';
import RootStack from './navigation';

// 한국어 로케일 설정
LocaleConfig.locales.ko = LOCALE_CONFIG;
LocaleConfig.defaultLocale = 'ko';
dayjs.locale('ko');

function App(): React.JSX.Element {
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
