// Variables globales para la simulación
let canvasWidth = 800;
let canvasHeight = 600;
let centerY;
let interfaceY;
let n1 = 1.0003; // Índice de refracción medio 1 (aire)
let n2 = 1.5;    // Índice de refracción medio 2 (vidrio)
let angleDeg = 45; // Ángulo de incidencia en grados
let angleRad;      // Ángulo de incidencia en radianes
let refractedAngleDeg; // Ángulo de refracción en grados
let criticalAngleDeg;  // Ángulo crítico en grados
let isTIR = false; // Reflexión interna total
let rayLength = 300;

// Elementos interactivos
let angleSlider, angleInput;
let medium1Select, medium2Select;
let customN1Input, customN2Input;
let showCriticalCheck, showLabelsCheck, showGridCheck, animateRayCheck;
let resetBtn, criticalBtn, tirBtn;

// Control de arrastre
let isDragging = false;
let dragHandleRadius = 15;

// Animación
let animationAngle = 0;
let animationSpeed = 0.02;
let isAnimating = false;

// Medios predefinidos
const media = {
    "1.0003": { name: "Aire", n: 1.0003, color: [240, 248, 255, 30] },
    "1.33": { name: "Agua", n: 1.33, color: [135, 206, 235, 50] },
    "1.5": { name: "Vidrio", n: 1.5, color: [220, 220, 220, 60] },
    "2.42": { name: "Diamante", n: 2.42, color: [185, 242, 255, 40] }
};

function setup() {
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('simulation-canvas');
    centerY = height / 2;
    interfaceY = centerY;
    
    // Inicializar cálculos
    updateCalculations();
    
    // Configurar elementos de UI
    setupUI();
    
    // Actualizar información inicial
    updateUIInfo();
}

function setupUI() {
    // Slider de ángulo
    angleSlider = select('#angle-slider');
    angleInput = select('#angle-input');
    
    angleSlider.input(() => {
        angleDeg = parseFloat(angleSlider.value());
        angleInput.value(angleDeg.toFixed(1));
        updateCalculations();
        updateUIInfo();
    });
    
    angleInput.input(() => {
        let value = parseFloat(angleInput.value());
        if (value >= 0 && value <= 90) {
            angleDeg = value;
            angleSlider.value(value);
            updateCalculations();
            updateUIInfo();
        }
    });
    
    // Botones de incremento/decremento
    select('#decrease-angle').mousePressed(() => {
        angleDeg = max(0, angleDeg - 0.5);
        updateAngleControls();
    });
    
    select('#increase-angle').mousePressed(() => {
        angleDeg = min(90, angleDeg + 0.5);
        updateAngleControls();
    });
    
    // Selectores de medio
    medium1Select = select('#medium1');
    medium2Select = select('#medium2');
    
    medium1Select.changed(() => updateMedium(1));
    medium2Select.changed(() => updateMedium(2));
    
    // Inputs personalizados
    customN1Input = select('#custom-n1');
    customN2Input = select('#custom-n2');
    
    customN1Input.input(() => {
        if (medium1Select.value() === 'custom') {
            n1 = parseFloat(customN1Input.value());
            updateCalculations();
            updateUIInfo();
        }
    });
    
    customN2Input.input(() => {
        if (medium2Select.value() === 'custom') {
            n2 = parseFloat(customN2Input.value());
            updateCalculations();
            updateUIInfo();
        }
    });
    
    // Checkboxes
    showCriticalCheck = select('#show-critical');
    showLabelsCheck = select('#show-labels');
    showGridCheck = select('#show-grid');
    animateRayCheck = select('#animate-ray');
    
    animateRayCheck.changed(() => {
        isAnimating = animateRayCheck.checked();
        if (isAnimating) animationAngle = 0;
    });
    
    // Botones
    resetBtn = select('#reset-btn');
    resetBtn.mousePressed(resetSimulation);
    
    criticalBtn = select('#critical-btn');
    criticalBtn.mousePressed(() => {
        angleDeg = criticalAngleDeg;
        updateAngleControls();
    });
    
    tirBtn = select('#tir-btn');
    tirBtn.mousePressed(() => {
        angleDeg = criticalAngleDeg + 5;
        updateAngleControls();
    });
}

