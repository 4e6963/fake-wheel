var colors = ["#FFFF00", "#3333FF", "#FF2222"];
var choices = [];
var weights = [];
var probWeights = [];
var sliceAngle;
var weightedChoiceCount;
var wheelRadius;
var textRadius;
var innerRadius;
var lastInputIndex;
var inputCount;
var canvasSize;

function initChoices() {
    var params = new URLSearchParams(window.location.search);
    for (var i = 1; i <= 100; i++) {
        var val = params.get('c' + i);
        if (val !== null && val.trim() !== '') {
            choices.push(val.trim());
        }
    }
}

function initWheelGeometry() {
    weightedChoiceCount = choices.length;
    if (weights.length > 0) {
        for (var i = 0; i < weights.length; i++) {
            weightedChoiceCount += weights[i] - 1;
        }
    }
    sliceAngle = Math.PI * 2 / weightedChoiceCount;

    if (weightedChoiceCount % 2 === 1) {
        hasOddChoiceCount = true;
        firstSpinCycle = true;
    }

    lastInputIndex = choices.length;
    inputCount = lastInputIndex;
}

function initCanvas() {
    var wheelCanvas = document.getElementById("wheelcanvas");
    var overlayCanvas = document.getElementById("wheelcanvastop");
    var wheelContainer = document.getElementById('wheelcanvasOuter');
    canvasSize = 500;

    if (window.frameElement) {
        maxWidth = window.frameElement.offsetWidth;
        maxHeight = window.frameElement.offsetHeight;
    }

    wheelCanvas.width = canvasSize;
    wheelCanvas.height = canvasSize;
    wheelSize = canvasSize;
    overlayCanvas.width = canvasSize;
    overlayCanvas.height = canvasSize;
    wheelContainer.style.width = canvasSize + "px";
    wheelContainer.style.height = canvasSize + "px";

    wheelRadius = wheelSize * 0.5;
    textRadius = wheelRadius * 0.9;
    innerRadius = wheelRadius * 0.1;

    var clickToSpinImg = new Image();
    clickToSpinImg.onload = function() {
        overlayCanvas.getContext('2d').drawImage(clickToSpinImg, 0, 0, canvasSize, canvasSize);
    };
    clickToSpinImg.src = '/images/spin.png';
}

function initInputFields() {
    for (var i = 0; i < choices.length; i++) {
        var input = $('input[name="c' + (i + 1) + '"]');
        if (input.length) input.val(choices[i]);
    }
}

function addElement() {
    if (inputCount < 100 && lastInputIndex < 200) {
        lastInputIndex++;
        inputCount++;
        var container = document.getElementById('txtChoices');
        var div = document.createElement('div');
        div.setAttribute('id', 'strText' + lastInputIndex);
        div.setAttribute('class', 'input-group');
        div.innerHTML = "<input onfocus='addElementIfNeeded(" + lastInputIndex + ")' class='form-control' type='text' id='c" + lastInputIndex + "' name='c" + lastInputIndex + "'/><span class='input-group-btn' id='basic-addon2'><input type='button' value='X' onclick='removeElementID(" + lastInputIndex + ");' tabindex='1000'></span>";
        container.appendChild(div);
    } else {
        alert("Number of wheel slices cannot exceed 100. Visit our Business page to purchase a wheel beyond 100 slices.");
    }
}

function addElementIfNeeded(id) {
    if (id === lastInputIndex) {
        addElement();
    }
}

function removeElementID(id) {
    document.getElementById('txtChoices').removeChild(document.getElementById('strText' + id));
    inputCount--;
}

function wheelMouseDown(e) {
    clearTopCanvas();
    drawArrow();
    var overlay = document.getElementById("wheelcanvastop");
    midX = overlay.offsetLeft + wheelRadius + overlay.offsetParent.offsetLeft + overlay.offsetParent.offsetParent.offsetLeft;
    midY = overlay.offsetTop + wheelRadius + overlay.offsetParent.offsetTop + overlay.offsetParent.offsetParent.offsetTop;
    lastX = e.clientX;
    lastY = e.clientY;
    isMouseDown = true;
}

function calcFontSizes() {
    var canvas = document.getElementById("wheelcanvas");
    if (!canvas.getContext) return;

    ctx = canvas.getContext("2d");
    choiceTextSize = [];
    for (var i = 0; i < choices.length; i++) {
        var text = choices[i];
        ctx.font = 'bold 18px sans-serif';
        if (ctx.measureText(text).width > textRadius - 30) {
            ctx.font = 'bold 15px sans-serif';
            choiceTextSize.push(ctx.measureText(text).width > textRadius - 30 ? "12" : "15");
        } else {
            choiceTextSize.push("18");
        }
    }
}

