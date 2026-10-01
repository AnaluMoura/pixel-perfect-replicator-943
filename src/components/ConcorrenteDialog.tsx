import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cnpjValido, fmtCNPJ, soDigitos, useInvalidateAll, type Concorrente } from "@/lib/data";

export function ConcorrenteDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Concorrente | null; onSaved?: (c: Concorrente) => void }) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [saving, setSaving] = useState(false);
  const invalidate = useInvalidateAll();

  useEffect(() => {
    if (open) {
      setNome(editing?.nome_empresa ?? "");
      setCnpj(editing?.cnpj ? fmtCNPJ(editing.cnpj) : "");
    }
  }, [open, editing]);

  async function salvar() {
    const n = nome.trim().toUpperCase();
    const c = soDigitos(cnpj);
    if (!n || n.length > 200) { toast.error("Informe o nome da empresa."); return; }
    if (!c) { toast.error("Informe o CNPJ."); return; }
    if (!cnpjValido(c)) { toast.error("CNPJ inválido."); return; }
    setSaving(true);
    const q = editing
      ? supabase.from("concorrentes").update({ nome_empresa: n, cnpj: c }).eq("id", editing.id).select().single()
      : supabase.from("concorrentes").insert({ nome_empresa: n, cnpj: c }).select().single();
    const { data, error } = await q;
    setSaving(false);
    if (error) { toast.error(error.code === "23505" ? "Já existe empresa com esse nome ou CNPJ." : error.message); return; }
    toast.success("Concorrente salvo.");
    await invalidate();
    onSaved?.(data as Concorrente);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar concorrente" : "Novo concorrente"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label>Nome da empresa</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={200} /></div>
          <div className="grid gap-1.5"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
