from django.db import models

class Ingredient(models.Model):
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=20)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True)

    def __str__(self):
        return self.name


class IngredientPriceHistory(models.Model):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='history')
    date = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    season = models.CharField(max_length=100, blank=True)
    demand_level = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ingredient.name} - {self.date}"


class SupplierPrice(models.Model):
    supplier_name = models.CharField(max_length=100)
    ingredient_name = models.CharField(max_length=100)
    offered_price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    delivery_time = models.IntegerField(help_text="Delivery time in days")

    def __str__(self):
        return f"{self.supplier_name} - {self.ingredient_name} ({self.offered_price})"


class Supplier(models.Model):
    name = models.CharField(max_length=255, unique=True)
    delivery_days = models.IntegerField()
    wastage_percent = models.FloatField()

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        super().save(*args, **kwargs)



class SupplierPerformance(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    delivery_time = models.FloatField()
    wastage = models.FloatField()
    satisfaction = models.IntegerField()
