import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FileMove {
  table: string;
  tituloId: string;
  column: string;
  oldPath: string;
  newPath: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Parse optional limit from body (default 20 per run)
  let limit = 20;
  try {
    const body = await req.json();
    if (body?.limit) limit = Math.min(body.limit, 100);
  } catch {}

  const bucket = "titulo-documentos";
  const moves: FileMove[] = [];
  const errors: string[] = [];
  let movedCount = 0;

  function getNewPath(oldPath: string, obraCodigo: string, column: string): string | null {
    const fileName = oldPath.split("/").pop();
    if (!fileName) return null;

    // Already in new structure (contains subfolder like "documentos/", "comprovantes/", "boletos/")
    if (oldPath.includes("/documentos/") || oldPath.includes("/comprovantes/") || oldPath.includes("/boletos/")) {
      return null;
    }

    let folder: string;
    if (column === "documento_url") folder = "comprovantes";
    else if (column === "boleto_url") folder = "boletos";
    else if (column === "arquivo_pagamento_url") folder = "boletos";
    else return null;

    if (fileName.startsWith("doc_")) folder = "documentos";
    else if (fileName.startsWith("comprovante_")) folder = "comprovantes";
    else if (fileName.startsWith("boleto_")) folder = "boletos";
    else if (fileName.startsWith("pagamento_")) folder = "boletos";

    return `${obraCodigo}/${folder}/${fileName}`;
  }

  // Collect moves from both tables
  for (const table of ["titulos", "titulos_pendentes"] as const) {
    const columns = ["documento_url", "boleto_url", "arquivo_pagamento_url"] as const;

    for (const column of columns) {
      const { data: rows, error } = await supabase
        .from(table)
        .select(`id, obra_codigo, ${column}`)
        .not(column, "is", null);

      if (error) {
        errors.push(`Query error ${table}.${column}: ${error.message}`);
        continue;
      }

      for (const row of rows || []) {
        const oldPath = (row as any)[column] as string;
        if (!oldPath || !row.obra_codigo) continue;

        const newPath = getNewPath(oldPath, row.obra_codigo, column);
        if (!newPath) continue;

        moves.push({ table, tituloId: row.id, column, oldPath, newPath });
      }
    }
  }

  // Process only up to `limit` moves
  const batch = moves.slice(0, limit);

  for (const move of batch) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(move.oldPath);

      if (downloadError) {
        errors.push(`Download [${move.oldPath}]: ${downloadError.message}`);
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(move.newPath, fileData, { upsert: true });

      if (uploadError) {
        errors.push(`Upload [${move.newPath}]: ${uploadError.message}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from(move.table)
        .update({ [move.column]: move.newPath })
        .eq("id", move.tituloId);

      if (updateError) {
        errors.push(`DB update [${move.table}/${move.tituloId}]: ${updateError.message}`);
        continue;
      }

      await supabase.storage.from(bucket).remove([move.oldPath]);
      movedCount++;
    } catch (e) {
      errors.push(`Error [${move.oldPath}]: ${(e as Error).message}`);
    }
  }

  const report = {
    total_pending: moves.length,
    processed_this_run: movedCount,
    remaining: moves.length - movedCount,
    errors_count: errors.length,
    errors: errors.slice(0, 30),
    note: moves.length > limit
      ? `Processados ${limit} de ${moves.length}. Execute novamente para continuar.`
      : "Migração completa!",
  };

  return new Response(JSON.stringify(report, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
