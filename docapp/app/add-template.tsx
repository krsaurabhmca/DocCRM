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
  Platform
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

const API_BASE = "http://192.168.1.15/doccrm/api/index.php";
const API_KEY = "DOC_CRM_API_SECRET_2026";

export default function AddTemplate() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    content_type: "Text",
    content: ""
  });
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [existingMedia, setExistingMedia] = useState("");

  useEffect(() => {
    if (id) {
      fetchTemplateData();
    }
  }, [id]);

  const fetchTemplateData = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_template&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        const t = json.data;
        setForm({
          name: t.name,
          content_type: t.content_type,
          content: t.content
        });
        if (t.media_url) {
          setExistingMedia(t.media_url);
        }
      }
    } catch (error) {
      console.error(error);
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
    if (!form.name || !form.content) {
      Alert.alert("Error", "Please fill name and content.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (id) formData.append("id", id as string);
      formData.append("name", form.name);
      formData.append("content_type", form.content_type);
      formData.append("content", form.content);
      formData.append("existing_media", existingMedia);

      if (selectedMedia) {
        // @ts-ignore
        formData.append("media", {
          uri: selectedMedia.uri,
          name: selectedMedia.fileName || (form.content_type === "Image" ? "photo.jpg" : "video.mp4"),
          type: selectedMedia.mimeType || (form.content_type === "Image" ? "image/jpeg" : "video/mp4"),
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

      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Template created successfully!");
        router.back();
      } else {
        Alert.alert("Error", json.message || "Failed to save template.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server connection failed.");
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
        <Stack.Screen options={{ title: id ? "Edit Template" : "New Message Template" }} />

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Template Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="bookmark-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Appointment Reminder"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content Type</Text>
            <View style={styles.typeRow}>
              {["Text", "Image", "Video"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.content_type === t && styles.activeType]}
                  onPress={() => {
                    setForm({ ...form, content_type: t });
                    setSelectedMedia(null);
                  }}
                >
                  <Text style={[styles.typeText, form.content_type === t && styles.activeTypeText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(form.content_type === "Image" || form.content_type === "Video") && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Upload {form.content_type}</Text>
              <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
                {selectedMedia ? (
                  <View style={styles.mediaPreview}>
                    {form.content_type === "Image" ? (
                      <Image source={{ uri: selectedMedia.uri }} style={styles.previewImg} />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={40} color="#0284C7" />
                        <Text style={{ color: '#0284C7', marginTop: 5 }}>Video Selected</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedMedia(null)}>
                      <Ionicons name="close-circle" size={24} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={30} color="#64748B" />
                    <Text style={styles.mediaPickerText}>Select {form.content_type} from Gallery</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Template Message *</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#64748B" style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Write template content..."
                multiline={true}
                numberOfLines={5}
                value={form.content}
                onChangeText={(t) => setForm({ ...form, content: t })}
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
                <Ionicons name="save-outline" size={22} color="white" />
                <Text style={styles.saveBtnText}>Save Template</Text>
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
});
