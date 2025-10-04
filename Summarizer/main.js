const inputText = document.getElementById('inputText');
const fileInput = document.getElementById('fileInput');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryContainer = document.getElementById('summaryContainer');
const fileStatus = document.getElementById('fileStatus');

// Toast
function showToast(msg){
    const toast=document.createElement('div');
    toast.className='toast';
    toast.textContent=msg;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),1500);
}

// Copy & Speak
function setupActions(box){
    const copyBtn = box.querySelector('.copy-icon');
    const listenBtn = box.querySelector('.listen-icon');
    const textDiv = box.querySelector('div:last-child');

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(textDiv.textContent);
        showToast('Copied!');
    };

    listenBtn.onclick = () => {
        const utter = new SpeechSynthesisUtterance(textDiv.textContent);
        speechSynthesis.speak(utter);
        showToast('Speaking...');
    };
}

// Create summary box
function createSummaryBox(text){
    const div = document.createElement('div');
    div.classList.add('text-box');
    div.innerHTML=`
        <div class="text-actions">
            <span class="icon copy-icon" title="Copy"></span>
            <span class="icon listen-icon" title="Listen"></span>
        </div>
        <h3>Summary</h3>
        <div>${text}</div>
    `;
    summaryContainer.appendChild(div);
    setupActions(div);
}

// Smart summarize / elaborate
function summarizeSmart(text, wordCount){
    const words = text.split(' ');
    if(words.length <= wordCount){
        return text + " ...[Elaborated version]";
    } else {
        return words.slice(0, wordCount).join(' ') + '...';
    }
}

// Summarize button
summarizeBtn.onclick = () => {
    let text = inputText.value.trim();
    if(!text){
        showToast('Enter text or upload file first');
        return;
    }

    let wordCount = prompt("How many words should the summary be?", "50");
    if(!wordCount || isNaN(wordCount)) wordCount = 50;
    else wordCount = parseInt(wordCount);

    const summary = summarizeSmart(text, wordCount);
    createSummaryBox(summary);
};

// Handle file upload
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    fileStatus.textContent = 'Loading file...';

    const ext = file.name.split('.').pop().toLowerCase();

    try {
        if(ext === 'pdf'){
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            let fullText = '';
            for(let i=1;i<=pdf.numPages;i++){
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ') + '\n';
            }
            inputText.value = fullText;
        } else if(ext === 'docx' || ext === 'doc'){
            const reader = new FileReader();
            reader.onload = function(event){
                const arrayBuffer = event.target.result;
                mammoth.extractRawText({arrayBuffer}).then(result=>{
                    inputText.value = result.value;
                });
            }
            reader.readAsArrayBuffer(file);
        } else {
            showToast('Unsupported file type');
        }
        fileStatus.textContent = 'File loaded';
    } catch(err){
        console.error(err);
        showToast('Failed to read file');
        fileStatus.textContent = '';
    }
});

// Particles background
const bgCanvas=document.getElementById('background');
const bgCtx=bgCanvas.getContext('2d');
bgCanvas.width=window.innerWidth;
bgCanvas.height=window.innerHeight;
const particles=[];
for(let i=0;i<100;i++){
    particles.push({
        x:Math.random()*bgCanvas.width,
        y:Math.random()*bgCanvas.height,
        radius:Math.random()*2+1,
        dx:(Math.random()-0.5)*0.5,
        dy:(Math.random()-0.5)*0.5,
        alpha:Math.random(),
        alphaChange:Math.random()*0.02+0.005
    });
}
function drawParticles(){
    bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
    particles.forEach(p=>{
        p.x+=p.dx; p.y+=p.dy;
        if(p.x>bgCanvas.width)p.x=0;
        if(p.x<0)p.x=bgCanvas.width;
        if(p.y>bgCanvas.height)p.y=0;
        if(p.y<0)p.y=bgCanvas.height;
        p.alpha+=p.alphaChange;
        if(p.alpha>1 || p.alpha<0.2)p.alphaChange*=-1;
        bgCtx.beginPath();
        bgCtx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        bgCtx.fillStyle=`rgba(0,200,255,${p.alpha})`;
        bgCtx.fill();
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();
window.addEventListener('resize',()=>{
    bgCanvas.width=window.innerWidth;
    bgCanvas.height=window.innerHeight;
});