function updateMedium(mediumNum) {
    const selectElement = mediumNum === 1 ? medium1Select : medium2Select;
    const customContainer = select(`#custom${mediumNum}-container`);
    const customInput = mediumNum === 1 ? customN1Input : customN2Input;
    
    if (selectElement.value() === 'custom') {
        customContainer.style('display', 'block');
        if (mediumNum === 1) {
            n1 = parseFloat(customInput.value());
        } else {
            n2 = parseFloat(customInput.value());
        }
    } else {
        customContainer.style('display', 'none');
        const nValue = parseFloat(selectElement.value());
        if (mediumNum === 1) {
            n1 = nValue;
        } else {
            n2 = nValue;
        }
    }
    
    updateCalculations();
    updateUIInfo();
}

function updateAngleControls() {
    angleDeg = constrain(angleDeg, 0, 90);
    angleSlider.value(angleDeg);
    angleInput.value(angleDeg.toFixed(1));
    updateCalculations();
    updateUIInfo();
}

function updateCalculations() {
    angleRad = radians(angleDeg);
    
    // Calcular ángulo de refracción usando Ley de Snell
    const sinTheta2 = (n1 * sin(angleRad)) / n2;
    
    if (abs(sinTheta2) <= 1) {
        // Refracción normal
        isTIR = false;
        refractedAngleDeg = degrees(asin(sinTheta2));
    } else {
        // Reflexión interna total
        isTIR = true;
        refractedAngleDeg = 90; // No hay refracción
    }
    
    // Calcular ángulo crítico
    if (n1 > n2) {
        criticalAngleDeg = degrees(asin(n2 / n1));
    } else {
        criticalAngleDeg = 90; // No hay TIR posible
    }
}

function updateUIInfo() {
    select('#incident-angle').html(`${angleDeg.toFixed(1)}°`);
    select('#refracted-angle').html(isTIR ? "N/A (TIR)" : `${abs(refractedAngleDeg).toFixed(1)}°`);
    select('#critical-angle').html(`${criticalAngleDeg.toFixed(1)}°`);
    select('#refractive-indices').html(`n₁ = ${n1.toFixed(2)}, n₂ = ${n2.toFixed(2)}`);
    
    const tirStatus = select('#tir-status');
    if (isTIR) {
        tirStatus.html('Reflexión Interna Total');
        tirStatus.class('value tir');
    } else if (abs(angleDeg - criticalAngleDeg) < 0.5 && n1 > n2) {
        tirStatus.html('Ángulo crítico');
        tirStatus.class('value critical');
    } else {
        tirStatus.html('Refracción normal');
        tirStatus.class('value normal');
    }
}

function resetSimulation() {
    angleDeg = 45;
    n1 = 1.0003;
    n2 = 1.5;
    
    medium1Select.selected('1.0003');
    medium2Select.selected('1.5');
    
    select('#custom1-container').style('display', 'none');
    select('#custom2-container').style('display', 'none');
    
    showCriticalCheck.checked(true);
    showLabelsCheck.checked(true);
    showGridCheck.checked(true);
    animateRayCheck.checked(false);
    
    isAnimating = false;
    animationAngle = 0;
    
    updateAngleControls();
}

function draw() {
    // Fondo
    background(255);
    
    // Dibujar rejilla si está activada
    if (showGridCheck.checked()) {
        drawGrid();
    }
    
    // Dibujar medios
    drawMedia();
    
    // Dibujar interfase
    drawInterface();
    
    // Calcular punto final del rayo incidente
    const startX = width / 4;
    const endX = width / 2;
    
    // Usar ángulo de animación si está activada
    let currentAngle = angleRad;
    if (isAnimating) {
        currentAngle = animationAngle;
        animationAngle += animationSpeed;
        if (animationAngle > PI/2) animationAngle = 0;
    }
    
    // Calcular punto de intersección con la interfase
    const intersectionX = endX;
    const intersectionY = interfaceY;
    
    // Calcular dirección del rayo incidente
    const incidentDirX = cos(currentAngle);
    const incidentDirY = sin(currentAngle);
    
    // Dibujar rayo incidente
    strokeWeight(3);
    stroke(231, 76, 60, 200);
    line(startX, interfaceY, 
         startX + rayLength * incidentDirX, 
         interfaceY - rayLength * incidentDirY);
    
    // Dibujar rayo reflejado (siempre presente)
    const reflectedDirX = cos(PI - currentAngle);
    const reflectedDirY = sin(PI - currentAngle);
    stroke(52, 152, 219, 200);
    line(intersectionX, intersectionY,
         intersectionX + rayLength * reflectedDirX,
         intersectionY - rayLength * reflectedDirY);
    
    // Dibujar rayo refractado (si no hay TIR)
    if (!isTIR && !isAnimating) {
        const refractedAngle = radians(refractedAngleDeg);
        const refractedDirX = cos(refractedAngle);
        const refractedDirY = sin(refractedAngle);
        
        stroke(46, 204, 113, 200);
        line(intersectionX, intersectionY,
             intersectionX + rayLength * refractedDirX,
             interfaceY + rayLength * refractedDirY);
    }
    
    // Dibujar ángulos
    if (showLabelsCheck.checked()) {
        drawAngles(startX, intersectionX, intersectionY, currentAngle);
    }
    
    // Dibujar ángulo crítico si está activado y aplicable
    if (showCriticalCheck.checked() && n1 > n2 && !isAnimating) {
        drawCriticalAngle(intersectionX, intersectionY);
    }
    
    // Dibujar punto de control (solo si no está animando)
    if (!isAnimating) {
        drawControlHandle(startX, interfaceY, currentAngle);
    }
    
    // Dibujar leyenda visual
    drawVisualLegend();
}

