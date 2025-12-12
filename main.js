/**
 * VISUALIZACIÓN NEURONAL z = Wx + b
 * Representación interactiva con Three.js - VERSIÓN MEJORADA
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

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
    updateMathDisplay();
    updateValuesFromInputs();
    animate();
    
    window.addEventListener('resize', onWindowResize);
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
        alpha: true 
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
    const spacing = 3;
    
    const neuronGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const glowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    
    // Neuronas de entrada
    for (let i = 0; i < 3; i++) {
        const y = (1 - i) * spacing;
        
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
    for (let i = 0; i < 3; i++) {
        const y = (1 - i) * spacing;
        
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
    inputLayerLabel.position.set(inputX, 5, 0);
    scene.add(inputLayerLabel);
    labels.push(inputLayerLabel);
    
    const outputLayerLabel = createTextSprite('Capa de Salida (z)', 0xffffff, 0.4);
    outputLayerLabel.position.set(outputX, 5, 0);
    scene.add(outputLayerLabel);
    labels.push(outputLayerLabel);
}

function createConnections() {
    // Profundidades Z diferentes para cada neurona de entrada
    // Esto crea separación visual entre las conexiones
    const depthByInputNeuron = [1, 2.5, 4];
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const weight = W[i][j];
            const startPos = inputNeurons[j].mesh.position;
            const endPos = outputNeurons[i].mesh.position;
            
            const color = weight >= 0 ? COLORS.positiveWeight : COLORS.negativeWeight;
            
            // Usar profundidad Z diferente según la neurona de entrada (j)
            const zDepth = depthByInputNeuron[j];
            
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
        // Si hay una neurona siendo hovereada, no hacer nada más con las conexiones
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
            // Resaltar solo la conexión bajo el cursor
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
        // Restaurar todas las conexiones a su estado normal
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
    
    // Resaltar conexiones relacionadas con esta neurona
    if (data.type === 'input') {
        // Resaltar todas las conexiones que salen de esta neurona de entrada
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
        // Resaltar todas las conexiones que llegan a esta neurona de salida
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
    
    // Restaurar todas las conexiones
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
        // Mostrar los pesos que salen de esta neurona de entrada hacia cada neurona de salida
        html = `
            <h4>Neurona de Entrada x₍${j + 1}₎</h4>
            <p>Valor actual: <span class="value">${x[j]}</span></p>
            <div class="tooltip-divider"></div>
            <p class="tooltip-subtitle">Pesos de salida:</p>
            <table class="weights-table">
                <tr><td>→ z₍1₎:</td><td class="weight-value ${W[0][j] >= 0 ? 'positive' : 'negative'}">w₁${j+1} = ${W[0][j]}</td></tr>
                <tr><td>→ z₍2₎:</td><td class="weight-value ${W[1][j] >= 0 ? 'positive' : 'negative'}">w₂${j+1} = ${W[1][j]}</td></tr>
                <tr><td>→ z₍3₎:</td><td class="weight-value ${W[2][j] >= 0 ? 'positive' : 'negative'}">w₃${j+1} = ${W[2][j]}</td></tr>
            </table>
        `;
    } else if (data.type === 'output') {
        const i = data.index;
        const zVal = calculateZ();
        const wxVal = calculateWx();
        // Mostrar los pesos que llegan a esta neurona de salida desde cada neurona de entrada
        html = `
            <h4>Neurona de Salida z₍${i + 1}₎</h4>
            <p>Pre-activación: <span class="value">${zVal[i].toFixed(2)}</span></p>
            <div class="tooltip-divider"></div>
            <p class="tooltip-subtitle">Pesos de entrada:</p>
            <table class="weights-table">
                <tr><td>x₍1₎ →</td><td class="weight-value ${W[i][0] >= 0 ? 'positive' : 'negative'}">w${i+1}₁ = ${W[i][0]}</td><td class="calc">× ${x[0]} = ${(W[i][0] * x[0]).toFixed(2)}</td></tr>
                <tr><td>x₍2₎ →</td><td class="weight-value ${W[i][1] >= 0 ? 'positive' : 'negative'}">w${i+1}₂ = ${W[i][1]}</td><td class="calc">× ${x[1]} = ${(W[i][1] * x[1]).toFixed(2)}</td></tr>
                <tr><td>x₍3₎ →</td><td class="weight-value ${W[i][2] >= 0 ? 'positive' : 'negative'}">w${i+1}₃ = ${W[i][2]}</td><td class="calc">× ${x[2]} = ${(W[i][2] * x[2]).toFixed(2)}</td></tr>
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
    
    // Restaurar conexiones cuando se oculta el tooltip
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
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
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
}

function createVectorInputs() {
    // Vector X
    const xContainer = document.getElementById('vector-x');
    xContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
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
    
    // Vector B
    const bContainer = document.getElementById('vector-b');
    bContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = b[i];
        input.dataset.index = i;
        input.addEventListener('input', onVectorBChange);
        bContainer.appendChild(input);
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
    
    // Resaltar en display matemático
    const wDisplay = document.querySelectorAll('#w-values-display span');
    wDisplay.forEach((span, i) => {
        if (Math.floor(i / 3) === row) {
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
}

// ============================================
// VISUALIZACIÓN MATEMÁTICA
// ============================================

function updateMathDisplay() {
    // Actualizar matriz W
    const wDisplay = document.getElementById('w-values-display');
    wDisplay.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
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
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.textContent = x[i];
        xDisplay.appendChild(span);
    }
    
    // Actualizar vector b
    const bDisplay = document.getElementById('b-values-display');
    bDisplay.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.textContent = b[i];
        bDisplay.appendChild(span);
    }
}

// ============================================
// CÁLCULOS MATEMÁTICOS
// ============================================

function calculateWx() {
    const result = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
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
    
    await delay(500);
    await animateStep1();
    await delay(800);
    await animateStep2();
    
    showAnimationStatus('¡Cálculo completado!');
    await delay(1500);
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
    
    // Calcular Wx primero si no está hecho
    const wxValues = document.querySelectorAll('#wx-values span');
    if (wxValues[0].textContent === '—') {
        const wx = calculateWx();
        wxValues.forEach((span, i) => {
            span.textContent = wx[i].toFixed(2);
        });
    }
    
    await animateStep2();
    disableButtons(false);
}

async function animateStep1() {
    isAnimating = true;
    showAnimationStatus('Paso 1: Multiplicación W × x');
    
    const wx = [0, 0, 0];
    const wxValues = document.querySelectorAll('#wx-values span');
    
    // Añadir título del paso
    addCalculationStep({
        type: 'title',
        title: 'PASO 1: Multiplicación Matriz-Vector (W × x)',
        content: 'Cada elemento de z se calcula multiplicando la fila correspondiente de W por el vector x'
    });
    
    await delay(400);
    
    // Para cada neurona de salida
    for (let i = 0; i < 3; i++) {
        wxValues[i].textContent = '...';
        wxValues[i].classList.add('calculating');
        
        // Mostrar fórmula en overlay 3D
        showCurrentCalculation(`Calculando z₍${i+1}₎`, `Fila ${i+1} de W × vector x`);
        
        // Calcular productos parciales
        const products = [];
        let sum = 0;
        
        for (let j = 0; j < 3; j++) {
            // Resaltar conexión
            const conn = connections.find(c => c.outputIndex === i && c.inputIndex === j);
            if (conn) {
                conn.line.material.color.setHex(COLORS.highlight);
                conn.line.material.opacity = 1;
                conn.label.visible = true;
            }
            
            // Resaltar neurona de entrada
            inputNeurons[j].mesh.material.emissiveIntensity = 0.8;
            inputNeurons[j].glow.material.opacity = 0.4;
            
            // Resaltar en display matemático
            highlightMathElement('w', i, j);
            highlightMathElement('x', j);
            
            // Calcular producto
            const product = W[i][j] * x[j];
            products.push({
                w: W[i][j],
                x: x[j],
                result: product
            });
            sum += product;
            
            // Actualizar display 3D con producto parcial
            updateCurrentCalculation(
                `z₍${i+1}₎: Calculando término ${j+1}`,
                `(${W[i][j]}) × (${x[j]}) = ${product.toFixed(2)}`
            );
            
            await delay(450);
            
            // Restaurar
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
        
        // Añadir paso de cálculo detallado al panel
        addCalculationStep({
            type: 'calculation',
            number: i + 1,
            title: `Cálculo de (Wx)₍${i+1}₎`,
            products: products,
            result: sum
        });
        
        wxValues[i].textContent = sum.toFixed(2);
        wxValues[i].classList.remove('calculating');
        
        // Actualizar neurona de salida
        outputNeurons[i].mesh.material.emissiveIntensity = 0.6;
        updateSpriteText(outputNeurons[i].label, `z₍${i+1}₎ = ${sum.toFixed(1)}`, COLORS.outputNeuron);
        
        await delay(300);
        outputNeurons[i].mesh.material.emissiveIntensity = 0.3;
    }
    
    // Mostrar resultado de Wx
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
    
    // Añadir título del paso
    addCalculationStep({
        type: 'title',
        title: 'PASO 2: Suma Vectorial (Wx + b)',
        content: 'Se suma el sesgo b elemento por elemento al resultado de Wx'
    });
    
    await delay(400);
    
    for (let i = 0; i < 3; i++) {
        zValues[i].textContent = '...';
        zValues[i].classList.add('calculating');
        
        showCurrentCalculation(`Sumando sesgo b₍${i+1}₎`, `${wx[i].toFixed(2)} + (${b[i]})`);
        
        // Efecto visual en neurona
        outputNeurons[i].mesh.material.emissive.setHex(COLORS.bias);
        outputNeurons[i].mesh.material.emissiveIntensity = 0.8;
        outputNeurons[i].glow.material.opacity = 0.4;
        
        await delay(500);
        
        const result = wx[i] + b[i];
        z.push(result);
        
        // Añadir paso al panel
        addCalculationStep({
            type: 'bias',
            number: i + 1,
            wx: wx[i],
            b: b[i],
            result: result
        });
        
        zValues[i].textContent = result.toFixed(2);
        zValues[i].classList.remove('calculating');
        
        updateSpriteText(outputNeurons[i].label, `z₍${i+1}₎ = ${result.toFixed(2)}`, COLORS.outputNeuron);
        
        outputNeurons[i].mesh.material.emissive.setHex(COLORS.outputNeuron);
        outputNeurons[i].mesh.material.emissiveIntensity = 0.3;
        outputNeurons[i].glow.material.opacity = 0.15;
        
        updateCurrentCalculation(
            `z₍${i+1}₎ calculado`,
            `= ${result.toFixed(2)}`
        );
        
        await delay(300);
    }
    
    // Resultado final
    addCalculationStep({
        type: 'final',
        title: 'Vector z = Wx + b (Resultado Final)',
        values: z
    });
    
    // Efecto final en todas las neuronas de salida
    outputNeurons.forEach(n => {
        n.glow.material.opacity = 0.35;
    });
    
    await delay(600);
    
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
        const index = row * 3 + col;
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
    W = JSON.parse(JSON.stringify(defaultW));
    x = [...defaultX];
    b = [...defaultB];
    
    createMatrixInputs();
    createVectorInputs();
    updateMathDisplay();
    createScene();
    
    document.querySelectorAll('#wx-values span').forEach(s => s.textContent = '—');
    document.querySelectorAll('#z-values span').forEach(s => s.textContent = '—');
    
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
// INICIAR
// ============================================

init();
