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
            shape = this.paper.rect(x, y, 0, 0);
        } else if (this.mode === 'ellipse') {
            shape = this.paper.ellipse(x, y, 0, 0);
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
            shape = this.paper.image(this.prop.src, x, y, 0, 0);
        } else if (this.mode === 'text') {
            shape = this.paper.text(x, y, this.prop['text']).attr('font-size', 0);
            shape.text = this.prop['text'];
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
                        box.cx,
                        box.cy
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
                    pathsplit.splice(1);
                } else {
                    var last = pathsplit[pathsplit.length - 1];
                    if (this.selected[0].polypoints.length < pathsplit.length) {
                        //if(Math.floor(last[1]) == this.lastpointsX && Math.floor(last[2]) == this.lastpointsY){
                        pathsplit.splice(pathsplit.length - 1, 1);
                    } 
                }
                //this.lastpointsX = x; //TO FIX A NASTY UGLY BUG
                //this.lastpointsY = y; //SERIOUSLY
                this.selected[0].attr('path', pathsplit.toString() + 'L' + x + ' ' + y);
            } else {
                //console.debug(pathsplit)
                //normally when this executes there's somethign strange that happened
                this.selected[0].attr('path', this.selected[0].attrs.path + 'L' + x + ' ' + y);
            }    //this.selected[0].lineTo(x, y)
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