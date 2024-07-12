// Shoutout https://codepen.io/bramus/pen/yLXpxRd
// @ref https://github.com/steveruizok/perfect-freehand#rendering

import { getStroke } from "perfect-freehand";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove, onChildAdded, onChildChanged, onChildRemoved, onValue, serverTimestamp, onDisconnect, increment } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://draw-c7619-default-rtdb.asia-southeast1.firebasedatabase.app/",
  apiKey: "AIzaSyBzQEY8JVj_hTU5ex4ACeTjPVdTts_Nipg",
  authDomain: "draw-c7619.firebaseapp.com",
  projectId: "draw-c7619",
  storageBucket: "draw-c7619.appspot.com",
  messagingSenderId: "663675275445",
  appId: "1:663675275445:web:f37ce08832229681d956fc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const colorInput = document.getElementById('color-input');
let currentColor = colorInput.value;
let isOnlineMode = false;

colorInput.addEventListener('input', function() {
    currentColor = colorInput.value;
});

if (typeof window !== 'undefined') {

    function getSvgPathFromStroke(stroke) {
        if (!stroke.length) return '';

        const d = stroke.reduce(
            (acc, [x0, y0], i, arr) => {
                const [x1, y1] = arr[(i + 1) % arr.length];
                acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
                return acc;
            },
            ['M', ...stroke[0], 'Q']
        );

        d.push('Z');
        return d.join(' ');
    }

    document.addEventListener('DOMContentLoaded', () => {
        let strokes = JSON.parse(localStorage.getItem('storedStrokes')) || [];
        let undoStack = [];
        let redoStack = [];
        const svg = document.querySelector('svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.appendChild(path);

        const strokesRef = ref(db, 'strokes');
        const undoStackRef = ref(db, 'undoStack');
        const redoStackRef = ref(db, 'redoStack');
        const userCountRef = ref(db, 'userCount');

        function updateUserCount(change) {
            set(userCountRef, increment(change));
        }

        onValue(userCountRef, (snapshot) => {
            const userCount = snapshot.val() || 0;
            document.getElementById('user-count').innerText = `Users: ${userCount}`;
        });

        const userRef = ref(db, `users/${Date.now()}`);
        set(userRef, { joinedAt: serverTimestamp() });
        onDisconnect(userRef).remove();
        updateUserCount(1);
        onDisconnect(userCountRef).set(increment(-1));

        function initializeDatabase() {
            strokes.forEach((stroke, index) => {
                const strokeRef = ref(db, `strokes/${index}`);
                set(strokeRef, stroke);
            });

            onChildAdded(strokesRef, (data) => {
                const newStroke = data.val();
                strokes.push(newStroke);
                render();
            });

            onChildChanged(strokesRef, (data) => {
                const updatedStroke = data.val();
                strokes[data.key] = updatedStroke;
                render();
            });

            onChildRemoved(strokesRef, () => {
                strokes = [];
                render();
            });

            onValue(undoStackRef, (snapshot) => {
                undoStack = snapshot.val() || [];
            });

            onValue(redoStackRef, (snapshot) => {
                redoStack = snapshot.val() || [];
            });
        }

        window.toggleOnlineMode = function() {
            isOnlineMode = !isOnlineMode;
            const toggleIcon = document.getElementById('toggleOnlineMode');
            if (isOnlineMode) {
                // Switch to online mode
                strokes = [];
                undoStack = [];
                redoStack = [];
                localStorage.removeItem('storedStrokes');
                initializeDatabase();
                toggleIcon.classList.remove('fa-handshake-slash');
                toggleIcon.classList.add('fa-handshake');
            } else {
                // Switch to offline mode
                strokes = [];
                undoStack = [];
                redoStack = [];
                render();
                toggleIcon.classList.remove('fa-handshake');
                toggleIcon.classList.add('fa-handshake-slash');
            }
        }

        svg.addEventListener('pointerdown', PointerDown);
        svg.addEventListener('pointermove', PointerMove);

        function render() {
            const paths = strokes.map(stroke =>
                getSvgPathFromStroke(
                    getStroke(stroke.map(point => [point[0], point[1]]), {
                        size: 16,
                        thinning: 0.5,
                        smoothing: 0.5,
                        streamline: 0.5,
                    })
                )
            );
            path.setAttribute('d', paths.join(' '));
            path.setAttribute('fill', currentColor);
            if (!isOnlineMode) {
                localStorage.setItem('storedStrokes', JSON.stringify(strokes));
            }
        }

        function PointerDown(e) {
            if (e.buttons === 1) {
                redoStack = [];
                if (isOnlineMode) {
                    set(redoStackRef, redoStack);
                }
                const stroke = [[e.pageX, e.pageY, e.pressure]];
                strokes.push(stroke);
                if (isOnlineMode) {
                    const newStrokeRef = ref(db, `strokes/${strokes.length - 1}`);
                    set(newStrokeRef, stroke);
                }
                render();
            }
        }

        function PointerMove(e) {
            if (e.buttons === 1 && strokes.length > 0) {
                const lastStroke = strokes[strokes.length - 1];
                lastStroke.push([e.pageX, e.pageY, e.pressure]);
                if (isOnlineMode) {
                    const lastStrokeRef = ref(db, `strokes/${strokes.length - 1}`);
                    set(lastStrokeRef, lastStroke);
                }
                render();
            }
        }

        function Undo() {
            if (strokes.length > 0) {
                const lastStroke = strokes.pop();
                undoStack.push(lastStroke);
                if (isOnlineMode) {
                    set(undoStackRef, undoStack);
                    set(strokesRef, strokes);
                }
                render();
            }
        }

        function Redo() {
            if (undoStack.length > 0) {
                const stroke = undoStack.pop();
                strokes.push(stroke);
                if (isOnlineMode) {
                    set(strokesRef, strokes);
                    set(undoStackRef, undoStack);
                }
                render();
            }
        }

        document.getElementById("clearCanvas").addEventListener("click", function() {
            undoStack.push([...strokes]);
            if (isOnlineMode) {
                set(undoStackRef, undoStack);
            }
            strokes = [];
            if (isOnlineMode) {
                remove(strokesRef);
            }
            path.setAttribute('d', '');
            localStorage.removeItem('storedStrokes');
        });

        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault(); 
                Undo();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault(); 
                Redo();
            }
        });
    });
}







