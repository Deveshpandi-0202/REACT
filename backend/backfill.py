from app import Product, db
from app import app
from seed import products


def backfill():
    with app.app_context():
        updated = 0
        missing = []
        for p in products:
            product = Product.query.filter_by(name=p["name"]).first()
            if not product:
                missing.append(p["name"])
                continue
            product.original_price = p["original_price"]
            product.discount = p["discount"]
            product.rating = p["rating"]
            product.image_url = p["image_url"]
            product.description = p["description"]
            product.category = p["category"]
            product.stock = p["stock"]
            updated += 1
        db.session.commit()
        print(f"Updated {updated} products")
        if missing:
            print("Not found:", ", ".join(missing))


if __name__ == "__main__":
    backfill()