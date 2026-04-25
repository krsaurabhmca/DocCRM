import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../styles/Theme";
import { GlobalStyles } from "../styles/GlobalStyles";
import { Calendar } from "react-native-calendars";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function AddFollowup() {
  const router = useRouter();
  const { patientId, patientName, searchMode } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [keyboardMode, setKeyboardMode] = useState<'phone' | 'text'>(searchMode === 'phone' ? 'phone' : 'text');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [form, setForm] = useState({
    followup_date: "",
    followup_type: "Routine Checkup",
    fee: "0",
    notes: ""
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>([]);

  useEffect(() => {
    if (patientId && patientName) {
      setSelectedPatient({ id: patientId, name: patientName });
    }
    fetchSettingsAndSetDate();
  }, [patientId, patientName]);

  const fetchSettingsAndSetDate = async () => {
    try {
      // 1. Fetch Global Settings
      const setRes = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const setJson = await setRes.json();
      
      let days = 7;
      let newFee = 0;
      let followFee = 0;
      let validity = 15;

      if (setJson.success) {
        days = parseInt(setJson.data.next_visit_interval_days || "7");
        newFee = parseFloat(setJson.data.default_consultation_fee || "0");
        followFee = parseFloat(setJson.data.followup_consultation_fee || "0");
        validity = parseInt(setJson.data.fee_validity_days || "15");
        const wd = setJson.data.working_days || "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
        setWorkingDays(wd.split(","));
      }
      
      // 2. Fetch Patient History if patientId exists
      let finalFee = newFee;
      if (patientId) {
        const patRes = await fetch(`${API_BASE}?action=get_patient&id=${patientId}`, {
          headers: { "X-API-KEY": API_KEY }
        });
        const patJson = await patRes.json();
        if (patJson.success && patJson.data.history && patJson.data.history.length > 0) {
          const lastVisit = new Date(patJson.data.history[0].followup_date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= validity) {
            finalFee = followFee;
          }
        }
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      setForm(prev => ({ 
        ...prev, 
        followup_date: futureDate.toISOString().split('T')[0],
        fee: finalFee.toString()
      }));
    } catch (error) {
      console.error(error);
      setForm(prev => ({ ...prev, followup_date: new Date().toISOString().split('T')[0] }));
    }
  };

  useEffect(() => {
    if (!selectedPatient) {
      fetchPatients();
    }
  }, [search]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_patients&search=${search}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setPatients(json.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!selectedPatient || !form.followup_date) {
      Alert.alert("Error", "Please select a patient and date.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_followup`, {
        method: "POST",
        headers: { 
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          ...form
        })
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Followup scheduled!");
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: "Clinical Follow-up" }} />
      
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule Follow-up</Text>
          <Text style={styles.headerSub}>Set the next review date and consultation details.</Text>
        </View>

        {/* Patient Context */}
        <View style={styles.section}>
          {!selectedPatient ? (
            <View style={styles.inputGroup}>
              <View style={styles.searchHeader}>
                <Text style={styles.label}>Patient Search *</Text>
                <View style={styles.keyboardToggles}>
                  <TouchableOpacity 
                    onPress={() => setKeyboardMode('phone')}
                    style={[styles.miniToggle, keyboardMode === 'phone' && styles.miniToggleActive]}
                  >
                    <Ionicons name="call" size={14} color={keyboardMode === 'phone' ? 'white' : '#64748B'} />
                    <Text style={[styles.miniToggleText, keyboardMode === 'phone' && styles.miniToggleActiveText]}>Phone</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setKeyboardMode('text')}
                    style={[styles.miniToggle, keyboardMode === 'text' && styles.miniToggleActive]}
                  >
                    <Ionicons name="person" size={14} color={keyboardMode === 'text' ? 'white' : '#64748B'} />
                    <Text style={[styles.miniToggleText, keyboardMode === 'text' && styles.miniToggleActiveText]}>Name</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color="#64748B" />
                <TextInput 
                  style={styles.input} 
                  placeholder={keyboardMode === 'phone' ? "Search by 10-digit mobile..." : "Search by patient name..."}
                  value={search}
                  onChangeText={setSearch}
                  keyboardType={keyboardMode === 'phone' ? "phone-pad" : "default"}
                  autoFocus={true}
                />
              </View>
              <View style={styles.patientList}>
                {patients.slice(0, 5).map(p => (
                  <TouchableOpacity key={p.id} style={styles.patientItem} onPress={() => setSelectedPatient(p)}>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{p.name}</Text>
                      <Text style={styles.patientPhone}>{p.phone}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={Theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarText}>{selectedPatient.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedName}>{selectedPatient.name}</Text>
                  <Text style={styles.selectedSub}>Patient ID: #{selectedPatient.id}</Text>
                </View>
                {!patientId && (
                  <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.changeBtn}>
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Visit Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Visit Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Next Visit Date *</Text>
            <TouchableOpacity 
              style={styles.inputWrapper} 
              onPress={() => setShowCalendar(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Theme.colors.primary} />
              <View style={styles.dateDisplay}>
                <Text style={styles.dateDisplayText}>
                  {form.followup_date ? new Date(form.followup_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select Date"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            <Modal
              visible={showCalendar}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowCalendar(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={() => setShowCalendar(false)}
              >
                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>Select Follow-up Date</Text>
                    <TouchableOpacity onPress={() => setShowCalendar(false)}>
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <Calendar
                    current={form.followup_date}
                    onDayPress={(day: any) => {
                      const dateObj = new Date(day.dateString);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      
                      if (!workingDays.includes(dayName)) {
                        Alert.alert("Closed Day", `The clinic is scheduled to be closed on ${dayName}s. Please select a working day for the follow-up.`, [
                          { text: "OK", style: "cancel" }
                        ]);
                        return;
                      }
                      
                      setForm({ ...form, followup_date: day.dateString });
                      setShowCalendar(false);
                    }}
                    markedDates={{
                      ...(() => {
                        const marks: any = {};
                        // Dim days for the next 90 days
                        for(let i=0; i<90; i++) {
                          const d = new Date();
                          d.setDate(d.getDate() + i);
                          const dStr = d.toISOString().split('T')[0];
                          const dName = d.toLocaleDateString('en-US', { weekday: 'long' });
                          if(!workingDays.includes(dName)) {
                            marks[dStr] = { disabled: true, disableTouchEvent: true, textColor: '#CBD5E1' };
                          }
                        }
                        return marks;
                      })(),
                      [form.followup_date]: { selected: true, selectedColor: Theme.colors.primary, disableTouchEvent: false }
                    }}
                    theme={{
                      todayTextColor: Theme.colors.primary,
                      selectedDayBackgroundColor: Theme.colors.primary,
                      arrowColor: Theme.colors.primary,
                      textDayFontWeight: '600',
                      textMonthFontWeight: '800',
                      textDisabledColor: '#CBD5E1'
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.label}>Consultation Type</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="medical-outline" size={20} color="#64748B" />
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Regular"
                  value={form.followup_type}
                  onChangeText={(t) => setForm({...form, followup_type: t})}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={styles.label}>Fee (₹)</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={[styles.input, { fontWeight: 'bold', color: Theme.colors.success }]} 
                  placeholder="0"
                  keyboardType="numeric"
                  value={form.fee}
                  onChangeText={(t) => setForm({...form, fee: t})}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={18} color={Theme.colors.warning} />
            <Text style={styles.sectionTitle}>Clinical Notes</Text>
          </View>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 10, minHeight: 120 }]}>
            <TextInput 
              style={[styles.input, { textAlignVertical: 'top' }]} 
              placeholder="Instructions, diagnosis or medication notes for the next visit..."
              multiline
              numberOfLines={6}
              value={form.notes}
              onChangeText={(t) => setForm({...form, notes: t})}
            />
          </View>
        </View>

        <View style={styles.footerAction}>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={24} color="white" />
                <Text style={styles.saveBtnText}>Confirm Schedule</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.note}>An automated reminder will be prepared for the patient.</Text>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 25, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },
  section: { backgroundColor: "white", marginTop: 15, marginHorizontal: 15, padding: 20, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: "#1E293B" },
  dateDisplay: { flex: 1, paddingVertical: 14, paddingHorizontal: 10 },
  dateDisplayText: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  calendarCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, width: '100%', elevation: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  calendarTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  row: { flexDirection: "row" },
  patientList: { marginTop: 10, backgroundColor: "#F8FAFC", borderRadius: 12, overflow: 'hidden' },
  patientItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  patientPhone: { fontSize: 12, color: "#64748B", marginTop: 2 },
  selectedCard: { backgroundColor: "#F0F9FF", padding: 15, borderRadius: 12, borderWidth: 1, borderColor: "#BAE6FD" },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: '800', fontSize: 18 },
  selectedName: { fontSize: 16, fontWeight: "800", color: "#0C4A6E" },
  selectedSub: { fontSize: 12, color: "#0284C7" },
  changeBtn: { padding: 8, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' },
  changeBtnText: { fontSize: 12, fontWeight: '700', color: '#E11D48' },
  footerAction: { padding: 25, alignItems: "center" },
  saveBtn: { backgroundColor: "#EA580C", width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 16, elevation: 4, gap: 12 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
  note: { textAlign: "center", color: "#94A3B8", fontSize: 12, marginTop: 15 },
  searchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  keyboardToggles: { flexDirection: 'row', gap: 6 },
  miniToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  miniToggleActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  miniToggleText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  miniToggleActiveText: { color: 'white' },
});
