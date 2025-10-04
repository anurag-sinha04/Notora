// Cursor glow
const cursorGlow=document.createElement('div');
cursorGlow.classList.add('cursor-glow');
document.body.appendChild(cursorGlow);
document.addEventListener('mousemove', e=>{
  cursorGlow.style.left=`${e.clientX}px`;
  cursorGlow.style.top=`${e.clientY}px`;
});

// Translation system
const textInput=document.getElementById('text-input');
const translateButton=document.getElementById('translate-button');
const stopButton=document.getElementById('stop-button');
const videoDisplay=document.getElementById('video-display');
const loopButton=document.getElementById('loop-button');

let isTranslating=false;
let isPaused=false;
let currentIndex=0;
let sequence=[];
let isLooping=false;

const videoElement=videoDisplay.querySelector('video');
const placeholderText=videoDisplay.querySelector('p');

loopButton.addEventListener('click', ()=>{
  isLooping=!isLooping;
  loopButton.textContent=isLooping?'Stop Loop':'Loop Avatar';
});

const textArea = document.getElementById('text-input');

textArea.addEventListener('focus', () => {
  // Scroll the textarea into view smoothly
  textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
});


stopButton.addEventListener('click', ()=>{
  if(!isTranslating)return;
  isPaused=true;
  videoElement.pause();
  translateButton.textContent='Resume';
});

translateButton.addEventListener('click', ()=>{
  if(!isTranslating && sequence.length===0){
    startTranslation();
  } else if(isPaused){
    isPaused=false;
    playSequence(currentIndex);
    translateButton.textContent='Translating...';
  }
});

function checkVideoExists(path){
  return new Promise(resolve=>{
    const xhr=new XMLHttpRequest();
    xhr.open('HEAD',path,true);
    xhr.onload=()=>resolve(xhr.status!==404);
    xhr.onerror=()=>resolve(false);
    xhr.send();
  });
}

async function getVideoPath(name){
  const formats=['.mp4','.webm'];
  for(const ext of formats){
    const path=`videos/${name.toLowerCase()}${ext}`;
    if(await checkVideoExists(path))return path;
  }
  return null;
}

async function prepareSequence(text){
  const words=text.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/);
  const seq=[];
  for(const word of words){
    const path=await getVideoPath(word);
    if(path)seq.push(path);
    else{
      for(const letter of word.toUpperCase()){
        const letterPath=await getVideoPath(letter);
        if(letterPath)seq.push(letterPath);
      }
    }
  }
  return seq;
}

async function playSequence(startIndex=0){
  placeholderText.style.display='none';
  translateButton.disabled=true;
  for(let i=startIndex;i<sequence.length;i++){
    if(isPaused){
      currentIndex=i;
      translateButton.disabled=false;
      translateButton.textContent='Resume';
      return;
    }
    currentIndex=i;
    videoElement.src=sequence[i];
    videoElement.loop=isLooping;
    try{await videoElement.play();}catch(e){console.error(e);continue;}
    await new Promise(resolve=>{
      const onEnd=()=>{videoElement.removeEventListener('ended',onEnd);if(!isLooping)resolve(true);}
      if(!isLooping)videoElement.addEventListener('ended',onEnd);
      if(isLooping)resolve(true);
    });
  }
  videoElement.pause();
  videoElement.src='';
  placeholderText.style.display='flex';
  isTranslating=false;
  sequence=[];
  currentIndex=0;
  translateButton.textContent='Translate';
  translateButton.disabled=false;
}

async function startTranslation(){
  const text=textInput.value.trim();
  if(!text){
    placeholderText.textContent="Please enter some text first.";
    placeholderText.style.display='flex';
    return;
  }
  isTranslating=true;
  isPaused=false;
  currentIndex=0;
  translateButton.disabled=true;
  translateButton.textContent='Translating...';
  sequence=await prepareSequence(text);
  translateButton.disabled=false;
  await playSequence(0);
}

textInput.addEventListener('keydown', e=>{
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){
    e.preventDefault();
    startTranslation();
  }
});
