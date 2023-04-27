interface TokenGenerationOptions {
    privateKey: string,
    kid: string,
    expiresInSeconds?: number,
    notBefore?: number
}

interface Generator {
    generateToken(
        claims: any,
        options: TokenGenerationOptions,
        callback: (error: Error, token: string) => void
    ): void;
    generateAuthorizationHeader(
        claims: any,
        options: TokenGenerationOptions,
        callback: (error: Error, token: string) => void
    ): void;
}

interface Client {
    create(): Generator
}

interface ValidatorConfig {
    publicKeyBaseUrl: string;
    resourceServerAudience: string;
    ignoreMaxLifeTime?: boolean;
}

interface Validator {
    validate(
        jwtToken: string,
        authorizedSubjects: string[],
        callback: (error: Error, claims: any) => void
    ): void;
}

interface Server {
    create(config: ValidatorConfig): Validator
}

interface Middleware {
    create(jwtValidator: Validator, authorizedSubjects: string[], logger?: any):
        (request: any, response: any, next: () => void) => void
}

export var client: Client;
export var server: Server;
export var middleware: Middleware;