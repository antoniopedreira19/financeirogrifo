import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("reorganize-storage: started");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let limit = 5;
  try {
    const body = await req.json();
    if (body?.limit) limit = Math.min(body.limit, 50);
  } catch {}

  const bucket = "titulo-documentos";
  const errors: string[] = [];
  let movedCount = 0;
  let totalPending = 0;

  function getNewPath(oldPath: string, obraCodigo: string, column: string): string | null {
    const fileName = oldPath.split("/").pop();
    if (!fileName) return null;
    if (oldPath.includes("/documentos/") || oldPath.includes("/comprovantes/") || oldPath.includes("/boletos/")) return null;

    let folder = column === "documento_url" ? "comprovantes" : "boletos";
    if (fileName.startsWith("doc_")) folder = "documentos";
    else if (fileName.startsWith("comprovante_")) folder = "comprovantes";
    else if (fileName.startsWith("boleto_")) folder = "boletos";
    else if (fileName.startsWith("pagamento_")) folder = "boletos";

    return `${obraCodigo}/${folder}/${fileName}`;
  }

  interface Move { table: string; id: string; column: string; oldPath: string; newPath: string; }
  const moves: Move[] = [];

  for (const table of ["titulos", "titulos_pendentes"]) {
    for (const column of ["documento_url", "boleto_url", "arquivo_pagamento_url"]) {
      console.log(`Querying ${table}.${column}...`);
      const { data: rows, error } = await supabase
        .from(table)
        .select(`id, obra_codigo, ${column}`)
        .not(column, "is", null);

      if (error) { errors.push(`Query ${table}.${column}: ${error.message}`); continue; }

      for (const row of rows || []) {
        const oldPath = (row as any)[column] as string;
        if (!oldPath || !row.obra_codigo) continue;
        const newPath = getNewPath(oldPath, row.obra_codigo, column);
        if (!newPath) continue;
        moves.push({ table, id: row.id, column, oldPath, newPath });
      }
    }
  }

  totalPending = moves.length;
  console.log(`Found ${totalPending} files to migrate, processing ${Math.min(limit, totalPending)}`);

  const batch = moves.slice(0, limit);

  for (const m of batch) {
    try {
      console.log(`Moving: ${m.oldPath} -> ${m.newPath}`);
      const { data: fileData, error: dlErr } = await supabase.storage.from(bucket).download(m.oldPath);
      if (dlErr) { errors.push(`DL ${m.oldPath}: ${dlErr.message}`); continue; }

      const { error: ulErr } = await supabase.storage.from(bucket).upload(m.newPath, fileData, { upsert: true });
      if (ulErr) { errors.push(`UL ${m.newPath}: ${ulErr.message}`); continue; }

      const { error: dbErr } = await supabase.from(m.table).update({ [m.column]: m.newPath }).eq("id", m.id);
      if (dbErr) { errors.push(`DB ${m.table}/${m.id}: ${dbErr.message}`); continue; }

      await supabase.storage.from(bucket).remove([m.oldPath]);
      movedCount++;
    } catch (e) {
      errors.push(`ERR ${m.oldPath}: ${(e as Error).message}`);
    }
  }

  const report = {
    total_pending: totalPending,
    processed: movedCount,
    remaining: totalPending - movedCount,
    errors_count: errors.length,
    errors: errors.slice(0, 20),
    note: totalPending > limit
      ? `Processados ${movedCount} de ${totalPending}. Execute novamente.`
      : movedCount === totalPending ? "Migração completa!" : "Parcialmente concluído.",
  };

  console.log("Report:", JSON.stringify(report));
  return new Response(JSON.stringify(report, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
