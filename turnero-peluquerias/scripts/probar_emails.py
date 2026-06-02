import os
import subprocess
import sys

# Default email to send to
target_email = "plaitriocuarto@gmail.com"
if len(sys.argv) > 1:
    target_email = sys.argv[1]

server_dir = r"c:\Users\tomas\Desktop\Plai Turnero-Landig\turnero-peluquerias\server"
test_file_path = os.path.join(server_dir, "src", "test_send.ts")

# TS test script content (dotenv/config MUST be imported first)
ts_content = f"""import 'dotenv/config';
import {{ sendConfirmacion, sendRecordatorio }} from './lib/email';

async function main() {{
  const turno = {{
    clienteEmail: "{target_email}",
    clienteNombre: "tomas maluf",
    fecha: "2026-06-11",
    hora_inicio: "09:30",
    servicio: "Corte de Pelo",
    profesional: "Tomas",
    peluqueria: "Peluquería",
    precio: 12000
  }};

  console.log('--- Probando envío de Confirmación ---');
  try {{
    const resConfirm = await sendConfirmacion(turno);
    console.log('Confirmación enviada correctamente:', resConfirm);
  }} catch (err) {{
    console.error('Error al enviar confirmación:', err);
  }}

  console.log('\\n--- Probando envío de Recordatorio ---');
  try {{
    const resRecordatorio = await sendRecordatorio(turno);
    console.log('Recordatorio enviado correctamente:', resRecordatorio);
  }} catch (err) {{
    console.error('Error al enviar recordatorio:', err);
  }}
}}

main();
"""

print(f"Creating temporary test file at: {test_file_path}")
with open(test_file_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Executing ts-node script to send emails to: {target_email}")
try:
    # Run the TS file using npx ts-node
    result = subprocess.run(
        ["npx", "ts-node", "src/test_send.ts"],
        cwd=server_dir,
        shell=True,
        capture_output=True,
        text=True
    )
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
finally:
    # Clean up the temporary TS file
    if os.path.exists(test_file_path):
        print(f"Cleaning up: removing {test_file_path}")
        os.remove(test_file_path)
