import React from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../styles/Theme";
import { GlobalStyles } from "../styles/GlobalStyles";
import { Config } from "../Config";

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settingsOptions = [
    {
      title: "🏥 Clinic Identity & Staff",
      data: [
        { id: "profile", name: "Clinic Profile & Branding", icon: "business-outline", color: "#8B5CF6", route: "/clinic-profile" },
        { id: "doctors", name: "Manage Doctors", icon: "medkit-outline", color: "#0284C7", route: "/manage-doctors" },
        { id: "working_days", name: "Working Days & Schedule", icon: "calendar-outline", color: "#EC4899", route: "/working-days" },
        { id: "limits", name: "Patient Flow Capacity", icon: "speedometer-outline", color: "#F59E0B", route: "/daily-limits" },
      ]
    },
    {
      title: "💬 Communication & CRM",
      data: [
        { id: "campaign", name: "Launch Bulk Campaign", icon: "megaphone-outline", color: "#6366F1", route: "/start-campaign" },
        { id: "whatsapp", name: "WhatsApp API Settings", icon: "logo-whatsapp", color: "#25D366", route: "/whatsapp-settings" },
        { id: "templates", name: "Message Templates", icon: "document-text-outline", color: "#0284C7", route: "/manage-templates" },
        { id: "followup_rules", name: "Automation Rules", icon: "flash-outline", color: "#EA580C", route: "/followup-settings" },
      ]
    },
    {
      title: "💰 Finance & Revenue",
      data: [
        { id: "finance", name: "Revenue Analytics", icon: "stats-chart-outline", color: "#059669", route: "/finance" },
        { id: "finance_rules", name: "Billing & Consultation Fees", icon: "wallet-outline", color: "#10B981", route: "/finance-settings" },
      ]
    },
    {
      title: "📁 Data Management",
      data: [
        { id: "categories", name: "Patient Categories", icon: "pricetags-outline", color: "#6366F1", route: "/manage-categories" },
      ]
    },
    {
      title: "⚙️ System",
      data: [
        { id: "api", name: "System Connection", icon: "radio-outline", color: "#64748B", route: null },
        { id: "about", name: "About & Support", icon: "information-circle-outline", color: "#64748B", route: "/about" },
      ]
    },
    {
      title: "🚪 Account",
      data: [
        { id: "logout", name: "Sign Out", icon: "log-out-outline", color: Theme.colors.danger, route: "LOGOUT" },
      ]
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of DocCRM?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: () => {
          Alert.alert("Signed Out", "You have been logged out successfully.");
          // In a real app, clear tokens and navigate to login
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Settings & Management" }} />
      
      {settingsOptions.map((section, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.data.map((item, i) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.item, i === section.data.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  if (item.route === "LOGOUT") {
                    handleLogout();
                  } else if (item.route) {
                    router.push(item.route as any);
                  } else {
                    Alert.alert("DocCRM", `${item.name} coming soon!`);
                  }
                }}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>DocCRM Mobile v{Config.VERSION}</Text>
        <Text style={styles.footerSub}>Connected to {Config.API_BASE.split('/')[2]}</Text>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  section: {
    marginTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.small,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    marginLeft: 5,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: Theme.colors.text.main,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text.light,
  },
  footerSub: {
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 4,
  }
});
