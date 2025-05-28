import {CALENDAR_THEME, COLORS, getCategoryColor} from '@/constants/common';
import {useHabitStore} from '@/store/useHabitStore';
import useNavigate from '@hooks/logic/useNavigate';
import dayjs from 'dayjs';
import React, {useEffect, useState} from 'react';
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

const HomeScreen = () => {
  const navigate = useNavigate();
  const {
    habits,
    selectedDate,
    loading,
    setSelectedDate,
    loadHabits,
    toggleHabitCompletion,
    getHabitsForDate,
    getDayProgress,
    getHabitStreak,
    getMonthlyProgress,
  } = useHabitStore();

  const [showAllHabits, setShowAllHabits] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // 강제 리렌더링용

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadHabits();
        setDataLoaded(true);
        console.log('✅ 초기 데이터 로드 완료');
      } catch (error) {
        console.error('❌ 초기 데이터 로드 실패:', error);
        setDataLoaded(true);
      }
    };

    initializeData();
  }, [loadHabits]);

  if (loading || !dataLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedDateHabits = getHabitsForDate(selectedDate);
  const dayProgress = getDayProgress(selectedDate);

  // dayjs로 변경
  const currentDate = dayjs(selectedDate);
  const monthlyProgress = getMonthlyProgress(
    currentDate.year(),
    currentDate.month() + 1,
  );

  console.log('🔄 홈 화면 렌더링:', {
    habitsCount: habits.length,
    selectedDate,
    selectedDateHabitsCount: selectedDateHabits.length,
    dayProgress,
    forceUpdate, // 강제 업데이트 카운터
  });

  // react-native-calendars용 마킹 데이터 생성
  const markedDates = Object.keys(monthlyProgress).reduce((acc, date) => {
    const progress = monthlyProgress[date];

    if (progress && progress.totalHabits > 0) {
      const completionRate = progress.completedHabits / progress.totalHabits;
      let color = '#f8f9fa';
      let textColor = '#2c3e50';

      if (completionRate === 1) {
        color = '#4CAF50'; // 완료
        textColor = '#fff';
      } else if (completionRate >= 0.5) {
        color = '#FF9800'; // 부분 완료
        textColor = '#fff';
      } else if (completionRate > 0) {
        color = '#FFC107'; // 일부 완료
        textColor = '#000';
      } else {
        color = '#F44336'; // 미완료
        textColor = '#fff';
      }

      acc[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
            borderRadius: 8,
          },
          text: {
            color: textColor,
            fontWeight: 'bold',
          },
        },
      };
    }

    // 선택된 날짜 스타일
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

  // 오늘 날짜 마킹 - dayjs로 변경
  const today = dayjs().format('YYYY-MM-DD');
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

  const handleToggleCompletion = async (habitId: string) => {
    console.log('🎯 습관 완료 토글 시작:', habitId, selectedDate);

    try {
      setForceUpdate(prev => prev + 1);
      await toggleHabitCompletion(habitId, selectedDate);
      console.log('✅ 습관 완료 상태 토글 완료:', habitId, selectedDate);

      setTimeout(() => {
        setForceUpdate(prev => prev + 1);
      }, 100);
    } catch (error) {
      console.error('❌ 습관 완료 토글 실패:', error);
      Alert.alert('오류', '습관 상태 변경에 실패했습니다.');
      setForceUpdate(prev => prev + 1);
    }
  };

  const handleEditHabit = (habit: any) => {
    navigate.push('createRoutineScreen', {habit});
  };

  const renderHabitItem = ({item: habit}: {item: any}) => {
    const isCompleted = habit.completedDates.includes(selectedDate);
    const streak = getHabitStreak(habit.id);

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
          onPress={() => handleToggleCompletion(habit.id)}
          activeOpacity={0.7}>
          <View style={styles.habitInfo}>
            <View style={styles.habitHeader}>
              <Text style={styles.habitEmoji}>{habit.emoji}</Text>
              <Text
                style={[styles.habitName, isCompleted && styles.completedText]}>
                {habit.name}
              </Text>
            </View>

            {streak > 0 && (
              <Text style={styles.streakText}>🔥 {streak}일 연속</Text>
            )}
          </View>

          <View style={styles.habitActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditHabit(habit)}
              activeOpacity={0.7}>
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>

            <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const getProgressStats = () => {
    // dayjs로 변경
    const todayString = dayjs().format('YYYY-MM-DD');
    const todayHabits = getHabitsForDate(todayString);
    const completedToday = todayHabits.filter(h =>
      h.completedDates.includes(todayString),
    ).length;

    return {
      total: todayHabits.length,
      incomplete: todayHabits.length - completedToday,
      completed: completedToday,
    };
  };

  const stats = getProgressStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* React Native Calendars 사용 */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={markedDates}
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

        {/* 선택된 날짜 정보 */}
        <View style={styles.dateHeader}>
          <View style={styles.dateInfo}>
            <Text style={styles.selectedDateText}>
              {dayjs(selectedDate).format('M월 D일 dddd')}
            </Text>
            <TouchableOpacity onPress={() => setShowAllHabits(!showAllHabits)}>
              <Text style={styles.progressText}>
                {dayProgress.completedHabits}/{dayProgress.totalHabits}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 카테고리 통계 */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, {backgroundColor: '#34495e'}]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>전체</Text>
          </View>
          <View style={[styles.statItem, {backgroundColor: '#e67e22'}]}>
            <Text style={styles.statNumber}>{stats.incomplete}</Text>
            <Text style={styles.statLabel}>미완료</Text>
          </View>
          <View style={[styles.statItem, styles.completedStat]}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>완료</Text>
          </View>
        </View>

        {/* 습관 목록 */}
        <View style={styles.habitsContainer}>
          {selectedDateHabits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                이 날짜에 예정된 습관이 없습니다.
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigate.push('createRoutineScreen')}>
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

      {/* 우하단 FAB 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigate.push('createRoutineScreen')}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
  todaySection: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  emptyState: {
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
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  habitEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  streakText: {
    fontSize: 12,
    color: '#e67e22',
    fontWeight: 'bold',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  editButtonText: {
    fontSize: 16,
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
