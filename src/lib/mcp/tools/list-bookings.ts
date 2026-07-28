import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_bookings",
  title: "List bookings",
  description:
    "List Trenches Records studio bookings. Filter by studio, status, and date range. Returns up to `limit` rows ordered by date ascending.",
  inputSchema: {
    studio: z.enum(["piccolo", "ssg", "videomaker"]).nullable().describe("Filter by studio/resource."),
    status: z.enum(["pending", "confirmed", "cancelled"]).nullable().describe("Filter by booking status."),
    from_date: z.string().nullable().describe("Inclusive start date YYYY-MM-DD."),
    to_date: z.string().nullable().describe("Inclusive end date YYYY-MM-DD."),
    limit: z.number().int().min(1).max(200).nullable().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("bookings")
      .select(
        "id, studio, date, start_time, end_time, status, deposit_paid, final_paid, total, email, videomaker, videomaker_days, vfx_ai_seconds, created_at",
      )
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(input.limit ?? 50);
    if (input.studio) query = query.eq("studio", input.studio);
    if (input.status) query = query.eq("status", input.status);
    if (input.from_date) query = query.gte("date", input.from_date);
    if (input.to_date) query = query.lte("date", input.to_date);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { bookings: data ?? [] },
    };
  },
});
