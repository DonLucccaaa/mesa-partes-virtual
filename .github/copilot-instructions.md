# Instrucciones del proyecto

Este repositorio corresponde al proyecto académico Mesa de Partes Virtual.

Antes de realizar cualquier trabajo debes leer obligatoriamente:

@../.cursor/rules/mesa-partes.mdc
@../doc/change-log.md

Las reglas contenidas en `.cursor/rules/mesa-partes.mdc` son también las reglas generales de trabajo para GitHub Copilot CLI.

`doc/change-log.md` contiene el historial real de modificaciones realizadas anteriormente por Cursor u otros agentes.

Antes de modificar código:

1. Lee las reglas del proyecto.
2. Revisa `doc/change-log.md`.
3. Revisa `git status`.
4. Revisa `git diff` si existen cambios sin commit.
5. Inspecciona los archivos relacionados con la tarea.
6. Determina qué parte ya fue implementada.
7. Continúa desde el estado actual. No reinicies ni reconstruyas funcionalidades que ya existen.
8. Mantén la arquitectura sencilla definida en las reglas.

Después de cada modificación:

1. Prueba la funcionalidad.
2. Actualiza `doc/change-log.md`.
3. Explica qué se modificó.
4. No continúes automáticamente con otra historia de usuario.x