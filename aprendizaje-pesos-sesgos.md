# ¿Cómo se Actualizan los Pesos y Sesgos?

## 🎯 El Problema: La Red "Aprende" Ajustando sus Parámetros

Cuando entrenas una red neuronal, los **pesos (W)** y **sesgos (b)** empiezan con valores aleatorios o pequeños. La red hace predicciones, compara con la respuesta correcta, y **ajusta automáticamente** estos valores para mejorar.

---

## 🏠 Analogía: Aprender a Cocinar

Imagina que estás aprendiendo a hacer una receta perfecta:

### Estado Inicial (Valores Aleatorios)
```
Receta inicial (aleatoria):
- Sal: 2 cucharadas (demasiado)
- Azúcar: 0.5 cucharadas (muy poco)
- Tiempo de cocción: 10 minutos (insuficiente)
```

### Proceso de Aprendizaje
1. **Cocinas** con estos valores → El resultado no está bueno
2. **Pruebas** el resultado → "Está muy salado y poco dulce"
3. **Ajustas** los valores:
   - Reduces la sal (porque estaba muy salado)
   - Aumentas el azúcar (porque estaba poco dulce)
   - Aumentas el tiempo (porque estaba crudo)
4. **Repites** hasta que el resultado sea perfecto

### En Redes Neuronales
- **Pesos y sesgos** = Los ingredientes y tiempos de la receta
- **Predicción** = El plato que cocinas
- **Respuesta correcta** = El plato perfecto que quieres lograr
- **Error** = Qué tan diferente está tu plato del perfecto
- **Ajuste** = Cambiar los ingredientes/tiempos para mejorar

---

## 📊 El Proceso de Entrenamiento (Paso a Paso)

### 1. Inicialización (Valores Aleatorios)

```javascript
// Al inicio, los pesos y sesgos son aleatorios
W = [
    [0.1, 0.5, -0.2],   // Valores pequeños aleatorios
    [0.3, -0.4, 0.6]
]

b = [0.5, -0.1]  // Valores pequeños aleatorios
```

**Analogía:** Como empezar a cocinar con una receta que inventaste al azar.

---

### 2. Forward Pass (Hacer una Predicción)

```javascript
// La red hace una predicción
z = Wx + b
prediccion = activation(z)
```

**Ejemplo:**
```
Entrada: x = [5, 3, 2]
Pesos actuales: W = [[0.1, 0.5, -0.2], [0.3, -0.4, 0.6]]
Sesgos actuales: b = [0.5, -0.1]

Cálculo:
z₁ = (0.1×5) + (0.5×3) + (-0.2×2) + 0.5 = 2.1
z₂ = (0.3×5) + (-0.4×3) + (0.6×2) + (-0.1) = 1.4

Predicción: [2.1, 1.4]
```

**Analogía:** Cocinas el plato con los ingredientes actuales.

---

### 3. Calcular el Error (Comparar con la Respuesta Correcta)

```javascript
// Respuesta correcta (lo que debería dar)
respuesta_correcta = [3.0, 2.0]

// Error = diferencia entre predicción y respuesta correcta
error = respuesta_correcta - prediccion
error = [3.0, 2.0] - [2.1, 1.4] = [0.9, 0.6]
```

**Analogía:** Comparas tu plato con el plato perfecto. "Mi plato tiene 0.9 unidades menos de sabor en el primer componente y 0.6 unidades menos en el segundo."

---

### 4. Backpropagation (Propagar el Error Hacia Atrás)

El algoritmo calcula **cuánto contribuye cada peso y sesgo al error**. Usa **derivadas** (cálculo diferencial) para saber:

- "Si aumento este peso un poco, ¿el error aumenta o disminuye?"
- "¿En qué dirección debo ajustar este sesgo?"

**Fórmula básica (simplificada):**
```
gradiente_peso = error × entrada
gradiente_sesgo = error
```

**Ejemplo:**
```
Para el peso w₁₁ (primera neurona, primera entrada):
gradiente = error₁ × x₁ = 0.9 × 5 = 4.5

Para el sesgo b₁:
gradiente = error₁ = 0.9
```

