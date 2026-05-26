import os
import json
import subprocess

def main():
    print("Iniciando configuración de tests...")
    
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    server_dir = os.path.join(root_dir, "server")
    
    # 1. Modificar package.json de la raíz
    root_pkg_path = os.path.join(root_dir, "package.json")
    if os.path.exists(root_pkg_path):
        print(f"Modificando {root_pkg_path}...")
        with open(root_pkg_path, "r", encoding="utf-8") as f:
            root_pkg = json.load(f)
        
        if "scripts" not in root_pkg:
            root_pkg["scripts"] = {}
        
        root_pkg["scripts"]["test"] = "npm run test --prefix server"
        
        with open(root_pkg_path, "w", encoding="utf-8") as f:
            json.dump(root_pkg, f, indent=2, ensure_ascii=False)
        print("package.json de la raíz modificado con éxito.")
    else:
        print("ERROR: No se encontró package.json en la raíz.")
        return

    # 2. Modificar server/package.json
    server_pkg_path = os.path.join(server_dir, "package.json")
    if os.path.exists(server_pkg_path):
        print(f"Modificando {server_pkg_path}...")
        with open(server_pkg_path, "r", encoding="utf-8") as f:
            server_pkg = json.load(f)
        
        if "scripts" not in server_pkg:
            server_pkg["scripts"] = {}
        
        server_pkg["scripts"]["test"] = "vitest run"
        
        with open(server_pkg_path, "w", encoding="utf-8") as f:
            json.dump(server_pkg, f, indent=2, ensure_ascii=False)
        print("server/package.json modificado con éxito.")
    else:
        print("ERROR: No se encontró server/package.json.")
        return

    # 3. Crear el directorio de tests
    tests_dir = os.path.join(server_dir, "src", "__tests__")
    os.makedirs(tests_dir, exist_ok=True)
    print(f"Directorio de tests creado o verificado en: {tests_dir}")

    # 4. Crear el archivo de test de sanidad
    sanity_test_path = os.path.join(tests_dir, "sanity.test.ts")
    sanity_content = """import { describe, it, expect } from 'vitest';

describe('Prueba de Sanidad', () => {
  it('debería sumar correctamente dos números', () => {
    expect(1 + 1).toBe(2);
  });

  it('debería manejar operaciones lógicas básicas', () => {
    expect(true).toBe(true);
    expect(false).toBe(false);
  });
});
"""
    with open(sanity_test_path, "w", encoding="utf-8") as f:
        f.write(sanity_content)
    print(f"Archivo de test creado en {sanity_test_path}.")

    # 5. Instalar dependencias en el servidor
    print("Instalando dependencias (vitest, supertest) en el servidor...")
    try:
        # Usamos shell=True en Windows para asegurar la ejecución correcta de npm
        result = subprocess.run(
            ["npm", "install", "--save-dev", "vitest", "supertest", "@types/supertest"],
            cwd=server_dir,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print("Dependencias instaladas exitosamente.")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("ERROR al instalar dependencias:")
        print(e.stderr)
        raise e

if __name__ == "__main__":
    main()
