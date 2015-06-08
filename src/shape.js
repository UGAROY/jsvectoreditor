VectorEditor.prototype.deleteSelection = function () {
    while (this.selected.length > 0) {
        this.deleteShape(this.selected[0]);
    }
};
VectorEditor.prototype.deleteShape = function (shape, nofire) {
    if (!nofire) {
        if (this.fire('delete', shape) === false) {
            return;
        }
    }
    if (shape && shape.node && shape.node.parentNode) {
        shape.remove();
    }
    for (var i = 0; i < this.trackers.length; i++) {
        if (this.trackers[i].shape === shape) {
            this.removeTracker(this.trackers[i]);
        }
    }
    for (var i = 0; i < this.shapes.length; i++) {
        if (this.shapes[i] === shape) {
            this.shapes.splice(i, 1);
        }
    }
    for (var i = 0; i < this.selected.length; i++) {
        if (this.selected[i] === shape) {
            this.selected.splice(i, 1);
        }
    }    //should remove references, but whatever
};
VectorEditor.prototype.deleteAll = function () {
    this.paper.clear();
    this.shapes = [];
    this.trackers = [];
};
VectorEditor.prototype.clearShapes = function () {
    while (this.shapes.length > 0) {
        this.deleteShape(this.shapes[0], true);    //nofire
    }
};
VectorEditor.prototype.generateUUID = function () {
    var uuid = '', d = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 4    /*16*/; i++) {
        uuid += d.charAt(Math.floor(Math.random() * (i ? d.length : d.length - 10)));
    }
    return uuid;
};
VectorEditor.prototype.getShapeById = function (v) {
    for (var i = this.shapes.length; i-- && this.shapes[i].id !== v;) {
        ;
    }
    return this.shapes[i];
};
VectorEditor.prototype.addShape = function (shape, no_select, no_fire) {
    if (!no_fire) {
        this.fire('addshape', shape, no_select);
    }
    shape.node.shape_object = shape;
    if (!no_select) {
        this.selected = [shape];
    }
    this.shapes.push(shape);
    if (!no_fire) {
        this.fire('addedshape', shape, no_select);
    }
};
VectorEditor.prototype.rectsIntersect = function (r1, r2) {
    return r2.x < r1.x + r1.width && r2.x + r2.width > r1.x && r2.y < r1.y + r1.height && r2.y + r2.height > r1.y;
};
VectorEditor.prototype.drawGrid = function () {
    this.paper.drawGrid(0, 0, 480, 272, 10, 10, 'blue').toBack();
};
VectorEditor.prototype.move = function (shape, dx, dy) {
    if (shape.type === 'rect' || shape.type === 'image' || shape.type === 'ellipse') {
        shape.transform(Raphael.format('...t{0},{1}', dx, dy));
    } else if (shape.type === 'path') {
        shape.transform(Raphael.format('...t{0},{1}', dx, dy));
        //shape.attr('path', Raphael.transformPath(shape.attr('path'), ['t', dx, dy]));
        console.log('move', shape.attr('path'));
    }
    this.renormalizeRotation(shape);
};
VectorEditor.prototype.applyTransforms = function (shape) {
    // exclude rotations
    if (shape.type === 'path') {
        var applied = [], kept = [], raw = shape.transform();
        // TODO: make this more elegant
        for (var i = 0; i < raw.length; i++) {
            if (raw[i][0] !== 'r') {
                applied.push(raw[i]);
            } else {
                kept.push(raw[i]);
            }
        }
        var path = Raphael.transformPath(shape.attr('path'), applied);
        // raphael seems to randomly turn straight segments into curves
        // so lets not do that
        for (var i = 0; i < path.length; i++) {
            if (path[i][0] === 'C') {
                path[i] = [
                    'L',
                    path[i][5],
                    path[i][6]
                ];
            }
        }
        shape.attr('path', path);
        shape.transform(kept);
    }
};

VectorEditor.prototype.fixText = function (str) {
    return window.Ax ? Ax.textfix(str) : str;
};
VectorEditor.prototype.except = function (type, tran) {
    console.log(tran);
    var bin = [];
    for (var i = 0; i < tran.length; i++) {
        if (tran[i][0] !== type) {
            bin.push(tran[i]);
        }
    }
    return bin;
};
VectorEditor.prototype.renormalizeRotation = function (shape) {
    var raw = shape.transform(), kept = [];
    var rotation = 0;
    for (var i = 0; i < raw.length; i++) {
        if (raw[i][0] === 'r') {
            rotation += raw[i][1];    // ignore the center, recompute that based on stuff
        } else {
            kept.push(raw[i]);
        }
    }
    shape.transform('');
    shape.transform(kept);
    shape.rotate(rotation);
};
VectorEditor.prototype.rotate = function (shape, deg) {
    shape.transform('');
    shape.rotate(deg);
};
VectorEditor.prototype.resize = function (shape, raw_x, raw_y, box) {
    var x = box[0], y = box[1], width = raw_x - x, height = raw_y - y;
    if (width < 0 || height <0) {
        return;
    }
    if (shape.type === 'rect' || shape.type === 'image') {
        shape.attr('width', width);
        shape.attr('height', height);
    } else if (shape.type === 'ellipse') {
        shape.attr('cx', width/2);
        shape.attr('cy', height/2);
        shape.attr('rx', width/2);
        shape.attr('ry', height/2);
    } else if (shape.type === 'text') {
        shape.attr('font-size', Math.abs(width));
    } else if (shape.type === 'path') {
        var transforms = this.except('s', shape.transform());
        transforms.unshift([
            's',
            width / box[2],
            height / box[3],
            x,
            y
        ]);
        shape.transform(transforms);
    }
    //this.renormalizeRotation(shape);
};