import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Dimensions
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
import { Config } from "../../Config";

const API_BASE = Config.API_BASE;
const MEDIA_BASE = Config.MEDIA_BASE;
const API_KEY = Config.API_KEY;

export default function TemplateDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_template&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setTemplate(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (!template) {
    return (
      <View style={styles.center}>
        <Text>Template not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Template Preview" }} />
      
      <View style={styles.header}>
        <View style={styles.typeBadge}>
          <Ionicons 
            name={template.content_type === "Text" ? "chatbubble-ellipses" : (template.content_type === "Image" ? "image" : "videocam")} 
            size={20} 
            color="#0284C7" 
          />
          <Text style={styles.typeText}>{template.content_type} Template</Text>
        </View>
        <Text style={styles.title}>{template.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>MESSAGE CONTENT</Text>
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{template.content}</Text>
        </View>
      </View>

      {template.media_url && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ATTACHED MEDIA</Text>
          <View style={styles.mediaContainer}>
            {template.content_type === "Image" ? (
              <Image 
                source={{ uri: `${MEDIA_BASE}${template.media_url}` }} 
                style={styles.mediaImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoCard}>
                <Ionicons name="videocam" size={48} color="#0284C7" />
                <Text style={styles.videoName}>Video Template Attached</Text>
                <Text style={styles.videoSub}>{template.media_url.split('/').pop()}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: "/add-template", params: { id: template.id } })}>
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.btnText}>Edit Template</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  card: {
    margin: 15,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 10,
    letterSpacing: 1,
  },
  contentBox: {
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#334155",
  },
  mediaContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: 250,
  },
  videoCard: {
    width: "100%",
    height: 180,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
  },
  videoName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  videoSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  editBtn: {
    backgroundColor: "#0284C7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
