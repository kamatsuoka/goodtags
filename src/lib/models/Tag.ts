import { DbRow } from '@app/modules/searchutil'
import _ from 'lodash'
import parseXml from '../../util/xmlparser'

export const CurrentTagVersion = 5

export default interface Tag {
  id: number
  title: string
  aka: string
  lyrics: string
  uri: string
  parts: number
  arranger: string
  posted: string
  key: string
  version?: number
  quartet?: string
  quartetUrl?: string
  tracks: Tracks
  videos: Video[]
}

export const EmptyTag: Tag = {
  id: -1,
  title: '',
  aka: '',
  lyrics: '',
  uri: '',
  parts: 0,
  arranger: '',
  posted: '',
  key: '',
  tracks: [],
  videos: [],
}

export interface XmlAttributes {
  [index: string]: string
}

export interface XmlTrack {
  text: string
  attr: {
    type: string
  }
}

export enum TrackPart {
  AllParts = 'AllParts',
  Tenor = 'Tenor',
  Lead = 'Lead',
  Bari = 'Bari',
  Bass = 'Bass',
}

export interface XmlVideo {
  Code: string
  SungBy: string
}

export interface XmlTag {
  attr: XmlAttributes
  id: number
  Title: string
  AltTitle: string
  Lyrics: string
  SheetMusicAlt: string
  Parts: number
  Downloaded: number
  Arranger: string
  Posted: string
  WritKey: string
  Bass?: XmlTrack
  Bari?: XmlTrack
  Lead?: XmlTrack
  Tenor?: XmlTrack
  AllParts?: XmlTrack
  Quartet?: string
  QWebsite?: string
  videos?: {
    video: Array<XmlVideo>
  }
}

export function buildTag(
  id: number,
  title: string,
  aka: string,
  arranger: string,
  key: string,
  lyrics: string,
  parts: number,
  posted: string,
  uri: string,
  quartet?: string,
  quartetUrl?: string,
  version?: number,
  tracks?: Tracks,
  videos?: Array<Video>,
): Tag {
  return {
    id,
    title,
    aka,
    arranger,
    key,
    lyrics,
    parts,
    posted,
    uri,
    quartet,
    quartetUrl,
    version,
    tracks: tracks ? tracks : [],
    videos: videos ? videos : [],
  }
}

function extractTracks(xmlTag: XmlTag): Tracks {
  return _.compact(
    [
      TrackPart.AllParts,
      TrackPart.Tenor,
      TrackPart.Lead,
      TrackPart.Bari,
      TrackPart.Bass,
    ].map(part => extractTrack(part, xmlTag)),
  )
}

function extractVideos(xmlTag: XmlTag): Array<Video> {
  if (xmlTag.videos?.video) {
    const videos = Array.isArray(xmlTag.videos.video)
      ? xmlTag.videos.video
      : [xmlTag.videos.video]
    return videos.map(extractVideo)
  } else return []
}

function extractTrack(part: TrackPart, xmlTag: XmlTag): Track | undefined {
  switch (part) {
    case TrackPart.AllParts:
      return buildTrack(part, xmlTag.AllParts)
    case TrackPart.Tenor:
      return buildTrack(part, xmlTag.Tenor)
    case TrackPart.Lead:
      return buildTrack(part, xmlTag.Lead)
    case TrackPart.Bari:
      return buildTrack(part, xmlTag.Bari)
    case TrackPart.Bass:
      return buildTrack(part, xmlTag.Bass)
    default:
      throw Error(`unknown part ${part}`)
  }
}

function buildTrack(part: TrackPart, xmlTrack?: XmlTrack): Track | undefined {
  if (xmlTrack?.attr?.type === 'mp3') {
    return {
      part: part,
      fileType: xmlTrack.attr.type,
      url: xmlTrack.text,
    }
  } else {
    return undefined
  }
}

function extractVideo(xmlVideo: XmlVideo): Video {
  return {
    code: xmlVideo.Code,
    sungBy: xmlVideo.SungBy,
  }
}

