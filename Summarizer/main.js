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

// Extractive summarizer
function extractiveSummarize(text, wordLimit){
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const freq = {};
    const stopwords = ["the","and","of","to","in","a","is","it","for","on","with","as","by","at","this","that","from","or"];
    text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).forEach(word=>{
        if(!stopwords.includes(word) && word.length>2){
            freq[word] = (freq[word]||0)+1;
        }
    });
    const scored = sentences.map(s=>{
        let score=0;
        s.toLowerCase().split(/\s+/).forEach(w=>{ if(freq[w]) score+=freq[w]; });
        return {sentence:s, score};
    });
    scored.sort((a,b)=>b.score-a.score);

    const summarySentences=[];
    let totalWords=0;
    for(const s of scored){
        const words=s.sentence.split(/\s+/).length;
        if(totalWords + words <= wordLimit){
            summarySentences.push(s.sentence.trim());
            totalWords += words;
        }
        if(totalWords >= wordLimit) break;
    }
    if(summarySentences.length===0) return text; // too short
    return summarySentences.join(' ');
}

// Summarize button
summarizeBtn.onclick = () => {
    const text = inputText.value.trim();
    if(!text){
        showToast('Enter text or upload file first');
        return;
    }

    let wordCount = prompt("How many words should the summary be?", "50");
    if(!wordCount || isNaN(wordCount)) wordCount = 50;
    else wordCount = parseInt(wordCount);

    const summary = extractiveSummarize(text, wordCount);
    createSummaryBox(summary);
};

// File upload
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    fileStatus.textContent = 'Loading file...';
    const ext = file.name.split('.').pop().toLowerCase();
    try {
        if(ext==='pdf'){
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            let fullText='';
            for(let i=1;i<=pdf.numPages;i++){
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item=>item.str).join(' ') + ' ';
            }
            inputText.value = fullText;
        } else if(ext==='docx' || ext==='doc'){
            const reader = new FileReader();
            reader.onload = function(event){
                const arrayBuffer = event.target.result;
                mammoth.extractRawText({arrayBuffer}).then(result=>{
                    inputText.value=result.value;
                });
            }
            reader.readAsArrayBuffer(file);
        } else {
            showToast('Unsupported file type');
        }
        fileStatus.textContent='File loaded';
    } catch(err){
        console.error(err);
        showToast('Failed to read file');
        fileStatus.textContent='';
    }
});

// Particles background
const bgCanvas=document.getElementById('background');
const bgCtx=bgCanvas.getContext('2d');
bgCanvas.width=window.innerWidth;
bgCanvas.height=window.inner
