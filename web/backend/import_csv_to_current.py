import os
import django
import csv
from datetime import datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Restaurant
from inventory.models import InventoryItem, StockMovement
from menu.models import Category, MenuItem, RecipeLine
from purchases.models import PurchaseInvoice, PurchaseLine, Supplier
from sales.models import Sale, SaleItem

User = get_user_model()

def import_data():
    base_dir = r"c:\Users\MOTech\Downloads\RP\my\foresto-be"

    # Assume we attach all data to the first restaurant created by the user (e.g. "Supplier")
    # Alternatively, create one if it doesn't exist
    restaurant = Restaurant.objects.first()
    if not restaurant:
        restaurant = Restaurant.objects.create(name="Demo Restaurant")
        print("Created new Demo Restaurant")
    else:
        print(f"Using existing restaurant: {restaurant.name}")

    user = User.objects.first()

    # 1. Ingredients -> InventoryItem
    print("Importing Ingredients...")
    ingredient_map = {}
    with open(os.path.join(base_dir, 'ingredients.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            unit_map = {'kg': 'KG', 'g': 'G', 'l': 'L', 'ml': 'ML', 'pcs': 'PCS'}
            unit = unit_map.get(row['base_unit'].lower(), 'PCS')
            cost = Decimal(row['cost_per_unit'])
            item, _ = InventoryItem.objects.get_or_create(
                sku=f"ING-{row['ingredient_id']}",
                restaurant=restaurant,
                defaults={
                    'name': row['name'],
                    'unit': unit,
                    'cost_per_unit': cost,
                    'reorder_level': Decimal("10.00") # default
                }
            )
            ingredient_map[str(row['ingredient_id'])] = item

    # 2. Inventory -> InventoryItem (update stock)
    print("Importing Inventory...")
    with open(os.path.join(base_dir, 'inventory.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ing_id = str(row['ingredient_id'])
            if ing_id in ingredient_map:
                item = ingredient_map[ing_id]
                item.current_stock = Decimal(row['qty_on_hand'])
                item.save(update_fields=["current_stock"])

    # 3. Suppliers
    print("Importing Suppliers...")
    supplier_map = {}
    with open(os.path.join(base_dir, 'suppliers.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            s, _ = Supplier.objects.get_or_create(
                restaurant=restaurant,
                name=row['name'],
                defaults={
                    'email': row['email'],
                    'phone': row['phone'],
                    'address': row['location']
                }
            )
            supplier_map[str(row['supplier_id'])] = s

    # 4. Dishes -> Category & MenuItem
    print("Importing Menu Items...")
    cat, _ = Category.objects.get_or_create(name="Imported Dishes", slug="imported-dishes", restaurant=restaurant)
    dish_map = {}
    with open(os.path.join(base_dir, 'dishes.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dish, _ = MenuItem.objects.get_or_create(
                slug=f"dish-{row['dish_id']}",
                restaurant=restaurant,
                category=cat,
                defaults={
                    'name': row['name'],
                    'price': Decimal("10.00") # Default price
                }
            )
            dish_map[str(row['dish_id'])] = dish

    # 5. Recipes -> RecipeLine
    print("Importing Recipes...")
    with open(os.path.join(base_dir, 'recipes.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dish_id = str(row['dish_id'])
            ing_id = str(row['ingredient_id'])
            if dish_id in dish_map and ing_id in ingredient_map:
                RecipeLine.objects.get_or_create(
                    menu_item=dish_map[dish_id],
                    ingredient=ingredient_map[ing_id],
                    defaults={
                        'qty': Decimal(row['qty_per_serving'])
                    }
                )

    # 6. Orders -> PurchaseInvoice & PurchaseLine
    print("Importing Purchase Orders...")
    with open(os.path.join(base_dir, 'orders.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            supp_id = str(row['supplier_id'])
            if supp_id not in supplier_map: continue
            
            invoice, _ = PurchaseInvoice.objects.get_or_create(
                invoice_no=f"PO-{row['po_id']}",
                restaurant=restaurant,
                defaults={
                    'supplier': supplier_map[supp_id],
                    'invoice_date': row['order_date'],
                    'status': 'POSTED' if row['status'].lower() == 'delivered' else 'DRAFT',
                    'created_by': user
                }
            )
            ing_id = str(row['ingredient_id'])
            if ing_id in ingredient_map:
                item = ingredient_map[ing_id]
                PurchaseLine.objects.get_or_create(
                    invoice=invoice,
                    restaurant=restaurant,
                    item=item,
                    defaults={
                        'qty': Decimal(row['qty']),
                        'unit_cost': item.cost_per_unit,
                        'line_total': Decimal(row['qty']) * item.cost_per_unit
                    }
                )

    # 7. Sales -> Sale & SaleItem
    print("Importing Sales...")
    with open(os.path.join(base_dir, 'sales.csv'), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dish_id = str(row['dish_id'])
            if dish_id not in dish_map: continue
            dish = dish_map[dish_id]
            
            sale_date = row['sale_date']
            qty = int(row['qty'])
            price = dish.price
            
            sale, _ = Sale.objects.get_or_create(
                import_ref=f"SALE-{row['restaurant_id']}-{dish_id}-{sale_date}",
                restaurant=restaurant,
                defaults={
                    'created_by': user,
                    'sold_at': sale_date,
                    'status': 'PAID',
                    'total': price * qty,
                    'inventory_deducted': True # already deducted from historical
                }
            )
            # update created_at to bypass auto_now_add
            Sale.objects.filter(id=sale.id).update(created_at=sale_date)

            SaleItem.objects.get_or_create(
                sale=sale,
                restaurant=restaurant,
                menu_item=dish,
                defaults={
                    'name': dish.name,
                    'qty': qty,
                    'unit_price': price,
                    'line_total': price * qty
                }
            )

    print("Data import complete!")

if __name__ == '__main__':
    import_data()
