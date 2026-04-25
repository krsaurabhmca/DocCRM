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

import { Config } from "../../Config";

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
      const response = await fetch(`${API_BASE}?action=get_default_template`, {
        headers: { "X-API-KEY": API_KEY }
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
      const response = await fetch(`${API_BASE}?action=get_patient&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setPatient(json.data);
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
        const response = await fetch(`${API_BASE}?action=delete_patient&id=${id}`, {
          headers: { "X-API-KEY": API_KEY }
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0284C7" /></View>;
  if (!patient) return <View style={styles.center}><Text>Patient not found.</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Patient Profile" }} />
      
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
        </View>
        <Text style={styles.patientName}>{patient.name}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtext}>{patient.age} Years • {patient.gender || 'Patient'}</Text>
          <View style={styles.regBadge}>
            <Text style={styles.regBadgeText}>Registered: {new Date(patient.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionItem} onPress={() => Linking.openURL(`tel:${patient.phone}`)}>
          <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}><Ionicons name="call" size={20} color="#0284C7" /></View>
          <Text style={styles.actionLabel}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={openWhatsApp}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}><Ionicons name="logo-whatsapp" size={20} color="#059669" /></View>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push({ pathname: "/add-patient", params: { id: patient.id } })}>
          <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}><Ionicons name="create" size={20} color="#7C3AED" /></View>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={deletePatient}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFF1F2' }]}><Ionicons name="trash" size={20} color="#E11D48" /></View>
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <View style={styles.card}>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={18} color="#64748B" />
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{patient.phone}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="pricetags-outline" size={18} color="#64748B" />
            <Text style={styles.detailLabel}>Groups:</Text>
            <View style={styles.chipRow}>
              {patient.categories?.map((c: any, i: number) => (
                <View key={i} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
              ))}
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={18} color="#64748B" />
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={[styles.detailValue, { flex: 1 }]}>{patient.address || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visit & Followup History</Text>
          <TouchableOpacity onPress={() => router.push({ 
            pathname: "/add-followup", 
            params: { patientId: patient.id, patientName: patient.name } 
          })}>
            <Text style={styles.addText}>+ Add New</Text>
          </TouchableOpacity>
        </View>
        
        {patient.history && patient.history.length > 0 ? (
          <View style={styles.historyList}>
            {patient.history.map((h: any) => (
              <View key={h.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyLine} />
                  <View style={[styles.historyDot, { backgroundColor: h.status === 'Completed' ? '#059669' : '#EA580C' }]} />
                </View>
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(h.followup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    <View style={styles.row}>
                      {h.fee > 0 && <Text style={styles.feeBadge}>₹{h.fee}</Text>}
                      <View style={[styles.statusBadge, { backgroundColor: h.status === 'Completed' ? '#ECFDF5' : '#FFF7ED', marginLeft: 8 }]}>
                        <Text style={[styles.statusText, { color: h.status === 'Completed' ? '#059669' : '#EA580C' }]}>{h.status}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.historyType}>{h.followup_type}</Text>
                  {h.notes && <Text style={styles.historyNotes}>{h.notes}</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No previous visits recorded.</Text>
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
  profileHeader: { backgroundColor: "white", padding: 30, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#0284C7", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: "700", color: "white" },
  patientName: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  headerInfo: { alignItems: 'center', marginTop: 5 },
  headerSubtext: { fontSize: 14, color: "#64748B" },
  regBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  regBadgeText: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  actionBar: { flexDirection: "row", justifyContent: "space-around", padding: 20, backgroundColor: "white", marginBottom: 10 },
  actionItem: { alignItems: "center" },
  actionIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 5 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#475569" },
  section: { padding: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  addText: { fontSize: 13, color: "#0284C7", fontWeight: "600" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: "#64748B", width: 70 },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#334155" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, flex: 1 },
  chip: { backgroundColor: "#F0F9FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: "600", color: "#0284C7" },
  historyList: { paddingLeft: 10 },
  historyItem: { flexDirection: "row", minHeight: 80 },
  historyLeft: { width: 30, alignItems: "center" },
  historyLine: { position: "absolute", width: 2, height: "100%", backgroundColor: "#E2E8F0" },
  historyDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5, zIndex: 1, borderWidth: 2, borderColor: "white" },
  historyContent: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: 15, marginBottom: 15, marginLeft: 5, borderWidth: 1, borderColor: "#F1F5F9" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  historyDate: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  feeBadge: { fontSize: 12, fontWeight: "700", color: "#059669", backgroundColor: "#F0FDF4", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyType: { fontSize: 14, fontWeight: "600", color: "#0284C7" },
  historyNotes: { fontSize: 13, color: "#64748B", marginTop: 5, fontStyle: "italic" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "700" },
  emptyCard: { backgroundColor: "white", borderRadius: 16, padding: 30, alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#CBD5E1" },
  emptyText: { fontSize: 14, color: "#94A3B8", marginTop: 10 },
});
