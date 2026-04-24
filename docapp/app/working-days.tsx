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
  Modal
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
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
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
                        <View style={styles.timeBox}>
                          <Text style={styles.timeLabel}>Opening Time</Text>
                          <TextInput 
                            style={styles.timeInput}
                            value={dayHours[day]?.open || "10:00 AM"}
                            onChangeText={(v) => updateHours(day, 'open', v)}
                          />
                        </View>
                        <View style={styles.timeDivider} />
                        <View style={styles.timeBox}>
                          <Text style={styles.timeLabel}>Closing Time</Text>
                          <TextInput 
                            style={styles.timeInput}
                            value={dayHours[day]?.close || "08:00 PM"}
                            onChangeText={(v) => updateHours(day, 'close', v)}
                          />
                        </View>
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 25, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },
  
  section: { marginTop: 20, paddingHorizontal: 15 },
  dayCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  dayCardSelected: {
    borderColor: Theme.colors.success + '40',
    backgroundColor: 'white',
    elevation: 3
  },
  dayHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18, 
  },
  dayInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  dayTextSelected: { color: '#1E293B', fontWeight: '800' },

  timeRow: { 
    paddingHorizontal: 18, 
    paddingBottom: 18, 
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  timeBox: { flex: 1 },
  timeLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 },
  timeInput: { fontSize: 16, fontWeight: '700', color: Theme.colors.primary, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, textAlign: 'center' },
  timeDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0', marginHorizontal: 10 },
  
  applyBtn: { 
    backgroundColor: '#6366F1', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    borderRadius: 10, 
    gap: 8 
  },
  applyBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  
  footerAction: { padding: 25, alignItems: "center" },
  saveBtn: { backgroundColor: Theme.colors.primary, width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 16, elevation: 4, gap: 12 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
