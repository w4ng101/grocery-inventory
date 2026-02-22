import os
import sqlite3
import tempfile
import pytest

import app as grocery_app


@pytest.fixture
def client(monkeypatch):
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    monkeypatch.setattr(grocery_app, "DATABASE", db_path)

    grocery_app.app.config["TESTING"] = True
    grocery_app.app.config["SECRET_KEY"] = "test-secret"
    with grocery_app.app.test_client() as http_client:
        yield http_client, db_path

    os.close(db_fd)
    os.unlink(db_path)


def _query(db_path, sql, params=()):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute(sql, params).fetchone()
    conn.close()
    return row


def test_index_empty(client):
    http_client, _ = client
    response = http_client.get("/")
    assert response.status_code == 200
    assert b"No items in inventory yet" in response.data


def test_add_item(client):
    http_client, _ = client
    response = http_client.post(
        "/add",
        data={"name": "Apples", "quantity": "6", "unit": "pcs", "category": "Produce"},
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Apples" in response.data


def test_add_item_missing_name(client):
    http_client, _ = client
    response = http_client.post(
        "/add",
        data={"name": "", "quantity": "1", "unit": "kg", "category": "Produce"},
        follow_redirects=True,
    )
    assert b"Name is required" in response.data


def test_add_item_invalid_quantity(client):
    http_client, _ = client
    response = http_client.post(
        "/add",
        data={"name": "Milk", "quantity": "abc", "unit": "L", "category": "Dairy"},
        follow_redirects=True,
    )
    assert b"Quantity must be a number" in response.data


def test_edit_item(client):
    http_client, db_path = client
    http_client.post(
        "/add",
        data={"name": "Bread", "quantity": "1", "unit": "loaf", "category": "Bakery"},
        follow_redirects=True,
    )
    item = _query(db_path, "SELECT id FROM items WHERE name='Bread'")

    response = http_client.post(
        f"/edit/{item['id']}",
        data={"name": "Sourdough Bread", "quantity": "2", "unit": "loaf", "category": "Bakery"},
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Sourdough Bread" in response.data


def test_edit_nonexistent_item(client):
    http_client, _ = client
    response = http_client.get("/edit/9999", follow_redirects=True)
    assert b"Item not found" in response.data


def test_delete_item(client):
    http_client, db_path = client
    http_client.post(
        "/add",
        data={"name": "Eggs", "quantity": "12", "unit": "pcs", "category": "Dairy"},
        follow_redirects=True,
    )
    item = _query(db_path, "SELECT id FROM items WHERE name='Eggs'")

    response = http_client.post(f"/delete/{item['id']}", follow_redirects=True)
    assert response.status_code == 200
    assert b"removed from inventory" in response.data
    assert b"No items in inventory yet" in response.data


def test_add_item_default_category(client):
    http_client, db_path = client
    response = http_client.post(
        "/add",
        data={"name": "Salt", "quantity": "1", "unit": "box", "category": ""},
        follow_redirects=True,
    )
    assert b"Salt" in response.data
    item = _query(db_path, "SELECT category FROM items WHERE name='Salt'")
    assert item["category"] == "Other"
