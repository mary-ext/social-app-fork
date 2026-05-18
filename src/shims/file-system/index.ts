export const Paths = {
  cache: 'web-cache',
  document: 'web-document',
}

export class Directory {
  uri: string
  name: string

  constructor(parent: string | Directory, name = '') {
    const base = typeof parent === 'string' ? parent : parent.uri
    this.name = name
    this.uri = name ? `${base}/${name}` : base
  }

  get exists() {
    return false
  }

  create(): void {}

  list(): Array<{name: string}> {
    return []
  }
}

export class File {
  uri: string
  name: string

  constructor(parent: string | Directory, name = '') {
    const base = typeof parent === 'string' ? parent : parent.uri
    this.name = name || base.split('/').pop() || 'file'
    this.uri = name ? `${base}/${name}` : base
  }

  get exists() {
    return false
  }

  get size() {
    return 0
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.uri.startsWith('blob:') || this.uri.startsWith('data:')) {
      return fetch(this.uri).then(r => r.arrayBuffer())
    }
    return new ArrayBuffer(0)
  }

  copy(_destination: File): void {}
  delete(): void {}
}
