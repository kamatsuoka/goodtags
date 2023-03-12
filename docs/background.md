# background

After joining [Fog City Singers](https://www.fogcitysingers.com) in 2018
as a new barbershopper, I noticed that a lot of the younger members pulled
out their phones at afterglows to look at tags on an app. That app had
some real usability challenges, and in my hubris I felt sure I could develop
something better, as a way of expressing the love and gratitude I felt for the
barbershop community.

Building goodtags turned out to be a much bigger project than I expected: I was
an experienced software developer, but mainly in backend tech, and I'd never built
an app before, or even spent much time doing user interface design. I had to
learn to use javascript, typescript, react, react native, react navigation,
redux, xcode, android studio, ios simulators, android emulators, and so on --
all for the first time. But after spending hundreds of hours learning this
whole stack, wrangling countless obscure bugs related to this or that open
source library, and — most frustratingly — working my way through the
minotaur's maze that is the apple app store bureaucracy, I managed to release
a first version just before International in 2019. I had a T-shirt made to
commemorate the occasion and wore it in Salt Lake City.

To be honest, the overall development experience was a mixed one. It started
out as a labor of love. But the software stack was immature in many
ways, and I had to do a lot of ugly hacks to get things working. What's worse,
I had almost no unit tests, and some features -- cloud sync, in particular --
were tenuous at best. I wasn't especially proud of my code.

Some time in 2020 or 2021, I tried to make a few small changes to goodtags,
but I found it hard even to get it to build again. It didn't help that the underlying
libraries, including react native, had changed so quickly in the
meantime. So I more of less gave up and decided I would never update goodtags.
It was good enough.

Then in 2022 google announced that apps in their play store would need to
be compiled against a recent version of android. I got messages from a couple
of users that they couldn't install goodtags. So I scrambled to get a new
version out, one way or another. I ended up biting the bullet and going for
a major rewrite.

Version 2 incorporates new versions of the underlying libraries and is,
for the first time, a fairly streamlined body of code. Recent improvements
to the libraries meant that I didn't have to do so many hacky workarounds
to get things working. And the new UI is, I think, significantly more
streamlined.

Because of the time crunch, I initially cut some features that didn't seem
to be used much: labels, the pitchpipe, sharing favorites, and cloud sync.
After hearing from some beta users that they really did like using labels,
I came up with a redesigned labels UI. I haven't brought back the pitchpipe;
you can always press the note for the tonic of tag on its sheet music view.
And on the list screens, you can long-press the "g" icon to play a "g".

Cloud sync was honestly a huge amount of (mostly fun) work to develop for v1,
mainly because I wanted it to work across multiple devices. It added a huge
amount of complexity to the code overaall. And although I did do some ad hoc
testing, I never developed the level of extensive, automated testing you'd
need to really trust that it works. And sure enough,
I eventually heard from a disappointed user that they got a new phone,
they didn't have a system-level backup of their old phone, and when they
tried to sync their favorites to their new phone it failed. I think it's
probably better not to have a backup feature than to have one that's not
reliable.

All that said, I hope you enjoy using goodtags, and feel free to file
feature requests in this repo. Or if you're a developer, take a look at
[CONTRIBUTING.md](../CONTRIBUTING.md) for information on building goodtags
and submitting code.
