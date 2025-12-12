# Visualización Neuronal z = Wx + b

Una visualización interactiva 3D con Three.js que explica de manera educativa la operación fundamental de una capa neuronal densa: la transformación afín **z = Wx + b**.

## Descripción

Esta aplicación web demuestra visualmente cómo funciona el "forward pass" en una red neuronal, mostrando:

- **Neuronas de entrada (x)**: Representadas como esferas verdes
- **Neuronas de salida (z)**: Representadas como esferas azules/cyan
- **Conexiones (W)**: Líneas que conectan las neuronas, con colores indicando pesos positivos (verde) o negativos (rojo)
- **Cálculo paso a paso**: Animación de la multiplicación matriz-vector y suma del sesgo

## Conceptos Matemáticos

### Transformación Afín: z = Wx + b

1. **Matriz de pesos W (3×3)**: Contiene los pesos sinápticos que determinan la fuerza de conexión entre neuronas
2. **Vector de entrada x (3×1)**: Activaciones de la capa anterior
3. **Vector de sesgo b (3×1)**: Permite desplazar la función de activación
4. **Vector resultante z (3×1)**: Pre-activación que se envía a la siguiente capa

### Valores por Defecto (del ejercicio)

```
W = | 0.1   0.5  -0.2 |    x = | 10 |    b = |  0.5 |
    | 0.3  -0.4   0.6 |        |  5 |        | -0.1 |
    |-0.7   0.0   0.8 |        |  2 |        |  0.2 |

Resultado: z = | 3.6  |
              | 2.1  |
              |-5.2  |
```

## Características

- **Visualización 3D interactiva** con Three.js
- **Animación paso a paso** del cálculo matemático
- **Valores editables en tiempo real** para experimentar
- **Controles de cámara** (rotar, zoom, pan)
- **Tooltips informativos** al hacer hover sobre elementos
- **Resaltado de conexiones** al editar valores
- **Diseño responsive** y moderno

## Cómo Usar

1. Abre `index.html` en un navegador moderno (Chrome, Firefox, Edge)
2. Modifica los valores de W, x o b en el panel lateral
3. Haz clic en "Animar Cálculo" para ver el proceso completo
4. Usa los botones "Paso 1" y "Paso 2" para ver cada parte individualmente
5. Rota y acerca la vista 3D con el mouse

## Requisitos

- Navegador moderno con soporte para ES6 Modules
- WebGL habilitado
- Conexión a internet (para cargar Three.js desde CDN)

## Tecnologías

- **Three.js** - Renderizado 3D
- **CSS3** - Estilos y animaciones
- **JavaScript ES6** - Lógica de la aplicación
- **Import Maps** - Gestión de módulos

## Estructura del Proyecto

```
├── index.html      # Estructura HTML principal
├── styles.css      # Estilos y animaciones
├── main.js         # Lógica de Three.js y visualización
└── README.md       # Documentación
```

## Créditos

Visualización educativa para entender las operaciones de álgebra lineal en redes neuronales.

