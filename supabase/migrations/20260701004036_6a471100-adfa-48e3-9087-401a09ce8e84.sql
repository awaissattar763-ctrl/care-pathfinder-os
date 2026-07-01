
ALTER FUNCTION public.has_role(uuid, app_role) SECURITY INVOKER;
ALTER FUNCTION public.is_staff(uuid) SECURITY INVOKER;
ALTER FUNCTION public.current_patient_id() SECURITY INVOKER;

-- Re-grant EXECUTE to authenticated so RLS policies can invoke them
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_patient_id() TO authenticated;
