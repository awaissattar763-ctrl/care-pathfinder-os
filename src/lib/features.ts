import { useOrgFeatureFlags } from "@/hooks/queries/tenant";

/** Runtime feature-flag lookup for the current org. Defaults to true while loading so UI does not flicker off. */
export function useFeature(code: string): boolean {
  const { data } = useOrgFeatureFlags();
  if (!data) return true;
  const flag = data.find((f) => f.code === code);
  return flag ? flag.effective : true;
}

export const FEATURES = {
  TELEMEDICINE: "telemedicine",
  AI_COPILOT: "ai_copilot",
  MULTI_LOCATION: "multi_location",
  API_ACCESS: "api_access",
  ADVANCED_ANALYTICS: "advanced_analytics",
} as const;