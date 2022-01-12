import { relative } from 'path'
import { render, h, createContext, useContext } from 'hyperjsx'
import { mdjsx } from './mdjsx.mjs'
import { textContent, firstParagraph } from './markdown.mjs'

const Path = createContext()
const usePath = () => useContext(Path)
const useRelPath = to => relative(usePath(), to)

export function Index({ frontmatters, Content }) {
  return (
    h(Path, { value: '/' },
      h(Document,
        h('title', 'Today I Learned / Lee Byron'),
        ...OpenGraph({
          'og:url': 'https://leebyron.com/til/',
          'og:title': 'Lee Byron / til',
          'og:description': 'Today I Learned: A bunch of brief blurbs on miscellaneous matter.',
          'twitter:card': 'summary',
          'twitter:title': 'Lee Byron / til: A bunch of brief blurbs on miscellaneous matter.',
          'twitter:creator': '@leeb',
        }),
        JSONLD({
          '@type': 'Collection',
          name: 'Today I Learned',
          author: {
            '@type': 'Person',
            name: 'Lee Byron',
            url: 'http://leebyron.com' },
          url: 'https://leebyron.com/til/',
          collectionSize: frontmatters.length,
          license: 'https://creativecommons.org/licenses/by/4.0/',
        }),
        h('section',
          h(Content, { components }),
          h('h2', { id: 'entry-log' },
            h('a', { href: '#entry-log', 'data-anchor': true },
               'entry log')),
          frontmatters.map(frontmatter =>
            h('div', { class: 'entrylog' },
              h('a', { href: `${frontmatter.permalink}/` }, frontmatter.title),
              h('pre', { class: 'timestamp' },
                h('span', { class: 'p2' }, frontmatter.date.toFormat('ccc, ')),
                h('span', { class: 'p0' }, frontmatter.date.toFormat('dd LLL yyyy')),
                h('span', { class: 'p1' }, frontmatter.date.toFormat(' HH:mm')),
                h('span', { class: 'p3' }, frontmatter.date.toFormat(':ss ZZ')),
              )
            )
          )
        ),
        h('footer',
          h(License, { year: '2022' })
        )
      )
    )
  )
}

export function Feed({ entries }) {
  return (
    h('feed', { xmlns: 'http://www.w3.org/2005/Atom', 'xml:lang': 'en-us' },
      h('id', 'https://leebyron.com/til/feed.xml' ),
      h('link', { rel: 'self', type: 'application/atom+xml', href: 'https://leebyron.com/til/feed.xml' }),
      h('link', { rel: 'alternate', type: 'text/html', href: 'https://leebyron.com/til/' }),
      h('updated', entries.map(e => e.lastModified).sort((a, b) => a - b).pop().toISO()),
      h('title', 'Lee Byron / til'),
      h('subtitle', 'Today I Learned: A bunch of brief blurbs on miscellaneous matter.'),
      h('icon', 'https://leebyron.com/til/assets/favicon.png'),
      h('author', h('name', 'Lee Byron'), h('uri', 'https://leebyron.com')),
      h('rights', '© 2022 Lee Byron ⸱ licensed under CC BY 4.0'),
      h('generator', { uri: 'https://github.com/leebyron/til' }, 'til'),
      entries.map(({ markdown, frontmatter, lastModified }) =>
        h('entry',
          h('id', `https://leebyron.com/til/${frontmatter.permalink}/`),
          h('link', { rel: 'alternate', type: 'text/html', href: `https://leebyron.com/til/${frontmatter.permalink}/` }),
          h('published', frontmatter.date.toISO()),
          h('updated', lastModified.toISO()),
          h('title', frontmatter.title),
          h('author', h('name', 'Lee Byron'), h('uri', 'https://leebyron.com')),
          frontmatter.tags.map(tag => h('category', { term: tag })),
          h('content', { type: 'html', innerHTML: `<![CDATA[${
            render(mdjsx(markdown, { components }))
          }]]>` }),
          h('rights', `© ${frontmatter.date.year} Lee Byron ⸱ licensed under CC BY 4.0`)
        )
      )
    )
  )
}

export function Page({ filename, lastModified, frontmatter, markdown, Content }) {
  return (
    h(Path, { value: `/${frontmatter.permalink}/` },
      h(Document,
        frontmatter.published === false &&
-          h('meta', { name: 'robots', content: 'noindex' }),
        h('title', `til / ${frontmatter.title} — Lee Byron`),
        ...OpenGraph({
          'og:url': `https://leebyron.com/til/${frontmatter.permalink}/`,
          'og:title': `til / ${frontmatter.title} — Lee Byron`,
          'og:description': textContent(firstParagraph(markdown)).slice(0, 200),
          'og:type': 'article',
          'article:author:first_name': 'Lee',
          'article:author:last_name': 'Byron',
          'article:published_time': frontmatter.date.toISO(),
          'article:modified_time': lastModified.toISO(),
          'twitter:card': 'summary',
          'twitter:creator': '@leeb',
        }),
        JSONLD({
          '@type': 'LearningResource',
          name: frontmatter.title,
          author: {
            '@type': 'Person',
            name: 'Lee Byron',
            url: 'http://leebyron.com' },
          url: `https://leebyron.com/til/${frontmatter.permalink}/`,
          datePublished: frontmatter.date.toISO(),
          dateModified: lastModified.toISO(),
          keywords: frontmatter.tags.join(', ') || undefined,
          isPartOf: 'https://leebyron.com/til/',
          license: 'https://creativecommons.org/licenses/by/4.0/',
        }),
        h('article',
          h('h1',
            h('a', { href: '../' }, 'til'),
            h('span', frontmatter.title)
          ),
          h(Content, { components }),
        ),
        h('footer',
          h(License, { year: frontmatter.date.year },
            h(Attribution, { filename, frontmatter })
          )
        )
      )
    )
  )
}

