# Repaso de encapsulación y manejo de errores en Go

Recurso didáctico interactivo para la asignatura **Programación Orientada a Objetos (IFT 365)** de la Universidad
Internacional del Ecuador. Consolida los contenidos de las semanas 9 y 10 del sílabo mediante un juego de
combinación de piezas, *Gopher Dulce*, que integra teoría y práctica y está diseñado para resolverse en
aproximadamente 15 minutos.

**Acceso:** https://mariadsalazar.github.io/repaso-encapsulacion-errores-go/

## Objetivos de aprendizaje

Al completar la actividad, el estudiante habrá reforzado su capacidad para:

1. Explicar cómo Go controla la visibilidad de campos y métodos según la primera letra del identificador.
2. Aplicar métodos *getter* y *setter* que validan los datos antes de modificarlos.
3. Reutilizar tipos mediante el embebido (*embedding*) y reconocer los campos y métodos promovidos.
4. Manejar errores como valores, con `errors.New`, `fmt.Errorf` y la verificación `if err != nil`.
5. Utilizar `defer` para garantizar la ejecución de tareas al finalizar una función.
6. Distinguir el uso de `panic` y su recuperación con `recover`.

## Contenidos

| Nivel | Semana | Unidad temática | Temas | Preguntas |
|---|---|---|---|---|
| 1 | 9 | Encapsulación | Encapsulación, *getters* y *setters*, embebido | 3 de teoría y 3 de práctica |
| 2 | 10 | Manejo de errores | Error como valor, `defer`, `panic` y `recover` | 3 de teoría y 3 de práctica |

Cada reto de práctica se verificó con Go 1.27 ejecutando el programa con cada una de sus opciones: solo la
opción correcta compila y produce la salida indicada como meta.

## Dinámica de la actividad

- El tablero contiene piezas de cinco tipos. El estudiante intercambia dos piezas vecinas para alinear tres o más
  iguales en una fila o columna.
- Una de las piezas está marcada con el signo **?**. Al incluirla en una combinación se presenta la siguiente
  actividad del tema.
- Cada tema se desarrolla en tres momentos: una **mini lección** con el concepto, su aplicación real y un
  fragmento de código; una **pregunta de teoría** de opción múltiple; y un **reto de práctica**, en el que el
  estudiante completa un programa y lo ejecuta con Go en una consola integrada.
- Una respuesta correcta muestra la explicación del concepto y otorga una bonificación. Una respuesta incorrecta
  muestra una pista y, en los retos de práctica, la respuesta real de Go con el código elegido; la actividad
  vuelve a presentarse más adelante.
- El botón **Pista** señala una jugada disponible.
- Al finalizar los dos niveles se generan un informe de desempeño por tema y un certificado de finalización con el
  nombre del estudiante.

## Evidencia para el docente

El estudiante entrega en Canvas el certificado en formato PNG. El certificado registra el número de preguntas
acertadas al primer intento (separadas en teoría y práctica), el porcentaje de logro, el desempeño por tema, la
fecha y un código de verificación.

## Privacidad y seguridad

- La aplicación solo solicita nombre y apellido. El progreso se almacena en el navegador del propio dispositivo
  (`localStorage`) y no se envía a ningún servidor.
- Al ejecutar un reto de práctica, únicamente el código del programa se envía al servicio público Go Playground
  (go.dev) para compilarlo y ejecutarlo. Sin conexión, la consola muestra la salida registrada al preparar el juego.
- Las respuestas correctas no se publican en el código: se conserva únicamente su huella SHA-256, y las
  explicaciones se almacenan cifradas con AES-GCM mediante la API Web Crypto del navegador.
- La página aplica una política de seguridad de contenido (CSP) restrictiva y no envía información de referencia
  (`referrer`) a sitios externos.

## Requisitos técnicos

Navegador web actualizado (Chrome, Edge, Firefox o Safari), en computador o dispositivo móvil, con JavaScript
habilitado y conexión a internet para la consola de Go. No requiere instalación ni registro.

## Ejecución local

Se trata de un sitio estático sin dependencias. Desde la carpeta del repositorio:

```
python -m http.server 8000
```

Luego se abre `http://localhost:8000` en el navegador.

## Estructura del repositorio

| Archivo | Contenido |
|---|---|
| `index.html` | Página principal |
| `app.js` | Lógica del juego, mini lecciones, preguntas, retos de práctica, consola, informe y certificado |
| `datos.js` | Lecciones, preguntas y retos con respuestas protegidas |
| `cifra.js` | Verificación de respuestas y descifrado de explicaciones |
| `arte.js` | Ilustraciones vectoriales |
| `estilos.css`, `dulce.css` | Estilos de la interfaz y del tablero |

## Referencias

- Arizona State University. (2026). *IFT 365: Object-Oriented Programming and Design*. Unit 10: Encapsulation and
  embedding; Unit 12: Recovering from errors.
- Donovan, A. A. A. y Kernighan, B. W. (2015). *The Go programming language*. Addison-Wesley.
- McGavren, J. (2019). *Head First Go*. O'Reilly Media.
- The Go Authors. (2026). *Effective Go*. https://go.dev/doc/effective_go