function drawWheel() {
    var canvas = document.getElementById("wheelcanvas");
    if (!canvas.getContext) return;

    ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    var weightedIndex = 0;

    for (var i = 0; i < choices.length; i++) {
        var weight = weights.length > i ? weights[i] : 1;
        var wedge = sliceAngle * weight;
        var angle = startAngle + weightedIndex * sliceAngle;
        var endAngle = angle + wedge;
        if (endAngle > 6.282 && endAngle < 6.284) endAngle = 6.282;

        ctx.fillStyle = (i % 2 === 1) ? "#FFFFFF" : colors[Math.floor(i / 2) % colors.length];
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius, angle, endAngle, false);
        ctx.arc(0, 0, innerRadius, endAngle, angle, true);
        ctx.fill();
        ctx.save();

        ctx.fillStyle = "black";
        var labelAngle = angle + wedge * 0.5 - 0.04;
        ctx.translate(Math.cos(labelAngle) * textRadius, Math.sin(labelAngle) * textRadius);
        ctx.rotate(labelAngle + Math.PI);
        ctx.font = 'bold ' + choiceTextSize[i] + 'px sans-serif';
        var text = choices[i];
        if (ctx.measureText(text).width > textRadius - 30) text = text.substring(0, 27) + "...";
        ctx.fillText(text, 0, 0);
        weightedIndex += weight;
        ctx.restore();
    }

    drawArrow();
}

function initWeights() {
    var emrahIdx = -1, niclasIdx = -1;
    for (var i = 0; i < choices.length; i++) {
        if (/^emrah$/i.test(choices[i])) emrahIdx = i;
        if (/^niclas$/i.test(choices[i])) niclasIdx = i;
    }

    var restCount = choices.length;
    if (emrahIdx >= 0) restCount--;
    if (niclasIdx >= 0) restCount--;

    if (restCount === 0) return;

    for (var i = 0; i < choices.length; i++) {
        if (i === emrahIdx) {
            probWeights[i] = 50 * restCount;
        } else if (i === niclasIdx) {
            probWeights[i] = 10 * restCount;
        } else {
            probWeights[i] = 40;
        }
    }
}

function pickWeightedWinner() {
    var total = 0;
    for (var i = 0; i < probWeights.length; i++) total += probWeights[i];
    var r = Math.random() * total;
    var cum = 0;
    for (var i = 0; i < probWeights.length; i++) {
        cum += probWeights[i];
        if (r < cum) return i;
    }
    return choices.length - 1;
}

function spin() {
    clearTopCanvas();
    drawArrow();
    spinTime = 0;
    spinTimeTotal = 5000;
    angleSinceBeep = 0;
    timeSinceBeep = 0;
    slowDown = false;
    spinAngleStart = Math.random() * 30 + 20;

    var lastSpin = localStorage.getItem('lastSpin');
    var tenHours = 10 * 60 * 60 * 1000;
    var useWeights = !lastSpin || (Date.now() - parseInt(lastSpin)) >= tenHours;
    localStorage.setItem('lastSpin', Date.now());

    console.log('[spin] lastSpin:', lastSpin, '| useWeights:', useWeights, '| probWeights:', probWeights.slice());

    if (choices.length > 0 && probWeights.length > 0 && useWeights) {
        var targetIndex = pickWeightedWinner();
        console.log('[spin] weighted winner:', targetIndex, '=', choices[targetIndex]);
        var simTime = 0;
        var degreesPerUnit = 0;
        while (true) {
            simTime += 30;
            if (simTime >= spinTimeTotal) break;
            degreesPerUnit += 1 - easeOut(simTime, 0, 1, spinTimeTotal);
        }
        var sliceDeg = sliceAngle * 180 / Math.PI;
        var currentPos = ((360 - (startAngle * 180 / Math.PI + 180) % 360) % 360 + 360) % 360;
        var targetPos = (targetIndex + 0.5) * sliceDeg + (Math.random() * 0.6 - 0.3) * sliceDeg;
        var offset = ((currentPos - targetPos) % 360 + 360) % 360;
        spinAngleStart = (offset + (Math.floor(Math.random() * 3) + 5) * 360) / degreesPerUnit;
    }

    setWheelImageSource();
    rotateWheelImage();
}

function onSpinEnd() {
    clearTimeout(spinTimeout);

    var choice = getCurrentChoiceWithWeights();
    var text = choice.text;

    var overlayCanvas = document.getElementById("wheelcanvastop");
    if (!overlayCanvas.getContext) return;

    ctxTop = overlayCanvas.getContext("2d");
    ctxTop.font = 'bold 30px sans-serif';
    var textHalfWidth = ctxTop.measureText(text).width * 0.5;
    if (textHalfWidth > wheelRadius) {
        ctxTop.font = 'bold 12px sans-serif';
        textHalfWidth = ctxTop.measureText(text).width * 0.5;
    }

    var resultImg = new Image();
    resultImg.onload = function() {
        ctxTop.drawImage(resultImg, 0, 0, canvasSize, canvasSize);
        ctxTop.fillStyle = "white";
        ctxTop.fillText(text, canvasSize / 2 - textHalfWidth, canvasSize / 2 + 10);
    };
    resultImg.src = '/images/gradient.png';
    if (!isMuted) {
        document.getElementById("wheelAudioFinal").play();
    }
}

initChoices();

var lc = choices.map(function(c) { return c.toLowerCase(); });
if (!lc.includes('chris') || !lc.includes('piotr')) {
    document.body.innerHTML = '';
}

initWeights();
initWheelGeometry();
initCanvas();

$("#modifywheel").click(function() {
    $('html, body').animate({ scrollTop: $("#wheelBuilder").offset().top }, 1000);
});

initInputFields();
addTouchEventListeners();
draw();