export interface Track {
  part: TrackPart
  fileType: string // e.g. mp3
  url: string // sound file
}

export type Tracks = Track[]

export interface Video {
  code: string
  sungBy?: string
}

export interface SearchResult extends Tag {
  searchResultIndex: number
  downloaded: number
}

export function tagFromApiXml(t: XmlTag): SearchResult {
  const tag = buildTag(
    t.id,
    t.Title,
    t.AltTitle,
    t.Arranger,
    t.WritKey,
    t.Lyrics,
    t.Parts,
    t.Posted,
    t.SheetMusicAlt,
    t.Quartet,
    t.QWebsite,
    CurrentTagVersion,
    extractTracks(t),
    extractVideos(t),
  ) as SearchResult
  tag.searchResultIndex = parseInt(t.attr.index, 10) - 1 // Convert 1-based index from API to 0-based
  tag.downloaded = t.Downloaded
  tag.posted = new Date(tag.posted).toISOString().split('T')[0]
  return tag
}

function tagFromDbRow(
  row: DbRow,
  tracks: Track[],
  videos: Video[],
  idx: number,
): SearchResult {
  const tag = buildTag(
    row.id,
    row.title,
    row.alt_title,
    row.arranger,
    row.key,
    row.lyrics,
    row.parts,
    row.posted,
    row.sheet_music_alt,
    row.quartet,
    row.quartet_url,
    CurrentTagVersion,
    tracks,
    videos,
  )
  return {
    ...tag,
    searchResultIndex: idx,
    downloaded: row.downloaded,
  }
}

export interface TagsById {
  [key: number]: Tag
}

export interface SearchResultsById {
  [key: number]: SearchResult
}

export interface IdsByString {
  [key: string]: Array<number>
}

export interface StringsByNumber {
  [key: number]: Array<string>
}

export function buildTagIds(tags: Array<SearchResult>) {
  const tagsById: SearchResultsById = _.fromPairs(tags.map(t => [t.id, t]))
  const allTagIds = tags.map(t => t.id)
  return {
    tagsById,
    allTagIds,
  }
}

export interface ConvertedTags {
  available: number
  tags: SearchResult[]
  highestIndex: number
}

export function tagsFromApiResponse(responseText: string): ConvertedTags {
  const xmlObj = parseXml(responseText)
  const available: number = parseInt(xmlObj.tags.attr.available, 10)
  const xmlTags = xmlObj.tags.tag || []
  const rawTags: XmlTag[] = Array.isArray(xmlTags) ? xmlTags : [xmlTags]
  const tags: SearchResult[] = rawTags.map((t: XmlTag) => tagFromApiXml(t))
  const highestIndex: number =
    tags.length > 0 ? tags[tags.length - 1].searchResultIndex : 0
  return {
    available,
    tags,
    highestIndex,
  }
}

export function tagsFromDbRows(
  tagRows: DbRow[],
  trackRows: DbRow[],
  videoRows: DbRow[],
  count: string,
  offset: number,
): ConvertedTags {
  const available = parseInt(count, 10)
  const tracksById = groupByTagId(trackRows, row => row as Track)
  const videosById = groupByTagId(videoRows, row => row as Video)
  const tags = tagRows.map((row, idx) =>
    tagFromDbRow(row, tracksById[row.id], videosById[row.id], idx),
  )
  const highestIndex: number =
    tags.length > 0 ? offset + tags[tags.length - 1].searchResultIndex : 0
  return {
    available,
    tags,
    highestIndex,
  }
}

function groupByTagId<T>(
  rows: DbRow[],
  transform: (row: DbRow) => T,
): { [id: string]: T[] } {
  const byId: { [id: string]: T[] } = {}
  rows.forEach(({ tag_id, ...row }) => {
    const group: T[] = byId[tag_id] || []
    group.push(transform(row))
    byId[tag_id] = group
  })
  return byId
}
