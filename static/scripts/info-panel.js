var panel = document.getElementById("info-panel");
var panel_contents = document.getElementById("tile-contents");
var color_buttons = document.getElementById("color-button");
var delete_buttons = document.getElementById("delete");
var panel_notes = document.getElementById("notes");

var tile_title = document.getElementById("tile-title");

var is_over_info = false;

panel.addEventListener("mouseenter", (event) => {
    if (event.currentTarget == panel) {

    }
})

function getStringPosition(pos) {
    var stringPos = "tile_data_list";

    for (var i = 0; i < pos.length; i++) {
        stringPos = stringPos + "[" + pos[i] + "]";
    }

    return stringPos;
}

function addElement(pos, element) {
    if (element == '') {
        return false;
    }

    var check = Number(element);

    var is_num = Number.isInteger(check);

    if (is_num) {
        eval(getStringPosition(pos) + ".push(" + element + ")");
    }
    else {
        element = element.substring(2, element.length - 2);

        while (element.includes("\n")) {
            element = element.replace("\n", "\\n");
        }

        eval(getStringPosition(pos) + ".push('" + element + "')");
    }

    return true
}

function SetTileData(tiles) {
    tiles = tiles.slice(1, -1);
    tiles = tiles.replace(/&#39;/g, "🬀");

    var position = [0];
    var start_pos = 0;
    var is_closed = true;

    for (var i = 0; i < tiles.length; i++) {
        var character = tiles[i];

        if (character == "[") {
            // we need to add a list
            eval(getStringPosition(position.slice(0, -1)) + ".push([])");
            start_pos = i + 1;
            position.push(0);
        }
        else if (character == "]") {
            // we need to add a list
            element = tiles.slice(start_pos, i);

            addElement(position.slice(0, -1), tiles.slice(start_pos, i));

            start_pos = i + 1;

            position = position.slice(0, -1);
            position[position.length - 1]++;
        }
        else if (character == "🬀") {
            // check if this is a closed loop
            is_closed = !is_closed;
        }
        else if (character == ",") {
            if (!is_closed) {
                continue;
            }

            var element = tiles.slice(start_pos, i);

            if (addElement(position.slice(0, -1), element)) {
                start_pos = i + 2;

                position[position.length - 1]++;
            }
        }
    }

    CreateTiles();
}

var tile_data = {};

function stringPos(pos) {
    return pos.x.toString() + " " + pos.y.toString();
}

function CreateTiles() {

    for (var i = 0; i < tile_data_list.length; i++) {
        centre = {
            x: tile_data_list[i][1],
            y: tile_data_list[i][2]
        }

        tile_data[stringPos(centre)] = [tile_data_list[i][0], tile_data_list[i][3], tile_data_list[i][4]];
        MarkHex(tile_data[stringPos(centre)][1], centre);
    }
}

function SetNewPanel(tile) {
    var old_tile = tile_title.textContent.split(" ");
    old_tile = old_tile[1] + " " + old_tile[2];

    panel_contents.setAttribute("style", "display:none;");

    if (tile.x == -1 && tile.y == -1) {
        if (current_node.x == -1 && current_node.y == -1) {
            tile_title.innerHTML = "No Tile Selected";
            return;
        }

        tile_title.innerHTML = "No Tile Selected" +
            " (" + stringPos(current_node) + ")";
        return;
    }

    panel_contents.setAttribute("style", "display:block; height: 100%;");

    if (current_node.x == -1 && current_node.y == -1) {
        tile_title.innerHTML = "Tile " + stringPos(tile);
    }
    else {
        tile_title.innerHTML = "Tile " + stringPos(tile) +
            " (" + stringPos(current_node) + ")";
    }

    if (old_tile == stringPos(highlight_index)) {
        return;
    }

    SetDelete(false);

    // set notes
    // clear current notes
    while (panel_notes.childElementCount > 0) {
        panel_notes.firstChild.remove();
    }

    // console.log(panel_notes.childElementCount);

    if (!marked_hexes.hasOwnProperty(stringPos(highlight_index))) {
        return;
    }

    var node_notes = marked_hexes[stringPos(highlight_index)][2];

    // add note

    // console.log(i);
    var text = document.createElement("textarea");
    // text.setAttribute("id", i);
    text.setAttribute("onchange", "UpdateNote(" + highlight_index.x + ", " + highlight_index.y + ")");
    text.setAttribute("style", "height: -webkit-fill-available;")
    text.value = node_notes;

    panel_notes.appendChild(text);
}

window.addEventListener("keydown", (event) => {
    if (event.key == "Escape") {
        panel.setAttribute("style", "display:none;");
        document.innerHTML = document.innerHTML;
    }
});

function GetHexID() {
    return marked_hexes[stringPos(highlight_index)][0]
}

function SetColor(color) {
    rgb_color = GetColor(color);

    if (!marked_hexes.hasOwnProperty(stringPos(highlight_index))) {
        // this is a new tile

        // add note

        // console.log(i);
        var text = document.createElement("textarea");
        // text.setAttribute("id", i);
        text.setAttribute("onchange", "UpdateNote(" + highlight_index.x + ", " + highlight_index.y + ")");
        text.setAttribute("style", "height: -webkit-fill-available;")
        text.value = "";

        panel_notes.appendChild(text);
    }

    MarkHex(color, highlight_index);

    // send new color to database
    var hex_id = GetHexID()
    if (window.XMLHttpRequest) {
        var req = new XMLHttpRequest();
    }
    else {
        var req = new ActiveXObject("Microsoft.XMLHTTP");
    }
    req.open("POST", "/update_color", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send("color=" + color + "&id=" + hex_id);
}

function UpdateNote(x, y) {
    var location = x + " " + y;

    var note = panel_notes.lastChild;

    if (note == undefined) {
        return;
    }

    var note_text = note.value;
    marked_hexes[location][2] = note_text;

    // send to database
    var note_id = marked_hexes[location][0];
    if (window.XMLHttpRequest) {
        var req = new XMLHttpRequest();
    }
    else {
        var req = new ActiveXObject("Microsoft.XMLHTTP");
    }
    req.open("POST", "/update_note", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send("id=" + note_id + "&text=" + note_text);
}

var marked_hexes = {};

function MarkHex(color, index) {
    var centre, radius, height;
    radius = hex_radius;
    height = Math.sqrt(3) * radius;
    centre = index;

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
    marker.setAttribute("id", "Hex " + index.x + " " + index.y);
    marker.setAttribute("style", "fill:" + GetColor(color) + ";stroke:none");

    background.appendChild(marker);

    old_hex = stringPos(index);

    if (old_hex in marked_hexes) {
        // remove old hex
        document.getElementById("Hex " + old_hex).remove();

        marked_hexes[old_hex][1] = color;
    }
    else {
        marked_hexes[old_hex] = [-1, color, ""];

        if (old_hex in tile_data) {
            marked_hexes[old_hex][0] = tile_data[old_hex][0];
            marked_hexes[old_hex][2] = tile_data[old_hex][2];

        }
        else {
            // make new one
            if (window.XMLHttpRequest) {
                var req = new XMLHttpRequest();
            }
            else {
                var req = new ActiveXObject("Microsoft.XMLHTTP");
            }

            // send details to python file
            req.open("POST", "/new_tile", true);
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            req.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var hex_id = parseInt(this.responseText);
                    marked_hexes[old_hex][0] = hex_id;
                }
            };
            req.send("x=" + index.x + "&y=" + index.y + "&color=" + color + "&map=" + mapName);
        }
    }

    background.innerHTML = background.innerHTML;
}

function reloadHexes() {

    for (let hex_index in marked_hexes) {
        var str_centre = hex_index.split(" ");
        var centre = {
            x: parseInt(str_centre[0]),
            y: parseInt(str_centre[1])
        }

        MarkHex(marked_hexes[hex_index][1], centre);
    }
}

function SetDelete(is_deleting = false) {
    var saveButton = delete_buttons.children.item(0);
    var deleteButton = delete_buttons.children.item(1);
    var cancelButton = delete_buttons.children.item(2);
    var confirmButton = delete_buttons.children.item(3);

    if (is_deleting) {
        saveButton.setAttribute("style", "display: none;");
        deleteButton.setAttribute("style", "display: none;");
        cancelButton.setAttribute("style", "display: block;");
        confirmButton.setAttribute("style", "display: block;");
    }

    else {
        saveButton.setAttribute("style", "display: block;");
        deleteButton.setAttribute("style", "display: block; right: 1em;");
        cancelButton.setAttribute("style", "display: none;");
        confirmButton.setAttribute("style", "display: none;");
    }
}

function DeleteTile() {
    SetDelete(false);

    // remove from marker
    var hex = stringPos(highlight_index);
    if (marked_hexes.hasOwnProperty(hex)) {
        var tile_id = GetHexID();

        delete marked_hexes[hex];
        document.getElementById("Hex " + hex).remove();
        reloadHexes();

        if (window.XMLHttpRequest) {
            var req = new XMLHttpRequest();
        }
        else {
            var req = new ActiveXObject("Microsoft.XMLHTTP");
        }
        req.open("POST", "/delete_node", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send("id=" + tile_id);
    }

    while (panel_notes.childElementCount > 0) {
        panel_notes.firstChild.remove();
    }
}