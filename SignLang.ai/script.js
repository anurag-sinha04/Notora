const textInput = document.getElementById('text-input');
const translateButton = document.getElementById('translate-button');
const stopButton = document.getElementById('stop-button');
const videoDisplay = document.getElementById('video-display');
const loopButton = document.getElementById('loop-button');

let isTranslating = false;
let isPaused = false;
let currentIndex = 0;
let sequence = [];
let isLooping = false;

// Single video element
const videoElement = videoDisplay.querySelector('video');
const placeholderText = videoDisplay.querySelector('p');

// Loop toggle
loopButton.addEventListener('click', () => {
  isLooping = !isLooping;
  loopButton.textContent = isLooping ? 'Stop Loop' : 'Loop Avatar';
});

// Stop / Pause
stopButton.addEventListener('click', () => {
  isPaused = true;
  videoElement.pause();
  translateButton.textContent = 'Resume';
});

// Start / Resume
translateButton.addEventListener('click', () => {
  if (!isTranslating && sequence.length === 0) {
    startTranslation();
  } else if (isPaused) {
    isPaused = false;
    playSequence(currentIndex);
    translateButton.textContent = 'Translating...';
  }
});

// Check video exists
function checkVideoExists(path) {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', path, true);
    xhr.onload = () => resolve(xhr.status !== 404);
    xhr.onerror = () => resolve(false);
    xhr.send();
  });
}

// Get video path for word/letter
async function getVideoPath(name) {
  const formats = ['.mp4', '.webm'];
  for (const ext of formats) {
    const path = `videos/${name.toLowerCase()}${ext}`;
    if (await checkVideoExists(path)) return path;
  }
  return null;
}

// Prepare sequence
async function prepareSequence(text) {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const seq = [];
  for (const word of words) {
    const path = await getVideoPath(word);
    if (path) seq.push(path);
    else {
      for (const letter of word.toUpperCase()) {
        const letterPath = await getVideoPath(letter);
        if (letterPath) seq.push(letterPath);
      }
    }
  }
  return seq;
}

// Play sequence from currentIndex
async function playSequence(startIndex = 0) {
  placeholderText.style.display = 'none'; // hide placeholder during playback
  for (let i = startIndex; i < sequence.length; i++) {
    if (isPaused) {
      currentIndex = i;
      return;
    }
    currentIndex = i;
    videoElement.src = sequence[i];
    videoElement.loop = isLooping;
    try { await videoElement.play(); } 
    catch (e) { console.error("Video play error:", e); continue; }
    await new Promise(resolve => {
      const onEnd = () => { videoElement.removeEventListener('ended', onEnd); resolve(true); };
      videoElement.addEventListener('ended', onEnd);
    });
  }

  // End of sequence — reset
  videoElement.pause();
  videoElement.src = '';
  placeholderText.style.display = 'flex'; // show placeholder again
  isTranslating = false;
  sequence = [];
  translateButton.textContent = 'Translate';
}

// Start translation
async function startTranslation() {
  const text = textInput.value.trim();
  if (!text) {
    placeholderText.textContent = "Please enter some text first.";
    placeholderText.style.display = 'flex';
    return;
  }

  isTranslating = true;
  isPaused = false;
  currentIndex = 0;
  translateButton.disabled = true;
  translateButton.textContent = 'Translating...';

  sequence = await prepareSequence(text);
  translateButton.disabled = false;
  await playSequence(0);
}

// Ctrl+Enter to start
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    startTranslation();
  }
});
