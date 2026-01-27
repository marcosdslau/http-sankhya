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
            case 'CRUDServiceProvider.loadRecord':
            case 'CRUDServiceProvider.saveRecord':
                return this.processLoadRecords(response);

            default:
                // Se não for um dos serviços conhecidos de CRUD/Load, retorna original
                return response;
        }
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
