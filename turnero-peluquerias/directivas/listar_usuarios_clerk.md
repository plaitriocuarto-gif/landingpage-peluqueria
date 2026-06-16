# Directiva: Listar Usuarios Clerk

## Objetivo
Consultar la API REST de Clerk utilizando la clave secreta `CLERK_SECRET_KEY` para listar todos los usuarios registrados, mostrando sus correos electrónicos y sus correspondientes `clerk_user_id`. Esto permitirá verificar qué cuentas están creadas en Clerk y si corresponden con los datos de Supabase.

## Entradas
- Archivo `.env` del servidor en `turnero-peluquerias/server/.env` conteniendo `CLERK_SECRET_KEY`.

## Salidas
- Una lista impresa en consola con el ID, el email y el estado de cada usuario en Clerk.

## Lógica y Pasos a seguir en el Script de Construcción (scripts/listar_usuarios_clerk.py)
1. **Lectura de Configuración**: Leer el archivo `turnero-peluquerias/server/.env` y extraer el valor de `CLERK_SECRET_KEY`.
2. **Petición a la API de Clerk**:
   - Enviar una petición HTTP GET a `https://api.clerk.com/v1/users`.
   - Incluir el header `Authorization: Bearer <CLERK_SECRET_KEY>`.
3. **Formateo de la Salida**:
   - Iterar sobre la lista de usuarios devuelta por Clerk.
   - Extraer el `id` y el correo primario (`email_addresses`).
   - Imprimir cada usuario de forma legible en consola.

## Restricciones y Trampas Conocidas
- La API de Clerk requiere la cabecera `Authorization: Bearer <secret_key>`.
- Si no hay usuarios registrados, la lista estará vacía.
- **Evitar bloqueo de Cloudflare:** La API de Clerk está protegida por Cloudflare. Los scripts automatizados (como Python `urllib` o `requests`) deben incluir obligatoriamente una cabecera `User-Agent` de un navegador real (ej. `Mozilla/5.0...`), de lo contrario la API rechazará la petición con un error `HTTP 403` (código de error `1010`).

