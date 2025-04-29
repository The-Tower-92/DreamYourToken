const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');
const uploadedImage = document.getElementById('uploaded-image');
const frameOverlay = document.getElementById('frame-overlay');
const canvas = document.getElementById('canvas');

const frames = ['frames/frame1.png', 'frames/frame2.png', 'frames/frame3.png'];
let currentFrame = 0;

uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = function (event) {
        uploadedImage.src = event.target.result;
        uploadedImage.style.display = 'block';
    }
    reader.readAsDataURL(e.target.files[0]);
});

document.getElementById('prev-frame').addEventListener('click', () => {
    currentFrame = (currentFrame - 1 + frames.length) % frames.length;
    frameOverlay.src = frames[currentFrame];
});

document.getElementById('next-frame').addEventListener('click', () => {
    currentFrame = (currentFrame + 1) % frames.length;
    frameOverlay.src = frames[currentFrame];
});

function updateFilters() {
    const brightness = document.getElementById('brightness').value;
    const contrast = document.getElementById('contrast').value;
    const saturation = document.getElementById('saturation').value;
    const gamma = document.getElementById('gamma').value;
    const whiteLevel = document.getElementById('white-level').value;
    const blackLevel = document.getElementById('black-level').value;

    uploadedImage.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
}

const slicers = ['brightness', 'contrast', 'saturation', 'gamma', 'white-level', 'black-level'];
slicers.forEach(id => {
    const range = document.getElementById(id);
    const number = document.getElementById(`${id}-value`);

    range.addEventListener('input', () => {
        number.value = range.value;
        updateFilters();
    });
    number.addEventListener('input', () => {
        range.value = number.value;
        updateFilters();
    });
});

document.getElementById('download-button').addEventListener('click', () => {
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext('2d');
    ctx.filter = uploadedImage.style.filter;
    ctx.drawImage(uploadedImage, 0, 0);
    const link = document.createElement('a');
    link.download = 'immagine_modificata.png';
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById('reset-button').addEventListener('click', () => {
    slicers.forEach(id => {
        const range = document.getElementById(id);
        const number = document.getElementById(`${id}-value`);
        if (id === 'gamma') {
            range.value = 1;
            number.value = 1;
        } else if (id === 'white-level') {
            range.value = 255;
            number.value = 255;
        } else if (id === 'black-level') {
            range.value = 0;
            number.value = 0;
        } else {
            range.value = 100;
            number.value = 100;
        }
    });
    updateFilters();
});
