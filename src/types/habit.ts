export interface IHabit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number[]; // 0-6 (일요일-토요일) - weekly에서 사용
  monthlyDays?: number[]; // 1-31 (매달 특정 일) - monthly에서 사용
  customDates?: string[]; // YYYY-MM-DD 형식 - custom에서 사용
  createdAt: Date;
  completedDates: string[]; // YYYY-MM-DD 형식
  targetCount?: number; // 목표 횟수 (예: 물 2L = 8잔)
  currentCount?: number; // 현재 횟수
  unit?: string; // 단위 (잔, 페이지, 분 등)
  time?: string; // 시간 (HH:MM)
  category: 'health' | 'exercise' | 'study' | 'lifestyle' | 'work' | 'other';
}

export interface IDayProgress {
  date: string;
  totalHabits: number;
  completedHabits: number;
  habits: {
    habitId: string;
    completed: boolean;
    count?: number;
  }[];
}
