import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Typed wrapper around the (currently beta) supabase.auth.oauth namespace so
// TS doesn't complain while still calling the real client methods.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/admin/login?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message ?? "Authorization not found");
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load authorization");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauthApi().approveAuthorization(authorizationId)
        : await oauthApi().denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-[#0F0E0C] border border-white/10 rounded-3xl p-8 sm:p-10">
        <h1 className="font-display uppercase text-2xl sm:text-3xl mb-1">Connetti app</h1>
        <p className="text-sm text-[#F5F1E8]/60 mb-8">Trenches Records</p>

        {error && (
          <div className="text-sm text-red-400 mb-4">Impossibile caricare la richiesta: {error}</div>
        )}

        {!error && !details && (
          <div className="text-sm text-[#F5F1E8]/60">Caricamento…</div>
        )}

        {details && (
          <>
            <div className="space-y-2 mb-6 text-sm">
              <div>
                <span className="text-[#F5F1E8]/60">App richiedente: </span>
                <span className="font-medium">{details.client?.name ?? details.client?.client_name ?? "Client sconosciuto"}</span>
              </div>
              {details.client?.redirect_uris?.[0] && (
                <div className="text-xs text-[#F5F1E8]/50 break-all">
                  Redirect: {details.client.redirect_uris[0]}
                </div>
              )}
              <p className="text-[#F5F1E8]/80 pt-2">
                Autorizzando, questa app potrà chiamare gli strumenti MCP di Trenches Records come te.
                I permessi dell'app e le policy del database restano invariati.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors disabled:opacity-50"
              >
                {busy ? "…" : "Approva"}
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-full border border-white/20 text-[#F5F1E8] px-6 py-3 text-sm uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Rifiuta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
