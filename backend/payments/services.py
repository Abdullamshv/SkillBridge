from decimal import ROUND_HALF_UP, Decimal

PLATFORM_FEE_RATE = Decimal("0.02")  # flat 2%, business side only


def calculate_fee(task_price: Decimal) -> Decimal:
    return (task_price * PLATFORM_FEE_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_business_total(task_price: Decimal) -> Decimal:
    return task_price + calculate_fee(task_price)


def calculate_student_payout(task_price: Decimal) -> Decimal:
    return task_price  # students keep 100%, always
