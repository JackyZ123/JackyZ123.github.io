from main import db


class Map(db.Model):
    """The individual maps"""
    __tablename__ = "Map"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    location = db.Column(db.String(500))

    size_x = db.Column(db.Integer)
    size_y = db.Column(db.Integer)
    translate_x = db.Column(db.Integer)
    translate_y = db.Column(db.Integer)

    pixels_x = db.Column(db.Integer)
    pixels_y = db.Column(db.Integer)

    nodes = db.relationship("Node", back_populates="map")


class Node(db.Model):
    """The nodes on each map"""
    __tablename__ = "Node"

    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.Integer, db.ForeignKey("Map.id"))
    x = db.Column(db.Integer)
    y = db.Column(db.Integer)
    color = db.Column(db.String(120))

    map = db.relationship("Map", back_populates="nodes")
    notes = db.relationship("NodeNote", back_populates="node")


class NodeNote(db.Model):
    """The notes for a node"""
    __tablename__ = "NodeNote"

    id = db.Column(db.Integer, primary_key=True)
    nid = db.Column(db.Integer, db.ForeignKey("Node.id"))
    title = db.Column(db.String(120))
    text = db.Column(db.Text)

    node = db.relationship("Node", back_populates="notes")
