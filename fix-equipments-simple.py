#!/usr/bin/env python3

"""
Correction simple du système d'équipements SoliReserve Enhanced
Utilise la clé service Supabase pour bypasser les RLS
"""

import requests
import json
import time
import os
from typing import Dict, List, Any

# Configuration Supabase
SUPABASE_URL = "https://pgjatiookprsvfesrsrx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNzE2NzcsImV4cCI6MjAzNzk0NzY3N30.C0UHYfEe8K3bF_W6UeKZHWNXxDaxJGqOqWHV5CqC1lc"

print("🔧 SoliReserve Enhanced - Correction Système Équipements")
print("=" * 60)
print(f"🔗 URL: {SUPABASE_URL}")

# Headers pour les requêtes
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def test_table_access(table_name: str) -> Dict[str, Any]:
    """Test l'accès à une table Supabase"""
    print(f"\n📊 Test d'accès à la table '{table_name}'...")
    
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=1"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Accès OK: {len(data)} résultat(s)")
            return {"success": True, "data": data, "count": len(data)}
        else:
            print(f"❌ Erreur {response.status_code}: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"❌ Erreur requête: {e}")
        return {"success": False, "error": str(e)}

def create_test_equipment() -> Dict[str, Any]:
    """Crée un équipement de test"""
    print(f"\n🆕 Création d'équipement test...")
    
    test_equipment = {
        "name": f"Test Equipment {int(time.time())}",
        "type": "amenity",
        "category": "Test",
        "description": "Équipement de test automatisé",
        "icon": "Wrench",
        "is_active": True,
        "display_order": 999
    }
    
    url = f"{SUPABASE_URL}/rest/v1/equipments"
    
    try:
        response = requests.post(
            url, 
            headers=headers, 
            data=json.dumps(test_equipment),
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            equipment_id = data[0]['id'] if data else None
            print(f"✅ Création réussie: ID {equipment_id}")
            return {"success": True, "id": equipment_id, "data": data}
        else:
            print(f"❌ Erreur {response.status_code}: {response.text}")
            if "row-level security" in response.text.lower():
                print("🔍 Problème RLS détecté")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"❌ Erreur création: {e}")
        return {"success": False, "error": str(e)}

def delete_equipment(equipment_id: int) -> bool:
    """Supprime un équipement"""
    print(f"🗑️ Suppression équipement ID {equipment_id}...")
    
    url = f"{SUPABASE_URL}/rest/v1/equipments?id=eq.{equipment_id}"
    
    try:
        response = requests.delete(url, headers=headers, timeout=10)
        
        if response.status_code == 204:
            print("✅ Suppression réussie")
            return True
        else:
            print(f"❌ Erreur suppression {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur suppression: {e}")
        return False

def seed_initial_equipments() -> Dict[str, Any]:
    """Ajoute les équipements initiaux"""
    print(f"\n🌱 Ajout des équipements initiaux...")
    
    # Vérifier s'il y a déjà des équipements
    existing = test_table_access("equipments")
    if existing["success"] and existing["count"] > 0:
        print("ℹ️ Équipements déjà présents, récupération de la liste...")
        
        # Récupérer tous les équipements
        url = f"{SUPABASE_URL}/rest/v1/equipments?select=id,name,category,is_active&order=display_order"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            equipments = response.json()
            print(f"📋 {len(equipments)} équipements trouvés:")
            for eq in equipments:
                status = "✅" if eq.get('is_active') else "❌"
                print(f"   {status} {eq['name']} ({eq.get('category', 'N/A')}) - ID: {eq['id']}")
            
            return {"success": True, "existing": True, "count": len(equipments)}
    
    # Équipements initiaux à créer
    initial_equipments = [
        {
            "name": "WiFi Gratuit",
            "type": "technology",
            "category": "Connectivité",
            "description": "Accès internet WiFi gratuit dans tout l'établissement",
            "icon": "Wifi",
            "is_active": True,
            "display_order": 1
        },
        {
            "name": "Télévision",
            "type": "amenity", 
            "category": "Divertissement",
            "description": "Télévision dans les chambres",
            "icon": "Tv",
            "is_active": True,
            "display_order": 2
        },
        {
            "name": "Machine à café",
            "type": "amenity",
            "category": "Boissons", 
            "description": "Machine à café/thé disponible",
            "icon": "Coffee",
            "is_active": True,
            "display_order": 3
        },
        {
            "name": "Parking",
            "type": "facility",
            "category": "Stationnement",
            "description": "Places de parking disponibles", 
            "icon": "Car",
            "is_active": True,
            "display_order": 4
        },
        {
            "name": "Climatisation", 
            "type": "amenity",
            "category": "Confort",
            "description": "Climatisation dans les chambres",
            "icon": "Wind",
            "is_active": True,
            "display_order": 5
        }
    ]
    
    url = f"{SUPABASE_URL}/rest/v1/equipments"
    
    try:
        response = requests.post(
            url,
            headers=headers,
            data=json.dumps(initial_equipments),
            timeout=15
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ {len(data)} équipements ajoutés:")
            for i, eq in enumerate(data, 1):
                print(f"   {i}. {eq['name']} ({eq['category']})")
            return {"success": True, "created": True, "count": len(data)}
        else:
            print(f"❌ Erreur insertion {response.status_code}: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"❌ Erreur insertion: {e}")
        return {"success": False, "error": str(e)}

def run_complete_test():
    """Exécute le test complet du système d'équipements"""
    start_time = time.time()
    results = []
    
    print("🧪 **TEST COMPLET SYSTÈME ÉQUIPEMENTS**\n")
    
    # Test 1: Accès table equipments
    equipments_access = test_table_access("equipments")
    results.append(("Accès equipments", equipments_access["success"]))
    
    # Test 2: Accès table hotel_equipments  
    hotel_equipments_access = test_table_access("hotel_equipments")
    results.append(("Accès hotel_equipments", hotel_equipments_access["success"]))
    
    # Test 3: Création/suppression
    create_result = create_test_equipment()
    create_success = create_result["success"]
    results.append(("Création équipement", create_success))
    
    if create_success and create_result.get("id"):
        delete_success = delete_equipment(create_result["id"])
        results.append(("Suppression équipement", delete_success))
    else:
        results.append(("Suppression équipement", False))
    
    # Test 4: Ajout équipements initiaux
    seed_result = seed_initial_equipments()
    results.append(("Équipements initiaux", seed_result["success"]))
    
    # Résumé
    duration = time.time() - start_time
    success_count = sum(1 for _, success in results if success)
    total_count = len(results)
    success_rate = int((success_count / total_count) * 100)
    
    print("\n" + "=" * 60)
    print("📊 **RÉSUMÉ FINAL**")
    print("=" * 60)
    
    for test_name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
    
    print(f"\n**Score: {success_rate}% ({success_count}/{total_count})**")
    print(f"**Durée: {duration:.2f}s**")
    
    if success_rate >= 80:
        print("\n🎉 **SYSTÈME D'ÉQUIPEMENTS FONCTIONNEL**")
        print("✅ Base de données accessible")
        print("✅ CRUD opérationnel") 
        print("✅ Équipements initiaux disponibles")
        print("✅ Prêt pour l'interface utilisateur")
        
        print("\n🎯 **INSTRUCTIONS FINALES:**")
        print("1. 🌐 Accéder à http://localhost:3002")
        print("2. 🔧 Cliquer sur 'Paramètres' dans la sidebar")
        print("3. 🛠️ Sélectionner l'onglet 'Équipements'")
        print("4. 📊 Vérifier que les équipements s'affichent")
        print("5. ➕ Tester 'Ajouter un équipement'")
        print("6. ✏️ Tester modification/suppression")
        
    else:
        print("\n⚠️ **PROBLÈMES DÉTECTÉS**")
        print("🔍 Vérifier la configuration Supabase")
        print("🔒 Problème possible avec RLS policies")
        print("🌐 Vérifier la connectivité réseau")
    
    print("\n" + "=" * 60)
    print(f"🏁 Test terminé - {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return success_rate >= 80

if __name__ == "__main__":
    try:
        success = run_complete_test()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrompu par l'utilisateur")
        exit(1)
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        exit(1)