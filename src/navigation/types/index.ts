import {IHabit} from '@/types/habit';

export type TRootStackParamList = {
  homeScreen: undefined;
  createRoutineScreen?: {
    habit?: IHabit; // 수정할 습관 (선택적)
  };
};
