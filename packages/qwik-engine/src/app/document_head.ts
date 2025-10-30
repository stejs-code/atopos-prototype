export default class DocumentHead {
  protected elements: HeadElement[] = []

  public addLink(props: LinkElement['props']) {
    this.elements.push({ type: 'link', props })
    return this // allow chaining
  }

  public addMeta(props: MetaElement['props']) {
    this.elements.push({ type: 'meta', props })
    return this
  }

  public addScript(props: ScriptElement['props']) {
    this.elements.push({ type: 'script', props })
    return this
  }

  public getElements(): HeadElement[] {
    return this.elements
  }
}

// Base interface for all head elements
interface HeadElementBase<T extends string, P> {
  type: T
  props: P
}

// Specific element types
interface LinkElement
  extends HeadElementBase<
    'link',
    {
      rel?: string
      href?: string
      as?: string
      type?: string
      media?: string
      [key: string]: any // allow any other valid link attributes
    }
  > {}

interface MetaElement
  extends HeadElementBase<
    'meta',
    {
      name?: string
      content?: string
      charset?: string
      httpEquiv?: string
      [key: string]: any
    }
  > {}

interface ScriptElement
  extends HeadElementBase<
    'script',
    {
      src?: string
      async?: boolean
      defer?: boolean
      type?: string
      [key: string]: any
    }
  > {}

// Union type for any head element
export type HeadElement = LinkElement | MetaElement | ScriptElement