function Document({ children }) {
  return (
    h('html',
      h('head',
        h('meta', { charset: 'UTF-8' }),
        children.filter(isHeadElement),
        h('meta', { name: 'viewport', content:'width=device-width, initial-scale=1'}),
        h('link', { rel: 'canonical', href: `https://leebyron.com/til${usePath()}`}),
        h('link', { rel: 'shortcut icon', href: useRelPath('/assets/favicon.png') }),
        h('link', { rel: 'stylesheet', href: useRelPath('/assets/style.css') }),
        h('link', { rel: 'alternate', type: 'application/atom+xml', title: 'Reader Feed', href: useRelPath('/feed.xml') }),
        h(GTag),
      ),
      h('body',
        h('header',
          h('a', { href: 'https://leebyron.com' },
            h('img', { src: useRelPath('/assets/logo.svg'), alt: 'Lee Byron' })
          )
        ),
        children.filter(child => !isHeadElement(child)),
      )
    )
  )
}

function isHeadElement(element) {
  switch (element.type) {
    case 'title':
    case 'meta':
    case 'link':
    case 'script':
      return true
  }
  return false
}

function OpenGraph(data) {
  return Object.entries(data) .map(([name, content]) => content && h('meta', {
    [name.startsWith('twitter:') ? 'name' : 'property']: name,
    content
  }))
}

function JSONLD(data) {
  data = { '@context': 'https://schema.org/', ...data }
  return h('script', {
    type: 'application/ld+json',
    innerHTML: `\n${JSON.stringify(data, null, 2)}\n`
  })
}

function GTag() {
  return [
    h('script', { async: true, src: "https://www.googletagmanager.com/gtag/js?id=UA-61714711-1" }),
    h('script', { innerHTML: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-61714711-1');
    ` })
  ]
}

function Attribution({ filename, frontmatter: { permalink, date } }) {
  return [
    // attribution
    'This ',
    h('a', {
      property: "dct:title",
      rel: "cc:attributionURL",
      href: `https://leebyron.com/til/${permalink}/` },
      'til'),

    // time
    ' was created ',
    h('span', { property: 'dct:created', content: date.toISO() },
      date.toLocaleString({
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      })),

    ' ⸱ ',

    // edit
    h('a', { href: `https://raw.githubusercontent.com/leebyron/til/main/entries/${encodeURIComponent(filename)}`, target: '__blank' },
      'raw'),

    ' ⸱ ',

    // edit
    h('a', { href: `https://github.com/leebyron/til/edit/main/entries/${encodeURIComponent(filename)}#L8`, target: '__blank' },
      'edit'),
  ]
}

function License({ year, children }) {
  return h('div', {
    class: 'license',
    'xmlns:cc': "http://creativecommons.org/ns",
    'xmlns:dct': "http://purl.org/dc/terms/" },

    children,
    children && h('br'),

    // copyright
    '© ',
    h('span', { rel: 'dct:dateCopyrighted' }, year),
    ' ',
    h('a', {
      rel: "cc:attributionURL dct:creator",
      property: "cc:attributionName",
      href: "https://leebyron.com" },
      'Lee Byron'),

    ' ⸱ ',

    // license
    'licensed under ',
    h('a', {
      href: "http://creativecommons.org/licenses/by/4.0/",
      target: "_blank",
      rel: "cc:license license noopener noreferrer" },
      'CC BY 4.0',
      h('img', { src: "https://mirrors.creativecommons.org/presskit/icons/cc.svg" }),
      h('img', { src: "https://mirrors.creativecommons.org/presskit/icons/by.svg" })
    ),

    ' ⸱ ',

    h('a', { href: useRelPath('/feed.xml'), rel: 'alternate feed', type: 'application/atom+xml' }, 'feed')
  )
}

// List of components to expose via MDX
const components = {
  YouTube,
}

function YouTube({ v, aspectRatio }) {
  return h('div', {
    class: 'yt-player',
    style: { '--aspectRatio': aspectRatio }},
    h('iframe', {
      src:`https://www.youtube.com/embed/${v}`,
      title:"YouTube video player",
      frameborder:"0",
      allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      allowfullscreen:true
    })
  )
}
