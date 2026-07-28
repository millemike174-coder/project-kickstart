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
  name: "list_studio_blocks",
  title: "List studio blocks",
  description: "List admin-created unavailability blocks (holidays, maintenance, etc.) per studio.",
  inputSchema: {
    studio: z.enum(["piccolo", "ssg", "videomaker"]).nullable().describe("Filter by studio/resource."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ studio }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("studio_blocks")
      .select("id, studio, start_date, end_date, reason, created_at")
      .order("start_date", { ascending: true });
    if (studio) q = q.eq("studio", studio);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { blocks: data ?? [] },
    };
  },
});
