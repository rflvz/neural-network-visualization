/**
 * VISUALIZACIÓN NEURONAL z = Wx + b
 * Representación interactiva con Three.js - VERSIÓN DINÁMICA
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

// Número de neuronas (dinámico)
let numInputNeurons = 3;
let numOutputNeurons = 3;

// Velocidad de animación (1 = normal, 0.5 = lento, 2 = rápido)
let animationSpeed = 1;

// Valores por defecto del ejercicio
const defaultW = [
    [0.1, 0.5, -0.2],
    [0.3, -0.4, 0.6],
    [-0.7, 0, 0.8]
];

const defaultX = [10, 5, 2];
const defaultB = [0.5, -0.1, 0.2];

// Estado actual
let W = JSON.parse(JSON.stringify(defaultW));
let x = [...defaultX];
let b = [...defaultB];

// Variables Three.js
let scene, camera, renderer, controls;
let inputNeurons = [];
let outputNeurons = [];
let connections = [];
let labels = [];
let animationId;
let isAnimating = false;

// Colores
const COLORS = {
    inputNeuron: 0x10b981,
    outputNeuron: 0x06b6d4,
    positiveWeight: 0x10b981,
    negativeWeight: 0xf43f5e,
    highlight: 0xf59e0b,
    bias: 0x8b5cf6,
    background: 0x0a0e17
};

// ============================================
// INICIALIZACIÓN
// ============================================

function init() {
    setupThreeJS();
    createScene();
    createUI();
    setupTheoryToggle();
    setupPanelResize();
    setupSpeedControl();
    setupNeuronControls();
    updateMathDisplay();
    updateValuesFromInputs();
    animate();
    
    window.addEventListener('resize', onWindowResize);
}

function setupSpeedControl() {
    const slider = document.getElementById('speed-slider');
    const display = document.getElementById('speed-display');
    
    if (slider && display) {
        slider.addEventListener('input', (e) => {
            animationSpeed = parseFloat(e.target.value);
            display.textContent = animationSpeed.toFixed(1) + 'x';
        });
    }
}

function setupNeuronControls() {
    // Controles de neuronas de entrada
    const inputMinus = document.getElementById('input-neurons-minus');
    const inputPlus = document.getElementById('input-neurons-plus');
    const inputDisplay = document.getElementById('input-neurons-count');
    
    if (inputMinus && inputPlus && inputDisplay) {
        inputMinus.addEventListener('click', () => {
            if (numInputNeurons > 1) {
                numInputNeurons--;
                inputDisplay.textContent = numInputNeurons;
                resizeNetwork();
            }
        });
        
        inputPlus.addEventListener('click', () => {
            if (numInputNeurons < 8) {
                numInputNeurons++;
                inputDisplay.textContent = numInputNeurons;
                resizeNetwork();
            }
        });
    }
    
    // Controles de neuronas de salida
    const outputMinus = document.getElementById('output-neurons-minus');
    const outputPlus = document.getElementById('output-neurons-plus');
    const outputDisplay = document.getElementById('output-neurons-count');
    
    if (outputMinus && outputPlus && outputDisplay) {
        outputMinus.addEventListener('click', () => {
            if (numOutputNeurons > 1) {
                numOutputNeurons--;
                outputDisplay.textContent = numOutputNeurons;
                resizeNetwork();
            }
        });
        
        outputPlus.addEventListener('click', () => {
            if (numOutputNeurons < 8) {
                numOutputNeurons++;
                outputDisplay.textContent = numOutputNeurons;
                resizeNetwork();
            }
        });
    }
}

function resizeNetwork() {
    // Redimensionar matriz W
    const newW = [];
    for (let i = 0; i < numOutputNeurons; i++) {
        newW[i] = [];
        for (let j = 0; j < numInputNeurons; j++) {
            // Mantener valores existentes o usar valor aleatorio
            if (W[i] && W[i][j] !== undefined) {
                newW[i][j] = W[i][j];
            } else {
                newW[i][j] = parseFloat((Math.random() * 2 - 1).toFixed(1));
            }
        }
    }
    W = newW;
    
    // Redimensionar vector x
    const newX = [];
    for (let i = 0; i < numInputNeurons; i++) {
        if (x[i] !== undefined) {
            newX[i] = x[i];
        } else {
            newX[i] = Math.floor(Math.random() * 10) + 1;
        }
    }
    x = newX;
    
    // Redimensionar vector b
    const newB = [];
    for (let i = 0; i < numOutputNeurons; i++) {
        if (b[i] !== undefined) {
            newB[i] = b[i];
        } else {
            newB[i] = parseFloat((Math.random() * 2 - 1).toFixed(1));
        }
    }
    b = newB;
    
    // Actualizar UI y escena
    createMatrixInputs();
    createVectorInputs();
    updateMathDisplay();
    updateResultsDisplay();
    createScene();
}

function updateResultsDisplay() {
    // Actualizar contenedores de resultados Wx
    const wxContainer = document.getElementById('wx-values');
    wxContainer.innerHTML = '';
    for (let i = 0; i < numOutputNeurons; i++) {
        const span = document.createElement('span');
        span.textContent = '—';
        wxContainer.appendChild(span);
    }
    
    // Actualizar contenedores de resultados z
    const zContainer = document.getElementById('z-values');
    zContainer.innerHTML = '';
    for (let i = 0; i < numOutputNeurons; i++) {
        const span = document.createElement('span');
        span.textContent = '—';
        zContainer.appendChild(span);
    }
}

function setupPanelResize() {
    const resizeHandle = document.getElementById('resize-handle');
    const controlPanel = document.getElementById('control-panel');
    
    if (!resizeHandle || !controlPanel) return;
    
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = controlPanel.offsetWidth;
        resizeHandle.classList.add('dragging');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = Math.min(Math.max(startWidth + deltaX, 320), 700);
        controlPanel.style.width = newWidth + 'px';
        
        // Actualizar la visualización 3D
        onWindowResize();
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    // Soporte táctil
    resizeHandle.addEventListener('touchstart', (e) => {
        isResizing = true;
        startX = e.touches[0].clientX;
        startWidth = controlPanel.offsetWidth;
        resizeHandle.classList.add('dragging');
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isResizing) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const newWidth = Math.min(Math.max(startWidth + deltaX, 320), 700);
        controlPanel.style.width = newWidth + 'px';
        onWindowResize();
    });
    
    document.addEventListener('touchend', () => {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('dragging');
        }
    });
}

function setupThreeJS() {
    const canvas = document.getElementById('neural-canvas');
    const container = document.getElementById('visualization');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 2, 12);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true // Necesario para toDataURL()
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    
    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    const pointLight1 = new THREE.PointLight(COLORS.inputNeuron, 0.5, 20);
    pointLight1.position.set(-5, 0, 0);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(COLORS.outputNeuron, 0.5, 20);
    pointLight2.position.set(5, 0, 0);
    scene.add(pointLight2);
    
    setupRaycaster();
}

// ============================================
// CREACIÓN DE LA ESCENA 3D
// ============================================

function createScene() {
    clearScene();
    createNeurons();
    createConnections();
    createFloor();
}

function clearScene() {
    inputNeurons.forEach(n => {
        scene.remove(n.mesh);
        scene.remove(n.glow);
        if (n.label) scene.remove(n.label);
    });
    outputNeurons.forEach(n => {
        scene.remove(n.mesh);
        scene.remove(n.glow);
        if (n.label) scene.remove(n.label);
    });
    
    connections.forEach(c => {
        scene.remove(c.line);
        if (c.label) scene.remove(c.label);
    });
    
    labels.forEach(l => scene.remove(l));
    
    inputNeurons = [];
    outputNeurons = [];
    connections = [];
    labels = [];
}

function createNeurons() {
    const inputX = -4;
    const outputX = 4;
    
    // Calcular espaciado dinámico
    const maxNeurons = Math.max(numInputNeurons, numOutputNeurons);
    const spacing = Math.min(3, 10 / maxNeurons);
    
    const neuronGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const glowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    
    // Calcular offset para centrar las neuronas
    const inputOffset = ((numInputNeurons - 1) * spacing) / 2;
    const outputOffset = ((numOutputNeurons - 1) * spacing) / 2;
    
    // Neuronas de entrada
    for (let i = 0; i < numInputNeurons; i++) {
        const y = inputOffset - i * spacing;
        
        const material = new THREE.MeshStandardMaterial({
            color: COLORS.inputNeuron,
            emissive: COLORS.inputNeuron,
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.4
        });
        
        const mesh = new THREE.Mesh(neuronGeometry, material);
        mesh.position.set(inputX, y, 0);
        mesh.castShadow = true;
        mesh.userData = { type: 'input', index: i, value: x[i] };
        scene.add(mesh);
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.inputNeuron,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(mesh.position);
        scene.add(glow);
        
        const label = createTextSprite(`x₍${i+1}₎ = ${x[i]}`, COLORS.inputNeuron);
        label.position.set(inputX - 2, y, 0);
        scene.add(label);
        
        inputNeurons.push({ 
            mesh, 
            glow, 
            label,
            originalY: y,
            value: x[i]
        });
    }
    
    // Neuronas de salida
    for (let i = 0; i < numOutputNeurons; i++) {
        const y = outputOffset - i * spacing;
        
        const material = new THREE.MeshStandardMaterial({
            color: COLORS.outputNeuron,
            emissive: COLORS.outputNeuron,
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.4
        });
        
        const mesh = new THREE.Mesh(neuronGeometry, material);
        mesh.position.set(outputX, y, 0);
        mesh.castShadow = true;
        mesh.userData = { type: 'output', index: i, value: 0 };
        scene.add(mesh);
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.outputNeuron,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(mesh.position);
        scene.add(glow);
        
        const label = createTextSprite(`z₍${i+1}₎ = ?`, COLORS.outputNeuron);
        label.position.set(outputX + 2, y, 0);
        scene.add(label);
        
        outputNeurons.push({ 
            mesh, 
            glow, 
            label,
            originalY: y,
            value: 0
        });
    }
    
    // Etiquetas de capa
    const inputLayerLabel = createTextSprite('Capa de Entrada (x)', 0xffffff, 0.4);
    inputLayerLabel.position.set(inputX, inputOffset + 2, 0);
    scene.add(inputLayerLabel);
    labels.push(inputLayerLabel);
    
    const outputLayerLabel = createTextSprite('Capa de Salida (z)', 0xffffff, 0.4);
    outputLayerLabel.position.set(outputX, outputOffset + 2, 0);
    scene.add(outputLayerLabel);
    labels.push(outputLayerLabel);
}

function createConnections() {
    // Profundidades Z diferentes para cada neurona de entrada
    const maxDepth = 4;
    
    for (let i = 0; i < numOutputNeurons; i++) {
        for (let j = 0; j < numInputNeurons; j++) {
            const weight = W[i][j];
            const startPos = inputNeurons[j].mesh.position;
            const endPos = outputNeurons[i].mesh.position;
            
            const color = weight >= 0 ? COLORS.positiveWeight : COLORS.negativeWeight;
            
            // Usar profundidad Z diferente según la neurona de entrada
            const zDepth = (j / (numInputNeurons - 1 || 1)) * maxDepth + 0.5;
            
            const curve = new THREE.QuadraticBezierCurve3(
                startPos.clone(),
                new THREE.Vector3(0, (startPos.y + endPos.y) / 2, zDepth),
                endPos.clone()
            );
            
            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: Math.min(0.3 + Math.abs(weight) * 0.5, 0.9)
            });
            
            const line = new THREE.Line(geometry, material);
            line.userData = { 
                type: 'connection',
                inputIndex: j, 
                outputIndex: i, 
                weight: weight 
            };
            scene.add(line);
            
            const midPoint = curve.getPoint(0.5);
            const weightLabel = createTextSprite(
                `w${i+1}${j+1}=${weight}`, 
                color,
                0.22
            );
            weightLabel.position.copy(midPoint);
            weightLabel.visible = false;
            scene.add(weightLabel);
            
            connections.push({
                line,
                label: weightLabel,
                curve,
                inputIndex: j,
                outputIndex: i,
                weight,
                originalColor: color
            });
        }
    }
}

function createTextSprite(text, color, scale = 0.35) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 44px JetBrains Mono, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 10;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    const colorHex = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    context.fillStyle = colorHex;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4 * scale, 1 * scale, 1);
    
    return sprite;
}

function createFloor() {
    const gridHelper = new THREE.GridHelper(30, 30, 0x1f2937, 0x111827);
    gridHelper.position.y = -5;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

// ============================================
// RAYCASTER E INTERACTIVIDAD
// ============================================

let raycaster, mouse;
let hoveredObject = null;
const tooltip = document.getElementById('tooltip');

function setupRaycaster() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    const container = document.getElementById('visualization');
    container.addEventListener('mousemove', onMouseMove);
}

function onMouseMove(event) {
    const container = document.getElementById('visualization');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
    tooltip.style.top = (event.clientY - rect.top + 15) + 'px';
}

function checkIntersections() {
    if (!raycaster || isAnimating) return;
    
    raycaster.setFromCamera(mouse, camera);
    
    const neuronMeshes = [
        ...inputNeurons.map(n => n.mesh),
        ...outputNeurons.map(n => n.mesh)
    ];
    
    const intersects = raycaster.intersectObjects(neuronMeshes);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (hoveredObject !== obj) {
            if (hoveredObject) resetHover(hoveredObject);
            hoveredObject = obj;
            highlightObject(obj);
            showTooltip(obj);
        }
        return;
    } else {
        if (hoveredObject) {
            resetHover(hoveredObject);
            hoveredObject = null;
            hideTooltip();
        }
    }
    
    // Solo verificar hover sobre conexiones si NO hay neurona hovereada
    const lineIntersects = raycaster.intersectObjects(connections.map(c => c.line));
    if (lineIntersects.length > 0) {
        const connection = connections.find(c => c.line === lineIntersects[0].object);
        if (connection) {
            connections.forEach(c => {
                if (c === connection) {
                    c.label.visible = true;
                    c.line.material.opacity = 1;
                    c.line.material.color.setHex(COLORS.highlight);
                } else {
                    c.label.visible = false;
                    c.line.material.opacity = 0.15;
                }
            });
        }
    } else {
        connections.forEach(c => {
            c.label.visible = false;
            c.line.material.color.setHex(c.originalColor);
            c.line.material.opacity = Math.min(0.3 + Math.abs(c.weight) * 0.5, 0.9);
        });
    }
}

function highlightObject(obj) {
    obj.material.emissiveIntensity = 0.6;
    obj.scale.setScalar(1.2);
    
    const data = obj.userData;
    
    if (data.type === 'input') {
        connections.forEach(c => {
            if (c.inputIndex === data.index) {
                c.line.material.opacity = 1;
                c.line.material.color.setHex(COLORS.highlight);
                c.label.visible = true;
            } else {
                c.line.material.opacity = 0.1;
            }
        });
    } else if (data.type === 'output') {
        connections.forEach(c => {
            if (c.outputIndex === data.index) {
                c.line.material.opacity = 1;
                c.line.material.color.setHex(COLORS.highlight);
                c.label.visible = true;
            } else {
                c.line.material.opacity = 0.1;
            }
        });
    }
}

function resetHover(obj) {
    obj.material.emissiveIntensity = 0.3;
    obj.scale.setScalar(1);
    
    connections.forEach(c => {
        c.line.material.color.setHex(c.originalColor);
        c.line.material.opacity = Math.min(0.3 + Math.abs(c.weight) * 0.5, 0.9);
        c.label.visible = false;
    });
}

function showTooltip(obj) {
    const data = obj.userData;
    let html = '';
    
    if (data.type === 'input') {
        const j = data.index;
        let weightsHtml = '';
        for (let i = 0; i < numOutputNeurons; i++) {
            weightsHtml += `<tr><td>→ z₍${i+1}₎:</td><td class="weight-value ${W[i][j] >= 0 ? 'positive' : 'negative'}">w₍${i+1}₎₍${j+1}₎ = ${W[i][j]}</td></tr>`;
        }
        html = `
            <h4>Neurona de Entrada x₍${j + 1}₎</h4>
            <p>Valor actual: <span class="value">${x[j]}</span></p>
            <div class="tooltip-divider"></div>
            <p class="tooltip-subtitle">Pesos de salida:</p>
            <table class="weights-table">
                ${weightsHtml}
            </table>
        `;
    } else if (data.type === 'output') {
        const i = data.index;
        const zVal = calculateZ();
        const wxVal = calculateWx();
        
        let weightsHtml = '';
        for (let j = 0; j < numInputNeurons; j++) {
            weightsHtml += `<tr><td>x₍${j+1}₎ →</td><td class="weight-value ${W[i][j] >= 0 ? 'positive' : 'negative'}">w₍${i+1}₎₍${j+1}₎ = ${W[i][j]}</td><td class="calc">× ${x[j]} = ${(W[i][j] * x[j]).toFixed(2)}</td></tr>`;
        }
        
        html = `
            <h4>Neurona de Salida z₍${i + 1}₎</h4>
            <p>Pre-activación: <span class="value">${zVal[i].toFixed(2)}</span></p>
            <div class="tooltip-divider"></div>
            <p class="tooltip-subtitle">Pesos de entrada:</p>
            <table class="weights-table">
                ${weightsHtml}
            </table>
            <div class="tooltip-divider"></div>
            <p class="tooltip-calc">Wx₍${i+1}₎ = <span class="value">${wxVal[i].toFixed(2)}</span></p>
            <p class="tooltip-calc">Sesgo b₍${i+1}₎ = <span class="value bias">${b[i]}</span></p>
            <p class="tooltip-calc">z₍${i+1}₎ = ${wxVal[i].toFixed(2)} + ${b[i]} = <span class="value result">${zVal[i].toFixed(2)}</span></p>
        `;
    }
    
    tooltip.innerHTML = html;
    tooltip.classList.remove('hidden');
}

function hideTooltip() {
    tooltip.classList.add('hidden');
    
    connections.forEach(c => {
        c.line.material.color.setHex(c.originalColor);
        c.line.material.opacity = Math.min(0.3 + Math.abs(c.weight) * 0.5, 0.9);
        c.label.visible = false;
    });
}

// ============================================
// INTERFAZ DE USUARIO
// ============================================

function createUI() {
    createMatrixInputs();
    createVectorInputs();
    setupButtonListeners();
}

function setupTheoryToggle() {
    const toggle = document.getElementById('theory-toggle');
    const section = toggle.closest('.theory-section');
    
    toggle.addEventListener('click', () => {
        section.classList.toggle('collapsed');
    });
}

function createMatrixInputs() {
    const container = document.getElementById('matrix-w');
    container.innerHTML = '';
    
    // Actualizar estilo de grid dinámicamente
    container.style.gridTemplateColumns = `repeat(${numInputNeurons}, 1fr)`;
    
    for (let i = 0; i < numOutputNeurons; i++) {
        for (let j = 0; j < numInputNeurons; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.1';
            input.value = W[i][j];
            input.dataset.row = i;
            input.dataset.col = j;
            input.addEventListener('input', onMatrixChange);
            input.addEventListener('focus', () => highlightMatrixRow(i));
            input.addEventListener('blur', unhighlightAll);
            container.appendChild(input);
        }
    }
    
    // Actualizar etiqueta de dimensiones
    const dimLabel = document.querySelector('.input-group h3 .dim');
    if (dimLabel) {
        dimLabel.textContent = `(${numOutputNeurons}×${numInputNeurons})`;
    }
}

function createVectorInputs() {
    // Vector X
    const xContainer = document.getElementById('vector-x');
    xContainer.innerHTML = '';
    for (let i = 0; i < numInputNeurons; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = x[i];
        input.dataset.index = i;
        input.addEventListener('input', onVectorXChange);
        input.addEventListener('focus', () => highlightVectorX(i));
        input.addEventListener('blur', unhighlightAll);
        xContainer.appendChild(input);
    }
    
    // Actualizar etiqueta de dimensiones x
    const xDimLabel = document.querySelector('#vector-x')?.closest('.input-group')?.querySelector('.dim');
    if (xDimLabel) {
        xDimLabel.textContent = `(${numInputNeurons}×1)`;
    }
    
    // Vector B
    const bContainer = document.getElementById('vector-b');
    bContainer.innerHTML = '';
    for (let i = 0; i < numOutputNeurons; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = b[i];
        input.dataset.index = i;
        input.addEventListener('input', onVectorBChange);
        bContainer.appendChild(input);
    }
    
    // Actualizar etiqueta de dimensiones b
    const bDimLabel = document.querySelector('#vector-b')?.closest('.input-group')?.querySelector('.dim');
    if (bDimLabel) {
        bDimLabel.textContent = `(${numOutputNeurons}×1)`;
    }
}

function onMatrixChange(e) {
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    W[row][col] = parseFloat(e.target.value) || 0;
    updateVisualization();
    updateMathDisplay();
}

function onVectorXChange(e) {
    const index = parseInt(e.target.dataset.index);
    x[index] = parseFloat(e.target.value) || 0;
    updateVisualization();
    updateMathDisplay();
}

function onVectorBChange(e) {
    const index = parseInt(e.target.dataset.index);
    b[index] = parseFloat(e.target.value) || 0;
    updateMathDisplay();
}

function highlightMatrixRow(row) {
    const inputs = document.querySelectorAll('#matrix-w input');
    inputs.forEach(input => {
        if (parseInt(input.dataset.row) === row) {
            input.classList.add('highlight-row');
        }
    });
    
    const wDisplay = document.querySelectorAll('#w-values-display span');
    wDisplay.forEach((span, i) => {
        if (Math.floor(i / numInputNeurons) === row) {
            span.classList.add('highlight');
        }
    });
}

function highlightVectorX(index) {
    const inputs = document.querySelectorAll('#vector-x input');
    inputs[index].classList.add('highlight');
    
    const xDisplay = document.querySelectorAll('#x-values-display span');
    if (xDisplay[index]) xDisplay[index].classList.add('highlight');
}

function unhighlightAll() {
    document.querySelectorAll('.highlight, .highlight-row').forEach(el => {
        el.classList.remove('highlight', 'highlight-row');
    });
}

function setupButtonListeners() {
    document.getElementById('btn-animate').addEventListener('click', animateFullCalculation);
    document.getElementById('btn-step1').addEventListener('click', () => animateStep1Only());
    document.getElementById('btn-step2').addEventListener('click', () => animateStep2Only());
    document.getElementById('btn-reset').addEventListener('click', resetAll);
    document.getElementById('btn-generate-pdf').addEventListener('click', generatePDFWithCSS);
}

// ============================================
// VISUALIZACIÓN MATEMÁTICA
// ============================================

function updateMathDisplay() {
    // Actualizar matriz W
    const wDisplay = document.getElementById('w-values-display');
    wDisplay.innerHTML = '';
    wDisplay.style.gridTemplateColumns = `repeat(${numInputNeurons}, 1fr)`;
    
    for (let i = 0; i < numOutputNeurons; i++) {
        for (let j = 0; j < numInputNeurons; j++) {
            const span = document.createElement('span');
            span.textContent = W[i][j];
            span.dataset.row = i;
            span.dataset.col = j;
            wDisplay.appendChild(span);
        }
    }
    
    // Actualizar vector x
    const xDisplay = document.getElementById('x-values-display');
    xDisplay.innerHTML = '';
    for (let i = 0; i < numInputNeurons; i++) {
        const span = document.createElement('span');
        span.textContent = x[i];
        xDisplay.appendChild(span);
    }
    
    // Actualizar vector b
    const bDisplay = document.getElementById('b-values-display');
    bDisplay.innerHTML = '';
    for (let i = 0; i < numOutputNeurons; i++) {
        const span = document.createElement('span');
        span.textContent = b[i];
        bDisplay.appendChild(span);
    }
}

// ============================================
// CÁLCULOS MATEMÁTICOS
// ============================================

function calculateWx() {
    const result = [];
    for (let i = 0; i < numOutputNeurons; i++) {
        result[i] = 0;
        for (let j = 0; j < numInputNeurons; j++) {
            result[i] += W[i][j] * x[j];
        }
    }
    return result;
}

function calculateZ() {
    const wx = calculateWx();
    return wx.map((val, i) => val + b[i]);
}

function updateValuesFromInputs() {
    const wInputs = document.querySelectorAll('#matrix-w input');
    wInputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        if (!W[row]) W[row] = [];
        W[row][col] = parseFloat(input.value) || 0;
    });
    
    const xInputs = document.querySelectorAll('#vector-x input');
    xInputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        x[index] = parseFloat(input.value) || 0;
    });
    
    const bInputs = document.querySelectorAll('#vector-b input');
    bInputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        b[index] = parseFloat(input.value) || 0;
    });
}

function updateVisualization() {
    connections.forEach(c => {
        scene.remove(c.line);
        if (c.label) scene.remove(c.label);
    });
    connections = [];
    createConnections();
    
    inputNeurons.forEach((n, i) => {
        n.value = x[i];
        updateSpriteText(n.label, `x₍${i+1}₎ = ${x[i]}`, COLORS.inputNeuron);
    });
}

function updateSpriteText(sprite, text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 44px JetBrains Mono, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 10;
    
    const colorHex = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    context.fillStyle = colorHex;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    sprite.material.map.image = canvas;
    sprite.material.map.needsUpdate = true;
}

// ============================================
// ANIMACIONES CON CÁLCULOS DETALLADOS
// ============================================

async function animateFullCalculation() {
    if (isAnimating) return;
    
    disableButtons(true);
    clearCalculationPanel();
    showAnimationStatus('Iniciando cálculo z = Wx + b...');
    
    await delay(500 / animationSpeed);
    await animateStep1();
    await delay(800 / animationSpeed);
    await animateStep2();
    
    showAnimationStatus('¡Cálculo completado!');
    await delay(1500 / animationSpeed);
    hideAnimationStatus();
    disableButtons(false);
}

async function animateStep1Only() {
    if (isAnimating) return;
    disableButtons(true);
    clearCalculationPanel();
    await animateStep1();
    disableButtons(false);
}

async function animateStep2Only() {
    if (isAnimating) return;
    disableButtons(true);
    
    const wxValues = document.querySelectorAll('#wx-values span');
    if (wxValues[0] && wxValues[0].textContent === '—') {
        const wx = calculateWx();
        wxValues.forEach((span, i) => {
            if (i < wx.length) span.textContent = wx[i].toFixed(2);
        });
    }
    
    await animateStep2();
    disableButtons(false);
}

async function animateStep1() {
    isAnimating = true;
    showAnimationStatus('Paso 1: Multiplicación W × x');
    
    const wx = [];
    for (let i = 0; i < numOutputNeurons; i++) wx[i] = 0;
    
    const wxValues = document.querySelectorAll('#wx-values span');
    
    addCalculationStep({
        type: 'title',
        title: 'PASO 1: Multiplicación Matriz-Vector (W × x)',
        content: 'Cada elemento de z se calcula multiplicando la fila correspondiente de W por el vector x'
    });
    
    await delay(400 / animationSpeed);
    
    for (let i = 0; i < numOutputNeurons; i++) {
        if (wxValues[i]) {
            wxValues[i].textContent = '...';
            wxValues[i].classList.add('calculating');
        }
        
        showCurrentCalculation(`Calculando z₍${i+1}₎`, `Fila ${i+1} de W × vector x`);
        
        const products = [];
        let sum = 0;
        
        for (let j = 0; j < numInputNeurons; j++) {
            const conn = connections.find(c => c.outputIndex === i && c.inputIndex === j);
            if (conn) {
                conn.line.material.color.setHex(COLORS.highlight);
                conn.line.material.opacity = 1;
                conn.label.visible = true;
            }
            
            inputNeurons[j].mesh.material.emissiveIntensity = 0.8;
            inputNeurons[j].glow.material.opacity = 0.4;
            
            highlightMathElement('w', i, j);
            highlightMathElement('x', j);
            
            const product = W[i][j] * x[j];
            products.push({
                w: W[i][j],
                x: x[j],
                result: product
            });
            sum += product;
            
            updateCurrentCalculation(
                `z₍${i+1}₎: Calculando término ${j+1}`,
                `(${W[i][j]}) × (${x[j]}) = ${product.toFixed(2)}`
            );
            
            await delay(450 / animationSpeed);
            
            inputNeurons[j].mesh.material.emissiveIntensity = 0.3;
            inputNeurons[j].glow.material.opacity = 0.15;
            unhighlightMathElements();
            
            if (conn) {
                conn.line.material.color.setHex(conn.originalColor);
                conn.line.material.opacity = Math.min(0.3 + Math.abs(conn.weight) * 0.5, 0.9);
                conn.label.visible = false;
            }
        }
        
        wx[i] = sum;
        
        addCalculationStep({
            type: 'calculation',
            number: i + 1,
            title: `Cálculo de (Wx)₍${i+1}₎`,
            products: products,
            result: sum
        });
        
        if (wxValues[i]) {
            wxValues[i].textContent = sum.toFixed(2);
            wxValues[i].classList.remove('calculating');
        }
        
        outputNeurons[i].mesh.material.emissiveIntensity = 0.6;
        updateSpriteText(outputNeurons[i].label, `z₍${i+1}₎ = ${sum.toFixed(1)}`, COLORS.outputNeuron);
        
        await delay(300 / animationSpeed);
        outputNeurons[i].mesh.material.emissiveIntensity = 0.3;
    }
    
    addCalculationStep({
        type: 'result',
        title: 'Resultado de Wx',
        values: wx
    });
    
    hideCurrentCalculation();
    isAnimating = false;
    return wx;
}

async function animateStep2() {
    isAnimating = true;
    showAnimationStatus('Paso 2: Suma del vector de sesgo b');
    
    const wx = calculateWx();
    const z = [];
    const zValues = document.querySelectorAll('#z-values span');
    
    addCalculationStep({
        type: 'title',
        title: 'PASO 2: Suma Vectorial (Wx + b)',
        content: 'Se suma el sesgo b elemento por elemento al resultado de Wx'
    });
    
    await delay(400 / animationSpeed);
    
    for (let i = 0; i < numOutputNeurons; i++) {
        if (zValues[i]) {
            zValues[i].textContent = '...';
            zValues[i].classList.add('calculating');
        }
        
        showCurrentCalculation(`Sumando sesgo b₍${i+1}₎`, `${wx[i].toFixed(2)} + (${b[i]})`);
        
        outputNeurons[i].mesh.material.emissive.setHex(COLORS.bias);
        outputNeurons[i].mesh.material.emissiveIntensity = 0.8;
        outputNeurons[i].glow.material.opacity = 0.4;
        
        await delay(500 / animationSpeed);
        
        const result = wx[i] + b[i];
        z.push(result);
        
        addCalculationStep({
            type: 'bias',
            number: i + 1,
            wx: wx[i],
            b: b[i],
            result: result
        });
        
        if (zValues[i]) {
            zValues[i].textContent = result.toFixed(2);
            zValues[i].classList.remove('calculating');
        }
        
        updateSpriteText(outputNeurons[i].label, `z₍${i+1}₎ = ${result.toFixed(2)}`, COLORS.outputNeuron);
        
        outputNeurons[i].mesh.material.emissive.setHex(COLORS.outputNeuron);
        outputNeurons[i].mesh.material.emissiveIntensity = 0.3;
        outputNeurons[i].glow.material.opacity = 0.15;
        
        updateCurrentCalculation(
            `z₍${i+1}₎ calculado`,
            `= ${result.toFixed(2)}`
        );
        
        await delay(300 / animationSpeed);
    }
    
    addCalculationStep({
        type: 'final',
        title: 'Vector z = Wx + b (Resultado Final)',
        values: z
    });
    
    outputNeurons.forEach(n => {
        n.glow.material.opacity = 0.35;
    });
    
    await delay(600 / animationSpeed);
    
    outputNeurons.forEach(n => {
        n.glow.material.opacity = 0.15;
    });
    
    hideCurrentCalculation();
    isAnimating = false;
    return z;
}

// ============================================
// PANEL DE CÁLCULO DETALLADO
// ============================================

function clearCalculationPanel() {
    const container = document.getElementById('calculation-container');
    container.innerHTML = '';
}

function addCalculationStep(stepData) {
    const container = document.getElementById('calculation-container');
    const step = document.createElement('div');
    step.className = 'calc-step';
    
    if (stepData.type === 'title') {
        step.classList.add('step-title');
        step.innerHTML = `
            <div class="calc-step-header">
                <span class="calc-step-title">${stepData.title}</span>
            </div>
            <div class="calc-step-content">
                <span class="operation">${stepData.content}</span>
            </div>
        `;
    } else if (stepData.type === 'calculation') {
        const productsHTML = stepData.products.map((p, j) => 
            `<span class="highlight-num">(${p.w})</span> × <span class="highlight-num">(${p.x})</span> = <span class="partial">${p.result.toFixed(2)}</span>`
        ).join(' + ');
        
        step.innerHTML = `
            <div class="calc-step-header">
                <span class="calc-step-number">${stepData.number}</span>
                <span class="calc-step-title">${stepData.title}</span>
            </div>
            <div class="calc-step-content">
                <span class="operation">${productsHTML}</span>
                <span class="operation">Suma: <span class="partial">${stepData.products.map(p => p.result.toFixed(2)).join(' + ')}</span> <span class="equals-sign">=</span> <span class="highlight-result">${stepData.result.toFixed(2)}</span></span>
            </div>
        `;
    } else if (stepData.type === 'bias') {
        step.innerHTML = `
            <div class="calc-step-header">
                <span class="calc-step-number">${stepData.number}</span>
                <span class="calc-step-title">z₍${stepData.number}₎ = (Wx)₍${stepData.number}₎ + b₍${stepData.number}₎</span>
            </div>
            <div class="calc-step-content">
                <span class="operation"><span class="partial">${stepData.wx.toFixed(2)}</span> + <span class="highlight-num">(${stepData.b})</span> <span class="equals-sign">=</span> <span class="highlight-result">${stepData.result.toFixed(2)}</span></span>
            </div>
        `;
    } else if (stepData.type === 'result' || stepData.type === 'final') {
        step.classList.add('step-result');
        const valuesHTML = stepData.values.map((v, i) => 
            `<span class="highlight-result">${v.toFixed(2)}</span>`
        ).join(', ');
        
        step.innerHTML = `
            <div class="calc-step-header">
                <span class="calc-step-title">${stepData.title}</span>
            </div>
            <div class="calc-step-content">
                <span class="operation">[ ${valuesHTML} ]</span>
            </div>
        `;
    }
    
    container.appendChild(step);
    container.scrollTop = container.scrollHeight;
}

// ============================================
// DISPLAY 3D DE CÁLCULOS
// ============================================

function showCurrentCalculation(title, detail) {
    const container = document.getElementById('current-calculation');
    const titleEl = document.getElementById('calc-title');
    const detailEl = document.getElementById('calc-detail');
    
    titleEl.textContent = title;
    detailEl.innerHTML = detail;
    container.classList.remove('hidden');
}

function updateCurrentCalculation(title, detail) {
    document.getElementById('calc-title').textContent = title;
    document.getElementById('calc-detail').innerHTML = detail
        .replace(/\(([^)]+)\)/g, '<span class="op-highlight">($1)</span>')
        .replace(/= ([0-9.-]+)$/, '= <span class="res-highlight">$1</span>');
}

function hideCurrentCalculation() {
    document.getElementById('current-calculation').classList.add('hidden');
}

function highlightMathElement(type, row, col) {
    if (type === 'w') {
        const spans = document.querySelectorAll('#w-values-display span');
        const index = row * numInputNeurons + col;
        if (spans[index]) spans[index].classList.add('active');
    } else if (type === 'x') {
        const spans = document.querySelectorAll('#x-values-display span');
        if (spans[row]) spans[row].classList.add('highlight');
    }
}

function unhighlightMathElements() {
    document.querySelectorAll('#w-values-display span, #x-values-display span').forEach(span => {
        span.classList.remove('active', 'highlight');
    });
}

function resetAll() {
    // Restaurar valores por defecto
    numInputNeurons = 3;
    numOutputNeurons = 3;
    
    W = JSON.parse(JSON.stringify(defaultW));
    x = [...defaultX];
    b = [...defaultB];
    
    // Actualizar displays de número de neuronas
    const inputDisplay = document.getElementById('input-neurons-count');
    const outputDisplay = document.getElementById('output-neurons-count');
    if (inputDisplay) inputDisplay.textContent = numInputNeurons;
    if (outputDisplay) outputDisplay.textContent = numOutputNeurons;
    
    createMatrixInputs();
    createVectorInputs();
    updateMathDisplay();
    updateResultsDisplay();
    createScene();
    
    clearCalculationPanel();
    const container = document.getElementById('calculation-container');
    container.innerHTML = `
        <div class="calculation-placeholder">
            <span class="placeholder-icon">📐</span>
            <p>Presiona <strong>"Animar Cálculo"</strong> para ver el proceso matemático detallado</p>
        </div>
    `;
    
    hideAnimationStatus();
    hideCurrentCalculation();
    isAnimating = false;
}

// ============================================
// UTILIDADES
// ============================================

function disableButtons(disabled) {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.disabled = disabled;
    });
}

function showAnimationStatus(text) {
    const status = document.getElementById('animation-status');
    const statusText = document.getElementById('status-text');
    statusText.textContent = text;
    status.classList.remove('hidden');
}

function hideAnimationStatus() {
    document.getElementById('animation-status').classList.add('hidden');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// LOOP DE ANIMACIÓN
// ============================================

function animate() {
    animationId = requestAnimationFrame(animate);
    
    controls.update();
    checkIntersections();
    
    const time = Date.now() * 0.001;
    
    inputNeurons.forEach((n, i) => {
        n.mesh.position.y = n.originalY + Math.sin(time + i) * 0.1;
        n.glow.position.y = n.mesh.position.y;
        n.label.position.y = n.mesh.position.y;
    });
    
    outputNeurons.forEach((n, i) => {
        n.mesh.position.y = n.originalY + Math.sin(time + i + Math.PI) * 0.1;
        n.glow.position.y = n.mesh.position.y;
        n.label.position.y = n.mesh.position.y;
    });
    
    if (!isAnimating) {
        const pulse = 0.15 + Math.sin(time * 2) * 0.05;
        [...inputNeurons, ...outputNeurons].forEach(n => {
            n.glow.material.opacity = pulse;
        });
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('visualization');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// ============================================
// GENERACIÓN DE PDF
// ============================================

function captureCanvas3D() {
    if (!renderer || !renderer.domElement || !camera || !scene) {
        return null;
    }
    
    // Guardar posición y rotación original de la cámara
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    const originalTarget = controls.target.clone();
    
    // Configurar vista frontal con ligera inclinación para ver profundidad
    // Posición frontal: x=0, y ligeramente arriba, z alejado
    camera.position.set(0, 2, 12);
    camera.lookAt(0, 0, 0);
    
    // Ajustar controles para que apunten al centro
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Renderizar con la nueva posición
    renderer.render(scene, camera);
    
    // Capturar el canvas como imagen
    const dataURL = renderer.domElement.toDataURL('image/png');
    
    // Restaurar posición y rotación original de la cámara
    camera.position.copy(originalPosition);
    camera.rotation.copy(originalRotation);
    controls.target.copy(originalTarget);
    controls.update();
    renderer.render(scene, camera);
    
    return dataURL;
}

async function captureHTMLElement(elementId, options = {}) {
    return new Promise((resolve, reject) => {
        const element = document.getElementById(elementId);
        if (!element) {
            resolve(null);
            return;
        }
        
        html2canvas(element, {
            backgroundColor: options.backgroundColor || null,
            scale: options.scale || 2,
            useCORS: true,
            logging: false,
            ...options
        }).then(canvas => {
            resolve(canvas.toDataURL('image/png'));
        }).catch(error => {
            console.error(`Error capturando ${elementId}:`, error);
            resolve(null);
        });
    });
}

async function generatePDF() {
    try {
        // Verificar que las bibliotecas estén disponibles
        if (typeof window.jspdf === 'undefined') {
            alert('Error: jsPDF no está disponible. Por favor, recarga la página.');
            return;
        }
        
        if (typeof html2canvas === 'undefined') {
            alert('Error: html2canvas no está disponible. Por favor, recarga la página.');
            return;
        }
        
        showAnimationStatus('Generando PDF...');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;
        
        // Función auxiliar para añadir nueva página si es necesario
        function checkNewPage(requiredHeight) {
            if (yPos + requiredHeight > pageHeight - margin) {
                doc.addPage();
                // Aplicar fondo oscuro a todas las páginas
                doc.setFillColor(10, 14, 23);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                yPos = margin;
                return true;
            }
            return false;
        }
        
        const now = new Date();
        
        // 1. PORTADA ESTILIZADA
        doc.setFillColor(10, 14, 23); // Color de fondo oscuro
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        doc.setTextColor(6, 182, 212); // Cyan
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Visualización Neuronal', pageWidth / 2, 60, { align: 'center' });
        
        doc.setFontSize(20);
        doc.setTextColor(139, 92, 246); // Violeta
        doc.text('z = Wx + b', pageWidth / 2, 75, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175); // Gris claro
        doc.text(`Generado el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`, pageWidth / 2, 90, { align: 'center' });
        
        yPos = 100;
        
        // Color de fondo oscuro (igual que la portada)
        const darkBackground = '#0a0e17';
        
        // Función auxiliar para calcular aspect ratio y dimensiones
        function calculateImageDimensions(imgDataURL, maxWidth, maxHeight) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const aspectRatio = img.width / img.height;
                    let imgWidth = maxWidth;
                    let imgHeight = maxWidth / aspectRatio;
                    
                    // Si la altura excede el máximo, ajustar por altura
                    if (imgHeight > maxHeight) {
                        imgHeight = maxHeight;
                        imgWidth = maxHeight * aspectRatio;
                    }
                    
                    resolve({ width: imgWidth, height: imgHeight, aspectRatio });
                };
                img.onerror = () => resolve({ width: maxWidth, height: maxHeight, aspectRatio: 1 });
                img.src = imgDataURL;
            });
        }
        
        // 2. CONFIGURACIÓN DE RED (captura visual completa)
        doc.addPage();
        doc.setFillColor(10, 14, 23); // Fondo oscuro igual que portada
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
        
        const neuronsControlSection = document.querySelector('.neurons-control-section');
        if (neuronsControlSection) {
            const neuronsImg = await html2canvas(neuronsControlSection, {
                backgroundColor: darkBackground,
                scale: 2,
                useCORS: true,
                logging: false
            }).then(canvas => canvas.toDataURL('image/png')).catch(() => null);
            
            if (neuronsImg) {
                const maxWidth = pageWidth - 2 * margin;
                const maxHeight = 40;
                const dims = await calculateImageDimensions(neuronsImg, maxWidth, maxHeight);
                checkNewPage(dims.height + 10);
                doc.addImage(neuronsImg, 'PNG', margin, yPos, dims.width, dims.height);
                yPos += dims.height + 10;
            }
        }
        
        // 3. ECUACIÓN MATEMÁTICA (generación directa en PDF)
        checkNewPage(60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212); // Cyan
        doc.text('Representación Matemática', margin, yPos);
        yPos += 10;
        
        // Generar la ecuación directamente
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 200); // Gris claro
        
        // Construir la ecuación como texto
        let equationText = 'z = ';
        
        // Matriz W
        equationText += '[';
        for (let i = 0; i < numOutputNeurons; i++) {
            if (i > 0) equationText += '; ';
            for (let j = 0; j < numInputNeurons; j++) {
                if (j > 0) equationText += ' ';
                equationText += W[i][j].toFixed(2);
            }
        }
        equationText += ']';
        
        equationText += ' × ';
        
        // Vector x
        equationText += '[';
        for (let j = 0; j < numInputNeurons; j++) {
            if (j > 0) equationText += '; ';
            equationText += x[j].toFixed(2);
        }
        equationText += ']';
        
        equationText += ' + ';
        
        // Vector b
        equationText += '[';
        for (let i = 0; i < numOutputNeurons; i++) {
            if (i > 0) equationText += '; ';
            equationText += b[i].toFixed(2);
        }
        equationText += ']';
        
        // Dividir en líneas si es muy largo
        const maxLineWidth = pageWidth - 2 * margin;
        const lines = doc.splitTextToSize(equationText, maxLineWidth);
        
        for (let i = 0; i < lines.length; i++) {
            checkNewPage(6);
            doc.text(lines[i], margin, yPos);
            yPos += 6;
        }
        yPos += 5;
        
        // 4. DATOS DE ENTRADA (captura visual completa con fondo)
        checkNewPage(90);
        const inputsSection = document.querySelector('.inputs-section');
        if (inputsSection) {
            const inputsImg = await html2canvas(inputsSection, {
                backgroundColor: darkBackground,
                scale: 2,
                useCORS: true,
                logging: false
            }).then(canvas => canvas.toDataURL('image/png')).catch(() => null);
            
            if (inputsImg) {
                const maxWidth = pageWidth - 2 * margin;
                const maxHeight = 100;
                const dims = await calculateImageDimensions(inputsImg, maxWidth, maxHeight);
                checkNewPage(dims.height + 10);
                doc.addImage(inputsImg, 'PNG', margin, yPos, dims.width, dims.height);
                yPos += dims.height + 10;
            }
        }
        
        // 5. RESULTADOS (captura visual completa con fondo)
        checkNewPage(60);
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            const resultsImg = await html2canvas(resultsSection, {
                backgroundColor: darkBackground,
                scale: 2,
                useCORS: true,
                logging: false
            }).then(canvas => canvas.toDataURL('image/png')).catch(() => null);
            
            if (resultsImg) {
                const maxWidth = pageWidth - 2 * margin;
                const maxHeight = 60;
                const dims = await calculateImageDimensions(resultsImg, maxWidth, maxHeight);
                checkNewPage(dims.height + 10);
                doc.addImage(resultsImg, 'PNG', margin, yPos, dims.width, dims.height);
                yPos += dims.height + 10;
            }
        }
        
        // 6. VISUALIZACIÓN 3D - Estado Final
        checkNewPage(80);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212); // Cyan para títulos
        doc.text('Visualización 3D - Estado Final', margin, yPos);
        yPos += 8;
        
        const canvasImage = captureCanvas3D();
        if (canvasImage) {
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = 100;
            const dims = await calculateImageDimensions(canvasImage, maxWidth, maxHeight);
            checkNewPage(dims.height + 10);
            doc.addImage(canvasImage, 'PNG', margin, yPos, dims.width, dims.height);
            yPos += dims.height + 10;
        }
        
        // 6b. VISUALIZACIÓN 3D - Con hover en neurona de entrada (con tooltip)
        if (inputNeurons.length > 0) {
            checkNewPage(80);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 182, 212);
            doc.text('Visualización 3D - Hover Neurona Entrada', margin, yPos);
            yPos += 8;
            
            // Activar hover en primera neurona de entrada
            const firstInputNeuron = inputNeurons[0];
            if (firstInputNeuron && firstInputNeuron.mesh) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:1715',message:'Activating hover on input neuron',data:{neuronIndex:0,hasMesh:!!firstInputNeuron.mesh},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
                highlightObject(firstInputNeuron.mesh);
                showTooltip(firstInputNeuron.mesh);
                // Renderizar varias veces para asegurar que el hover se vea
                renderer.render(scene, camera);
                await new Promise(resolve => setTimeout(resolve, 300));
                renderer.render(scene, camera);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Capturar el canvas Y el tooltip juntos
                const visualizationContainer = document.getElementById('visualization');
                const canvasImageHoverInput = await html2canvas(visualizationContainer, {
                    backgroundColor: darkBackground,
                    scale: 2,
                    useCORS: true,
                    logging: false
                }).then(canvas => canvas.toDataURL('image/png')).catch(() => null);
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:1730',message:'Hover input canvas captured with tooltip',data:{hasImage:!!canvasImageHoverInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
                if (canvasImageHoverInput) {
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = 100;
                    const dims = await calculateImageDimensions(canvasImageHoverInput, maxWidth, maxHeight);
                    checkNewPage(dims.height + 10);
                    doc.addImage(canvasImageHoverInput, 'PNG', margin, yPos, dims.width, dims.height);
                    yPos += dims.height + 10;
                }
                
                resetHover(firstInputNeuron.mesh);
                hideTooltip();
                renderer.render(scene, camera);
            }
        }
        
        // 6c. VISUALIZACIÓN 3D - Con hover en neurona de salida (con tooltip)
        if (outputNeurons.length > 0) {
            checkNewPage(80);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 182, 212);
            doc.text('Visualización 3D - Hover Neurona Salida', margin, yPos);
            yPos += 8;
            
            // Activar hover en primera neurona de salida
            const firstOutputNeuron = outputNeurons[0];
            if (firstOutputNeuron && firstOutputNeuron.mesh) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:1750',message:'Activating hover on output neuron',data:{neuronIndex:0,hasMesh:!!firstOutputNeuron.mesh},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
                highlightObject(firstOutputNeuron.mesh);
                showTooltip(firstOutputNeuron.mesh);
                // Renderizar varias veces para asegurar que el hover se vea
                renderer.render(scene, camera);
                await new Promise(resolve => setTimeout(resolve, 300));
                renderer.render(scene, camera);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Capturar el canvas Y el tooltip juntos
                const visualizationContainer = document.getElementById('visualization');
                const canvasImageHoverOutput = await html2canvas(visualizationContainer, {
                    backgroundColor: darkBackground,
                    scale: 2,
                    useCORS: true,
                    logging: false
                }).then(canvas => canvas.toDataURL('image/png')).catch(() => null);
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:1765',message:'Hover output canvas captured with tooltip',data:{hasImage:!!canvasImageHoverOutput},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
                if (canvasImageHoverOutput) {
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = 100;
                    const dims = await calculateImageDimensions(canvasImageHoverOutput, maxWidth, maxHeight);
                    checkNewPage(dims.height + 10);
                    doc.addImage(canvasImageHoverOutput, 'PNG', margin, yPos, dims.width, dims.height);
                    yPos += dims.height + 10;
                }
                
                resetHover(firstOutputNeuron.mesh);
                hideTooltip();
                renderer.render(scene, camera);
            }
        }
        
        // 7. CÁLCULOS PASO A PASO (generación directa en PDF)
        checkNewPage(30);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212); // Cyan
        doc.text('Cálculo Paso a Paso', margin, yPos);
        yPos += 10;
        
        // Calcular valores
        const wx = calculateWx();
        const z = calculateZ();
        
        // PASO 1: Multiplicación Wx
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); // Violeta
        doc.text('PASO 1: Multiplicación Matriz-Vector (Wx)', margin, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200); // Gris claro
        
        for (let i = 0; i < numOutputNeurons; i++) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 182, 212); // Cyan
            doc.text(`${i + 1}. Cálculo de (Wx)₍${i+1}₎`, margin, yPos);
            yPos += 6;
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            
            // Productos individuales
            let productsText = '';
            for (let j = 0; j < numInputNeurons; j++) {
                const product = W[i][j] * x[j];
                if (j > 0) productsText += ' + ';
                productsText += `(${W[i][j].toFixed(2)}) × (${x[j].toFixed(2)}) = ${product.toFixed(2)}`;
            }
            
            const lines = doc.splitTextToSize(productsText, pageWidth - 2 * margin);
            for (let line of lines) {
                checkNewPage(5);
                doc.text(line, margin + 5, yPos);
                yPos += 5;
            }
            
            // Suma
            checkNewPage(6);
            const sumText = `Suma: ${wx[i].toFixed(2)}`;
            doc.text(sumText, margin + 5, yPos);
            yPos += 8;
        }
        
        // PASO 2: Suma del sesgo
        checkNewPage(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); // Violeta
        doc.text('PASO 2: Suma Vectorial (Wx + b)', margin, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        
        for (let i = 0; i < numOutputNeurons; i++) {
            checkNewPage(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 182, 212); // Cyan
            doc.text(`z₍${i+1}₎ = (Wx)₍${i+1}₎ + b₍${i+1}₎`, margin, yPos);
            yPos += 6;
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            const resultText = `${wx[i].toFixed(2)} + (${b[i].toFixed(2)}) = ${z[i].toFixed(2)}`;
            doc.text(resultText, margin + 5, yPos);
            yPos += 8;
        }
        
        // Resultado final
        checkNewPage(10);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94); // Verde
        doc.text('Resultado Final:', margin, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(6, 182, 212); // Cyan
        const finalText = `z = [ ${z.map(v => v.toFixed(2)).join(', ')} ]`;
        doc.text(finalText, margin, yPos);
        yPos += 10;
        
        // Guardar PDF
        const fileName = `visualizacion-neuronal-${now.getTime()}.pdf`;
        doc.save(fileName);
        
        // Mostrar mensaje de éxito
        showAnimationStatus('PDF generado exitosamente');
        setTimeout(() => hideAnimationStatus(), 2000);
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
        hideAnimationStatus();
    }
}

// Generar PDF usando html2canvas + jsPDF (mantiene CSS)
async function generatePDFWithCSS() {
    try {
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            alert('Error: html2canvas o jsPDF no están disponibles. Por favor, recarga la página.');
            return;
        }
        
        showAnimationStatus('Generando PDF con CSS...');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;
        
        const now = new Date();
        const darkBackground = '#0a0e17';
        
        function checkNewPage(requiredHeight) {
            if (yPos + requiredHeight > pageHeight - margin) {
                doc.addPage();
                doc.setFillColor(10, 14, 23);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                yPos = margin;
                return true;
            }
            return false;
        }
        
        // Portada
        doc.setFillColor(10, 14, 23);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Visualización Neuronal', pageWidth / 2, 60, { align: 'center' });
        doc.setFontSize(20);
        doc.setTextColor(139, 92, 246);
        doc.text('z = Wx + b', pageWidth / 2, 75, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text(`Generado el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`, pageWidth / 2, 90, { align: 'center' });
        yPos = 100;
        
        // Función para capturar sección y añadirla al PDF
        async function captureAndAddSection(selector, maxHeight = null) {
            const element = document.querySelector(selector);
            if (!element) return;
            
            // Asegurar que el elemento esté visible y sin scroll
            const originalScrollTop = element.scrollTop || 0;
            const originalScrollLeft = element.scrollLeft || 0;
            if (element.scrollTop !== undefined) element.scrollTop = 0;
            if (element.scrollLeft !== undefined) element.scrollLeft = 0;
            
            // Capturar con html2canvas
            const canvas = await html2canvas(element, {
                backgroundColor: darkBackground,
                scale: 2,
                useCORS: true,
                logging: false,
                width: element.scrollWidth || element.offsetWidth,
                height: element.scrollHeight || element.offsetHeight
            }).catch(() => null);
            
            // Restaurar scroll
            if (element.scrollTop !== undefined) element.scrollTop = originalScrollTop;
            if (element.scrollLeft !== undefined) element.scrollLeft = originalScrollLeft;
            
            if (!canvas) return;
            
            const imgData = canvas.toDataURL('image/png');
            const imgAspectRatio = canvas.width / canvas.height;
            const maxWidth = pageWidth - 2 * margin;
            let imgWidth = maxWidth;
            let imgHeight = maxWidth / imgAspectRatio;
            
            if (maxHeight && imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = maxHeight * imgAspectRatio;
            }
            
            checkNewPage(imgHeight + 10);
            doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
        }
        
        // Capturar cada sección
        await captureAndAddSection('.neurons-control-section', 40);
        await captureAndAddSection('.inputs-section', 100);
        await captureAndAddSection('.results-section', 60);
        
        // Representación matemática: crear HTML con CSS específico para PDF
        const mathSection = document.querySelector('.math-display-section');
        if (mathSection) {
            const mathEquation = document.getElementById('main-equation');
            if (mathEquation) {
                // Crear contenedor HTML con CSS específico para PDF
                const mathHTMLContainer = document.createElement('div');
                mathHTMLContainer.style.cssText = `
                    background: #1a1f2e;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #2d3748;
                    width: 100%;
                    font-family: 'Space Grotesk', sans-serif;
                `;
                
                // Título
                const mathTitle = document.createElement('h2');
                mathTitle.textContent = 'Representación Matemática';
                mathTitle.style.cssText = 'color: #06b6d4; font-size: 24px; margin-bottom: 20px; margin-top: 0; text-align: center; font-weight: 700;';
                mathHTMLContainer.appendChild(mathTitle);
                
                // CSS específico para la ecuación (TAMAÑOS AÚN MÁS AUMENTADOS)
                const mathStyle = document.createElement('style');
                mathStyle.textContent = `
                    .pdf-math-equation {
                        overflow-x: visible;
                        padding: 24px 0;
                        width: 100%;
                    }
                    .pdf-matrix-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 24px;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 36px;
                        flex-wrap: wrap;
                    }
                    .pdf-matrix-label {
                        font-size: 3rem;
                        font-weight: 700;
                        color: #06b6d4;
                    }
                    .pdf-equals, .pdf-times, .pdf-plus {
                        color: #9ca3af;
                        font-size: 2.5rem;
                        padding: 0 12px;
                        font-weight: 600;
                    }
                    .pdf-matrix, .pdf-vector {
                        display: flex;
                        align-items: stretch;
                    }
                    .pdf-bracket {
                        width: 14px;
                        border: 4px solid #06b6d4;
                        border-radius: 5px;
                    }
                    .pdf-bracket.left {
                        border-right: none;
                        border-radius: 5px 0 0 5px;
                    }
                    .pdf-bracket.right {
                        border-left: none;
                        border-radius: 0 5px 5px 0;
                    }
                    .pdf-matrix-values {
                        display: grid;
                        grid-template-columns: repeat(${numInputNeurons}, 1fr);
                        gap: 6px 16px;
                        padding: 16px 20px;
                        background: #0f1419;
                    }
                    .pdf-matrix-values span {
                        text-align: center;
                        padding: 6px 12px;
                        min-width: 70px;
                        color: #e5e7eb;
                        font-size: 28px;
                        font-weight: 500;
                    }
                    .pdf-vector-values {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        padding: 16px 20px;
                        background: #0f1419;
                    }
                    .pdf-vector-values span {
                        text-align: center;
                        padding: 6px 12px;
                        color: #e5e7eb;
                        font-size: 28px;
                        font-weight: 500;
                    }
                `;
                mathHTMLContainer.appendChild(mathStyle);
                
                // Clonar y adaptar la ecuación
                const clonedEquation = mathEquation.cloneNode(true);
                clonedEquation.className = 'pdf-math-equation';
                
                // Adaptar clases
                const matrixContainer = clonedEquation.querySelector('.matrix-container');
                if (matrixContainer) {
                    matrixContainer.className = 'pdf-matrix-container';
                    const label = matrixContainer.querySelector('.matrix-label');
                    if (label) label.className = 'pdf-matrix-label';
                    const equals = matrixContainer.querySelector('.equals');
                    if (equals) equals.className = 'pdf-equals';
                    const times = matrixContainer.querySelector('.times');
                    if (times) times.className = 'pdf-times';
                    const plus = matrixContainer.querySelector('.plus');
                    if (plus) plus.className = 'pdf-plus';
                    
                    // Adaptar matrices y vectores
                    const matrices = matrixContainer.querySelectorAll('.matrix, .vector');
                    matrices.forEach(mat => {
                        mat.className = mat.className === 'matrix' ? 'pdf-matrix' : 'pdf-vector';
                        const brackets = mat.querySelectorAll('.bracket');
                        brackets.forEach(b => {
                            b.className = b.classList.contains('left') ? 'pdf-bracket left' : 'pdf-bracket right';
                        });
                        const values = mat.querySelector('.matrix-values, .vector-values');
                        if (values) {
                            values.className = values.classList.contains('matrix-values') ? 'pdf-matrix-values' : 'pdf-vector-values';
                        }
                    });
                }
                
                mathHTMLContainer.appendChild(clonedEquation);
                
                // Añadir al DOM temporalmente
                mathHTMLContainer.style.position = 'absolute';
                mathHTMLContainer.style.left = '-9999px';
                document.body.appendChild(mathHTMLContainer);
                
                // Esperar a que se apliquen los estilos
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Capturar el HTML generado
                const mathCanvas = await html2canvas(mathHTMLContainer, {
                    backgroundColor: '#0a0e17',
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: mathHTMLContainer.scrollWidth,
                    height: mathHTMLContainer.scrollHeight
                }).catch(() => null);
                
                // Eliminar del DOM
                document.body.removeChild(mathHTMLContainer);
                
                if (mathCanvas) {
                    const mathImgData = mathCanvas.toDataURL('image/png');
                    const mathAspectRatio = mathCanvas.width / mathCanvas.height;
                    const maxWidth = pageWidth - 2 * margin;
                    const maxHeight = pageHeight - 2 * margin - 20; // Usar casi toda la página
                    let mathWidth = maxWidth;
                    let mathHeight = maxWidth / mathAspectRatio;
                    if (mathHeight > maxHeight) {
                        mathHeight = maxHeight;
                        mathWidth = maxHeight * mathAspectRatio;
                    }
                    
                    checkNewPage(mathHeight + 10);
                    doc.addImage(mathImgData, 'PNG', margin, yPos, mathWidth, mathHeight);
                    yPos += mathHeight + 10;
                }
            }
        }
        
        // Cálculos paso a paso: extraer calc-step y crear HTML con CSS específico
        const calcContainer = document.getElementById('calculation-container');
        const calcSteps = calcContainer ? calcContainer.querySelectorAll('.calc-step') : [];
        
        if (calcSteps.length > 0) {
            // NUEVA PÁGINA para los cálculos paso a paso con el mismo fondo
            doc.addPage();
            doc.setFillColor(10, 14, 23); // Fondo oscuro igual que las demás páginas
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            yPos = margin;
            
            // Crear contenedor HTML con CSS específico para PDF
            const calcHTMLContainer = document.createElement('div');
            calcHTMLContainer.style.cssText = `
                background: #1a1f2e;
                border-radius: 12px;
                padding: 30px;
                border: 1px solid #2d3748;
                width: 100%;
                font-family: 'Space Grotesk', sans-serif;
            `;
            
            // Título
            const calcTitle = document.createElement('h2');
            calcTitle.textContent = 'Cálculo Paso a Paso';
            calcTitle.style.cssText = 'color: #06b6d4; font-size: 24px; margin-bottom: 20px; margin-top: 0; font-weight: 700;';
            calcHTMLContainer.appendChild(calcTitle);
            
            // CSS específico para los pasos (TAMAÑOS AUMENTADOS)
            const style = document.createElement('style');
            style.textContent = `
                .pdf-calc-step {
                    background: #0f1419;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border-left: 4px solid #06b6d4;
                }
                .pdf-calc-step.step-title {
                    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15));
                    border-left-color: #8b5cf6;
                }
                .pdf-calc-step.step-result {
                    border-left-color: #22c55e;
                    background: rgba(16, 185, 129, 0.1);
                }
                .pdf-calc-step-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .pdf-calc-step-number {
                    background: #06b6d4;
                    color: #0a0e17;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    margin-right: 14px;
                }
                .pdf-calc-step-title {
                    color: #06b6d4;
                    font-weight: 600;
                    font-size: 18px;
                }
                .pdf-calc-step-content {
                    color: #e5e7eb;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    line-height: 1.8;
                }
                .pdf-highlight-num {
                    color: #8b5cf6;
                    font-weight: 600;
                    font-size: 17px;
                }
                .pdf-partial {
                    color: #fbbf24;
                    font-size: 17px;
                }
                .pdf-highlight-result {
                    color: #22c55e;
                    font-weight: 600;
                    font-size: 18px;
                }
                .pdf-equals-sign {
                    color: #06b6d4;
                    margin: 0 6px;
                    font-size: 17px;
                }
            `;
            calcHTMLContainer.appendChild(style);
            
            // Clonar y adaptar cada calc-step
            calcSteps.forEach(step => {
                const clonedStep = step.cloneNode(true);
                clonedStep.className = clonedStep.className.replace('calc-step', 'pdf-calc-step');
                
                // Adaptar clases internas
                const header = clonedStep.querySelector('.calc-step-header');
                if (header) {
                    header.className = 'pdf-calc-step-header';
                    const number = header.querySelector('.calc-step-number');
                    if (number) number.className = 'pdf-calc-step-number';
                    const title = header.querySelector('.calc-step-title');
                    if (title) title.className = 'pdf-calc-step-title';
                }
                
                const content = clonedStep.querySelector('.calc-step-content');
                if (content) {
                    content.className = 'pdf-calc-step-content';
                    // Reemplazar clases de spans internos
                    content.querySelectorAll('.highlight-num').forEach(el => el.className = 'pdf-highlight-num');
                    content.querySelectorAll('.partial').forEach(el => el.className = 'pdf-partial');
                    content.querySelectorAll('.highlight-result').forEach(el => el.className = 'pdf-highlight-result');
                    content.querySelectorAll('.equals-sign').forEach(el => el.className = 'pdf-equals-sign');
                }
                
                calcHTMLContainer.appendChild(clonedStep);
            });
            
            // Añadir al DOM temporalmente para que se apliquen los estilos
            calcHTMLContainer.style.position = 'absolute';
            calcHTMLContainer.style.left = '-9999px';
            document.body.appendChild(calcHTMLContainer);
            
            // Esperar a que se apliquen los estilos
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Capturar el HTML generado
            const calcCanvas = await html2canvas(calcHTMLContainer, {
                backgroundColor: '#0a0e17',
                scale: 2,
                useCORS: true,
                logging: false,
                width: calcHTMLContainer.scrollWidth,
                height: calcHTMLContainer.scrollHeight
            }).catch(() => null);
            
            // Eliminar del DOM
            document.body.removeChild(calcHTMLContainer);
            
            if (calcCanvas) {
                const calcImgData = calcCanvas.toDataURL('image/png');
                const calcAspectRatio = calcCanvas.width / calcCanvas.height;
                const maxWidth = pageWidth - 2 * margin;
                let calcWidth = maxWidth;
                let calcHeight = maxWidth / calcAspectRatio;
                
                // Si es muy alto, dividir en páginas
                const maxHeight = pageHeight - yPos - margin - 20;
                if (calcHeight > maxHeight) {
                    const pagesNeeded = Math.ceil(calcHeight / maxHeight);
                    const heightPerPage = maxHeight;
                    
                    for (let page = 0; page < pagesNeeded; page++) {
                        if (page > 0) {
                            checkNewPage(heightPerPage + 10);
                        }
                        
                        const sourceY = (page * calcCanvas.height) / pagesNeeded;
                        const displayHeight = Math.min(heightPerPage, pageHeight - yPos - margin - 10);
                        const displayWidth = displayHeight * calcAspectRatio;
                        
                        // Crear canvas para recortar
                        const clipCanvas = document.createElement('canvas');
                        clipCanvas.width = calcCanvas.width;
                        clipCanvas.height = Math.ceil(calcCanvas.height / pagesNeeded);
                        const clipCtx = clipCanvas.getContext('2d');
                        clipCtx.drawImage(calcCanvas, 0, -sourceY, calcCanvas.width, calcCanvas.height);
                        
                        const clippedDataURL = clipCanvas.toDataURL('image/png');
                        doc.addImage(clippedDataURL, 'PNG', margin, yPos, displayWidth, displayHeight);
                        yPos += displayHeight + 10;
                    }
                } else {
                    checkNewPage(calcHeight + 10);
                    doc.addImage(calcImgData, 'PNG', margin, yPos, calcWidth, calcHeight);
                    yPos += calcHeight + 10;
                }
            }
        }
        
        // Función auxiliar para añadir imagen 3D al PDF
        async function add3DImageToPDF(imageDataURL, title) {
            if (!imageDataURL) return;
            
            checkNewPage(100);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 182, 212);
            doc.text(title, margin, yPos);
            yPos += 8;
            
            // Obtener dimensiones de la imagen
            const img = new Image();
            img.src = imageDataURL;
            await new Promise(resolve => {
                if (img.complete) resolve();
                else img.onload = resolve;
            });
            
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = 100;
            const canvasAspectRatio = img.width / img.height;
            let canvasWidth = maxWidth;
            let canvasHeight = maxWidth / canvasAspectRatio;
            if (canvasHeight > maxHeight) {
                canvasHeight = maxHeight;
                canvasWidth = maxHeight * canvasAspectRatio;
            }
            
            checkNewPage(canvasHeight + 10);
            doc.addImage(imageDataURL, 'PNG', margin, yPos, canvasWidth, canvasHeight);
            yPos += canvasHeight + 10;
        }
        
        // Función para generar HTML de tooltip para PDF
        function generateTooltipHTML(neuronData, type) {
            let content = '';
            if (type === 'input') {
                const j = neuronData.index;
                let weightsHtml = '';
                for (let i = 0; i < numOutputNeurons; i++) {
                    const weightClass = W[i][j] >= 0 ? 'positive' : 'negative';
                    weightsHtml += `<div class="pdf-tooltip-row"><span>→ z₍${i+1}₎:</span><span class="pdf-weight ${weightClass}">w₍${i+1}₎₍${j+1}₎ = ${W[i][j]}</span></div>`;
                }
                content = `
                    <div class="pdf-tooltip-title">Neurona de Entrada x₍${j+1}₎</div>
                    <div class="pdf-tooltip-value">Valor: <span class="pdf-highlight">${x[j]}</span></div>
                    <div class="pdf-tooltip-subtitle">Conexiones (pesos):</div>
                    ${weightsHtml}
                `;
            } else {
                const i = neuronData.index;
                let calcHtml = '';
                let sum = 0;
                for (let j = 0; j < numInputNeurons; j++) {
                    const product = W[i][j] * x[j];
                    sum += product;
                    calcHtml += `<div class="pdf-tooltip-calc">${W[i][j]} × ${x[j]} = <span class="pdf-partial">${product.toFixed(4)}</span></div>`;
                }
                const z = sum + b[i];
                content = `
                    <div class="pdf-tooltip-title">Neurona de Salida z₍${i+1}₎</div>
                    <div class="pdf-tooltip-subtitle">Cálculo: Σ(wᵢⱼ × xⱼ) + bᵢ</div>
                    ${calcHtml}
                    <div class="pdf-tooltip-sum">Σ = <span class="pdf-partial">${sum.toFixed(4)}</span></div>
                    <div class="pdf-tooltip-bias">+ b₍${i+1}₎ = ${b[i]}</div>
                    <div class="pdf-tooltip-result">z₍${i+1}₎ = <span class="pdf-result">${z.toFixed(4)}</span></div>
                `;
            }
            return content;
        }
        
        // Función para crear visualización 3D con tooltip como HTML generado
        async function create3DVisualizationWithTooltip(neuron, neuronType, title) {
            // Configurar cámara frontal
            const originalPosition = camera.position.clone();
            const originalTarget = controls.target.clone();
            camera.position.set(0, 2, 12);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            
            // Activar hover
            highlightObject(neuron.mesh);
            
            // Renderizar escena con hover
            renderer.render(scene, camera);
            await new Promise(resolve => setTimeout(resolve, 100));
            renderer.render(scene, camera);
            
            // Capturar canvas 3D directamente con toDataURL
            const canvas3DImage = renderer.domElement.toDataURL('image/png');
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:2470',message:'Canvas 3D captured directly',data:{type:neuronType,hasImage:!!canvas3DImage,emissive:neuron.mesh.material.emissiveIntensity,scale:neuron.mesh.scale.x},timestamp:Date.now(),sessionId:'debug-session',runId:'run6',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            
            // Restaurar estado
            resetHover(neuron.mesh);
            camera.position.copy(originalPosition);
            controls.target.copy(originalTarget);
            controls.update();
            renderer.render(scene, camera);
            
            // Crear HTML combinado con imagen del canvas y tooltip generado
            const visualContainer = document.createElement('div');
            visualContainer.style.cssText = `
                position: relative;
                width: 600px;
                height: 400px;
                background: #0a0e17;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #2d3748;
            `;
            
            // CSS para el tooltip
            const tooltipStyle = document.createElement('style');
            tooltipStyle.textContent = `
                .pdf-canvas-img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .pdf-tooltip-box {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(26, 31, 46, 0.95);
                    border-radius: 8px;
                    padding: 12px;
                    border: 1px solid #2d3748;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 12px;
                    color: #e5e7eb;
                    max-width: 200px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .pdf-tooltip-title {
                    font-weight: 700;
                    color: #06b6d4;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                .pdf-tooltip-value {
                    margin-bottom: 6px;
                }
                .pdf-tooltip-subtitle {
                    color: #9ca3af;
                    font-size: 11px;
                    margin: 6px 0 4px 0;
                }
                .pdf-tooltip-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin: 2px 0;
                }
                .pdf-tooltip-calc {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    margin: 2px 0;
                }
                .pdf-tooltip-sum, .pdf-tooltip-bias {
                    margin: 4px 0;
                    padding-top: 4px;
                    border-top: 1px solid #2d3748;
                }
                .pdf-tooltip-result {
                    margin-top: 6px;
                    padding-top: 6px;
                    border-top: 1px solid #06b6d4;
                    font-weight: 700;
                }
                .pdf-highlight { color: #10b981; font-weight: 600; }
                .pdf-partial { color: #fbbf24; }
                .pdf-result { color: #22c55e; font-size: 14px; }
                .pdf-weight.positive { color: #10b981; }
                .pdf-weight.negative { color: #f43f5e; }
            `;
            visualContainer.appendChild(tooltipStyle);
            
            // Imagen del canvas
            const canvasImg = document.createElement('img');
            canvasImg.src = canvas3DImage;
            canvasImg.className = 'pdf-canvas-img';
            visualContainer.appendChild(canvasImg);
            
            // Tooltip generado
            const tooltipBox = document.createElement('div');
            tooltipBox.className = 'pdf-tooltip-box';
            tooltipBox.innerHTML = generateTooltipHTML(neuron.mesh.userData, neuronType);
            visualContainer.appendChild(tooltipBox);
            
            // Añadir al DOM temporalmente
            visualContainer.style.position = 'absolute';
            visualContainer.style.left = '-9999px';
            document.body.appendChild(visualContainer);
            
            // Esperar a que la imagen cargue
            await new Promise(resolve => {
                if (canvasImg.complete) resolve();
                else canvasImg.onload = resolve;
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:2550',message:'HTML container ready for capture',data:{type:neuronType,containerWidth:visualContainer.offsetWidth,containerHeight:visualContainer.offsetHeight,imgLoaded:canvasImg.complete},timestamp:Date.now(),sessionId:'debug-session',runId:'run6',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            
            // Capturar el HTML combinado
            const combinedCanvas = await html2canvas(visualContainer, {
                backgroundColor: '#0a0e17',
                scale: 2,
                useCORS: true,
                logging: false,
                width: 600,
                height: 400
            }).catch(() => null);
            
            // Limpiar
            document.body.removeChild(visualContainer);
            
            if (combinedCanvas) {
                const combinedImg = combinedCanvas.toDataURL('image/png');
                
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/7bff5a5c-db55-418e-b5b8-96a42ccf2641',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:2570',message:'Combined image captured',data:{type:neuronType,width:combinedCanvas.width,height:combinedCanvas.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run6',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                
                await add3DImageToPDF(combinedImg, title);
            }
        }
        
        // Capturar canvas 3D estado normal
        const canvas3DImg = captureCanvas3D();
        await add3DImageToPDF(canvas3DImg, 'Visualización 3D - Estado Final');
        
        // Capturar canvas 3D con hover en neurona de entrada
        if (inputNeurons.length > 0 && inputNeurons[0]?.mesh) {
            await create3DVisualizationWithTooltip(inputNeurons[0], 'input', 'Visualización 3D - Hover Neurona Entrada');
        }
        
        // Capturar canvas 3D con hover en neurona de salida
        if (outputNeurons.length > 0 && outputNeurons[0]?.mesh) {
            await create3DVisualizationWithTooltip(outputNeurons[0], 'output', 'Visualización 3D - Hover Neurona Salida');
        }
        
        // Guardar PDF
        const fileName = `visualizacion-neuronal-${now.getTime()}.pdf`;
        doc.save(fileName);
        
        showAnimationStatus('PDF generado exitosamente');
        setTimeout(() => hideAnimationStatus(), 2000);
        
    } catch (error) {
        console.error('Error al generar PDF con CSS:', error);
        alert('Error al generar el PDF: ' + error.message);
        hideAnimationStatus();
    }
}


// ============================================
// INICIAR
// ============================================

init();
