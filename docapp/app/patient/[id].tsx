import React, { useState, useEffect, useCallback } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Linking
} from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Config } from "../../Config";
import Theme from "../../styles/Theme";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function PatientProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<any>(null);
  const [defaultMessage, setDefaultMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDefaultTemplate = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(`${API_BASE}?action=get_default_template`, {
        headers: { 
            "X-API-KEY": API_KEY,
            "X-TOKEN": token
        }
      });
      const json = await response.json();
      if (json.success) {
        const t = json.data;
        const fullMessage = [t.content_part1, t.content_part2, t.content_part3]
          .filter(Boolean)
          .join("\n\n");
        setDefaultMessage(fullMessage);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchPatient = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
          router.replace("/login");
          return;
      }

      const response = await fetch(`${API_BASE}?action=get_patient&id=${id}`, {
        headers: { 
            "X-API-KEY": API_KEY,
            "X-TOKEN": token
        }
      });
      const json = await response.json();
      if (json.success) {
        setPatient(json.data);
      } else {
        if (json.message && json.message.includes("identification failed")) {
            router.replace("/login");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchPatient();
      fetchDefaultTemplate();
    }, [fetchPatient, fetchDefaultTemplate])
  );

  const deletePatient = () => {
    Alert.alert("Delete Patient", "Are you sure you want to remove this patient?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        const response = await fetch(`${API_BASE}?action=delete_patient&id=${id}`, {
          headers: { 
              "X-API-KEY": API_KEY,
              "X-TOKEN": token
          }
        });
        const json = await response.json();
        if (json.success) router.back();
      }}
    ]);
  };

  const openWhatsApp = () => {
    let text = defaultMessage;
    if (patient) {
      text = text.replace(/#Patient Name#/g, patient.name);
    }
    const encoded = encodeURIComponent(text);
    Linking.openURL(`https://wa.me/91${patient.phone}${encoded ? '?text=' + encoded : ''}`);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;
  if (!patient) return <View style={styles.center}><Text>Patient not found.</Text></View>;

  const genderColor = patient.gender === "Male" ? Theme.colors.primary : (patient.gender === "Female" ? Theme.colors.rose : Theme.colors.slate);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Patient File" }} />
      
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarLarge, { backgroundColor: genderColor }]}>
          <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
          <View style={styles.onlineBadge} />
        </View>
        <Text style={styles.patientName}>{patient.name}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtext}>{patient.age} {patient.age_unit === 'Y' ? 'Years' : (patient.age_unit === 'M' ? 'Months' : 'Days')} • {patient.gender || 'Patient'}</Text>
          <View style={styles.regBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Theme.colors.slate} style={{ marginRight: 4 }} />
            <Text style={styles.regBadgeText}>ID: {patient.patient_uid || patient.id}</Text>
          </View>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionItem} onPress={() => Linking.openURL(`tel:${patient.phone}`)}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.primaryLight }]}><Ionicons name="call" size={20} color={Theme.colors.primary} /></View>
          <Text style={styles.actionLabel}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={openWhatsApp}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.successLight }]}><Ionicons name="logo-whatsapp" size={20} color={Theme.colors.success} /></View>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push({ pathname: "/add-patient", params: { id: patient.id } })}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.warningLight }]}><Ionicons name="create" size={20} color={Theme.colors.warning} /></View>
          <Text style={styles.actionLabel}>Edit File</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={deletePatient}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.dangerLight }]}><Ionicons name="trash" size={20} color={Theme.colors.danger} /></View>
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Basic Stats Row */}
      <View style={styles.miniStats}>
        <View style={styles.miniStatCard}>
            <Text style={styles.miniStatVal}>{patient.history?.length || 0}</Text>
            <Text style={styles.miniStatLabel}>Visits</Text>
        </View>
        <View style={styles.miniStatCard}>
            <Text style={[styles.miniStatVal, { color: Theme.colors.success }]}>₹{patient.history?.reduce((acc: number, curr: any) => acc + (parseFloat(curr.fee) || 0), 0)}</Text>
            <Text style={styles.miniStatLabel}>Revenue</Text>
        </View>
        <View style={styles.miniStatCard}>
            <Text style={styles.miniStatVal}>{patient.categories?.length || 0}</Text>
            <Text style={styles.miniStatLabel}>Groups</Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <View style={styles.card}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}><Ionicons name="call-outline" size={16} color={Theme.colors.slate} /></View>
            <View>
                <Text style={styles.detailLabel}>Mobile Number</Text>
                <Text style={styles.detailValue}>{patient.phone}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}><Ionicons name="pricetags-outline" size={16} color={Theme.colors.slate} /></View>
            <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Clinical Classifications</Text>
                <View style={styles.chipRow}>
                {patient.categories?.map((c: any, i: number) => (
                    <View key={i} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
                ))}
                </View>
            </View>
          </View>
          <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
            <View style={styles.detailIcon}><Ionicons name="location-outline" size={16} color={Theme.colors.slate} /></View>
            <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Residential Address</Text>
                <Text style={styles.detailValue}>{patient.address || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visit Timeline</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => router.push({ 
                pathname: "/add-followup", 
                params: { patientId: patient.id, patientName: patient.name } 
            })}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addText}>New Visit</Text>
          </TouchableOpacity>
        </View>
        
        {patient.history && patient.history.length > 0 ? (
          <View style={styles.historyList}>
            {patient.history.map((h: any) => (
              <View key={h.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyLine} />
                  <View style={[styles.historyDot, { backgroundColor: h.status === 'Completed' ? Theme.colors.success : Theme.colors.warning }]} />
                </View>
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(h.followup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: h.status === 'Completed' ? Theme.colors.successLight : Theme.colors.warningLight }]}>
                        <Text style={[styles.statusText, { color: h.status === 'Completed' ? Theme.colors.success : Theme.colors.warning }]}>{h.status}</Text>
                    </View>
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historyType}>{h.followup_type}</Text>
                    {h.fee > 0 && <Text style={styles.feeBadge}>₹{h.fee}</Text>}
                  </View>
                  {h.notes && (
                    <View style={styles.notesBox}>
                        <Ionicons name="chatbox-ellipses-outline" size={14} color={Theme.colors.slate} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={styles.historyNotes}>{h.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={40} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No clinical history found.</Text>
          </View>
        )}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileHeader: { backgroundColor: "white", paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  avatarLarge: { width: 90, height: 90, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 15, position: 'relative' },
  avatarText: { fontSize: 36, fontWeight: "800", color: "white" },
  onlineBadge: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#22C55E', borderSize: 4, borderColor: 'white', borderWidth: 4 },
  patientName: { fontSize: 26, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5 },
  headerInfo: { alignItems: 'center', marginTop: 8 },
  headerSubtext: { fontSize: 15, color: "#64748B", fontWeight: "600" },
  regBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  regBadgeText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  actionBar: { flexDirection: "row", justifyContent: "space-around", padding: 20, backgroundColor: "white", marginTop: 20, marginHorizontal: 20, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  actionItem: { alignItems: "center" },
  actionIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "700", color: "#475569" },
  miniStats: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  miniStatCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  miniStatVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  miniStatLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginTop: 2 },
  section: { padding: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  addText: { fontSize: 13, color: "white", fontWeight: "700" },
  card: { backgroundColor: "white", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#F1F5F9" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 11, fontWeight: "700", color: "#94A3B8", textTransform: 'uppercase' },
  detailValue: { fontSize: 15, fontWeight: "700", color: "#334155", marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { backgroundColor: Theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "700", color: Theme.colors.primary },
  historyList: { paddingLeft: 5 },
  historyItem: { flexDirection: "row", minHeight: 100 },
  historyLeft: { width: 30, alignItems: "center" },
  historyLine: { position: "absolute", width: 2, height: "100%", backgroundColor: "#E2E8F0" },
  historyDot: { width: 14, height: 14, borderRadius: 7, marginTop: 5, zIndex: 1, borderWidth: 3, borderColor: "white" },
  historyContent: { flex: 1, backgroundColor: "white", borderRadius: 20, padding: 18, marginBottom: 15, marginLeft: 10, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  historyDate: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  historyBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeBadge: { fontSize: 14, fontWeight: "800", color: Theme.colors.success },
  historyType: { fontSize: 15, fontWeight: "700", color: Theme.colors.primary },
  notesBox: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 12 },
  historyNotes: { flex: 1, fontSize: 13, color: "#64748B", lineHeight: 18, fontStyle: "italic" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: 'uppercase' },
  emptyCard: { backgroundColor: "white", borderRadius: 24, padding: 40, alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#CBD5E1" },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "600", marginTop: 12 },
});
