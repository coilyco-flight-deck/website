// Only the invariants a browser is actually required to observe. Anything
// checkable by reading dist/ lives in src/build-output.test.ts instead, and
// copy is deliberately not pinned here - editing words should not edit tests.
const ROUTES = ["/", "/about/", "/hiring/", "/resume/"]

describe("Layout invariants", () => {
  it("never overflows sideways on a phone", () => {
    cy.viewport(390, 844)
    ;[...ROUTES, "/definitely-not-here/"].forEach((url) => {
      cy.visit(url, { failOnStatusCode: false })
      cy.document().then((document) => {
        const page = document.documentElement

        expect(page.scrollWidth, `${url} scrolls sideways`).to.be.at.most(
          page.clientWidth
        )

        // A clipping ancestor hides overflow from the root number above.
        // See docs/verification.md.
        const clipped = [...document.querySelectorAll<HTMLElement>("*")]
          .filter((element) => {
            const overflowX =
              document.defaultView!.getComputedStyle(element).overflowX

            return (
              overflowX === "hidden" &&
              element.scrollWidth - element.clientWidth > 1
            )
          })
          .map(
            (element) =>
              `${element.tagName.toLowerCase()}.${element.className} ` +
              `(${element.scrollWidth} > ${element.clientWidth})`
          )

        expect(clipped, `${url} hides content behind a clip`).to.deep.equal([])
      })
    })
  })

  it("pairs the About introduction with its portrait on desktop", () => {
    cy.viewport(1280, 900)
    cy.visit("/about/")

    cy.get(".my-life-slide--intro").then(($intro) => {
      const portraitElement = $intro.find(".my-life-intro__portrait").get(0)
      const copyElement = $intro.find(".my-life-slide__copy").get(0)

      if (!portraitElement || !copyElement) {
        throw new Error("About introduction is missing its portrait or copy")
      }

      const portrait = portraitElement.getBoundingClientRect()
      const copy = copyElement.getBoundingClientRect()

      expect(portrait.right, "portrait sits beside the copy").to.be.lessThan(
        copy.left
      )
      expect(portrait.top).to.be.lessThan(copy.bottom)
      expect(copy.top).to.be.lessThan(portrait.bottom)
    })
  })

  it("sizes media by the stylesheet, not by the reserved box", () => {
    // Reserved boxes outrank `aspect-ratio` and a positional test cannot see
    // the result. What breaks without the layout.scss reset: docs/verification.md.
    cy.viewport(1280, 900)
    ;[...ROUTES, "/definitely-not-here/"].forEach((url) => {
      cy.visit(url, { failOnStatusCode: false })
      cy.document().then((document) => {
        const wrong = [
          ...document.querySelectorAll<HTMLElement>("img, video"),
        ].flatMap((element) => {
          const style = document.defaultView!.getComputedStyle(element)
          const [width, height] = style.aspectRatio.split("/").map(Number)
          // The used box, not getBoundingClientRect: a border and the
          // portrait's rotate() both inflate the rect off the ratio.
          const drawnWidth = parseFloat(style.width)
          const drawnHeight = parseFloat(style.height)

          if (!width || !height || !drawnHeight) {
            return []
          }

          return Math.abs(drawnWidth / drawnHeight - width / height) < 0.02
            ? []
            : [
                `${element.tagName.toLowerCase()}.${element.className} ` +
                  `renders ${Math.round(drawnWidth)}x` +
                  `${Math.round(drawnHeight)} against ${style.aspectRatio}`,
              ]
        })

        expect(wrong, `${url} draws media at the wrong shape`).to.deep.equal([])
      })
    })
  })

  it("reaches no third party", () => {
    // Deny by origin, never by initiatorType.
    // See docs/verification.md. The list emptied when the talk embed went.
    const ALLOWED: string[] = []

    ROUTES.forEach((url) => {
      cy.visit(url)
      cy.window().then((browserWindow) => {
        const thirdParty = browserWindow.performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name))
          .filter(
            (resource) =>
              resource.origin !== browserWindow.origin &&
              !ALLOWED.includes(resource.origin)
          )
          .map((resource) => resource.origin + resource.pathname)

        expect(thirdParty, `${url} reaches a third party`).to.deep.equal([])
      })
    })
  })
})
