# Directiva: Configuración de Tests y Script npm test

## Objetivo
Configurar la infraestructura de pruebas unitarias y de integración en el backend (servidor) del proyecto e implementar el comando `npm test` en el package.json de la raíz para que ejecute de forma exitosa y determinista las pruebas.

## Entradas
- Archivo `package.json` de la raíz.
- Archivo `server/package.json`.
- Servidor Express en `server/src/index.ts` o su módulo de app si está separado.

## Salidas
- Script de prueba `"test"` configurado en `package.json` en la raíz que ejecute `npm run test --prefix server`.
- Framework de pruebas `vitest` y biblioteca `supertest` instalados en `server/`.
- Script `"test": "vitest run"` en `server/package.json`.
- Un test de sanidad básico en `server/src/__tests__/sanity.test.ts` que compruebe que el framework de testing funciona correctamente.

## Lógica y Pasos a seguir en el Script de Construcción (scripts/configurar_tests.py)
1. **Verificación Inicial**: Comprobar si `package.json` en la raíz y `server/package.json` existen.
2. **Modificación de package.json de la raíz**:
   - Leer `package.json`.
   - Agregar o actualizar el script `"test"` para que sea `"npm run test --prefix server"`.
   - Guardar el archivo.
3. **Modificación de server/package.json**:
   - Leer `server/package.json`.
   - Agregar el script `"test": "vitest run"` a la sección de scripts.
   - Guardar el archivo.
4. **Instalación de Dependencias**:
   - Ejecutar `npm install --save-dev vitest supertest @types/supertest` dentro de la carpeta `server`.
5. **Crear archivo de test de sanidad**:
   - Crear el directorio `server/src/__tests__/` si no existe.
   - Escribir `server/src/__tests__/sanity.test.ts` con una prueba unitaria simple y una de integración si el servidor está configurado adecuadamente.

## Restricciones y Trampas Conocidas
- Usar `vitest run` en el script en lugar de simplemente `vitest` para que las pruebas corran una sola vez y terminen en modo no interactivo (CI/CD compatible), evitando que el proceso quede colgado.
- Asegurar que las dependencias de desarrollo se instalen correctamente usando el comando apropiado (`npm install --save-dev ...` con cwd apuntando a la carpeta `server`).
