# rony.blog

Essays, poems, prose and notes, in English and French. Plain HTML, CSS and
JavaScript, served by GitHub Pages. No build step, no dependencies.

## What's here

```
index.html            the whole blog: the posts, the reader, the switches
media/                images (WebP) and clips (MP4) the posts use
library.svg           icons drawn for the blog and not yet given a job
favicon.svg  favicon.ico  favicon-16.png  favicon-32.png
apple-touch-icon.png  icon-512.png      the pentagon, on #00FF33
<post>/  <post>/en/  <post>/fr/         short addresses that open a post,
                                        in a given language
interruptions/  shortest-passage/  incroyable-talent/
                      the posts' first addresses, kept so old links
                      forward to whittaker/, ai-art/ and talent/
CNAME                 rony.blog
```

## The posts

Each post is an entry in `POSTS` in `index.html`: an id, its date, the language
it was written in, its form (`essay`, `poem`, `prose`, `note`) and its parts in
order (text, heading, image, clip or lines of a poem). Translations sit in `TR`,
part for part, and every page that shows one says it was translated
automatically and links to the original.

A new post also needs its short addresses: a folder named after its id, with
`en/` and `fr/` inside, each holding the same three-line redirect as the
others.

## The author's tools

Open the site with `?kit` at the end of the address (`https://rony.blog/?kit`)
to see the tools readers don't: the kit under each post for cutting it down
into an Instagram carousel, a reel and a LinkedIn post, the icon sheet and the
notes on how the blog works. Your browser remembers it. `?kit=off` hides
them again.

## Domain

DNS for rony.blog is at GoDaddy and points at GitHub Pages (four `A` records,
four `AAAA` records and a `www` CNAME to `hereisrony.github.io`). Pages is set
to deploy from the `main` branch, root folder.

## Search and sharing

`tools/build.mjs` reads `POSTS` and `TR` from `index.html` and writes the static
side: the home page in English (`/`) and French (`/fr/`), a full page for
every post and language (`<id>/`, `<id>/en/`, `<id>/fr/`, always with the
trailing slash) with its own title, description, canonical address,
`hreflang` links, share card and `BlogPosting` data, plus `sitemap.xml`,
`robots.txt` and `feed.xml`. The author is named only in this hidden data and
in search descriptions, never on screen: the structured data points to the
same person as ronyefrat.work (`https://www.ronyefrat.work/#person`), so the
two sites read as one author.

Run it after adding or editing a post, then commit everything it wrote:

```
node tools/build.mjs
```

## Icons

Every icon tile is cut to the pentagon of the site icon (the `--pent` shape in
`index.html`), with the drawing inside. Only the site icon itself (header mark,
tab icon, home-screen icon) is a green square with the pentagon in it. A new
icon needs nothing extra: give a post a `glyph` and the tile takes the shape.
A drawing that fills its square (like the oven) is listed in `FIT` with a smaller
size so the pentagon never cuts it.
