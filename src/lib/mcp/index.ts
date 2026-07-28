import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBookingsTool from "./tools/list-bookings";
import getBookingTool from "./tools/get-booking";
import listStudioBlocksTool from "./tools/list-studio-blocks";

// The OAuth issuer MUST be the direct supabase.co host (never SUPABASE_URL,
// which may be a .lovable.cloud proxy). Build it from the project ref, which
// Vite inlines as a literal at build time so the entry stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "trenches-records-mcp",
  title: "Trenches Records",
  version: "0.1.0",
  instructions:
    "Tools to inspect Trenches Records studio bookings and unavailability blocks. Callers authenticate as an app user and RLS scopes what they can read.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBookingsTool, getBookingTool, listStudioBlocksTool],
});
