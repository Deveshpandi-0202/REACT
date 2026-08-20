from app import Product, User, db
from app import app
from werkzeug.security import generate_password_hash

products = [
    # Fruits
    {"name": "Fresh Apples (1 kg)", "description": "Crisp and juicy red apples", "price": 120.0, "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300", "category": "Fruits", "stock": 50},
    {"name": "Banana (1 dozen)", "description": "Ripe yellow bananas", "price": 40.0, "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300", "category": "Fruits", "stock": 100},
    {"name": "Fresh Oranges (1 kg)", "description": "Sweet navel oranges", "price": 80.0, "image_url": "https://images.unsplash.com/photo-1547514701-42782101795e?w=300", "category": "Fruits", "stock": 60},

    # Dairy
    {"name": "Amul Butter (100g)", "description": "Fresh creamy butter", "price": 50.0, "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300", "category": "Dairy", "stock": 80},
    {"name": "Full Cream Milk (1L)", "description": "Pasteurized full cream milk", "price": 60.0, "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300", "category": "Dairy", "stock": 120},
    {"name": "Paneer (200g)", "description": "Fresh cottage cheese", "price": 80.0, "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300", "category": "Dairy", "stock": 40},

    # Snacks
    {"name": "Lays Classic Salted (52g)", "description": "Crispy potato chips", "price": 20.0, "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300", "category": "Snacks", "stock": 200},
    {"name": "Maggi Noodles (70g)", "description": "2-minute instant noodles", "price": 14.0, "image_url": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300", "category": "Snacks", "stock": 150},
    {"name": "Oreo Biscuits (120g)", "description": "Chocolate sandwich biscuits", "price": 30.0, "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300", "category": "Snacks", "stock": 100},

    # Beverages
    {"name": "Coca-Cola (300ml)", "description": "Chilled cola drink", "price": 20.0, "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300", "category": "Beverages", "stock": 200},
    {"name": "Tropicana Juice (1L)", "description": "Fresh orange juice", "price": 99.0, "image_url": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300", "category": "Beverages", "stock": 50},

    # Vegetables
    {"name": "Tomato (1 kg)", "description": "Fresh ripe tomatoes", "price": 40.0, "image_url": "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=300", "category": "Vegetables", "stock": 80},
    {"name": "Onion (1 kg)", "description": "Fresh red onions", "price": 35.0, "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300", "category": "Vegetables", "stock": 90},
    {"name": "Potato (1 kg)", "description": "Fresh potatoes", "price": 30.0, "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=300", "category": "Vegetables", "stock": 100},

    # Household
    {"name": "Surf Excel (500g)", "description": "Detergent powder", "price": 55.0, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300", "category": "Household", "stock": 60},
    {"name": "Vim Dishwash Liquid (500ml)", "description": "Lemon dishwashing liquid", "price": 99.0, "image_url": "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=300", "category": "Household", "stock": 45},
]


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        admin = User(
            name="Admin",
            email="devesh@blinkit.com",
            password=generate_password_hash("devesh123"),
            role="admin",
        )
        user = User(
            name="Rahul",
            email="rahul@test.com",
            password=generate_password_hash("rahul123"),
            role="user",
        )
        db.session.add_all([admin, user])
        db.session.commit()
        print("Created admin (devesh@blinkit.com / devesh123) and user (rahul@test.com / rahul123)")

        for p in products:
            db.session.add(Product(**p))
        db.session.commit()
        print(f"Seeded {len(products)} products")


if __name__ == "__main__":
    seed()
