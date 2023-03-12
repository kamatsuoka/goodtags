import parseXml from "../xmlparser"

const text = `<?xml version="1.0" encoding="iso-8859-1" ?>
<tags available="5451" count="3" stamp="2022-11-25 20:25:19">
   <tag index="1">
      <id>1809</id>
      <Title>Lost</Title>
      <AltTitle>In Your Eyes</AltTitle>
      <Version>52Eighty Version</Version>
      <WritKey>Minor:G</WritKey>
      <Parts>4</Parts>
      <Type>Barbershop</Type>
      <Recording>part predominant - one part louder, other parts quieter</Recording>
      <TeachVid />
      <Lyrics>And I will wait to face the skies,
ever roaming in your eyes.
There I go lost in your eyes.</Lyrics>
      <Notes>Really epic, and honestly quite easy to learn/teach. Really recommend this one:)</Notes>
      <Arranger>Soren Wohlers</Arranger>
      <Rating>3.7395</Rating>
      <RatingCount>884</RatingCount>
      <Downloaded>134646</Downloaded>
      <stamp>2022-11-25 15:32:38</stamp>
      <SheetMusicAlt>https://www.barbershoptags.com/tags/Lost.jpg</SheetMusicAlt>
      <SheetMusic type="jpg">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1809&amp;fldname=SheetMusic</SheetMusic>
      <Notation />
      <AllParts type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1809&amp;fldname=AllParts</AllParts>
      <Bass type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1809&amp;fldname=Bass</Bass>
      <Bari type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1809&amp;fldname=Bari</Bari>
      <Lead type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1809&amp;fldname=Lead</Lead>
      <Tenor type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1809&amp;fldname=Tenor</Tenor>
      <Other1 />
      <Other2 />
      <Other3 />
      <Other4 />
      <videos available="13" count="13">
         <video index="1">
            <id>1988</id>
            <Desc />
            <SungKey>Major:G</SungKey>
            <Multitrack>Yes</Multitrack>
            <Code>eimjvJ40ZMw</Code>
            <Facebook />
            <SungBy>Ryan O&#039;Leary</SungBy>
            <SungWebsite>http://rmusic.us</SungWebsite>
            <Posted>Wed, 28 Apr 2021</Posted>
         </video>
         <video index="2">
            <id>1632</id>
            <Desc />
            <SungKey />
            <Multitrack>Yes</Multitrack>
            <Code>xZM49GYNsSk</Code>
            <Facebook />
            <SungBy>Two Up Two Down</SungBy>
            <SungWebsite />
            <Posted>Wed, 26 Aug 2020</Posted>
         </video>
      </videos>
   </tag>
   <tag index="2">
      <id>36</id>
      <Title>Last Night was the End of the World</Title>
      <AltTitle />
      <Version />
      <WritKey>Major:F</WritKey>
      <Parts>4</Parts>
      <Type>Barbershop</Type>
      <Posted>Sat, 13 Dec 2008</Posted>
      <Classic>24</Classic>
      <Collection>classic</Collection>
      <Rating>3.4657</Rating>
      <RatingCount>597</RatingCount>
      <Downloaded>85402</Downloaded>
      <stamp>2022-11-25 18:49:44</stamp>
      <SheetMusicAlt>https://www.barbershoptags.com/tags/Last_Night_was_the_End_of_the_World.gif</SheetMusicAlt>
      <SheetMusic type="gif">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=36&amp;fldname=SheetMusic</SheetMusic>
      <Notation />
      <AllParts type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=36&amp;fldname=AllParts</AllParts>
      <Bass type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=36&amp;fldname=Bass</Bass>
      <Bari type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=36&amp;fldname=Bari</Bari>
      <Lead type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=36&amp;fldname=Lead</Lead>
      <Tenor type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=36&amp;fldname=Tenor</Tenor>
      <Other1 />
      <Other2 />
      <Other3 />
      <Other4 />
      <videos available="17" count="17">
         <video index="1">
            <id>2011</id>
            <Desc>A multitrack of this classic barbershop tag. Enjoy! :)</Desc>
            <SungKey>Major:F</SungKey>
            <Multitrack>Yes</Multitrack>
            <Code>qctpBJ7TG3c</Code>
            <Facebook />
            <SungBy>Deven Hunsaker</SungBy>
            <SungWebsite />
            <Posted>Tue, 3 Aug 2021</Posted>
         </video>
         <video index="2">
            <id>1934</id>
            <Desc />
            <SungKey />
            <Multitrack>No</Multitrack>
            <Code>ndwUEm3ozVU</Code>
            <Facebook />
            <SungBy>Jordan Cary</SungBy>
            <SungWebsite />
            <Posted>Sat, 19 Dec 2020</Posted>
         </video>
      </videos>
   </tag>
   <tag index="3">
      <id>1289</id>
      <Title>The Impossible Dream</Title>
      <AltTitle>The Unreachable Star</AltTitle>
      <Version />
      <WritKey>Major:D</WritKey>
      <Parts>4</Parts>
      <Type>Other male</Type>
      <Recording>stereo - one part on one side, the other parts on the other side</Recording>
      <TeachVid />
      <Lyrics>To reach the unreachable star (reach the unreachable star)
a star, the unreachable star</Lyrics>
      <Notes />
      <Arranger>Jay Giallombardo</Arranger>
      <Rating>3.4427</Rating>
      <RatingCount>576</RatingCount>
      <Downloaded>80845</Downloaded>
      <stamp>2022-11-25 04:18:55</stamp>
      <SheetMusicAlt>https://www.barbershoptags.com/tags/The_Impossible_Dream.pdf</SheetMusicAlt>
      <SheetMusic type="pdf">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1289&amp;fldname=SheetMusic</SheetMusic>
      <Notation />
      <AllParts type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1289&amp;fldname=AllParts</AllParts>
      <Bass type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1289&amp;fldname=Bass</Bass>
      <Bari type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1289&amp;fldname=Bari</Bari>
      <Lead type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1289&amp;fldname=Lead</Lead>
      <Tenor type="mp3">https://www.barbershoptags.com/dbaction.php?action=DownloadFile&amp;dbase=tags&amp;id=1289&amp;fldname=Tenor</Tenor>
      <Other1 />
      <Other2 />
      <Other3 />
      <Other4 />
      <videos available="7" count="7">
         <video index="1">
            <id>1812</id>
            <Desc />
            <SungKey />
            <Multitrack>No</Multitrack>
            <Code>ZAlskETJ5gM</Code>
            <Facebook />
            <SungBy>Showpiece</SungBy>
            <SungWebsite>http://www.showpiecequartet.com</SungWebsite>
            <Posted>Thu, 19 Nov 2020</Posted>
         </video>
         <video index="2">
            <id>1758</id>
            <Desc />
            <SungKey />
            <Multitrack>No</Multitrack>
            <Code>RArNTxlTHvw</Code>
            <Facebook />
            <SungBy>Debacle Quartet </SungBy>
            <SungWebsite>http://debaclequartet.com</SungWebsite>
            <Posted>Tue, 17 Nov 2020</Posted>
         </video>
      </videos>
   </tag>
</tags>`

