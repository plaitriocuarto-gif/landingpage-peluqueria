# Directiva: Prueba de Envío de Correos Electrónicos

## Objetivo
Probar y verificar que el nuevo diseño de los correos electrónicos (confirmación y recordatorio) se envíe de manera correcta usando la API de Resend y las funciones TypeScript implementadas.

## Entradas
- Archivo `server/src/lib/email.ts`.
- Variables de entorno en `server/.env` (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).
- Correo electrónico de destino para la prueba.

## Salidas
- Correo electrónico de prueba enviado y confirmación en la consola del servidor.

## Lógica y Pasos a seguir en el Script de Construcción (scripts/probar_emails.py)
1. **Creación del script temporal de prueba en TypeScript**:
   - Crear un archivo temporal `server/src/test_send.ts` que importe las funciones `sendConfirmacion` y `sendRecordatorio` de `src/lib/email.ts`.
   - Definir un objeto `TurnoEmail` de prueba:
     - clienteNombre: "Tomas Maluf"
     - fecha: "2026-06-11"
     - hora_inicio: "09:30"
     - servicio: "Corte de Pelo"
     - profesional: "Tomas"
     - peluqueria: "Peluquería"
     - precio: 12000
   - Ejecutar la llamada a `sendConfirmacion` y `sendRecordatorio` enviando al correo especificado.
2. **Ejecución del test**:
   - Ejecutar el archivo de prueba de TypeScript usando `npx ts-node src/test_send.ts` desde el directorio `server/`.
3. **Limpieza**:
   - Eliminar el archivo temporal `server/src/test_send.ts` después de la prueba.

## Restricciones y Trampas Conocidas
- Debido a las limitaciones de la sandbox de Resend, si no se cuenta con un dominio verificado, Resend solo permite enviar correos a la dirección de correo asociada a la cuenta del dueño de la API Key. Por lo tanto, el correo de destino predeterminado debe ser el del desarrollador/usuario (ej: `plaitriocuarto@gmail.com` o similar).
- **IMPORTANTE**: En el script de TypeScript `test_send.ts`, se debe importar `dotenv/config` al principio de todo (antes de importar `./lib/email`), de lo contrario la API Key de Resend no estará cargada en `process.env` cuando se inicialice la instancia de Resend, resultando en un error de "Missing API key".
