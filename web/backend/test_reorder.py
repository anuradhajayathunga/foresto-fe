import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.test import Client
from accounts.models import User
client = Client()
user = User.objects.get(email='akilaalawaththa123@gmail.com')
client.force_login(user)
response = client.get('/api/inventory/items/smart_reorder/', HTTP_X_RESTAURANT_ID='2')
with open('test_output.txt', 'w') as f:
    f.write(f'STATUS: {response.status_code}\n')
    f.write(f'CONTENT: {response.content.decode("utf-8")}\n')
