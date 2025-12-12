---
name: Visualización educativa neuronas Three.js
overview: Crear una página web interactiva con Three.js que visualice educativamente la operación z=Wx+b, mostrando neuronas como esferas conectadas, con animaciones paso a paso y valores numéricos visibles, permitiendo modificar valores en tiempo real.
todos: []
---

# Visualización Educativa de Operación Neuronal z=Wx+b con Three.js

## Objetivo

Crear una visualización interactiva 3D que muestre educativamente cómo funciona la operación z=Wx+b en una capa neuronal densa, con animaciones paso a paso y capacidad de modificar valores en tiempo real.

## Estructura del Proyecto

### Archivos a crear:

1. **index.html** - Página principal con estructura HTML y contenedor para Three.js
2. **styles.css** - Estilos para la interfaz y controles
3. **main.js** - Lógica principal de Three.js y visualización
4. **README.md** - Documentación del proyecto

## Componentes de la Visualización

### 1. Escena 3D (Three.js)

- **Cámara**: PerspectiveCamera con vista isométrica para mejor visualización
- **Iluminación**: Luz ambiental + luz direccional para resaltar las neuronas
- **Renderizador**: WebGLRenderer con antialiasing

### 2. Representación Visual

- **Neuronas de entrada (capa anterior)**: 3 esferas verdes representando el vector x
- **Neuronas de salida (capa actual)**: 3 esferas azules representando el vector z
- **Conexiones**: Líneas entre neuronas con grosor proporcional al peso W[i][j]
- **Valores numéricos**: Etiquetas 3D flotantes mostrando valores actuales
- **Colores dinámicos**: Las conexiones cambian de color según el signo del peso (rojo negativo, verde positivo)

### 3. Animación Paso a Paso

- **Paso 1 - Multiplicación Wx**: 
- Resaltar cada conexión mientras se calcula
- Mostrar el producto parcial en la etiqueta
- Acumular visualmente el resultado en la neurona de salida
- **Paso 2 - Suma del sesgo b**:
- Mostrar el vector b como flechas/esferas pequeñas
- Animar la suma elemento por elemento
- Actualizar el valor final z

### 4. Interfaz de Usuario

- **Panel de control lateral**:
- Valores editables de W (matriz 3x3)
- Valores editables de x (vector 3x1)
- Valores editables de b (vector 3x1)
- Botones: "Calcular", "Animar Paso 1", "Animar Paso 2", "Reiniciar"
- **Panel de resultados**:
- Mostrar Wx (resultado intermedio)
- Mostrar z (resultado final)
- Mostrar cálculos paso a paso en formato matemático

### 5. Características Interactivas

- **Modificación en tiempo real**: Al cambiar valores en los inputs, la visualización se actualiza
- **Hover sobre conexiones**: Mostrar peso específico y cálculo
- **Hover sobre neuronas**: Mostrar valor actual y contribuciones
- **Controles de cámara**: Rotación, zoom, pan para explorar la escena

## Valores Iniciales (del ejercicio)

- W = [[0.1, 0.5, -0.2], [0.3, -0.4, 0.6], [-0.7, 0, 0.8]]
- x = [10, 5, 2]
- b = [0.5, -0.1, 0.2]

## Implementación Técnica

### Three.js Components:

- `THREE.Scene()` - Escena principal
- `THREE.SphereGeometry()` - Neuronas
- `THREE.Line()` o `THREE.TubeGeometry()` - Conexiones
- `THREE.TextGeometry()` o `THREE.Sprite` con canvas - Etiquetas de texto
- `THREE.OrbitControls` - Controles de cámara interactivos
- `THREE.AnimationMixer` o `gsap` - Animaciones suaves

### Funciones Principales:

- `createNeurons()` - Crear esferas para neuronas
- `createConnections()` - Crear líneas entre neuronas con colores según peso
- `createLabels()` - Crear etiquetas 3D con valores
- `animateStep1()` - Animar multiplicación Wx
- `animateStep2()` - Animar suma b
- `updateVisualization()` - Actualizar visualización cuando cambian valores
- `calculateResult()` - Calcular z=Wx+b matemáticamente

### Animaciones:

- Usar `THREE.AnimationClip` o librería como GSAP para animaciones suaves
- Transiciones de color en conexiones durante cálculos
- Efectos de "pulso" en neuronas cuando reciben valores
- Flechas o partículas mostrando el flujo de datos

## Estilo Visual

- **Fondo**: Oscuro (negro/gris oscuro) para mejor contraste
- **Neuronas entrada**: Verde (#4CAF50)
- **Neuronas salida**: Azul (#2196F3)
- **Conexiones positivas**: Verde claro
- **Conexiones negativas**: Rojo (#F44336)
- **Texto**: Blanco con sombra para legibilidad
- **UI**: Panel lateral con fondo semi-transparente

## Dependencias

- Three.js (CDN o npm)
- OrbitControls (incluido en Three.js examples)
- Opcional: GSAP para animaciones más avanzadas
- Opcional: dat.GUI para controles más elegantes

## Flujo de Usuario

1. Usuario ve la visualización inicial con valores del ejercicio
2. Puede hacer clic en "Animar" para ver el proceso paso a paso
3. Puede modificar valores en los inputs y ver cambios en tiempo real
4. Puede rotar/zoomear la escena para explorar desde diferentes ángulos
5. Puede hacer hover sobre elementos para ver detalles