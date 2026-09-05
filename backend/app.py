import os
from datetime import timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))

database_url = os.environ.get("DATABASE_URL") or os.environ.get(
    "SQLALCHEMY_DATABASE_URI",
    "sqlite:///" + os.path.join(basedir, "blinkit.db"),
)
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "grocerapp-jwt-secret-key-change-in-production-2024"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

allowed_origins_raw = os.environ.get("CORS_ORIGINS", "")
if allowed_origins_raw:
    allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:8080",
        "https://deveshpandi-0202.github.io",
        "https://blinkit-backend-mg62.onrender.com",
    ]
CORS(app, origins=allowed_origins)
db = SQLAlchemy(app)
jwt = JWTManager(app)


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Blinkit backend is running"}), 200


@app.route("/api", methods=["GET"])
def api_root():
    return jsonify({"status": "ok", "message": "Blinkit API is running", "endpoints": ["/api/products", "/api/categories", "/api/auth/signin", "/api/auth/signup"]}), 200


# ── Models ────────────────────────────────────────────────────────────────────


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(20), default="")
    role = db.Column(db.String(10), nullable=False, default="user")
    is_active = db.Column(db.Boolean, default=True)
    availability = db.Column(db.String(20), default="available")
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_active": self.is_active,
            "availability": self.availability,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    icon = db.Column(db.String(500), default="")
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        count = Product.query.filter_by(category=self.name).count()
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "product_count": count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Product(db.Model):
    __tablename__ = "products"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    price = db.Column(db.Float, nullable=False)
    original_price = db.Column(db.Float, nullable=True)
    discount = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0)
    image_url = db.Column(db.String(500), default="")
    category = db.Column(db.String(100), nullable=False)
    stock = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "original_price": self.original_price if self.original_price is not None else self.price,
            "discount": self.discount,
            "rating": self.rating,
            "image_url": self.image_url,
            "category": self.category,
            "stock": self.stock,
        }


class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), default="pending")
    payment_method = db.Column(db.String(30), default="cod")
    delivery_address = db.Column(db.String(255), default="")
    delivery_city = db.Column(db.String(120), default="")
    delivery_phone = db.Column(db.String(20), default="")
    pincode = db.Column(db.String(20), default="")
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    estimated_delivery = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    items = db.relationship("OrderItem", backref="order", lazy=True)
    customer = db.relationship("User", foreign_keys=[user_id])
    driver = db.relationship("User", foreign_keys=[driver_id])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "customer_name": self.customer.name if self.customer else None,
            "customer_phone": self.customer.phone if self.customer else None,
            "driver_id": self.driver_id,
            "driver_name": self.driver.name if self.driver else None,
            "driver_phone": self.driver.phone if self.driver else None,
            "driver_latitude": self.driver.latitude if self.driver else None,
            "driver_longitude": self.driver.longitude if self.driver else None,
            "driver_availability": self.driver.availability if self.driver else None,
            "total_amount": self.total_amount,
            "status": self.status,
            "payment_method": self.payment_method,
            "delivery_address": self.delivery_address,
            "delivery_city": self.delivery_city,
            "delivery_phone": self.delivery_phone,
            "pincode": self.pincode,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "estimated_delivery": self.estimated_delivery.isoformat() if self.estimated_delivery else None,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [i.to_dict() for i in self.items],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "quantity": self.quantity,
            "price": self.price,
        }


