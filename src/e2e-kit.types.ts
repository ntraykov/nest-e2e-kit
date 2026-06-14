type BaseConfiguration = {
  driver: 'mysql'
}

export type ParamsConfiguration = BaseConfiguration & {
  host: string
  username: string
  password: string
  database: string
  port: number
}

export type UriConfiguration = BaseConfiguration & {
  uri: string
}

export type E2EKitConfiguration = ParamsConfiguration | UriConfiguration
