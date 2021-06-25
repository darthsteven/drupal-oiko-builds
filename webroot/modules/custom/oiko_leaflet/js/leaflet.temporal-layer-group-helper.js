(function() {
  'use strict';
function extensions(parentClass) { return {

  options: {
    visibleInTimelineBrowser: true,
    temporalRangeWindow: 0
  },

  initialize: function (targetLayer, options) {
    L.Util.setOptions(this, options);
    this._targetLayer = targetLayer;
    this._visibleLayers = [];
    this._staticLayers = [];
    this._temporalLayers = [];
    this._temporalTree = new IntervalTree();
    this._holdfire = false;
    this._lastShownTime = false;
  },

  addTo: function addTo(map) {
    this.remove();
    this._map = map;

    this.onAdd(map);
    return this;
  },

  remove: function remove() {
    if (!this._map) {
      return this;
    }

    if (this.onRemove) {
      this.onRemove(this._map);
    }

    this._map = null;

    return this;
  },

  removeFrom: function removeFrom(map) {
    if (this._map !== map) {
      return this;
    }

    if (this.onRemove) {
      this.onRemove(map);
    }

    this._map = null;

    return this;
  },

  onAdd: function onAdd(map) {
    this.map = map;
    this.map.on('temporal.shift', this._onTemporalChange, this);
    this.map.on('temporal.getBounds', this._onTemporalGetBounds, this);
    this.map.on('temporal.getCounts', this._onTemporalGetCounts, this);
    this.map.on('temporal.getStartAndEnds', this._onTemporalgetStartAndEnds, this);
  },

  onRemove: function onRemove() {
    this.map.off('temporal.shift', this._onTemporalChange, this);
    this.map.off('temporal.getBounds', this._onTemporalGetBounds, this);
    this.map.off('temporal.getCounts', this._onTemporalGetCounts, this);
    this.map.off('temporal.getStartAndEnds', this._onTemporalgetStartAndEnds, this);
  },

  addLayer: function addLayer(layer) {
    this.addLayers([layer]);
  },

  addLayers: function addLayers(layers) {
    var i, layer, temporalRebase = false;
    for (i = 0; i < layers.length; i++) {
      layer = layers[i];
      // This isn't a temporal layer, so just add it to our list of static layers.
      if (!('temporal' in layer) || !('start' in layer.temporal) || !('end' in layer.temporal)) {
        this._staticLayers.push(layer);
        this._targetLayer.addLayer(layer);
      }
      else {
        this._temporalLayers.push(layer);
        this._temporalTree.insert(layer.temporal.start, layer.temporal.end, layer);
        temporalRebase = true;
      }
    }

    if (!this._holdfire) {
      this._updateDisplayedTemporalLayers();
    }
    if (temporalRebase) {
      if (!this._holdfire) {
        this.map.fire('temporal.rebase');
      }
    }
  },

  removeLayer: function removeLayer(layer) {
    this.removeLayers([layer]);
  },

  removeLayers: function removeLayers(layers) {
    var j, i, layer;
    for (j = 0; j < layers.length; j++) {
      layer = layers[j];

      // Remove from the target layer first.
      this._targetLayer.removeLayer(layer);
      // Now remove the layer from our internal storage.
      this._removeItemFromArray(this._visibleLayers, layer);
      this._removeItemFromArray(this._staticLayers, layer);
      this._removeItemFromArray(this._temporalLayers, layer);
    }

    // Recreate a brand new temporal tree, as we have no way to remove things
    // from it.
    this._temporalTree = new IntervalTree();
    for (i = 0; i < this._temporalLayers.length; i++) {
      this._temporalTree.insert(this._temporalLayers[i].temporal.start, this._temporalLayers[i].temporal.end, this._temporalLayers[i]);
    }

    if (!this._holdfire) {
      this.map.fire('temporal.rebase');
    }
  },

  changeLayers: function changeLayers(layersToAdd, layersToRemove) {
    this._holdfire = true;
    this.addLayers(layersToAdd);
    this.removeLayers(layersToRemove);
    this._holdfire = false;
    // Actually update the displayed layers if we have added, since they may
    // need to be added to the target layer.
    if (layersToAdd.length) {
      this._updateDisplayedTemporalLayers();
    }
    // Inform linked controls that we have rebased.
    this.map.fire('temporal.rebase');
  },

  _removeItemFromArray: function(array, item) {
    var i = array.indexOf(item);
    if (i !== -1) {
      array.splice(i, 1);
    }
  },

  clearLayers: function () {
    this._visibleLayers = [];
    this.s = [];
    this._targetLayer.clearLayers();
  },

  _onTemporalChange: function(e) {
    this._lastShownTime = e.time;
    this._updateDisplayedTemporalLayers();
  },

  _updateDisplayedTemporalLayers: function _updateDisplayedTemporalLayers() {

    // Early exit if we do not know our set time.
    if (this._lastShownTime === false) {
      return;
    }

    var features = [];
    if (this._temporalTree.size) {
      // Get the layers we should be showing.
      if (this.options.temporalRangeWindow === 0) {
        features = this._temporalTree.lookup(Math.ceil(this._lastShownTime));
      }
      else {
        features = this._temporalTree.overlap(Math.floor(this._lastShownTime - this.options.temporalRangeWindow), Math.ceil(this._lastShownTime + this.options.temporalRangeWindow));
      }
    }

    var found, layer;

    // Loop through the existing features on our map.
    for (var i = 0; i < this._visibleLayers.length; i++) {
      found = false;
      layer = this._visibleLayers[i];
      // Search for this layer in our set of features we do want.
      for (var j = 0; j < features.length; j++) {
        if (features[j] === layer) {
          found = true;
          features.splice(j, 1);
          break;
        }
      }
      if (!found) {
        // We didn't find this layer, so remove it and decrement i, so we process this i again.
        this._targetLayer.removeLayer(layer);
        this._visibleLayers.splice(i, 1);
        i--;
      }
    }

    // features now only contains features we do want, but are not visible yet.
    for (var k = 0; k < features.length; k++) {
      layer = features[k];
      this._visibleLayers.push(layer);
      this._targetLayer.addLayer(layer);
    }
  },

  _onTemporalGetBounds: function(e) {
    if (!this.options.visibleInTimelineBrowser) {
      return;
    }
    var bounds = {
      min: Infinity,
      max: -Infinity
    };

    // Process all our temporal items.
    for (var i = 0; i < this._temporalLayers.length; i++) {
      bounds.min = Math.min(bounds.min, this._temporalLayers[i].temporal.start);
      bounds.max = Math.max(bounds.max, this._temporalLayers[i].temporal.end);
    }

    e.boundsCallback(bounds.min, bounds.max);
  },

  _onTemporalGetCounts: function(e) {
    if (!this.options.visibleInTimelineBrowser) {
      return;
    }
    e.countsCallback(this._temporalTree.size ? this._temporalTree.overlap(e.slice.start, e.slice.end).length : 0);
  },

  _onTemporalgetStartAndEnds: function(e) {
    if (!this.options.visibleInTimelineBrowser) {
      return;
    }
    if (this._temporalTree.size) {
      var items = this._temporalTree.overlap(e.slice.start, e.slice.end);
      for (var i = 0; i < items.length;i++) {
        e.startEndCallback(items[i].temporal.start, items[i].temporal.end);
      }
    }
  }
}};

L.TemporalLayerHelper   = L.Class.extend(extensions( L.Class ));

L.temporalLayerHelper = function (targetLayer, options) {
  return new L.TemporalLayerHelper(targetLayer, options || {});
};

})();