# ── Auth Routes ───────────────────────────────────────────────────────────────


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Name, email and password are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=data["name"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
        phone=data.get("phone", ""),
        role="user",
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created", "user": user.to_dict()}), 201


@app.route("/api/auth/signin", methods=["POST"])
def signin():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account has been deactivated. Contact admin."}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


# ── Product Routes ────────────────────────────────────────────────────────────


@app.route("/api/products", methods=["GET"])
@jwt_required()
def get_products():
    query = Product.query
    category = request.args.get("category")
    search = request.args.get("search")
    if category:
        query = query.filter_by(category=category)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return jsonify([p.to_dict() for p in query.all()])


@app.route("/api/products/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@app.route("/api/products", methods=["POST"])
@jwt_required()
def create_product():
    user = User.query.get(int(get_jwt_identity()))
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if not data or not data.get("name") or not data.get("price") or not data.get("category"):
        return jsonify({"error": "Name, price and category are required"}), 400

    discount = int(data.get("discount", 0) or 0)
    price = float(data["price"])
    original_price = data.get("original_price")
    if original_price is None:
        original_price = price / (1 - discount / 100.0) if discount > 0 and discount < 100 else price

    product = Product(
        name=data["name"],
        description=data.get("description", ""),
        price=price,
        original_price=original_price,
        discount=discount,
        rating=float(data.get("rating", 0) or 0),
        image_url=data.get("image_url", ""),
        category=data["category"],
        stock=data.get("stock", 0),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201


@app.route("/api/products/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    user = User.query.get(int(get_jwt_identity()))
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description)
    if "price" in data:
        product.price = float(data["price"])
    product.image_url = data.get("image_url", product.image_url)
    product.category = data.get("category", product.category)
    if "stock" in data:
        product.stock = data.get("stock", product.stock)
    if "discount" in data:
        product.discount = int(data["discount"] or 0)
    if "rating" in data:
        product.rating = float(data["rating"] or 0)
    if "original_price" in data:
        product.original_price = float(data["original_price"])
    if "price" in data and "original_price" not in data and product.discount > 0:
        product.original_price = product.price / (1 - product.discount / 100.0) if product.discount < 100 else product.price
    elif "price" in data and product.original_price is None:
        product.original_price = product.price
    db.session.commit()
    return jsonify(product.to_dict())


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    user = User.query.get(int(get_jwt_identity()))
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"})


# ── Category Route ────────────────────────────────────────────────────────────


@app.route("/api/categories", methods=["GET"])
@jwt_required()
def get_categories():
    named = {c.name for c in Category.query.all()}
    derived = {c[0] for c in db.session.query(Product.category).distinct().all()}
    merged = sorted(named | derived)
    return jsonify(merged)


@app.route("/api/admin/categories", methods=["GET"])
@jwt_required()
def admin_categories():
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    cats = Category.query.order_by(Category.name.asc()).all()
    return jsonify([c.to_dict() for c in cats])


@app.route("/api/admin/categories", methods=["POST"])
@jwt_required()
def create_category():
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Category name is required"}), 400
    if Category.query.filter_by(name=name).first():
        return jsonify({"error": "Category already exists"}), 409
    cat = Category(name=name, icon=data.get("icon", ""))
    db.session.add(cat)
    db.session.commit()
    return jsonify({"message": "Category created", "category": cat.to_dict()}), 201


@app.route("/api/admin/categories/<int:category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    cat = Category.query.get_or_404(category_id)
    data = request.get_json(silent=True) or {}
    new_name = (data.get("name") or "").strip()
    if not new_name:
        return jsonify({"error": "Category name is required"}), 400
    existing = Category.query.filter_by(name=new_name).first()
    if existing and existing.id != cat.id:
        return jsonify({"error": "Category already exists"}), 409
    old_name = cat.name
    cat.name = new_name
    if data.get("icon") is not None:
        cat.icon = data.get("icon")
    if old_name != new_name:
        for p in Product.query.filter_by(category=old_name).all():
            p.category = new_name
    db.session.commit()
    return jsonify({"message": "Category updated", "category": cat.to_dict()})


@app.route("/api/admin/categories/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    cat = Category.query.get_or_404(category_id)
    count = Product.query.filter_by(category=cat.name).count()
    if count:
        return jsonify({"error": f"Category '{cat.name}' has {count} product(s). Move or delete them first."}), 400
    db.session.delete(cat)
    db.session.commit()
    return jsonify({"message": "Category deleted"})


# ── Order Routes ──────────────────────────────────────────────────────────────


def _auto_assign_driver(order):
    """Select an available eligible driver and assign them to the order.

    Preference: nearest available driver when location data is present.
    Returns the assigned User or None if no driver is available.
    """
    from sqlalchemy import func

    latitude = order.latitude
    longitude = order.longitude
    eligible = (
        User.query.filter(
            User.role == "driver",
            User.is_active.is_(True),
            User.availability == "available",
        )
        .order_by(User.id.asc())
        .all()
    )
    if not eligible:
        return None

    if latitude is not None and longitude is not None:
        def _dist(driver):
            if driver.latitude is None or driver.longitude is None:
                return float("inf")
            return (driver.latitude - latitude) ** 2 + (driver.longitude - longitude) ** 2
        driver = min(eligible, key=_dist)
        if driver.latitude is None or driver.longitude is None:
            driver = eligible[0]
    else:
        driver = eligible[0]

    order.driver_id = driver.id
    order.status = "assigned"
    driver.availability = "busy"
    return driver


@app.route("/api/orders", methods=["POST"])
@jwt_required()
def create_order():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get("items"):
        return jsonify({"error": "Items are required"}), 400

    total = 0
    order_items = []
    for item in data["items"]:
        product = Product.query.get(item["product_id"])
        if not product:
            return jsonify({"error": f"Product {item['product_id']} not found"}), 404
        qty = item.get("quantity", 1)
        if product.stock < qty:
            return jsonify({"error": f"Insufficient stock for {product.name}"}), 400
        product.stock -= qty
        total += product.price * qty
        order_items.append(OrderItem(product_id=product.id, quantity=qty, price=product.price))

    payment_method = (data.get("payment_method") or "cod").strip().lower()
    if payment_method not in ("cod", "gpay"):
        return jsonify({"error": "Invalid payment method"}), 400

    from datetime import datetime, timedelta as _td
    estimated = datetime.utcnow() + _td(minutes=30)

    order = Order(
        user_id=user_id,
        total_amount=round(total, 2),
        payment_method=payment_method,
        delivery_address=data.get("address", ""),
        delivery_city=data.get("city", ""),
        delivery_phone=data.get("phone", ""),
        pincode=data.get("pincode", ""),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        estimated_delivery=estimated,
    )
    db.session.add(order)
    db.session.flush()
    for oi in order_items:
        oi.order_id = order.id
        db.session.add(oi)

    assigned_driver = None
    try:
        assigned_driver = _auto_assign_driver(order)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(order.to_dict()), 201


@app.route("/api/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    order = Order.query.get_or_404(order_id)
    requester = User.query.get(int(get_jwt_identity()))
    if not requester:
        return jsonify({"error": "Unauthorized"}), 401
    is_owner = order.user_id == requester.id
    is_admin = requester.role == "admin"
    is_driver = requester.role == "driver" and order.driver_id == requester.id
    if not (is_owner or is_admin or is_driver):
        return jsonify({"error": "You are not authorized to view this order"}), 403
    d = order.to_dict() if (is_admin or is_driver) else _customer_order_dict(order)
    return jsonify(d)


@app.route("/api/orders/my", methods=["GET"])
@jwt_required()
def my_orders():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([_customer_order_dict(o) for o in orders])


# ── Driver Delivery Module ────────────────────────────────────────────────────


def _current_user():
    return User.query.get(int(get_jwt_identity()))


def _customer_order_dict(order):
    d = order.to_dict()
    d.pop("driver_id", None)
    d.pop("driver_phone", None)
    return d


DRIVER_TRANSITIONS = {
    "assigned": ["accepted"],
    "accepted": ["picked_up"],
    "picked_up": ["out_for_delivery"],
    "out_for_delivery": ["delivered"],
}

VALID_ORDER_STATUSES = {
    "pending", "confirmed", "preparing", "ready_for_pickup",
    "assigned", "accepted", "picked_up", "out_for_delivery", "delivered", "cancelled",
}

VALID_DRIVER_AVAILABILITY = {"available", "busy", "offline"}


@app.route("/api/driver/orders", methods=["GET"])
@jwt_required()
def driver_orders():
    driver = _current_user()
    if not driver or driver.role != "driver":
        return jsonify({"error": "Driver access required"}), 403
    orders = (
        Order.query.filter_by(driver_id=driver.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return jsonify([o.to_dict() for o in orders])


@app.route("/api/driver/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def driver_order_detail(order_id):
    driver = _current_user()
    if not driver or driver.role != "driver":
        return jsonify({"error": "Driver access required"}), 403
    order = Order.query.get_or_404(order_id)
    if order.driver_id != driver.id:
        return jsonify({"error": "You are not assigned to this order"}), 403
    return jsonify(order.to_dict())


@app.route("/api/driver/orders/<int:order_id>/accept", methods=["PUT"])
@jwt_required()
def driver_accept_order(order_id):
    driver = _current_user()
    if not driver or driver.role != "driver":
        return jsonify({"error": "Driver access required"}), 403
    order = Order.query.get_or_404(order_id)
    if order.driver_id != driver.id:
        return jsonify({"error": "You are not assigned to this order"}), 403
    if order.status != "assigned":
        return jsonify({"error": f"Order cannot be accepted from status '{order.status}'"}), 400

    order.status = "accepted"
    driver.availability = "busy"
    db.session.commit()
    return jsonify(order.to_dict())


@app.route("/api/driver/orders/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def driver_update_status(order_id):
    driver = _current_user()
    if not driver or driver.role != "driver":
        return jsonify({"error": "Driver access required"}), 403
    order = Order.query.get_or_404(order_id)
    if order.driver_id != driver.id:
        return jsonify({"error": "You are not assigned to this order"}), 403

    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").strip().lower()
    if new_status not in VALID_ORDER_STATUSES:
        return jsonify({"error": f"Invalid status '{new_status}'"}), 400

    allowed = DRIVER_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        return jsonify({
            "error": f"Invalid transition from '{order.status}' to '{new_status}'"
        }), 400

    order.status = new_status
    if new_status == "delivered":
        order.delivered_at = db.func.now()
        driver.availability = "available"
    else:
        driver.availability = "busy"
    db.session.commit()
    return jsonify(order.to_dict())


@app.route("/api/driver/availability", methods=["PUT"])
@jwt_required()
def driver_set_availability():
    driver = _current_user()
    if not driver or driver.role != "driver":
        return jsonify({"error": "Driver access required"}), 403
    data = request.get_json(silent=True) or {}
    value = (data.get("availability") or "").strip().lower()
    if value not in VALID_DRIVER_AVAILABILITY:
        return jsonify({"error": "Invalid availability value"}), 400
    driver.availability = value
    db.session.commit()
    return jsonify(driver.to_dict())


@app.route("/api/driver/location", methods=["PUT"])
@jwt_required()
def driver_update_location():
    driver = _current_user()
    if not driver or driver.role != "driver":
        return jsonify({"error": "Driver access required"}), 403
    data = request.get_json(silent=True) or {}
    try:
        lat = float(data.get("latitude"))
        lng = float(data.get("longitude"))
    except (TypeError, ValueError):
        return jsonify({"error": "Valid latitude and longitude are required"}), 400
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return jsonify({"error": "Latitude/longitude out of range"}), 400
    driver.latitude = lat
    driver.longitude = lng
    db.session.commit()
    return jsonify(driver.to_dict())


# ── Admin Order / Driver Management ───────────────────────────────────────────


@app.route("/api/admin/orders", methods=["GET"])
@jwt_required()
def admin_orders():
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    status = request.args.get("status")
    query = Order.query
    if status:
        query = query.filter_by(status=status)
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@app.route("/api/admin/orders/<int:order_id>/assign-driver", methods=["PUT"])
@jwt_required()
def assign_driver(order_id):
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json(silent=True) or {}
    driver_id = data.get("driver_id")
    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    driver = User.query.get(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404
    if driver.role != "driver":
        return jsonify({"error": "Selected user is not a driver"}), 400
    if not driver.is_active:
        return jsonify({"error": "Cannot assign an inactive driver"}), 400

    order = Order.query.get_or_404(order_id)
    if order.status not in ("confirmed", "preparing", "ready_for_pickup", "pending"):
        return jsonify({"error": f"Order is not ready for driver assignment (status: {order.status})"}), 400

    order.driver_id = driver.id
    order.status = "assigned"
    driver.availability = "busy"
    db.session.commit()
    return jsonify(order.to_dict())


@app.route("/api/admin/orders/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def admin_update_order_status(order_id):
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    order = Order.query.get_or_404(order_id)
    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").strip().lower()
    if new_status not in VALID_ORDER_STATUSES:
        return jsonify({"error": f"Invalid status '{new_status}'"}), 400

    if new_status == "cancelled" and order.status == "delivered":
        return jsonify({"error": "Cannot cancel a delivered order"}), 400

    order.status = new_status
    if new_status == "delivered":
        order.delivered_at = db.func.now()
    elif order.status != "delivered":
        order.delivered_at = None
    db.session.commit()
    return jsonify(order.to_dict())


@app.route("/api/admin/drivers", methods=["GET"])
@jwt_required()
def admin_drivers():
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    drivers = User.query.filter_by(role="driver").all()
    result = []
    for d in drivers:
        assigned = Order.query.filter_by(driver_id=d.id).count()
        delivered = Order.query.filter_by(driver_id=d.id, status="delivered").count()
        info = d.to_dict()
        info["assigned_count"] = assigned
        info["delivered_count"] = delivered
        result.append(info)
    return jsonify(result)


@app.route("/api/admin/drivers", methods=["POST"])
@jwt_required()
def create_driver():
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json(silent=True) or {}
    if not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Name, email and password are required"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    driver = User(
        name=data["name"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
        role="driver",
        availability="available",
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201


@app.route("/api/admin/drivers/<int:driver_id>/availability", methods=["PUT"])
@jwt_required()
def set_driver_availability(driver_id):
    admin = _current_user()
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json(silent=True) or {}
    value = (data.get("availability") or "").strip().lower()
    if value == "inactive":
        value = "offline"
    if value not in VALID_DRIVER_AVAILABILITY:
        return jsonify({"error": "Invalid availability value"}), 400
    driver = User.query.get_or_404(driver_id)
    if driver.role != "driver":
        return jsonify({"error": "Selected user is not a driver"}), 400
    driver.availability = value
    db.session.commit()
    return jsonify(driver.to_dict())


# ── Admin Dashboard / Stats ───────────────────────────────────────────────────


@app.route("/api/admin/stats", methods=["GET"])
@jwt_required()
def admin_stats():
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    from sqlalchemy import func

    total_users = User.query.count()
    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_drivers = User.query.filter_by(role="driver").count()

    active_deliveries = Order.query.filter(
        Order.status.in_(["assigned", "picked_up", "out_for_delivery"])
    ).count()
    available_drivers = User.query.filter_by(
        role="driver", is_active=True, availability="available"
    ).count()
    pending_orders = Order.query.filter(
        Order.status.in_(["pending", "confirmed", "preparing", "ready_for_pickup"])
    ).count()
    orders_summary = db.session.query(
        func.coalesce(func.sum(Order.total_amount), 0.0)
    ).scalar()

    category_counts = (
        db.session.query(Product.category, func.count(Product.id))
        .group_by(Product.category)
        .all()
    )
    by_category = [{"category": c, "count": int(n)} for c, n in category_counts]

    status_counts = (
        db.session.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )
    by_status = [{"status": s, "count": int(n)} for s, n in status_counts]

    low_stock = Product.query.filter(Product.stock <= 10).order_by(Product.stock.asc()).all()
    low_stock_products = [p.to_dict() for p in low_stock]

    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
    recent = [o.to_dict() for o in recent_orders]

    return jsonify({
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_drivers": total_drivers,
        "active_deliveries": active_deliveries,
        "available_drivers": available_drivers,
        "pending_orders": pending_orders,
        "revenue": round(orders_summary, 2),
        "by_category": by_category,
        "by_status": by_status,
        "low_stock": low_stock_products,
        "recent_orders": recent,
    })


# ── Admin User Management ─────────────────────────────────────────────────────


@app.route("/api/admin/users", methods=["GET"])
@jwt_required()
def list_users():
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route("/api/admin/users/<int:user_id>/toggle", methods=["PUT"])
@jwt_required()
def toggle_user(user_id):
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"error": "Cannot deactivate admin accounts"}), 400

    user.is_active = not user.is_active
    db.session.commit()
    return jsonify(user.to_dict())


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"error": "Cannot delete admin accounts"}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})


# ── Init ──────────────────────────────────────────────────────────────────────


def _ensure_columns():
    """Lightweight migration: add new columns/tables to an existing database
    without dropping it. Non-destructive for existing data."""
    try:
        from sqlalchemy import inspect as sa_inspect

        inspector = sa_inspect(db.engine)
        tables = inspector.get_table_names()

        def has_column(table, column):
            if table not in tables:
                return False
            return any(c["name"] == column for c in inspector.get_columns(table))

        with db.engine.begin() as conn:
            if "users" in tables:
                if not has_column("users", "phone"):
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT ''"))
                if not has_column("users", "latitude"):
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN latitude FLOAT"))
                if not has_column("users", "longitude"):
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN longitude FLOAT"))
            if "products" in tables:
                if not has_column("products", "original_price"):
                    conn.execute(db.text("ALTER TABLE products ADD COLUMN original_price FLOAT"))
                if not has_column("products", "discount"):
                    conn.execute(db.text("ALTER TABLE products ADD COLUMN discount INTEGER DEFAULT 0"))
                if not has_column("products", "rating"):
                    conn.execute(db.text("ALTER TABLE products ADD COLUMN rating FLOAT DEFAULT 0"))
            if "orders" in tables:
                if not has_column("orders", "payment_method"):
                    conn.execute(db.text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(30) DEFAULT 'cod'"))
                if not has_column("orders", "pincode"):
                    conn.execute(db.text("ALTER TABLE orders ADD COLUMN pincode VARCHAR(20) DEFAULT ''"))
                if not has_column("orders", "latitude"):
                    conn.execute(db.text("ALTER TABLE orders ADD COLUMN latitude FLOAT"))
                if not has_column("orders", "longitude"):
                    conn.execute(db.text("ALTER TABLE orders ADD COLUMN longitude FLOAT"))
                if not has_column("orders", "estimated_delivery"):
                    conn.execute(db.text("ALTER TABLE orders ADD COLUMN estimated_delivery TIMESTAMP"))
    except Exception as exc:
        import traceback
        traceback.print_exc()


with app.app_context():
    _ensure_columns()
    try:
        db.create_all()
    except Exception:
        db.session.rollback()

    from werkzeug.security import generate_password_hash as _gph

    seed_users = [
        {"name": "Admin", "email": "admin123", "password": "admin123@gmail.com", "role": "admin", "phone": "9000000000"},
        {"name": "Rahul", "email": "rahul@test.com", "password": "rahul123", "role": "user", "phone": "9876543210"},
        {"name": "Kumar", "email": "driver@test.com", "password": "driver123", "role": "driver", "phone": "9123456780", "availability": "available"},
    ]
    for su in seed_users:
        if not User.query.filter_by(email=su["email"]).first():
            try:
                db.session.add(User(
                    name=su["name"],
                    email=su["email"],
                    password=_gph(su["password"]),
                    role=su["role"],
                    phone=su.get("phone", ""),
                    availability=su.get("availability", "available"),
                ))
                db.session.commit()
            except Exception:
                db.session.rollback()

    if Product.query.first() is None:
        sample_products = [
            {"name": "Fresh Apples (1 kg)", "description": "Crisp and juicy red apples", "price": 120.0, "original_price": 150.0, "discount": 20, "rating": 4.6, "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300", "category": "Fruits", "stock": 50},
            {"name": "Banana (1 dozen)", "description": "Ripe yellow bananas", "price": 40.0, "original_price": 50.0, "discount": 20, "rating": 4.4, "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300", "category": "Fruits", "stock": 100},
            {"name": "Fresh Oranges (1 kg)", "description": "Sweet navel oranges", "price": 80.0, "original_price": 100.0, "discount": 20, "rating": 4.5, "image_url": "https://images.unsplash.com/photo-1547514701-42782101795e?w=300", "category": "Fruits", "stock": 60},
            {"name": "Amul Butter (100g)", "description": "Fresh creamy butter", "price": 50.0, "original_price": 55.0, "discount": 9, "rating": 4.7, "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300", "category": "Dairy", "stock": 80},
            {"name": "Full Cream Milk (1L)", "description": "Pasteurized full cream milk", "price": 60.0, "original_price": 62.0, "discount": 3, "rating": 4.8, "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300", "category": "Dairy", "stock": 120},
            {"name": "Paneer (200g)", "description": "Fresh soft cottage cheese", "price": 80.0, "original_price": 95.0, "discount": 16, "rating": 4.5, "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300", "category": "Dairy", "stock": 40},
            {"name": "Lays Classic Salted (52g)", "description": "Crispy potato chips", "price": 20.0, "original_price": 20.0, "discount": 0, "rating": 4.2, "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300", "category": "Snacks", "stock": 200},
            {"name": "Maggi Noodles (70g)", "description": "2-minute instant noodles", "price": 14.0, "original_price": 15.0, "discount": 7, "rating": 4.3, "image_url": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300", "category": "Snacks", "stock": 150},
            {"name": "Oreo Biscuits (120g)", "description": "Chocolate sandwich biscuits", "price": 30.0, "original_price": 35.0, "discount": 14, "rating": 4.6, "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300", "category": "Snacks", "stock": 100},
            {"name": "Coca-Cola (300ml)", "description": "Chilled cola drink", "price": 20.0, "original_price": 22.0, "discount": 9, "rating": 4.4, "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300", "category": "Beverages", "stock": 200},
            {"name": "Tropicana Juice (1L)", "description": "Fresh orange juice, no added sugar", "price": 99.0, "original_price": 120.0, "discount": 18, "rating": 4.5, "image_url": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300", "category": "Beverages", "stock": 50},
            {"name": "Tomato (1 kg)", "description": "Fresh ripe tomatoes", "price": 40.0, "original_price": 45.0, "discount": 11, "rating": 4.2, "image_url": "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=300", "category": "Vegetables", "stock": 80},
            {"name": "Onion (1 kg)", "description": "Fresh red onions", "price": 35.0, "original_price": 38.0, "discount": 8, "rating": 4.2, "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300", "category": "Vegetables", "stock": 90},
            {"name": "Potato (1 kg)", "description": "Fresh potatoes", "price": 30.0, "original_price": 30.0, "discount": 0, "rating": 4.1, "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=300", "category": "Vegetables", "stock": 100},
            {"name": "Surf Excel (500g)", "description": "Front-load detergent powder", "price": 55.0, "original_price": 65.0, "discount": 15, "rating": 4.5, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300", "category": "Household", "stock": 60},
            {"name": "Vim Dishwash Liquid (500ml)", "description": "Lemon dishwashing liquid", "price": 99.0, "original_price": 110.0, "discount": 10, "rating": 4.3, "image_url": "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=300", "category": "Household", "stock": 45},
        ]
        for p in sample_products:
            db.session.add(Product(**p))
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    if Category.query.first() is None:
        existing_categories = db.session.query(Product.category).distinct().all()
        for (cname,) in existing_categories:
            db.session.add(Category(name=cname, icon=""))
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)

