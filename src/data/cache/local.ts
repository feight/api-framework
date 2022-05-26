export class LocalCache {
    private store: Record<string, string> = {};

    hasCache(key: string) {
        return Object.keys(this.store).includes(key);
    }

    getCache(key: string, setter: () => string) {
        if (this.hasCache(key)) {
            return this.store[key];
        }

        this.store[key] = setter();

        return this.store[key];
    }
}

export const cache = new LocalCache();
