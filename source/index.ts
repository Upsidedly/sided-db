import { Collection, MongoClient, WithId, Document } from 'mongodb';

type BSONValueRaw = string | number | boolean | null;
type BSONValue = BSONValueRaw | Array<BSONValueRaw> | { [key: string]: BSONValueRaw };

export class Module {
  private client: MongoClient
  private mod: WithId<Document>
  private name: string
  private collection: Collection

  constructor(client: MongoClient, module: WithId<Document>, collection: Collection) {
    this.client = client
    this.mod = module
    this.name = module.module_name
    this.collection = collection
  }

  public async set(key: string, value: any) {
    return await this.collection.updateOne({ module_name: this.name }, { $set: { [key]: value } })
  }

  public async get(key: string): Promise<BSONValue | undefined> {
    return (await this.collection.findOne({ module_name: this.name }))![key]
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
        return await this.collection.updateOne({ module_name: this.name }, { $unset: { [key]: "" } })
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

    public async forEachAsync(callback: (value: BSONValue, key: string) => Promise<unknown>) {
        const res = await this.collection.findOne({ module_name: this.name })
        delete (res as { [key: string]: any })['_id']
        for (const key in res!) {
            await callback(res![key], key)
        }
    }

    public async map(callback: (value: BSONValue, index: number, array: BSONValue[]) => BSONValue): Promise<BSONValue[]> {
        const res = await this.collection.findOne({ module_name: this.name })
        delete (res as { [key: string]: any })['_id']
        return Object.values(res!).map(callback)
    }

    public async filter(callback: (value: BSONValue, index: number, array: BSONValue[]) => boolean): Promise<BSONValue[]> {
        const res = await this.collection.findOne({ module_name: this.name })
        delete (res as { [key: string]: any })['_id']
        return Object.values(res!).filter(callback)
    }

    public async some(callback: (value: BSONValue, index: number, array: BSONValue[]) => boolean): Promise<boolean> {
        const res = await this.collection.findOne({ module_name: this.name })
        delete (res as { [key: string]: any })['_id']
        return Object.values(res!).some(callback)
    }

    public async every(callback: (value: BSONValue, index: number, array: BSONValue[]) => boolean): Promise<boolean> {
        const res = await this.collection.findOne({ module_name: this.name })
        delete (res as { [key: string]: any })['_id']
        return Object.values(res!).every(callback)
    }

    public async reduce(callback: (previousValue: BSONValue, currentValue: BSONValue, currentIndex: number, array: BSONValue[]) => BSONValue, initialValue?: BSONValue): Promise<BSONValue> {
        const res = await this.collection.findOne({ module_name: this.name })
        delete (res as { [key: string]: any })['_id']
        return Object.values(res!).reduce(callback, initialValue)
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
        return (await this.collection.find({}).toArray()).map(m => m.module_name)
    }

    async getAllModules() {
        return (await this.collection.find({}).toArray())
    }

    async module(module_name: string): Promise<Module> {
        const module = await this.collection.findOne({ module_name })
        if (!module) this.collection.insertOne({ module_name })
        return new Module(this.client, (await this.collection.findOne({ module_name }))!, this.collection)
    }
}

type UserDBOptions = {
    db?: string
}

export class UserDB {
    private readonly client: MongoClient;
    private readonly url: string;
    connected = false;
    db: string | undefined;

    constructor(url: string, options: UserDBOptions) {
        this.url = url;
        this.client = new MongoClient(url)
        this.db = options.db
    }

    static async connect(url: string, options: UserDBOptions) {
        const db = new UserDB(url, options);
        await db.connect();
        return db;
    }

    async connect() {
        await this.client.connect()
        this.connected = true
    }

    getPlayer(userid: string) {
        if (!this.connected) {
            throw new Error("Not connected")
        }
        return new User(this.client, userid, { db: this.db });
    }
}