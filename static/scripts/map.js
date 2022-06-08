var mousePos = { x: 0, y: 0 };
var bg_align = { x: 0, y: 0 };
var zoom_percent = 100;

var current_node;

var background = document.getElementById("Background");

var highlight_index = { x: -1, y: -1 };

var hex_radius;
var hex_height;

function SetHexRadius(radius) {
    hex_radius = radius;
    hex_height = Math.sqrt(3) * radius;
}

// get mouse position

background.onmousemove = handleMouseMove;
setInterval(getMousePosition, 50); // setInterval repeats every X ms

function moveScreen() {
    setBackgroundCorner();
    setBackgroundZoom();
    drawHex();
    HighlightHex("pink");
    SetNewPanel(highlight_index);
    reloadHexes();
}

function handleMouseMove(event) {
    var dot, eventDoc, doc, body, pageX, pageY;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop || body && body.scrollTop || 0) -
            (doc && doc.clientTop || body && body.clientTop || 0);
    }

    last_pos = getMousePosition();

    mousePos = {
        x: event.pageX,
        y: event.pageY
    };

    if (is_panning) {
        // move the background
        var delta_pos = { x: mousePos.x - last_pos.x, y: mousePos.y - last_pos.y };

        bg_align = { x: bg_align.x + delta_pos.x, y: bg_align.y + delta_pos.y };

        moveScreen();
    }

    drawHex();
    SetNewPanel(highlight_index);
}

function getMousePosition() {
    return mousePos;
}

function setBackgroundCorner() {
    background.style.top = bg_align.y + "px";
    background.style.left = bg_align.x + "px";
}

function setBackgroundZoom() {
    background.style.width = zoom_percent * width / 100 + "px";
    background.style.height = zoom_percent * height / 100 + "px";

    background.width = zoom_percent * width / 100 + "px";
    background.height = zoom_percent * height / 100 * "px";
}

// zoom
background.addEventListener("wheel", (event) => {
    var change = event.deltaY / 12.5;
    var pos = getMousePosition();

    // get the zoom change
    var last_zoom = zoom_percent;
    zoom_percent /= (change + 100) / 100;

    zoom_percent = Math.max(zoom_percent, 25);
    zoom_percent = Math.min(zoom_percent, 750)

    change = zoom_percent - last_zoom;

    var delta_pos = { x: bg_align.x - pos.x, y: bg_align.y - pos.y };
    var distance = { x: delta_pos.x * (zoom_percent / last_zoom - 1), y: delta_pos.y * (zoom_percent / last_zoom - 1) };
    bg_align = { x: bg_align.x + distance.x, y: bg_align.y + distance.y };

    moveScreen();
    drawHex();

});

// pan image
var is_panning = false;

background.addEventListener("mousedown", (event) => {
    if (event.button == 1) {
        is_panning = true;
    }

    if (event.button == 0) {
        // console.log("Node: " + current_node.x + " " + current_node.y);

        is_panning = true;

        highlight_index = current_node;
        HighlightHex("pink");
        SetNewPanel(current_node);

        panel.setAttribute("style", "display:flex;");

        if (current_node.x == -1 && current_node.y == -1) {
            if (document.getElementById("tile highlight") != null) {
                document.getElementById("tile highlight").remove();
            }
        }

        document.innerHTML = document.innerHTML;
    }
});

window.addEventListener("mouseup", (event) => {
    if (event.button == 1 || event.button == 0) {
        is_panning = false;
    }
});

function GetDistance(pos1, pos2) {
    var delta_x = pos2.x - pos1.x;
    var delta_y = pos2.y - pos1.y;

    return Math.sqrt(delta_x * delta_x + delta_y * delta_y);
}

function MapToScreenPosition(pos) {
    pos = {
        x: (pos.x) * (zoom_percent / 100) + bg_align.x,
        y: (pos.y) * (zoom_percent / 100) + bg_align.y
    };

    return pos;
}

