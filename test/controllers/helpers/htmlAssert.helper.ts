import { JSDOM } from "jsdom";

import Optional from "app/models/optional";

export default class HtmlAssertHelper {
  private dom: JSDOM

  public constructor (html: string) {
      this.dom = new JSDOM(html);
  }

  public hasAttribute (selector: string, attr: string): boolean {
      return this.getElement(selector)?.hasAttribute(attr) || false;
  }

  public getAttributeValue (selector: string, attr: string): Optional<string> {
      return this.getElement(selector)?.getAttribute(attr);
  }

  public getValue (selector: string): Optional<string> {
      return this.getAttributeValue(selector, "value");
  }

  public hasText (selector: string, expectedValue: string): boolean {
      return this.getText(selector) === expectedValue;
  }

  public containsText (selector: string, expectedValue: string): boolean {
      return this.getText(selector)?.includes(expectedValue) || false;
  }

  public selectorExists (selector: string): boolean {
      return !!this.getElement(selector);
  }

  public selectorDoesNotExist (selector: string): boolean {
      return !this.getElement(selector);
  }

  private getElement (selector: string): Optional<Element> {
      return this.dom.window.document.querySelector(selector);
  }

  private getText (selector: string): Optional<string> {
      return this.getElement(selector)?.textContent?.trim();
  }
}
