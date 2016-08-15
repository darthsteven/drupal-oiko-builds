<?php

namespace Drupal\cidoc\Entity;

use Drupal\views\EntityViewsData;
use Drupal\views\EntityViewsDataInterface;

/**
 * Provides Views data for CIDOC entities.
 */
class CidocEntityViewsData extends EntityViewsData implements EntityViewsDataInterface {
  /**
   * {@inheritdoc}
   */
  public function getViewsData() {
    $data = parent::getViewsData();

    $data['cidoc_entity']['table']['base'] = array(
      'field' => 'id',
      'title' => $this->t('CIDOC entity'),
      'help' => $this->t('The CIDOC entity ID.'),
    );

    if (isset($data['cidoc_entity']['bundle']['filter']['id'])) {
      $data['cidoc_entity']['bundle']['filter']['id'] = 'cidoc_bundle';
    }

    $data['cidoc_entity']['related_entities'] = array(
      'title' => $this->t('Related entities'),
      'relationship' => array(
        'base' => 'cidoc_entity',
        'base field' => 'id',
        'id' => 'cidoc_related_entity_forward',
      ),
    );

    return $data;
  }

}