**Analogía:** Analizas qué ingrediente causó más el problema. "El primer ingrediente contribuyó 4.5 unidades al error."

---

### 5. Actualizar los Pesos y Sesgos

```javascript
// Tasa de aprendizaje (qué tan grandes son los ajustes)
learning_rate = 0.01  // Pequeño para ajustes suaves

// Actualizar pesos
W_nuevo = W_anterior - learning_rate × gradiente_peso

// Actualizar sesgos
b_nuevo = b_anterior - learning_rate × gradiente_sesgo
```

**Ejemplo práctico:**
```
Peso anterior: w₁₁ = 0.1
Gradiente: 4.5
Learning rate: 0.01

w₁₁_nuevo = 0.1 - 0.01 × 4.5 = 0.1 - 0.045 = 0.055

Sesgo anterior: b₁ = 0.5
Gradiente: 0.9

b₁_nuevo = 0.5 - 0.01 × 0.9 = 0.5 - 0.009 = 0.491
```

**Analogía:** Ajustas los ingredientes. "Reduzco la sal en 0.045 unidades porque estaba contribuyendo demasiado al error."

---

### 6. Repetir (Muchas Veces)

Este proceso se repite **miles o millones de veces** con diferentes ejemplos hasta que la red aprende.

```
Época 1:   Error = 0.9
Época 2:   Error = 0.7
Época 3:   Error = 0.5
...
Época 1000: Error = 0.001  ← ¡Casi perfecto!
```

---

## 🔍 Ejemplo Completo: Una Iteración

### Configuración Inicial
```javascript
// Entrada
x = [5, 3]

// Pesos (aleatorios al inicio)
W = [
    [0.6, -0.4],  // Pesos para neurona de salida 1
]

// Sesgo (aleatorio al inicio)
b = [0.5]

// Respuesta correcta (lo que queremos lograr)
y_correcto = 1  // Queremos que la neurona se active
```

### Paso 1: Forward Pass
```javascript
z = (0.6 × 5) + (-0.4 × 3) + 0.5
z = 3.0 + (-1.2) + 0.5
z = 2.3

prediccion = sigmoid(2.3) = 0.91  // Casi 1, está bien
```

### Paso 2: Calcular Error
```javascript
error = y_correcto - prediccion
error = 1 - 0.91 = 0.09  // Queremos que sea más cercano a 1
```

### Paso 3: Calcular Gradientes
```javascript
// Gradiente del peso w₁ (simplificado)
gradiente_w1 = error × x₁ × derivada_sigmoid(z)
gradiente_w1 = 0.09 × 5 × 0.21 ≈ 0.0945

// Gradiente del peso w₂
gradiente_w2 = error × x₂ × derivada_sigmoid(z)
gradiente_w2 = 0.09 × 3 × 0.21 ≈ 0.0567

// Gradiente del sesgo
gradiente_b = error × derivada_sigmoid(z)
gradiente_b = 0.09 × 0.21 ≈ 0.0189
```

### Paso 4: Actualizar
```javascript
learning_rate = 0.1

// Actualizar pesos
w1_nuevo = 0.6 - 0.1 × 0.0945 = 0.59055
w2_nuevo = -0.4 - 0.1 × 0.0567 = -0.40567

// Actualizar sesgo
b_nuevo = 0.5 - 0.1 × 0.0189 = 0.49811
```

### Paso 5: Verificar Mejora
```javascript
// Nueva predicción con valores actualizados
z_nuevo = (0.59055 × 5) + (-0.40567 × 3) + 0.49811
z_nuevo = 2.295 + 0.49811 = 2.79311

prediccion_nueva = sigmoid(2.79311) = 0.942  // ¡Mejor! (antes era 0.91)
```

---

## 🎓 Conceptos Clave

### 1. Learning Rate (Tasa de Aprendizaje)

**¿Qué es?**
- Controla qué tan grandes son los ajustes en cada paso

**Analogía:**
- **Learning rate alto (0.1)**: Ajustes grandes, como cambiar la sal de 2 a 1 cucharada de golpe
- **Learning rate bajo (0.001)**: Ajustes pequeños, como cambiar la sal de 2 a 1.99 cucharadas