function ScreenToMapPosition(pos) {
    pos = {
        x: (pos.x - bg_align.x) / (zoom_percent / 100),
        y: (pos.y - bg_align.y) / (zoom_percent / 100)
    };

    return pos;
}

// get hexagon the mouse is over
function closestHex() {
    var pos = getMousePosition();
    // get position relative to top left corner (0,0)
    pos = ScreenToMapPosition(pos);

    // console.log("Mouse Pos: " + pos.x + " " + pos.y);

    var top_left_x = Math.floor((pos.x - offset.x) / (1.5 * hex_radius * x_mult));

    var top_left_hex_index;

    if ((top_left_x % 2 == 0 && first_up) || (top_left_x % 2 == 1 && !first_up)) {
        top_left_hex_index = {
            x: top_left_x,
            y: Math.floor((pos.y - offset.y - 0.5 * hex_height) / hex_height)
        };
    }
    else {
        top_left_hex_index = {
            x: top_left_x,
            y: Math.floor((pos.y - offset.y) / hex_height)
        };
    }

    var top_left_hex = top_left_hex_index;

    if ((top_left_hex.x % 2 == 0 && first_up) || (top_left_hex.x % 2 == 1 && !first_up)) {
        // no extra y offset
        // this is position relative to top corner
        top_left_hex = {
            x: top_left_hex.x * 1.5 * hex_radius * x_mult + offset.x,
            y: top_left_hex.y * hex_height + hex_height / 2 + offset.y
        };
    }
    else {
        top_left_hex = {
            x: top_left_hex.x * 1.5 * hex_radius * x_mult + offset.x,
            y: top_left_hex.y * hex_height + offset.y
        };
    }

    // add zoom percent
    top_left_hex = {
        x: top_left_hex.x * zoom_percent / 100,
        y: top_left_hex.y * zoom_percent / 100
    };

    var right_hex = {
        x: top_left_hex.x + 1.5 * hex_radius * x_mult * zoom_percent / 100,
        y: top_left_hex.y + 0.5 * hex_height * zoom_percent / 100
    };

    var bottom_left_hex = {
        x: top_left_hex.x,
        y: top_left_hex.y + hex_height * zoom_percent / 100
    };

    pos = {
        x: pos.x * zoom_percent / 100,
        y: pos.y * zoom_percent / 100
    };

    var closest_centre = top_left_hex;

    // console.log("Mouse Pos: " + pos.x + " " + pos.y);
    // console.log("Top Left Pos: " + top_left_hex.x + " " + top_left_hex.y);
    // console.log("Top Right Pos: " + top_right_hex.x + " " + top_right_hex.y);
    // console.log("Bottom Left Pos: " + bottom_left_hex.x + " " + bottom_left_hex.y);
    // console.log("Bottom Right Pos: " + bottom_right_hex.x + " " + bottom_right_hex.y);

    var closest_distance = GetDistance(pos, top_left_hex);
    current_node = top_left_hex_index;

    if (GetDistance(pos, right_hex) < closest_distance) {
        closest_distance = GetDistance(pos, right_hex);
        closest_centre = right_hex;

        if ((top_left_hex_index.x % 2 == 0 && first_up) || (top_left_hex_index.x % 2 == 1 && !first_up)) {
            // no extra y offset
            // this is position relative to top corner
            current_node = {
                x: top_left_hex_index.x + 1,
                y: top_left_hex_index.y + 1
            };
        }
        else {
            current_node = {
                x: top_left_hex_index.x + 1,
                y: top_left_hex_index.y
            };
        }
    }
    if (GetDistance(pos, bottom_left_hex) < closest_distance) {
        closest_distance = GetDistance(pos, bottom_left_hex);
        closest_centre = bottom_left_hex;
        current_node = {
            x: top_left_hex_index.x,
            y: top_left_hex_index.y + 1
        };
    }

    if (current_node.x < 1 || current_node.x > map_dimensions.x || current_node.y < 1 || current_node.y > map_dimensions.y) {
        current_node = {
            x: -1,
            y: -1
        };
        return current_node;
    }

    return closest_centre;
    // return right_hex;
}

