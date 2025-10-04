const startBtn = document.getElementById('startBtn');
const originalText = document.getElementById('originalText');
const translatedText = document.getElementById('translatedText');
const sourceLangSelect = document.getElementById('source_lang');
const targetLangSelect = document.getElementById('target_lang');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const summarizeContainer = document.getElementById('summarize-container');
const summaryBoxes = document.getElementById('summary-container');

let recognition, listening = false;
let audioCtx, analyser, dataArray;

// Toast
function showToast(msg){
    const toast = document.createElement('div');
    toast.className='toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),1500);
}

// Copy and Speak
function setupActions(box){
    const copyBtn = box.querySelector('.copy-icon');
    const listenBtn = box.querySelector('.listen-icon');
    const textDiv = box.querySelector('div:last-child');

    copyBtn.onclick = ()=>{
        navigator.clipboard.writeText(textDiv.textContent);
        showToast('Copied!');
    };
    listenBtn.onclick = ()=>{
        const utter = new SpeechSynthesisUtterance(textDiv.textContent);
        speechSynthesis.speak(utter);
        showToast('Speaking...');
    };
}

// Setup existing boxes
setupActions(document.getElementById('original-box'));
setupActions(document.getElementById('translated-box'));

// Speech Recognition
if('webkitSpeechRecognition' in window){
    recognition=new webkitSpeechRecognition();
    recognition.continuous=true;
    recognition.interimResults=true;
    recognition.onresult=e=>{
        let text='';
        for(let i=e.resultIndex;i<e.results.length;i++){
            text+=e.results[i][0].transcript+' ';
        }
        if(text.trim()!==''){
            originalText.textContent=text;
            fetch('/translate',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({text, source_lang:sourceLangSelect.value, target_lang:targetLangSelect.value})
            }).then(res=>res.json()).then(data=>{
                translatedText.textContent=data.translated_text||"";
            });
        }
    };
    recognition.onend=()=>{
        listening=false;
        startBtn.classList.remove('listening');
        showSummarizeButton();
    };
}else{ alert("Speech Recognition not supported"); }

// Start/Stop
startBtn.onclick=async ()=>{
    if(!recognition) return;
    if(!listening){
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        startVisualizer(stream);
        recognition.lang=sourceLangSelect.value;
        recognition.start();
        listening=true;
        startBtn.classList.add('listening');
        summarizeContainer.innerHTML="";
    }else{
        recognition.stop();
        stopVisualizer();
    }
};

// Summarize
function showSummarizeButton(){
    summarizeContainer.innerHTML=`<button id="summarizeBtn">📝 Summarize</button>`;
    const btn=document.getElementById('summarizeBtn');
    btn.onclick=()=>{
        fetch('/summarize',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({text:translatedText.textContent})
        }).then(res=>res.json()).then(data=>{
            addSummaryBox(data.summary_text);
        });
        btn.disabled=true;
    };
}

function addSummaryBox(text){
    const div=document.createElement('div');
    div.classList.add('text-box');
    div.innerHTML=`
        <div class="text-actions">
            <span class="icon copy-icon" title="Copy"></span>
            <span class="icon listen-icon" title="Listen"></span>
        </div>
        <h3>Summary</h3>
        <div>${text}</div>
    `;
    summaryBoxes.appendChild(div);
    setupActions(div);
}

// Audio Visualizer
function startVisualizer(stream){
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    analyser=audioCtx.createAnalyser();
    const source=audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize=256;
    dataArray=new Uint8Array(analyser.frequencyBinCount);
    drawVisualizer();
}

function drawVisualizer(){
    if(!analyser) return;
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let barWidth=(canvas.width/dataArray.length)*2.5;
    let x=0;
    for(let i=0;i<dataArray.length;i++){
        let barHeight=dataArray[i]/2;
        ctx.fillStyle=`rgb(${barHeight+100},50,255)`;
        ctx.fillRect(x,canvas.height-barHeight,barWidth,barHeight);
        x+=barWidth+1;
    }
}

function stopVisualizer(){
    if(audioCtx) audioCtx.close();
    analyser=null;
    ctx.clearRect(0,0,canvas.width,canvas.height);
}

// Glowing stars
const bgCanvas=document.getElementById('background');
const bgCtx=bgCanvas.getContext('2d');
bgCanvas.width=window.innerWidth;
bgCanvas.height=window.innerHeight;
const stars=[];
for(let i=0;i<120;i++){
    stars.push({x:Math.random()*bgCanvas.width,y:Math.random()*bgCanvas.height,radius:Math.random()*1.5+0.5,alpha:Math.random(),alphaChange:Math.random()*0.02+0.005});
}
function drawStars(){
    bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
    stars.forEach(s=>{
        s.alpha+=s.alphaChange;
        if(s.alpha>1||s.alpha<0.1) s.alphaChange*=-1;
        bgCtx.beginPath();
        bgCtx.arc(s.x,s.y,s.radius,0,Math.PI*2);
        bgCtx.fillStyle=`rgba(0,200,255,${s.alpha})`;
        bgCtx.fill();
    });
    requestAnimationFrame(drawStars);
}
drawStars();
window.addEventListener('resize',()=>{bgCanvas.width=window.innerWidth; bgCanvas.height=window.innerHeight;});
