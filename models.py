from main import db


class Map(db.Model):
    """The individual maps"""
    __tablename__ = "Map"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    location = db.Column(db.String(500))

    size_x = db.Column(db.Integer)
    size_y = db.Column(db.Integer)
    offset_x = db.Column(db.Float)
    offset_y = db.Column(db.Float)

    pixels_x = db.Column(db.Integer)
    pixels_y = db.Column(db.Integer)

    first_up = db.Column(db.Boolean)
    radius = db.Column(db.Float)

    nodes = db.relationship("Node", back_populates="map")


class Node(db.Model):
    """The nodes on each map"""
    __tablename__ = "Node"

    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.Integer, db.ForeignKey("Map.id"))
    x = db.Column(db.Integer)
    y = db.Column(db.Integer)
    color = db.Column(db.String(120))
    note = db.Column(db.Text)

    map = db.relationship("Map", back_populates="nodes")
