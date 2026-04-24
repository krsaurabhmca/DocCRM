import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "http://192.168.1.15/doccrm/api/index.php";
const API_KEY = "DOC_CRM_API_SECRET_2026";

export default function ManageTemplates() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_templates`, {
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

  useEffect(() => {
    fetchData();
  }, []);

  const deleteTemplate = (id: number) => {
    Alert.alert("Delete Template", "Are you sure you want to remove this message template?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const response = await fetch(`${API_BASE}?action=delete_template&id=${id}`, {
          headers: { "X-API-KEY": API_KEY }
        });
        const json = await response.json();
        if (json.success) fetchData();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => router.push({ pathname: "/template/[id]", params: { id: item.id } })}
    >
      <View style={[styles.avatar, { backgroundColor: "#F0F9FF" }]}>
        <Ionicons 
          name={item.content_type === "Text" ? "chatbubble-ellipses" : (item.content_type === "Image" ? "image" : "videocam")} 
          size={24} 
          color="#0284C7" 
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity onPress={() => deleteTemplate(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemSubtext} numberOfLines={1}>{item.content}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Message Templates" }} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}
          ListEmptyComponent={<View style={styles.center}><Text>No templates found.</Text></View>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/add-template")}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  list: { paddingVertical: 10 },
  listItem: { flexDirection: "row", paddingHorizontal: 15, paddingVertical: 12, alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemContent: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#E2E8F0", paddingBottom: 12 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  itemSubtext: { fontSize: 13, color: "#64748B", marginTop: 4 },
  fab: { position: "absolute", bottom: 30, right: 30, backgroundColor: "#0284C7", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
});
