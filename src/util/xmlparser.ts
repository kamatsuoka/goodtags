import { X2jOptionsOptional, XMLParser } from 'fast-xml-parser'
import { decode } from 'html-entities'

const xmlParseOptions: X2jOptionsOptional = {
  ignoreDeclaration: true,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  attributesGroupName: 'attr',
  textNodeName: 'text',
  tagValueProcessor: (tagName, tagValue) => decode(tagValue),
}

export default function parseXml(text: string): any {
  const parser = new XMLParser(xmlParseOptions)
  return parser.parse(text)
}
