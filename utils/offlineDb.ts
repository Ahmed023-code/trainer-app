/**
 * Offline Database using IndexedDB
 * Stores exercise library data and cached GIFs for offline access
 */

const DB_NAME = 'trainer-app-offline'
const DB_VERSION = 1

// Store names
const EXERCISES_STORE = 'exercises'
const BODYPARTS_STORE = 'bodyparts'
const EQUIPMENTS_STORE = 'equipments'
const MUSCLES_STORE = 'muscles'
const GIF_CACHE_STORE = 'gif-cache'

export interface ExerciseDBExercise {
  exerciseId: string
  name: string
  gifUrl: string
  targetMuscles: string[]
  bodyParts: string[]
  equipments: string[]
  secondaryMuscles: string[]
  instructions: string[]
}

export interface CachedGif {
  url: string
  blob: Blob
  timestamp: number
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(EXERCISES_STORE)) {
          const exerciseStore = db.createObjectStore(EXERCISES_STORE, {
            keyPath: 'exerciseId',
          })
          exerciseStore.createIndex('name', 'name', { unique: false })
          exerciseStore.createIndex('bodyParts', 'bodyParts', {
            unique: false,
            multiEntry: true,
          })
          exerciseStore.createIndex('equipments', 'equipments', {
            unique: false,
            multiEntry: true,
          })
          exerciseStore.createIndex('targetMuscles', 'targetMuscles', {
            unique: false,
            multiEntry: true,
          })
        }

        if (!db.objectStoreNames.contains(BODYPARTS_STORE)) {
          db.createObjectStore(BODYPARTS_STORE, { keyPath: 'name' })
        }

        if (!db.objectStoreNames.contains(EQUIPMENTS_STORE)) {
          db.createObjectStore(EQUIPMENTS_STORE, { keyPath: 'name' })
        }

        if (!db.objectStoreNames.contains(MUSCLES_STORE)) {
          db.createObjectStore(MUSCLES_STORE, { keyPath: 'name' })
        }

        if (!db.objectStoreNames.contains(GIF_CACHE_STORE)) {
          const gifStore = db.createObjectStore(GIF_CACHE_STORE, {
            keyPath: 'url',
          })
          gifStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly',
  ): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized')
    const transaction = this.db.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // ========== Exercises ==========
  async saveExercises(exercises: ExerciseDBExercise[]): Promise<void> {
    const store = this.getStore(EXERCISES_STORE, 'readwrite')
    const promises = exercises.map((exercise) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(exercise)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
    await Promise.all(promises)
  }

  async getAllExercises(): Promise<ExerciseDBExercise[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(EXERCISES_STORE)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getExerciseById(
    exerciseId: string,
  ): Promise<ExerciseDBExercise | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(EXERCISES_STORE)
      const request = store.get(exerciseId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async searchExercises(query: string): Promise<ExerciseDBExercise[]> {
    const allExercises = await this.getAllExercises()
    const lowerQuery = query.toLowerCase()

    return allExercises.filter((ex) => {
      return (
        ex.name.toLowerCase().includes(lowerQuery) ||
        ex.bodyParts.some((bp) => bp.toLowerCase().includes(lowerQuery)) ||
        ex.equipments.some((eq) => eq.toLowerCase().includes(lowerQuery)) ||
        ex.targetMuscles.some((tm) => tm.toLowerCase().includes(lowerQuery))
      )
    })
  }

  async saveCustomExercise(exercise: ExerciseDBExercise): Promise<void> {
    const store = this.getStore(EXERCISES_STORE, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(exercise)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ========== Body Parts ==========
  async saveBodyParts(bodyParts: { name: string }[]): Promise<void> {
    const store = this.getStore(BODYPARTS_STORE, 'readwrite')
    const promises = bodyParts.map((bp) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(bp)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
    await Promise.all(promises)
  }

  async getAllBodyParts(): Promise<{ name: string }[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(BODYPARTS_STORE)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // ========== Equipment ==========
  async saveEquipments(equipments: { name: string }[]): Promise<void> {
    const store = this.getStore(EQUIPMENTS_STORE, 'readwrite')
    const promises = equipments.map((eq) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(eq)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
    await Promise.all(promises)
  }

  async getAllEquipments(): Promise<{ name: string }[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(EQUIPMENTS_STORE)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // ========== Muscles ==========
  async saveMuscles(muscles: { name: string }[]): Promise<void> {
    const store = this.getStore(MUSCLES_STORE, 'readwrite')
    const promises = muscles.map((m) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(m)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
    await Promise.all(promises)
  }

  async getAllMuscles(): Promise<{ name: string }[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(MUSCLES_STORE)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // ========== GIF Cache ==========
  async cacheGif(url: string, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(GIF_CACHE_STORE, 'readwrite')
      const cached: CachedGif = {
        url,
        blob,
        timestamp: Date.now(),
      }
      const request = store.put(cached)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedGif(url: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(GIF_CACHE_STORE)
      const request = store.get(url)
      request.onsuccess = () => {
        const cached = request.result as CachedGif | undefined
        resolve(cached ? cached.blob : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async isGifCached(url: string): Promise<boolean> {
    const gif = await this.getCachedGif(url)
    return gif !== null
  }

  async clearOldGifCache(
    maxAgeMs: number = 30 * 24 * 60 * 60 * 1000,
  ): Promise<void> {
    // Clear GIFs older than 30 days by default
    return new Promise((resolve, reject) => {
      const store = this.getStore(GIF_CACHE_STORE, 'readwrite')
      const index = store.index('timestamp')
      const cutoff = Date.now() - maxAgeMs
      const range = IDBKeyRange.upperBound(cutoff)
      const request = index.openCursor(range)

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ========== Data Loading ==========
  /**
   * Get data URL from environment variable or use default
   * Large datasets are now expected to be hosted externally
   */
  private getDataUrl(filename: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_DATA_BASE_URL || ''
    const envVar = `NEXT_PUBLIC_${filename
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')}_URL`
    const envUrl = process.env[envVar]

    if (envUrl) {
      return envUrl
    }

    if (baseUrl) {
      return `${baseUrl}/${filename}`
    }

    // Fallback to local path (will fail if file doesn't exist - developer must provide external URL)
    return `/data/${filename}`
  }

  async loadDataFromServer(): Promise<void> {
    try {
      // Load exercises
      // NOTE: Large datasets are now expected from external storage
      // Set NEXT_PUBLIC_EXERCISEDB_EXERCISES_JSON_URL or NEXT_PUBLIC_DATA_BASE_URL environment variable
      const exercisesUrl = this.getDataUrl('exercisedb-exercises.json')
      const exercisesRes = await fetch(exercisesUrl)
      if (!exercisesRes.ok) {
        throw new Error(
          `Failed to load exercise data from ${exercisesUrl}. Please configure NEXT_PUBLIC_DATA_BASE_URL or NEXT_PUBLIC_EXERCISEDB_EXERCISES_JSON_URL environment variable.`,
        )
      }
      const exercises = await exercisesRes.json()
      await this.saveExercises(exercises)

      // Load body parts
      const bodyPartsUrl = this.getDataUrl('bodyparts.json')
      const bodyPartsRes = await fetch(bodyPartsUrl)
      if (!bodyPartsRes.ok) {
        throw new Error(
          `Failed to load body parts data from ${bodyPartsUrl}. Please configure NEXT_PUBLIC_DATA_BASE_URL environment variable.`,
        )
      }
      const bodyParts = await bodyPartsRes.json()
      await this.saveBodyParts(bodyParts)

      // Load equipments
      const equipmentsUrl = this.getDataUrl('equipments.json')
      const equipmentsRes = await fetch(equipmentsUrl)
      if (!equipmentsRes.ok) {
        throw new Error(
          `Failed to load equipments data from ${equipmentsUrl}. Please configure NEXT_PUBLIC_DATA_BASE_URL environment variable.`,
        )
      }
      const equipments = await equipmentsRes.json()
      await this.saveEquipments(equipments)

      // Load muscles
      const musclesUrl = this.getDataUrl('muscles.json')
      const musclesRes = await fetch(musclesUrl)
      if (!musclesRes.ok) {
        throw new Error(
          `Failed to load muscles data from ${musclesUrl}. Please configure NEXT_PUBLIC_DATA_BASE_URL environment variable.`,
        )
      }
      const muscles = await musclesRes.json()
      await this.saveMuscles(muscles)

      console.log('✅ All exercise data loaded into IndexedDB')
    } catch (error) {
      console.error('❌ Failed to load data from server:', error)
      throw error
    }
  }

  async isDataLoaded(): Promise<boolean> {
    const exercises = await this.getAllExercises()
    return exercises.length > 0
  }
}

// Singleton instance
let dbInstance: OfflineDB | null = null

export async function getOfflineDB(): Promise<OfflineDB> {
  if (!dbInstance) {
    dbInstance = new OfflineDB()
    await dbInstance.init()

    // Load data if not already loaded
    const isLoaded = await dbInstance.isDataLoaded()
    if (!isLoaded) {
      console.log('📥 Loading exercise data into IndexedDB...')
      await dbInstance.loadDataFromServer()
    }
  }
  return dbInstance
}

export { OfflineDB }