describe("parseXml", () => {
  it("should parse xml", () => {
    const parsed = parseXml(text)
    expect(parseInt(parsed.tags.attr.available, 10)).toEqual(5451)
    expect(parsed.tags.tag.length).toEqual(3)
    expect(parsed.tags.tag[0].Arranger).toEqual("Soren Wohlers")
    expect(parsed.tags.tag[1].Title).toEqual(
      "Last Night was the End of the World",
    )
    expect(parsed.tags.tag[2].videos.video.length).toEqual(2)
  })
  it("should convert xml entities", () => {
    const xml =
      '<?xml version="1.0" encoding="iso-8859-1" ?>' +
      '<tags available="161" count="20" stamp="2022-11-29 20:58:32">' +
      '   <tag index="50">' +
      "      <id>5567</id>" +
      "      <Title>I&#039;ve Got Sunshine in My Life</Title>" +
      "      <WritKey>Major:C</WritKey>" +
      "      <Parts>5</Parts>" +
      "      <Lyrics>I&#039;ve got sunshine in my life (my life)" +
      "I&#039;ve got sunshine in my life</Lyrics>" +
      "    </tag>" +
      "</tags>"
    const parsed = parseXml(xml)
    expect(parsed.tags.tag.Title).toEqual("I've Got Sunshine in My Life")
  })
})