function drawGrid() {
    stroke(230, 230, 230);
    strokeWeight(1);
    
    // Líneas verticales
    for (let x = 0; x <= width; x += 50) {
        line(x, 0, x, height);
    }
    
    // Líneas horizontales
    for (let y = 0; y <= height; y += 50) {
        line(0, y, width, y);
    }
    
    // Eje central
    stroke(200, 200, 200, 150);
    strokeWeight(2);
    line(width/2, 0, width/2,intersectionY - rayLength * reflectedDirY);

    // Dibujar rayo refractado (si no hay TIR)
    if (!isTIR && !isAnimating) {
        const refractedAngle = radians(refractedAngleDeg);
        const refractedDirX = cos(refractedAngle);
        const refractedDirY = sin(refractedAngle);
        
        stroke(46, 204, 113, 200);
        line(intersectionX, intersectionY,
             intersectionX + rayLength * refractedDirX,
             interfaceY + rayLength * refractedDirY);
    }
    
    // Dibujar ángulos
    if (showLabelsCheck.checked()) {
        drawAngles(startX, intersectionX, intersectionY, currentAngle);
    }
    
    // Dibujar ángulo crítico si está activado y aplicable
    if (showCriticalCheck.checked() && n1 > n2 && !isAnimating) {
        drawCriticalAngle(intersectionX, intersectionY);
    }
    
    // Dibujar punto de control (solo si no está animando)
    if (!isAnimating) {
        drawControlHandle(startX, interfaceY, currentAngle);
    }
    
    // Dibujar leyenda visual
    drawVisualLegend();
}

function drawGrid() {
    stroke(230, 230, 230);
    strokeWeight(1);
    
    // Líneas verticales
    for (let x = 0; x <= width; x += 50) {
        line(x, 0, x, height);
    }
    
    // Líneas horizontales
    for (let y = 0; y <= height; y += 50) {
        line(0, y, width, y);
    }
    
    // Eje central
    stroke(200, 200, 200, 150);
    strokeWeight(2);
    line(width/2, 0, width/2, height);
}

function drawMedia() {
    noStroke();
    
    // Medio 1 (arriba de la interfase)
    const medium1 = getMediumFromN(n1);
    fill(medium1.color);
    rect(0, 0, width, interfaceY);
    
    // Medio 2 (abajo de la interfase)
    const medium2 = getMediumFromN(n2);
    fill(medium2.color);
    rect(0, interfaceY, width, height - interfaceY);
    
    // Etiquetas de medios
    if (showLabelsCheck.checked()) {
        fill(60, 60, 60, 200);
        textSize(16);
        textAlign(CENTER, CENTER);
        text(`${medium1.name} (n₁=${n1.toFixed(3)})`, width/4, interfaceY/2);
        text(`${medium2.name} (n₂=${n2.toFixed(3)})`, 3*width/4, interfaceY + (height - interfaceY)/2);
    }
}

function getMediumFromN(n) {
    // Encontrar el medio más cercano a n
    let closest = media["1.0003"];
    let minDiff = Infinity;
    
    for (const key in media) {
        const diff = abs(parseFloat(key) - n);
        if (diff < minDiff) {
            minDiff = diff;
            closest = media[key];
        }
    }
    
    // Si es personalizado, crear un medio genérico
    if (minDiff > 0.01) {
        return {
            name: `Personalizado (n=${n.toFixed(2)})`,
            n: n,
            color: [180, 200, 220, 40]
        };
    }
    
    return closest;
}

