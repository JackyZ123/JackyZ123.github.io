"""DND Map Marking Site"""

from flask_sqlalchemy import SQLAlchemy
from flask import Flask, render_template, request, redirect


app = Flask(__name__)

# get path of database as path to this folder then to file
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///maps.db"
# app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)


from models import *


@app.route('/', methods=["GET"])
def hex():
    """page for hexgonal tiles"""

    map_name = "Chult"

    cur_map = Map.query.filter_by(name="Chult").first()
    aspect_ratio = cur_map.pixels_y / cur_map.pixels_x
    offset = [cur_map.offset_x, cur_map.offset_y]

    map_dimensions = [cur_map.size_x, cur_map.size_y]

    # get tile data
    tiles = [[node.id,
              node.x,
              node.y,
              node.color,
              node.note] for node in cur_map.nodes]

    return render_template("hex.html",
                           map_location=cur_map.location,
                           aspect_ratio=aspect_ratio,
                           radius=cur_map.radius,
                           first_up=1 if cur_map.first_up else 0,
                           offset=offset,
                           node_dimensions=map_dimensions,
                           tiles=tiles,
                           map_name=map_name)


@app.route("/update_color", methods=["POST"])
def update_color():
    """updates the color of a tile in the database"""
    # get new color
    new_color = request.form.get("color")
    hex_id = request.form.get("id")

    if int(hex_id) > -1:
        # send to database
        data = Node.query.filter_by(id=hex_id).all()
        if len(data) > 0:
            node = data[0]
            node.color = new_color
            db.session.commit()

    return redirect("/")


@app.route("/update_note", methods=["POST"])
def update_note():
    """updates the note of a tile in the database"""
    # get new color
    note_id = request.form.get("id")
    new_text = request.form.get("text")

    if int(note_id) > -1:
        # send to database
        data = Node.query.filter_by(id=note_id).all()
        if len(data) > 0:
            note = data[0]
            note.note = new_text
            db.session.commit()

    return redirect("/")


@app.route("/new_tile", methods=["POST"])
def new_tile():
    """make new tile and send to database"""
    # get info
    map_name = request.form.get("map")
    color = request.form.get("color")
    x, y = [request.form.get("x"), request.form.get("y")]
    map_id = Map.query.filter_by(name=map_name).first().id

    # make node
    node = Node(x=x, y=y, color=color, mid=map_id, note="")
    db.session.add(node)
    db.session.commit()

    return str(node.id)


@app.route("/delete_node", methods=["POST"])
def delete_node():
    """deletes all the notes in a node and the node"""
    tile_id = int(request.form.get("id"))

    if tile_id > -1:
        tile = Node.query.filter_by(id=tile_id).all()

        if len(tile) > 0:
            tile = tile[0]

            db.session.delete(tile)
            db.session.commit()

    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)
