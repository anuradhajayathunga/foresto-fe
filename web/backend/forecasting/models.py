from django.db import models
from inventory.models import InventoryItem

class ForecastResult(models.Model):
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='forecasts')
    date = models.DateField()
    historical_value = models.FloatField(null=True, blank=True)
    forecasted_value = models.FloatField()
    arima_value = models.FloatField(null=True, blank=True)
    random_forest_value = models.FloatField(null=True, blank=True)
    ensemble_value = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']
        unique_together = ['inventory_item', 'date']

    def __str__(self):
        return f"Forecast for {self.inventory_item.name} on {self.date}"

class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    ALERT_TYPE_CHOICES = [
        ('stockout', 'Stockout'),
        ('overstock', 'Overstock'),
        ('spike', 'Demand Spike'),
        ('drop', 'Demand Drop'),
    ]
    
    type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    restaurant = models.ForeignKey('accounts.Restaurant', on_delete=models.CASCADE, related_name='forecasting_alerts', null=True, blank=True)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class DataUpload(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('complete', 'Complete'),
        ('failed', 'Failed'),
    ]
    
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='forecast_data/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name
