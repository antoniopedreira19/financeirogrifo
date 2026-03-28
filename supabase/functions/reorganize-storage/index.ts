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

  const bucket = "titulo-documentos";
  const moves: FileMove[] = [];
  const errors: string[] = [];
  let movedCount = 0;

  // Helper to determine new path
  function getNewPath(
    oldPath: string,
    obraCodigo: string,
    column: string
  ): string | null {
    const fileName = oldPath.split("/").pop();
    if (!fileName) return null;

    let folder: string;
    if (column === "documento_url") {
      folder = "comprovantes";
    } else if (column === "boleto_url") {
      folder = "boletos";
    } else if (column === "arquivo_pagamento_url") {
      folder = "boletos";
    } else {
      return null;
    }

    // Check prefix to refine folder
    if (fileName.startsWith("doc_")) {
      folder = "documentos";
    } else if (fileName.startsWith("comprovante_")) {
      folder = "comprovantes";
    } else if (fileName.startsWith("boleto_")) {
      folder = "boletos";
    } else if (fileName.startsWith("pagamento_")) {
      folder = "boletos";
    }

    const newPath = `${obraCodigo}/${folder}/${fileName}`;
    // Skip if already in new structure
    if (oldPath === newPath) return null;
    return newPath;
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
        errors.push(`Error querying ${table}.${column}: ${error.message}`);
        continue;
      }

      for (const row of rows || []) {
        const oldPath = (row as any)[column] as string;
        if (!oldPath || !row.obra_codigo) continue;

        const newPath = getNewPath(oldPath, row.obra_codigo, column);
        if (!newPath) continue;

        moves.push({
          table,
          tituloId: row.id,
          column,
          oldPath,
          newPath,
        });
      }
    }
  }

  // Execute moves
  for (const move of moves) {
    try {
      // Download file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(move.oldPath);

      if (downloadError) {
        errors.push(
          `Download failed [${move.oldPath}]: ${downloadError.message}`
        );
        continue;
      }

      // Upload to new path
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(move.newPath, fileData, { upsert: true });

      if (uploadError) {
        errors.push(
          `Upload failed [${move.newPath}]: ${uploadError.message}`
        );
        continue;
      }

      // Update DB record
      const { error: updateError } = await supabase
        .from(move.table)
        .update({ [move.column]: move.newPath })
        .eq("id", move.tituloId);

      if (updateError) {
        errors.push(
          `DB update failed [${move.table}/${move.tituloId}]: ${updateError.message}`
        );
        continue;
      }

      // Remove old file
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove([move.oldPath]);

      if (removeError) {
        errors.push(
          `Remove failed [${move.oldPath}]: ${removeError.message}`
        );
      }

      movedCount++;
    } catch (e) {
      errors.push(`Unexpected error [${move.oldPath}]: ${(e as Error).message}`);
    }
  }

  const report = {
    total_found: moves.length,
    moved: movedCount,
    errors_count: errors.length,
    errors: errors.slice(0, 50),
  };

  return new Response(JSON.stringify(report, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
