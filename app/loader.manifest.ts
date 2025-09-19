import QwikLocationLoader from './classes/qwik/loaders/qwik_location_loader'

const loaders = {
  QwikLocationLoader,
} as const

// Constructor types:
// export type Loaders = { [K in keyof typeof loaders]: typeof loaders[K] }

// Instance types:
export type Loaders = { [K in keyof typeof loaders]: InstanceType<(typeof loaders)[K]> }
