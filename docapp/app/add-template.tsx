import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Theme } from "../styles/Theme";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function AddTemplate() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    aoc_template_name: "",
    content_type: "Image",
    content_part1: "Dear Parents",
    content_part2: "Clinic Details",
    content_part3: "",
    is_default: false
  });
  const [isLocked, setIsLocked] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [existingMedia, setExistingMedia] = useState("");

  useEffect(() => {
    fetchClinicDetails();
    if (id) {
      fetchTemplateData();
    }
  }, [id]);

  const fetchClinicDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      
      if (!response.ok) return;
      
      const text = await response.text();
      if (!text) return;
      
      try {
        const json = JSON.parse(text);
        if (json.success && !id) {
          const name = json.data.clinic_name || "Our Clinic";
          const addr = json.data.clinic_address || "";
          setForm(prev => ({
            ...prev,
            content_part3: `*${name}*\n${addr}`.trim()
          }));
        }
      } catch (e) {
        console.error("JSON Parse Error:", e, text);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTemplateData = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_template&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      
      if (!response.ok) {
        Alert.alert("Error", "Server error: " + response.status);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        Alert.alert("Error", "Empty response from server");
        return;
      }
      
      const json = JSON.parse(text);
      if (json.success) {
        const t = json.data;
        setForm({
          name: t.name,
          aoc_template_name: t.aoc_template_name || "",
          content_type: t.content_type,
          content_part1: t.content_part1,
          content_part2: t.content_part2 || "",
          content_part3: t.content_part3 || "",
          is_default: t.is_default === "1" || t.is_default === 1
        });
        if (t.slug) setIsLocked(true);
        if (t.media_url) {
          setExistingMedia(t.media_url);
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Failed to load template: " + error.message);
    }
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: form.content_type === "Image" ? ['images'] : ['videos'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.content_part2) {
      Alert.alert("Error", "Please fill name and Message Part 2 (Mandatory).");
      return;
    }

    if (!selectedMedia && !existingMedia) {
      Alert.alert("Error", "Header Image is mandatory. Please select an image.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (id) formData.append("id", id as string);
      formData.append("name", form.name);
      formData.append("aoc_template_name", form.aoc_template_name);
      formData.append("content_type", form.content_type);
      formData.append("content_part1", form.content_part1);
      formData.append("content_part2", form.content_part2);
      formData.append("content_part3", form.content_part3);
      formData.append("is_default", form.is_default ? "1" : "0");
      formData.append("existing_media", existingMedia);

      if (selectedMedia) {
        // @ts-ignore
        formData.append("media", {
          uri: selectedMedia.uri,
          name: selectedMedia.fileName || "photo.jpg",
          type: selectedMedia.mimeType || "image/jpeg",
        });
      }

      const response = await fetch(`${API_BASE}?action=save_template`, {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "multipart/form-data"
        },
        body: formData
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
        Alert.alert("Success", "Template created successfully!");
        router.back();
      } else {
        Alert.alert("Error", json.message || "Failed to save template.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: id ? "Edit Saved Message" : "New Saved Message" }} />

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message Title * {isLocked && "(System Locked)"}</Text>
            <View style={[styles.inputWrapper, isLocked && { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="bookmark-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, isLocked && { color: '#64748B' }]}
                placeholder="e.g. Appointment Greeting"
                value={form.name}
                editable={!isLocked}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: Theme.colors.primary }]}>AOC Portal Template Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="code-working-outline" size={20} color={Theme.colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Exact name from AOC Portal (e.g. greeting)"
                value={form.aoc_template_name}
                autoCapitalize="none"
                onChangeText={(t) => setForm({ ...form, aoc_template_name: t })}
              />
            </View>
            <Text style={styles.lockedHint}>This MUST match the Approved Template name in your AOC account.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Header Image * (Mandatory)</Text>
            <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
              {selectedMedia ? (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: selectedMedia.uri }} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedMedia(null)}>
                    <Ionicons name="close-circle" size={24} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              ) : existingMedia ? (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: `${Config.API_BASE.replace('api/index.php', '')}${existingMedia}` }} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setExistingMedia("")}>
                    <Ionicons name="close-circle" size={24} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Ionicons name="image-outline" size={30} color="#64748B" />
                  <Text style={styles.mediaPickerText}>Select Cover Image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.partHeader}>
                <Text style={styles.label}>Message Part 1 {isLocked && "(Auto-filled)"}</Text>
                <Text style={styles.counter}>{form.content_part1.length}/600</Text>
            </View>
            <View style={[styles.inputWrapper, isLocked && { backgroundColor: '#F1F5F9' }]}>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }, isLocked && { color: '#64748B' }]}
                placeholder="e.g. Dear Parents"
                multiline={true}
                maxLength={600}
                value={form.content_part1}
                editable={!isLocked}
                onChangeText={(t) => setForm({ ...form, content_part1: t })}
              />
            </View>
            {isLocked && <Text style={styles.lockedHint}>#Patient Name# will be replaced automatically.</Text>}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.partHeader}>
              <Text style={[styles.label, { color: Theme.colors.primary }]}>Message Part 2 * (MANDATORY)</Text>
              <Text style={styles.counter}>{form.content_part2.length}/600</Text>
            </View>
            <View style={[styles.inputWrapper, { borderColor: Theme.colors.primary }]}>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Clinic Details / Main Content..."
                multiline={true}
                maxLength={600}
                value={form.content_part2}
                onChangeText={(t) => setForm({ ...form, content_part2: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.partHeader}>
              <Text style={styles.label}>Message Part 3 {isLocked && "(Clinic Info)"}</Text>
              <Text style={styles.counter}>{form.content_part3.length}/600</Text>
            </View>
            <View style={[styles.inputWrapper, isLocked && { backgroundColor: '#F1F5F9' }]}>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }, isLocked && { color: '#64748B' }]}
                placeholder="Closing/Footer..."
                multiline={true}
                maxLength={600}
                value={form.content_part3}
                editable={!isLocked}
                onChangeText={(t) => setForm({ ...form, content_part3: t })}
              />
            </View>
          </View>

          <View style={styles.defaultRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.defaultTitle}>Set as Default Message</Text>
              <Text style={styles.defaultSub}>Automatically pre-fills when opening WhatsApp for any patient.</Text>
            </View>
            <Switch
              value={form.is_default}
              onValueChange={(v) => setForm({ ...form, is_default: v })}
              trackColor={{ false: "#CBD5E1", true: "#0284C7" }}
              thumbColor="white"
            />
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
                <Ionicons name="save-outline" size={22} color="white" />
                <Text style={styles.saveBtnText}>Save Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeType: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTypeText: {
    color: "white",
  },
  mediaPicker: {
    height: 150,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaPickerText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  removeMedia: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 12,
  },
  saveBtn: {
    backgroundColor: "#0284C7",
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
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 10,
    marginBottom: 10,
  },
  defaultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  defaultSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  partHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  counter: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  lockedHint: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 5,
    fontStyle: 'italic',
  },
});
