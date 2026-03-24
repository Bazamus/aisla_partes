CREATE POLICY "Permitir lectura de roles_permisos a usuarios autenticados"
ON public.roles_permisos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir lectura de permisos a usuarios autenticados"
ON public.permisos
FOR SELECT
TO authenticated
USING (true);
