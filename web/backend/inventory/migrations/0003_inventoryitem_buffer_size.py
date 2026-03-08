from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0002_alter_inventoryitem_sku_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="inventoryitem",
            name="buffer_size",
            field=models.DecimalField(decimal_places=2, default="0.00", max_digits=12),
        ),
    ]
