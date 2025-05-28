import useNavigate from '@hooks/logic/useNavigate';
import {useHabitStore} from '@/store/useHabitStore';
import React, {useState, useRef, useEffect} from 'react';
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
  COMMON_EMOJIS,
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

  // 수정할 습관이 있는지 확인
  const editingHabit = route.params?.habit;
  const isEditing = !!editingHabit;

  const nameInputRef = useRef<TextInput>(null);

  // 수정 모드일 때는 기존 데이터로 초기화, 생성 모드일 때는 기본값
  const [habitName, setHabitName] = useState(editingHabit?.name || '');
  const [selectedEmoji, setSelectedEmoji] = useState(
    editingHabit?.emoji || '💪',
  );
  const [frequency, setFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'custom'
  >(editingHabit?.frequency || 'daily');
  const [weeklyDays, setWeeklyDays] = useState<number[]>(
    editingHabit?.customDays || [],
  );
  const [monthlyDays, setMonthlyDays] = useState<number[]>(
    editingHabit?.monthlyDays || [],
  );
  const [customDates, setCustomDates] = useState<string[]>(
    editingHabit?.customDates || [],
  );
  const [selectedCategory, setSelectedCategory] = useState<
    'health' | 'exercise' | 'study' | 'lifestyle' | 'work' | 'other'
  >(editingHabit?.category || 'health');

  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // common.ts의 상수들 사용
  const weekDays = WEEK_DAYS;
  const categories = HABIT_CATEGORIES;
  const commonEmojis = COMMON_EMOJIS;

  const handleWeeklyDayToggle = (dayValue: number) => {
    setWeeklyDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(day => day !== dayValue)
        : [...prev, dayValue],
    );
  };

  const handleMonthlyDayToggle = (day: number) => {
    setMonthlyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const handleDateSelect = (day: any) => {
    const dateString = day.dateString;
    setCustomDates(prev =>
      prev.includes(dateString)
        ? prev.filter(date => date !== dateString)
        : [...prev, dateString],
    );
  };

  const getMarkedDates = () => {
    const marked: any = {};
    customDates.forEach(date => {
      marked[date] = {
        selected: true,
        selectedColor: '#3498db',
      };
    });
    return marked;
  };

  const handleSave = async () => {
    if (!habitName.trim()) {
      Alert.alert('오류', '습관 이름을 입력해주세요.');
      return;
    }

    if (frequency === 'weekly' && weeklyDays.length === 0) {
      Alert.alert('오류', '매주 빈도에서는 최소 하나의 요일을 선택해주세요.');
      return;
    }

    if (frequency === 'monthly' && monthlyDays.length === 0) {
      Alert.alert('오류', '매달 빈도에서는 최소 하나의 일을 선택해주세요.');
      return;
    }

    if (frequency === 'custom' && customDates.length === 0) {
      Alert.alert('오류', '맞춤 빈도에서는 최소 하나의 날짜를 선택해주세요.');
      return;
    }

    try {
      const habitData = {
        name: habitName.trim(),
        emoji: selectedEmoji,
        frequency,
        customDays: frequency === 'weekly' ? weeklyDays : undefined,
        monthlyDays: frequency === 'monthly' ? monthlyDays : undefined,
        customDates: frequency === 'custom' ? customDates : undefined,
        category: selectedCategory,
      };

      if (isEditing && editingHabit) {
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
      console.error('습관 저장 실패:', error);
      Alert.alert(
        '오류',
        `습관 ${isEditing ? '수정' : '추가'}에 실패했습니다.`,
      );
    }
  };

  const handleDelete = () => {
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
              console.error('습관 삭제 실패:', error);
              Alert.alert('오류', '습관 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate.goBack()}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? '습관 수정' : '새 습관 추가'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 습관 이름 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>습관 이름</Text>
          <TextInput
            ref={nameInputRef}
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

        {/* 이모지 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이모지 선택</Text>
          <View style={styles.emojiContainer}>
            {commonEmojis.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  selectedEmoji === emoji && styles.selectedEmoji,
                ]}
                onPress={() => setSelectedEmoji(emoji)}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 카테고리 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {categories.map(category => (
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
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.key &&
                      styles.selectedCategoryText,
                  ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 빈도 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빈도</Text>

          {FREQUENCY_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.frequencyOption,
                frequency === option.key && styles.selectedOption,
              ]}
              onPress={() => setFrequency(option.key as any)}>
              <View style={styles.frequencyContent}>
                <Text
                  style={[
                    styles.frequencyText,
                    frequency === option.key && styles.selectedText,
                  ]}>
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.frequencyDesc,
                    frequency === option.key && styles.selectedDesc,
                  ]}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  frequency === option.key && styles.radioSelected,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* 매주 요일 선택 */}
        {frequency === 'weekly' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>요일 선택 (복수 선택 가능)</Text>
            <View style={styles.daysContainer}>
              {weekDays.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayButton,
                    weeklyDays.includes(day.value) && styles.selectedDay,
                  ]}
                  onPress={() => handleWeeklyDayToggle(day.value)}>
                  <Text
                    style={[
                      styles.dayText,
                      weeklyDays.includes(day.value) && styles.selectedDayText,
                    ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 매달 일 선택 */}
        {frequency === 'monthly' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              매달 실행할 일 선택 (복수 선택 가능)
            </Text>
            <View style={styles.monthlyDaysContainer}>
              {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.monthlyDayButton,
                    monthlyDays.includes(day) && styles.selectedMonthlyDay,
                  ]}
                  onPress={() => handleMonthlyDayToggle(day)}>
                  <Text
                    style={[
                      styles.monthlyDayText,
                      monthlyDays.includes(day) &&
                        styles.selectedMonthlyDayText,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 맞춤 날짜 선택 */}
        {frequency === 'custom' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>특정 날짜 선택</Text>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowCalendar(true)}>
              <Text style={styles.calendarButtonText}>
                달력에서 날짜 선택 ({customDates.length}개 선택됨)
              </Text>
            </TouchableOpacity>

            {customDates.length > 0 && (
              <View style={styles.selectedDatesContainer}>
                <Text style={styles.selectedDatesTitle}>선택된 날짜들:</Text>
                <View style={styles.selectedDatesList}>
                  {customDates.slice(0, 5).map(date => (
                    <View key={date} style={styles.selectedDateChip}>
                      <Text style={styles.selectedDateText}>
                        {dayjs(date).format('MM/DD')}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setCustomDates(prev => prev.filter(d => d !== date))
                        }>
                        <Text style={styles.removeDate}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {customDates.length > 5 && (
                    <Text style={styles.moreDates}>
                      +{customDates.length - 5}개 더
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 팁 섹션 */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>💡 빈도 설정 가이드</Text>
          <Text style={styles.tipText}>
            • <Text style={{fontWeight: 'bold'}}>매일</Text>: 물 마시기, 양치질
            등 일상적인 습관{'\n'}•{' '}
            <Text style={{fontWeight: 'bold'}}>매주</Text>: 운동, 청소 등
            주기적인 습관{'\n'}• <Text style={{fontWeight: 'bold'}}>매달</Text>:
            정기검진, 리뷰 등 월단위 습관{'\n'}•{' '}
            <Text style={{fontWeight: 'bold'}}>맞춤</Text>: 특별한 날짜나 이벤트
            관련 습관
          </Text>
        </View>

        {/* 삭제 버튼 - 수정 모드일 때만 표시 */}
        {isEditing && (
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}>
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
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Text style={styles.calendarDone}>완료</Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>날짜 선택</Text>
            <TouchableOpacity onPress={() => setCustomDates([])}>
              <Text style={styles.calendarClear}>전체 해제</Text>
            </TouchableOpacity>
          </View>

          <Calendar
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            markingType="dot"
            minDate={dayjs().format('YYYY-MM-DD')}
            theme={CALENDAR_THEME}
          />

          <View style={styles.calendarFooter}>
            <Text style={styles.calendarHelp}>
              날짜를 터치하여 선택/해제할 수 있습니다. {customDates.length}개
              선택됨
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
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ecf0f1',
  },
  selectedEmoji: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  emojiText: {
    fontSize: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 10,
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
  tipContainer: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
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
