from datetime import datetime
import re
import unicodedata


def generate_order_number(last_id: int = 0) -> str:
    """Generate unique order number like ORD-20260911-0001"""
    today = datetime.now().strftime("%Y%m%d")
    seq = str(last_id + 1).zfill(4)
    return f"ORD-{today}-{seq}"


def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text"""
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    # Lowercase and replace spaces/special chars with hyphens
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    return text


def format_currency(amount: float, currency: str = "Rs.") -> str:
    """Format amount as Sri Lankan Rupee"""
    return f"{currency} {amount:,.2f}"


def calculate_final_price(price: float, discount_percent: float) -> float:
    """Calculate final price after discount"""
    if discount_percent <= 0:
        return price
    discount_amount = price * (discount_percent / 100)
    return round(price - discount_amount, 2)


def calculate_delivery_charge(
    subtotal: float,
    free_delivery_above: float = 5000,
    delivery_charge: float = 350,
    delivery_enabled: bool = True,
) -> float:
    """Calculate delivery charge based on settings"""
    if not delivery_enabled:
        return 0
    if subtotal >= free_delivery_above:
        return 0
    return delivery_charge
