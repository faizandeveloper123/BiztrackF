"""
Currency formatting utilities for the backend.
Provides consistent currency formatting across the application.
"""

from typing import Optional


def format_currency(amount: float, currency: str = "USD") -> str:
    """
    Format a numeric amount as currency string.
    
    Args:
        amount: The numeric amount to format
        currency: The currency code (e.g., 'USD', 'EUR', 'GBP')
        
    Returns:
        Formatted currency string (e.g., '$123.45', '€123.45', '£123.45')
    """
    if currency == "USD":
        return f"${amount:.2f}"
    elif currency == "EUR":
        return f"€{amount:.2f}"
    elif currency == "GBP":
        return f"£{amount:.2f}"
    elif currency == "CAD":
        return f"C${amount:.2f}"
    elif currency == "JPY":
        return f"¥{amount:.2f}"
    else:
        # Fallback for unknown currencies
        return f"{currency} {amount:.2f}"


def get_currency_symbol(currency: str = "USD") -> str:
    """
    Get the currency symbol for a given currency code.
    
    Args:
        currency: The currency code (e.g., 'USD', 'EUR', 'GBP')
        
    Returns:
        Currency symbol (e.g., '$', '€', '£')
    """
    currency_symbols = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "CAD": "C$",
        "JPY": "¥"
    }
    return currency_symbols.get(currency, currency)


def format_currency_with_symbol(amount: float, currency: str = "USD") -> str:
    """
    Format currency with proper symbol placement.
    This is an alias for format_currency for consistency.
    
    Args:
        amount: The numeric amount to format
        currency: The currency code
        
    Returns:
        Formatted currency string
    """
    return format_currency(amount, currency)
