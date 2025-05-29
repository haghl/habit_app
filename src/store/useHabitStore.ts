import {STORAGE_KEYS} from '@/constants/common';
import {IDayProgress, IHabit} from '@/types/habit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import {create} from 'zustand';

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
  toggleHabitCompletion: (habitId: string, date: string) => Promise<void>;
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

export const useHabitStore = create<IHabitStore>((set, get) => ({
  habits: [],
  loading: false,

  /**
   * AsyncStorage에서 습관 데이터를 로드
   */
  loadHabits: async () => {
    set({loading: true});

    try {
      const storedHabits = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);

      if (storedHabits) {
        const parsedHabits = JSON.parse(storedHabits).map((habit: any) => ({
          ...habit,
          createdAt: dayjs(habit.createdAt).toDate(),
        }));

        set({habits: parsedHabits});
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        set({habits: []});
      }
    } catch (error) {
      set({habits: []});
    } finally {
      set({loading: false});
    }
  },

  /**
   * 새로운 습관 추가
   * @param habitData - 습관 데이터 (id, createdAt, completedDates 제외)
   */
  addHabit: async habitData => {
    const {habits} = get();

    const newHabit: IHabit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: dayjs().toDate(),
      completedDates: [],
    };

    const updatedHabits = [...habits, newHabit];

    // 즉시 상태 업데이트
    set({habits: updatedHabits});

    try {
      const dataToStore = JSON.stringify(updatedHabits);
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, dataToStore);
    } catch (error) {
      // 실패 시 이전 상태로 복원
      set({habits});
      throw error;
    }
  },

  /**
   * 기존 습관 수정
   * @param habitId - 수정할 습관 ID
   * @param updates - 업데이트할 데이터
   */
  updateHabit: async (habitId, updates) => {
    const {habits} = get();

    const updatedHabits = habits.map(habit =>
      habit.id === habitId ? {...habit, ...updates} : habit,
    );

    // 즉시 상태 업데이트
    set({habits: updatedHabits});

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HABITS,
        JSON.stringify(updatedHabits),
      );
    } catch (error) {
      // 실패 시 이전 상태로 복원
      set({habits});
      throw error;
    }
  },

  /**
   * 습관 완료 상태 토글
   * @param habitId - 토글할 습관 ID
   * @param date - 날짜 (YYYY-MM-DD)
   */
  toggleHabitCompletion: async (habitId: string, date: string) => {
    const {habits} = get();

    const targetHabit = habits.find(habit => habit.id === habitId);
    if (!targetHabit) {
      return;
    }

    const isCompleted = targetHabit.completedDates.includes(date);

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completedDates = isCompleted
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date];

        return {
          ...habit,
          completedDates,
        };
      }
      return habit;
    });

    // 즉시 상태 업데이트 (UI 반영)
    set({habits: updatedHabits});

    // 백그라운드에서 AsyncStorage 저장
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HABITS,
        JSON.stringify(updatedHabits),
      );
    } catch (error) {
      // 저장 실패 시 이전 상태로 되돌리기
      set({habits});
      throw error;
    }
  },

  /**
   * 습관 삭제
   * @param habitId - 삭제할 습관 ID
   */
  deleteHabit: async (habitId: string) => {
    const {habits} = get();
    const updatedHabits = habits.filter(habit => habit.id !== habitId);

    // 즉시 상태 업데이트
    set({habits: updatedHabits});

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HABITS,
        JSON.stringify(updatedHabits),
      );
    } catch (error) {
      // 실패 시 이전 상태로 복원
      set({habits});
      throw error;
    }
  },

  getHabitsForDate: (date: string) => {
    const {habits} = get();
    const dayOfWeek = dayjs(date).day();
    const dayOfMonth = dayjs(date).date();
    const dateString = dayjs(date).format('YYYY-MM-DD');

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
      await AsyncStorage.removeItem(STORAGE_KEYS.HABITS);
      set({habits: []});
    } catch (error) {
      console.error('습관 데이터 삭제 실패:', error);
    }
  },
}));
