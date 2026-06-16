import os
import json
import urllib.request
import urllib.error

# Rutas
env_path = r"c:\Users\tomas\Desktop\Plai Turnero-Landig\turnero-peluquerias\server\.env"

def load_env(path):
    env_vars = {}
    if not os.path.exists(path):
        raise FileNotFoundError(f"No se encontro el archivo .env en: {path}")
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip()
    return env_vars

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read()
            if response.status in (200, 201, 204):
                if res_data:
                    return json.loads(res_data.decode("utf-8")), response.status
                return None, response.status
            else:
                raise Exception(f"Error HTTP {response.status}: {res_data.decode('utf-8')}")
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        raise Exception(f"HTTPError {e.code} en {url}: {err_content}")
    except Exception as e:
        raise Exception(f"Error de red/peticion en {url}: {str(e)}")

def main():
    print("Cargando variables de entorno desde el .env del servidor...")
    env = load_env(env_path)
    
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env")
    
    print(f"Conectando a Supabase URL: {supabase_url}")
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    
    # 1. Configurar Negocio de prueba
    slug = "plait-prueba"
    negocio_url = f"{supabase_url}/rest/v1/negocios?slug=eq.{slug}"
    print(f"Verificando si el negocio con slug '{slug}' existe...")
    
    negocios, status = make_request(negocio_url, method="GET", headers=headers)
    
    payload_negocio = {
        "nombre": "PLAIT",
        "apellido": "Test",
        "telefono": "3585006177",
        "gmail": "plaitriocuarto@gmail.com",
        "nombre_negocio": "Peluquería PLaiT",
        "slug": slug,
        "clerk_user_id": "user_3EgQLUuu2SwRDMfQCYZKV66j8LG",
        "url_cliente": "http://localhost:5173/plait-prueba",
        "url_admin": "http://localhost:5173/plait-prueba/admin",
        "estado": "activo"
    }
    
    if negocios and len(negocios) > 0:
        print(f"El negocio '{slug}' ya existe. Actualizando clerk_user_id y estado...")
        # Patch/Update
        patch_url = f"{supabase_url}/rest/v1/negocios?slug=eq.{slug}"
        make_request(patch_url, method="PATCH", headers=headers, data={
            "clerk_user_id": payload_negocio["clerk_user_id"],
            "estado": "activo",
            "gmail": payload_negocio["gmail"],
            "nombre_negocio": payload_negocio["nombre_negocio"]
        })
        print("Negocio actualizado con exito.")
    else:
        print(f"El negocio '{slug}' no existe. Creando negocio nuevo...")
        # Post/Insert
        post_url = f"{supabase_url}/rest/v1/negocios"
        make_request(post_url, method="POST", headers=headers, data=payload_negocio)
        print("Negocio creado con exito.")
        
    # 2. Configurar Usuario admin
    email = "plaitriocuarto@gmail.com"
    users_url = f"{supabase_url}/rest/v1/users?email=eq.{email}"
    print(f"Verificando si el usuario admin '{email}' existe...")
    
    users, status = make_request(users_url, method="GET", headers=headers)
    
    payload_user = {
        "email": email,
        "nombre": "PLAIT",
        "rol": "admin",
        "password_hash": "clerk_managed"
    }
    
    if users and len(users) > 0:
        print(f"El usuario '{email}' ya existe. Actualizando rol y password_hash...")
        patch_url = f"{supabase_url}/rest/v1/users?email=eq.{email}"
        make_request(patch_url, method="PATCH", headers=headers, data={
            "rol": payload_user["rol"],
            "password_hash": payload_user["password_hash"],
            "nombre": payload_user["nombre"]
        })
        print("Usuario admin actualizado con exito.")
    else:
        print(f"El usuario '{email}' no existe. Creando usuario admin nuevo...")
        post_url = f"{supabase_url}/rest/v1/users"
        make_request(post_url, method="POST", headers=headers, data=payload_user)
        print("Usuario admin creado con exito.")
        
    print("\n¡Configuracion completada exitosamente!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {str(e)}")
        exit(1)
