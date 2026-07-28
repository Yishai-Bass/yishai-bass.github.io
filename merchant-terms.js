const merchantTermsEndpoint = 'https://firestore.googleapis.com/v1/projects/orderup-e241e/databases/(default)/documents/legal/merchant?key=AIzaSyBgkNUKCy9UD7MiK4KRXcuo9RMEamBkLOY'

const merchantTermsDocument = document.querySelector('#merchant-terms-document')
const merchantTermsStatus = document.querySelector('#merchant-terms-status')

function appendInlineMarkdown (parent, source) {
  const tokenPattern = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\))/g
  let cursor = 0
  let match

  while ((match = tokenPattern.exec(source)) !== null) {
    parent.append(document.createTextNode(source.slice(cursor, match.index)))

    if (match[2]) {
      const strong = document.createElement('strong')
      strong.textContent = match[2]
      parent.append(strong)
    } else {
      const link = document.createElement('a')
      link.textContent = match[3]
      link.href = match[4]
      if (match[4].startsWith('https://')) {
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
      }
      parent.append(link)
    }

    cursor = tokenPattern.lastIndex
  }

  parent.append(document.createTextNode(source.slice(cursor)))
}

function appendParagraph (fragment, lines) {
  const paragraph = document.createElement('p')

  lines.forEach((line, index) => {
    const hasHardBreak = /\s{2}$/.test(line)
    appendInlineMarkdown(paragraph, line.trimEnd())

    if (index < lines.length - 1) {
      paragraph.append(hasHardBreak ? document.createElement('br') : document.createTextNode(' '))
    }
  })

  fragment.append(paragraph)
}

function renderMerchantTerms (markdown) {
  const fragment = document.createDocumentFragment()
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  let paragraphLines = []
  let list = null

  const flushParagraph = () => {
    if (paragraphLines.length) {
      appendParagraph(fragment, paragraphLines)
      paragraphLines = []
    }
  }

  const flushList = () => {
    if (list) {
      fragment.append(list)
      list = null
    }
  }

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    const listMatch = line.match(/^\s*[-*]\s+(.+)$/)

    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = Math.min(headingMatch[1].length, 4)
      const heading = document.createElement(`h${level}`)
      appendInlineMarkdown(heading, headingMatch[2])
      fragment.append(heading)
      return
    }

    if (listMatch) {
      flushParagraph()
      if (!list) list = document.createElement('ul')
      const item = document.createElement('li')
      appendInlineMarkdown(item, listMatch[1])
      list.append(item)
      return
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      return
    }

    flushList()
    paragraphLines.push(line)
  })

  flushParagraph()
  flushList()
  merchantTermsDocument.replaceChildren(fragment)
}

async function loadMerchantTerms () {
  if (!merchantTermsDocument || !merchantTermsStatus) return

  try {
    const response = await fetch(merchantTermsEndpoint, {
      headers: { Accept: 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Firestore returned ${response.status}`)
    }

    const payload = await response.json()
    const markdown = payload.fields?.content?.stringValue

    if (!markdown) {
      throw new Error('Merchant terms content is empty')
    }

    renderMerchantTerms(markdown)
  } catch (error) {
    console.error('Could not load merchant terms:', error)
    const message = document.createElement('p')
    message.className = 'legal-error'
    message.append('The Merchant Terms of Service could not be loaded right now. Please try again later or contact ')
    const link = document.createElement('a')
    link.href = 'mailto:team@order-up.co.za'
    link.textContent = 'team@order-up.co.za'
    message.append(link, '.')
    merchantTermsDocument.replaceChildren(message)
  } finally {
    merchantTermsDocument.setAttribute('aria-busy', 'false')
  }
}

loadMerchantTerms()
