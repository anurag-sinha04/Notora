const textInput = document.getElementById('text-input');
const translateButton = document.getElementById('translate-button');
const videoDisplay = document.getElementById('video-display');
const hero = document.querySelector('.hero-gradient');
const heroContent = document.querySelector('.hero-gradient-content');
const loopButton = document.getElementById('loop-button');
let isTranslating = false;
let isLooping = false;

// Mouse-follow gradient
document.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  hero.style.setProperty('--x', `${x}px`);
  hero.style.setProperty('--y', `${y}px`);

  // Slight tilt effect
  const rotateX = ((y / rect.height) - 0.5) * 10;
  const rotateY = ((x / rect.width) - 0.5) * 10;
  heroContent.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

// Toggle looping
loopButton.addEventListener('click', () => {
  isLooping = !isLooping;
  loopButton.textContent = isLooping ? 'Stop Loop' : 'Loop Avatar';
});

// Check if video exists
function checkVideoExists(path) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', path, true);
    xhr.onload = () => resolve(xhr.status !== 404);
    xhr.onerror = () => resolve(false);
    xhr.send();
  });
}

// Play video (.mp4 or .webm)
async function playSignVideo(name) {
  const formats = ['.mp4', '.webm'];
  for (const ext of formats) {
    const path = `videos/${name.toLowerCase()}${ext}`;
    const exists = await checkVideoExists(path);
    if (exists) {
      const video = document.createElement('video');
      video.src = path;
      video.autoplay = true;
      video.controls = false;
      video.muted = false;
      video.loop = isLooping;
      video.className = "w-full h-auto rounded-lg shadow-lg";

      videoDisplay.innerHTML = "";
      videoDisplay.appendChild(video);

      return new Promise((resolve) => {
        video.onended = () => resolve(true);
        video.onerror = () => resolve(false);
      });
    }
  }
  return false;
}

// Main translation logic
async function handleTranslation() {
  if (isTranslating) return;

  const text = textInput.value.trim();
  if (!text) {
    videoDisplay.innerHTML = `<p class="text-amber-400">Please enter some text first.</p>`;
    return;
  }

  isTranslating = true;
  translateButton.disabled = true;
  translateButton.textContent = 'Translating...';

  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

  for (const word of words) {
    const playedWord = await playSignVideo(word);
    if (!playedWord) {
      for (const letter of word.toUpperCase()) {
        await playSignVideo(letter);
      }
    }
  }

  videoDisplay.innerHTML = `<p class="text-green-400 font-bold text-lg">Translation Complete ✅</p>`;
  isTranslating = false;
  translateButton.disabled = false;
  translateButton.textContent = 'Translate';
}

// Event listeners
translateButton.addEventListener('click', handleTranslation);
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    handleTranslation();
  }
});
