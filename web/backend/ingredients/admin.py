from django.contrib import admin
from .models import Ingredient, IngredientPriceHistory, SupplierPrice, Supplier, SupplierPerformance

admin.site.register(Ingredient)
admin.site.register(IngredientPriceHistory)
admin.site.register(SupplierPrice)
admin.site.register(Supplier)
admin.site.register(SupplierPerformance)