function drawHex() {
    var centre, radius;
    radius = hex_radius * zoom_percent / 100;
    centre = closestHex();

    if (document.getElementById("cursor marker") != null) {
        document.getElementById("cursor marker").remove();
    }

    if (centre.x == -1 && centre.y == -1) {
        background.innerHTML = background.innerHTML;
        return;
    }

    var marker = document.createElement("polygon");

    var height = Math.sqrt(3) * radius / 2;

    marker.setAttribute('points',
        (centre.x - radius * x_mult) + "," + centre.y + " " +
        (centre.x - radius * x_mult / 2) + "," + (centre.y + height) + " " +
        (centre.x + radius * x_mult / 2) + "," + (centre.y + height) + " " +
        (centre.x + radius * x_mult) + "," + centre.y + " " +
        (centre.x + radius * x_mult / 2) + "," + (centre.y - height) + " " +
        (centre.x - radius * x_mult / 2) + "," + (centre.y - height));
    marker.setAttribute("id", "cursor marker");
    marker.setAttribute("style", "fill:None;stroke:black;stroke-width:3");


    background.appendChild(marker);

    background.innerHTML = background.innerHTML;
}

function GetColor(color) {
    if (color == "none") {
        return "rgb(0,0,0,0)";
    }
    else if (color == "red") {
        return "rgb(255,0,0,0.5)"
    }
    else if (color == "orange") {
        return "rgb(255,165,0,0.5)"
    }
    else if (color == "yellow") {
        return "rgb(255,255,0,0.5)"
    }
    else if (color == "green") {
        return "rgb(0,255,0,0.5)"
    }
    else if (color == "cyan") {
        return "rgb(0,255,255,0.5)"
    }
    else if (color == "blue") {
        return "rgb(0,0,255,0.5)"
    }
    else if (color == "purple") {
        return "rgb(255,0,255,0.5)"
    }
    else if (color == "black") {
        return "rgb(0,0,0,0.7)"
    }
    else if (color == "grey") {
        return "rgb(80,80,80,0.7)"
    }
    else if (color = "pink") {
        return "rgb(255,192,203,0.8)";
    }
    else {
        return "rgb(0,0,0,1)"
    }
}

function HighlightHex(color) {
    var centre, radius, height;
    radius = hex_radius;
    height = Math.sqrt(3) * radius;
    centre = highlight_index;

    if (centre.x == -1 && centre.y == -1) {
        return;
    }

    if ((centre.x % 2 == 0 && first_up) || (centre.x % 2 == 1 && !first_up)) {
        // no extra y offset
        // this is position relative to top corner
        centre = {
            x: centre.x * 1.5 * radius * x_mult + offset.x,
            y: centre.y * height + height / 2 + offset.y
        };
    }
    else {
        centre = {
            x: centre.x * 1.5 * radius * x_mult + offset.x,
            y: centre.y * height + offset.y
        };
    }

    centre = {
        x: centre.x * zoom_percent / 100,
        y: centre.y * zoom_percent / 100
    };

    if (document.getElementById("tile highlight") != null) {
        document.getElementById("tile highlight").remove();
    }



    var marker = document.createElement("polygon");

    var radius = radius * zoom_percent / 100;
    var height = Math.sqrt(3) * radius / 2;

    marker.setAttribute('points',
        (centre.x - radius * x_mult) + "," + centre.y + " " +
        (centre.x - radius * x_mult / 2) + "," + (centre.y + height) + " " +
        (centre.x + radius * x_mult / 2) + "," + (centre.y + height) + " " +
        (centre.x + radius * x_mult) + "," + centre.y + " " +
        (centre.x + radius * x_mult / 2) + "," + (centre.y - height) + " " +
        (centre.x - radius * x_mult / 2) + "," + (centre.y - height));
    marker.setAttribute("id", "tile highlight");
    marker.setAttribute("style", "fill:" + GetColor(color) + ";stroke-width:3");


    background.appendChild(marker);

    background.innerHTML = background.innerHTML;
}
