var isMouseDown = false;
var lastX = 0;
var lastY = 0;
var midX = 249;
var midY = 249;
var startAngle = 0;
var isMuted = false;

var choiceTextSize = [];
var spinTimeout = null;
var spinTime = 0;
var spinTimeTotal = 0;
var slowDown = false;
var spinAngleStart = 0;

var ctx;
var ctxTop;

var maxHeight = window.screen.availHeight;
var maxWidth = window.screen.availWidth;
var wheelSize = 300;
var canvasSize = 300;
var wheelImage = new Image();

var angleSinceBeep = 0;
var timeSinceBeep = 0;
var hasOddChoiceCount = false;
var firstSpinCycle = false;
var lastBeepIndex = -1;

function wheelMouseMove(e) {
    if (!isMouseDown) return;
    var x = e.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
    var y = e.clientY + document.documentElement.scrollTop + document.body.scrollTop;
    var spinAngle = 0;
    if (x > midX) {
        spinAngle = y > midY ? ((lastX - x) - (lastY - y)) * 0.01 : (0 - (lastX - x) - (lastY - y)) * 0.01;
    } else {
        spinAngle = y > midY ? ((lastX - x) + (lastY - y)) * 0.01 : (0 - (lastX - x) + (lastY - y)) * 0.01;
    }
    startAngle += spinAngle * 10 * Math.PI / 180;
    lastX = x;
    lastY = y;
    drawRouletteWheelImage(spinAngle * 10);
}

function wheelMouseMove2(x, y) {
    if (!isMouseDown) return;
    var spinAngle = 0;
    if (x > midX) {
        spinAngle = y > midY ? ((lastX - x) - (lastY - y)) * 0.01 : (0 - (lastX - x) - (lastY - y)) * 0.01;
    } else {
        spinAngle = y > midY ? ((lastX - x) + (lastY - y)) * 0.01 : (0 - (lastX - x) + (lastY - y)) * 0.01;
    }
    startAngle += spinAngle * 10 * Math.PI / 180;
    lastX = x;
    lastY = y;
    drawRouletteWheelImage(spinAngle * 10);
}

function wheelMouseUp(e) {
    isMouseDown = false;
}

var audio1ended = true;
var audio2ended = true;
var audio3ended = true;

function playSound() {
    if (isMuted) return;
    var audio = document.getElementById("wheelAudio");
    if (audio1ended) {
        audio1ended = false;
        audio.play();
        audio.addEventListener('ended', function() { audio1ended = true; }, false);
    } else if (audio2ended) {
        audio2ended = false;
        var audio2 = document.getElementById("wheelAudio2");
        audio2.play();
        audio2.addEventListener('ended', function() { audio2ended = true; }, false);
    } else if (audio3ended) {
        audio3ended = false;
        var audio3 = document.getElementById("wheelAudio3");
        audio3.play();
        audio3.addEventListener('ended', function() { audio3ended = true; }, false);
    }
}

function toggleMute(button) {
    if (isMuted) {
        button.value = "Mute";
        button.src = "images/unmute.png";
        isMuted = false;
    } else {
        button.value = "Unmute";
        button.src = "images/mute.png";
        isMuted = true;
    }
}

function addTouchEventListeners() {
    var overlay = document.getElementById("wheelcanvastop");
    overlay.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var touch = e.touches[0];
        wheelMouseMove2(touch.pageX, touch.pageY);
    }, false);
    overlay.addEventListener('touchstart', function(e) {
        e.preventDefault();
        wheelMouseDown(e.touches[0]);
    }, false);
    overlay.addEventListener('touchend', function(e) {
        e.preventDefault();
        wheelMouseUp(e.touches[0]);
        spin();
    }, false);
}

function clearTopCanvas() {
    var overlayCanvas = document.getElementById("wheelcanvastop");
    if (overlayCanvas.getContext) {
        ctxTop = overlayCanvas.getContext("2d");
        ctxTop.clearRect(0, 0, canvasSize, canvasSize);
    }
}

function draw() {
    calcFontSizes();
    drawWheel();
    setWheelImageSource();
}

function drawArrow() {
    var overlayCanvas = document.getElementById("wheelcanvastop");
    if (!overlayCanvas.getContext) return;
    ctxTop = overlayCanvas.getContext("2d");
    ctxTop.fillStyle = "black";
    ctxTop.beginPath();
    ctxTop.moveTo(0, wheelRadius + 5);
    ctxTop.lineTo(0, wheelRadius - 5);
    ctxTop.lineTo(13, wheelRadius);
    ctxTop.lineTo(0, wheelRadius + 5);
    ctxTop.fill();
}

function setWheelImageSource() {
    var canvas = document.getElementById("wheelcanvas");
    if (canvas.getContext) {
        ctx = canvas.getContext("2d");
        if (wheelImage.src == "") {
            wheelImage.src = canvas.toDataURL();
        }
    }
}

function drawRouletteWheelImage() {
    var canvas = document.getElementById("wheelcanvas");
    if (!canvas.getContext) return;
    ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(startAngle);
    ctx.drawImage(wheelImage, -canvas.width / 2, -canvas.width / 2);
}

function rotateWheelImage() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        onSpinEnd();
        return;
    }
    var spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += spinAngle * Math.PI / 180;
    playSoundIfNeededWithWeights();
    drawRouletteWheelImage();
    clearTimeout(spinTimeout);
    spinTimeout = setTimeout('rotateWheelImage()', 30);
}

function playSoundIfNeededWithWeights() {
    if (timeSinceBeep > 30) {
        var currentIndex = getCurrentChoiceWithWeights().index;
        if (currentIndex != lastBeepIndex) {
            lastBeepIndex = currentIndex;
            timeSinceBeep = 0;
            playSound();
        } else {
            timeSinceBeep += 30;
        }
    } else {
        timeSinceBeep += 30;
    }
}

function easeOut(t, b, c, d) {
    var ts = (t /= d) * t;
    var tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

function getCurrentChoiceWithWeights() {
    var degrees = startAngle * 180 / Math.PI + 180;
    var sliceDeg = sliceAngle * 180 / Math.PI;
    var pos = 360 - degrees % 360;
    var weightedIndex = 0;
    for (var i = 0; i < choices.length; i++) {
        var weight = weights.length > i ? weights[i] : 1;
        weightedIndex += weight;
        if (pos < weightedIndex * sliceDeg) {
            return { text: choices[i], index: i };
        }
    }
    var index = Math.floor((360 - degrees % 360) / sliceDeg);
    return { text: choices[index], index: index };
}
