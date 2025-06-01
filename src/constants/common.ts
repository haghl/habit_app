// 요일 관련 상수
export const WEEK_DAYS = [
  {label: '일', value: 0, fullName: '일요일'},
  {label: '월', value: 1, fullName: '월요일'},
  {label: '화', value: 2, fullName: '화요일'},
  {label: '수', value: 3, fullName: '수요일'},
  {label: '목', value: 4, fullName: '목요일'},
  {label: '금', value: 5, fullName: '금요일'},
  {label: '토', value: 6, fullName: '토요일'},
];

// 로케일 설정용 요일/월 이름
const WEEK_DAY_NAMES = WEEK_DAYS.map(day => day.fullName);
const WEEK_DAY_NAMES_SHORT = WEEK_DAYS.map(day => day.label);
const MONTH_NAMES = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

// 카테고리 상수
export const HABIT_CATEGORIES = [
  {key: 'health', label: '건강', color: '#4CAF50'},
  {key: 'exercise', label: '운동', color: '#FF5722'},
  {key: 'study', label: '공부', color: '#2196F3'},
  {key: 'lifestyle', label: '생활', color: '#9C27B0'},
  {key: 'work', label: '업무', color: '#FF9800'},
  {key: 'other', label: '기타', color: '#607D8B'},
] as const;

// 카테고리 색상 매핑
export const CATEGORY_COLORS: {[key: string]: string} = {
  health: '#4CAF50',
  exercise: '#FF5722',
  study: '#2196F3',
  lifestyle: '#9C27B0',
  work: '#FF9800',
  other: '#607D8B',
};

// 빈도 타입 상수
export const FREQUENCY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

// 빈도 옵션 상수
export const FREQUENCY_OPTIONS = [
  {
    key: 'daily',
    label: '매일',
    description: '매일 실행하는 습관',
  },
  {
    key: 'weekly',
    label: '매주',
    description: '선택한 요일에만 실행',
  },
  {
    key: 'monthly',
    label: '매달',
    description: '매달 선택한 일에만 실행',
  },
  {
    key: 'custom',
    label: '맞춤',
    description: '특정 날짜들에만 실행',
  },
] as const;

// 스토리지 키 상수
export const STORAGE_KEYS = {
  HABITS: 'habits_v3',
} as const;

// 날짜 형식 상수
export const DATE_FORMATS = {
  YYYY_MM_DD: 'YYYY-MM-DD',
  MM_DD: 'MM/DD',
  KOREAN_DATE: 'YYYY년 MM월 DD일',
} as const;

// 색상 상수
export const COLORS = {
  PRIMARY: '#3498db',
  SUCCESS: '#27ae60',
  DANGER: '#e74c3c',
  WARNING: '#f39c12',
  INFO: '#2196F3',
  LIGHT: '#ecf0f1',
  DARK: '#2c3e50',
  GRAY: '#7f8c8d',
  WHITE: '#ffffff',
  BACKGROUND: '#f8f9fa',
} as const;

// 캘린더 테마 상수
export const CALENDAR_THEME = {
  backgroundColor: '#ffffff',
  calendarBackground: '#ffffff',
  textSectionTitleColor: '#b6c1cd',
  textSectionTitleDisabledColor: '#d9e1e8',
  selectedDayBackgroundColor: '#2196F3',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#FF6B35',
  dayTextColor: '#2d4150',
  textDisabledColor: '#d9e1e8',
  dotColor: '#FF6B35',
  selectedDotColor: '#ffffff',
  arrowColor: '#2196F3',
  disabledArrowColor: '#d9e1e8',
  monthTextColor: '#2d4150',
  indicatorColor: '#2196F3',
  textDayFontFamily: 'System',
  textMonthFontFamily: 'System',
  textDayHeaderFontFamily: 'System',
  textDayFontWeight: '500' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14,
};

// 로케일 설정 상수 (App.tsx에서 사용)
export const LOCALE_CONFIG = {
  monthNames: MONTH_NAMES,
  monthNamesShort: MONTH_NAMES,
  dayNames: WEEK_DAY_NAMES,
  dayNamesShort: WEEK_DAY_NAMES_SHORT,
  today: '오늘',
};

// 유틸리티 함수
export const getCategoryColor = (
  category: keyof typeof CATEGORY_COLORS,
): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
};

export const getFrequencyLabel = (frequency: string): string => {
  const option = FREQUENCY_OPTIONS.find(opt => opt.key === frequency);
  return option?.label || '알 수 없음';
};

export const getFrequencyDescription = (frequency: string): string => {
  const option = FREQUENCY_OPTIONS.find(opt => opt.key === frequency);
  return option?.description || '';
};
