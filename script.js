// --- ESTADO GLOBAL ---
let candidates = [];
let selectedCandidate = null;
let currentFormat = 'square'; // 'square' ou 'story'
let userImg = null;

// Variáveis de Edição (Engine)
let editState = {
    scale: 1,
    posX: 0,
    posY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
};

const CANVAS_SIZE = 1080; // Resolução interna alta

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
    await loadCandidates();
    setupCanvasEvents();
    
    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        const installBtn = document.getElementById('install-btn');
        installBtn.classList.remove('hidden');
        installBtn.onclick = () => e.prompt();
    });
});

async function loadCandidates() {
    try {
        const response = await fetch('candidatos.json');
        candidates = await response.json();
        document.getElementById('loading').remove();
        renderGrid(candidates);
    } catch (error) {
        console.error("Erro ao carregar JSON:", error);
        document.getElementById('loading').innerText = "Erro ao carregar lista.";
    }
}

function renderGrid(list) {
    const grid = document.getElementById('template-grid');
    grid.innerHTML = "";
    
    list.forEach(c => {
        const div = document.createElement('div');
        div.className = "bg-surface p-3 rounded-xl border border-white/5 shadow-sm active:scale-95 transition-transform cursor-pointer flex flex-col items-center";
        div.onclick = () => selectCandidate(c);
        div.innerHTML = `
            <img src="${c.thumb}" class="w-20 h-20 rounded-full object-cover mb-3 border-2 border-white/10" onerror="this.src='assets/placeholder.png'">
            <h3 class="font-bold text-sm text-center">${c.nome}</h3>
            <span class="text-xs text-slate-400">${c.partido}</span>
        `;
        grid.appendChild(div);
    });
    
    // Filtro de busca
    document.getElementById('search-input').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = candidates.filter(c => c.nome.toLowerCase().includes(term));
        renderGrid(filtered); // Cuidado: recursividade simples, ok para lista pequena
    });
}

function selectCandidate(c) {
    selectedCandidate = c;
    changeStep(2);
    // Se já tiver foto, redesenha
    if(userImg) drawEditor();
}

// --- ENGINE DE IMAGEM (Canvas) ---

function setFormat(format) {
    currentFormat = format;
    // Atualiza botões
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active', 'bg-accent', 'text-white'));
    document.getElementById(`btn-${format}`).classList.add('active', 'bg-accent', 'text-white');
    document.getElementById(`btn-${format}`).classList.remove('text-slate-400');
    
    // Reseta posição e redesenha
    resetEditor();
}

function resetEditor() {
    editState = { scale: 1, posX: 0, posY: 0, isDragging: false, lastX: 0, lastY: 0 };
    document.getElementById('zoom-slider').value = 1;
    drawEditor();
}

// Upload
document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
            userImg = img;
            document.getElementById('upload-instruction').classList.add('hidden');
            resetEditor();
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
});

// Zoom Slider
document.getElementById('zoom-slider').addEventListener('input', (e) => {
    editState.scale = parseFloat(e.target.value);
    drawEditor();
});

// Canvas Setup
function setupCanvasEvents() {
    const canvas = document.getElementById('editor-canvas');
    
    // Mouse Events
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
    
    // Touch Events
    canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
    window.addEventListener('touchmove', (e) => drag(e.touches[0]));
    window.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    if(!userImg) return;
    editState.isDragging = true;
    editState.lastX = e.clientX;
    editState.lastY = e.clientY;
}

function drag(e) {
    if(!editState.isDragging) return;
    const deltaX = e.clientX - editState.lastX;
    const deltaY = e.clientY - editState.lastY;
    
    editState.posX += deltaX;
    editState.posY += deltaY;
    
    editState.lastX = e.clientX;
    editState.lastY = e.clientY;
    
    drawEditor();
}

function endDrag() {
    editState.isDragging = false;
}

// O CORAÇÃO: Função de Desenho
function drawEditor() {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    
    // Define tamanho baseado no formato
    // Quadrado: 1080x1080 | Story: 1080x1920
    const width = CANVAS_SIZE;
    const height = currentFormat === 'square' ? 1080 : 1920;
    
    canvas.width = width;
    canvas.height = height;
    
    // Fundo padrão
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, height);
    
    if(userImg) {
        ctx.save();
        // Centraliza o pivot
        ctx.translate(width/2 + editState.posX, height/2 + editState.posY);
        ctx.scale(editState.scale, editState.scale);
        
        // Desenha imagem centralizada
        ctx.drawImage(userImg, -userImg.width/2, -userImg.height/2);
        ctx.restore();
    }
    
    // Desenha Moldura (Overlay)
    if(selectedCandidate) {
        const frameUrl = currentFormat === 'square' ? selectedCandidate.moldura_quadrada : selectedCandidate.moldura_story;
        const frame = new Image();
        frame.src = frameUrl;
        // Espera carregar se não estiver em cache (hack simples)
        if(frame.complete) {
            ctx.drawImage(frame, 0, 0, width, height);
        } else {
            frame.onload = () => ctx.drawImage(frame, 0, 0, width, height);
        }
    }
}

function finishEdit() {
    const canvas = document.getElementById('editor-canvas');
    const finalImg = document.getElementById('final-result');
    finalImg.src = canvas.toDataURL('image/png', 0.9); // Qualidade 90%
    changeStep(3);
}

// --- UTILITÁRIOS ---
function changeStep(step) {
    document.querySelectorAll('.step-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    // Barra de progresso
    const w = step === 1 ? '33%' : step === 2 ? '66%' : '100%';
    document.getElementById('progress-bar').style.width = w;
    window.scrollTo({top:0, behavior:'smooth'});
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = `meu-apoio-${Date.now()}.png`;
    link.href = document.getElementById('final-result').src;
    link.click();
}

async function shareImage() {
    const dataUrl = document.getElementById('final-result').src;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "apoio.png", { type: "image/png" });
    
    if(navigator.share) {
        navigator.share({ files: [file], title: "Meu Apoio 2026" });
    } else {
        alert("Baixe a imagem para compartilhar!");
        downloadImage();
    }
}
