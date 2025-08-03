from local.io.data import *
from local.entities import *

def main():
    data = Data.load('../_Samples/SampleData.dat')

    print('Object categories:')
    print(data.objectCategories)
    print()
    print('Points:')
    print(data.points)
    print()
    print('Waypoints:')
    print(data.waypoints)
    print()
    print('Point groups:')
    print(data.groups)
    print()
    print('Paths:')
    print(data.paths)

if __name__ == '__main__':
    main()
    