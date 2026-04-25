import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function FollowupSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    greeting_template_id: "",
    reminder_template_id: "",
    followup_template_id: "",
    reminder_interval_days: "3",
    reminder_time: "10:00 AM",
    next_visit_interval_days: "7",
    enable_email: "1",
    enable_father_name: "0"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tempRes = await fetch(`${API_BASE}?action=get_templates`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const tempJson = await tempRes.json();
      if (tempJson.success) setTemplates(tempJson.data);

      const setRes = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const setJson = await setRes.json();
      if (setJson.success) {
        setSettings(prev => ({ ...prev, ...setJson.data }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_app_settings`, {
        method: "POST",
        headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Followup settings updated!");
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const renderTemplatePicker = (label: string, value: string, onChange: (id: string) => void) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {templates.map(t => (
          <TouchableOpacity 
            key={t.id} 
            style={[styles.templateChip, value === t.id.toString() && styles.selectedChip]}
            onPress={() => onChange(t.id.toString())}
          >
            <Ionicons 
              name={t.content_type === "Text" ? "chatbubble" : (t.content_type === "Image" ? "image" : "videocam")} 
              size={14} 
              color={value === t.id.toString() ? "white" : "#64748B"} 
            />
            <Text style={[styles.chipText, value === t.id.toString() && styles.selectedChipText]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0284C7" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Messaging & Reminders" }} />
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Automated Templates</Text>
        {renderTemplatePicker("Greeting Message", settings.greeting_template_id, (id) => setSettings({...settings, greeting_template_id: id}))}
        {renderTemplatePicker("Today's Reminder", settings.reminder_template_id, (id) => setSettings({...settings, reminder_template_id: id}))}
        {renderTemplatePicker("General Followup", settings.followup_template_id, (id) => setSettings({...settings, followup_template_id: id}))}

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Schedules</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reminder Delay & Time</Text>
          <View style={styles.row}>
            <View style={styles.inputBox}>
              <TextInput style={styles.input} keyboardType="numeric" value={settings.reminder_interval_days} onChangeText={(t) => setSettings({...settings, reminder_interval_days: t})} />
              <Text style={styles.inputSub}>Days Later</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput style={styles.input} placeholder="10:00 AM" value={settings.reminder_time} onChangeText={(t) => setSettings({...settings, reminder_time: t})} />
              <Text style={styles.inputSub}>Send At</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Default Next Visit</Text>
          <View style={styles.row}>
            <View style={styles.inputBox}>
              <TextInput style={styles.input} keyboardType="numeric" value={settings.next_visit_interval_days} onChangeText={(t) => setSettings({...settings, next_visit_interval_days: t})} />
              <Text style={styles.inputSub}>Gap (Days)</Text>
            </View>
            <View style={{flex:1}} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Patient Form Customization</Text>
        <View style={styles.inputGroup}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Collect Email Address</Text>
            <TouchableOpacity 
              onPress={() => setSettings({...settings, enable_email: settings.enable_email === "1" ? "0" : "1"})}
              style={[styles.toggleBtn, settings.enable_email === "1" && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, settings.enable_email === "1" && styles.toggleActiveText]}>
                {settings.enable_email === "1" ? "ENABLED" : "DISABLED"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.toggleRow, { marginTop: 15 }]}>
            <Text style={styles.label}>Collect Father's Name</Text>
            <TouchableOpacity 
              onPress={() => setSettings({...settings, enable_father_name: settings.enable_father_name === "1" ? "0" : "1"})}
              style={[styles.toggleBtn, settings.enable_father_name === "1" && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, settings.enable_father_name === "1" && styles.toggleActiveText]}>
                {settings.enable_father_name === "1" ? "ENABLED" : "DISABLED"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Update Followup Rules</Text>}
        </TouchableOpacity>
      </View>
      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "white", margin: 15, padding: 20, borderRadius: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 8 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#64748B", marginBottom: 10 },
  pickerScroll: { flexDirection: "row" },
  templateChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#F1F5F9", borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#E2E8F0", gap: 6 },
  selectedChip: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  selectedChipText: { color: "white" },
  row: { flexDirection: "row", gap: 15 },
  inputBox: { flex: 1 },
  input: { height: 45, backgroundColor: "#F1F5F9", borderRadius: 8, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0" },
  inputSub: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4, textTransform: "uppercase" },
  saveBtn: { backgroundColor: "#0284C7", paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  toggleActive: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
  toggleText: { fontSize: 11, fontWeight: "800", color: "#64748B" },
  toggleActiveText: { color: "white" },
});
