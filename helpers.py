# this file was created by CS50, i just modified it
from currency_symbols import CurrencySymbols
from flask import redirect, render_template, session
from datetime import datetime, timedelta
from functools import wraps
import random


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


def update_session_expiration(session_life):
    session.permanent = True
    session.modified = True    
    session.expiration = datetime.now() + session_life


def username_creater(name):
    username = ""
    for letter in name:
        if letter.isalpha():
            username += letter.lower()
    number = "{:04d}".format(random.randint(0, 9999))
    username += number
    return username


# the following variable contains all the currency codes
code = ['AED', 'ARS', 'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CZK', 'DKK', 'EGP', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'KZT', 'MXN', 'MYR', 'NOK', 'NZD', 'PEN', 'PHP', 'PLN', 'QAR', 'RUB', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'UAH', 'USD', 'VND', 'ZAR']
def currency_codes():
    codes_symbols_list = []
    for i in code:
        dict = {"code":i, "symbol":CurrencySymbols.get_symbol(i)}
        codes_symbols_list.append(dict)
    return codes_symbols_list
currencies = currency_codes()

def currency(code):
    # returns the symbol of the code
    symbol = CurrencySymbols.get_symbol(code)
    return symbol

# the following variable contains all the document types, their descriptions and preview sources
doctypes = [
    {
        "type":"CHECKLIST",
        "name":"Checklist",
        "desc":"A list of items with checkboxes, used for creating task lists or tracking progress.",
        "src":"/static/previews/checklist.gif",
        "available":True,
        "currency":"hide"
    },
    {
        "type":"LIST",
        "name":"List",
        "desc":"A simple list of items, typically used for outlining or creating a sequence of items.",
        "src":"/static/previews/list.gif",
        "available":True,
        "currency":"hide"
    },
    {
        "type":"BUDGET_MONTHLY_V1",
        "name":"Monthly Budget Template v1",
        "desc":"A streamlined template designed for effortless monthly budgeting. Track income, expenses, and savings with clear categories and intuitive layouts to manage your finances efficiently.",
        "src":"/static/previews/budget_monthly_v1.gif",
        "available":True,
        "currency":"show"
    },
    {
        "type":"TEXT",
        "name":"Text",
        "desc":"Simple, Unformatted, Text-only File",
        "src":"/static/previews/text.gif",
        "available":True,
        "currency":"hide"
    },
    {
        "type":"BUDGET_YEARLY_V1",
        "name":"(Unavailable) Yearly Budget Template v1",
        "desc":"A document template for creating a yearly budget, featuring a dashboard for visualizing financial data, and sections for tracking income, expenses, and savings.",
        "src":"/static/previews/preview_demo.png",
        "available":False,
        "currency":"show"
    }
]