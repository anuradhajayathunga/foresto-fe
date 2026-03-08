from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from accounts.models import Restaurant
from inventory.services_buffer import update_buffer_sizes_from_waste_rates
from sales.business_rules import (
    get_menu_item_ids_for_waste_sync_for_date,
    sync_auto_unsold_waste_for_date,
)


class Command(BaseCommand):
    help = (
        "Sync unsold waste for each restaurant for a target date. "
        "Designed to run daily at 2:00 AM for the previous business day."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            default=None,
            help="Target date in YYYY-MM-DD format. Defaults to yesterday in local timezone.",
        )
        parser.add_argument(
            "--restaurant-id",
            action="append",
            type=int,
            dest="restaurant_ids",
            help="Limit sync to specific restaurant id(s). Can be provided multiple times.",
        )
        parser.add_argument(
            "--include-inactive",
            action="store_true",
            help="Include inactive restaurants.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be synced without writing changes.",
        )
        parser.add_argument(
            "--skip-buffer-update",
            action="store_true",
            help="Skip automatic buffer_size recalculation after waste sync.",
        )
        parser.add_argument(
            "--buffer-lookback-days",
            type=int,
            default=14,
            help="Lookback window in days used for automatic buffer updates.",
        )
        parser.add_argument(
            "--buffer-days",
            type=int,
            default=3,
            help="How many days of average waste to keep as buffer_size.",
        )
        parser.add_argument(
            "--buffer-alpha",
            type=float,
            default=0.6,
            help="Smoothing factor (0-1) for buffer updates.",
        )

    def handle(self, *args, **options):
        target_date = self._parse_target_date(options.get("date"))
        dry_run = bool(options.get("dry_run"))
        update_buffers = not bool(options.get("skip_buffer_update"))
        buffer_lookback_days = int(options.get("buffer_lookback_days") or 14)
        buffer_days = int(options.get("buffer_days") or 3)
        buffer_alpha = float(options.get("buffer_alpha") or 0.6)
        include_inactive = bool(options.get("include_inactive"))
        restaurant_ids = options.get("restaurant_ids") or []

        restaurants_qs = Restaurant.objects.all().order_by("id")
        if not include_inactive:
            restaurants_qs = restaurants_qs.filter(is_active=True)
        if restaurant_ids:
            restaurants_qs = restaurants_qs.filter(id__in=restaurant_ids)

        restaurant_count = restaurants_qs.count()
        if restaurant_count == 0:
            self.stdout.write(self.style.WARNING("No restaurants matched the provided filters."))
            return

        self.stdout.write(
            f"Starting unsold waste sync for {restaurant_count} restaurant(s) on {target_date}"
            f" (dry_run={dry_run})."
        )

        processed = 0
        skipped = 0
        buffer_updates_total = 0

        for restaurant in restaurants_qs.iterator():
            menu_item_ids = get_menu_item_ids_for_waste_sync_for_date(
                restaurant_id=restaurant.id,
                target_date=target_date,
            )
            if not menu_item_ids:
                skipped += 1
                self.stdout.write(f"- restaurant_id={restaurant.id}: no production/sales/waste items for {target_date}, skipped")
                continue

            if dry_run:
                self.stdout.write(
                    f"- restaurant_id={restaurant.id}: would sync {len(menu_item_ids)} menu item(s) for {target_date}"
                )
                processed += 1
                continue

            sync_auto_unsold_waste_for_date(
                restaurant_id=restaurant.id,
                target_date=target_date,
                menu_item_ids=menu_item_ids,
            )

            if update_buffers:
                buffer_result = update_buffer_sizes_from_waste_rates(
                    restaurant_id=restaurant.id,
                    lookback_days=buffer_lookback_days,
                    buffer_days=buffer_days,
                    alpha=buffer_alpha,
                    dry_run=dry_run,
                )
                buffer_updates_total += int(buffer_result.get("updated", 0))

            processed += 1
            self.stdout.write(
                f"- restaurant_id={restaurant.id}: synced {len(menu_item_ids)} menu item(s) for {target_date}"
                + (
                    f"; buffer updates={buffer_result.get('updated', 0)}"
                    if update_buffers
                    else ""
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished unsold waste sync. processed={processed}, skipped={skipped}, target_date={target_date}."
                + (
                    f" total_buffer_updates={buffer_updates_total}."
                    if update_buffers
                    else ""
                )
            )
        )

    def _parse_target_date(self, date_str):
        if not date_str:
            return timezone.localdate() - timedelta(days=1)

        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError as exc:
            raise CommandError("Invalid --date format. Use YYYY-MM-DD.") from exc
