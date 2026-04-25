import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../Config";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WorkingDays() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayHours, setDayHours] = useState<any>({});

  // Custom Time Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickingDay, setPickingDay] = useState("");
  const [pickingType, setPickingType] = useState<'open' | 'close'>('open');
  const [tempTime, setTempTime] = useState({ hour: "10", minute: "00", period: "AM" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${Config.API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": Config.API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        const workingStr = json.data.working_days || "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
        setSelectedDays(workingStr.split(",").filter((d: string) => d.length > 0));

        try {
          const hours = JSON.parse(json.data.working_hours || "{}");
          setDayHours(hours);
        } catch (e) {
          setDayHours({});
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
      if (!dayHours[day]) {
        setDayHours({
          ...dayHours,
          [day]: { open: "10:00 AM", close: "08:00 PM" }
        });
      }
    }
  };

  const applyToAll = (sourceDay: string) => {
    const sourceHours = dayHours[sourceDay];
    if (!sourceHours) return;

    const newHours = { ...dayHours };
    selectedDays.forEach(day => {
      newHours[day] = { ...sourceHours };
    });
    setDayHours(newHours);
    Alert.alert("Schedule Updated", `Copied ${sourceDay}'s timings to all selected working days.`);
  };

  const openPicker = (day: string, type: 'open' | 'close') => {
    setPickingDay(day);
    setPickingType(type);
    const currentTime = dayHours[day]?.[type] || (type === 'open' ? "10:00 AM" : "08:00 PM");
    const [time, period] = currentTime.split(' ');
    const [h, m] = time.split(':');
    setTempTime({ hour: h, minute: m, period: period || "AM" });
    setPickerVisible(true);
  };

  const confirmTime = () => {
    let h = parseInt(tempTime.hour || "0");
    let m = parseInt(tempTime.minute || "0");
    
    if (isNaN(h)) h = 0;
    if (h > 12) h = 12;
    if (isNaN(m)) m = 0;
    if (m > 59) m = 59;

    const formattedHour = h.toString().padStart(2, '0');
    const formattedMin = m.toString().padStart(2, '0');
    const formattedTime = `${formattedHour}:${formattedMin} ${tempTime.period}`;
    
    setDayHours({
      ...dayHours,
      [pickingDay]: { ...dayHours[pickingDay], [pickingType]: formattedTime }
    });
    setPickerVisible(false);
  };

  const updateHours = (day: string, type: 'open' | 'close', val: string) => {
    setDayHours({
      ...dayHours,
      [day]: { ...dayHours[day], [type]: val }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${Config.API_BASE}?action=save_app_settings`, {
        method: "POST",
        headers: {
          "X-API-KEY": Config.API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          working_days: selectedDays.join(","),
          working_hours: JSON.stringify(dayHours)
        })
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Operating schedule and timings updated!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Clinic Operating Schedule" }} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Daily Timings</Text>
              <Text style={styles.headerSub}>Set specific hours for each day or apply a master schedule.</Text>
            </View>

            <View style={styles.section}>
              {DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <View key={day} style={[styles.dayCard, isSelected && styles.dayCardSelected]}>
                    <TouchableOpacity 
                      style={styles.dayHeader}
                      onPress={() => toggleDay(day)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dayInfo}>
                        <View style={[styles.dot, { backgroundColor: isSelected ? Theme.colors.success : '#CBD5E1' }]} />
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                      </View>
                      <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={isSelected ? Theme.colors.success : "#CBD5E1"} 
                      />
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={styles.timeRow}>
                        <View style={styles.timeInputs}>
                          <TouchableOpacity 
                            style={styles.timeBox}
                            onPress={() => openPicker(day, 'open')}
                          >
                            <Text style={styles.timeLabel}>Opening Time</Text>
                            <View style={styles.timeDisplay}>
                              <Ionicons name="time-outline" size={16} color={Theme.colors.primary} />
                              <Text style={styles.timeDisplayText}>{dayHours[day]?.open || "10:00 AM"}</Text>
                            </View>
                          </TouchableOpacity>
                          <View style={styles.timeDivider} />
                          <TouchableOpacity 
                            style={styles.timeBox}
                            onPress={() => openPicker(day, 'close')}
                          >
                            <Text style={styles.timeLabel}>Closing Time</Text>
                            <View style={styles.timeDisplay}>
                              <Ionicons name="time-outline" size={16} color={Theme.colors.primary} />
                              <Text style={styles.timeDisplayText}>{dayHours[day]?.close || "08:00 PM"}</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.applyBtn} 
                          onPress={() => applyToAll(day)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="copy-outline" size={16} color="white" />
                          <Text style={styles.applyBtnText}>Apply All</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footerAction}>
            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.disabledBtn]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                  <Text style={styles.saveBtnText}>Confirm Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Modal
            visible={pickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Set {pickingType === 'open' ? 'Opening' : 'Closing'} Time</Text>
                <Text style={styles.pickerSub}>{pickingDay}</Text>
                
                <View style={styles.pickerContent}>
                  <View style={styles.pickerCol}>
                    <Text style={styles.pickerColLabel}>Hour</Text>
                    <TextInput 
                      style={styles.pickerInput}
                      keyboardType="numeric"
                      maxLength={2}
                      value={tempTime.hour}
                      onChangeText={(v) => setTempTime({ ...tempTime, hour: v })}
                    />
                  </View>
                  <Text style={styles.pickerSep}>:</Text>
                  <View style={styles.pickerCol}>
                    <Text style={styles.pickerColLabel}>Min</Text>
                    <TextInput 
                      style={styles.pickerInput}
                      keyboardType="numeric"
                      maxLength={2}
                      value={tempTime.minute}
                      onChangeText={(v) => setTempTime({ ...tempTime, minute: v })}
                    />
                  </View>
                  <View style={styles.periodCol}>
                    <TouchableOpacity 
                      style={[styles.periodBtn, tempTime.period === 'AM' && styles.periodBtnActive]}
                      onPress={() => setTempTime({ ...tempTime, period: 'AM' })}
                    >
                      <Text style={[styles.periodText, tempTime.period === 'AM' && styles.periodTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.periodBtn, tempTime.period === 'PM' && styles.periodBtnActive]}
                      onPress={() => setTempTime({ ...tempTime, period: 'PM' })}
                    >
                      <Text style={[styles.periodText, tempTime.period === 'PM' && styles.periodTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.pickerActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setPickerVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={confirmTime}>
                    <Text style={styles.confirmBtnText}>Set Time</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: Theme.spacing.xxl,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.lg
  },
  headerTitle: { ...Theme.typography.h1, color: Theme.colors.text.main },
  headerSub: { ...Theme.typography.caption, color: Theme.colors.text.muted, marginTop: 4 },

  section: { marginTop: Theme.spacing.md, paddingHorizontal: Theme.spacing.md },

  dayCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.xl,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dayCardSelected: {
    borderColor: Theme.colors.primary + '30',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
  },
  dayInfo: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayText: { ...Theme.typography.body, color: Theme.colors.text.muted, fontWeight: '600' },
  dayTextSelected: { color: Theme.colors.text.main, fontWeight: '800' },

  timeRow: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    backgroundColor: '#FAFAFA'
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md
  },
  timeBox: { flex: 1 },
  timeLabel: { ...Theme.typography.small, color: Theme.colors.text.light, textTransform: 'uppercase', marginBottom: 6 },

  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.sm + 4,
    borderRadius: Theme.roundness.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  timeDisplayText: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary },
  timeDivider: { width: 1, height: 24, backgroundColor: Theme.colors.border, marginHorizontal: 10 },

  applyBtn: {
    backgroundColor: Theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.roundness.md,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: Theme.spacing.sm
  },
  applyBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },

  footerAction: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? Theme.spacing.xl : Theme.spacing.lg
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: Theme.roundness.lg,
    elevation: 4,
    gap: 12,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  disabledBtn: { backgroundColor: Theme.colors.text.light },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: "800" },

  // Modal / Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pickerCard: {
    backgroundColor: Theme.colors.surface,
    width: '85%',
    borderRadius: Theme.roundness.xl + 10,
    padding: Theme.spacing.xl,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  pickerTitle: { ...Theme.typography.h2, color: Theme.colors.text.main, textAlign: 'center' },
  pickerSub: { ...Theme.typography.caption, color: Theme.colors.text.muted, textAlign: 'center', marginBottom: Theme.spacing.xl },

  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: Theme.spacing.xxl
  },
  pickerCol: { alignItems: 'center' },
  pickerColLabel: { ...Theme.typography.small, color: Theme.colors.text.light, textTransform: 'uppercase', marginBottom: 8 },
  pickerInput: {
    backgroundColor: Theme.colors.background,
    width: 65,
    height: 70,
    borderRadius: Theme.roundness.lg,
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  pickerSep: { fontSize: 28, fontWeight: '800', color: Theme.colors.text.light, marginTop: 20 },

  periodCol: { gap: 10, marginLeft: 15 },
  periodBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  periodBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  periodText: { fontSize: 14, fontWeight: '700', color: Theme.colors.text.muted },
  periodTextActive: { color: 'white' },

  pickerActions: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: Theme.colors.text.muted },
  confirmBtn: {
    flex: 2,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    borderRadius: Theme.roundness.lg,
    alignItems: 'center'
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
