import types

class ObjectCategory:
    def __init__(self, name: str):
        self.name = name

    def __repr__(self):
        return f'\'{self.name}\''

class QuantityChange:
    def __init__(self, fromAmount: int, toAmount: int):
        self.fromAmount = fromAmount
        self.toAmount = toAmount

    def __repr__(self):
        return f'{self.fromAmount} -> {self.toAmount}'

class Point:
    def __init__(self, name: str, objects: dict[ObjectCategory, QuantityChange]):
        self.name = name
        self.objects = types.MappingProxyType(objects)

    def __repr__(self):
        return f'<\'{self.name}\': {self.objects}>'

class Waypoint(Point):
    def __init__(self, name: str):
        super().__init__(name, {})

    def __repr__(self):
        return f'\'{self.name}\''

class Path:
    def __init__(self, fromPoint: Point, toPoint: Point, cost: int, isInternal: bool):
        self.fromPoint = fromPoint
        self.toPoint = toPoint
        self.cost = cost
        self.isInternal = isInternal

    def __repr__(self):
        text = f'\'{self.fromPoint.name}\' -{self.cost}-> \'{self.toPoint.name}\''
        if self.isInternal:
            text += ' (Internal)'
        return '<' + text + '>'

class Route:
    def __init__(self, tracks: list[tuple[Path, bool]]):
        self.tracks = tuple(tracks)

class RouteSet:
    def __init__(self, routes: dict[tuple[Point, Point], Route]):
        self.routes = types.MappingProxyType(routes)
