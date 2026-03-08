import os
import pandas as pd
import numpy as np
import joblib
from django.db.models import Avg
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from .models import Ingredient, Supplier, SupplierPerformance
from .serializers import IngredientSerializer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load ML models
model = joblib.load(os.path.join(BASE_DIR, "ingredients/ml/price_model.pkl"))
category_encoder = joblib.load(os.path.join(BASE_DIR, "ingredients/ml/category_encoder.pkl"))
commodity_encoder = joblib.load(os.path.join(BASE_DIR, "ingredients/ml/commodity_encoder.pkl"))

df = pd.read_csv(os.path.join(BASE_DIR, "ingredients/ml/HARTI_MASTER_DATA_Final_train.csv"))

# CRUD for Ingredients
class IngredientListView(generics.ListCreateAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer


@api_view(["POST"])
def predict_price(request):
    ingredient = request.data.get("ingredient")
    week = int(request.data.get("week"))
    year = int(request.data.get("year"))

    rows = df[df["Commodity"].str.lower() == ingredient.lower()]
    if rows.empty:
        return Response({"error": "Ingredient not found"}, status=400)

    rows = rows.reset_index(drop=True)
    index = week % len(rows)
    item = rows.iloc[index]
    prev_index = (index - 1) % len(rows)
    prev_week_avg = rows.iloc[prev_index]["Avg"]

    category = item["Category"]
    min_price = item["Min"]
    max_price = item["Max"]

    category_code = category_encoder.transform([category])[0]
    commodity_code = commodity_encoder.transform([ingredient])[0]

    X = np.array([[category_code, commodity_code, year, week, min_price, max_price, prev_week_avg]])
    prediction = model.predict(X)[0]

    return Response({"predicted_price": float(prediction)})


@api_view(["GET"])
def get_commodities(request):
    commodities = df["Commodity"].unique().tolist()
    return Response({"commodities": commodities})


@api_view(["POST"])
def menu_calc(request):
    ingredients = request.data.get("ingredients", [])
    prep_cost = float(request.data.get("prepCost") or 0)
    margin = float(request.data.get("margin") or 0)

    total_cost = 0
    for ing in ingredients:
        name = ing["name"]
        qty = float(ing["qty"])
        rows = df[df["Commodity"].str.lower() == name.lower()]
        if rows.empty:
            continue
        item = rows.iloc[0]
        avg_price = item["Avg"]
        total_cost += avg_price * qty

    total_cost += prep_cost
    profit = total_cost * (margin / 100)
    selling_price = total_cost + profit

    return Response({
        "total_cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "selling_price": round(selling_price, 2)
    })


def calculate_supplier_score(supplier):
    stats = SupplierPerformance.objects.filter(supplier=supplier).aggregate(
        avg_delivery=Avg("delivery_time"),
        avg_wastage=Avg("wastage"),
        avg_satisfaction=Avg("satisfaction")
    )

    avg_delivery = stats["avg_delivery"] or supplier.delivery_days
    avg_wastage = stats["avg_wastage"] or supplier.wastage_percent
    avg_satisfaction = stats["avg_satisfaction"] or 3

    delivery_score = 1 / avg_delivery if avg_delivery > 0 else 0
    quality_score = 1 - (avg_wastage / 100)

    score = (0.5 * avg_satisfaction + 0.3 * delivery_score + 0.2 * quality_score)
    return score



@api_view(["GET"])
def recommend_suppliers(request):
    suppliers = Supplier.objects.all()

    # ✅ group by supplier name to avoid duplicates
    grouped = {}
    for s in suppliers:
        if s.name not in grouped:
            grouped[s.name] = []
        grouped[s.name].append(s)

    result = []
    for name, records in grouped.items():
        # average values if multiple records exist
        avg_days = sum(r.delivery_days for r in records) / len(records)
        avg_wastage = sum(r.wastage_percent for r in records) / len(records)

        # use first supplier object for satisfaction lookup
        score = calculate_supplier_score(records[0])

        result.append({
            "name": name,
            "delivery_days": avg_days,
            "wastage_percent": avg_wastage,
            "score": score
        })

    result.sort(key=lambda x: x["score"], reverse=True)
    return Response(result)



@api_view(["POST"])
def add_supplier(request):
    name = request.data.get("name")
    delivery_days = request.data.get("delivery_days")
    wastage_percent = request.data.get("wastage_percent")

    supplier = Supplier.objects.create(
        name=name,
        delivery_days=delivery_days,
        wastage_percent=wastage_percent
    )
    return Response({"message": "Supplier added successfully", "supplier": supplier.name})
