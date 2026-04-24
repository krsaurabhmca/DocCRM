import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

type TabStatus = "Scheduled" | "Completed";

export default function TodayAppointments() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabStatus>("Scheduled");
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_daily_reminders&date=${new_date()}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsDone = async (id: number) => {
    setMarkingId(id);
    try {
      const response = await fetch(`${API_BASE}?action=mark_followup_done&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        // Optimistically remove from list if in scheduled tab
        fetchData();
      } else {
        Alert.alert("Error", json.message || "Could not update status.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMarkingId(null);
    }
  };

  const new_date = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter(item => item.status === activeTab);
  const currentToken = data.find(i => i.status === 'Scheduled');

  const renderItem = ({ item }: { item: any }) => {
    // Find original index in full data for Token Number
    const tokenNumber = data.indexOf(item) + 1;

    return (
      <View style={styles.appointmentCard}>
        <View style={[styles.tokenContainer, item.status === 'Completed' && styles.completedToken]}>
          <Text style={styles.tokenLabel}>TOKEN</Text>
          <Text style={styles.tokenNumber}>{tokenNumber}</Text>
        </View>
        
        <View style={styles.patientInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.patientName}>{item.patient_name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: item.is_new ? '#DB277710' : '#0284C710' }]}>
              <Text style={[styles.typeBadgeText, { color: item.is_new ? '#DB2777' : '#0284C7' }]}>
                {item.is_new ? 'NEW' : 'OLD'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="medkit-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.followup_type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {item.status === 'Scheduled' ? (
            <TouchableOpacity 
              style={styles.markDoneBtn} 
              onPress={() => markAsDone(item.id)}
              disabled={markingId === item.id}
            >
              {markingId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.markDoneText}>Done</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Ionicons name="checkmark-circle" size={28} color="#059669" />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Today's Queue" }} />

      {/* Tabs Header */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "Scheduled" && styles.activeTab]} 
          onPress={() => setActiveTab("Scheduled")}
        >
          <Text style={[styles.tabText, activeTab === "Scheduled" && styles.activeTabText]}>
            PENDING ({data.filter(i => i.status === 'Scheduled').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "Completed" && styles.activeTab]} 
          onPress={() => setActiveTab("Completed")}
        >
          <Text style={[styles.tabText, activeTab === "Completed" && styles.activeTabText]}>
            DONE ({data.filter(i => i.status === 'Completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Now Calling Section - Only for Pending Tab */}
      {activeTab === "Scheduled" && (
        <View style={styles.callingHeader}>
          <View style={styles.callingCard}>
            <View style={styles.callingLabelRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.callingTitle}>NOW CALLING</Text>
            </View>
            {currentToken ? (
              <View style={styles.callingMain}>
                <View style={styles.callingTokenBox}>
                  <Text style={styles.callingTokenNum}>{data.indexOf(currentToken) + 1}</Text>
                </View>
                <View style={styles.callingInfo}>
                  <Text style={styles.callingName} numberOfLines={1}>{currentToken.patient_name}</Text>
                  <Text style={styles.callingSub}>{currentToken.followup_type}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.allDoneText}>All caught up! 🎉</Text>
            )}
          </View>
        </View>
      )}
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name={activeTab === 'Scheduled' ? "happy-outline" : "calendar-outline"} size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>
                {activeTab === 'Scheduled' ? "No pending patients!" : "No completed visits yet."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: Theme.colors.primary },
  tabText: { fontSize: 13, fontWeight: '800', color: '#94A3B8' },
  activeTabText: { color: Theme.colors.primary },

  callingHeader: { padding: 20, backgroundColor: 'white' },
  callingCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, elevation: 8 },
  callingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  callingTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 },
  callingMain: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  callingTokenBox: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' },
  callingTokenNum: { fontSize: 30, fontWeight: '900', color: 'white' },
  callingInfo: { flex: 1 },
  callingName: { fontSize: 18, fontWeight: '800', color: 'white' },
  callingSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  allDoneText: { fontSize: 16, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },

  list: { padding: 15 },
  appointmentCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 24, padding: 15, marginBottom: 12, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  tokenContainer: { width: 55, height: 55, borderRadius: 16, backgroundColor: Theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  completedToken: { backgroundColor: '#F1F5F9' },
  tokenLabel: { fontSize: 8, fontWeight: '800', color: Theme.colors.primary, opacity: 0.7 },
  tokenNumber: { fontSize: 22, fontWeight: '800', color: Theme.colors.primary },
  
  patientInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 9, fontWeight: '800' },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  detailText: { fontSize: 11, color: '#64748B' },
  
  actionContainer: { marginLeft: 10 },
  markDoneBtn: { backgroundColor: '#059669', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  markDoneText: { color: 'white', fontSize: 12, fontWeight: '800' },
  
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 16 },
});
