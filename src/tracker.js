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
        console.log('box', box);
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
                    y: box.y - 6
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