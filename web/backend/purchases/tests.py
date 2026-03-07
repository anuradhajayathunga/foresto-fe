from django.test import SimpleTestCase

from purchases.models import PurchaseInvoice
from purchases.services_whatsapp import (
	get_purchase_whatsapp_template_meta,
	normalize_whatsapp_phone,
)


class WhatsAppServiceTests(SimpleTestCase):
	def test_normalize_with_plus_and_spaces(self):
		phone = normalize_whatsapp_phone("+94 77 123 4567", default_country_code="94")
		self.assertEqual(phone, "94771234567")

	def test_normalize_local_number_with_default_country(self):
		phone = normalize_whatsapp_phone("0771234567", default_country_code="94")
		self.assertEqual(phone, "94771234567")

	def test_normalize_invalid_phone_returns_empty(self):
		phone = normalize_whatsapp_phone("--", default_country_code="94")
		self.assertEqual(phone, "")

	def test_template_for_request_status(self):
		title, action = get_purchase_whatsapp_template_meta(PurchaseInvoice.Status.REQUEST)
		self.assertEqual(title, "*Purchase Order Request*")
		self.assertIn("confirm item availability", action.lower())

	def test_template_for_confirmed_status(self):
		title, action = get_purchase_whatsapp_template_meta(PurchaseInvoice.Status.CONFIRMED)
		self.assertEqual(title, "*Purchase Order Confirmed*")
		self.assertIn("confirmed", action.lower())
