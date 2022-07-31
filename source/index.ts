import { Collection, MongoClient, WithId, Document } from 'mongodb'

export type BSONValueRaw = string | number | boolean | null
export type BSONValue =
  | BSONValueRaw
  | Array<BSONValueRaw>
  | { [key: string]: BSONValueRaw }

export class Module<T extends { [key: string]: BSONValue }> {
  private name: string
  private collection: Collection

  public readonly moduleName: WithId<Document>

  constructor(module: WithId<Document>, collection: Collection) {
    this.moduleName = module
    this.name = module.module_name
    this.collection = collection
  }

  public async set(key: string, value: BSONValue) {
    return await this.collection.updateOne(
      { module_name: this.name },
      { $set: { [key]: value } }
    )
  }

  public async get(key: keyof T): Promise<BSONValue | undefined> {
    return (await this.collection.findOne({ module_name: this.name }))![
      key as string
    ] as T[typeof key]
  }

  public async keys() {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.keys(res!)
  }

  public async values(): Promise<BSONValue[]> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.values(res!)
  }

  public async entries(): Promise<[string, BSONValue][]> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.entries(res!)
  }

  public async delete(key: string) {
    return await this.collection.updateOne(
      { module_name: this.name },
      { $unset: { [key]: '' } }
    )
  }

  public async clear() {
    return await this.collection.deleteOne({ module_name: this.name })
  }

  public async has(key: string): Promise<boolean> {
    const res = await this.collection.findOne({ module_name: this.name })
    return res![key] !== undefined
  }

  public async size(): Promise<number> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.keys(res!).length
  }

  public async empty(): Promise<boolean> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.keys(res!).length === 0
  }

  public async forEach(callback: (value: BSONValue, key: string) => unknown) {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    for (const key in res!) {
      callback(res![key], key)
    }
  }

  public async forEachAsync(
    callback: (value: BSONValue, key: string) => Promise<unknown>
  ) {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    for (const key in res!) {
      await callback(res![key], key)
    }
  }

  public async map(
    callback: (value: BSONValue, index: number, array: BSONValue[]) => BSONValue
  ): Promise<BSONValue[]> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.values(res!).map(callback)
  }

  public async filter(
    callback: (value: BSONValue, index: number, array: BSONValue[]) => boolean
  ): Promise<BSONValue[]> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.values(res!).filter(callback)
  }

  public async some(
    callback: (value: BSONValue, index: number, array: BSONValue[]) => boolean
  ): Promise<boolean> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.values(res!).some(callback)
  }

  public async every(
    callback: (value: BSONValue, index: number, array: BSONValue[]) => boolean
  ): Promise<boolean> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.values(res!).every(callback)
  }

  public async reduce(
    callback: (
      previousValue: BSONValue,
      currentValue: BSONValue,
      currentIndex: number,
      array: BSONValue[]
    ) => BSONValue,
    initialValue?: BSONValue
  ): Promise<BSONValue> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.values(res!).reduce(callback, initialValue)
  }

  public async obj(): Promise<T> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return res as unknown as T
  }

  public async increment(key: string, value: number) {
    const res = (await this.collection.findOne({ module_name: this.name }))!
    const num =
      (typeof res[key] === 'number' ? (res[key] as number) : 0) + value
    return await this.collection.updateOne(
      { module_name: this.name },
      { $set: { [key]: num } }
    )
  }

  public async at(index: number): Promise<BSONValue | undefined> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return Object.keys(res!).length - 1 >= index
      ? undefined
      : Object.values(res!).at(index)
  }

  public async hasAll(...keys: string[]): Promise<boolean> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return keys.every((key) => res![key] !== undefined)
  }

  public async hasAny(...keys: string[]): Promise<boolean> {
    const res = await this.collection.findOne({ module_name: this.name })
    delete (res as { [key: string]: any })['_id']
    return keys.some((key) => res![key] !== undefined)
  }
}

export class User {
  private readonly client: MongoClient
  private readonly userid: string
  private readonly collection: Collection

  constructor(client: MongoClient, userid: string, options: UserDBOptions) {
    this.client = client
    this.userid = userid
    this.collection = this.client.db(options.db).collection(userid)
  }

  async listModules(): Promise<string[]> {
    return (await this.collection.find({}).toArray()).map((m) => m.module_name)
  }

  async getAllModules() {
    return await this.collection.find({}).toArray()
  }

  async module(
    module_name: string
  ): Promise<Module<{ [key: string]: BSONValue }>> {
    const module = await this.collection.findOne({ module_name })
    if (!module) this.collection.insertOne({ module_name })
    return new Module(
      (await this.collection.findOne({ module_name }))!,
      this.collection
    )
  }
}

export type UserDBOptions = {
  db?: string
}

export class UserDB {
  private readonly client: MongoClient
  private readonly url: string
  connected = false
  db: string | undefined

  constructor(url: string, options: UserDBOptions) {
    this.url = url
    this.client = new MongoClient(url)
    this.db = options.db
  }

  static async connect(url: string, options: UserDBOptions) {
    const db = new UserDB(url, options)
    await db.connect()
    return db
  }

  async connect() {
    await this.client.connect()
    this.connected = true
  }

  getUser(userid: string) {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return new User(this.client, userid, { db: this.db })
  }
}
