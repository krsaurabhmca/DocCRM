import React, { useState } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "http://192.168.1.15/doccrm/api/index.php";
const API_KEY = "DOC_CRM_API_SECRET_2026";

export default function AddCategory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState((params.name as string) || "");
  const id = params.id;

  const handleSave = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter a category name.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_category`, {
        method: "POST",
        headers: { 
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, name })
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", id ? "Category updated!" : "Category created successfully!");
        router.back();
      } else {
        Alert.alert("Error", json.message || "Failed to save category.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: id ? "Edit Category" : "New Category" }} />
      
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category Name *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="pricetag-outline" size={20} color="#64748B" />
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Heart Patient, Diabetes"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name={id ? "save-outline" : "checkmark-circle"} size={22} color="white" />
              <Text style={styles.saveBtnText}>{id ? "Update Category" : "Create Category"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  card: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#1E293B",
  },
  saveBtn: {
    backgroundColor: "#059669",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    gap: 10,
  },
  disabledBtn: {
    backgroundColor: "#94A3B8",
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
