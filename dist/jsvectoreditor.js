/*
  jsvectoreditor 1.0.0 <https://github.com/UGAROY/jsvectoreditor>
  Copyright (c) 2015 

 */

(function(window, $){

var removeItemFromArray = function (item, arr) {
    var idx = arr.indexOf(item);
    idx!== -1 ? arr.splice(item, 1) : 0;
};

var format = Raphael.format;

var getShapeFromTarget = function (target) {
    if (target.shape_object) {
        return target.shape_object;
    } else if (target.parentNode.shape_object) {
        return target.parentNode.shape_object;
    } else if (!target.is_tracker) {
        this.selectbox = this.paper.rect(x, y, 0, 0).attr({
            'fill-opacity': 0.15,
            'stroke-opacity': 0.5,
            'fill': '#ff0000',
            //oh noes! its red and gonna asplodes!
            'stroke': '#ff0000'
        });
        return;
    } else {
        return;    //likely tracker
    }
};

var getRelativePositionToWindow = function (elem) {
        var pos = $(elem).offset();
        var bodyScrollTop = $(window).scrollTop();
        var bodyScrollLeft = $(window).scrollLeft();
        return [
            pos.left - bodyScrollLeft,
            pos.top - bodyScrollTop
        ];
    }, mousedownHandler = function (event) {
        event.preventDefault();
        var _this = event.data.currentEditor, position = getRelativePositionToWindow(this);
        if (event.button === 2) {
            _this.setMode('select');
        }
        _this.onMouseDown(event.clientX - position[0], event.clientY - position[1], event.target);
    }, mouseupHandler = function (event) {
        event.preventDefault();
        var _this = event.data.currentEditor, position = getRelativePositionToWindow(this);
        _this.onMouseUp(event.clientX - position[0], event.clientY - position[1], event.target);
    }, mousemoveHandler = function (event) {
        event.preventDefault();
        var _this = event.data.currentEditor, position = getRelativePositionToWindow(this);
        _this.onMouseMove(event.clientX - position[0], event.clientY - position[1], event.target);
    }, doubleclickHandler = function (event) {
        var _this = event.data.currentEditor, position = getRelativePositionToWindow(this);
        _this.onDblClick(event.clientX - position[0], event.clientY - position[1], event.target);
    };
window.VectorEditor = function (elem, width, height) {
    if (typeof Raphael !== 'function') {
        //check for the renderer
        return alert('Error! Renderer is Missing!');    //if renderer isn't there, return false;
    }
    this.container = elem;
    this.paper = Raphael(elem, width, height);
    this.paper.editor = this;
    this.onHitXY = [
        0,
        0
    ];
    this.tmpXY = [
        0,
        0
    ];
    //cant think of any better way to do it
    this.prop = {
        'src': 'http://upload.wikimedia.org/wikipedia/commons/a/a5/ComplexSinInATimeAxe.gif',
        'stroke-width': 1,
        'stroke': '#000000',
        'fill': '#ff0000',
        'stroke-opacity': 1,
        'fill-opacity': 1,
        'text': 'Text'
    };
    this.mode = 'select';
    this.selectbox = null;
    this.selected = [];
    this.action = '';
    this.selectadd = false;
    this.shapes = [];
    this.trackers = [];
    this.listeners = {};
    var _this = this;
    // Note: Unbind the previous binding events since the VectorEditor can be created more than once on an element
    $(elem).off('mousedown', mousedownHandler);
    $(elem).off('mousemove', mousemoveHandler);
    $(elem).off('mouseup', mouseupHandler);
    $(elem).off('dblclick', doubleclickHandler);
    $(elem).on('mousedown', { currentEditor: _this }, mousedownHandler);
    $(elem).on('mouseup', { currentEditor: _this }, mouseupHandler);
    $(elem).on('mousemove', { currentEditor: _this }, mousemoveHandler);
    $(elem).on('dblclick', { currentEditor: _this }, doubleclickHandler);
};
VectorEditor.prototype.setMode = function (mode) {
    if (mode === 'delete') {
        this.deleteSelection();
        this.mode = 'select';
    } else {
        this.unselect();
        this.mode = mode;
    }
};
VectorEditor.prototype.returnRotatedPoint = function (x, y, cx, cy, a) {
    // http://mathforum.org/library/drmath/view/63184.html
    // radius using distance formula
    var r = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    // initial angle in relation to center
    var iA = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
    var nx = r * Math.cos((a + iA) / (180 / Math.PI));
    var ny = r * Math.sin((a + iA) / (180 / Math.PI));
    return [
        cx + nx,
        cy + ny
    ];
};
VectorEditor.prototype.is_selected = function (shape) {
    return this.selected.indexOf(shape) !== -1;
};
VectorEditor.prototype.set_attr = function () {
    for (var i = 0; i < this.selected.length; i++) {
        this.selected[i].attr.apply(this.selected[i], arguments);
    }
};
VectorEditor.prototype.set = function (name, value) {
    this.prop[name] = value;
    this.set_attr(name, value);
};
VectorEditor.prototype.onMouseDown = function (x, y, target) {
    this.starteMouseEvent = true;
    this.tmpXY = this.onHitXY = [x, y];
    if (this.mode === 'select') {
        var shape_object;
        if (target.shape_object) {
            shape_object = target.shape_object;
        } else if (target.parentNode.shape_object) {
            shape_object = target.parentNode.shape_object;
        } else if (!target.is_tracker) {
            this.unselect();
            return;
        } else {
            return; 
        }
        if (!this.is_selected(shape_object)) {
            this.select(shape_object);
            this.action = 'move';
        } else {
            this.action = 'move';
        }
    } else{
        var shape;
        if (this.mode === 'rect') {
            shape = this.paper.rect(0, 0, 0, 0);
            shape.translate(x, y);
        } else if (this.mode === 'ellipse') {
            shape = this.paper.ellipse(0, 0, 0, 0);
            shape.translate(x, y);
        } else if (this.mode === 'path') {
            shape = this.paper.path('M{0},{1}', x, y);
        } else if (this.mode === 'line') {
            shape = this.paper.path('M{0},{1}', x, y);
            shape.subtype = 'line';
        } else if (this.mode === 'polygon') {
            shape = this.paper.path('M{0},{1}', x, y);
            shape.polypoints = [[x,y]];
            shape.subtype = 'polygon';
        } else if (this.mode === 'image') {
            shape = this.paper.image(this.prop.src, 0, 0, 0, 0);
        } else if (this.mode === 'text') {
            shape = this.paper.text(0, 0, this.prop['text']).attr('font-size', 0);
            shape.text = this.prop['text'];
            shape.translate(x, y);
        }
        if (shape) {
            shape.id = this.generateUUID();
            shape.attr({
                'fill': this.prop.fill,
                'stroke': this.prop.stroke,
                'stroke-width': this.prop['stroke-width'],
                'fill-opacity': this.prop['fill-opacity'],
                'stroke-opacity': this.prop['stroke-opacity']
            });
            this.addShape(shape);
        }
    }
    return false;
};
VectorEditor.prototype.onMouseMove = function (x, y, target) {
    if(!this.starteMouseEvent) return;
    if (this.mode === 'select') {
        if (this.action === 'move') {
            for (var i = 0; i < this.selected.length; i++) {
                this.move(this.selected[i], x - this.tmpXY[0], y - this.tmpXY[1]);
            }
            this.updateTracker();
            this.tmpXY = [x, y];
        } else if (this.action === 'rotate') {
            var shape = this.selected[0];
            var box = shape.getBBox();
            var rad = Math.atan2(y - (box.y + box.height / 2), x - (box.x + box.width / 2));
            var deg = ((rad * (180 / Math.PI) + 90) % 360 + 360) % 360;
            this.rotate(this.selected[0], deg);
            this.updateTracker();
        } else if (this.action.substr(0, 4) === 'path') {
            var num = parseInt(this.action.substr(4));
            var pathsplit = Raphael.parsePathString(this.selected[0].attr('path'));
            if (pathsplit[num]) {
                pathsplit[num][1] = x;
                pathsplit[num][2] = y;
                this.selected[0].attr('path', pathsplit);
                this.updateTracker();
            }
        } else if (this.action === 'resize') {
            if (!this.onGrabXY) {
                //technically a misnomer
                var box = this.selected[0].getBBox();
                if (this.selected[0].type === 'ellipse') {
                    this.onGrabXY = [
                        box.x,
                        box.y
                    ];
                } else if (this.selected[0].type === 'path') {
                    this.onGrabXY = [
                        box.x,
                        box.y,
                        box.width,
                        box.height
                    ];
                } else {
                    this.onGrabXY = [
                        box.x,
                        box.y,
                    ];
                } 
            }
            var box = this.selected[0].getBBox(true);
            var nxy = this.returnRotatedPoint(x, y, box.x + box.width / 2, box.y + box.height / 2, -this.selected[0].matrix.split().rotate);
            // TODO: fix rotation with Raphael.parseTransformString(TString)
            x = nxy[0] - 5;
            y = nxy[1] - 5;
            var shape = this.selected[0];
            this.resize(shape, x, y, this.onGrabXY);
            this.newTracker(this.selected[0]);
        }
    } else {
        var shape = this.selected[0];
        if (this.mode === 'rect' || this.mode === 'image' || this.mode === 'ellipse' || this.mode === 'text') {
            // this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
            this.resize(shape, x, y, this.onHitXY);
        } else if (this.mode === 'path') {
            //this.selected[0].lineTo(x, y);
            this.selected[0].attr('path', this.selected[0].attrs.path + 'L' + x + ' ' + y);
        } else if (this.mode === 'polygon' || this.mode === 'line') {
            //this.selected[0].path[this.selected[0].path.length - 1].arg[0] = x
            //this.selected[0].path[this.selected[0].path.length - 1].arg[1] = y
            //this.selected[0].redraw();
            //var pathsplit = this.selected[0].attr("path").split(" ");
            //theres a few freaky bugs that happen due to this new IE capable way that is probably better
            var pathsplit = Raphael.parsePathString(this.selected[0].attr('path'));
            if (pathsplit.length > 1) {
                //var hack = pathsplit.reverse().slice(3).reverse().join(" ")+' ';
                if (this.mode === 'line') {
                    //safety measure, the next should work, but in practice, no
                    console.log(pathsplit);
                    pathsplit.splice(1);
                } else {
                    var last = pathsplit[pathsplit.length - 1];
                    if (this.selected[0].polypoints.length < pathsplit.length) {
                        pathsplit.splice(pathsplit.length - 1, 1);
                    } 
                }
                this.selected[0].attr('path', pathsplit.toString() + 'L' + x + ' ' + y);
            } else {
                //console.debug(pathsplit)
                //normally when this executes there's somethign strange that happened
                this.selected[0].attr('path', this.selected[0].attrs.path + 'L' + x + ' ' + y);
            }
        }
    }
    return false;
};
VectorEditor.prototype.getMarkup = function () {
    return this.paper.canvas.parentNode.innerHTML;
};
VectorEditor.prototype.onDblClick = function (x, y, target) {
    this.fire('dblclick');
    if (this.selected.length === 1) {
        if (this.selected[0].getBBox().height === 0 && this.selected[0].getBBox().width === 0) {
            this.deleteShape(this.selected[0]);
        }
        if (this.mode === 'polygon') {
            //this.selected[0].andClose()
            this.unselect();
        }
    }
    return false;
};
VectorEditor.prototype.onMouseUp = function (x, y, target) {
    this.starteMouseEvent = false;
    this.onGrabXY = null;
    if (this.selected[0]) {
        this.applyTransforms(this.selected[0]);
    }
    if (this.mode === 'select' || this.mode === 'delete') {
        if (this.selectbox) {
            var sbox = this.selectbox.getBBox();
            var new_selected = [];
            for (var i = 0; i < this.shapes.length; i++) {
                if (this.rectsIntersect(this.shapes[i].getBBox(), sbox)) {
                    new_selected.push(this.shapes[i]);
                }
            }
            if (new_selected.length === 0 || this.selectadd === false) {
                this.unselect();
            }
            if (new_selected.length === 1 && this.selectadd === false) {
                this.select(new_selected[0]);
            } else {
                for (var i = 0; i < new_selected.length; i++) {
                    this.selectAdd(new_selected[i]);
                }
            }
            if (this.selectbox.node.parentNode) {
                this.selectbox.remove();
            }
            this.selectbox = null;
            if (this.mode === 'delete') {
                this.deleteSelection();
            }
        } else {
            this.action = '';
        }
    } else if (this.selected.length === 1) {
        if (this.selected[0].getBBox().height === 0 && this.selected[0].getBBox().width === 0) {
            if (this.selected[0].subtype !== 'polygon') {
                this.deleteShape(this.selected[0]);
            }
        }
        if (this.mode === 'rect') {
            this.unselect();
        } else if (this.mode === 'ellipse') {
            this.unselect();
        } else if (this.mode === 'path') {
            this.unselect();
        } else if (this.mode === 'line') {
            this.unselect();
        } else if (this.mode === 'image') {
            this.unselect();
        } else if (this.mode === 'text') {
            this.unselect();
        } else if (this.mode === 'polygon') {
            //this.selected[0].lineTo(x, y)
            this.selected[0].attr('path', this.selected[0].attrs.path + 'L' + x + ' ' + y);
            if (!this.selected[0].polypoints) {
                this.selected[0].polypoints = [];
            }
            this.selected[0].polypoints.push([
                x,
                y
            ]);
        }
    }
    if (this.lastmode) {
        this.setMode(this.lastmode);
        //this.mode = this.lastmode //not selectmode becasue that unselects
        delete this.lastmode;
    }
    return false;
};
VectorEditor.prototype.on = function (event, callback) {
    if (!this.listeners[event]) {
        this.listeners[event] = [];
    }
    if (this.listeners[event].indexOf(callback) !== -1) {
        this.listeners[event].push(callback);
    }
};
VectorEditor.prototype.fire = function (event) {
    if (this.listeners[event]) {
        for (var i = 0; i < this.listeners[event].length; i++) {
            if (this.listeners[event][i].apply(this, arguments) === false) {
                return false;
            }
        }
    }
};
VectorEditor.prototype.un = function (event, callback) {
    if (!this.listeners[event]) {
        return;
    }
    var index = 0;
    while ((index = this.listeners[event].indexOf(callback)) !== -1) {
        this.listeners[event].splice(index, 1);
    }
};
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
    if (shape.type === 'rect' || shape.type === 'image' || shape.type === 'ellipse' || shape.type == 'text') {
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
        shape.attr('font-size', Math.abs(height));
        var updatedBox = shape.getBBox();
        shape.attr('x', updatedBox.width/2);
        shape.attr('y', updatedBox.height/2);
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
VectorEditor.prototype.unselect = function (shape) {
    if (!shape) {
        while (this.selected[0]) {
            this.unselect(this.selected[0]);
        }
        if (shape !== false) {
            this.fire('unselected');
        }
    } else {
        this.fire('unselect', shape);
        removeItemFromArray(shape, this.selected);
        for (var i = 0; i < this.trackers.length; i++) {
            if (this.trackers[i].shape === shape) {
                this.removeTracker(this.trackers[i]);
            }
        }
    }
};
VectorEditor.prototype.selectAdd = function (shape) {
    if (this.is_selected(shape) === false) {
        if (this.fire('selectadd', shape) === false) {
            return;
        }
        this.selected.push(shape);
        this.showGroupTracker(shape);
    }
};
VectorEditor.prototype.selectAll = function () {
    this.unselect();
    for (var i = 0; i < this.shapes.length; i++) {
        this.selectAdd(this.shapes[i]);
    }
};
VectorEditor.prototype.selectToggle = function (shape) {
    if (this.is_selected(shape) === false) {
        this.selectAdd(shape);
    } else {
        this.unselect(shape);
    }
};
VectorEditor.prototype.select = function (shape) {
    if (this.fire('select', shape) === false) {
        return;
    }
    this.unselect(false);
    this.selected = [shape];
    this.showTracker(shape);
};
VectorEditor.prototype.removeTracker = function (tracker) {
    if (!tracker) {
        while (this.trackers.length > 0) {
            this.removeTracker(this.trackers[0]);
        }
    } else {
        tracker.remove();
        removeItemFromArray(tracker, this.trackers);
    }
};
VectorEditor.prototype.updateTracker = function (tracker) {
    if (!tracker) {
        for (var i = 0; i < this.trackers.length; i++) {
            this.updateTracker(this.trackers[i]);
        }
    } else {
        var shape = tracker.shape;
        shape._.dirty = true;
        var box = shape.getBBox(true);
        //this is somewhat hackish here. Once a path has stopped the transformation.
        //all the transformations are automatically converted to coordinates.
        if (shape.type === 'path') {
            var pathsplit = Raphael.parsePathString(shape.attr('path'));
            if (pathsplit.length === 2) {
                tracker[0].attr({
                    cx: box.x + box.width / 2,
                    cy: box.y + box.height / 2
                });
                tracker[1].attr({
                    x: pathsplit[0][1] - 2,
                    y: pathsplit[0][2] - 2
                });
                tracker[2].attr({
                    x: pathsplit[1][1] - 2,
                    y: pathsplit[1][2] - 2
                });
            } else {
                tracker[0].attr({
                    cx: box.x + box.width / 2,
                    cy: box.y + box.height / 2
                });
                tracker[1].attr({
                    x: box.x - 6,
                    y: box.y - 6,
                    width: box.width + 6,
                    height: box.height + 6
                });
                tracker[2].attr({
                    x: box.x + box.width,
                    y: box.y + box.height
                });
            }
        }
        tracker.transform(shape.matrix.toTransformString());
    }
};
VectorEditor.prototype.trackerBox = function (x, y, action) {
    var w = 4;
    var shape = this.paper.rect(x - w, y - w, 2 * w, 2 * w).attr({
        'stroke-width': 1,
        'stroke': 'green',
        'fill': 'white'    //THE FOLLOWING LINES HAVE BEEN COMMENTED DUE TO A HORRIBLE BUG IN RAPHAEL
    }).mouseover(function () {
        this.attr('fill', 'red');
    }).mouseout(function () {
        this.attr('fill', 'white');
    }).mousedown(function (event) {
        if (this.paper && this.paper.editor) {
            this.paper.editor.action = action;
        }
    });
    shape.node.is_tracker = true;
    return shape;
};
VectorEditor.prototype.trackerCircle = function (x, y) {
    return;
    var w = 5;
    var shape = this.paper.ellipse(x, y, w, w).attr({
        'stroke-width': 1,
        'stroke': 'green',
        'fill': 'white'    //THE FOLLOWING LINES HAVE BEEN COMMENTED DUE TO A HORRIBLE BUG IN RAPHAEL
    }).mouseover(function () {
        this.attr('fill', 'red'); 
    }).mouseout(function () {
        this.attr('fill', 'white');
        this.paper.editor.hideTooltip();
    }).mousedown(function () {
        this.paper.editor.action = 'rotate';
    }).dblclick(function () {
        this.paper.editor.trackers[0].shape.transform('');
        //absolute!
        this.paper.editor.updateTracker();
    });
    shape.node.is_tracker = true;
    return shape;
};
VectorEditor.prototype.hideTooltip = function () {
    if (this.tt) {
        this.tt.hide();
    }
};
VectorEditor.prototype.markTracker = function (shape) {
    shape.node.is_tracker = true;
    return shape;
};
VectorEditor.prototype.newTracker = function (shape) {
    for (var i = 0; i < this.trackers.length; i++) {
        if (this.trackers[i].shape === shape) {
            this.removeTracker(this.trackers[i]);
        }
    }
    this.showTracker(shape);
};
VectorEditor.prototype.showTracker = function (shape) {
    var rot_offset = -14;
    var box = shape.getBBox(true);
    console.log(box);
    var tracker = this.paper.set();
    tracker.shape = shape;
    //define the origin to transform to
    tracker.lastx = 0;
    //if zero then easier
    tracker.lasty = 0;
    //if zero then easier
    tracker.push(this.markTracker(this.paper.ellipse(box.width / 2, box.height / 2, 7, 7).attr({
        'stroke': 'gray',
        'stroke-opacity': 0.5,
        'fill': 'gray',
        'fill-opacity': 0.15
    })).mousedown(function () {
        this.paper.editor.action = 'move';
    }));
    //draw everything relative to origin (0,0) because it gets transformed later
    if (shape.subtype === 'line') {
        var line = Raphael.parsePathString(shape.attr('path'));
        tracker.push(this.trackerBox(line[0][1] - box.x, line[0][2] - box.y, 'path0'));
        tracker.push(this.trackerBox(line[1][1] - box.x, line[1][2] - box.y, 'path1'));
        this.trackers.push(tracker);
    } else if (shape.type === 'rect' || shape.type === 'image') {
        tracker.push(this.paper.rect(-6, -6, box.width + 11, box.height + 11).attr({ 'opacity': 0.3 }));
        tracker.push(this.trackerCircle(box.width / 2, rot_offset));
        tracker.push(this.trackerBox(box.width + 5, box.height + 5, 'resize'));
        this.trackers.push(tracker);
    } else if (shape.type === 'ellipse') {
        tracker.push(this.trackerCircle(box.width / 2, rot_offset));
        tracker.push(this.trackerBox(box.width + 5, box.height + 5, 'resize'));
        this.trackers.push(tracker);
    } else if (shape.type === 'text') {
        tracker.push(this.paper.rect(-6, -6, box.width + 11, box.height + 11).attr({ 'opacity': 0.3 }));
        tracker.push(this.trackerCircle(box.width / 2, rot_offset));
        tracker.push(this.trackerBox(box.width + 5, box.height + 5, 'resize'));
        this.trackers.push(tracker);
    } else if (shape.type === 'path' && shape.subtype !== 'line') {
        tracker.push(this.paper.rect(-6, -6, box.width + 11, box.height + 11).attr({ 'opacity': 0.3 }));
        tracker.push(this.trackerBox(box.width + 5, box.height + 5, 'resize'));
        tracker.push(this.trackerCircle(box.width / 2, rot_offset));
        this.trackers.push(tracker);
    } else {
        tracker.push(this.paper.rect(-6, -6, box.width + 11, box.height + 11).attr({ 'opacity': 0.3 }));
        tracker.push(this.trackerCircle(box.width / 2, rot_offset));
        this.trackers.push(tracker);
    }
    this.updateTracker(tracker);
};
VectorEditor.prototype.showGroupTracker = function (shape) {
    var tracker = this.paper.set();
    var box = shape.getBBox();
    tracker.push(this.markTracker(this.paper.ellipse(box.width / 2, box.height / 2, 7, 7).attr({
        'stroke': 'gray',
        'stroke-opacity': 0.5,
        'fill': 'gray',
        'fill-opacity': 0.15
    })).mousedown(function () {
        this.paper.editor.action = 'move';
    }));
    tracker.push(this.paper.rect(-6, -6, box.width + 11, box.height + 11).attr({
        'stroke-dasharray': '-',
        'stroke': 'blue'
    }));
    tracker.shape = shape;
    //define the origin to transform to
    tracker.lastx = 0;
    //if zero then easier
    tracker.lasty = 0;
    //if zero then easier
    this.trackers.push(tracker);
    this.updateTracker(tracker);
};
}).call({}, window, window.$ || (window.angular || {}).element);