import useNavigate from '@hooks/logic/useNavigate';
import {useHabitStore} from '@/store/useHabitStore';
import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Calendar} from 'react-native-calendars';
import dayjs from 'dayjs';
import {IHabit} from '@/types/habit';
import {
  WEEK_DAYS,
  HABIT_CATEGORIES,
  FREQUENCY_OPTIONS,
  COLORS,
  CALENDAR_THEME,
} from '@/constants/common';

interface CreateRoutineScreenProps {
  route: {
    params?: {
      habit?: IHabit;
    };
  };
}

const CreateRoutineScreen = ({route}: CreateRoutineScreenProps) => {
  const navigate = useNavigate();
  const {addHabit, updateHabit, deleteHabit} = useHabitStore();

  const editingHabit = route.params?.habit;
  const isEditingMode = !!editingHabit;

  const habitNameInputRef = useRef<TextInput>(null);

  const [habitName, setHabitName] = useState(editingHabit?.name || '');
  const [selectedFrequency, setSelectedFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'custom'
  >(editingHabit?.frequency || 'daily');
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<number[]>(
    editingHabit?.customDays || [],
  );
  const [selectedMonthlyDays, setSelectedMonthlyDays] = useState<number[]>(
    editingHabit?.monthlyDays || [],
  );
  const [selectedCustomDates, setSelectedCustomDates] = useState<string[]>(
    editingHabit?.customDates || [],
  );
  const [selectedCategory, setSelectedCategory] = useState<
    'health' | 'exercise' | 'study' | 'lifestyle' | 'work' | 'other'
  >(editingHabit?.category || 'health');
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);

  /**
   * 컴포넌트 마운트 시 이름 입력 필드에 포커스
   */
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      habitNameInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(focusTimer);
  }, []);

  const availableWeekDays = useMemo(() => WEEK_DAYS, []);
  const availableCategories = useMemo(() => HABIT_CATEGORIES, []);
  const availableFrequencyOptions = useMemo(() => FREQUENCY_OPTIONS, []);

  /**
   * 주간 요일 선택/해제 토글 핸들러
   * @param dayValue - 토글할 요일 값 (0: 일요일, 1: 월요일, ...)
   */
  const handleWeeklyDayToggle = useCallback((dayValue: number) => {
    setSelectedWeeklyDays(previousDays =>
      previousDays.includes(dayValue)
        ? previousDays.filter(day => day !== dayValue)
        : [...previousDays, dayValue],
    );
  }, []);

  /**
   * 월간 일자 선택/해제 토글 핸들러
   * @param dayNumber - 토글할 일자 (1-31)
   */
  const handleMonthlyDayToggle = useCallback((dayNumber: number) => {
    setSelectedMonthlyDays(previousDays =>
      previousDays.includes(dayNumber)
        ? previousDays.filter(day => day !== dayNumber)
        : [...previousDays, dayNumber],
    );
  }, []);

  /**
   * 캘린더에서 날짜 선택/해제 핸들러
   * @param day - 선택된 날짜 객체
   */
  const handleCustomDateSelect = useCallback((day: any) => {
    const selectedDateString = day.dateString;
    setSelectedCustomDates(previousDates =>
      previousDates.includes(selectedDateString)
        ? previousDates.filter(date => date !== selectedDateString)
        : [...previousDates, selectedDateString],
    );
  }, []);

  /**
   * 특정 커스텀 날짜 제거 핸들러
   * @param dateToRemove - 제거할 날짜 문자열
   */
  const handleCustomDateRemove = useCallback((dateToRemove: string) => {
    setSelectedCustomDates(previousDates =>
      previousDates.filter(date => date !== dateToRemove),
    );
  }, []);

  /**
   * 모든 커스텀 날짜 초기화 핸들러
   */
  const handleCustomDatesReset = useCallback(() => {
    setSelectedCustomDates([]);
  }, []);

  /**
   * 캘린더 모달 열기 핸들러
   */
  const handleCalendarModalOpen = useCallback(() => {
    setIsCalendarModalVisible(true);
  }, []);

  /**
   * 캘린더 모달 닫기 핸들러
   */
  const handleCalendarModalClose = useCallback(() => {
    setIsCalendarModalVisible(false);
  }, []);

  /**
   * 습관 저장 핸들러 (생성 또는 수정)
   */
  const handleHabitSave = useCallback(async () => {
    // 입력 유효성 검사
    if (!habitName.trim()) {
      Alert.alert('오류', '습관 이름을 입력해주세요.');
      return;
    }

    if (selectedFrequency === 'weekly' && selectedWeeklyDays.length === 0) {
      Alert.alert('오류', '매주 빈도에서는 최소 하나의 요일을 선택해주세요.');
      return;
    }

    if (selectedFrequency === 'monthly' && selectedMonthlyDays.length === 0) {
      Alert.alert('오류', '매달 빈도에서는 최소 하나의 일을 선택해주세요.');
      return;
    }

    if (selectedFrequency === 'custom' && selectedCustomDates.length === 0) {
      Alert.alert('오류', '맞춤 빈도에서는 최소 하나의 날짜를 선택해주세요.');
      return;
    }

    try {
      const habitData = {
        name: habitName.trim(),
        frequency: selectedFrequency,
        customDays:
          selectedFrequency === 'weekly' ? selectedWeeklyDays : undefined,
        monthlyDays:
          selectedFrequency === 'monthly' ? selectedMonthlyDays : undefined,
        customDates:
          selectedFrequency === 'custom' ? selectedCustomDates : undefined,
        category: selectedCategory,
      };

      if (isEditingMode && editingHabit) {
        // 수정 모드
        await updateHabit(editingHabit.id, habitData);
        Alert.alert('성공', '습관이 수정되었습니다!', [
          {text: '확인', onPress: () => navigate.goBack()},
        ]);
      } else {
        // 생성 모드
        await addHabit(habitData);
        Alert.alert('성공', '새로운 습관이 추가되었습니다!', [
          {text: '확인', onPress: () => navigate.goBack()},
        ]);
      }
    } catch (error) {
      Alert.alert(
        '오류',
        `습관 ${isEditingMode ? '수정' : '추가'}에 실패했습니다.`,
      );
    }
  }, [
    habitName,
    selectedFrequency,
    selectedWeeklyDays,
    selectedMonthlyDays,
    selectedCustomDates,
    selectedCategory,
    isEditingMode,
    editingHabit,
    updateHabit,
    addHabit,
    navigate,
  ]);

  /**
   * 습관 삭제 핸들러
   */
  const handleHabitDelete = useCallback(() => {
    if (!editingHabit) return;

    Alert.alert(
      '습관 삭제',
      `"${editingHabit.name}" 습관을 삭제하시겠습니까?\n\n삭제된 습관은 복구할 수 없습니다.`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(editingHabit.id);
              Alert.alert('삭제 완료', '습관이 삭제되었습니다.', [
                {text: '확인', onPress: () => navigate.goBack()},
              ]);
            } catch (error) {
              Alert.alert('오류', '습관 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  }, [editingHabit, deleteHabit, navigate]);

  /**
   * 화면 뒤로가기 핸들러
   */
  const handleScreenGoBack = useCallback(() => {
    navigate.goBack();
  }, [navigate]);

  /**
   * 캘린더에 표시할 마킹 데이터 생성 (메모이제이션)
   * @returns 선택된 날짜들의 마킹 객체
   */
  const calendarMarkedDates = useMemo(() => {
    const markedDates: any = {};
    selectedCustomDates.forEach(date => {
      markedDates[date] = {
        selected: true,
        selectedColor: '#3498db',
      };
    });
    return markedDates;
  }, [selectedCustomDates]);

  /**
   * 카테고리 선택 버튼을 렌더링하는 함수
   * @param category - 렌더링할 카테고리 객체
   * @returns 카테고리 버튼 JSX
   */
  const renderCategoryButton = useCallback(
    (category: any) => (
      <TouchableOpacity
        key={category.key}
        style={[
          styles.categoryButton,
          {borderColor: category.color},
          selectedCategory === category.key && {
            backgroundColor: category.color,
          },
        ]}
        onPress={() => setSelectedCategory(category.key as any)}>
        <Text
          style={[
            styles.categoryText,
            selectedCategory === category.key && styles.selectedCategoryText,
          ]}>
          {category.label}
        </Text>
      </TouchableOpacity>
    ),
    [selectedCategory],
  );

  /**
   * 빈도 옵션 버튼을 렌더링하는 함수
   * @param option - 렌더링할 빈도 옵션 객체
   * @returns 빈도 옵션 버튼 JSX
   */
  const renderFrequencyOption = useCallback(
    (option: any) => (
      <TouchableOpacity
        key={option.key}
        style={[
          styles.frequencyOption,
          selectedFrequency === option.key && styles.selectedOption,
        ]}
        onPress={() => setSelectedFrequency(option.key as any)}>
        <View style={styles.frequencyContent}>
          <Text
            style={[
              styles.frequencyText,
              selectedFrequency === option.key && styles.selectedText,
            ]}>
            {option.label}
          </Text>
          <Text
            style={[
              styles.frequencyDesc,
              selectedFrequency === option.key && styles.selectedDesc,
            ]}>
            {option.description}
          </Text>
        </View>
        <View
          style={[
            styles.radio,
            selectedFrequency === option.key && styles.radioSelected,
          ]}
        />
      </TouchableOpacity>
    ),
    [selectedFrequency],
  );

  /**
   * 주간 요일 선택 버튼을 렌더링하는 함수
   * @param day - 렌더링할 요일 객체
   * @returns 요일 선택 버튼 JSX
   */
  const renderWeeklyDayButton = useCallback(
    (day: any) => (
      <TouchableOpacity
        key={day.value}
        style={[
          styles.dayButton,
          selectedWeeklyDays.includes(day.value) && styles.selectedDay,
        ]}
        onPress={() => handleWeeklyDayToggle(day.value)}>
        <Text
          style={[
            styles.dayText,
            selectedWeeklyDays.includes(day.value) && styles.selectedDayText,
          ]}>
          {day.label}
        </Text>
      </TouchableOpacity>
    ),
    [selectedWeeklyDays, handleWeeklyDayToggle],
  );

  /**
   * 월간 일자 선택 버튼을 렌더링하는 함수
   * @param dayNumber - 렌더링할 일자 (1-31)
   * @returns 일자 선택 버튼 JSX
   */
  const renderMonthlyDayButton = useCallback(
    (dayNumber: number) => (
      <TouchableOpacity
        key={dayNumber}
        style={[
          styles.monthlyDayButton,
          selectedMonthlyDays.includes(dayNumber) && styles.selectedMonthlyDay,
        ]}
        onPress={() => handleMonthlyDayToggle(dayNumber)}>
        <Text
          style={[
            styles.monthlyDayText,
            selectedMonthlyDays.includes(dayNumber) &&
              styles.selectedMonthlyDayText,
          ]}>
          {dayNumber}
        </Text>
      </TouchableOpacity>
    ),
    [selectedMonthlyDays, handleMonthlyDayToggle],
  );

  /**
   * 선택된 커스텀 날짜 칩을 렌더링하는 함수
   * @param date - 렌더링할 날짜 문자열
   * @returns 날짜 칩 JSX
   */
  const renderSelectedDateChip = useCallback(
    (date: string) => (
      <View key={date} style={styles.selectedDateChip}>
        <Text style={styles.selectedDateText}>
          {dayjs(date).format('MM/DD')}
        </Text>
        <TouchableOpacity onPress={() => handleCustomDateRemove(date)}>
          <Text style={styles.removeDate}>×</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleCustomDateRemove],
  );

  /**
   * 월간 일자 배열 생성 (메모이제이션)
   */
  const monthlyDayNumbers = useMemo(
    () => Array.from({length: 31}, (_, i) => i + 1),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 섹션 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleScreenGoBack}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditingMode ? '습관 수정' : '새 습관 추가'}
        </Text>
        <TouchableOpacity onPress={handleHabitSave}>
          <Text style={styles.saveButton}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* 습관 이름 입력 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>습관 이름</Text>
          <TextInput
            ref={habitNameInputRef}
            style={styles.textInput}
            value={habitName}
            onChangeText={setHabitName}
            placeholder="예: 물 8잔 마시기, 30분 운동하기, 독서하기"
            placeholderTextColor="#bdc3c7"
            maxLength={50}
            returnKeyType="done"
            autoCorrect={false}
          />
        </View>

        {/* 카테고리 선택 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {availableCategories.map(renderCategoryButton)}
          </View>
        </View>

        {/* 빈도 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빈도</Text>
          {availableFrequencyOptions.map(renderFrequencyOption)}
        </View>

        {/* 매주 요일 선택 섹션 */}
        {selectedFrequency === 'weekly' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>요일 선택 (복수 선택 가능)</Text>
            <View style={styles.daysContainer}>
              {availableWeekDays.map(renderWeeklyDayButton)}
            </View>
          </View>
        )}

        {/* 매달 일자 선택 섹션 */}
        {selectedFrequency === 'monthly' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              매달 실행할 일 선택 (복수 선택 가능)
            </Text>
            <View style={styles.monthlyDaysContainer}>
              {monthlyDayNumbers.map(renderMonthlyDayButton)}
            </View>
          </View>
        )}

        {/* 맞춤 날짜 선택 섹션 */}
        {selectedFrequency === 'custom' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>특정 날짜 선택</Text>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={handleCalendarModalOpen}>
              <Text style={styles.calendarButtonText}>
                달력에서 날짜 선택 ({selectedCustomDates.length}개 선택됨)
              </Text>
            </TouchableOpacity>

            {selectedCustomDates.length > 0 && (
              <View style={styles.selectedDatesContainer}>
                <Text style={styles.selectedDatesTitle}>선택된 날짜들:</Text>
                <View style={styles.selectedDatesList}>
                  {selectedCustomDates.slice(0, 5).map(renderSelectedDateChip)}
                  {selectedCustomDates.length > 5 && (
                    <Text style={styles.moreDates}>
                      +{selectedCustomDates.length - 5}개 더
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 삭제 버튼 섹션 - 수정 모드일 때만 표시 */}
        {isEditingMode && (
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleHabitDelete}>
              <Text style={styles.deleteButtonText}>🗑️ 습관 삭제</Text>
            </TouchableOpacity>
            <Text style={styles.deleteWarning}>
              삭제된 습관과 기록은 복구할 수 없습니다.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 달력 모달 */}
      <Modal
        visible={isCalendarModalVisible}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handleCalendarModalClose}>
              <Text style={styles.calendarDone}>완료</Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>날짜 선택</Text>
            <TouchableOpacity onPress={handleCustomDatesReset}>
              <Text style={styles.calendarClear}>전체 해제</Text>
            </TouchableOpacity>
          </View>

          <Calendar
            onDayPress={handleCustomDateSelect}
            markedDates={calendarMarkedDates}
            markingType="dot"
            minDate={dayjs().format('YYYY-MM-DD')}
            theme={CALENDAR_THEME}
          />

          <View style={styles.calendarFooter}>
            <Text style={styles.calendarHelp}>
              날짜를 터치하여 선택/해제할 수 있습니다.{' '}
              {selectedCustomDates.length}개 선택됨
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  cancelButton: {
    fontSize: 16,
    color: '#e74c3c',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  saveButton: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    color: '#2c3e50',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ecf0f1',
  },
  selectedOption: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  selectedText: {
    color: '#3498db',
  },
  frequencyDesc: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  selectedDesc: {
    color: '#3498db',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bdc3c7',
  },
  radioSelected: {
    borderColor: '#3498db',
    backgroundColor: '#3498db',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ecf0f1',
  },
  selectedDay: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  selectedDayText: {
    color: '#fff',
  },
  monthlyDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthlyDayButton: {
    width: '12%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  selectedMonthlyDay: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  monthlyDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  selectedMonthlyDayText: {
    color: '#fff',
  },
  calendarButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    alignItems: 'center',
  },
  calendarButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  selectedDatesContainer: {
    marginTop: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  selectedDatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  selectedDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  selectedDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf3fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 12,
    color: '#3498db',
    marginRight: 4,
  },
  removeDate: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  moreDates: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  calendarModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  calendarDone: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  calendarClear: {
    fontSize: 16,
    color: '#e74c3c',
  },
  calendarFooter: {
    padding: 20,
    alignItems: 'center',
  },
  calendarHelp: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },

  deleteSection: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CreateRoutineScreen;