function drawInterface() {
    stroke(127, 127, 127, 200);
    strokeWeight(3);
    line(0, interfaceY, width, interfaceY);
    
    // Línea punteada para la normal
    stroke(100, 100, 100, 150);
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 5]);
    line(width/2, 0, width/2, height);
    drawingContext.setLineDash([]);
    
    // Punto en la interfase
    fill(127, 127, 127);
    noStroke();
    circle(width/2, interfaceY, 8);
}

function drawAngles(startX, intersectionX, intersectionY, currentAngle) {
    const radius = 80;
    
    // Ángulo de incidencia θ₁
    push();
    translate(intersectionX, intersectionY);
    fill(231, 76, 60, 80);
    noStroke();
    arc(0, 0, radius, radius, -HALF_PI, -HALF_PI + currentAngle, PIE);
    
    fill(231, 76, 60);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(`θ₁ = ${degrees(currentAngle).toFixed(1)}°`, 
         radius/2 * cos(currentAngle/2 - HALF_PI),
         radius/2 * sin(currentAngle/2 - HALF_PI));
    pop();
    
    // Ángulo reflejado (siempre igual al incidente)
    push();
    translate(intersectionX, intersectionY);
    fill(52, 152, 219, 80);
    noStroke();
    arc(0, 0, radius, radius, HALF_PI, HALF_PI + currentAngle, PIE);
    
    fill(52, 152, 219);
    text(`θᵣ = ${degrees(currentAngle).toFixed(1)}°`,
         radius/2 * cos(currentAngle/2 + HALF_PI),
         radius/2 * sin(currentAngle/2 + HALF_PI));
    pop();
    
    // Ángulo refractado θ₂ (si no hay TIR)
    if (!isTIR && !isAnimating) {
        const refractedAngle = radians(refractedAngleDeg);
        push();
        translate(intersectionX, intersectionY);
        fill(46, 204, 113, 80);
        noStroke();
        arc(0, 0, radius, radius, HALF_PI, HALF_PI + refractedAngle, PIE);
        
        fill(46, 204, 113);
        text(`θ₂ = ${abs(refractedAngleDeg).toFixed(1)}°`,
             radius/2 * cos(refractedAngle/2 + HALF_PI),
             radius/2 * sin(refractedAngle/2 + HALF_PI));
        pop();
    }
}

function drawCriticalAngle(intersectionX, intersectionY) {
    const radius = 100;
    const criticalAngle = radians(criticalAngleDeg);
    
    // Línea del ángulo crítico
    stroke(243, 156, 18, 150);
    strokeWeight(2);
    drawingContext.setLineDash([3, 3]);
    push();
    translate(intersectionX, intersectionY);
    line(0, 0, radius * cos(HALF_PI + criticalAngle), radius * sin(HALF_PI + criticalAngle));
    pop();
    drawingContext.setLineDash([]);
    
    // Arco del ángulo crítico
    push();
    translate(intersectionX, intersectionY);
    fill(243, 156, 18, 40);
    noStroke();
    arc(0, 0, radius, radius, HALF_PI, HALF_PI + criticalAngle, PIE);
    
    // Etiqueta del ángulo crítico
    fill(243, 156, 18);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(`θc = ${criticalAngleDeg.toFixed(1)}°`,
         radius/2 * cos(criticalAngle/2 + HALF_PI),
         radius/2 * sin(criticalAngle/2 + HALF_PI));
    pop();
}

function drawControlHandle(startX, startY, currentAngle) {
    // Calcular posición del control
    const handleX = startX + rayLength * cos(currentAngle);
    const handleY = startY - rayLength * sin(currentAngle);
    
    // Dibujar línea guía
    stroke(200, 200, 200, 100);
    strokeWeight(1);
    line(startX, startY, handleX, handleY);
    
    // Dibujar punto de control
    fill(231, 76, 60);
    noStroke();
    circle(handleX, handleY, dragHandleRadius * 2);
    
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("↕", handleX, handleY);
    
    // Mostrar instrucción si el mouse está cerca
    if (dist(mouseX, mouseY, handleX, handleY) < dragHandleRadius * 2) {
        fill(0, 0, 0, 200);
        noStroke();
        rect(mouseX + 15, mouseY - 25, 180, 40, 5);
        
        fill(255);
        textSize(12);
        textAlign(LEFT, CENTER);
        text("Arrastra para cambiar ángulo", mouseX + 25, mouseY - 10);
        text("Click + arrastra vertical", mouseX + 25, mouseY + 10);
    }
}

