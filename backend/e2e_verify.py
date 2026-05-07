import json
from pathlib import Path

import httpx
from PIL import Image

BASE = "http://127.0.0.1:8001"


def ensure(cond: bool, message: str):
    if not cond:
        raise RuntimeError(message)


def main():
    out = {"base": BASE, "checks": []}
    client = httpx.Client(base_url=BASE, timeout=30.0)

    # Health
    r = client.get("/health")
    ensure(r.status_code == 200, f"/health failed: {r.text}")
    out["checks"].append({"health": r.json()})

    # Auth register/login/me
    email = "admin.e2e@smartstore.ai"
    register_payload = {
        "email": email,
        "full_name": "E2E Admin",
        "password": "secret123",
        "role": "admin",
    }
    rr = client.post("/auth/register", json=register_payload)
    ensure(rr.status_code in (201, 409), f"register failed: {rr.text}")
    lr = client.post("/auth/login", json={"email": email, "password": "secret123"})
    ensure(lr.status_code == 200, f"login failed: {lr.text}")
    tokens = lr.json()
    token = tokens["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/auth/me", headers=auth_headers)
    ensure(me.status_code == 200, f"/auth/me failed: {me.text}")
    out["checks"].append({"auth_me": me.json()})

    # Suppliers CRUD
    supplier_payload = {
        "name": "E2E Supplier",
        "email": "supplier.e2e@smartstore.ai",
        "phone": "1234567890",
        "categories": ["Beverages"],
        "lead_time_days": 5,
    }
    sc = client.post("/suppliers/", headers=auth_headers, json=supplier_payload)
    ensure(sc.status_code in (201, 409), f"supplier create failed: {sc.text}")
    if sc.status_code == 409:
        listing = client.get("/suppliers/", headers=auth_headers)
        ensure(listing.status_code == 200, "supplier list failed")
        supplier = next((s for s in listing.json() if s["email"] == supplier_payload["email"]), None)
        ensure(supplier is not None, "existing supplier not found")
    else:
        supplier = sc.json()
    supplier_id = supplier["id"]
    sg = client.get(f"/suppliers/{supplier_id}", headers=auth_headers)
    ensure(sg.status_code == 200, f"supplier get failed: {sg.text}")
    su = client.patch(f"/suppliers/{supplier_id}", headers=auth_headers, json={"phone": "9999999999"})
    ensure(su.status_code == 200, f"supplier update failed: {su.text}")
    out["checks"].append({"supplier": {"id": supplier_id, "updated_phone": su.json().get("phone")}})

    # Products CRUD + stock/history/forecast
    product_payload = {
        "name": "E2E Cola",
        "sku": "E2E-COLA-001",
        "category": "Beverages",
        "stock": 15,
        "price": 19.99,
        "cost": 10.0,
        "reorder_threshold": 20,
        "supplier_id": supplier_id,
        "velocity": 3.0,
        "expiry_date": "2027-01-15",
    }
    pc = client.post("/products/", headers=auth_headers, json=product_payload)
    ensure(pc.status_code in (201, 409), f"product create failed: {pc.text}")
    if pc.status_code == 409:
        plist = client.get("/products/", headers=auth_headers, params={"page": 1, "page_size": 100})
        ensure(plist.status_code == 200, "products list failed")
        product = next((p for p in plist.json()["items"] if p["sku"] == product_payload["sku"]), None)
        ensure(product is not None, "existing product not found")
    else:
        product = pc.json()
    product_id = product["id"]
    pg = client.get(f"/products/{product_id}", headers=auth_headers)
    ensure(pg.status_code == 200, f"product get failed: {pg.text}")
    pu = client.patch(f"/products/{product_id}", headers=auth_headers, json={"stock": 12, "price": 18.49})
    ensure(pu.status_code == 200, f"product update failed: {pu.text}")
    adjust = client.post(
        f"/products/{product_id}/adjust-stock",
        headers=auth_headers,
        json={"change_type": "adjustment", "quantity_change": 5, "note": "e2e restock"},
    )
    ensure(adjust.status_code == 200, f"product stock adjust failed: {adjust.text}")
    logs = client.get(f"/products/{product_id}/inventory-logs", headers=auth_headers)
    ensure(logs.status_code == 200, f"inventory logs failed: {logs.text}")
    forecast = client.get(f"/products/{product_id}/forecast", headers=auth_headers, params={"days": 7})
    ensure(forecast.status_code == 200, f"forecast failed: {forecast.text}")
    out["checks"].append({"product": {"id": product_id, "logs": len(logs.json())}})

    # Purchase orders CRUD-style flow
    po_payload = {
        "supplier_id": supplier_id,
        "items": [
            {
                "product_id": product_id,
                "product_name": "E2E Cola",
                "sku": "E2E-COLA-001",
                "quantity": 25,
                "unit_price": 10.0,
            }
        ],
        "notes": "E2E PO",
    }
    poc = client.post("/purchase-orders/", headers=auth_headers, json=po_payload)
    ensure(poc.status_code == 201, f"po create failed: {poc.text}")
    po_id = poc.json()["id"]
    pol = client.get("/purchase-orders/", headers=auth_headers)
    ensure(pol.status_code == 200, f"po list failed: {pol.text}")
    pog = client.get(f"/purchase-orders/{po_id}", headers=auth_headers)
    ensure(pog.status_code == 200, f"po get failed: {pog.text}")
    pos = client.patch(f"/purchase-orders/{po_id}/status", headers=auth_headers, json={"status": "sent"})
    ensure(pos.status_code == 200, f"po status update failed: {pos.text}")
    out["checks"].append({"purchase_order": {"id": po_id, "status": pos.json().get("status")}})

    # Reports + automation logs
    rep = client.get("/reports/", headers=auth_headers)
    ensure(rep.status_code == 200, f"reports list failed: {rep.text}")
    auto = client.get("/reports/automation-logs", headers=auth_headers)
    ensure(auto.status_code == 200, f"automation logs failed: {auto.text}")
    out["checks"].append({"reports_count": len(rep.json()), "automation_logs_count": len(auto.json())})

    # Invoice parse
    temp_img = Path("e2e_invoice.png")
    Image.new("RGB", (20, 20), color=(255, 255, 255)).save(temp_img)
    with temp_img.open("rb") as fp:
        inv = client.post("/invoices/parse", headers=auth_headers, files={"file": ("e2e_invoice.png", fp, "image/png")})
    ensure(inv.status_code == 200, f"invoice parse failed: {inv.text}")
    temp_img.unlink(missing_ok=True)
    out["checks"].append({"invoice_parse_confidence": inv.json().get("parse_confidence")})

    # AI chat
    ai = client.post(
        "/ai/chat",
        headers=auth_headers,
        json={"messages": [{"role": "user", "content": "Which items are low stock?"}]},
    )
    ensure(ai.status_code == 200, f"ai chat failed: {ai.text}")
    out["checks"].append({"ai_response_preview": ai.json().get("response", "")[:80]})

    # Delete product/supplier
    pd = client.delete(f"/products/{product_id}", headers=auth_headers)
    ensure(pd.status_code == 204, f"product delete failed: {pd.text}")
    sd = client.delete(f"/suppliers/{supplier_id}", headers=auth_headers)
    ensure(sd.status_code == 204, f"supplier delete failed: {sd.text}")
    out["checks"].append({"cleanup": "product+supplier soft-deleted"})

    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
