import Theme from "../styles/Theme";
import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Alert,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Config } from "../Config";
import { useAuth } from "./_layout";

const { width } = Dimensions.get("window");

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

type TabType = "Home" | "Patients" | "Reminders";

export default function Index() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("Home");

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            setIsAuthenticated(false);
            router.replace("/login");
          }
        }
      ]
    );
  };
  const [data, setData] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<any>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let action = "";
    if (activeTab === "Patients") action = "get_patients";
    else if (activeTab === "Reminders") action = "get_daily_reminders";
    else if (activeTab === "Home") action = "get_dashboard_stats";

    try {
      let url = `${API_BASE}?action=${action}&search=${encodeURIComponent(searchQuery)}`;
      if (activeTab === "Reminders") {
        url += `&date=${selectedDate}`;
      }

      const response = await fetch(url, {
        headers: { "X-API-KEY": API_KEY }
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const json = JSON.parse(text);
      if (json.success) {
        if (activeTab === "Home") {
          setDashboardStats(json.data);
        } else {
          setData(json.data);
        }
      } else {
        setError(json.message || "Failed to fetch data");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "Network request failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const fetchMarkedDates = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_reminder_counts`, {
        headers: { "X-API-KEY": API_KEY }
      });
      
      if (!response.ok) return;
      
      const text = await response.text();
      if (!text) return;
      
      const json = JSON.parse(text);
      if (json.success) {
        setMarkedDates({
          ...json.data,
          [selectedDate]: {
            ...json.data[selectedDate],
            selected: true,
            selectedColor: '#EA580C'
          }
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === "Reminders") {
      fetchMarkedDates();
    }
  }, [activeTab, selectedDate]);

  const deleteItem = (id: number, type: "Category" | "Campaign") => {
    Alert.alert(
      `Delete ${type}`,
      `Are you sure you want to delete this ${type.toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              let action = "";
              if (type === "Category") action = "delete_category";
              else if (type === "Campaign") action = "delete_campaign";
              else if (type === "Templates") action = "delete_template";
              else if (type === "Reminders") action = "delete_followup";

              const response = await fetch(`${API_BASE}?action=${action}&id=${id}`, {
                headers: { "X-API-KEY": API_KEY }
              });
              const json = await response.json();
              if (json.success) {
                fetchData();
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderHome = () => {
    if (!dashboardStats) return <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 50 }} />;

    return (
      <ScrollView style={styles.homeContainer}>
        {/* Clinical Session Control Center */}
        <View style={styles.onboardingCard}>
          <View style={styles.onboardingHeader}>
            <View style={styles.sessionBadge}>
              <Ionicons name="flash" size={12} color="white" />
              <Text style={styles.sessionBadgeText}>Active Session</Text>
            </View>
            <Text style={styles.onboardingTitle}>Medical Desk Control</Text>
          </View>
          <Text style={styles.onboardingSub}>Quickly process new or returning patients for their consultation.</Text>

          <View style={styles.onboardingActions}>
            <TouchableOpacity
              style={[styles.onboardingBtn, { backgroundColor: Theme.colors.primary }]}
              onPress={() => router.push("/add-patient")}
            >
              <View style={styles.onboardingIconBox}>
                <Ionicons name="person-add" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.onboardingBtnText}>New File</Text>
                <Text style={styles.onboardingBtnSub}>Registration</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.onboardingBtn, { backgroundColor: Theme.colors.success }]}
              onPress={() => router.push({ pathname: "/add-followup", params: { searchMode: 'phone' } })}
            >
              <View style={styles.onboardingIconBox}>
                <Ionicons name="repeat" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.onboardingBtnText}>Follow-up</Text>
                <Text style={styles.onboardingBtnSub}>Existing Patient</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.queueAction}
            onPress={() => router.push("/today-appointments")}
          >
            <Ionicons name="list" size={20} color={Theme.colors.primary} />
            <Text style={styles.queueActionText}>View Today's Appointment Queue</Text>
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>{dashboardStats.today_reminders}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Theme.colors.primaryLight }]}>
            <View style={[styles.statIcon, { backgroundColor: '#BAE6FD' }]}>
              <Ionicons name="people" size={18} color={Theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{dashboardStats.patients}</Text>
            <Text style={styles.statLabel}>Total Database</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Theme.colors.warningLight }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="calendar" size={18} color={Theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>{dashboardStats.today_reminders}</Text>
            <Text style={styles.statLabel}>Today Queue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Theme.colors.successLight }]}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trending-up" size={18} color={Theme.colors.success} />
            </View>
            <Text style={styles.statValue}>{dashboardStats.new_patients}</Text>
            <Text style={styles.statLabel}>New Growth</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="medkit" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{dashboardStats.templates}</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Patient Growth (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: dashboardStats.growth_labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ data: dashboardStats.growth || [0, 0, 0, 0, 0, 0, 0] }]
            }}
            width={width - 40}
            height={200}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "6", strokeWidth: "2", stroke: "#0284C7" }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/add-patient")}>
              <Ionicons name="person-add" size={24} color="#0284C7" />
              <Text style={styles.actionText}>Add Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/add-followup")}>
              <Ionicons name="time" size={24} color="#EA580C" />
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/start-campaign")}>
              <Ionicons name="megaphone-outline" size={24} color="#6366F1" />
              <Text style={styles.actionText}>Bulk Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === "Patients") {
      const genderColor = item.gender === "Male" ? "#0284C7" : (item.gender === "Female" ? "#DB2777" : "#64748B");
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => router.push({ pathname: "/patient/[id]", params: { id: item.id } })}
        >
          <View style={[styles.avatarCircle, { backgroundColor: genderColor + '15' }]}>
            <Ionicons
              name="person-outline"
              size={24}
              color={genderColor}
            />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.ageTag, { backgroundColor: genderColor + '10', color: genderColor }]}>
                {item.age} {item.age_unit === 'Y' ? 'yrs' : (item.age_unit === 'M' ? 'mos' : 'days')}
              </Text>
            </View>
            <Text style={styles.itemSub}>{item.phone}</Text>
            {item.address && <Text style={styles.itemAddress} numberOfLines={1}>{item.address}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      );
    } else if (activeTab === "Reminders") {
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => router.push({ pathname: "/patient/[id]", params: { id: item.patient_id } })}
        >
          <View style={[styles.avatarCircle, { backgroundColor: (item.gender === "Female" ? "#DB2777" : "#0284C7") + '15' }]}>
            <Ionicons
              name="person-outline"
              size={24}
              color={item.gender === "Female" ? "#DB2777" : "#0284C7"}
            />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.patient_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'Completed' ? '#ECFDF5' : '#FFF7ED' }]}>
                <Text style={[styles.statusText, { color: item.status === 'Completed' ? '#059669' : '#EA580C' }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.itemSubtext}>{item.followup_type}: {item.notes}</Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" translucent={false} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0284C7' }} />

      {/* Modern Medical Header */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchBar}>
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(""); fetchData(); }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              placeholderTextColor="#CBD5E1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              onSubmitEditing={fetchData}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); fetchData(); }}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.headerBrand}>
              <View style={styles.logoBadge}>
                <Ionicons name="pulse" size={20} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.headerTitle}>{activeTab === "Reminders" ? "Reminders" : "DocCRM"}</Text>
                <Text style={styles.headerSubtext}>Clinic Admin Console</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setIsSearching(true)}>
                <Ionicons name="search-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
                <Ionicons name="power-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: 'white' }}>

        {/* WhatsApp Style Tabs */}
        <View style={styles.tabs}>
          {(["Home", "Patients", "Reminders"] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Reminders" && (
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                todayTextColor: '#EA580C',
                todayButtonFontWeight: 'bold',
                arrowColor: '#EA580C',
                indicatorColor: '#EA580C',
                selectedDayBackgroundColor: '#EA580C',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textMonthFontWeight: 'bold',
              }}
            />
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>Patients for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
            </View>
          </View>
        )}

        {loading && activeTab !== "Home" ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0284C7" />
          </View>
        ) : activeTab === "Home" ? (
          renderHome()
        ) : (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="folder-open-outline" size={80} color="#CBD5E1" />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found.</Text>
              </View>
            }
          />
        )}

        {/* Dynamic Floating Action Button - Hidden on Home */}
        {activeTab !== "Home" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              if (activeTab === "Patients") router.push("/add-patient");
              else if (activeTab === "Reminders") router.push("/add-followup");
            }}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: { backgroundColor: "#0284C7", paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: "white", justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  headerSubtext: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 15, height: 45 },
  searchInput: { flex: 1, color: "white", fontSize: 18, fontWeight: "500" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerBtn: { padding: 8, marginLeft: 5 },
  tabs: { backgroundColor: "#0284C7", flexDirection: "row", paddingTop: 5 },
  tab: { flex: 1, paddingVertical: 15, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "white" },
  tabText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 13 },
  activeTabText: { color: "white" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  listItem: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16, alignItems: "center" },
  itemContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 16 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  itemSub: { fontSize: 14, color: "#64748B", marginTop: 2 },
  itemAddress: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ageTag: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  avatarCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemSubtext: { fontSize: 14, color: "#64748B", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  emptyText: { color: "#94A3B8", fontSize: 16, fontWeight: "600", marginTop: 20 },
  fab: { position: "absolute", bottom: 30, right: 25, backgroundColor: Theme.colors.success, width: 64, height: 64, borderRadius: 24, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#059669", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  calendarContainer: { backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  dateHeader: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#F8FAFC", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  dateHeaderText: { fontSize: 13, fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: 1 },
  homeContainer: { flex: 1, padding: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  statCard: { width: (width - 55) / 2, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  statIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginTop: 4 },
  chartSection: { marginTop: 25, backgroundColor: "white", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 20 },
  quickActions: { marginTop: 25 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, backgroundColor: "white", padding: 18, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9", gap: 10 },
  actionText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  onboardingCard: { backgroundColor: "white", padding: 20, borderRadius: 28, elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 25 },
  onboardingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sessionBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Theme.colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  sessionBadgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  onboardingTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  onboardingSub: { fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 20 },
  onboardingActions: { flexDirection: "row", gap: 12 },
  onboardingBtn: { flex: 1, flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 20, gap: 12 },
  onboardingIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
  onboardingBtnText: { color: "white", fontSize: 15, fontWeight: "800" },
  onboardingBtnSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },
  queueAction: { marginTop: 15, flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: Theme.colors.primaryLight, borderRadius: 16, gap: 12 },
  queueActionText: { flex: 1, fontSize: 14, fontWeight: "700", color: Theme.colors.primary },
  queueBadge: { backgroundColor: Theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  queueBadgeText: { color: "white", fontSize: 12, fontWeight: "800" },
});
