import typing
from xml.etree import ElementTree

class FileFormatError(Exception):
    def __init__(self, fileName: str, message: str | None = None, innerException: Exception | None = None):
        self.fileName = fileName
        self.innerException = innerException

        if not message:
            if innerException:
                message = innerException.args[0]
            else:
                message = 'ファイルの読込に失敗しました。ファイルが破損している可能性があります。'
        super().__init__([f'Failed to parse \'{fileName}\'. ' + message])

class XmlUtil:
    @staticmethod
    def ioToXml(f: typing.IO[bytes], rootTag: str, fileName: str) -> ElementTree.Element:
        try:
            bin = f.read()
            content = bin.decode()
            root = ElementTree.fromstring(content)
        except Exception as e:
            raise FileFormatError(fileName, innerException=e)
        if root.tag != rootTag:
            raise FileFormatError(fileName, f'ルート要素名 \'{root.tag}\'が間違っています。正しくは \'{rootTag}\' です。')
        return root
    
    @staticmethod
    def find(element: ElementTree.Element, tag: str) -> ElementTree.Element:
        child = element.find(tag)
        if child:
            return child
        else:
            return ElementTree.Element(tag)
        
    @staticmethod
    def toInt(text: str, default: int, fileName: str) -> int:
        if text is None:
            return default
        try:
            return int(text)
        except ValueError:
            FileFormatError(fileName, f'\'{text}\' は整数値ではありません。')
        
    @staticmethod
    def toBool(text: str, default: bool, fileName: str) -> bool:
        if text is None:
            return default
        text = text.lower()
        if text == 'false':
            return False
        elif text == 'true':
            return True
        else:
            FileFormatError(fileName, f'\'{text}\' は真偽値ではありません。')