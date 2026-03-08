from rest_framework import serializers
from .models import Ingredient, Supplier, SupplierPerformance

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'unit', 'current_price']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class SupplierPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierPerformance
        fields = "__all__"
