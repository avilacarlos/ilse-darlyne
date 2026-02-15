// supabase/functions/get-gallery/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Leemos el body para saber de qué carpeta sacar fotos (opcional)
    const { folderName } = await req.json().catch(() => ({ folderName: 'XV_HAIDE' }))
    const targetFolder = folderName || 'XV_HAIDE';

    // Cliente ADMIN (Server-side)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Listar archivos del bucket "Galeria"
    const { data, error } = await supabase.storage.from('Galeria').list(targetFolder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) throw error;

    // Generar URLs públicas limpias
    const projectUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // Construimos la URL manualmente para ahorrar llamadas
    // Estructura: https://<project>.supabase.co/storage/v1/object/public/Galeria/<carpeta>/<archivo>
    
    const photos = data
        .filter(f => f.name !== '.emptyFolderPlaceholder') // Filtrar carpetas vacías
        .map(file => {
            const publicUrl = `${projectUrl}/storage/v1/object/public/Galeria/${targetFolder}/${file.name}`;
            return {
                name: file.name,
                url: publicUrl,
            };
        });

    return new Response(JSON.stringify(photos), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
    })
  }
})