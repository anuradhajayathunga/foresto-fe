from rest_framework import serializers
from .models import ForecastResult, Alert, DataUpload

class ForecastResultSerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='inventory_item.name')
    
    class Meta:
        model = ForecastResult
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'

class DataUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataUpload
        fields = '__all__'
