import os
import json
import urllib.request
import urllib.error

# Rutas
env_path = r"c:\Users\tomas\Desktop\Plai Turnero-Landig\turnero-peluquerias\server\.env"

def load_env(path):
    env_vars = {}
    if not os.path.exists(path):
        raise FileNotFoundError(f"No se encontró el archivo .env en: {path}")
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip()
    return env_vars

def main():
    print("Cargando variables de entorno desde el .env del servidor...")
    env = load_env(env_path)
    clerk_secret = env.get("CLERK_SECRET_KEY")
    
    if not clerk_secret:
        raise ValueError("Falta CLERK_SECRET_KEY en el .env del servidor")
    
    url = "https://api.clerk.com/v1/users"
    headers = {
        "Authorization": f"Bearer {clerk_secret}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print("Consultando la API de Clerk...")
    req = urllib.request.Request(url, headers=headers, method="GET")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                if not data:
                    print("No se encontraron usuarios en Clerk.")
                    return
                
                print("\n=== USUARIOS REGISTRADOS EN CLERK ===")
                for user in data:
                    user_id = user.get("id")
                    email_addresses = user.get("email_addresses", [])
                    primary_email = ""
                    for email_obj in email_addresses:
                        if email_obj.get("id") == user.get("primary_email_address_id"):
                            primary_email = email_obj.get("email_address")
                            break
                    if not primary_email and email_addresses:
                        primary_email = email_addresses[0].get("email_address")
                    
                    first_name = user.get("first_name") or ""
                    last_name = user.get("last_name") or ""
                    fullname = f"{first_name} {last_name}".strip() or "Sin nombre"
                    
                    print(f"- ID: {user_id}")
                    print(f"  Email: {primary_email}")
                    print(f"  Nombre: {fullname}")
                    print("-" * 40)
            else:
                print(f"Error al consultar Clerk. Código HTTP: {response.status}")
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        print(f"HTTPError {e.code} en {url}: {err_content}")
    except Exception as e:
        print(f"Error de conexión/petición: {str(e)}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {str(e)}")
        exit(1)