**Problemas:**
- **Muy alto**: La red "salta" demasiado y no converge (como ajustar demasiado la receta)
- **Muy bajo**: La red aprende muy lento (como ajustar la receta muy poco a poco)

### 2. Gradiente (Derivada)

**¿Qué es?**
- Indica la **dirección** y **magnitud** del cambio necesario
- Es como una "brújula" que dice "ajusta este peso hacia arriba o hacia abajo"

**Analogía:**
- Si el gradiente es **positivo**: El peso es demasiado alto, hay que reducirlo
- Si el gradiente es **negativo**: El peso es demasiado bajo, hay que aumentarlo

### 3. Backpropagation (Propagación Hacia Atrás)

**¿Qué es?**
- Algoritmo que calcula los gradientes de todas las capas, empezando desde la salida hacia las entradas

**Analogía:**
- Como rastrear un error en una cadena de producción:
  1. Detectas el error en el producto final
  2. Rastreas hacia atrás: "¿Qué máquina causó esto?"
  3. Ajustas esa máquina
  4. Repites para todas las máquinas anteriores

---

## 📈 Visualización del Proceso

```
Iteración 1:
W = [0.6, -0.4], b = 0.5
Error = 0.09
↓ (ajuste)
Iteración 2:
W = [0.59, -0.41], b = 0.498
Error = 0.08
↓ (ajuste)
Iteración 3:
W = [0.58, -0.42], b = 0.496
Error = 0.07
↓ (ajuste)
...
Iteración 100:
W = [0.45, -0.35], b = 0.4
Error = 0.001  ← ¡Casi perfecto!
```

---

## 🔧 Fórmulas Matemáticas (Simplificadas)

### Para una Neurona Simple

```
1. Forward:
   z = w₁x₁ + w₂x₂ + b
   a = activation(z)

2. Error:
   error = y_correcto - a

3. Gradientes:
   ∂error/∂w₁ = error × x₁ × activation'(z)
   ∂error/∂w₂ = error × x₂ × activation'(z)
   ∂error/∂b = error × activation'(z)

4. Actualización:
   w₁ = w₁ - learning_rate × ∂error/∂w₁
   w₂ = w₂ - learning_rate × ∂error/∂w₂
   b = b - learning_rate × ∂error/∂b
```

Donde `activation'(z)` es la derivada de la función de activación.

---

## 🎯 Resumen con Analogía Final

**Aprender a cocinar:**
1. Empiezas con una receta aleatoria
2. Cocinas el plato
3. Lo pruebas y comparas con el plato perfecto
4. Identificas qué ingredientes están mal (gradientes)
5. Ajustas los ingredientes un poco (learning rate)
6. Repites hasta que el plato sea perfecto

**Red neuronal:**
1. Empieza con pesos y sesgos aleatorios
2. Hace una predicción (forward pass)
3. Calcula el error comparando con la respuesta correcta
4. Calcula gradientes (backpropagation)
5. Actualiza pesos y sesgos (gradient descent)
6. Repite hasta que el error sea mínimo

---

## 💡 Puntos Clave

1. **Los pesos y sesgos NO se eligen manualmente** - Se aprenden automáticamente
2. **El proceso es iterativo** - Se repite miles de veces
3. **Se usa cálculo diferencial** - Para saber en qué dirección ajustar
4. **El learning rate es crucial** - Controla la velocidad y estabilidad del aprendizaje
5. **Backpropagation es eficiente** - Calcula todos los gradientes de una vez

---

## 🔗 Relación con tu Visualización

En tu visualización actual (`main.js`), los pesos y sesgos son **estáticos** (los defines manualmente). En una red neuronal real:

- Los valores iniciales serían **aleatorios**
- Después de cada predicción, se **actualizarían automáticamente**
- El proceso se repetiría hasta que la red "aprenda" a hacer buenas predicciones

¿Te gustaría que agregue una simulación de entrenamiento a tu visualización para ver cómo se actualizan los pesos y sesgos en tiempo real?

