import React, { useState, useEffect, useCallback } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  TextInput
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../../Config";
import { Theme } from "../../styles/Theme";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function CategoryPatients() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_category_patients&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setPatients(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => router.push(`/patient/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientSub}>{item.phone} • {item.age} {item.age_unit}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `${name} Patients` }} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients in this group..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPatients();}} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No patients found in this category.</Text>
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
  searchContainer: { padding: 15, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1E293B" },
  list: { padding: 15 },
  patientCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 15, borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Theme.colors.primary, justifyContent: "center", alignItems: "center", marginRight: 15 },
  avatarText: { color: "white", fontSize: 18, fontWeight: "700" },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  patientSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 15, color: "#94A3B8", fontSize: 14 }
});
