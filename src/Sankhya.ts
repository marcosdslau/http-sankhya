import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { SankhyaHelper } from './SankhyaHelper';

export interface SankhyaConfig {
    urlBase: string;
    clientId?: string; // Optional based on typical Sankhya flows, but user asked for it in constructor
    clientSecret?: string;
    token?: string;
}

export interface LoadRecordsOptions {
    rootEntity: string;
    includePresentationFields?: 'S' | 'N';
    offsetPage?: number;
    criteria?: Record<string, any>;
    entity?: Record<string, any>;
    rows?: Record<string, any>;
}

export interface SaveRecordOptions {
    rootEntity: string;
    includePresentationFields?: 'S' | 'N';
    localFields?: Record<string, any>;
    entity?: Record<string, any>;
}

export interface ExecServiceOptions {
    serviceName: string;
    requestBody?: Record<string, any>;
    outputType?: 'json' | 'xml';
}

export class Sankhya {
    private urlBase: string;
    private clientId?: string;
    private clientSecret?: string;
    private token?: string;
    private tokenClient?: string;
    private axiosInstance: AxiosInstance;
    private jsessionid?: string;

    constructor(config: SankhyaConfig) {
        this.urlBase = config.urlBase;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.tokenClient = config.token;

        this.axiosInstance = axios.create({
            baseURL: this.urlBase,
            timeout: 30000, // Default timeout
        });

        // Add interceptor to inject token/session if needed
        this.axiosInstance.interceptors.request.use((req) => {
            if (this.token) {
                req.headers['Authorization'] = `Bearer ${this.token}`;
                req.headers['Content-Type'] = `application/json`;
            }
            // Often Sankhya uses JSESSIONID cookie or header. 
            // If we firmly set token in constructor, mostly used as Bearer or specific header.
            return req;
        });
    }

    public async login(): Promise<any> {
        // Implementation depends on specific Sankhya Auth endpoint (e.g. MobileLoginSP.login)
        // or standard OAuth. 
        // Allowing placeholder or specific implementation if user didn't specify the Auth Payload.
        // Assuming standard service execution for now or a place to fill in.
        if (this.clientId && this.clientSecret && this.tokenClient) {
            // Example Oauth or App interaction
            const response = await this.axiosInstance.post('/authenticate', {
                grant_type: 'client_credentials'
            }, {
                headers: {
                    'X-Token': this.tokenClient,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                auth: {
                    username: this.clientId,
                    password: this.clientSecret
                }
            });
            this.token = response.data.access_token;
        } else {
            throw new Error('Missing authentication credentials');
        }
    }

    public async logout(): Promise<void> {
        throw new Error('Logout not implemented');
    }

    // HTTP Methods
    public async get(path: string, queryParam: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<any> {
        const response = await this.axiosInstance.get(path, {
            params: queryParam,
            headers: headers
        });
        return response.data;
    }

    public async post(path: string, body: Record<string, any> = {}, queryParam: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<any> {
        const response = await this.axiosInstance.post(path, body, {
            params: queryParam,
            headers: headers
        });

        // Tenta identificar o serviceName no corpo da requisição para passar ao helper
        const serviceName = body?.serviceName;
        return SankhyaHelper.processResponse(response.data, { serviceName });
    }

    public async put(path: string, body: Record<string, any> = {}, queryParam: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<any> {
        const response = await this.axiosInstance.put(path, body, {
            params: queryParam,
            headers: headers
        });
        return response.data;
    }

    public async patch(path: string, body: Record<string, any> = {}, queryParam: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<any> {
        const response = await this.axiosInstance.patch(path, body, {
            params: queryParam,
            headers: headers
        });
        return response.data;
    }

    public async delete(path: string, queryParam: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<any> {
        const response = await this.axiosInstance.delete(path, {
            params: queryParam,
            headers: headers
        });
        return response.data;
    }

    // Sankhya Specific Methods

    public async execService(options: ExecServiceOptions, outputType: 'json' | 'xml' = 'json'): Promise<any> {
        // Standard Sankhya Service URL pattern: /mge/service.sbr?serviceName=...&outputType=json
        const { serviceName, requestBody } = options;

        // Construct the wrapper expected by Sankhya JSON API
        const payload = {
            serviceName: serviceName,
            requestBody: requestBody
        };

        // Note: This is an assumption of the 'service.sbr' endpoint based on typical Sankhya integrations.
        // The user might want to adjust the exact endpoint path in the future.
        return this.post('/gateway/v1/mge/service.sbr', payload, {
            serviceName,
            outputType: options.outputType || outputType
        }, {});
    }

    public async loadRecords(
        { rootEntity, includePresentationFields = 'N', offsetPage = 0, criteria = {}, entity = {} }: LoadRecordsOptions,
        outputType: 'json' | 'xml' = 'json'
    ): Promise<any> {
        return this.execService({
            serviceName: 'CRUDServiceProvider.loadRecords',
            requestBody: {
                dataSet: {
                    rootEntity,
                    includePresentationFields,
                    offsetPage,
                    criteria,
                    entity: this.isEmptyObject(entity) ? { fieldset: { list: "*" } } : entity
                }
            },
            outputType
        }, outputType);
    }

    public async loadRecord(
        { rootEntity, includePresentationFields = 'N', criteria = {}, entity = {}, rows = {} }: LoadRecordsOptions,
        outputType: 'json' | 'xml' = 'json'
    ): Promise<any> {
        return this.execService({
            serviceName: 'CRUDServiceProvider.loadRecord',
            requestBody: {
                dataSet: {
                    rootEntity,
                    includePresentationFields,
                    criteria,
                    entity: this.isEmptyObject(entity) ? { fieldset: { list: "*" } } : entity,
                    rows
                }
            },
            outputType
        }, outputType);
    }

    public async saveRecord(
        { rootEntity, includePresentationFields = 'N', localFields = {}, entity = {} }: SaveRecordOptions,
        outputType: 'json' | 'xml' = 'json'
    ): Promise<any> {
        return this.execService({
            serviceName: 'CRUDServiceProvider.saveRecord',
            requestBody: {
                dataSet: {
                    rootEntity,
                    includePresentationFields,
                    dataRow: {
                        localFields: SankhyaHelper.transformLocalFields(localFields)
                    },
                    entity
                }
            },
            outputType
        }, outputType);
    }

    private isEmptyObject(obj: any): boolean {
        return obj != null &&
            obj.constructor === Object &&
            Object.keys(obj).length === 0;
    }

}
