export class SankhyaHelper {
    /**
     * Converte retorno do Sankhya baseado no tipo de serviço.
     * Utiliza switch case para rotear o tratamento.
     */
    public static processResponse(response: any, options: { serviceName?: string } = {}): any {
        if (!response || !response.responseBody || !response.responseBody.entities) {
            return response;
        }

        switch (options.serviceName) {
            case 'CRUDServiceProvider.loadRecords':
                return this.processLoadRecords(response);

            case 'CRUDServiceProvider.saveRecord':
                return this.processSaveRecord(response);

            case 'CRUDServiceProvider.loadRecord':
                return this.processLoadRecord(response);

            default:
                // Se não for um dos serviços conhecidos de CRUD/Load, retorna original
                return response;
        }
    }

    /**
     * Transforma recursivamente todos os valores primitivos (string/number) de um objeto
     * para o formato Sankhya { "$": valor }, percorrendo objetos e arrays aninhados.
     * Ex: { nota: { cabecalho: { CAMPO: "VALOR" } } } -> { nota: { cabecalho: { CAMPO: { "$": "VALOR" } } } }
     */
    public static transformDeepFields(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // Se for string ou number, transforma para { "$": valor }
        if (typeof obj === 'string' || typeof obj === 'number') {
            return { $: String(obj) };
        }

        // Se for array, aplica recursivamente em cada elemento
        if (Array.isArray(obj)) {
            return obj.map(item => this.transformDeepFields(item));
        }

        // Se já estiver no formato { "$": ... }, mantém como está
        if (typeof obj === 'object' && '$' in obj && Object.keys(obj).length === 1) {
            return obj;
        }

        // Se for objeto, aplica recursivamente em cada propriedade
        if (typeof obj === 'object') {
            const transformed: Record<string, any> = {};
            for (const key of Object.keys(obj)) {
                transformed[key] = this.transformDeepFields(obj[key]);
            }
            return transformed;
        }

        return obj;
    }

    /**
     * Transforma um objeto simples de chave/valor para o formato do Sankhya
     * Ex: { CAMPO: "VALOR" } -> { CAMPO: { "$": "VALOR" } }
     */
    public static transformLocalFields(localFields: Record<string, any>): Record<string, any> {
        const transformed: Record<string, any> = {};

        Object.keys(localFields).forEach(key => {
            const value = localFields[key];

            // Se o valor já estiver no formato { $: ... }, mantém
            if (value && typeof value === 'object' && '$' in value) {
                transformed[key] = value;
            } else {
                transformed[key] = { $: value };
            }
        });

        return transformed;
    }

    // Lógica de transformação extraída para método privado
    private static processSaveRecord(response: any): any {
        if (response.status === '0') {
            return response;
        }

        return this.processLoadRecords(response);
    }

    private static processLoadRecord(response: any): any {
        const { entities } = response.responseBody;

        if (entities.total === '0') {
            return null;
        }

        return this.processLoadRecords(response);
    }

    private static processLoadRecords(response: any): any {
        const { entities } = response.responseBody;
        const metadata = entities.metadata;

        // Se não tiver metadados, pode ser um loadRecord de um único registro sem fields info
        if (!metadata || !metadata.fields || !metadata.fields.field) {
            const entityNode = entities.entity;
            if (entityNode && !Array.isArray(entityNode)) {
                // Caso específico do loadRecord que retorna entity direto sem metadata
                const record: Record<string, any> = {};
                Object.keys(entityNode).forEach(key => {
                    const value = entityNode[key];
                    if (value && typeof value === "object" && "$" in value) {
                        record[key] = value.$;
                    } else {
                        // Se for objeto vazio ou não tiver $, assume null ou mantém o valor original se não for objeto vazio
                        // No exemplo dado: "GRUPOICMS": {} -> null
                        if (Object.keys(value).length === 0) {
                            record[key] = null;
                        } else {
                            record[key] = value; // Fallback, maintain original if not empty and no $
                        }
                    }
                });
                return record;
            }
            return response;
        }

        const fields = metadata.fields.field;
        const entityNode = entities.entity;

        if (!entityNode) {
            if (entities.total === "0") return [];
            return response;
        }

        const mapOne = (ent: any) => {
            const record: Record<string, any> = {};
            const fieldsArray = Array.isArray(fields) ? fields : [fields];

            fieldsArray.forEach((f: any, idx: number) => {
                const key = f?.name ?? `field_${idx}`;
                const raw = ent[`f${idx}`];

                if (raw && typeof raw === "object" && "$" in raw) {
                    record[key] = raw.$;
                } else {
                    record[key] = null;
                }
            });
            return record;
        };

        if (Array.isArray(entityNode)) {
            return entityNode.map(mapOne);
        }

        return mapOne(entityNode);
    }
}
