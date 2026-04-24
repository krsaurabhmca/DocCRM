import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../styles/Theme";
import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function FinanceSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    default_consultation_fee: "0",
    followup_consultation_fee: "0",
    fee_validity_days: "15"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
        Alert.alert("Success", "Billing rules updated successfully!");
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Finance & Billing" }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Finance Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="wallet" size={32} color="white" />
          </View>
          <Text style={styles.headerTitle}>Billing Architecture</Text>
          <Text style={styles.headerSub}>Configure automated consultation fees and billing cycles.</Text>
        </View>

        <View style={styles.content}>
          {/* Consultation Fee Section */}
          <Text style={styles.sectionHeader}>Consultation Fees (₹)</Text>
          <View style={styles.row}>
            <View style={styles.feeCard}>
              <View style={[styles.feeIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="person-add" size={20} color={Theme.colors.primary} />
              </View>
              <Text style={styles.feeLabel}>New Patient</Text>
              <TextInput 
                style={styles.feeInput} 
                keyboardType="numeric" 
                value={settings.default_consultation_fee} 
                onChangeText={(t) => setSettings({...settings, default_consultation_fee: t})} 
              />
              <Text style={styles.feeUnit}>Per Visit</Text>
            </View>

            <View style={styles.feeCard}>
              <View style={[styles.feeIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="repeat" size={20} color="#2563EB" />
              </View>
              <Text style={styles.feeLabel}>Followup</Text>
              <TextInput 
                style={styles.feeInput} 
                keyboardType="numeric" 
                value={settings.followup_consultation_fee} 
                onChangeText={(t) => setSettings({...settings, followup_consultation_fee: t})} 
              />
              <Text style={styles.feeUnit}>Reduced Rate</Text>
            </View>
          </View>

          {/* Billing Rules Section */}
          <Text style={[styles.sectionHeader, { marginTop: 30 }]}>Automated Billing Rules</Text>
          <View style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleIconBox}>
                <Ionicons name="calendar" size={24} color={Theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>Fee Validity Period</Text>
                <Text style={styles.ruleSub}>Days until next "New Patient" fee is required</Text>
              </View>
            </View>
            
            <View style={styles.ruleInputArea}>
              <TextInput 
                style={styles.ruleInput} 
                keyboardType="numeric" 
                value={settings.fee_validity_days} 
                onChangeText={(t) => setSettings({...settings, fee_validity_days: t})} 
              />
              <Text style={styles.ruleUnit}>DAYS</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#64748B" />
              <Text style={styles.infoText}>
                Patients returning after <Text style={{fontWeight: '800'}}>{settings.fee_validity_days || 0} days</Text> will be automatically charged the New Patient fee.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, saving && styles.fabDisabled]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="save-outline" size={24} color="white" />
            <Text style={styles.fabText}>Save Billing Rules</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { padding: 30, alignItems: 'center', backgroundColor: 'white', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 4 },
  iconCircle: { width: 70, height: 70, borderRadius: 25, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },

  content: { padding: 20, paddingTop: 30 },
  sectionHeader: { fontSize: 13, fontWeight: "800", color: "#64748B", textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  
  row: { flexDirection: 'row', gap: 15 },
  feeCard: { flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  feeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  feeLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
  feeInput: { fontSize: 28, fontWeight: '900', color: '#1E293B', padding: 0 },
  feeUnit: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 4 },

  ruleCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  ruleIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: Theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  ruleTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  ruleSub: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  
  ruleInputArea: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 10, paddingVertical: 15, backgroundColor: '#F8FAFC', borderRadius: 18 },
  ruleInput: { fontSize: 36, fontWeight: '900', color: Theme.colors.primary },
  ruleUnit: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingHorizontal: 5 },
  infoText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18, fontStyle: 'italic' },

  fab: { 
    position: 'absolute', 
    bottom: 30, 
    left: 30, 
    right: 30, 
    backgroundColor: Theme.colors.primary, 
    height: 65, 
    borderRadius: 22, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12, 
    elevation: 8,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12
  },
  fabDisabled: { backgroundColor: '#94A3B8', elevation: 0 },
  fabText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
