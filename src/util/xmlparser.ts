import { X2jOptions, XMLParser } from 'fast-xml-parser'
import { decode } from 'html-entities'

const xmlParseOptions: Partial<X2jOptions> = {
  ignoreDeclaration: true,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  attributesGroupName: 'attr',
  textNodeName: 'text',
  tagValueProcessor: (_: string, tagValue: string) => decode(tagValue),
}

export default function parseXml(text: string): any {
  const parser = new XMLParser(xmlParseOptions)
  return parser.parse(text)
}