/*
// Old Canvas Stroke
// Shoutout 'https://flaviocopes.com/error-document-not-defined/'
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', (e) => {
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
    })
}
*/







/*
// Xiaolin Wu's line algorithm (used on Old Canvas)
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
function drawLine(x0, y0, x1, y1) {
    let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) {
        [x0, y0] = [y0, x0];
        [x1, y1] = [y1, x1];
    }
    if (x0 > x1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }
    const dx = x1 - x0;
    const dy = y1 - y0;
    const gradient = dy / dx;
    let xend = Math.round(x0);
    let yend = y0 + gradient * (xend - x0);
    let xgap = 1 - rfpart(x0 + 0.5);
    let xpxl1 = xend;
    let ypxl1 = Math.floor(yend);
    if (steep) {
        plot(ypxl1, xpxl1, rfpart(yend) * xgap);
        plot(ypxl1 + 1, xpxl1, fpart(yend) * xgap);
    } else {
        plot(xpxl1, ypxl1, rfpart(yend) * xgap);
        plot(xpxl1, ypxl1 + 1, fpart(yend) * xgap);
    }
    let intery = yend + gradient;
    xend = Math.round(x1);
    yend = y1 + gradient * (xend - x1);
    xgap = rfpart(x1 + 0.5);
    let xpxl2 = xend;
    let ypxl2 = Math.floor(yend);
    if (steep) {
        plot(ypxl2, xpxl2, rfpart(yend) * xgap);
        plot(ypxl2 + 1, xpxl2, fpart(yend) * xgap);
    } else {
        plot(xpxl2, ypxl2, rfpart(yend) * xgap);
        plot(xpxl2, ypxl2 + 1, fpart(yend) * xgap);
    }
    if (steep) {
        for (let x = xpxl1 + 1; x < xpxl2; x++) {
            plot(Math.floor(intery), x, rfpart(intery));
            plot(Math.floor(intery) + 1, x, fpart(intery));
            intery += gradient;
        }
    } else {
        for (let x = xpxl1 + 1; x < xpxl2; x++) {
            plot(x, Math.floor(intery), rfpart(intery));
            plot(x, Math.floor(intery) + 1, fpart(intery));
            intery += gradient;
        }
    }
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
    drawLine(lastX, lastY, e.offsetX, e.offsetY);
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
function plot(x, y, brightness) {
    const opacity = brightness; 
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill();
}
function ipart(x) {
    return Math.floor(x);
}
function round(x) {
    return ipart(x + 0.5);
}
function fpart(x) {
    return x - ipart(x);
}
function rfpart(x) {
    return 1 - fpart(x);
}
}
*/