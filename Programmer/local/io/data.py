import uuid
import zipfile

from local.entities import *
from local.io.util import *

class Data:
    _FILENAME_OBJECTS = 'Objects.xml'
    _FILENAME_PATHS = 'Paths.xml'
    _DIR_POINTS = 'Points/'

    def __init__(self, objectCategories: dict[str, ObjectCategory],
                 points: dict[str, Point], waypoints: dict[str, Waypoint], groups: dict[str, list[Point]],
                 paths: dict[tuple[Point, Point], Path]):
        self.objectCategories = objectCategories
        self.points = points
        self.waypoints = waypoints
        self.groups = groups
        self.paths = paths

    @staticmethod
    def _appendGroupPoint(groups: dict[str, list[Point]], groupKey: str, point: Point) -> None:
        groupPoints = groups.get(groupKey)
        if not groupPoints:
            groupPoints = []
            groups[groupKey] = groupPoints
        groupPoints.append(point)

    @classmethod
    def load(cls, path: str) -> 'Data':
        with zipfile.ZipFile(path) as zf:
            namelist = zf.namelist()
            print(namelist)

            for x in [cls._FILENAME_OBJECTS, cls._FILENAME_PATHS]:
                if not x in namelist:
                    raise FileFormatError(path, f'エントリ \'{x}\' が存在しません。ファイルが破損している可能性があります。')

            with zf.open(cls._FILENAME_OBJECTS) as objectsFile:
                objectsRoot = XmlUtil.ioToXml(objectsFile, 'ObjectCollection', cls._FILENAME_OBJECTS)

                categoriesElement = XmlUtil.find(objectsRoot, 'Categories')
                categoryElements = categoriesElement.findall('ObjectCategory')
                categories: dict[str, ObjectCategory] = {}
                for categoryElement in categoryElements:
                    key = categoryElement.get('Key', str(uuid.uuid4()))
                    name = categoryElement.get('Name', '名称未設定')
                    categories[key] = ObjectCategory(name)

            points: dict[str, Point] = {}
            groups: dict[str, list[Point]] = {}
            for entry in namelist:
                if not entry.startswith(cls._DIR_POINTS) or entry.endswith('/'):
                    continue

                with zf.open(entry) as pointFile:
                    pointRoot = XmlUtil.ioToXml(pointFile, 'Point', entry)
                    key = pointRoot.findtext('Key', str(uuid.uuid4()))
                    name = pointRoot.findtext('Name', '名称未設定')
                    group = pointRoot.findtext('Group', str(uuid.uuid4()))

                    objectsElement = XmlUtil.find(pointRoot, 'Objects')
                    objectElements = objectsElement.findall('Object')
                    objects: dict[ObjectCategory, QuantityChange] = {}
                    for objectElement in objectElements:
                        categoryKey = objectElement.get('CategoryKey')
                        category = categories.get(categoryKey)
                        if not category:
                            raise FileFormatError(entry, f'物品カテゴリ \'{categoryKey}\'が存在しません。')

                        fromAmount = XmlUtil.toInt(objectElement.get('From'), 0, entry)
                        toAmount = XmlUtil.toInt(objectElement.get('To'), 0, entry)

                        objects[category] = QuantityChange(fromAmount, toAmount)

                    point = Point(name, objects)
                    points[key] = point
                    cls._appendGroupPoint(groups, group, point)

            with zf.open(cls._FILENAME_PATHS) as pathsFile:
                pathsRoot = XmlUtil.ioToXml(pathsFile, 'PathCollection', cls._FILENAME_PATHS)

                waypointsElement = XmlUtil.find(pathsRoot, 'Waypoints')
                waypointElements = waypointsElement.findall('Waypoint')
                waypoints: dict[str, Waypoint] = {}
                for waypointElement in waypointElements:
                    key = waypointElement.get('Key', str(uuid.uuid4()))
                    name = waypointElement.get('Name', '名称未設定')
                    group = waypointElement.get('Group', str(uuid.uuid4()))

                    waypoint = Waypoint(name)
                    waypoints[key] = waypoint
                    cls._appendGroupPoint(groups, group, waypoint)

                pathsElement = XmlUtil.find(pathsRoot, 'Paths')
                pathElements = pathsElement.findall('Path')
                paths: dict[tuple[Point, Point], Path] = {}
                for pathElement in pathElements:
                    fromKey = pathElement.get('Point1Key', str(uuid.uuid4()))
                    fromPoint = waypoints.get(fromKey, points.get(fromKey))
                    if not fromPoint:
                        raise FileFormatError(cls._FILENAME_PATHS, f'拠点 \'{fromKey}\'が存在しません。')
                    
                    toKey = pathElement.get('Point2Key', str(uuid.uuid4()))
                    toPoint = waypoints.get(toKey, points.get(toKey))
                    if not toPoint:
                        raise FileFormatError(cls._FILENAME_PATHS, f'拠点 \'{toKey}\'が存在しません。')
                    
                    cost = XmlUtil.toInt(pathElement.get('Cost'), 0, cls._FILENAME_PATHS)
                    oppositeCost = XmlUtil.toInt(pathElement.get('OppositeCost'), cost, cls._FILENAME_PATHS)
                    isInternal = XmlUtil.toBool(pathElement.get('IsInternal'), False, cls._FILENAME_PATHS)

                    paths[(fromPoint, toPoint)] = Path(fromPoint, toPoint, cost, isInternal)
                    paths[(toPoint, fromPoint)] = Path(toPoint, fromPoint, oppositeCost, isInternal)

        return Data(categories, points, waypoints, groups, paths)
