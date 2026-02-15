// supabase/functions/upload-photo/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración de CORS (Permite que tu web hable con este servidor)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejar las peticiones "Preflight" del navegador (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Leer el formulario que envía la web
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folderName = formData.get('folderName') || 'XV_HAIDE' // Carpeta por defecto

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se envió ningún archivo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Validación de seguridad (MIME Type)
    if (!file.type.startsWith('image/')) {
        throw new Error('El archivo no es una imagen válida')
    }

    // 4. Crear cliente Supabase con privilegios de ADMIN (Service Role)
    // Esto es seguro porque corre en el servidor, no en el navegador.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. Limpiar nombre y generar ruta única
    const cleanName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${crypto.randomUUID().split('-')[0]}_${cleanName}`;
    const filePath = `${folderName}/${uniqueName}`;

    // 6. Subir al Bucket 'Galeria'
    const { data, error } = await supabase.storage
      .from('Galeria') // Asegúrate que coincida con el nombre en tu panel (Mayúsculas importan)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    // 7. Responder con éxito
    return new Response(
      JSON.stringify({ message: 'Subida exitosa', path: data.path }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})