(function ($) {
  'use strict';

  Drupal.oiko = Drupal.oiko || {};

  var featureCache = {};

  $(document).on('leaflet.map', function(e, mapDefinition, map, drupalLeaflet) {
    // Add the sidebar control if there's a sidebar control in the page markup.
    if (mapDefinition.sidebar && Drupal.oiko.hasOwnProperty('sidebar')) {
      drupalLeaflet.hasSidebar = true;

      $(window).bind('selected.map.searchitem selected.timeline.searchitem', function (e, id) {
        var id = parseInt(id, 10);
        Drupal.oiko.openSidebar(id);
      });

      $(window).bind('oikoSidebarOpening', function (e, id) {
        if (featureCache.hasOwnProperty(id)) {
          if (!map.getBounds().contains(featureCache[id])) {
            map.panInsideBounds(featureCache[id]);
          }
        }
      });

      // Check to see if we need to open the sidebar immediately.
      $(document).once('oiko_leaflet__popups').each(function () {
        if (drupalSettings.hasOwnProperty('oiko_leaflet') && drupalSettings.oiko_leaflet.hasOwnProperty('popup') && drupalSettings.oiko_leaflet.popup) {
          // We might need to wait for everything we need to be loaded.
          $(window).bind('load', function () {
            Drupal.oiko.openSidebar(drupalSettings.oiko_leaflet.popup.id);
          });
        }
      });
    }
  });

  $(document).on('leaflet.feature', function(e, lFeature, feature, drupalLeaflet) {
    if (drupalLeaflet.hasSidebar) {
      // Remove the popup and add it back as a tooltip.
      if (typeof lFeature.unbindPopup !== 'undefined') {
        lFeature.unbindPopup();
      }
      if (feature.popup) {
        // If this is a point, then we want the tooltip to not move around.
        var sticky = feature.type !== 'point';
        lFeature.bindTooltip(feature.popup, {direction: 'bottom', opacity: 1, sticky: sticky});
      }

      // Store away the bounds of the feature.
      if (typeof lFeature.getBounds !== 'undefined') {
        featureCache[feature.id] = lFeature.getBounds();
      }
      else if (typeof lFeature.getLatLng !== 'undefined') {
        var center = lFeature.getLatLng();
        featureCache[feature.id] = leafletLatLngToBounds(center, 1000);
      }

      // Add a click event that opens our marker in the sidebar.
      lFeature.on('click', function () {
        Drupal.oiko.openSidebar(feature.id);
      });
    }
  });

  var leafletLatLngToBounds = function(latlng, sizeInMeters) {

    if (typeof latlng.toBounds !== 'undefined') {
      return latlng.toBounds(sizeInMeters);
    }
    else {
      var latAccuracy = 180 * sizeInMeters / 40075017,
        lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * latlng.lat);

      return L.latLngBounds(
        [latlng.lat - latAccuracy, latlng.lng - lngAccuracy],
        [latlng.lat + latAccuracy, latlng.lng + lngAccuracy]);
    }
  }

})(jQuery);