function drawVisualLegend() {
    // Cuadro de información de estado
    fill(255, 255, 255, 230);
    stroke(200, 200, 200);
    strokeWeight(1);
    rect(20, 20, 250, 120, 10);
    
    fill(60, 60, 60);
    noStroke();
    textSize(16);
    textAlign(LEFT, CENTER);
    text("Estado del Sistema:", 35, 40);
    
    textSize(14);
    if (isTIR) {
        fill(231, 76, 60);
        text("🔴 REFLEXIÓN INTERNA TOTAL", 35, 70);
        text(`θ₁ (${angleDeg.toFixed(1)}°) > θc (${criticalAngleDeg.toFixed(1)}°)`, 35, 95);
        text("No hay rayo refractado", 35, 120);
    } else if (abs(angleDeg - criticalAngleDeg) < 0.5 && n1 > n2) {
        fill(243, 156, 18);
        text("🟡 ÁNGULO CRÍTICO", 35, 70);
        text(`θ₁ = θc = ${criticalAngleDeg.toFixed(1)}°`, 35, 95);
        text("Refracción a 90°", 35, 120);
    } else {
        fill(46, 204, 113);
        text("🟢 REFRACCIÓN NORMAL", 35, 70);
        text(`θ₂ = ${refractedAngleDeg.toFixed(1)}°`, 35, 95);
        text("n₁·sinθ₁ = n₂·sinθ₂", 35, 120);
    }
}

function mousePressed() {
    if (isAnimating) return;
    
    const startX = width / 4;
    const handleX = startX + rayLength * cos(angleRad);
    const handleY = interfaceY - rayLength * sin(angleRad);
    
    // Verificar si se hizo click en el punto de control
    if (dist(mouseX, mouseY, handleX, handleY) < dragHandleRadius) {
        isDragging = true;
        return false;
    }
    return false;
}

function mouseDragged() {
    if (isDragging && !isAnimating) {
        const startX = width / 4;
        
        // Calcular nuevo ángulo basado en posición del mouse
        let deltaY = interfaceY - mouseY;
        let deltaX = mouseX - startX;
        
        // Limitar rango y prevenir division por cero
        deltaY = constrain(deltaY, 1, rayLength);
        deltaX = constrain(deltaX, 1, rayLength);
        
        // Calcular ángulo (arcotangente)
        let newAngle = atan2(deltaY, deltaX);
        
        // Convertir a grados y actualizar
        angleDeg = constrain(degrees(newAngle), 0.1, 89.9);
        
        updateAngleControls();
    }
    return false;
}

function mouseReleased() {
    isDragging = false;
    return false;
}

function keyPressed() {
    // Atajos de teclado para mejor interactividad
    if (key === 'a' || key === 'A') {
        // Alternar animación
        isAnimating = !isAnimating;
        animateRayCheck.checked(isAnimating);
        if (isAnimating) animationAngle = 0;
    } else if (key === 'r' || key === 'R') {
        // Reset
        resetSimulation();
    } else if (key === 'c' || key === 'C') {
        // Ir al ángulo crítico
        angleDeg = criticalAngleDeg;
        updateAngleControls();
    } else if (key === 't' || key === 'T') {
        // Mostrar TIR
        angleDeg = min(criticalAngleDeg + 10, 89);
        updateAngleControls();
    } else if (key === '+') {
        // Incrementar ángulo
        angleDeg = min(angleDeg + 1, 89);
        updateAngleControls();
    } else if (key === '-') {
        // Decrementar ángulo
        angleDeg = max(angleDeg - 1, 1);
        updateAngleControls();
    }
}

function windowResized() {
    // Actualizar tamaño del canvas si la ventana cambia
    const canvasContainer = select('#simulation-canvas');
    const newWidth = canvasContainer.width;
    const newHeight = canvasContainer.height;
    
    if (newWidth && newHeight) {
        resizeCanvas(newWidth, newHeight);
        centerY = height / 2;
        interfaceY = centerY;
    }
}