<?php

namespace Drupal\oiko_leaflet\Controller;

use Drupal\Core\Cache\CacheableJsonResponse;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityTypeManager;

/**
 * Class MapPageController.
 *
 * @package Drupal\oiko_leaflet\Controller
 */
class MapPageController extends ControllerBase {

  /**
   * Drupal\Core\Entity\EntityTypeManager definition.
   *
   * @var Drupal\Core\Entity\EntityTypeManager
   */
  protected $entity_type_manager;
  /**
   * {@inheritdoc}
   */
  public function __construct(EntityTypeManager $entity_type_manager) {
    $this->entity_type_manager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager')
    );
  }

  /**
   * Basemap.
   *
   * @return string
   *   Return Hello string.
   */
  public function allEntitiesForMap() {
    $data = [];

    $storage = $this->entity_type_manager->getStorage('cidoc_entity');

    $query = $storage->getQuery();
    $results = $query
      ->notExists('field_empire_outline')
      ->execute();

    // Get the entities.
    $entities = $storage->loadMultiple($results);
    foreach ($entities as $entity) {
      $data = array_merge($data, $entity->getGeospatialData());
    }

    $response = new CacheableJsonResponse($data);
    foreach ($entities as $entity) {
      $response->addCacheableDependency($entity);
    }
    $definition = $this->entity_type_manager->getDefinition('cidoc_entity');
    $response->getCacheableMetadata()->addCacheTags($definition->getListCacheTags());
    return $response;
  }

  /**
   * Basemap.
   *
   * @return string
   *   Return Hello string.
   */
  public function baseMap() {

    $data = [];

    $map = leaflet_map_get_info('Ancient Terrain');
    $map['sidebar'] = TRUE;
    $map['pagestate'] = TRUE;
    $map['timeline'] = TRUE;
    $map['search'] = TRUE;
    $map['empires'] = TRUE;
    $map['clustering'] = TRUE;
    $map['locate'] = TRUE;
    $map['layerControl'] = TRUE;
    $map['data-url'] = Url::fromRoute('oiko_leaflet.map_page_controller_allEntities')->toString();
    $height = 'full';

    $map = leaflet_render_map($map, $data, $height);

    $map['#theme_wrappers']['container'] = [
      '#attributes' => [
        'class' => ['l-map-wrap'],
      ],
    ];

    return $map;
  }

}
