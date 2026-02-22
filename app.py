import sqlite3
import os
from flask import Flask, render_template, request, redirect, url_for, flash, g

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")

DATABASE = os.environ.get("DATABASE", "grocery.db")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity REAL NOT NULL DEFAULT 0,
            unit TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'Other'
        )
        """
    )
    db.commit()


@app.before_request
def setup():
    init_db()


@app.route("/")
def index():
    db = get_db()
    items = db.execute(
        "SELECT * FROM items ORDER BY category, name"
    ).fetchall()
    return render_template("index.html", items=items)


@app.route("/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":
        name = request.form["name"].strip()
        quantity = request.form["quantity"].strip()
        unit = request.form["unit"].strip()
        category = request.form["category"].strip() or "Other"
        if not name:
            flash("Name is required.", "error")
            return render_template("form.html", item=None)
        try:
            quantity = float(quantity) if quantity else 0
        except ValueError:
            flash("Quantity must be a number.", "error")
            return render_template("form.html", item=None)
        db = get_db()
        db.execute(
            "INSERT INTO items (name, quantity, unit, category) VALUES (?, ?, ?, ?)",
            (name, quantity, unit, category),
        )
        db.commit()
        flash(f"'{name}' added to inventory.", "success")
        return redirect(url_for("index"))
    return render_template("form.html", item=None)


@app.route("/edit/<int:item_id>", methods=["GET", "POST"])
def edit(item_id):
    db = get_db()
    item = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if item is None:
        flash("Item not found.", "error")
        return redirect(url_for("index"))
    if request.method == "POST":
        name = request.form["name"].strip()
        quantity = request.form["quantity"].strip()
        unit = request.form["unit"].strip()
        category = request.form["category"].strip() or "Other"
        if not name:
            flash("Name is required.", "error")
            return render_template("form.html", item=item)
        try:
            quantity = float(quantity) if quantity else 0
        except ValueError:
            flash("Quantity must be a number.", "error")
            return render_template("form.html", item=item)
        db.execute(
            "UPDATE items SET name=?, quantity=?, unit=?, category=? WHERE id=?",
            (name, quantity, unit, category, item_id),
        )
        db.commit()
        flash(f"'{name}' updated.", "success")
        return redirect(url_for("index"))
    return render_template("form.html", item=item)


@app.route("/delete/<int:item_id>", methods=["POST"])
def delete(item_id):
    db = get_db()
    item = db.execute("SELECT name FROM items WHERE id = ?", (item_id,)).fetchone()
    if item:
        db.execute("DELETE FROM items WHERE id = ?", (item_id,))
        db.commit()
        flash(f"'{item['name']}' removed from inventory.", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "0") == "1")
