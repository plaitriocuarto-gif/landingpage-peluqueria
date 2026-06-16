# Directiva: Habilitar y Probar Clerk

## Objetivo
Configurar los datos de prueba necesarios en la base de datos de Supabase para validar la integración del flujo de inicio de sesión con Clerk para administradores, vinculando el ID de usuario de Clerk a un negocio en la tabla de negocios y a un usuario administrador correspondiente en la tabla de usuarios.

## Entradas
- Archivo `.env` del servidor en `turnero-peluquerias/server/.env` conteniendo `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- ID de usuario de Clerk provisto por el usuario: `user_3EgQLUuu2SwRDMfQCYZKV66j8LG`.
- Email de administración: `plaitriocuarto@gmail.com`.
- Slug de prueba: `plait-prueba`.

## Salidas
- Registros actualizados o insertados en las tablas `negocios` y `users` de Supabase a través de llamadas a la API REST de Supabase.

## Lógica y Pasos a seguir en el Script de Construcción (scripts/configurar_datos_prueba_clerk.py)
1. **Lectura de Configuración**: Leer el archivo `turnero-peluquerias/server/.env` y extraer los valores de `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Si alguno falta, lanzar un error.
2. **Construcción de Headers**:
   - `apikey`: `SUPABASE_SERVICE_ROLE_KEY`
   - `Authorization`: `Bearer SUPABASE_SERVICE_ROLE_KEY`
   - `Content-Type`: `application/json`
   - `Prefer`: `resolution=merge-duplicates` (para realizar upsert de manera segura e idempotente)
3. **Upsert en la Tabla `negocios`**:
   - Enviar una petición HTTP POST a `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/negocios`.
   - El payload del JSON debe incluir:
     - `gmail`: `'plaitriocuarto@gmail.com'`
     - `nombre`: `'PLAIT'`
     - `apellido`: `'Test'`
     - `telefono`: `'3585006177'`
     - `nombre_negocio`: `'Peluquería PLaiT'`
     - `slug`: `'plait-prueba'`
     - `clerk_user_id`: `'user_3EgQLUuu2SwRDMfQCYZKV66j8LG'`
     - `url_cliente`: `'http://localhost:5173/plait-prueba'`
     - `url_admin`: `'http://localhost:5173/plait-prueba/admin'`
     - `estado`: `'activo'`
   - Se debe definir la clave de unicidad para el upsert (en Supabase REST API esto se hace mediante headers o parámetros, o simplemente intentando buscar si ya existe la fila antes de insertar para hacerlo robusto y compatible con cualquier configuración de unicidad).
4. **Upsert en la Tabla `users`**:
   - Enviar una petición HTTP POST a `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users`.
   - El payload del JSON debe incluir:
     - `email`: `'plaitriocuarto@gmail.com'`
     - `nombre`: `'PLAIT'`
     - `rol`: `'admin'`
     - `password_hash`: `'clerk_managed'`
5. **Verificación de Respuestas**:
   - Validar que ambas peticiones HTTP devuelvan códigos exitosos (200, 201 o 204).

## Restricciones y Trampas Conocidas
- Al usar la API REST de Supabase directa con la clave `service_role`, se evitan las políticas de RLS, lo cual es correcto ya que es un script administrativo.
- Para lograr un upsert idempotente en la REST API de PostgREST/Supabase, se puede usar el header `Prefer: resolution=merge-duplicates` si la tabla tiene una clave primaria o restricción única en el campo que se usa para identificar el registro (ej. `slug` en negocios, `email` en users). Si no, el script debe intentar primero hacer un SELECT para verificar si el registro existe. Si existe, enviar un PATCH (update); de lo contrario, enviar un POST (insert). Este enfoque de "buscar e insertar/actualizar" es más seguro y no depende de restricciones específicas que podrían no estar presentes.
