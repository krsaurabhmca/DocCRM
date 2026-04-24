import { StyleSheet } from "react-native";
import { Theme } from "./Theme";

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    ...Theme.typography.caption,
    color: Theme.colors.text.muted,
    marginBottom: Theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: Theme.roundness.md,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Theme.colors.text.main,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    borderRadius: Theme.roundness.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  successButton: {
    backgroundColor: Theme.colors.success,
    paddingVertical: 15,
    borderRadius: Theme.roundness.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: Theme.colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  }
});
