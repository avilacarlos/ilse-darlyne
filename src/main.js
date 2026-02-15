import './style.css'

import './style.css' 
import imageCompression from 'browser-image-compression';

// --- CONFIGURACIÓN SEGURA ---
// Ya no hay SUPABASE_KEY aquí. Todo pasa por tus funciones.
const PROJECT_ID = "lseheeajwwhjsqjtffal"; 
const UPLOAD_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/upload-photo`;
const GALLERY_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/get-gallery`;
const BODA_ID = 'XV_ILSE-DARLYNE';

// Elementos
const uploadForm = document.getElementById('uploadForm');
const cameraInput = document.getElementById('cameraInput');
const fileInput = document.getElementById('fileInput');
const contadorFotosSpan = document.getElementById('contador-fotos');
const mensajeDiv = document.getElementById('mensaje');
const galeria = document.getElementById("galeria");
const modal = document.getElementById("modal");
const modalImagen = document.getElementById("modalImagen");
const h2Frase = document.getElementById('fraseCambia');
const faqIcon = document.getElementById('faq-icon');
const faqModal = document.getElementById('faq-modal');

// Estado
let isUploading = false;
let urlsImagenesGaleria = [];
let indiceModalActual = 0;

// ==========================================
// 1. SUBIR FOTOS (Llama a tu Función Backend)
// ==========================================
async function subirFotos(event) {
    event.preventDefault();
    if (isUploading) return;
    
    const uploadButton = uploadForm.querySelector("button[type='submit']");
    const textoOriginal = uploadButton.textContent;
    
    const todosLosArchivos = [...(cameraInput.files || []), ...(fileInput.files || [])];
    if (todosLosArchivos.length === 0) {
        mostrarMensaje("Selecciona alguna foto.", true);
        return;
    }

    isUploading = true;
    uploadButton.disabled = true;
    uploadButton.textContent = "Comprimiendo...";

    try {
        // Comprimimos en el navegador para ahorrar datos
        const opciones = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const archivosComprimidos = await Promise.all(
            todosLosArchivos.map(f => imageCompression(f, opciones))
        );

        uploadButton.textContent = "Subiendo...";

        // Enviamos al Backend
        const subidas = archivosComprimidos.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderName', BODA_ID);

            const response = await fetch(UPLOAD_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Error subiendo');
            return response.json();
        });

        await Promise.all(subidas);
        
        mostrarMensaje("¡Fotos subidas con éxito!");
        uploadForm.reset();
        actualizarContadorYUI();
        await cargarFotos(); 

    } catch (err) {
        console.error(err);
        mostrarMensaje("Error al subir fotos.", true);
    } finally {
        isUploading = false;
        uploadButton.disabled = false;
        uploadButton.textContent = textoOriginal;
    }
}

// ==========================================
// 2. CARGAR GALERÍA (Llama a tu Función Backend)
// ==========================================
async function cargarFotos() {
    galeria.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:gray'>Cargando recuerdos...</p>";
    
    try {
        const response = await fetch(GALLERY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderName: BODA_ID })
        });

        if (!response.ok) throw new Error('Error de red');
        
        const fotos = await response.json();
        urlsImagenesGaleria = fotos.map(f => f.url);
        
        galeria.innerHTML = "";
        
        if (fotos.length === 0) {
            galeria.innerHTML = "<p style='grid-column:1/-1; text-align:center'>Sé el primero en subir una foto ✨</p>";
            return;
        }

        const fragment = document.createDocumentFragment();
        fotos.forEach((foto, index) => {
            const img = document.createElement("img");
            img.src = foto.url;
            img.loading = "lazy";
            img.onclick = () => abrirModal(index);
            fragment.appendChild(img);
        });
        galeria.appendChild(fragment);

    } catch (error) {
        console.error(error);
        galeria.innerHTML = "<p>Error cargando galería.</p>";
    }
}

// ==========================================
// 3. UI & EVENTS
// ==========================================
function actualizarContadorYUI() {
    const total = (cameraInput.files?.length || 0) + (fileInput.files?.length || 0);
    contadorFotosSpan.textContent = total > 0 ? total : '';
    contadorFotosSpan.style.display = total > 0 ? 'inline-block' : 'none';
}

function mostrarMensaje(texto, esError = false) {
    mensajeDiv.textContent = texto;
    mensajeDiv.style.opacity = "1";
    mensajeDiv.style.background = esError ? "#ffebee" : "#e8f5e9";
    mensajeDiv.style.color = esError ? "#c62828" : "#2e7d32";
    setTimeout(() => { mensajeDiv.style.opacity = "0"; }, 4000);
}

// Modal
function abrirModal(i) {
    if(i >= 0 && i < urlsImagenesGaleria.length) {
        indiceModalActual = i;
        modalImagen.src = urlsImagenesGaleria[i];
        modal.style.display = "flex";
        document.body.style.overflow = 'hidden';
    }
}
function cerrarModal() {
    modal.style.display = "none";
    document.body.style.overflow = 'auto';
}

// Event Listeners
uploadForm.addEventListener('submit', subirFotos);
cameraInput.addEventListener('change', actualizarContadorYUI);
fileInput.addEventListener('change', actualizarContadorYUI);
modal.addEventListener('click', cerrarModal);
document.getElementById('cerrarModalBtn').addEventListener('click', cerrarModal);
document.getElementById('anterior').addEventListener('click', (e) => { e.stopPropagation(); abrirModal(indiceModalActual - 1); });
document.getElementById('siguiente').addEventListener('click', (e) => { e.stopPropagation(); abrirModal(indiceModalActual + 1); });

// FAQ
faqIcon.addEventListener('click', () => { faqModal.style.display = 'flex'; });
document.getElementById('cerrarFaqBtn').addEventListener('click', () => { faqModal.style.display = 'none'; });

// Frases
const frases = ['¡Haz magia con la cámara!', '¡Comparte tus mejores fotos!', '¡Saca al fotógrafo que llevas dentro!'];
let idxFrase = 0;
setInterval(() => {
    h2Frase.style.opacity = '0';
    setTimeout(() => {
        idxFrase = (idxFrase + 1) % frases.length;
        h2Frase.textContent = frases[idxFrase];
        h2Frase.style.opacity = '1';
    }, 500);
}, 6000);

// Iniciar
cargarFotos();