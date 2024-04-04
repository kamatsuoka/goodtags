import {findNonSerializableValue} from "@reduxjs/toolkit"
import {buildSearchResult, buildTagIds, XmlTag} from "../Tag"

// result of calling parseXml on api response text
// and gettine one of xml.tags.tag[]
const xmlTag: XmlTag = {
  id: 1809,
  Title: "Lost",
  AltTitle: "In Your Eyes",
  WritKey: "Minor:G",
  Parts: 4,
  Lyrics:
    "And I will wait to face the skies,\never roaming in your eyes.\nThere I go lost in your eyes.",
  Arranger: "Soren Wohlers",
  Downloaded: 134646,
  SheetMusicAlt: "https://www.barbershoptags.com/tags/Lost.jpg",
  AllParts: {
    text: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=AllParts",
    attr: {
      type: "mp3",
    },
  },
  Bass: {
    text: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Bass",
    attr: {
      type: "mp3",
    },
  },
  Bari: {
    text: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Bari",
    attr: {
      type: "mp3",
    },
  },
  Lead: {
    text: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Lead",
    attr: {
      type: "mp3",
    },
  },
  Tenor: {
    text: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Tenor",
    attr: {
      type: "mp3",
    },
  },
  Posted: "Mon, 26 Dec 2011",
  videos: {
    video: [
      {
        Code: "eimjvJ40ZMw",
        SungBy: "Ryan O&#039;Leary",
      },
      {
        Code: "xZM49GYNsSk",
        SungBy: "Two Up Two Down",
      },
    ],
  },
  attr: {
    index: "1",
  },
}

describe("buildSearchResult", () => {
  it("should extract values", () => {
    const r = buildSearchResult(xmlTag)
    expect(r).toEqual({
      id: 1809,
      title: "Lost",
      aka: "In Your Eyes",
      arranger: "Soren Wohlers",
      key: "Minor:G",
      lyrics:
        "And I will wait to face the skies,\never roaming in your eyes.\nThere I go lost in your eyes.",
      parts: 4,
      posted: "Mon, 26 Dec 2011",
      uri: "https://www.barbershoptags.com/tags/Lost.jpg",
      tracks: [
        {
          part: "AllParts",
          fileType: "mp3",
          url: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=AllParts",
        },
        {
          part: "Tenor",
          fileType: "mp3",
          url: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Tenor",
        },
        {
          part: "Lead",
          fileType: "mp3",
          url: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Lead",
        },
        {
          part: "Bari",
          fileType: "mp3",
          url: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Bari",
        },
        {
          part: "Bass",
          fileType: "mp3",
          url: "https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=1809&fldname=Bass",
        },
      ],
      videos: [
        {
          code: "eimjvJ40ZMw",
          sungBy: "Ryan O&#039;Leary",
        },
        {
          code: "xZM49GYNsSk",
          sungBy: "Two Up Two Down",
        },
      ],
      version: 5,
      searchResultIndex: 1,
      downloaded: 134646,
    })
  })
})

describe("buildTagIds", () => {
  it("should produce serializable results", () => {
    const searchResult = buildSearchResult(xmlTag)
    const {tagsById} = buildTagIds([searchResult])
    const nonser = findNonSerializableValue(tagsById, "test ser")
    expect(nonser).toBe(false)
  })
})
