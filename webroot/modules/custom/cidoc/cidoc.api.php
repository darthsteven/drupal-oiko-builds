<?php

use Drupal\cidoc\CidocEntityInterface;

/**
 * Alter the tags for any given CIDOC point.
 *
 * @param $tags
 * @param array $point
 * @param \Drupal\cidoc\CidocEntityInterface $entity
 */
function hook_cidoc_geoserializer_point_tags_alter(&$tags, array $point, CidocEntityInterface $entity) {

}

/**
 * Alter the points for a CIDOC entity.
 *
 * @param $points
 * @param \Drupal\cidoc\CidocEntityInterface $entity
 */
function hook_cidoc_geoserializer_points_alter(array &$points, CidocEntityInterface $entity) {

}

