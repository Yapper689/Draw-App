if (typeof window !== 'undefined') {

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let undoStack = [];
ctx.imageSmoothingEnabled = true;

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    const dist = Math.sqrt((lastX - e.offsetX) ** 2 + (lastY - e.offsetY) ** 2);
    const maxLineWidth = 11;
    const minLineWidth = 4;
    const maxDistance = 75;
    let lineWidth = maxLineWidth - ((dist / maxDistance) * (maxLineWidth - minLineWidth));
    lineWidth = Math.max(Math.min(lineWidth, maxLineWidth), minLineWidth);
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === "z" && undoStack.length > 0) {
        undo();
    }
});

function undo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (undoStack.length > 1) {
        undoStack.pop();
        ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
    } else {
        undoStack = [];
    }
}

}