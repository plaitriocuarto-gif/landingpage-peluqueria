# Directiva: Actualización de Diseño de Correos Electrónicos (Resend)

## Objetivo
Actualizar el diseño de los correos electrónicos enviados por Resend (`server/src/lib/email.ts`) para que coincidan exactamente con la imagen de referencia provista por el usuario. Esto incluye agregar un borde exterior al contenedor, usar fuentes serif para los títulos principales, estilizar el badge de estado, rediseñar la tarjeta de información (sin bordes divisores entre filas, con sombra sutil y nuevos íconos como el billete/precio), y actualizar el pie de página con el enlace correcto a `plait.agency`.

## Entradas
- Archivo `server/src/lib/email.ts`.
- Imagen de referencia de diseño provista por el usuario (mostrando un diseño premium con bordes, sombra en la tarjeta, y link a plait.agency).
- Imagen del logo oficial de PLaiT (con `LT` entrelazado de forma geométrica y una línea blanca separadora horizontal antes del texto `PLaiT`).

## Salidas
- Archivo `server/src/lib/email.ts` modificado con los nuevos estilos y estructura de HTML.

## Lógica y Pasos a seguir en el Script de Construcción (scripts/actualizar_diseno_emails.py)
1. **Verificación**: Asegurar que `server/src/lib/email.ts` existe.
2. **Reemplazo del Template Base (`baseTemplate`)**:
   - **Bordes y Contenedor**:
     - Header cell: `border-top: 1px solid #0D215B; border-left: 1px solid #0D215B; border-right: 1px solid #0D215B; border-radius: 12px 12px 0 0;`
     - Body cell: `border-bottom: 1px solid #0D215B; border-left: 1px solid #0D215B; border-right: 1px solid #0D215B; border-radius: 0 0 12px 12px;`
   - **Logo en Header**:
     - En lugar de texto HTML y tablas complejas para emular el logo, se dibuja el logo oficial de PLaiT usando un SVG en línea perfecto y matemáticamente exacto:
       - Contenedor SVG: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="112" viewBox="0 0 150 140">`
       - Símbolo `LT` dibujado con rectángulos alineados y solapados:
         - `L` vertical: `x="40" y="20" width="10" height="60"`
         - `L` horizontal: `x="50" y="70" width="20" height="10"`
         - `T` horizontal: `x="50" y="30" width="60" height="10"`
         - `T` vertical: `x="70" y="40" width="10" height="50"`
       - Línea separadora horizontal: `<rect x="35" y="102" width="80" height="2.5" />`
       - Texto `PLaiT` centrado y estilizado: `<text x="75" y="127" fill="#ffffff" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="500" text-anchor="middle" letter-spacing="1">PLaiT</text>`
   - **Footer en baseTemplate**:
     - Cambiar la URL de Instagram por `<a href="https://plait.agency" style="color:#0D215B;text-decoration:underline;font-weight:500;">plait.agency</a>`.
3. **Reemplazo de la Fila de Turno y Tarjeta (`turnoRow` y `turnoInfo`)**:
   - En `turnoRow`, remover el borde inferior (`border-bottom: 1px solid #f0f1f3;`) para que las filas no tengan líneas divisorias intermedias, logrando el aspecto limpio de la imagen.
   - En `turnoInfo`, agregar una sombra a la tarjeta: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);` (o similar compatible con clientes de correo) y fondo `#ffffff` o `#f8fafc`.
   - Modificar el ícono de `dollar` en `ICON` para que dibuje un billete (banknote) en lugar de una simple línea de dólar:
     - SVG del billete: `svg('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>')` o similar.
4. **Reemplazo de las plantillas de correo**:
   - En `sendConfirmacion`, aplicar la fuente serif para el título `¡Turno confirmado!` usando `font-family: Georgia, Cambria, 'Times New Roman', Times, serif;`.
   - En `sendRecordatorio`, actualizar el contenido para usar una estructura idéntica de título y badge a la de confirmación, pero con el texto de recordatorio ("¡Recordatorio de turno!" o "Recordatorio de turno" y el badge `✓ confirmed` o `✓ confirmado` en verde).
   - En `sendCancelacion`, mantener consistencia de diseño (usando el mismo estilo de título y badge rojo/gris si corresponde, o simplemente el título serif con el badge cruzada/cancelada).

## Restricciones y Trampas Conocidas
- El soporte de CSS en clientes de correo es limitado. Usar estilos inline simples y atributos HTML estándar de tablas (`cellpadding`, `cellspacing`).
- Para sombras (`box-shadow`), algunos clientes de correo de escritorio las ignoran, pero se renderizan bien en Gmail y navegadores modernos. Acompañar con un borde fino y sutil en la tarjeta (`border: 1px solid #eef0f5`) para asegurar legibilidad si la sombra no se procesa.
- El enlace en el pie de página debe apuntar a `https://plait.agency` y el texto debe ser `plait.agency` administrando los estilos para que se vea premium.
