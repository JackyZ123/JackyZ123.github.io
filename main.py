"""DND Map Marking Site"""

from flask_sqlalchemy import SQLAlchemy
from flask import Flask, render_template


app = Flask(__name__)

# get path of database as path to this folder then to file
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///maps.db"
# app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)


from models import *


@app.route('/')
def hex():
    """page for hexgonal tiles"""

    cur_map = Map.query.filter_by(name="Chult").first()
    aspect_ratio = cur_map.pixels_y / cur_map.pixels_x * 100
    offset = [cur_map.offset_x, cur_map.offset_y]

    return render_template("hex.html",
                           map_location=cur_map.location,
                           aspect_ratio=aspect_ratio,
                           radius=cur_map.radius,
                           first_up=1 if cur_map.first_up else 0,
                           offset=offset)


if __name__ == "__main__":
    # map = Map.query.filter_by(id=2).first()
    # nodes = map.nodes
    # notes = [node.notes for node in nodes]
    # print(notes)

    app.run(debug=True)
