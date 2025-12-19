const templates = [
    {
        id: "bolsonaro_17",
        name: "Bolsonaro",
        party: "PL - 22",
        thumb: "assets/templates/bolsonaro_thumb.png",
        frame: "assets/templates/bolsonaro_moldura.png",
        color: "text-green-500"
    },
    {
        id: "lula_13",
        name: "Lula",
        party: "PT - 13",
        thumb: "assets/templates/lula_thumb.png",
        frame: "assets/templates/lula_moldura.png",
        color: "text-red-500"
    },
    {
        id: "marcal_28",
        name: "Pablo Marçal",
        party: "PRTB - 28",
        thumb: "assets/templates/marcal_thumb.png",
        frame: "assets/templates/marcal_moldura.png",
        color: "text-blue-500"
    },
    {
        id: "generic_blue",
        name: "Apoio Neutro",
        party: "Meu Candidato",
        thumb: "assets/templates/generic_thumb.png",
        frame: "assets/templates/generic_moldura.png",
        color: "text-white"
    }
];

let currentStep = 1;
let selectedTemplate = null;
let userImage = null;

document.addEventListener("DOMContentLoaded", () => {
    renderTemplates();
    document.getElementById('search-input').addEventListener('input', filterTemplates);
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
});

function renderTemplates(filter = "") {
    const grid = document.getElementById('template-grid');
    grid.innerHTML = "";

    const filtered = templates.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(t => {
        const card = document.createElement('button');
        card.className = "group relative flex flex-col items-center p-4 bg-surface-dark rounded-xl shadow-card hover:shadow-glow transition-all duration-300 border border-white/5 hover:border-accent-cyan/30 text-center hover:-translate-y-1";
        card.onclick = () => selectTemplate(t);
        
        card.innerHTML = `
            <div class="relative w-20 h-20 mb-3 rounded-full p-1 bg-surface-dark border border-white/10 shadow-inner overflow-hidden ring-1 ring-white/5 group-hover:ring-accent-cyan/50 transition-all">
                <img src="${t.thumb}" alt="${t.name}" class="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" onerror="this.src='https://placehold.co/100x100/1e293b/FFF?text=IMG'">
            </div>
            <h3 class="text-base font-bold text-white leading-tight mb-1 group-hover:text-accent-cyan transition-colors">${t.name}</h3>
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wide group-hover:text-white transition-colors">${t.party}</p>
        `;
        grid.appendChild(card);
    });
}

function filterTemplates(e) {
    renderTemplates(e.target.value);
}

function selectTemplate(template) {
    selectedTemplate = template;
    changeStep(2);
}

function changeStep(step) {
    document.querySelectorAll('.step-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    const progressBar = document.getElementById('progress-bar');
    const stepLabel = document.getElementById('step-label');
    const stepTitle = document.getElementById('step-title');

    if(step === 1) {
        progressBar.style.width = "33%";
        stepLabel.innerText = "Passo 1 de 3";
        stepTitle.innerText = "Seleção";
    } else if(step === 2) {
        progressBar.style.width = "66%";
        stepLabel.innerText = "Passo 2 de 3";
        stepTitle.innerText = "Upload";
    } else if(step === 3) {
        progressBar.style.width = "100%";
        stepLabel.innerText = "Passo 3 de 3";
        stepTitle.innerText = "Pronto";
    }
    
    currentStep = step;
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                userImage = img;
                document.getElementById('preview-img').src = img.src;
                document.getElementById('preview-img').classList.remove('hidden');
                document.getElementById('upload-placeholder').classList.add('hidden');
                setTimeout(() => processImage(), 300); 
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function processImage() {
    if (!userImage || !selectedTemplate) return;

    changeStep(3);
    const canvas = document.getElementById('canvas-processor');
    const ctx = canvas.getContext('2d');

    const width = 1080;
    const height = 1480; 

    canvas.width = width;
    canvas.height = height;

    // Fundo
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, height);

    // Foto Usuario (Crop Cover)
    const scale = Math.max(width / userImage.width, 1080 / userImage.height);
    const x = (width / 2) - (userImage.width / 2) * scale;
    const y = (1080 / 2) - (userImage.height / 2) * scale;
    
    ctx.drawImage(userImage, x, y, userImage.width * scale, userImage.height * scale);

    // Moldura
    const frameImg = new Image();
    frameImg.src = selectedTemplate.frame;
    frameImg.crossOrigin = "anonymous";
    frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 1080, width, 400);
        document.getElementById('final-result').src = canvas.toDataURL('image/png', 1.0);
    };
    frameImg.onerror = () => {
        console.error("Erro ao carregar moldura: " + selectedTemplate.frame);
    }
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = `apoio_${selectedTemplate.id}_${Date.now()}.png`;
    link.href = document.getElementById('final-result').src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function shareImage() {
    const dataUrl = document.getElementById('final-result').src;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "apoio.png", { type: "image/png" });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Meu Apoio 2026',
            });
        } catch (err) {
            console.log(err);
        }
    } else {
        downloadImage();
    }
}