import urllib.request
import urllib.error
import json

supabase_url = "https://juenrnsggpvnphvpgpnl.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZW5ybnNnZ3B2bnBodnBncG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjY3NDAsImV4cCI6MjA5NTE0Mjc0MH0.5Kq9Jg9UArYoywT42pwZSqUrhS66pIRnMkLp5B2rSdM"

headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}"
}

def check_query():
    # Consulta a negocios filtrando por slug = 'plait-prueba' y estado = 'activo'
    url = f"{supabase_url}/rest/v1/negocios?slug=eq.plait-prueba&estado=eq.activo"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            print("RESPUESTA NEGOCIOS:", data)
    except urllib.error.HTTPError as e:
        print("ERROR NEGOCIOS (HTTP):", e.code, e.read().decode("utf-8"))
    except Exception as e:
        print("ERROR NEGOCIOS:", str(e))

    # Consulta a todos los negocios
    url_all = f"{supabase_url}/rest/v1/negocios"
    req_all = urllib.request.Request(url_all, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req_all) as response:
            data = json.loads(response.read().decode("utf-8"))
            print("RESPUESTA TODOS LOS NEGOCIOS:", data)
    except urllib.error.HTTPError as e:
        print("ERROR TODOS (HTTP):", e.code, e.read().decode("utf-8"))
    except Exception as e:
        print("ERROR TODOS:", str(e))

if __name__ == "__main__":
    check_query()
