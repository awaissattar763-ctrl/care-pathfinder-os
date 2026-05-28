import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type AppRole = "admin" | "doctor" | "nurse" | "receptionist";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      qc.invalidateQueries();
      if (s?.user) {
        // defer to avoid recursive supabase call inside callback
        setTimeout(() => {
          supabase.from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
            setRoles((data?.map((r) => r.role as AppRole)) ?? []);
          });
        }, 0);
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).then(({ data: r }) => {
          setRoles((r?.map((x) => x.role as AppRole)) ?? []);
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }
export function useHasRole(role: AppRole) {
  const { roles } = useAuth();
  return roles.includes(role) || roles.includes("admin");
}