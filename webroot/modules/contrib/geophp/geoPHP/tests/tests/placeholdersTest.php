<?php

require_once '../geoPHP.inc';
require_once 'PHPUnit/Autoload.php';
/**
 *
 */
class PlaceholdersTests extends \PHPUnit\Framework\TestCase {

  /**
   *
   */
  public function setUp(): void {

  }

  /**
   *
   */
  public function testPlaceholders() {
    foreach (scandir('./input') as $file) {
      $parts = explode('.', $file);
      if ($parts[0]) {
        $format = $parts[1];
        $value = file_get_contents('./input/' . $file);
        $geometry = geoPHP::load($value, $format);

        $placeholders = [
          ['name' => 'hasZ'],
          ['name' => 'is3D'],
          ['name' => 'isMeasured'],
          ['name' => 'isEmpty'],
          ['name' => 'coordinateDimension'],
          ['name' => 'z'],
          ['name' => 'm'],
        ];

        foreach ($placeholders as $method) {
          $argument = NULL;
          $method_name = $method['name'];
          if (isset($method['argument'])) {
            $argument = $method['argument'];
          }

          switch ($method_name) {
            case 'm':
            case 'z':
              if ($geometry->geometryType() == 'Point') {
                $this->assertNotNull($geometry->$method_name($argument), 'Failed on ' . $method_name);
              }
              if ($geometry->geometryType() == 'LineString') {
                $this->assertNotNull($geometry->$method_name($argument), 'Failed on ' . $method_name);
              }
              if ($geometry->geometryType() == 'MultiLineString') {
                $this->assertNull($geometry->$method_name($argument), 'Failed on ' . $method_name);
              }
              break;

            case 'coordinateDimension':
            case 'isEmpty':
            case 'isMeasured':
            case 'is3D':
            case 'hasZ':
              if ($geometry->geometryType() == 'Point') {
                $this->assertNotNull($geometry->$method_name($argument), 'Failed on ' . $method_name);
              }
              if ($geometry->geometryType() == 'LineString') {
                $this->assertNotNull($geometry->$method_name($argument), 'Failed on ' . $method_name);
              }
              if ($geometry->geometryType() == 'MultiLineString') {
                $this->assertNotNull($geometry->$method_name($argument), 'Failed on ' . $method_name);
              }
              break;

            default:
              $this->assertTrue($geometry->$method_name($argument), 'Failed on ' . $method_name);
          }
        }

      }
    }

  }

}
