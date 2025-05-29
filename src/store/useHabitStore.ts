import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {IDayProgress, IHabit} from '@/types/habit';
import dayjs from 'dayjs';
import {STORAGE_KEYS} from '@/constants/common';

interface IHabitStore {
  habits: IHabit[];
  loading: boolean;
  // Actions
  loadHabits: () => Promise<void>;
  addHabit: (
    habit: Omit<IHabit, 'id' | 'createdAt' | 'completedDates'>,
  ) => Promise<void>;
  updateHabit: (
    habitId: string,
    updates: Partial<Omit<IHabit, 'id' | 'createdAt' | 'completedDates'>>,
  ) => Promise<void>;
  toggleHabitCompletion: (
    habitId: string,
    date: string,
    count?: number,
  ) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  getHabitsForDate: (date: string) => IHabit[];
  getDayProgress: (date: string) => IDayProgress;
  getHabitStreak: (habitId: string) => number;
  getMonthlyProgress: (
    year: number,
    month: number,
  ) => {[date: string]: IDayProgress};
  clearAllHabits: () => Promise<void>;
}

const HABITS_STORAGE_KEY = STORAGE_KEYS.HABITS;

export const useHabitStore = create<IHabitStore>((set, get) => ({
  habits: [],
  loading: false,
  loadHabits: async () => {
    console.log('📥 습관 로드 시작...');
    set({loading: true});

    try {
      const storedHabits = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      console.log('📦 저장된 데이터:', storedHabits);

      if (storedHabits) {
        const parsedHabits = JSON.parse(storedHabits).map((habit: any) => ({
          ...habit,
          createdAt: dayjs(habit.createdAt).toDate(),
        }));
        console.log('✅ 로드된 습관들:', parsedHabits);

        set({habits: parsedHabits});
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log('📪 저장된 습관이 없습니다');
        set({habits: []});
      }
    } catch (error) {
      console.error('❌ 습관 로드 실패:', error);
      set({habits: []});
    } finally {
      set({loading: false});
      console.log('🏁 습관 로드 완료');
    }
  },

  addHabit: async habitData => {
    console.log('➕ 새 습관 추가:', habitData);
    const {habits} = get();
    const newHabit: IHabit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: dayjs().toDate(),
      completedDates: [],
    };

    console.log('🆕 생성된 습관:', newHabit);
    const updatedHabits = [...habits, newHabit];

    set({habits: updatedHabits});

    try {
      const dataToStore = JSON.stringify(updatedHabits);
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, dataToStore);
      console.log('✅ 습관 저장 성공');
    } catch (error) {
      console.error('❌ 습관 저장 실패:', error);
      set({habits});
      throw error;
    }
  },

  updateHabit: async (habitId, updates) => {
    console.log('✏️ 습관 수정:', habitId, updates);
    const {habits} = get();

    const updatedHabits = habits.map(habit =>
      habit.id === habitId ? {...habit, ...updates} : habit,
    );

    set({habits: updatedHabits});

    try {
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(updatedHabits),
      );
      console.log('✅ 습관 수정 저장 성공');
    } catch (error) {
      console.error('❌ 습관 수정 실패:', error);
      set({habits});
      throw error;
    }
  },

  toggleHabitCompletion: async (
    habitId: string,
    date: string,
    count?: number,
  ) => {
    console.log('🔄 습관 완료 토글 시작:', {habitId, date, count});
    const {habits} = get();

    const targetHabit = habits.find(habit => habit.id === habitId);
    if (!targetHabit) {
      console.error('❌ 습관을 찾을 수 없음:', habitId);
      return;
    }

    console.log('🎯 대상 습관:', targetHabit);
    console.log('📅 현재 완료된 날짜들:', targetHabit.completedDates);

    const isCompleted = targetHabit.completedDates.includes(date);
    console.log('✅ 현재 완료 상태:', isCompleted);

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completedDates = isCompleted
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date];

        console.log('🆙 업데이트된 완료 날짜들:', completedDates);

        return {
          ...habit,
          completedDates,
        };
      }
      return habit;
    });

    // 즉시 상태 업데이트 (UI 반영)
    set({habits: updatedHabits});
    console.log('🔄 상태 즉시 업데이트 완료');

    // 백그라운드에서 AsyncStorage 저장
    try {
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(updatedHabits),
      );
      console.log('✅ 습관 업데이트 저장 성공');
    } catch (error) {
      console.error('❌ 습관 업데이트 실패:', error);
      // 저장 실패 시 이전 상태로 되돌리기
      set({habits});
      throw error;
    }
  },

  deleteHabit: async (habitId: string) => {
    console.log('🗑️ 습관 삭제:', habitId);
    const {habits} = get();
    const updatedHabits = habits.filter(habit => habit.id !== habitId);

    set({habits: updatedHabits});

    try {
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(updatedHabits),
      );
      console.log('✅ 습관 삭제 성공');
    } catch (error) {
      console.error('❌ 습관 삭제 실패:', error);
      set({habits});
      throw error;
    }
  },

  getHabitsForDate: (date: string) => {
    const {habits} = get();
    const dayOfWeek = dayjs(date).day();
    const dayOfMonth = dayjs(date).date();
    const dateString = dayjs(date).format('YYYY-MM-DD');

    console.log('📋 날짜별 습관 조회:', {
      date,
      dayOfWeek,
      dayOfMonth,
      totalHabits: habits.length,
    });

    const filteredHabits = habits.filter(habit => {
      switch (habit.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          return habit.customDays?.includes(dayOfWeek) || false;
        case 'monthly':
          return habit.monthlyDays?.includes(dayOfMonth) || false;
        case 'custom':
          return habit.customDates?.includes(dateString) || false;
        default:
          return false;
      }
    });

    console.log('📌 필터링 결과:', filteredHabits.length);
    return filteredHabits;
  },

  getDayProgress: (date: string) => {
    const {getHabitsForDate} = get();
    const dayHabits = getHabitsForDate(date);
    const completedHabits = dayHabits.filter(habit =>
      habit.completedDates.includes(date),
    );

    const progress = {
      date,
      totalHabits: dayHabits.length,
      completedHabits: completedHabits.length,
      habits: dayHabits.map(habit => ({
        habitId: habit.id,
        completed: habit.completedDates.includes(date),
      })),
    };

    return progress;
  },

  getHabitStreak: (habitId: string) => {
    const {habits} = get();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const today = dayjs();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const checkDate = today.subtract(i, 'day').format('YYYY-MM-DD');
      if (habit.completedDates.includes(checkDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  getMonthlyProgress: (year: number, month: number) => {
    const {getDayProgress} = get();
    const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
    const monthlyProgress: {[date: string]: IDayProgress} = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const date = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD');
      monthlyProgress[date] = getDayProgress(date);
    }

    return monthlyProgress;
  },

  clearAllHabits: async () => {
    try {
      await AsyncStorage.removeItem(HABITS_STORAGE_KEY);
      set({habits: []});
      console.log('🧹 모든 습관 데이터 삭제 완료');
    } catch (error) {
      console.error('❌ 습관 데이터 삭제 실패:', error);
    }
  },
}));
