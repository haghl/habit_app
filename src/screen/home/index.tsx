import {CALENDAR_THEME, HABIT_CATEGORIES} from '@/constants/common';
import {useHabitStore} from '@/store/useHabitStore';
import useNavigate from '@hooks/logic/useNavigate';
import dayjs from 'dayjs';
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {SafeAreaView} from 'react-native-safe-area-context';

/**
 * 카테고리별 색상을 반환하는 함수
 * @param category - 습관 카테고리
 * @returns 해당 카테고리의 색상 코드
 */
const getCategoryColor = (category: string): string => {
  const categoryColors: {[key: string]: string} = {
    health: '#4CAF50',
    exercise: '#FF5722',
    study: '#2196F3',
    lifestyle: '#9C27B0',
    work: '#FF9800',
    other: '#607D8B',
  };
  return categoryColors[category] || '#607D8B';
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const {habits, loading, loadHabits, toggleHabitCompletion} = useHabitStore();

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  );
  const [dataLoaded, setDataLoaded] = useState(false);

  /**
   * 특정 날짜에 해당하는 습관들을 필터링하여 반환
   * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
   * @returns 해당 날짜에 실행해야 하는 습관 배열
   */
  const getHabitsForSelectedDate = useCallback(
    (date: string) => {
      const dayOfWeek = dayjs(date).day(); // 0: 일요일, 1: 월요일, ...
      const dayOfMonth = dayjs(date).date(); // 1-31
      const dateString = dayjs(date).format('YYYY-MM-DD');

      return habits.filter(habit => {
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
    },
    [habits],
  );

  /**
   * 특정 날짜의 습관 진행 상황을 계산
   * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
   * @returns 해당 날짜의 진행 상황 객체
   */
  const calculateDayProgress = useCallback(
    (date: string) => {
      const dayHabits = getHabitsForSelectedDate(date);
      const completedHabits = dayHabits.filter(habit =>
        habit.completedDates.includes(date),
      );

      return {
        date,
        totalHabits: dayHabits.length,
        completedHabits: completedHabits.length,
        habits: dayHabits.map(habit => ({
          habitId: habit.id,
          completed: habit.completedDates.includes(date),
        })),
      };
    },
    [getHabitsForSelectedDate],
  );

  /**
   * 특정 월의 모든 날짜에 대한 진행 상황을 계산
   * @param year - 연도
   * @param month - 월 (1-12)
   * @returns 해당 월의 모든 날짜별 진행 상황 객체
   */
  const calculateMonthlyProgress = useCallback(
    (year: number, month: number) => {
      const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
      const progress: {[date: string]: any} = {};

      for (let day = 1; day <= daysInMonth; day++) {
        const date = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD');
        progress[date] = calculateDayProgress(date);
      }

      return progress;
    },
    [calculateDayProgress],
  );

  /**
   * 선택된 날짜의 습관 목록 (메모이제이션)
   */
  const selectedDateHabits = useMemo(() => {
    return getHabitsForSelectedDate(selectedDate);
  }, [selectedDate, getHabitsForSelectedDate]);

  /**
   * 선택된 날짜의 진행 상황 (메모이제이션)
   */
  const selectedDateProgress = useMemo(() => {
    return calculateDayProgress(selectedDate);
  }, [selectedDate, calculateDayProgress]);

  /**
   * 현재 월의 모든 날짜별 진행 상황 (메모이제이션)
   */
  const currentMonthProgress = useMemo(() => {
    const currentDate = dayjs(selectedDate);
    return calculateMonthlyProgress(
      currentDate.year(),
      currentDate.month() + 1,
    );
  }, [selectedDate, calculateMonthlyProgress]);

  /**
   * 캘린더에 표시할 마킹 데이터 생성 (메모이제이션)
   */
  const calendarMarkedDates = useMemo(() => {
    return Object.keys(currentMonthProgress).reduce((acc, date) => {
      const progress = currentMonthProgress[date];

      if (progress && progress.totalHabits > 0) {
        const completionRate = progress.completedHabits / progress.totalHabits;
        let backgroundColor = '#f8f9fa';
        let textColor = '#2c3e50';

        // 완료율에 따른 색상 결정
        if (completionRate === 1) {
          backgroundColor = '#4CAF50'; // 완료
          textColor = '#fff';
        } else if (completionRate >= 0.5) {
          backgroundColor = '#FF9800'; // 부분 완료
          textColor = '#fff';
        } else if (completionRate > 0) {
          backgroundColor = '#FFC107'; // 일부 완료
          textColor = '#000';
        } else {
          backgroundColor = '#F44336'; // 미완료
          textColor = '#fff';
        }

        acc[date] = {
          customStyles: {
            container: {
              backgroundColor,
              borderRadius: 8,
            },
            text: {
              color: textColor,
              fontWeight: 'bold',
            },
          },
        };
      }

      // 선택된 날짜 스타일 적용
      if (date === selectedDate) {
        acc[date] = {
          ...acc[date],
          selected: true,
          selectedColor: '#2196F3',
          selectedTextColor: '#fff',
        };
      }

      return acc;
    }, {} as any);
  }, [currentMonthProgress, selectedDate]);

  /**
   * 오늘 날짜 마킹이 포함된 최종 캘린더 마킹 데이터 (메모이제이션)
   */
  const finalCalendarMarkedDates = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const markedDates = {...calendarMarkedDates};

    // 오늘 날짜 마킹 추가
    if (!markedDates[today]) {
      markedDates[today] = {};
    }
    if (today !== selectedDate) {
      markedDates[today] = {
        ...markedDates[today],
        marked: true,
        dotColor: '#FF6B35',
      };
    }

    return markedDates;
  }, [calendarMarkedDates, selectedDate]);

  /**
   * 선택된 날짜의 습관 통계 (전체/미완료/완료) (메모이제이션)
   */
  const selectedDateStats = useMemo(() => {
    const habitsForSelectedDate = getHabitsForSelectedDate(selectedDate);
    const completedCount = habitsForSelectedDate.filter(habit =>
      habit.completedDates.includes(selectedDate),
    ).length;

    const stats = {
      total: habitsForSelectedDate.length,
      incomplete: habitsForSelectedDate.length - completedCount,
      completed: completedCount,
    };

    return stats;
  }, [selectedDate, getHabitsForSelectedDate]);

  /**
   * 컴포넌트 마운트 시 습관 데이터 로딩
   */
  useEffect(() => {
    const initializeHabitData = async () => {
      try {
        await loadHabits();
        setDataLoaded(true);
      } catch (error) {
        setDataLoaded(true);
      }
    };

    initializeHabitData();
  }, [loadHabits]);

  /**
   * 습관 완료 상태 토글 핸들러
   * @param habitId - 토글할 습관의 ID
   */
  const handleHabitToggle = useCallback(
    async (habitId: string) => {
      try {
        await toggleHabitCompletion(habitId, selectedDate);
      } catch (error) {
        Alert.alert('오류', '습관 상태 변경에 실패했습니다.');
      }
    },
    [toggleHabitCompletion, selectedDate],
  );

  /**
   * 습관 수정 화면으로 이동하는 핸들러
   * @param habit - 수정할 습관 객체
   */
  const handleHabitEdit = useCallback(
    (habit: any) => {
      navigate.push('createRoutineScreen', {habit});
    },
    [navigate],
  );

  /**
   * 습관 추가 화면으로 이동하는 핸들러
   */
  const handleHabitCreate = useCallback(() => {
    navigate.push('createRoutineScreen');
  }, [navigate]);

  /**
   * 캘린더 날짜 선택 핸들러
   * @param day - 선택된 날짜 객체
   */
  const handleDateSelect = useCallback((day: any) => {
    setSelectedDate(day.dateString);
  }, []);

  /**
   * 습관 아이템을 렌더링하는 함수
   * @param habit - 렌더링할 습관 객체
   * @returns 습관 아이템 JSX
   */
  const renderHabitItem = useCallback(
    ({item: habit}: {item: any}) => {
      const isCompleted = habit.completedDates.includes(selectedDate);

      return (
        <View style={styles.habitItem}>
          <View
            style={[
              styles.categoryBar,
              {backgroundColor: getCategoryColor(habit.category)},
            ]}
          />
          <TouchableOpacity
            style={[styles.habitContent, isCompleted && styles.completedHabit]}
            onPress={() => handleHabitToggle(habit.id)}
            activeOpacity={0.7}>
            <View style={styles.habitInfo}>
              <Text
                style={[styles.habitName, isCompleted && styles.completedText]}>
                {habit.name}
              </Text>
              <Text style={styles.habitCategory}>
                {
                  HABIT_CATEGORIES.find(cat => cat.key === habit.category)
                    ?.label
                }
              </Text>
            </View>

            <View style={styles.habitActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleHabitEdit(habit)}
                activeOpacity={0.7}>
                <Text style={styles.editButtonText}>편집</Text>
              </TouchableOpacity>

              <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
                {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [selectedDate, handleHabitToggle, handleHabitEdit],
  );

  if (loading || !dataLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 캘린더 섹션 */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={handleDateSelect}
            markedDates={finalCalendarMarkedDates}
            markingType={'custom'}
            theme={CALENDAR_THEME}
            style={styles.calendar}
            hideExtraDays={true}
            firstDay={0} // 일요일부터 시작
            showWeekNumbers={false}
            disableMonthChange={false}
            enableSwipeMonths={true}
          />
        </View>

        {/* 선택된 날짜 정보 섹션 */}
        <View style={styles.dateHeader}>
          <View style={styles.dateInfo}>
            <Text style={styles.selectedDateText}>
              {dayjs(selectedDate).format('M월 D일 dddd')}
            </Text>
            <Text style={styles.progressText}>
              {selectedDateProgress.completedHabits}/
              {selectedDateProgress.totalHabits}
            </Text>
          </View>
        </View>

        {/* 통계 섹션 */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, {backgroundColor: '#34495e'}]}>
            <Text style={styles.statNumber}>{selectedDateStats.total}</Text>
            <Text style={styles.statLabel}>전체</Text>
          </View>
          <View style={[styles.statItem, {backgroundColor: '#e67e22'}]}>
            <Text style={styles.statNumber}>
              {selectedDateStats.incomplete}
            </Text>
            <Text style={styles.statLabel}>미완료</Text>
          </View>
          <View style={[styles.statItem, styles.completedStat]}>
            <Text style={styles.statNumber}>{selectedDateStats.completed}</Text>
            <Text style={styles.statLabel}>완료</Text>
          </View>
        </View>

        {/* 습관 목록 섹션 */}
        <View style={styles.habitsContainer}>
          {selectedDateHabits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                이 날짜에 예정된 습관이 없습니다.
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleHabitCreate}>
                <Text style={styles.createButtonText}>첫 번째 습관 만들기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={selectedDateHabits}
              renderItem={renderHabitItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleHabitCreate}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendar: {
    borderRadius: 16,
    paddingBottom: 10,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: '#34495e',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  completedStat: {
    backgroundColor: '#27ae60',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  habitItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBar: {
    width: 4,
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  completedHabit: {
    backgroundColor: '#f8fff8',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  habitCategory: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  editButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  habitsContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;
