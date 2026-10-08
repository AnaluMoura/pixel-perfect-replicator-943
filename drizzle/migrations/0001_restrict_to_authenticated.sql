do $$ declare t text; begin
foreach t in array array['concorrentes','tipos_obra','orgaos_publicos','licitacoes'] loop
  execute format('drop policy if exists "acesso equipe %s" on public.%I', t, t);
  execute format('create policy "acesso equipe %s" on public.%I for all to authenticated using (true) with check (true)', t, t);
  execute format('revoke all on public.%I from anon', t);
end loop; end $$;