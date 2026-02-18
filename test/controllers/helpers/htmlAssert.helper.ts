import { JSDOM } from "jsdom"

import Optional from "app/models/optional"

export default class HtmlAssertHelper {
    private dom: JSDOM

    public constructor (html: string) {
        this.dom = new JSDOM(html)
    }

    public hasAttribute (selector: string, attr: string): boolean {
        return this.getElement(selector)?.hasAttribute(attr) || false
    }

    public getAttributeValue (selector: string, attr: string): Optional<string> {
        return this.getElement(selector)?.getAttribute(attr)
    }

    public getValue (selector: string): Optional<string> {
        return this.getAttributeValue(selector, "value")
    }

    public hasText (selector: string, expectedValue: string): boolean {
        return this.getText(selector) === expectedValue
    }

    public containsText (selector: string, expectedValue: string): boolean {
        return this.getText(selector)?.includes(expectedValue) || false
    }

    public selectorExists (selector: string): boolean {
        return !!this.getElement(selector)
    }

    public selectorDoesNotExist (selector: string): boolean {
        return !this.getElement(selector)
    }

    private getElement (selector: string): Optional<Element> {
        return this.dom.window.document.querySelector(selector)
    }

    public getText (selector: string): Optional<string> {
        return this.getElement(selector)?.textContent?.trim()
    }

    public getAllTexts (selector: string): string[] {
        return Array.from(this.dom.window.document.querySelectorAll(selector))
            .map(el => el.textContent?.trim() || "")
    }

    public getInnerHTML (selector: string): Optional<string> {
        return this.getElement(selector)?.innerHTML || null
    }

    public containsRawText (text: string): boolean {
        return this.dom.window.document.documentElement.textContent?.includes(text) || false
    }
}

/**
 * Returns true if for each expected string, at least one element in the actual array contains it as a substring.
 * This is more flexible than includeMembers, which requires exact matches.
 */
export function arrayContainsSubstrings (actual: string[], expected: string[]): boolean {
    return expected.every(exp => actual.some(act => act.includes(exp)))
}
